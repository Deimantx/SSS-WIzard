import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { migrateSave } from '../../../persistence/migrations'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { TRAIT_DEFINITIONS } from '../../content/traits'
import type { CombatEvent, GameState, ItemDefinition, ItemId, TraitDefinition, TraitId } from '../../types'
import { getCombatMetricSourceKey } from '../../telemetry/combat/combatTelemetryAggregator'
import { clearCurrentEnemyAction, forceResolveEnemyAction } from './actionRuntime'
import { finishEnemy, spawnEnemy } from './combatRuntime'
import { executeCombatEffects } from './effectResolver'
import { isEnemySourceOwnerActive } from './combatProvenance'
import { tickStatuses } from './statusRuntime'

const makeState = (enemyId: GameState['combat']['enemyId']) => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'howling-den'
  if (enemyId) spawnEnemy(state, enemyId)
  return state
}

describe('Enemy source ownership', () => {
  it('keeps a lingering Enemy DoT attributed and isolated across downtime and a new encounter', () => {
    const state = makeState('razorclaw-lynx')
    const oldInstanceKey = state.combat.enemyInstanceKey
    const applicationEvents: CombatEvent[] = []
    clearCurrentEnemyAction(state)
    expect(forceResolveEnemyAction(state, 'rending-claws', executeCombatEffects, 0, { push: (event) => applicationEvents.push(event) })).toBe(true)
    const oldStatus = state.combat.playerStatuses.find((status) => status.statusId === 'bleeding')
    expect(oldInstanceKey).toBe('enemy:1')
    expect(oldStatus).toMatchObject({
      instanceKey: 'enemy:action:rending-claws:instance:enemy:1',
      source: { actor: 'enemy', sourceMonsterId: 'razorclaw-lynx', sourceInstanceKey: 'enemy:1' },
    })
    if (!oldStatus) throw new Error('Expected Rending Claws to apply Bleeding')

    finishEnemy(state)
    expect(state.combat.enemyId).toBeNull()
    expect(state.combat.enemyInstanceKey).toBeNull()
    expect(isEnemySourceOwnerActive(state, oldStatus.source)).toBe(false)

    const downtimeEvents: CombatEvent[] = []
    const downtimeHealth = state.player.health
    tickStatuses(state, 2_000, executeCombatEffects, { push: (event) => downtimeEvents.push(event) })
    const downtimeTick = downtimeEvents.find((event) => event.category === 'damage' && event.statusId === 'bleeding')
    expect(state.player.health).toBeCloseTo(downtimeHealth - 3.9875, 6)
    expect(downtimeTick).toMatchObject({
      source: { kind: 'enemy', monsterId: 'razorclaw-lynx' },
      sourceMonsterId: 'razorclaw-lynx',
      sourceInstanceKey: 'enemy:1',
      originMonsterId: 'razorclaw-lynx',
      originSourceKind: 'action',
      originSourceId: 'rending-claws',
    })
    expect(getCombatMetricSourceKey(downtimeTick!)).toBe('status:bleeding:origin:enemy:razorclaw-lynx:action:rending-claws')

    const auditTrait: TraitDefinition = {
      id: 'source-ownership-audit' as TraitId,
      name: 'Source Ownership Audit',
      description: 'Test-only source ownership modifier and trigger.',
      modifiers: [{ key: 'damage-dealt-percent', value: 1 }],
      rules: [{ id: 'source-ownership-audit-rule', event: 'on-damage-dealt', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 7 } }] }],
    }
    const registry = TRAIT_DEFINITIONS as Record<string, TraitDefinition>
    const monster = MONSTERS['razorclaw-lynx']
    const originalTrait = registry[auditTrait.id]
    registry[auditTrait.id] = auditTrait
    monster.traitIds.push(auditTrait.id as TraitId)
    try {
      spawnEnemy(state, 'razorclaw-lynx')
      expect(state.combat.enemyInstanceKey).toBe('enemy:2')
      expect(isEnemySourceOwnerActive(state, oldStatus.source)).toBe(false)
      state.combat.enemyBarrier = 0
      const nextEvents: CombatEvent[] = []
      const nextHealth = state.player.health
      tickStatuses(state, 2_000, executeCombatEffects, { push: (event) => nextEvents.push(event) })
      const nextTick = nextEvents.find((event) => event.category === 'damage' && event.statusInstanceKey === oldStatus.instanceKey)
      expect(state.player.health).toBeCloseTo(nextHealth - 3.9875, 6)
      expect(state.combat.enemyBarrier).toBe(0)
      expect(nextTick).toMatchObject({ source: { kind: 'enemy', monsterId: 'razorclaw-lynx' }, sourceInstanceKey: 'enemy:1' })

      clearCurrentEnemyAction(state)
      expect(forceResolveEnemyAction(state, 'rending-claws', executeCombatEffects)).toBe(true)
      const bleedingStatuses = state.combat.playerStatuses.filter((status) => status.statusId === 'bleeding')
      expect(bleedingStatuses).toHaveLength(2)
      expect(bleedingStatuses.map((status) => status.source.sourceInstanceKey)).toEqual(['enemy:1', 'enemy:2'])
      expect(applicationEvents.some((event) => event.sourceInstanceKey === 'enemy:1')).toBe(true)
    } finally {
      monster.traitIds.pop()
      if (originalTrait) registry[auditTrait.id] = originalTrait
      else delete registry[auditTrait.id]
    }
  })

  it('migrates V21 active ownership and leaves legacy downtime ownership detached', () => {
    const initial = createInitialState()
    const active = migrateSave({ ...initial, saveVersion: 21, combat: { ...initial.combat, active: true, enemyId: 'razorclaw-lynx', playerStatuses: [{ statusId: 'bleeding', source: { actor: 'enemy', kind: 'action', sourceId: 'rending-claws' }, remainingMs: 4_000 }] } } as any)
    expect(active.combat.enemyInstanceSerial).toBe(1)
    expect(active.combat.enemyInstanceKey).toBe('enemy:1')
    expect(active.combat.playerStatuses[0]).toMatchObject({
      instanceKey: 'enemy:action:rending-claws:instance:enemy:1',
      source: { sourceMonsterId: 'razorclaw-lynx', sourceInstanceKey: 'enemy:1', originMonsterId: 'razorclaw-lynx', originInstanceKey: 'enemy:1' },
    })

    const detached = migrateSave({ ...initial, saveVersion: 21, combat: { ...initial.combat, active: true, enemyId: null, playerStatuses: [{ statusId: 'bleeding', source: { actor: 'enemy', kind: 'action', sourceId: 'rending-claws' }, remainingMs: 4_000 }] } } as any)
    expect(detached.combat.enemyInstanceSerial).toBe(0)
    expect(detached.combat.enemyInstanceKey).toBeNull()
    expect(detached.combat.playerStatuses[0].source).toMatchObject({ actor: 'enemy', sourceId: 'rending-claws' })
    expect(detached.combat.playerStatuses[0].source.sourceMonsterId).toBeUndefined()
    expect(detached.combat.playerStatuses[0].source.sourceInstanceKey).toBeUndefined()
  })

  it('lets a living Player react to a detached Enemy DoT while dead Enemy rules stay inactive', () => {
    const itemId = 'detached-reactive-ring' as ItemId
    const item: ItemDefinition = {
      id: itemId,
      name: 'Detached Reactive Ring',
      description: 'Test-only equipment.',
      icon: '◆',
      color: '#fff',
      kind: 'equipment',
      category: 'equipment',
      inventoryCategory: 'equipment',
      source: 'Tests',
      sellValue: 1,
      canDestroy: true,
      equipmentSlot: 'ring',
      combat: { rules: [{ id: 'react-to-detached-dot', event: 'on-damage-taken', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 100 } }] }] },
    }
    ITEMS[itemId] = item
    try {
      const state = makeState('razorclaw-lynx')
      clearCurrentEnemyAction(state)
      expect(forceResolveEnemyAction(state, 'rending-claws', executeCombatEffects)).toBe(true)
      const oldStatus = state.combat.playerStatuses.find((status) => status.statusId === 'bleeding')
      if (!oldStatus) throw new Error('Expected Rending Claws to apply Bleeding')
      finishEnemy(state)
      state.equipment.ring1 = itemId
      const beforeBarrier = state.combat.playerBarrier
      tickStatuses(state, 2_000, executeCombatEffects)
      expect(state.player.health).toBeLessThan(100)
      expect(state.combat.playerBarrier).toBeGreaterThan(beforeBarrier)
    } finally {
      delete ITEMS[itemId]
    }
  })
})

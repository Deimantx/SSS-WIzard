import { describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../../../store/initialState'
import { migrateSave } from '../../../persistence/migrations'
import { SPELLS } from '../../content/spells/spells'
import { getCombatStatusGroups } from '../../presentation/combat/combatStatusPresentation'
import { presentCombatLogEntry } from '../../presentation/combat/combatLogPresentation'
import { executeCombatEffects } from './effectResolver'
import { applyStatus, getStatusApplicationSourceKey, tickStatuses } from './statusRuntime'
import type { CombatEffect, CombatEvent, CombatSource } from './combatTypes'
import { removeStatus } from './statusRuntime'
import { spawnEnemy } from './combatRuntime'

const source = (sourceId: string): CombatSource => ({ actor: 'player', kind: 'spell', sourceId, school: 'fire', tags: ['spell', 'magic', 'fire'] })
const burnEffect = (spellId: 'ignite' | 'fireball') => SPELLS[spellId].effects.find((effect): effect is Extract<CombatEffect, { type: 'apply-status' }> => effect.type === 'apply-status')!
const stateWithEnemy = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  spawnEnemy(state, 'forest-wisp')
  state.combat.enemyMaxHp = 10_000
  state.combat.enemyHp = 10_000
  return state
}

describe('multi-source periodic statuses', () => {
  it('keeps Ignite and Fireball Burning instances independent while grouping their UI', () => {
    const state = stateWithEnemy()
    executeCombatEffects(state, [burnEffect('ignite')], source('ignite'))
    executeCombatEffects(state, [burnEffect('fireball')], source('fireball'))

    expect(state.combat.enemyStatuses).toHaveLength(2)
    expect(state.combat.enemyStatuses.map((status) => status.instanceKey)).toEqual(['player:spell:ignite', 'player:spell:fireball'])
    expect(getCombatStatusGroups(state.combat.enemyStatuses)).toMatchObject([{ statusId: 'burning', displayRemainingMs: 10_000, instances: expect.any(Array), sourceBreakdown: [{ sourceLabel: 'Ignite' }, { sourceLabel: 'Fireball' }], totalCurrentRate: expect.closeTo(18.6666667, 6) }])

    const events: CombatEvent[] = []
    tickStatuses(state, 10_000, executeCombatEffects, { push: (event) => events.push(event) })
    expect(state.combat.enemyHp).toBeCloseTo(9_880, 8)
    expect(events.filter((event) => event.sourceKind === 'status' && event.statusId === 'burning' && event.category === 'damage')).toHaveLength(16)
    expect(events.filter((event) => event.originSourceId === 'ignite' && event.statusInstanceKey === 'player:spell:ignite')).not.toHaveLength(0)
    expect(events.filter((event) => event.originSourceId === 'fireball' && event.statusInstanceKey === 'player:spell:fireball')).not.toHaveLength(0)
  })

  it('refreshes the same source without resetting its next tick or losing its payload snapshot', () => {
    const state = stateWithEnemy()
    const firstPayload: CombatEffect[] = [{ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 4 } }], tags: ['dot', 'fire'] }]
    const secondPayload: CombatEffect[] = [{ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 2 } }], tags: ['dot', 'fire'] }]
    const first = applyStatus(state, 'enemy', 'burning', source('fireball'), { durationMs: 6_000, periodicEffects: firstPayload })
    tickStatuses(state, 800, executeCombatEffects)
    const refreshed = applyStatus(state, 'enemy', 'burning', source('fireball'), { durationMs: 10_000, periodicEffects: secondPayload })

    expect(refreshed).toBe(first)
    expect(state.combat.enemyStatuses).toHaveLength(1)
    expect(refreshed).toMatchObject({ instanceKey: 'player:spell:fireball', remainingMs: 10_000, nextTickMs: 200, periodicEffects: secondPayload })
  })

  it('allows the exact final tick and only emits grouped expiry when the last source ends', () => {
    const state = stateWithEnemy()
    const events: CombatEvent[] = []
    applyStatus(state, 'enemy', 'burning', source('ignite'), { durationMs: 6_000, periodicEffects: [{ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 1 } }] }] })
    tickStatuses(state, 6_000, executeCombatEffects, { push: (event) => events.push(event) })
    expect(events.filter((event) => event.category === 'damage')).toHaveLength(6)
    expect(state.combat.enemyStatuses).toHaveLength(0)

    applyStatus(state, 'enemy', 'burning', source('ignite'), { durationMs: 1_000 })
    applyStatus(state, 'enemy', 'burning', source('fireball'), { durationMs: 5_000 })
    events.length = 0
    tickStatuses(state, 1_000, executeCombatEffects, { push: (event) => events.push(event) })
    expect(state.combat.enemyStatuses).toHaveLength(1)
    expect(events.filter((event) => event.statusPhase === 'expire')).toHaveLength(0)
    tickStatuses(state, 4_000, executeCombatEffects, { push: (event) => events.push(event) })
    expect(state.combat.enemyStatuses).toHaveLength(0)
    expect(events.filter((event) => event.statusPhase === 'expire')).toHaveLength(1)
  })

  it('removes a whole visible status group with one removal event', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'burning', source('ignite'))
    applyStatus(state, 'enemy', 'burning', source('fireball'))
    const events: CombatEvent[] = []
    expect(removeStatus(state, 'enemy', 'burning', { uiEvents: { push: (event) => events.push(event) } })).toBe(true)
    expect(state.combat.enemyStatuses).toHaveLength(0)
    expect(events.filter((event) => event.statusPhase === 'remove')).toHaveLength(1)
  })

  it('presents periodic ticks with their authored status origin', () => {
    const presentation = presentCombatLogEntry({ id: 1, sequence: 1, timestampMs: 1_000, source: { kind: 'player' }, sourceKind: 'status', target: 'enemy', targetMonsterId: 'forest-wisp', category: 'damage', sourceId: 'burning', statusId: 'burning', originSourceId: 'ignite', originSourceKind: 'spell', statusInstanceKey: 'player:spell:ignite', damageType: 'fire', amount: 16.6666667, healthDamage: 16.6666667 })
    expect(presentation.actionLabel).toBe('Burning (Ignite)')
    expect(presentation.message).toContain('Burning (Ignite)')
  })

  it('adds deterministic instance keys and V20 metadata when migrating V18 active statuses', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 18, combat: { ...initial.combat, enemyStatuses: [
      { statusId: 'burning', source: source('ignite'), remainingMs: 2_000, stacks: 1, nextTickMs: 500 },
      { statusId: 'fortified', source: source('fortify'), remainingMs: 2_000, stacks: 1 },
    ] } } as any)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.combat.enemyStatuses).toMatchObject([
      { statusId: 'burning', instanceKey: getStatusApplicationSourceKey(source('ignite')), remainingMs: 2_000, nextTickMs: 500 },
      { statusId: 'fortified', instanceKey: 'single:fortified' },
    ])
  })

  it('drops malformed persisted periodic overrides without breaking the save', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 19, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyStatuses: [
      { statusId: 'burning', source: source('unsafe'), remainingMs: 2_000, stacks: 1, periodicEffects: [{ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: Number.NaN } }] }, { type: 'not-a-combat-effect' }] },
    ] } } as any)
    expect(migrated.combat.enemyStatuses).toHaveLength(1)
    expect(migrated.combat.enemyStatuses[0].periodicEffects).toBeUndefined()
    expect(migrated.combat.enemyStatuses[0].initialDurationMs).toBe(5_000)
  })

  it('drops persisted recursive periodic status payloads atomically', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 23, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyStatuses: [
      { statusId: 'burning', source: source('recursive'), remainingMs: 2_000, stacks: 1, periodicEffects: [{ type: 'apply-status', target: 'self', statusId: 'regeneration' }] },
    ] } } as any)
    expect(migrated.combat.enemyStatuses).toHaveLength(1)
    expect(migrated.combat.enemyStatuses[0].periodicEffects).toBeUndefined()
  })

  it('rejects a mixed valid and invalid periodic override atomically', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 21, combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', enemyStatuses: [
      { statusId: 'burning', source: source('mixed'), remainingMs: 2_000, stacks: 1, periodicEffects: [
        { type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 2 } }] },
        { type: 'not-a-combat-effect' },
      ] },
    ] } } as any)
    expect(migrated.combat.enemyStatuses[0].periodicEffects).toBeUndefined()
  })

  it('preserves origin tags and school on periodic tick events', () => {
    const state = stateWithEnemy()
    const events: CombatEvent[] = []
    applyStatus(state, 'enemy', 'burning', source('ignite'))
    tickStatuses(state, 1_000, executeCombatEffects, { push: (event) => events.push(event) })
    expect(events.find((event) => event.sourceKind === 'status' && event.category === 'damage')).toMatchObject({ originSourceKind: 'spell', originSourceId: 'ignite', originTags: ['spell', 'magic', 'fire'], originSchool: 'fire' })
  })
})

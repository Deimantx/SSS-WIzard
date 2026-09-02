import { afterEach, describe, expect, it } from 'vitest'
import { ITEMS, validateItemDefinitions } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { createInitialState } from '../../../store/initialState'
import type { GameState, ItemDefinition, ItemId } from '../../types'
import { createCombatResolutionContext, type CombatEffect, type CombatEvent } from './combatTypes'
import { executeCombatEffects } from './effectResolver'
import { getCombatModifiers } from './modifiers'
import { applyStatus, tickStatuses } from './statusRuntime'
import { getActionRate, getCurrentEnemyActionRate, getPlayerBasicAttackRate, startEnemyAction, clearCurrentEnemyAction } from './actionRuntime'
import { finishEnemy, spawnEnemy } from './combatRuntime'
import { runCombatTriggers, getRuleRuntimeKey, tickRuleCooldowns } from './triggerRuntime'
import { advanceGameState } from '../simulation/advanceGameState'
import { validateStatusDefinitions, STATUS_DEFINITIONS } from '../../content/statuses'
import { createCombatValidationContext, isPersistedCombatEffect, validateCombatEffect, validateCombatProvider } from './combatEffectValidation'
import { getCombatMetricSourceKey } from '../../telemetry/combat/combatTelemetryAggregator'
import { combatTelemetrySink, useCombatTelemetryStore } from '../../telemetry/combat/combatTelemetryStore'
import { nextCombatRandom } from './combatRng'

const source = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'hardening-test', school: 'water' as const, tags: ['spell' as const, 'magic' as const, 'water' as const] }
const stateWithEnemy = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.player.health = 10_000
  state.player.maxHealth = 10_000
  spawnEnemy(state, 'forest-wisp')
  state.combat.enemyHp = 100_000
  state.combat.enemyMaxHp = 100_000
  return state
}

describe('combat foundation hardening', () => {
  it('uses true bounded action rates', () => {
    const state = stateWithEnemy()
    expect(getActionRate(state, 'enemy', 'basic-attack')).toBe(1)
    applyStatus(state, 'enemy', 'chilled', source, { modifierOverrides: { 'basic-attack-speed-percent': -0.2, 'action-speed-percent': -0.2 } })
    expect(getActionRate(state, 'enemy', 'basic-attack')).toBeCloseTo(0.8)
    expect(getActionRate(state, 'enemy', 'action')).toBeCloseTo(0.8)
    applyStatus(state, 'player', 'quickening', { actor: 'player', kind: 'system', sourceId: 'test' }, { modifierOverrides: { 'basic-attack-speed-percent': 0.25 } })
    expect(getPlayerBasicAttackRate(state)).toBeCloseTo(1.25)
    applyStatus(state, 'enemy', 'stunned', source)
    expect(getCurrentEnemyActionRate(state)).toBe(0)
  })

  it('keeps a stronger Chilled potency and replaces it only with a stronger application', () => {
    const state = stateWithEnemy()
    const first = applyStatus(state, 'enemy', 'chilled', source, { modifierOverrides: { 'basic-attack-speed-percent': -0.2, 'action-speed-percent': -0.2 }, durationMs: 4_000 })
    const weaker = applyStatus(state, 'enemy', 'chilled', { ...source, sourceId: 'weaker' }, { modifierOverrides: { 'basic-attack-speed-percent': -0.1, 'action-speed-percent': -0.1 }, durationMs: 8_000 })
    expect(weaker).toBe(first)
    expect(first?.modifierOverrides?.['action-speed-percent']).toBe(-0.2)
    expect(first?.remainingMs).toBe(4_000)
    const stronger = applyStatus(state, 'enemy', 'chilled', { ...source, sourceId: 'stronger' }, { modifierOverrides: { 'basic-attack-speed-percent': -0.3, 'action-speed-percent': -0.3 }, durationMs: 6_000 })
    expect(stronger).toBe(first)
    expect(first?.modifierOverrides?.['action-speed-percent']).toBe(-0.3)
    expect(first?.remainingMs).toBe(6_000)
  })

  it('refreshes equal potency without downgrading the active modifier', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'chilled', source, { modifierOverrides: { 'basic-attack-speed-percent': -0.2, 'action-speed-percent': -0.2 }, durationMs: 4_000 })
    advanceGameState(state, 500, { mode: 'live' })
    applyStatus(state, 'enemy', 'chilled', { ...source, sourceId: 'equal' }, { modifierOverrides: { 'basic-attack-speed-percent': -0.2, 'action-speed-percent': -0.2 }, durationMs: 8_000 })
    expect(state.combat.enemyStatuses[0].modifierOverrides?.['action-speed-percent']).toBe(-0.2)
    expect(state.combat.enemyStatuses[0].remainingMs).toBe(8_000)
  })

  it('slows a committed Enemy Basic immediately without jumping its progress', () => {
    const state = stateWithEnemy()
    const base = state.combat.enemyActionDurationMs
    advanceGameState(state, base / 2, { mode: 'live' })
    const partialWork = state.combat.enemyActionTimerMs
    applyStatus(state, 'enemy', 'chilled', source, { modifierOverrides: { 'basic-attack-speed-percent': -0.2, 'action-speed-percent': -0.2 }, durationMs: 5_000 })
    expect(state.combat.enemyActionTimerMs).toBeCloseTo(partialWork)
    advanceGameState(state, 1_000, { mode: 'live' })
    expect(state.combat.enemyActionTimerMs).toBeCloseTo(partialWork - 800)
    expect(state.combat.enemyActionDurationMs).toBe(base)
  })

  it('slows a committed named Enemy Skill and returns to normal after expiry', () => {
    const state = stateWithEnemy()
    clearCurrentEnemyAction(state)
    state.combat.enemyNextActionIndex = 2
    expect(startEnemyAction(state, 'arc-spark', executeCombatEffects)).toBe(true)
    advanceGameState(state, 1_000, { mode: 'live' })
    const partialWork = state.combat.enemyActionTimerMs
    applyStatus(state, 'enemy', 'chilled', source, { durationMs: 500 })
    advanceGameState(state, 500, { mode: 'live' })
    expect(state.combat.enemyActionTimerMs).toBeCloseTo(partialWork - 400)
    advanceGameState(state, 500, { mode: 'live' })
    expect(state.combat.enemyActionTimerMs).toBeCloseTo(partialWork - 900)
  })

  it('accelerates an in-progress Player Basic with Quickening', () => {
    const state = stateWithEnemy()
    const base = state.combat.playerAttackDurationMs
    advanceGameState(state, base / 2, { mode: 'live' })
    const partialWork = state.combat.playerAttackTimerMs
    applyStatus(state, 'player', 'quickening', { actor: 'player', kind: 'spell', sourceId: 'quickening', tags: ['spell', 'buff'] })
    expect(state.combat.playerAttackTimerMs).toBeCloseTo(partialWork)
    advanceGameState(state, 400, { mode: 'live' })
    expect(state.combat.playerAttackTimerMs).toBeCloseTo(partialWork - 500)
  })

  it('pauses and resumes Player Basic and Enemy Skill without resetting progress', () => {
    const player = stateWithEnemy()
    advanceGameState(player, 500, { mode: 'live' })
    const playerPartial = player.combat.playerAttackTimerMs
    applyStatus(player, 'player', 'stunned', source, { durationMs: 500 })
    advanceGameState(player, 500, { mode: 'live' })
    expect(player.combat.playerAttackTimerMs).toBeCloseTo(playerPartial)
    advanceGameState(player, 500, { mode: 'live' })
    expect(player.combat.playerAttackTimerMs).toBeCloseTo(playerPartial - 500)

    const enemy = stateWithEnemy()
    clearCurrentEnemyAction(enemy)
    enemy.combat.enemyNextActionIndex = 2
    expect(startEnemyAction(enemy, 'arc-spark', executeCombatEffects)).toBe(true)
    advanceGameState(enemy, 500, { mode: 'live' })
    const enemyPartial = enemy.combat.enemyActionTimerMs
    applyStatus(enemy, 'enemy', 'stunned', source, { durationMs: 500 })
    advanceGameState(enemy, 500, { mode: 'live' })
    expect(enemy.combat.enemyActionTimerMs).toBeCloseTo(enemyPartial)
    advanceGameState(enemy, 500, { mode: 'live' })
    expect(enemy.combat.enemyActionTimerMs).toBeCloseTo(enemyPartial - 500)
  })

  it('rejects per-source shared triggers', () => {
    const original = STATUS_DEFINITIONS.burning.triggers
    STATUS_DEFINITIONS.burning.triggers = [{ id: 'unsafe', event: 'on-heal', effects: [] }]
    try {
      expect(validateStatusDefinitions().some((error) => error.includes('Per-source statuses may not define shared status triggers'))).toBe(true)
    } finally {
      STATUS_DEFINITIONS.burning.triggers = original
    }
  })

  it('validates status modifier overrides against the target status definition', () => {
    const validationContext = createCombatValidationContext(STATUS_DEFINITIONS)
    expect(isPersistedCombatEffect({ type: 'apply-status', target: 'opponent', statusId: 'chilled', modifierOverrides: { 'damage-dealt-percent': -0.2 } }, validationContext)).toBe(false)
    expect(isPersistedCombatEffect({ type: 'apply-status', target: 'opponent', statusId: 'chilled', modifierOverrides: { 'basic-attack-speed-percent': -0.2, 'action-speed-percent': -0.2 } }, validationContext)).toBe(true)
  })
})

describe('equipment combat providers', () => {
  const testItemId = 'hardening-test-ring' as ItemId
  const secondItemId = 'hardening-test-ring-two' as ItemId
  const testItem: ItemDefinition = {
    id: testItemId,
    name: 'Hardening Test Ring',
    description: 'Test provider',
    icon: '◌',
    color: '#fff',
    kind: 'equipment',
    category: 'equipment',
    inventoryCategory: 'equipment',
    source: 'Test',
    sellValue: 1,
    canDestroy: true,
    equipmentSlot: 'ring',
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.2, sourceKinds: ['spell'] }] },
  }

  afterEach(() => { delete ITEMS[testItemId]; delete ITEMS[secondItemId] })

  it('counts only equipped combat modifiers, including both ring positions', () => {
    ITEMS[testItemId] = testItem
    const state = stateWithEnemy()
    const spell = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'test-spell', tags: ['spell' as const] }
    expect(getCombatModifiers(state, 'player', 'damage-dealt-percent', { source: spell })).toBe(0)
    state.equipment.ring1 = testItemId
    expect(getCombatModifiers(state, 'player', 'damage-dealt-percent', { source: spell })).toBeCloseTo(0.2)
    state.equipment.ring2 = testItemId
    expect(getCombatModifiers(state, 'player', 'damage-dealt-percent', { source: spell })).toBeCloseTo(0.4)
  })

  it('runs equipment rules through the universal trigger runtime with collision-safe keys', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'combat-start-buff', event: 'on-combat-start', oncePerEncounter: true, effects: [{ type: 'apply-status', target: 'self', statusId: 'quickening' }] }] } }
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.equipment.ring1 = testItemId
    state.equipment.ring2 = testItemId
    spawnEnemy(state, 'forest-wisp')
    const ring1Key = getRuleRuntimeKey('player', 'equipment', testItemId, 'combat-start-buff', 'ring1')
    const ring2Key = getRuleRuntimeKey('player', 'equipment', testItemId, 'combat-start-buff', 'ring2')
    expect(ring1Key).not.toBe(ring2Key)
    expect(state.combat.triggeredRuleIds).toEqual(expect.arrayContaining([ring1Key, ring2Key]))
    expect(state.combat.playerStatuses).toHaveLength(1)
    expect(state.combat.playerStatuses[0].source).toMatchObject({ kind: 'equipment', sourceId: testItemId })
  })

  it('keeps duplicate equipment status sources distinct through periodic ticks', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'apply-burning', event: 'on-combat-start', oncePerEncounter: true, effects: [{ type: 'apply-status', target: 'opponent', statusId: 'burning' }] }] } }
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.equipment.ring1 = testItemId
    state.equipment.ring2 = testItemId
    const events: Array<{ sourceKind?: string; statusInstanceKey?: string; providerInstanceKey?: string }> = []
    spawnEnemy(state, 'forest-wisp', { push: (event) => events.push(event) })
    state.combat.enemyMaxHp = 1_000
    state.combat.enemyHp = 1_000
    const statuses = state.combat.enemyStatuses.filter((status) => status.statusId === 'burning')
    expect(statuses).toHaveLength(2)
    expect(statuses.map((status) => status.source)).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: testItemId, providerInstanceKey: 'ring1' }),
      expect.objectContaining({ sourceId: testItemId, providerInstanceKey: 'ring2' }),
    ]))
    expect(statuses[0].instanceKey).not.toBe(statuses[1].instanceKey)

    tickStatuses(state, 1_000, executeCombatEffects, { push: (event) => events.push(event) })
    const ticks = events.filter((event) => event.sourceKind === 'status' && event.statusInstanceKey)
    expect(ticks).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerInstanceKey: 'ring1' }),
      expect.objectContaining({ providerInstanceKey: 'ring2' }),
    ]))
  })

  it('uses the real weapon Item ID when an authored weapon has attack tags', () => {
    const weaponId = 'hardening-test-weapon' as ItemId
    ITEMS[weaponId] = { ...testItem, id: weaponId, name: 'Hardening Test Weapon', equipmentSlot: 'weapon', weaponHands: 1, attackTags: ['melee'], damageType: 'fire' }
    try {
      const state = stateWithEnemy()
      state.equipment.weapon = weaponId
      state.combat.playerAttackTimerMs = 0
      const events: CombatEvent[] = []
      advanceGameState(state, 1, { mode: 'live', uiEvents: { push: (event) => events.push(event) } })
      const attack = events.find((event) => event.source.kind === 'player' && event.sourceKind === 'weapon' && event.category === 'basic-attack')
      expect(attack).toMatchObject({ sourceKind: 'weapon', sourceId: weaponId, itemId: weaponId })
      expect(getCombatMetricSourceKey(attack!)).toBe('player:basic')
    } finally {
      delete ITEMS[weaponId]
    }
  })

  it('preserves player rule cooldowns through enemy death and downtime while clearing enemy cooldowns', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'cooldown-start', event: 'on-combat-start', cooldownMs: 12_000, effects: [] }] } }
    const state = stateWithEnemy()
    state.equipment.ring1 = testItemId
    const events: Array<{ sourceKind?: string; providerInstanceKey?: string }> = []
    state.combat.triggeredRuleIds = []
    state.combat.ruleCooldowns = {}
    spawnEnemy(state, 'forest-wisp', { push: (event) => events.push(event) })
    const playerKey = getRuleRuntimeKey('player', 'equipment', testItemId, 'cooldown-start', 'ring1')
    state.combat.ruleCooldowns['enemy:trait:temporary:rule'] = 4_000
    expect(state.combat.ruleCooldowns[playerKey]).toBe(12_000)
    state.combat.enemyHp = 0
    finishEnemy(state, undefined, undefined, { push: (event) => events.push(event) })
    expect(state.combat.ruleCooldowns[playerKey]).toBe(12_000)
    expect(state.combat.ruleCooldowns['enemy:trait:temporary:rule']).toBeUndefined()
    for (let elapsed = 0; elapsed < 5_000; elapsed += 1_000) advanceGameState(state, 1_000, { mode: 'banked' })
    expect(state.combat.enemyId).not.toBeNull()
    expect(state.combat.ruleCooldowns[playerKey]).toBe(7_000)
  })

  it('respects equipment rule cooldowns', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'cooldown-rule', event: 'on-combat-start', cooldownMs: 1_000, effects: [{ type: 'apply-status', target: 'self', statusId: 'quickening' }] }] } }
    const state = stateWithEnemy()
    state.equipment.ring1 = testItemId
    state.combat.triggeredRuleIds = []
    state.combat.ruleCooldowns = {}
    const events: unknown[] = []
    const context = { source: { actor: 'player' as const, kind: 'system' as const, sourceId: 'test' } }
    runCombatTriggers(state, 'player', 'on-combat-start', context, executeCombatEffects, 0, [], { push: (event) => events.push(event) })
    runCombatTriggers(state, 'player', 'on-combat-start', context, executeCombatEffects, 0, [], { push: (event) => events.push(event) })
    const key = getRuleRuntimeKey('player', 'equipment', testItemId, 'cooldown-rule', 'ring1')
    expect(state.combat.ruleCooldowns[key]).toBe(1_000)
    expect(events.filter((event) => (event as { sourceKind?: string; category?: string }).sourceKind === 'equipment' && (event as { category?: string }).category === 'system')).toHaveLength(1)
    tickRuleCooldowns(state, 1_000)
    runCombatTriggers(state, 'player', 'on-combat-start', context, executeCombatEffects, 0, [], { push: (event) => events.push(event) })
    expect(events.filter((event) => (event as { sourceKind?: string; category?: string }).sourceKind === 'equipment' && (event as { category?: string }).category === 'system')).toHaveLength(2)
  })

  it('blocks self-procs within one cascade and resets for the next root Hit', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'self-proc', event: 'on-damage-dealt', effects: [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 2 } }] }] }] } }
    const state = stateWithEnemy()
    state.equipment.ring1 = testItemId
    const events: CombatEvent[] = []
    const sink = { push: (event: CombatEvent) => events.push(event) }
    const root: CombatEffect = { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 1 } }] }
    executeCombatEffects(state, [root], { actor: 'player', kind: 'system', sourceId: 'root' }, undefined, sink)
    expect(events.filter((event) => event.category === 'damage')).toHaveLength(2)
    executeCombatEffects(state, [root], { actor: 'player', kind: 'system', sourceId: 'root' }, undefined, sink)
    expect(events.filter((event) => event.category === 'damage')).toHaveLength(4)
  })

  it('bounds a mutual equipment proc chain while preserving distinct ring providers', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'proc-a', event: 'on-damage-dealt', effects: [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 1 } }] }] }] } }
    ITEMS[secondItemId] = { ...testItem, id: secondItemId, name: 'Hardening Test Ring Two', combat: { rules: [{ id: 'proc-b', event: 'on-damage-dealt', effects: [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'air', magnitude: { type: 'flat', value: 1 } }] }] }] } }
    const state = stateWithEnemy()
    state.equipment.ring1 = testItemId
    state.equipment.ring2 = secondItemId
    const events: CombatEvent[] = []
    const root: CombatEffect = { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 1 } }] }
    executeCombatEffects(state, [root], { actor: 'player', kind: 'system', sourceId: 'root' }, undefined, { push: (event) => events.push(event) })
    const damageEvents = events.filter((event) => event.category === 'damage')
    expect(damageEvents).toHaveLength(3)
    expect(damageEvents.filter((event) => event.sourceKind === 'equipment').map((event) => event.providerInstanceKey)).toEqual(expect.arrayContaining(['ring1', 'ring2']))
  })

  it('allows a chance rule one attempt per cascade, including when the first roll fails', () => {
    const failedSeed = (() => {
      for (let seed = 0; seed < 10_000; seed += 1) {
        const probe = { combatRngState: seed }
        if (nextCombatRandom(probe) >= 0.2) return seed
      }
      throw new Error('Could not find deterministic failed chance seed')
    })()
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'failed-proc', event: 'on-damage-dealt', chance: 0.2, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 0 } }] }] } }
    ITEMS[secondItemId] = { ...testItem, id: secondItemId, combat: { rules: [{ id: 'nested-damage', event: 'on-damage-dealt', effects: [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 1 } }] }] }] } }
    const state = stateWithEnemy()
    state.equipment.ring1 = testItemId
    state.equipment.ring2 = secondItemId
    state.combat.combatRngState = failedSeed
    const events: CombatEvent[] = []
    const resolution = createCombatResolutionContext()
    const root: CombatEffect = { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 1 } }] }
    const expectedRng = { combatRngState: failedSeed }
    nextCombatRandom(expectedRng)
    executeCombatEffects(state, [root], { actor: 'player', kind: 'system', sourceId: 'chance-root' }, undefined, { push: (event) => events.push(event) }, resolution)

    const failedKey = getRuleRuntimeKey('player', 'equipment', testItemId, 'failed-proc', 'ring1')
    expect(resolution.attemptedRuleKeys.has(failedKey)).toBe(true)
    expect(state.combat.combatRngState).toBe(expectedRng.combatRngState)
    expect(events.filter((event) => event.category === 'damage')).toHaveLength(2)

    const nextResolution = createCombatResolutionContext()
    executeCombatEffects(state, [root], { actor: 'player', kind: 'system', sourceId: 'chance-root' }, undefined, { push: (event) => events.push(event) }, nextResolution)
    expect(nextResolution.attemptedRuleKeys.has(failedKey)).toBe(true)
  })

  it('keeps chance attempts independent for Ring 1 and Ring 2', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'ring-attempt', event: 'on-damage-dealt', chance: 0, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 0 } }] }] } }
    const state = stateWithEnemy()
    state.equipment.ring1 = testItemId
    state.equipment.ring2 = testItemId
    const resolution = createCombatResolutionContext()
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 1 } }] }], { actor: 'player', kind: 'system', sourceId: 'ring-root' }, undefined, undefined, resolution)
    expect(resolution.attemptedRuleKeys).toEqual(new Set([
      getRuleRuntimeKey('player', 'equipment', testItemId, 'ring-attempt', 'ring1'),
      getRuleRuntimeKey('player', 'equipment', testItemId, 'ring-attempt', 'ring2'),
    ]))
  })

  it('keeps a split-type Hit atomic while preserving per-component mitigation', () => {
    const originalDefense = MONSTERS['forest-wisp'].defense
    const originalResistances = MONSTERS['forest-wisp'].resistances
    ITEMS[testItemId] = { ...testItem, combat: { modifiers: [{ key: 'crit-chance', value: -1 }] } }
    MONSTERS['forest-wisp'].defense = 0
    MONSTERS['forest-wisp'].resistances = { physical: 0.2, arcane: 0.5 }
    try {
      const state = stateWithEnemy()
      state.equipment.ring1 = testItemId
      const events: CombatEvent[] = []
      const effect: CombatEffect = { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 10 } }, { damageType: 'arcane', magnitude: { type: 'flat', value: 10 } }], tags: ['direct'] }
      const initialRng = state.combat.combatRngState
      executeCombatEffects(state, [effect], { actor: 'player', kind: 'spell', sourceId: 'split-hit', tags: ['spell', 'direct'] }, undefined, { push: (event) => events.push(event) })
      const damageEvents = events.filter((event) => event.healthDamage !== undefined)
      expect(damageEvents).toHaveLength(1)
      expect(damageEvents[0]).toMatchObject({ damageTypes: ['physical', 'arcane'], critical: false, blocked: false, healthDamage: 13 })
      expect(damageEvents[0].damageComponents?.map((component) => component.amount)).toEqual([8, 5])
      expect(damageEvents[0].damageComponents?.map((component) => component.damageType)).toEqual(['physical', 'arcane'])
      expect(state.combat.combatRngState).not.toBe(initialRng)
    } finally {
      MONSTERS['forest-wisp'].defense = originalDefense
      MONSTERS['forest-wisp'].resistances = originalResistances
    }
  })

  it('shares one Crit/Block outcome across all components and keeps explicit Hits separate', () => {
    const originalDefense = MONSTERS['forest-wisp'].defense
    const originalResistances = MONSTERS['forest-wisp'].resistances
    const originalBlockChance = MONSTERS['forest-wisp'].blockChance
    ITEMS[testItemId] = { ...testItem, combat: { modifiers: [{ key: 'crit-chance', value: 1 }] } }
    MONSTERS['forest-wisp'].defense = 0
    MONSTERS['forest-wisp'].resistances = { physical: 0, arcane: 0 }
    MONSTERS['forest-wisp'].blockChance = 0
    try {
      const state = stateWithEnemy()
      state.equipment.ring1 = testItemId
      state.combat.combatRngState = 0
      const events: CombatEvent[] = []
      const hit: CombatEffect = { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 10 } }, { damageType: 'arcane', magnitude: { type: 'flat', value: 10 } }], tags: ['direct'] }
      executeCombatEffects(state, [hit], { actor: 'player', kind: 'spell', sourceId: 'split-hit', tags: ['spell', 'direct'] }, undefined, { push: (event) => events.push(event) })
      expect(events.filter((event) => event.healthDamage !== undefined)).toHaveLength(1)
      expect(events.find((event) => event.healthDamage !== undefined)).toMatchObject({ critical: true, blocked: false, healthDamage: 30 })

      const multiState = stateWithEnemy()
      multiState.equipment.ring1 = testItemId
      multiState.combat.combatRngState = 0
      const multiEvents: CombatEvent[] = []
      executeCombatEffects(multiState, [
        { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 10 } }], tags: ['direct'] },
        { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'arcane', magnitude: { type: 'flat', value: 10 } }], tags: ['direct'] },
      ], { actor: 'player', kind: 'spell', sourceId: 'true-multi-hit', tags: ['spell', 'direct'] }, undefined, { push: (event) => multiEvents.push(event) })
      expect(multiEvents.filter((event) => event.healthDamage !== undefined)).toHaveLength(2)
      expect(multiState.combat.combatRngState).not.toBe(state.combat.combatRngState)
    } finally {
      MONSTERS['forest-wisp'].defense = originalDefense
      MONSTERS['forest-wisp'].resistances = originalResistances
      MONSTERS['forest-wisp'].blockChance = originalBlockChance
    }
  })

  it('aggregates blocked amount across split Hit components and emits one event', () => {
    const originalDefense = MONSTERS['forest-wisp'].defense
    const originalResistances = MONSTERS['forest-wisp'].resistances
    const originalBlockChance = MONSTERS['forest-wisp'].blockChance
    ITEMS[testItemId] = { ...testItem, combat: { modifiers: [{ key: 'crit-chance', value: -1 }] } }
    MONSTERS['forest-wisp'].defense = 0
    MONSTERS['forest-wisp'].resistances = { physical: 0, arcane: 0 }
    MONSTERS['forest-wisp'].blockChance = 1
    try {
      const state = stateWithEnemy()
      state.equipment.ring1 = testItemId
      const events: CombatEvent[] = []
      executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 10 } }, { damageType: 'arcane', magnitude: { type: 'flat', value: 10 } }], tags: ['direct'] }], { actor: 'player', kind: 'spell', sourceId: 'blocked-split', tags: ['spell', 'direct'] }, undefined, { push: (event) => events.push(event) })
      const damageEvents = events.filter((event) => event.healthDamage !== undefined)
      expect(damageEvents).toHaveLength(1)
      const event = damageEvents[0]
      const componentBlocked = (event.damageComponents ?? []).reduce((total, component, index) => total + (index === 0 ? 10 : 10) - component.amount - component.barrierAbsorbed, 0)
      expect(event).toMatchObject({ blocked: true, damageComponents: expect.arrayContaining([expect.objectContaining({ damageType: 'physical' }), expect.objectContaining({ damageType: 'arcane' })]) })
      expect(event.blockedAmount).toBeCloseTo(componentBlocked)
      expect(event.blockedAmount).toBeGreaterThan(0)
    } finally {
      MONSTERS['forest-wisp'].defense = originalDefense
      MONSTERS['forest-wisp'].resistances = originalResistances
      MONSTERS['forest-wisp'].blockChance = originalBlockChance
    }
  })

  it('clamps effective Health damage and fires on-kill only on alive-to-dead crossing', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'kill-barrier', event: 'on-kill', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 } }] }] } }
    const state = stateWithEnemy()
    state.equipment.ring1 = testItemId
    state.combat.enemyMaxHp = 5
    state.combat.enemyHp = 5
    const events: CombatEvent[] = []
    const lethal: CombatEffect = { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 100 } }] }
    const sink = { push: (event: CombatEvent) => events.push(event) }

    executeCombatEffects(state, [lethal], { actor: 'player', kind: 'system', sourceId: 'lethal-root' }, undefined, sink)
    const firstDamage = events.find((event) => event.category === 'damage')
    expect(firstDamage?.healthDamage).toBe(5)
    expect(state.combat.enemyHp).toBe(0)
    expect(state.combat.playerBarrier).toBe(40)
    expect(events.filter((event) => event.sourceKind === 'equipment' && event.category === 'system')).toHaveLength(1)

    executeCombatEffects(state, [lethal], { actor: 'player', kind: 'system', sourceId: 'later-root' }, undefined, sink)
    expect(events.filter((event) => event.sourceKind === 'equipment' && event.category === 'system')).toHaveLength(1)

    const multiHitState = stateWithEnemy()
    multiHitState.equipment.ring1 = testItemId
    multiHitState.combat.enemyMaxHp = 5
    multiHitState.combat.enemyHp = 5
    const multiEvents: CombatEvent[] = []
    executeCombatEffects(multiHitState, [lethal, lethal], { actor: 'player', kind: 'system', sourceId: 'multi-hit-root' }, undefined, { push: (event) => multiEvents.push(event) })
    expect(multiEvents.filter((event) => event.sourceKind === 'equipment' && event.category === 'system')).toHaveLength(1)
  })

  it('treats dead or missing targets as no-op before hit RNG, events, and procs', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [
      { id: 'damage-dealt-proc', event: 'on-damage-dealt', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 10 } }] },
      { id: 'damage-taken-proc', event: 'on-damage-taken', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 10 } }] },
      { id: 'spell-hit-proc', event: 'on-spell-hit', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 10 } }] },
      { id: 'basic-hit-proc', event: 'on-basic-attack-hit', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 10 } }] },
    ] } }
    const state = stateWithEnemy()
    state.equipment.ring1 = testItemId
    state.combat.enemyHp = 0
    state.combat.enemyBarrier = 25
    const beforeRng = state.combat.combatRngState
    const events: CombatEvent[] = []
    const hit: CombatEffect = { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 100 } }], tags: ['spell', 'direct'] }
    executeCombatEffects(state, [hit], source, undefined, { push: (event) => events.push(event) })
    expect(state.combat.combatRngState).toBe(beforeRng)
    expect(state.combat.enemyHp).toBe(0)
    expect(state.combat.enemyBarrier).toBe(25)
    expect(state.combat.playerBarrier).toBe(0)
    expect(events).toHaveLength(0)

    state.combat.enemyId = null
    state.combat.enemyHp = 100
    executeCombatEffects(state, [hit], source, undefined, { push: (event) => events.push(event) })
    expect(state.combat.combatRngState).toBe(beforeRng)
    expect(state.combat.enemyHp).toBe(100)
    expect(events).toHaveLength(0)
  })

  it('ignores every ordinary effect aimed at a dead actor without blocking living self effects', () => {
    const state = stateWithEnemy()
    state.combat.enemyHp = 0
    state.combat.enemyBarrier = 12
    state.combat.enemyActionTimerMs = 77
    state.combat.enemyActionPatternId = 'default'
    state.player.mana = 50
    const deadEnemyEffects: CombatEffect[] = [
      { type: 'heal', target: 'opponent', magnitude: { type: 'flat', value: 40 } },
      { type: 'gain-barrier', target: 'opponent', magnitude: { type: 'flat', value: 40 } },
      { type: 'restore-resource', target: 'opponent', resource: 'mana', magnitude: { type: 'flat', value: 40 } },
      { type: 'drain-resource', target: 'opponent', resource: 'mana', magnitude: { type: 'flat', value: 10 } },
      { type: 'apply-status', target: 'opponent', statusId: 'burning' },
      { type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: 500 },
      { type: 'set-action-pattern', target: 'opponent', patternId: 'default' },
    ]
    executeCombatEffects(state, deadEnemyEffects, source)
    expect(state.combat.enemyHp).toBe(0)
    expect(state.combat.enemyBarrier).toBe(12)
    expect(state.combat.enemyActionTimerMs).toBe(77)
    expect(state.combat.enemyActionPatternId).toBe('default')
    expect(state.combat.enemyStatuses).toHaveLength(0)
    expect(state.player.mana).toBe(50)

    state.player.health = 0
    state.combat.playerBarrier = 8
    const playerMana = state.player.mana
    executeCombatEffects(state, [
      { type: 'heal', target: 'opponent', magnitude: { type: 'flat', value: 40 } },
      { type: 'gain-barrier', target: 'opponent', magnitude: { type: 'flat', value: 40 } },
      { type: 'restore-resource', target: 'opponent', resource: 'mana', magnitude: { type: 'flat', value: 40 } },
      { type: 'apply-status', target: 'opponent', statusId: 'quickening' },
      { type: 'modify-action-timer', target: 'opponent', action: 'basic-attack', amountMs: 500 },
    ], { actor: 'enemy', kind: 'action', sourceId: 'dead-enemy-action' })
    expect(state.player.health).toBe(0)
    expect(state.combat.playerBarrier).toBe(8)
    expect(state.player.mana).toBe(playerMana)
    expect(state.combat.playerStatuses).toHaveLength(0)
  })

  it('does not let a lethal reactive heal resurrect the player, but keeps nonlethal healing working', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'reactive-heal', event: 'on-damage-taken', effects: [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 20 } }] }] } }
    const incoming = { actor: 'enemy' as const, kind: 'action' as const, sourceId: 'reactive-hit', tags: ['physical' as const] }
    const lethal = stateWithEnemy()
    lethal.equipment.ring1 = testItemId
    lethal.player.maxHealth = 100
    lethal.player.health = 20
    executeCombatEffects(lethal, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 30 } }] }], incoming)
    expect(lethal.player.health).toBe(0)

    const nonlethal = stateWithEnemy()
    nonlethal.equipment.ring1 = testItemId
    nonlethal.player.maxHealth = 100
    nonlethal.player.health = 100
    executeCombatEffects(nonlethal, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 30 } }] }], incoming)
    expect(nonlethal.player.health).toBe(90)
  })

  it('does not let a dead Player retaliate, while a surviving Player still can', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'retaliation', event: 'on-damage-taken', effects: [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 50 } }] }] }] } }
    const incoming = { actor: 'enemy' as const, kind: 'action' as const, sourceId: 'retaliation-test', tags: ['physical' as const] }
    const lethal = stateWithEnemy()
    lethal.equipment.ring1 = testItemId
    lethal.player.maxHealth = 100
    lethal.player.health = 20
    lethal.combat.enemyMaxHp = 100
    lethal.combat.enemyHp = 100
    executeCombatEffects(lethal, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 30 } }] }], incoming)
    expect(lethal.player.health).toBe(0)
    expect(lethal.combat.enemyHp).toBe(100)

    const nonlethal = stateWithEnemy()
    nonlethal.equipment.ring1 = testItemId
    nonlethal.player.maxHealth = 100
    nonlethal.player.health = 100
    nonlethal.combat.enemyMaxHp = 100
    nonlethal.combat.enemyHp = 100
    executeCombatEffects(nonlethal, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 30 } }] }], incoming)
    expect(nonlethal.player.health).toBe(70)
    expect(nonlethal.combat.enemyHp).toBeLessThan(100)
  })

  it('does not activate an Enemy threshold Trait when the threshold Hit is lethal', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.player.health = 100
    state.player.maxHealth = 100
    spawnEnemy(state, 'grove-sentinel')
    state.combat.enemyMaxHp = 100
    state.combat.enemyHp = 100
    state.combat.enemyBarrier = 0
    const initialPattern = state.combat.enemyActionPatternId
    const initialLogLength = state.combat.log.length
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 200 } }] }], { actor: 'player', kind: 'spell', sourceId: 'lethal-threshold', tags: ['spell'] })
    expect(state.combat.enemyHp).toBe(0)
    expect(state.combat.enemyBarrier).toBe(0)
    expect(state.combat.enemyActionPatternId).toBe(initialPattern)
    expect(state.combat.enemyStatuses).toHaveLength(0)
    expect(state.combat.log.slice(initialLogLength).some((entry) => entry.includes('Ancient Growth triggers'))).toBe(false)
    expect(state.combat.triggeredRuleIds.some((id) => id.includes('ancient-growth-threshold'))).toBe(false)
  })

  it('skips post-lethal opponent statuses while resolving later self effects', () => {
    const state = stateWithEnemy()
    state.combat.enemyHp = 5
    state.combat.enemyMaxHp = 5
    const events: CombatEvent[] = []
    executeCombatEffects(state, [
      { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 10 } }], tags: ['direct'] },
      { type: 'apply-status', target: 'opponent', statusId: 'burning', statusSourceKey: 'post-lethal-burning' },
      { type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } },
    ], { actor: 'player', kind: 'spell', sourceId: 'post-lethal-chain', tags: ['spell', 'direct'] }, undefined, { push: (event) => events.push(event) })
    expect(state.combat.enemyHp).toBe(0)
    expect(state.combat.enemyStatuses).toHaveLength(0)
    expect(state.combat.playerBarrier).toBe(20)
    expect(events.some((event) => event.category === 'status' && event.statusId === 'burning' && event.statusPhase === 'apply')).toBe(false)
  })

  it('counts only the first Hit after a kill and consumes only its direct-hit RNG', () => {
    ITEMS[testItemId] = { ...testItem, combat: { rules: [{ id: 'multi-hit-kill', event: 'on-kill', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 15 } }] }] } }
    useCombatTelemetryStore.getState().clear()
    try {
      const state = stateWithEnemy()
      state.equipment.ring1 = testItemId
      state.combat.enemyHp = 5
      state.combat.enemyMaxHp = 5
      useCombatTelemetryStore.getState().beginRun('whispering-woods')
      useCombatTelemetryStore.getState().beginEncounter('forest-wisp')
      const expectedRng = { combatRngState: state.combat.combatRngState }
      nextCombatRandom(expectedRng)
      nextCombatRandom(expectedRng)
      const events: CombatEvent[] = []
      const sink = { push: (event: CombatEvent) => { events.push(event); combatTelemetrySink.push(event) } }
      const hits: CombatEffect[] = [1, 2, 3].map(() => ({ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 10 } }], tags: ['direct'] }))
      executeCombatEffects(state, hits, { actor: 'player', kind: 'spell', sourceId: 'three-hit-spell', tags: ['spell', 'direct'] }, undefined, sink)
      const damageEvents = events.filter((event) => event.sourceKind === 'spell' && event.category === 'spell')
      expect(damageEvents).toHaveLength(1)
      expect(damageEvents[0].healthDamage).toBe(5)
      expect(state.combat.enemyHp).toBe(0)
      expect(state.combat.combatRngState).toBe(expectedRng.combatRngState)
      expect(events.filter((event) => event.sourceKind === 'equipment' && event.category === 'system')).toHaveLength(1)
      expect(useCombatTelemetryStore.getState().run?.player.damageDone.total).toBe(damageEvents[0].amount)
      expect(useCombatTelemetryStore.getState().run?.player.damageDone.bySource['spell:three-hit-spell'].events).toBe(1)
    } finally {
      useCombatTelemetryStore.getState().clear()
    }
  })

  it('validates malformed Equipment Combat providers through shared validators', () => {
    const malformed = { ...testItem, combat: { modifiers: [{ key: 'not-a-modifier', value: Number.NaN }], rules: [
      { id: 'duplicate', event: 'on-damage-dealt', effects: [{ type: 'deal-damage', target: 'opponent', components: [] }] },
      { id: 'duplicate', event: 'on-damage-dealt', cooldownMs: -1, effects: [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'not-a-type', magnitude: { type: 'flat', value: 1 } }] }] },
    ] } } as unknown as ItemDefinition
    const errors = validateItemDefinitions({ [testItemId]: malformed })
    expect(errors.some((error) => error.includes('invalid modifier key'))).toBe(true)
    expect(errors.some((error) => error.includes('modifier value must be finite'))).toBe(true)
    expect(errors.some((error) => error.includes('duplicate rule id'))).toBe(true)
    expect(errors.some((error) => error.includes('damage Hit requires at least one component'))).toBe(true)
    expect(errors.some((error) => error.includes('invalid damage type'))).toBe(true)
    expect(errors.some((error) => error.includes('cooldown must be finite and non-negative'))).toBe(true)
    expect(validateCombatProvider(malformed.combat, `${testItemId}.combat`).length).toBeGreaterThan(0)
    expect(validateCombatEffect({ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'spell-power', coefficient: Number.NaN } }] })).toEqual(expect.arrayContaining([expect.stringContaining('coefficient')]))
  })

  it('rejects recursive periodic status spawning', () => {
    const validationContext = createCombatValidationContext(STATUS_DEFINITIONS)
    const nested = { type: 'apply-status', target: 'opponent', statusId: 'regeneration', periodicEffects: [{ type: 'apply-status', target: 'self', statusId: 'regeneration' }] }
    expect(validateCombatEffect(nested, 'nested', validationContext)).toEqual(expect.arrayContaining([expect.stringContaining('nested periodic status spawning')]))
  })
})

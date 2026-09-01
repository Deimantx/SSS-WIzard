import { afterEach, describe, expect, it } from 'vitest'
import { ITEMS } from '../../content/items/items'
import { createInitialState } from '../../../store/initialState'
import type { GameState, ItemDefinition, ItemId } from '../../types'
import { executeCombatEffects } from './effectResolver'
import { getCombatModifiers } from './modifiers'
import { applyStatus } from './statusRuntime'
import { getActionRate, getCurrentEnemyActionRate, getPlayerBasicAttackRate, startEnemyAction, clearCurrentEnemyAction } from './actionRuntime'
import { spawnEnemy } from './combatRuntime'
import { runCombatTriggers, getRuleRuntimeKey, tickRuleCooldowns } from './triggerRuntime'
import { advanceGameState } from '../simulation/advanceGameState'
import { validateStatusDefinitions, STATUS_DEFINITIONS } from '../../content/statuses'

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
})

describe('equipment combat providers', () => {
  const testItemId = 'hardening-test-ring' as ItemId
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

  afterEach(() => { delete ITEMS[testItemId] })

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
})

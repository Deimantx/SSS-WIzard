import { describe, expect, it, vi } from 'vitest'
import { ITEMS } from '../../content/items/items'
import { createInitialState } from '../../../store/initialState'
import type { GameState, ItemDefinition, ItemId } from '../../types'
import { executeCombatEffects } from '../combat/effectResolver'
import { clearCurrentEnemyAction, forceResolveEnemyAction, startEnemyAction } from '../combat/actionRuntime'
import { spawnEnemy } from '../combat/combatRuntime'
import { applyStatus } from '../combat/statusRuntime'
import { advanceGameState } from './advanceGameState'
import { SIMULATION_QUANTUM_MS } from './simulationConstants'

const cloneState = (state: GameState) => JSON.parse(JSON.stringify(state)) as GameState
const comparableStatuses = (state: GameState, actor: 'player' | 'enemy') => {
  const statuses = actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
  return statuses.map(({ appliedAt: _appliedAt, ...status }) => status)
}

const combatFixture = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.player.maxHealth = 10_000
  state.player.health = 10_000
  spawnEnemy(state, 'forest-wisp')
  state.combat.enemyMaxHp = 100_000
  state.combat.enemyHp = 100_000
  return state
}

const snapshot = (state: GameState) => ({
  player: { health: state.player.health, mana: state.player.mana },
  activities: {
    research: state.activities.research,
    transmutation: state.activities.transmutation,
  },
  combat: {
    active: state.combat.active,
    enemyId: state.combat.enemyId,
    enemyInstanceSerial: state.combat.enemyInstanceSerial,
    enemyInstanceKey: state.combat.enemyInstanceKey,
    enemyHp: state.combat.enemyHp,
    enemyBarrier: state.combat.enemyBarrier,
    enemyBarrierRemainingMs: state.combat.enemyBarrierRemainingMs,
    playerBarrier: state.combat.playerBarrier,
    playerBarrierRemainingMs: state.combat.playerBarrierRemainingMs,
    enemyActionPatternId: state.combat.enemyActionPatternId,
    enemyNextActionIndex: state.combat.enemyNextActionIndex,
    enemyCurrentStepId: state.combat.enemyCurrentStepId,
    enemyCurrentActionId: state.combat.enemyCurrentActionId,
    enemyCurrentActionPatternId: state.combat.enemyCurrentActionPatternId,
    enemyActionTimerMs: state.combat.enemyActionTimerMs,
    enemyActionDurationMs: state.combat.enemyActionDurationMs,
    playerAttackTimerMs: state.combat.playerAttackTimerMs,
    playerAttackDurationMs: state.combat.playerAttackDurationMs,
    encounterTimerMs: state.combat.encounterTimerMs,
    spellCooldowns: state.combat.spellCooldowns,
    triggeredRuleIds: state.combat.triggeredRuleIds,
    ruleCooldowns: state.combat.ruleCooldowns,
    playerStatuses: comparableStatuses(state, 'player'),
    enemyStatuses: comparableStatuses(state, 'enemy'),
    combatRngState: state.combat.combatRngState,
  },
})

const advanceFine = (state: GameState, durationMs: number) => {
  for (let elapsed = 0; elapsed < durationMs; elapsed += SIMULATION_QUANTUM_MS) {
    advanceGameState(state, Math.min(SIMULATION_QUANTUM_MS, durationMs - elapsed), { mode: 'live' })
  }
}

describe('canonical simulation quantum parity', () => {
  it('keeps Auto-Cast, Basic Attacks, and shared Mana ordering identical for fine and coarse callers', () => {
    const fine = combatFixture()
    fine.progress.spellRanks['fire-bolt'] = 1
    fine.activities.autoCast['fire-bolt'] = true
    fine.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    fine.player.mana = 0
    const coarse = cloneState(fine)

    advanceFine(fine, 30_000)
    for (let elapsed = 0; elapsed < 30_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })

    expect(snapshot(coarse)).toEqual(snapshot(fine))
    expect(fine.combat.spellCooldowns['fire-bolt']).toBeGreaterThan(0)
    expect(fine.combat.playerAttackTimerMs).toBeGreaterThan(0)
  })

  it('keeps a source-scaled Enemy DoT identical for live and banked callers', () => {
    const makeFixture = () => {
      const state = createInitialState()
      state.combat.active = true
      state.combat.dungeonId = 'howling-den'
      state.player.maxHealth = 10_000
      state.player.health = 10_000
      state.debug.freezePlayerActions = true
      state.debug.freezeEnemyActions = true
      spawnEnemy(state, 'razorclaw-lynx')
      clearCurrentEnemyAction(state)
      expect(forceResolveEnemyAction(state, 'rending-claws', executeCombatEffects)).toBe(true)
      return state
    }
    const fine = makeFixture()
    const coarse = cloneState(fine)
    advanceFine(fine, 8_000)
    for (let elapsed = 0; elapsed < 8_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })
    expect(snapshot(coarse)).toEqual(snapshot(fine))
  })

  it('keeps deterministic enemy Action progression and timed Statuses identical', () => {
    const fine = combatFixture()
    const source = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'parity-status', school: 'fire' as const, tags: ['spell' as const, 'fire' as const] }
    applyStatus(fine, 'enemy', 'burning', source, { now: 0 })
    const coarse = cloneState(fine)

    advanceFine(fine, 12_000)
    for (let elapsed = 0; elapsed < 12_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })

    expect(snapshot(coarse)).toEqual(snapshot(fine))
  })

  it('preserves encounter transition timing and the paused no-enemy combat state', () => {
    const fine = createInitialState()
    fine.combat.active = true
    fine.combat.dungeonId = 'whispering-woods'
    fine.combat.encounterTimerMs = 250
    fine.combat.playerAttackTimerMs = 777
    const coarse = cloneState(fine)
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)

    try {
      advanceFine(fine, 1_000)
      advanceGameState(coarse, 1_000, { mode: 'banked' })
    } finally {
      random.mockRestore()
    }

    expect(snapshot(coarse)).toEqual(snapshot(fine))
    expect(fine.combat.enemyId).toBe('forest-wisp')
  })

  it('uses the same partial final quantum as repeated fine callers', () => {
    const fine = combatFixture()
    const coarse = cloneState(fine)

    advanceFine(fine, 250)
    advanceGameState(coarse, 250, { mode: 'banked' })

    expect(snapshot(coarse)).toEqual(snapshot(fine))
  })

  it('keeps a Chilled mid-skill timeline identical for fine and coarse callers', () => {
    const fine = combatFixture()
    const prepare = (state: GameState) => {
      clearCurrentEnemyAction(state)
      state.combat.enemyNextActionIndex = 2
      expect(startEnemyAction(state, 'arc-spark', executeCombatEffects)).toBe(true)
    }
    prepare(fine)
    const coarse = cloneState(fine)

    advanceFine(fine, 1_000)
    advanceGameState(coarse, 1_000, { mode: 'banked' })
    const chilled = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'parity-chilled', school: 'water' as const, tags: ['spell' as const, 'water' as const] }
    applyStatus(fine, 'enemy', 'chilled', chilled, { durationMs: 1_500 })
    applyStatus(coarse, 'enemy', 'chilled', chilled, { durationMs: 1_500 })
    advanceFine(fine, 4_000)
    for (let elapsed = 0; elapsed < 4_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })

    expect(snapshot(coarse)).toEqual(snapshot(fine))
  })

  it('keeps Stun pause/resume and Quickening mid-basic parity identical', () => {
    const fine = combatFixture()
    const coarse = cloneState(fine)
    advanceFine(fine, 500)
    advanceGameState(coarse, 500, { mode: 'banked' })
    const stun = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'parity-stun', tags: ['spell' as const, 'control' as const] }
    applyStatus(fine, 'player', 'stunned', stun, { durationMs: 750 })
    applyStatus(coarse, 'player', 'stunned', stun, { durationMs: 750 })
    advanceFine(fine, 2_000)
    for (let elapsed = 0; elapsed < 2_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })
    expect(snapshot(coarse)).toEqual(snapshot(fine))

    const quickFine = combatFixture()
    const quickCoarse = cloneState(quickFine)
    advanceFine(quickFine, 500)
    advanceGameState(quickCoarse, 500, { mode: 'banked' })
    const quickening = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'parity-quickening', tags: ['spell' as const, 'buff' as const] }
    applyStatus(quickFine, 'player', 'quickening', quickening)
    applyStatus(quickCoarse, 'player', 'quickening', quickening)
    advanceFine(quickFine, 2_000 - 500)
    for (let elapsed = 0; elapsed < 2_000 - 500; elapsed += 1_000) advanceGameState(quickCoarse, Math.min(1_000, 2_000 - 500 - elapsed), { mode: 'banked' })
    expect(snapshot(quickCoarse)).toEqual(snapshot(quickFine))
  })

  it('keeps variable potency refresh parity identical', () => {
    const fine = combatFixture()
    const coarse = cloneState(fine)
    const chilled = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'parity-potency', school: 'water' as const, tags: ['spell' as const, 'water' as const] }
    const weak = { 'basic-attack-speed-percent': -0.1, 'action-speed-percent': -0.1 }
    const strong = { 'basic-attack-speed-percent': -0.3, 'action-speed-percent': -0.3 }
    applyStatus(fine, 'enemy', 'chilled', chilled, { durationMs: 2_000, modifierOverrides: weak })
    applyStatus(coarse, 'enemy', 'chilled', chilled, { durationMs: 2_000, modifierOverrides: weak })
    advanceFine(fine, 500)
    advanceGameState(coarse, 500, { mode: 'banked' })
    applyStatus(fine, 'enemy', 'chilled', { ...chilled, sourceId: 'parity-potency-strong' }, { durationMs: 2_000, modifierOverrides: strong })
    applyStatus(coarse, 'enemy', 'chilled', { ...chilled, sourceId: 'parity-potency-strong' }, { durationMs: 2_000, modifierOverrides: strong })
    advanceFine(fine, 3_000)
    for (let elapsed = 0; elapsed < 3_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })

    expect(snapshot(coarse)).toEqual(snapshot(fine))
  })

  it('keeps an equipment trigger event and its resulting state parity identical', () => {
    const itemId = 'parity-combat-ring' as ItemId
    const item: ItemDefinition = {
      id: itemId,
      name: 'Parity Combat Ring',
      description: 'Test-only provider.',
      icon: '◌',
      color: '#fff',
      kind: 'equipment',
      category: 'equipment',
      inventoryCategory: 'equipment',
      source: 'Tests',
      sellValue: 1,
      canDestroy: true,
      equipmentSlot: 'ring',
      combat: { rules: [{ id: 'parity-start', event: 'on-combat-start', oncePerEncounter: true, effects: [{ type: 'apply-status', target: 'self', statusId: 'quickening' }] }] },
    }
    ITEMS[itemId] = item
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    try {
      const fine = createInitialState()
      fine.combat.active = true
      fine.combat.dungeonId = 'whispering-woods'
      fine.equipment.ring1 = itemId
      spawnEnemy(fine, 'forest-wisp')
      const coarse = cloneState(fine)
      advanceFine(fine, 5_000)
      for (let elapsed = 0; elapsed < 5_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })
      expect(snapshot(coarse)).toEqual(snapshot(fine))
    } finally {
      random.mockRestore()
      delete ITEMS[itemId]
    }
  })

  it('keeps equipment provider identity and player cooldowns through enemy death and downtime', () => {
    const itemId = 'parity-cooldown-ring' as ItemId
    const item: ItemDefinition = {
      id: itemId,
      name: 'Parity Cooldown Ring',
      description: 'Test-only provider.',
      icon: 'â—Œ',
      color: '#fff',
      kind: 'equipment',
      category: 'equipment',
      inventoryCategory: 'equipment',
      source: 'Tests',
      sellValue: 1,
      canDestroy: true,
      equipmentSlot: 'ring',
      combat: { rules: [{ id: 'parity-cooldown', event: 'on-combat-start', oncePerEncounter: true, cooldownMs: 12_000, effects: [{ type: 'apply-status', target: 'opponent', statusId: 'burning' }] }] },
    }
    ITEMS[itemId] = item
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    try {
      const fine = combatFixture()
      fine.equipment.ring1 = itemId
      fine.equipment.ring2 = itemId
      spawnEnemy(fine, 'forest-wisp')
      const coarse = cloneState(fine)
      fine.combat.enemyHp = 0
      coarse.combat.enemyHp = 0
      advanceFine(fine, 1)
      advanceGameState(coarse, 1, { mode: 'banked' })
      advanceFine(fine, 5_000)
      for (let elapsed = 0; elapsed < 5_000; elapsed += 1_000) advanceGameState(coarse, 1_000, { mode: 'banked' })
      expect(snapshot(coarse)).toEqual(snapshot(fine))
      expect(fine.combat.enemyId).not.toBeNull()
      expect(Object.values(fine.combat.ruleCooldowns)).toEqual(expect.arrayContaining([6_999, 6_999]))
      expect(fine.combat.enemyStatuses).toHaveLength(0)
    } finally {
      random.mockRestore()
      delete ITEMS[itemId]
    }
  })

  it('keeps random encounters, direct-hit rolls, death downtime, and the next enemy identical', () => {
    const makeFixture = () => {
      const state = createInitialState()
      state.combat.active = true
      state.combat.dungeonId = 'whispering-woods'
      state.player.maxHealth = 10_000
      state.player.health = 10_000
      state.debug.freezePlayerActions = true
      state.debug.freezeEnemyActions = true
      spawnEnemy(state, 'forest-wisp')
      state.combat.enemyHp = 1
      state.combat.enemyMaxHp = 1
      return state
    }
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    try {
      const fine = makeFixture()
      const coarse = cloneState(fine)
      const playerHit = { type: 'deal-damage' as const, target: 'opponent' as const, damageType: 'physical' as const, magnitude: { type: 'flat' as const, value: 1 }, tags: ['direct' as const] }
      const enemyHit = { type: 'deal-damage' as const, target: 'opponent' as const, damageType: 'physical' as const, magnitude: { type: 'flat' as const, value: 1 }, tags: ['direct' as const] }
      executeCombatEffects(fine, [enemyHit], { actor: 'enemy', kind: 'basic-attack', sourceId: 'parity-enemy-hit' })
      executeCombatEffects(fine, [playerHit], { actor: 'player', kind: 'spell', sourceId: 'parity-player-hit', tags: ['spell', 'direct'] })
      executeCombatEffects(coarse, [enemyHit], { actor: 'enemy', kind: 'basic-attack', sourceId: 'parity-enemy-hit' })
      executeCombatEffects(coarse, [playerHit], { actor: 'player', kind: 'spell', sourceId: 'parity-player-hit', tags: ['spell', 'direct'] })
      fine.combat.enemyHp = 0
      coarse.combat.enemyHp = 0
      advanceFine(fine, 5_100)
      for (let elapsed = 0; elapsed < 5_100; elapsed += 1_000) advanceGameState(coarse, Math.min(1_000, 5_100 - elapsed), { mode: 'banked' })
      expect(snapshot(coarse)).toEqual(snapshot(fine))
      expect(fine.combat.enemyInstanceSerial).toBe(2)
      expect(fine.combat.enemyInstanceKey).toBe('enemy:2')
      expect(fine.combat.enemyId).not.toBeNull()
      expect(fine.combat.combatRngState).not.toBe(createInitialState().combat.combatRngState)
    } finally {
      random.mockRestore()
    }
  })
})

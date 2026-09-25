import { describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceWithOfflineBank } from './offlineBankSimulation'
import { executeCombatEffects } from '../combat/effectResolver'
import { spawnEnemy } from '../combat/combatRuntime'
import { startNextEnemyAction } from '../combat/actionRuntime'
import { advanceGameStateBanked, advanceGameStateBankedReference } from './offlineBankFastForward'
import { createCombatTelemetryAccumulator } from '../../telemetry/combat/combatTelemetryStore'
import { createDungeonStatisticsAccumulator } from '../../telemetry/dungeon/dungeonStatisticsStore'
import type { CombatEvent } from '../combat/combatTypes'

const activeCombatState = () => {
  const state = createInitialState()
  state.offlineBankMs = 1_000
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.targetEnemyId = 'forest-wisp'
  state.combat.enemyId = 'forest-wisp'
  state.combat.enemyHp = state.combat.enemyMaxHp = 100
  state.debug.freezePlayerActions = true
  state.debug.freezeEnemyActions = true
  return state
}

const activeAutoCastCombatState = () => {
  const state = createInitialState()
  const spellIds = ['fire-bolt', 'water-bolt', 'stone-shard', 'wind-blade'] as const
  spellIds.forEach((spellId) => {
    state.progress.spellRanks[spellId] = 1
    state.activities.autoCast[spellId] = true
  })
  state.activities.channeling.echoesAssigned = 5
  state.player.maxHealth = 1_000_000
  state.player.health = state.player.maxHealth
  state.player.mana = state.player.maxMana
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.targetEnemyId = 'forest-wisp'
  state.combat.activeSpellLoadout = {
    presetId: null,
    presetName: 'Offline benchmark',
    slots: spellIds.map((spellId) => ({ spellId, autoCast: true })),
    signature: spellIds.map((spellId) => `${spellId}:1`).join('|'),
  }
  expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
  return state
}

describe('Offline Bank analytics wiring', () => {
  it('skips empty time while matching the fixed-quantum reference state', async () => {
    const fast = activeCombatState()
    const reference = JSON.parse(JSON.stringify(fast)) as typeof fast
    const fastResult = await advanceGameStateBanked(fast, 5_000, { mode: 'banked' })
    const referenceResult = await advanceGameStateBankedReference(reference, 5_000, { mode: 'banked' })

    expect(fast).toEqual(reference)
    expect(fastResult.metrics.eventBoundaries).toBeLessThan(referenceResult.metrics.eventBoundaries)
    expect(fastResult.metrics.largestJumpMs).toBe(5_000)
  })

  it('does not regress to 100ms stepping for a quiet fifteen-minute bank advance', async () => {
    const state = activeCombatState()
    const result = await advanceGameStateBanked(state, 900_000, { mode: 'banked' })

    expect(result.metrics.eventBoundaries).toBe(1)
    expect(result.metrics.largestJumpMs).toBe(900_000)
  })

  it('profiles real active Auto-Cast combat at one, five, and fifteen minutes', async () => {
    const durations = [60_000, 300_000, 900_000, 3_600_000]
    const measurements = []
    for (const duration of durations) {
      const state = activeAutoCastCombatState()
      const result = await advanceGameStateBanked(state, duration, { mode: 'banked' })
      measurements.push({ durationMs: duration, realExecutionMs: result.realExecutionMs, eventBoundaries: result.metrics.eventBoundaries, combatSelections: result.metrics.combatSelections, autoCastChecks: result.metrics.autoCastChecks, researchPlannerCalls: result.metrics.researchPlannerCalls, transmutationPlannerCalls: result.metrics.transmutationPlannerCalls, continuousManaAllocationCalls: result.metrics.continuousManaAllocationCalls, timing: result.metrics.timing })
      expect(result.metrics.combatSelections).toBeGreaterThan(0)
    }
    console.info('[Offline Bank] real active combat benchmark', measurements)
  }, 30_000)

  it('advances exactly one hour through the transactional Offline Bank path', async () => {
    const state = activeAutoCastCombatState()
    state.offlineBankMs = 3_600_000
    const killsBefore = state.progress.lifetimeKills
    const progress: Array<{ phase: string; percent: number }> = []

    const result = await advanceWithOfflineBank(3_600_000, () => state, (recipe) => recipe(state), vi.fn(), undefined, undefined, (entry) => progress.push(entry))

    expect(result.ok, result.error).toBe(true)
    expect(state.offlineBankMs).toBe(0)
    expect(result.report?.durationMs).toBe(3_600_000)
    expect(result.report?.combat.killsTotal).toBeGreaterThan(0)
    expect(state.progress.lifetimeKills).toBeGreaterThan(killsBefore)
    expect(progress.some((entry) => entry.phase === 'simulating')).toBe(true)
    expect(progress[progress.length - 1]).toEqual({ phase: 'saving', percent: 100 })
  }, 180_000)

  it('keeps real Auto-Cast combat identical to the fixed-quantum reference', async () => {
    const fast = activeAutoCastCombatState()
    const reference = JSON.parse(JSON.stringify(fast)) as typeof fast
    await advanceGameStateBanked(fast, 15_000, { mode: 'banked' })
    await advanceGameStateBankedReference(reference, 15_000, { mode: 'banked' })
    expect(fast).toEqual(reference)
  })

  it.each([60_000, 300_000, 900_000, 3_600_000])('debits and reports the exact requested duration (%s ms)', async (durationMs) => {
    const state = activeCombatState()
    state.offlineBankMs = durationMs + 1_000
    state.activities.channeling.echoesAssigned = 5
    const manaGeneratedBefore = state.progress.channeling.totalManaGenerated
    const bankBefore = state.offlineBankMs

    const result = await advanceWithOfflineBank(durationMs, () => state, (recipe) => recipe(state), vi.fn())

    expect(result.ok, result.error).toBe(true)
    expect(state.offlineBankMs).toBe(bankBefore - durationMs)
    expect(result.report?.durationMs).toBe(durationMs)
    expect(state.progress.channeling.totalManaGenerated).toBeGreaterThan(manaGeneratedBefore)
  })

  it('rejects a request above one hour without spending banked time', async () => {
    const state = activeCombatState()
    state.offlineBankMs = 7_200_000

    const result = await advanceWithOfflineBank(3_600_001, () => state, (recipe) => recipe(state), vi.fn())

    expect(result).toEqual({ ok: false, error: 'Offline Bank advances are limited to one hour.' })
    expect(state.offlineBankMs).toBe(7_200_000)
  })

  it('keeps long Research production in parity while jumping between completions', async () => {
    const fast = createInitialState()
    fast.inventory['fire-fragment'] = 3
    fast.player.mana = fast.player.maxMana
    fast.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 3, remainingQuantity: 3, progressMs: 0, echoesAssigned: 1, status: 'running' }
    const reference = JSON.parse(JSON.stringify(fast)) as typeof fast

    const fastResult = await advanceGameStateBanked(fast, 15_000, { mode: 'banked' })
    const referenceResult = await advanceGameStateBankedReference(reference, 15_000, { mode: 'banked' })

    expect(fast).toEqual(reference)
    expect(fastResult.metrics.eventBoundaries).toBeLessThan(referenceResult.metrics.eventBoundaries)
    expect(fastResult.metrics.researchCompletions).toBeGreaterThan(0)
  })

  it('keeps one-hour Research production in parity', async () => {
    const fast = createInitialState()
    fast.inventory['fire-fragment'] = 100
    fast.player.mana = fast.player.maxMana
    fast.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 100, remainingQuantity: 100, progressMs: 0, echoesAssigned: 1, status: 'running' }
    const reference = JSON.parse(JSON.stringify(fast)) as typeof fast

    await advanceGameStateBanked(fast, 3_600_000, { mode: 'banked' })
    await advanceGameStateBankedReference(reference, 3_600_000, { mode: 'banked' })

    expect(fast).toEqual(reference)
    expect(fast.schools.fire.xp).toBeGreaterThan(0)
  }, 60_000)

  it('keeps the mixed Combat/Transmutation boundary transition in parity', async () => {
    const fast = activeAutoCastCombatState()
    fast.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    const reference = JSON.parse(JSON.stringify(fast)) as typeof fast

    await advanceGameStateBanked(fast, 10_000, { mode: 'banked' })
    await advanceGameStateBankedReference(reference, 10_000, { mode: 'banked' })

    expect(fast.progress.lifetimeKills).toBe(reference.progress.lifetimeKills)
    expect(fast.inventory).toEqual(reference.inventory)
    expect(fast.combat.enemyId).toBe(reference.combat.enemyId)
    expect(fast.combat.enemyHp).toBeCloseTo(reference.combat.enemyHp, 6)
    expect(fast.activities.transmutation.jobs['fire-fragment']?.progressMs).toBeCloseTo(reference.activities.transmutation.jobs['fire-fragment']?.progressMs ?? 0, 6)
    expect(fast.player.mana).toBeCloseTo(reference.player.mana, 5)
  }, 60_000)

  it('advances one hour with active Transmutation production', async () => {
    const state = createInitialState()
    state.offlineBankMs = 3_600_000
    state.player.mana = state.player.maxMana
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }
    const before = state.inventory['fire-fragment'] ?? 0

    const result = await advanceWithOfflineBank(3_600_000, () => state, (recipe) => recipe(state), vi.fn())

    expect(result.ok, result.error).toBe(true)
    expect(state.offlineBankMs).toBe(0)
    expect(result.report?.durationMs).toBe(3_600_000)
    expect(result.report?.production.transmutation).toMatchObject({ 'fire-fragment': expect.any(Number) })
    expect(state.inventory['fire-fragment'] ?? 0).toBeGreaterThan(before)
  }, 60_000)

  it('advances one hour with active Combat and Transmutation together', async () => {
    const state = activeAutoCastCombatState()
    state.offlineBankMs = 3_600_000
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }

    const result = await advanceWithOfflineBank(3_600_000, () => state, (recipe) => recipe(state), vi.fn())

    expect(result.ok, result.error).toBe(true)
    expect(state.offlineBankMs).toBe(0)
    expect(result.report?.durationMs).toBe(3_600_000)
    expect(result.report?.combat.killsTotal).toBeGreaterThan(0)
    expect(result.report?.production.transmutation['fire-fragment']).toBeGreaterThan(0)
  }, 180_000)

  it('runs detached and commits gameplay/analytics once', async () => {
    const state = activeCombatState()
    state.offlineBankMs = 5_000
    const setState = vi.fn((recipe: (current: typeof state) => void) => recipe(state))
    const liveTelemetry = { advance: vi.fn() }
    const liveStatistics = { advance: vi.fn() }
    const detachedTelemetry = { advance: vi.fn() }
    const detachedStatistics = { advance: vi.fn() }
    const commit = vi.fn()

    const result = await advanceWithOfflineBank(5_000, () => state, setState, vi.fn(), undefined, {
      telemetry: liveTelemetry as never,
      statistics: liveStatistics as never,
      createDetached: () => ({ telemetry: detachedTelemetry as never, statistics: detachedStatistics as never, commit }),
    })

    expect(result.ok, result.error).toBe(true)
    expect(setState).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledTimes(1)
    expect(detachedTelemetry.advance).toHaveBeenCalled()
    expect(detachedStatistics.advance).toHaveBeenCalled()
    expect(liveTelemetry.advance).not.toHaveBeenCalled()
    expect(liveStatistics.advance).not.toHaveBeenCalled()
    expect(state.offlineBankMs).toBe(0)
  })

  it('passes analytics observers and an event sink into banked simulation', async () => {
    const state = activeCombatState()
    const uiEvents = { push: vi.fn() }
    const telemetry = { advance: vi.fn() }
    const statistics = { advance: vi.fn() }

    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => recipe(state), vi.fn(), undefined, { uiEvents, telemetry: telemetry as never, statistics: statistics as never })

    expect(result.ok).toBe(true)
    expect(telemetry.advance).toHaveBeenCalledTimes(1)
    expect(telemetry.advance).toHaveBeenCalledWith(1_000, state)
    expect(statistics.advance).toHaveBeenCalledTimes(1)
    expect(statistics.advance).toHaveBeenCalledWith(1_000, state)
    expect(state.offlineBankMs).toBe(0)
  })

  it('routes each resolved event to detached analytics once without touching live observers', async () => {
    const state = activeAutoCastCombatState()
    state.offlineBankMs = 2_000
    const detachedTelemetry = createCombatTelemetryAccumulator()
    const detachedStatistics = createDungeonStatisticsAccumulator()
    const detachedEvents: CombatEvent[] = []
    const uiEvents: CombatEvent[] = []
    const liveTelemetry = { advance: vi.fn(), consume: vi.fn() }
    const liveStatistics = { advance: vi.fn(), consume: vi.fn() }
    const combatEvents = {
      push: vi.fn((event: CombatEvent) => {
        detachedEvents.push(event)
        detachedTelemetry.consume(event)
        detachedStatistics.consume(event)
      }),
    }

    const result = await advanceWithOfflineBank(2_000, () => state, (recipe) => recipe(state), vi.fn(), undefined, {
      telemetry: liveTelemetry as never,
      statistics: liveStatistics as never,
      uiEvents: { push: (event) => uiEvents.push(event) },
      createDetached: () => ({ telemetry: detachedTelemetry, statistics: detachedStatistics, combatEvents, commit: vi.fn() }),
    })

    expect(result.ok, result.error).toBe(true)
    expect(detachedEvents.length).toBeGreaterThan(0)
    expect(detachedEvents).toEqual(uiEvents)
    expect(combatEvents.push).toHaveBeenCalledTimes(detachedEvents.length)
    expect(detachedEvents.some((event) => event.category === 'spell')).toBe(true)
    expect(detachedTelemetry.getState().run?.player.damageDone.total).toBeGreaterThan(0)
    expect(liveTelemetry.consume).not.toHaveBeenCalled()
    expect(liveStatistics.consume).not.toHaveBeenCalled()
  })

  it('restores analytics when banked simulation fails after observer delivery', async () => {
    const state = activeCombatState()
    const snapshot = { run: { engagedMs: 10 }, session: { elapsedMs: 20 } }
    const restore = vi.fn()
    const telemetry = { advance: vi.fn(() => { throw new Error('forced bank failure') }) }
    const statistics = { advance: vi.fn() }

    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => recipe(state), vi.fn(), undefined, { telemetry: telemetry as never, statistics: statistics as never, snapshot: () => snapshot, restore })

    expect(result).toMatchObject({ ok: false, error: 'forced bank failure' })
    expect(state.offlineBankMs).toBe(1_000)
    expect(statistics.advance).not.toHaveBeenCalled()
    expect(restore).toHaveBeenCalledWith(snapshot)
  })

  it('returns one useful defeat payload when the banked fight loses deterministically', async () => {
    const state = activeCombatState()
    state.player.health = 1
    state.debug.freezeEnemyActions = false
    spawnEnemy(state, 'forest-wisp')
    startNextEnemyAction(state, executeCombatEffects)
    state.combat.enemyActionTimerMs = 1

    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => recipe(state), vi.fn())

    expect(result.ok).toBe(true)
    expect(result.combatDefeat?.event.sourceId).toBe('player-defeated')
    expect(result.combatDefeat?.recentEvents.some((event) => (event.healthDamage ?? 0) > 0)).toBe(true)
    expect(result.combatDefeat?.recentEvents.some((event) => event.sourceId === 'player-defeated')).toBe(true)
  })

  it('reports and returns successful banked Artifact completions after the simulation commits', async () => {
    const state = createInitialState()
    state.offlineBankMs = 5_000
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    state.inventory['fire-fragment'] = 20
    state.inventory['artifact-essence'] = 20
    state.activities.artificing.activeJob = { kind: 'recipe', recipeId: 'ember-staff' }

    const result = await advanceWithOfflineBank(5_000, () => state, (recipe) => recipe(state), vi.fn(), undefined)

    expect(result.ok).toBe(true)
    expect(result.completedArtificingRecipeIds).toEqual(['ember-staff'])
    expect(result.report?.production.craftsByRecipe['ember-staff']).toBe(1)
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.activities.artificing.activeJob).toBeNull()
  })

  it('does not expose a banked completion when the simulation rolls back', async () => {
    const state = createInitialState()
    state.offlineBankMs = 5_000
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 1
    state.inventory['fire-fragment'] = 20
    state.inventory['artifact-essence'] = 20
    state.activities.artificing.activeJob = { kind: 'recipe', recipeId: 'ember-staff' }
    const before = JSON.stringify(state)

    const result = await advanceWithOfflineBank(5_000, () => state, (recipe) => recipe(state), () => { throw new Error('save failed') })

    expect(result.ok).toBe(false)
    expect(result.completedArtificingRecipeIds).toBeUndefined()
    expect(result.combatDefeat).toBeUndefined()
    expect(JSON.stringify(state)).toBe(before)
  })
})

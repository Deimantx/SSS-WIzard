import { describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceWithOfflineBank } from './offlineBankSimulation'
import { executeCombatEffects } from '../combat/effectResolver'
import { spawnEnemy } from '../combat/combatRuntime'
import { startNextEnemyAction } from '../combat/actionRuntime'
import { advanceGameStateBanked, advanceGameStateBankedReference } from './offlineBankFastForward'

const activeCombatState = () => {
  const state = createInitialState()
  state.offlineBankMs = 1_000
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.enemyId = 'forest-wisp'
  state.combat.enemyHp = state.combat.enemyMaxHp = 100
  state.debug.freezePlayerActions = true
  state.debug.freezeEnemyActions = true
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

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { prepareResearchAction, setResearchEchoesAction } from '../../../store/actions/researchActions'
import { advanceGameState } from './advanceGameState'
import { allocateContinuousMana, requestedManaForProgress, type ContinuousManaWorkRequest } from './continuousManaScheduler'
import { advanceTransmutation } from '../transmutation/transmutationEngine'
import { getManaFlowBreakdown } from '../channeling/manaFlow'

const advance = (state: ReturnType<typeof createInitialState>, durationMs: number, stepMs = 100) => {
  for (let elapsed = 0; elapsed < durationMs; elapsed += stepMs) advanceGameState(state, Math.min(stepMs, durationMs - elapsed), { mode: 'banked' })
}

describe('continuous Mana scheduler', () => {
  it('allocates the same funding ratio to every positive-Mana consumer', () => {
    const state = createInitialState()
    state.player.mana = 0
    const makeRequest = (key: string): ContinuousManaWorkRequest => ({ key, system: 'transmutation', sourceId: key, requestedProgressMs: 100, manaPerCycle: 15, cycleDurationMs: 6000, requestedMana: requestedManaForProgress(15, 100, 6000) })
    const result = allocateContinuousMana(state, [makeRequest('fire'), makeRequest('air')])
    expect(result.fundingRatio).toBe(0)
    expect(result.allocations.fire.fundedProgressMs).toBe(0)
    expect(result.allocations.air.fundedProgressMs).toBe(0)
    expect(state.player.mana).toBe(0)
  })

  it('does not pre-complete one Echo work while Mana is accumulating', () => {
    const state = createInitialState()
    state.player.mana = 0
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    advance(state, 5_900)
    expect(state.inventory['fire-fragment'] ?? 0).toBe(0)
    expect(state.player.mana).toBeCloseTo(14.75, 8)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBeCloseTo(5900, 8)
    advance(state, 100)
    expect(state.inventory['fire-fragment']).toBe(1)
    expect(state.player.mana).toBeCloseTo(15, 8)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBeCloseTo(0, 8)
  })

  it('throttles five Echoes to two Fire Fragments in six seconds at 5 Mana/s', () => {
    const state = createInitialState()
    state.player.mana = 0
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }
    advance(state, 6_000)
    expect(state.inventory['fire-fragment']).toBe(2)
    expect(state.player.mana).toBeCloseTo(0, 8)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBeCloseTo(0, 8)
  })

  it('keeps five Echoes at their intended 1.2 second cycle when fully funded', () => {
    const state = createInitialState()
    state.player.mana = 100
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }
    advanceTransmutation(state, 1_100)
    expect(state.inventory['fire-fragment'] ?? 0).toBe(0)
    advanceTransmutation(state, 100)
    expect(state.inventory['fire-fragment']).toBe(1)
  })

  it('does not request Mana for a material recipe that cannot start', () => {
    const state = createInitialState()
    state.progress.firstBossKill = true
    state.player.mana = 100
    state.activities.transmutation.jobs['ember-staff'] = { echoesAssigned: 1, progressMs: 0 }
    advance(state, 1_000)
    expect(state.player.mana).toBe(100)
    expect(state.activities.transmutation.jobs['ember-staff']?.progressMs).toBe(0)
    expect(getManaFlowBreakdown(state).demand).toBe(0)
  })

  it('shares scarce Mana fairly across four elemental recipes', () => {
    const state = createInitialState()
    state.player.mana = 0
    ;(['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'] as const).forEach((recipeId) => {
      state.activities.transmutation.jobs[recipeId] = { echoesAssigned: 1, progressMs: 0 }
    })
    advance(state, 12_000)
    expect(state.inventory['fire-fragment']).toBe(1)
    expect(state.inventory['water-fragment']).toBe(1)
    expect(state.inventory['earth-fragment']).toBe(1)
    expect(state.inventory['air-fragment']).toBe(1)
  })

  it('funds Research and Transmutation together instead of privileging Research', () => {
    const state = createInitialState()
    state.player.mana = 0
    state.inventory['fire-fragment'] = 10
    prepareResearchAction(state, 'fire-fragment', 'fire', 1)
    setResearchEchoesAction(state, 'research-1', 1)
    state.activities.transmutation.jobs['water-fragment'] = { echoesAssigned: 5, progressMs: 0 }
    advance(state, 1_000)
    expect(state.activities.research.slots['research-1']?.progressMs).toBeGreaterThan(0)
    expect(state.activities.transmutation.jobs['water-fragment']?.progressMs).toBeGreaterThan(0)
    expect(state.inventory['fire-fragment']).toBe(10)
  })
})

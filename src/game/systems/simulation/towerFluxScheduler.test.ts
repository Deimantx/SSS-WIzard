import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { allocateTowerFlux, requestedFluxForProgress } from './towerFluxScheduler'

describe('Tower Flux scheduler', () => {
  it('shares a constrained Flux buffer proportionally across Tower work', () => {
    const state = createInitialState()
    state.tower.resources.arcaneFlux = 5
    const request = (key: string) => ({ key, system: 'research' as const, sourceId: key, requestedProgressMs: 1000, fluxPerCycle: 10, cycleDurationMs: 1000, requestedFlux: requestedFluxForProgress(10, 1000, 1000) })
    const result = allocateTowerFlux(state, [request('a'), request('b')])
    expect(result.fundingRatio).toBeCloseTo(0.25)
    expect(result.spentFlux).toBeCloseTo(5)
    expect(result.allocations.a.fundedProgressMs).toBeCloseTo(250)
    expect(result.allocations.b.fundedProgressMs).toBeCloseTo(250)
    expect(state.tower.resources.arcaneFlux).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { prepareResearchAction } from '../../../store/actions/researchActions'
import { assignResearchAcolyteAction, assignTransmutationAcolyteAction } from '../../../store/actions/acolyteActions'
import { advanceGameState } from './advanceGameState'
import { advanceWithOfflineBank } from '../offline-bank/offlineBankSimulation'

const offlineAdvance = async (state: ReturnType<typeof createInitialState>, durationMs: number) => {
  state.offlineBankMs = durationMs
  const result = await advanceWithOfflineBank(durationMs, () => state, (recipe) => recipe(state), () => {})
  expect(result.ok).toBe(true)
  return state
}
const liveAdvance = (state: ReturnType<typeof createInitialState>, durationMs: number) => {
  for (let elapsed = 0; elapsed < durationMs; elapsed += 100) advanceGameState(state, Math.min(100, durationMs - elapsed), { mode: 'live' })
}

describe('Tower work live/offline parity', () => {
  it('completes an elemental Transmutation cycle from Flux and Resonance in both modes', async () => {
    const live = createInitialState()
    live.tower.resources.arcaneFlux = 10
    live.resonance.fire = 5
    expect(assignTransmutationAcolyteAction(live, 'fire-fragment')).toBe(true)
    liveAdvance(live, 8_000)

    const offline = createInitialState()
    offline.tower.resources.arcaneFlux = 10
    offline.resonance.fire = 5
    expect(assignTransmutationAcolyteAction(offline, 'fire-fragment')).toBe(true)
    await offlineAdvance(offline, 8_000)

    expect(offline.inventory['fire-fragment']).toBe(live.inventory['fire-fragment'])
    expect(offline.resonance.fire).toBe(live.resonance.fire)
    expect(offline.tower.resources.arcaneFlux).toBeCloseTo(live.tower.resources.arcaneFlux, 6)
    expect(offline.activities.transmutation.jobs['fire-fragment']?.progressMs ?? 0).toBeCloseTo(live.activities.transmutation.jobs['fire-fragment']?.progressMs ?? 0, 6)
  })

  it('completes one Research cycle with one Acolyte and Flux in both modes', async () => {
    const setup = () => {
      const state = createInitialState()
      state.inventory['fire-fragment'] = 1
      state.tower.resources.arcaneFlux = 5
      expect(prepareResearchAction(state, 'fire-fragment', 'fire', 1)).toBe(true)
      expect(assignResearchAcolyteAction(state, 'research-1')).toBe(true)
      return state
    }
    const live = setup()
    liveAdvance(live, 10_000)
    const offline = await offlineAdvance(setup(), 10_000)

    expect(offline.inventory['fire-fragment'] ?? 0).toBe(live.inventory['fire-fragment'] ?? 0)
    expect(offline.schools.fire.xp).toBe(live.schools.fire.xp)
    expect(offline.activities.research.slots['research-1']).toEqual(live.activities.research.slots['research-1'])
    expect(offline.tower.resources.arcaneFlux).toBeCloseTo(live.tower.resources.arcaneFlux, 6)
  })
})

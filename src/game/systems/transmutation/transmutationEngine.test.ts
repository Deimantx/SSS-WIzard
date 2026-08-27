import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceTransmutation } from './transmutationEngine'

const run = (stepMs: number, durationMs = 6_000) => {
  const state = createInitialState()
  state.player.mana = 10_000
  state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }
  for (let elapsed = 0; elapsed < durationMs; elapsed += stepMs) advanceTransmutation(state, Math.min(stepMs, durationMs - elapsed), { mode: 'live' })
  return { output: state.inventory['fire-fragment'] ?? 0, mana: state.player.mana, progress: state.activities.transmutation.jobs['fire-fragment']?.progressMs ?? 0, notifications: state.notifications }
}

describe('Transmutation simulation', () => {
  it('completes five Fire Fragment crafts from five Echoes over six seconds', () => {
    const state = createInitialState()
    state.player.mana = 100
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }

    advanceTransmutation(state, 6_000, { mode: 'live' })

    expect(state.inventory['fire-fragment']).toBe(5)
    expect(state.player.mana).toBe(25)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBe(0)
  })

  it('is invariant across 100ms, 250ms, and 1000ms chunks', () => {
    const results = [100, 250, 1_000].map((stepMs) => run(stepMs))
    expect(results[0]).toEqual(results[1])
    expect(results[1]).toEqual(results[2])
    expect(results[0]).toMatchObject({ output: 5, mana: 9_925, progress: 0, notifications: [] })
  })

  it('preserves overflow for multiple crafts and stops starved work at one ready cycle', () => {
    const state = createInitialState()
    state.player.mana = 15
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 5_000 }

    advanceTransmutation(state, 1_000, { mode: 'banked' })

    expect(state.inventory['fire-fragment']).toBe(1)
    expect(state.player.mana).toBe(2.5)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBe(4_000)
  })

  it('does not create routine completion toasts', () => {
    const state = createInitialState()
    state.player.mana = 1_500
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }

    for (let index = 0; index < 100; index += 1) advanceTransmutation(state, 1_200, { mode: 'live' })

    expect(state.inventory['fire-fragment']).toBe(100)
    expect(state.notifications).toEqual([])
  })
})

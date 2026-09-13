import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceTransmutation, forceCompleteTransmutationCycle } from './transmutationEngine'

const run = (stepMs: number, durationMs = 8_000) => {
  const state = createInitialState()
  state.player.mana = 10_000
  state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }
  for (let elapsed = 0; elapsed < durationMs; elapsed += stepMs) advanceTransmutation(state, Math.min(stepMs, durationMs - elapsed), { mode: 'live' })
  return { output: state.inventory['fire-fragment'] ?? 0, mana: state.player.mana, progress: state.activities.transmutation.jobs['fire-fragment']?.progressMs ?? 0, notifications: state.notifications }
}

describe('Transmutation simulation', () => {
  it('completes five Fire Fragment crafts from five Echoes over eight seconds', () => {
    const state = createInitialState()
    state.player.mana = 150
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }

    advanceTransmutation(state, 8_000, { mode: 'live' })

    expect(state.inventory['fire-fragment']).toBe(5)
    expect(state.player.mana).toBe(25)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBe(0)
  })

  it('is invariant across 100ms, 250ms, and 1000ms chunks', () => {
    const results = [100, 250, 1_000].map((stepMs) => run(stepMs))
    expect(results[0]).toEqual(results[1])
    expect(results[1]).toEqual(results[2])
    expect(results[0]).toMatchObject({ output: 5, mana: 9_875, progress: 0, notifications: [] })
  })

  it('preserves overflow for multiple crafts and stops starved work at one ready cycle', () => {
    const state = createInitialState()
    state.player.mana = 15
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 5_000 }

    advanceTransmutation(state, 1_000, { mode: 'banked' })

    expect(state.inventory['fire-fragment']).toBe(1)
    expect(state.player.mana).toBe(0)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBe(1_800)
  })

  it('does not create routine completion toasts', () => {
    const state = createInitialState()
    state.player.mana = 2_500
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 5, progressMs: 0 }

    for (let index = 0; index < 100; index += 1) advanceTransmutation(state, 1_600, { mode: 'live' })

    expect(state.inventory['fire-fragment']).toBe(100)
    expect(state.notifications).toEqual([])
  })

  it('does not let the developer completion action bypass a recipe unlock', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 10
    state.inventory['artifact-essence'] = 10

    expect(forceCompleteTransmutationCycle(state, 'ember-staff' as import('../../types').TransmutationRecipeId, { mode: 'live' })).toBe(false)
    expect(state.inventory['ember-staff']).toBeUndefined()
    expect((state.activities.transmutation.jobs as Record<string, { echoesAssigned: number; progressMs: number }>)['ember-staff']).toBeUndefined()
  })

  it('applies Temporal work speed and Mana Refinement to funded work', () => {
    const state = createInitialState()
    state.player.mana = 100
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    state.progress.transmutation.arrays['temporal-array'].level = 10
    state.progress.transmutation.arrays['mana-refinement-array'].level = 10

    advanceTransmutation(state, 8_000, { mode: 'live' })

    expect(state.inventory['fire-fragment']).toBe(1)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBeCloseTo(2_400, 6)
    expect(state.player.mana).toBeCloseTo(74, 6)
  })

  it('resolves deterministic preservation and replication at completion', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 6
    state.inventory['water-fragment'] = 6
    state.inventory['earth-fragment'] = 6
    state.inventory['air-fragment'] = 6
    state.inventory['life-essence'] = 10
    state.progress.transmutation.arrays['conservation-array'].level = 10
    state.progress.transmutation.arrays['replication-array'].level = 10
    const rolls = [0, 0]
    const report: { quantity?: number; ingredients?: { itemId: import('../../types').ItemId; quantity: number }[] } = {}

    expect(forceCompleteTransmutationCycle(state, 'prismatic-fragment', { mode: 'live', random: () => rolls.shift() ?? 1, report: { recordTransmutation: (_id, _output, quantity, ingredients) => { report.quantity = quantity; report.ingredients = ingredients } } })).toBe(true)
    expect(state.inventory['prismatic-fragment']).toBe(2)
    expect(state.inventory['fire-fragment']).toBe(6)
    expect(state.inventory['life-essence']).toBe(10)
    expect(report).toEqual({ quantity: 2, ingredients: [] })
  })
})

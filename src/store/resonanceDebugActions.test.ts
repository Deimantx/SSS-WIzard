import { afterEach, describe, expect, it } from 'vitest'
import { RESONANCE_TYPES } from '../game/content/resonance/resonance'
import { useGameStore } from './gameStore'

describe('Developer Resonance controls', () => {
  afterEach(() => useGameStore.getState().debugClearAllResonance())

  it('sets, adds, clears, and grants a complete five-type test bundle', () => {
    const store = useGameStore.getState()
    store.debugSetResonance('arcane', 7)
    store.debugGrantResonance('arcane', 5)
    expect(useGameStore.getState().resonance.arcane).toBe(12)

    store.debugGrantResonanceTestBundle()
    for (const type of RESONANCE_TYPES) expect(useGameStore.getState().resonance[type]).toBe(type === 'arcane' ? 112 : 100)

    store.debugClearResonance('arcane')
    expect(useGameStore.getState().resonance.arcane).toBe(0)
    store.debugClearAllResonance()
    expect(useGameStore.getState().resonance).toEqual({ fire: 0, water: 0, earth: 0, air: 0, arcane: 0 })
  })
})

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { simulateSigilDrops } from './sigilDropSimulation'

describe('sigil drop simulation', () => {
  it('does not mutate profile storage, counters, discovery, dust, or sequence', () => {
    const state = createInitialState()
    const before = JSON.parse(JSON.stringify(state.sigils))
    const result = simulateSigilDrops({ locationId: 'whispering-woods', enemyId: 'forest-wisp', worldTier: 1, attunedSetId: 'arcane', iterations: 10_000, seed: 42 })

    expect(result.sigilsFound).toBe(10_000)
    expect(result.autoSalvageDustEstimate).toBeGreaterThan(0)
    expect(state.sigils).toEqual(before)
  })
})

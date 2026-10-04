import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { resolveBossThreatRequirement, resolveThreatGainForKill } from './combatThreat'

describe('canonical combat Threat', () => {
  it('uses authored location requirements and enemy Power deterministically', () => {
    expect(resolveBossThreatRequirement('whispering-woods')).toBe(resolveBossThreatRequirement('whispering-woods'))
    expect(resolveBossThreatRequirement('abandoned-catacombs')).toBeGreaterThan(0)
    const state = createInitialState()
    state.combat.locationId = 'whispering-woods'
    expect(resolveThreatGainForKill(state, 'forest-wisp')).toBe(resolveThreatGainForKill(state, 'forest-wisp'))
    expect(resolveThreatGainForKill(state, 'forest-wisp')).toBeGreaterThan(0)
  })
})

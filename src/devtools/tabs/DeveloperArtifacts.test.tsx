import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/../store/initialState'
import { debugSetArtifactMinorRank, debugMaxArtifact, debugResetArtifact } from '../../game/systems/artifacts/artifactProgression'

describe('Artifact developer rank controls', () => {
  it('sets, maxes, and resets Minor ranks without legacy path payloads', () => {
    const state = createInitialState()
    state.debug.artifactIgnoreOwnership = true
    debugSetArtifactMinorRank(state, 'ember-staff', 'arcane-embers', 4)
    expect(state.artifactProgress['ember-staff']?.minorRanks['arcane-embers']).toBe(4)
    debugMaxArtifact(state, 'ember-staff')
    expect(Object.values(state.artifactProgress['ember-staff']?.minorRanks ?? {})).toEqual([10, 10, 10, 10, 10])
    debugResetArtifact(state, 'ember-staff')
    expect(state.artifactProgress['ember-staff']?.minorRanks).toEqual({})
  })
})

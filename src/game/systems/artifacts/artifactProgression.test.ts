import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { debugMaxArtifact, debugResetArtifact, getArtifactNextMajorMilestone, getArtifactRankCost, getArtifactUnlockedMajorMilestones, purchaseArtifactMinorRank } from './artifactProgression'

describe('Artifact rank progression', () => {
  it('starts empty and unlocks automatic Majors by total invested ranks', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.artifactProgress['ember-staff'] = { minorRanks: { 'arcane-embers': 10 } }
    expect(getArtifactUnlockedMajorMilestones(state, 'ember-staff')).toHaveLength(1)
    expect(getArtifactNextMajorMilestone(state, 'ember-staff')?.unlockAtTotalRanks).toBe(20)
  })

  it('rejects rank purchases atomically when any resource is missing', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.artifactProgress['ember-staff'] = { minorRanks: {} }
    state.inventory['artifact-essence'] = 15
    const result = purchaseArtifactMinorRank(state, 'ember-staff', 'arcane-embers')
    expect(result).toEqual({ ok: false, reason: 'insufficient-fragment' })
    expect(state.inventory['artifact-essence']).toBe(15)
    expect(state.artifactProgress['ember-staff']?.minorRanks).toEqual({})
  })

  it('supports only the explicit rank debug controls', () => {
    const state = createInitialState()
    debugMaxArtifact(state, 'ember-staff')
    expect(state.artifactProgress['ember-staff']?.minorRanks).toMatchObject({ 'arcane-embers': 10 })
    state.debug.artifactIgnoreOwnership = true
    debugMaxArtifact(state, 'ember-staff')
    expect(state.artifactProgress['ember-staff']?.minorRanks['arcane-embers']).toBe(10)
    debugResetArtifact(state, 'ember-staff')
    expect(state.artifactProgress['ember-staff']?.minorRanks).toEqual({})
  })

  it('exposes the authored next-rank cost without deriving legacy levels', () => {
    expect(getArtifactRankCost('ember-staff', 'arcane-embers', 1)).toMatchObject({ artifactEssence: 15, fragment: { quantity: 50 }, resonance: { fire: 50 } })
  })
})

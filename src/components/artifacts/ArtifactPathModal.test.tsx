import { describe, expect, it } from 'vitest'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import { getArtifactRankGraph } from '../../game/presentation/artifacts/artifactPathReadModel'
import { createInitialState } from '../../store/initialState'
import { getArtifactNextMajorMilestone, getArtifactTotalInvestedRanks } from '../../game/systems/artifacts/artifactProgression'

describe('Artifact rank path read model', () => {
  it('renders Minor circles and Major milestone squares from authored content', () => {
    const graph = getArtifactRankGraph(ARTIFACTS['ember-staff'])
    expect(graph.minorNodes).toHaveLength(5)
    expect(graph.majorNodes).toHaveLength(5)
    expect(graph.connections.length).toBeGreaterThan(0)
  })

  it('reports next milestone from total invested ranks', () => {
    const state = createInitialState()
    state.artifactProgress['ember-staff'] = { minorRanks: { 'arcane-embers': 10 } }
    expect(getArtifactTotalInvestedRanks(state, 'ember-staff')).toBe(10)
    expect(getArtifactNextMajorMilestone(state, 'ember-staff')?.unlockAtTotalRanks).toBe(20)
  })
})

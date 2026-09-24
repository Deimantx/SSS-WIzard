import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ArtifactTreeGraph } from './ArtifactTreeGraph'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import { getArtifactRankGraph } from '../../game/presentation/artifacts/artifactPathReadModel'
import { createInitialState } from '../../store/initialState'
import { getArtifactNextMajorMilestone, getArtifactTotalInvestedRanks } from '../../game/systems/artifacts/artifactProgression'

describe('Artifact rank path read model', () => {
  it('renders Minor circles and Major milestone squares from authored content', () => {
    const graph = getArtifactRankGraph(ARTIFACTS['ember-staff'])
    expect(graph.minorNodes).toHaveLength(5)
    expect(graph.majorNodes).toHaveLength(5)
    expect(graph.connections).toHaveLength(0)
    expect(graph.minorNodes.map((node) => [node.x / graph.width, node.y / graph.height])).toEqual([[0.5, 0.1], [0.27, 0.32], [0.73, 0.32], [0.33, 0.6], [0.67, 0.6]])
  })

  it('reports next milestone from total invested ranks', () => {
    const state = createInitialState()
    state.artifactProgress['ember-staff'] = { minorRanks: { 'arcane-embers': 10 } }
    expect(getArtifactTotalInvestedRanks(state, 'ember-staff')).toBe(10)
    expect(getArtifactNextMajorMilestone(state, 'ember-staff')?.unlockAtTotalRanks).toBe(20)
  })

  it('shows every compact ordinary effect on a Major graph card', () => {
    const state = createInitialState()
    render(<ArtifactTreeGraph state={state} artifactId="wispveil-hood" selectedNodeId={null} onSelect={() => undefined} />)

    const card = screen.getByRole('button', { name: /Arcane Sight/ })
    expect(within(card).getByText(/Spell Power/)).toBeTruthy()
    expect(within(card).getByText(/Status duration/i)).toBeTruthy()
    expect(card.querySelectorAll('.artifact-node-effects > span')).toHaveLength(2)

    const signatureCard = screen.getByRole('button', { name: /Edrin's Veil/ })
    expect(within(signatureCard).getByText(/11.25 Spell Power/)).toBeTruthy()
    expect(within(signatureCard).getByText(/Critical Strike chance/i)).toBeTruthy()
    expect(within(signatureCard).getByText(/Status duration/i)).toBeTruthy()
    expect(within(signatureCard).getByText('SPECIAL EFFECT')).toBeTruthy()
    expect(signatureCard.textContent).not.toContain('After 5s without casting')
  })
})

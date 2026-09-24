import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ArtifactSummaryInspector } from './ArtifactNodeInspector'
import { ArtifactTreeGraph } from './ArtifactTreeGraph'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import { getArtifactRankGraph, MAJOR_ROW_Y_OFFSET_PX } from '../../game/presentation/artifacts/artifactPathReadModel'
import { getArtifactCurrentResolvedEffects } from '../../game/systems/artifacts/artifactProgression'
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

  it('keeps Majors aligned while applying the named ten-pixel breathing-room offset', () => {
    const graph = getArtifactRankGraph(ARTIFACTS['ember-staff'])
    expect(graph.majorNodes.map((node) => node.y)).toEqual([420 + MAJOR_ROW_Y_OFFSET_PX, 420 + MAJOR_ROW_Y_OFFSET_PX, 420 + MAJOR_ROW_Y_OFFSET_PX, 420 + MAJOR_ROW_Y_OFFSET_PX, 420 + MAJOR_ROW_Y_OFFSET_PX])
  })

  it('shows the current baseline in the default Artifact Summary', () => {
    const state = createInitialState()
    render(<ArtifactSummaryInspector state={state} artifactId="ember-staff" />)

    expect(screen.getByRole('region', { name: 'Artifact Summary' })).toBeTruthy()
    expect(screen.getByText(/15 Spell Power/)).toBeTruthy()
    expect(screen.getByText('None yet')).toBeTruthy()
  })

  it('clears selection on an empty click but not after graph dragging', () => {
    const state = createInitialState()
    const clearSelection = vi.fn()
    render(<ArtifactTreeGraph state={state} artifactId="ember-staff" selectedNodeId="arcane-embers" onSelect={() => undefined} onClearSelection={clearSelection} />)
    const viewport = screen.getByLabelText('Artifact rank progression track')

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 100, clientY: 100 })
    expect(clearSelection).toHaveBeenCalledTimes(1)

    fireEvent.pointerDown(viewport, { pointerId: 2, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 110, clientY: 100 })
    fireEvent.pointerUp(viewport, { pointerId: 2, clientX: 110, clientY: 100 })
    expect(clearSelection).toHaveBeenCalledTimes(1)
  })

  it('adds unlocked Major effects to the canonical current Artifact result', () => {
    const state = createInitialState()
    state.artifactProgress['ember-staff'] = { minorRanks: { 'arcane-embers': 10 } }
    const current = getArtifactCurrentResolvedEffects(state, 'ember-staff')
    expect(current.stats?.spellPower).toBeGreaterThan(15)
    expect(current.stats?.spellPower).toBe(37)
  })

  it('shows every compact ordinary effect on a Major graph card', () => {
    const state = createInitialState()
    render(<ArtifactTreeGraph state={state} artifactId="wispveil-hood" selectedNodeId={null} onSelect={() => undefined} onClearSelection={() => undefined} />)

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

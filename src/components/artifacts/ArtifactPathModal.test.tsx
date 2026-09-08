import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ArtifactPathModal } from './ArtifactPathModal'
import { setArtifactDevPanelVisible } from '../../devtools/developerToolsStore'
import { useGameStore } from '../../store/gameStore'

describe('Artifact Path presentation', () => {
  beforeEach(() => {
    setArtifactDevPanelVisible(false)
    useGameStore.getState().resetSave()
    useGameStore.getState().addItem('ember-staff', 1)
  })

  it('renders the artifact summary, graph, connectors, and selected-node inspector', () => {
    const view = render(<ArtifactPathModal artifactId="ember-staff" onClose={() => undefined} />)
    expect(screen.getByRole('dialog', { name: 'Ember Staff Artifact Path' })).toBeTruthy()
    expect(screen.getByText('PATH POINTS')).toBeTruthy()
    expect(screen.getByText('PATH MAP')).toBeTruthy()
    expect(document.querySelectorAll('.artifact-tree-connector').length).toBeGreaterThan(0)
    expect(screen.getByText('SELECT A NODE')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Arcane Kindling/ }))
    expect(screen.getByRole('heading', { name: 'Arcane Kindling' })).toBeTruthy()
    expect(screen.getByText('REQUIREMENTS')).toBeTruthy()
  })

  it('pans the fixed tree without rearranging nodes', () => {
    const view = render(<ArtifactPathModal artifactId="ember-staff" onClose={() => undefined} />)
    const viewport = document.querySelector('.artifact-tree-viewport') as HTMLElement
    fireEvent.pointerDown(viewport, { button: 0, pointerId: 1, clientX: 30, clientY: 40 })
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 90, clientY: 75 })
    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 90, clientY: 75 })
    expect(viewport.querySelector('.artifact-tree-board')?.getAttribute('data-pan-x')).toBe('60')
    expect(viewport.querySelectorAll('.artifact-tree-node').length).toBeGreaterThan(0)
  })

  it('keeps the mini dev panel hidden until the main DevTools toggle is enabled', async () => {
    const view = render(<ArtifactPathModal artifactId="ember-staff" onClose={() => undefined} />)
    expect(document.querySelector('.artifact-path-dev-mini')).toBeNull()
    act(() => setArtifactDevPanelVisible(true))
    await waitFor(() => expect(document.querySelector('.artifact-path-dev-mini')).toBeTruthy())
  })

  it('opens a specific artifact path by ID', () => {
    const view = render(<ArtifactPathModal artifactId="tideglass-wand" onClose={() => undefined} />)
    expect(screen.getByRole('dialog', { name: 'Tideglass Wand Artifact Path' })).toBeTruthy()
    expect(document.querySelector('.artifact-tree-connector')).toBeTruthy()
  })
})

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
    useGameStore.getState().debugSetArtifactLevel('ember-staff', 1)
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

  it('shows the real next-level cost, stat preview, and no fake XP progress', () => {
    render(<ArtifactPathModal artifactId="ember-staff" onClose={() => undefined} />)
    expect((screen.getByRole('button', { name: 'MISSING MATERIALS' }) as HTMLButtonElement).disabled).toBe(true)
    expect(document.querySelector('.artifact-level-up-cost strong')?.textContent).toBe('50')
    expect(document.querySelector('.artifact-level-up-cost small')?.textContent).toBe('OWNED 0')
    expect(screen.getByText('Basic Attack Damage')).toBeTruthy()
    const statPreviews = Array.from(document.querySelectorAll('.artifact-level-up-stat strong')).map((element) => element.textContent ?? '')
    expect(statPreviews.some((value) => value.includes('+5') && value.includes('+6'))).toBe(true)
    expect(statPreviews.some((value) => value.includes('+16') && value.includes('+20'))).toBe(true)
    expect(screen.queryByText(/ARTIFACT XP|XP PROGRESS/i)).toBeNull()
  })

  it('uses the real player Artifact upgrade action when materials are ready', () => {
    useGameStore.getState().addItem('fire-fragment', 50)
    render(<ArtifactPathModal artifactId="ember-staff" onClose={() => undefined} />)
    const button = screen.getByRole('button', { name: 'LEVEL UP' })
    expect((button as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(button)
    expect(useGameStore.getState().activities.artificing.activeJob).toEqual({ kind: 'artifact-upgrade', artifactId: 'ember-staff', fromLevel: 1, toLevel: 2 })
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(0)
    expect(screen.getByText('UPGRADING...')).toBeTruthy()
    expect(screen.getByText('0.0s / 5.0s')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Artifact upgrade progress' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'LEVEL UP' })).toBeNull()
  })

  it('explains the current cap and absolute maximum states', () => {
    useGameStore.getState().debugSetArtifactLevel('ember-staff', 4)
    const capped = render(<ArtifactPathModal artifactId="ember-staff" onClose={() => undefined} />)
    expect((screen.getByRole('button', { name: 'LEVEL CAP REACHED' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/Current cap: 4\. Defeat Forest Heart/)).toBeTruthy()
    capped.unmount()

    useGameStore.getState().debugSetArtifactLevel('ember-staff', 10)
    render(<ArtifactPathModal artifactId="ember-staff" onClose={() => undefined} />)
    expect((screen.getByRole('button', { name: 'MAX LEVEL' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('MAXIMUM LEVEL')).toBeTruthy()
  })
})

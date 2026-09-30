import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameShell } from '../../app/GameShell'
import { useGameStore } from '../../store/gameStore'
import { resetAllUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'

vi.mock('../../components/ArcaneAtmosphere', () => ({ ArcaneAtmosphere: () => null }))

describe('Chronicles Overview and modal', () => {
  const completeElementalOpening = (state: ReturnType<typeof useGameStore.getState>) => {
    state.progress.chronicle.completedObjectiveIds.push('m1a-enter-elemental-counter-zone', 'm1b-exploit-elemental-weakness', 'm2a-elemental-frontier', 'm2b-equip-elemental-ward', 'm2c-test-elemental-ward', 'm2d-defeat-elemental-boss')
  }
  beforeEach(() => {
    window.localStorage.clear()
    resetAllUiPreferences()
    useGameStore.getState().resetSave()
    useGameStore.setState((state) => {
      state.progress.startingSchoolId = 'fire'
      state.progress.tutorialStage = 'complete'
      state.ui.screen = 'home'
      state.combat.active = false
    })
  })

  it('keeps Overview compact and opens the full authored Chronicle workspace', async () => {
    const user = userEvent.setup()
    render(<GameShell />)

    expect(screen.getByText(/Required progress drives chapter completion/)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Open Chronicles' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Manage Objectives' })).toBeNull()
    expect(screen.queryByRole('button', { name: /View Full Chronicle/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: /Open Chronicles/ }))

    const dialog = screen.getByRole('dialog', { name: 'Chronicles' })
    expect(dialog).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: /First Frontier/ })).toBeTruthy()
    expect(within(dialog).getByLabelText('Search objectives')).toBeTruthy()
    expect(within(dialog).getByText(/Showing .* objectives/)).toBeTruthy()
    expect(within(dialog).getByRole('checkbox', { name: 'Hide Completed' })).toBeTruthy()
    expect(within(dialog).getByText('First Blood')).toBeTruthy()
    expect(within(dialog).getByText('REQUIREMENT')).toBeTruthy()
    expect(within(dialog).queryByRole('button', { name: 'Previous' })).toBeNull()
    expect(within(dialog).queryByRole('button', { name: 'Next' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Close Chronicles' }))
    expect(screen.queryByRole('dialog', { name: 'Chronicles' })).toBeNull()
  })

  it('deep-links Overview objective cards to the selected Chronicle inspector', async () => {
    const user = userEvent.setup()
    useGameStore.setState((state) => {
      state.progress.chronicle.completedObjectiveIds = ['m1-choose-school', 'm2-first-blood', 'c1-enter-whispering-woods', 'c2-auto-cast']
      completeElementalOpening(state)
    })
    render(<GameShell />)

    await user.click(screen.getByRole('button', { name: /Strengthen Your Artifact/ }))

    const dialog = screen.getByRole('dialog', { name: 'Chronicles' })
    expect(within(dialog).getByRole('heading', { name: 'Strengthen Your Artifact' })).toBeTruthy()
    expect(dialog.querySelector('[data-chronicle-objective-id="mg1-strengthen-artifact"]')?.className).toContain('selected')
  })

  it('deep-links a Tower objective instead of falling back to Current Main', async () => {
    const user = userEvent.setup()
    useGameStore.setState((state) => {
      state.progress.chronicle.completedObjectiveIds = ['m1-choose-school', 'm2-first-blood', 'c1-enter-whispering-woods', 'c2-auto-cast']
      completeElementalOpening(state)
    })
    render(<GameShell />)

    await user.click(screen.getByRole('button', { name: /Put an Acolyte to Work/ }))

    const dialog = screen.getByRole('dialog', { name: 'Chronicles' })
    expect(dialog.querySelector('.chronicles-inspector-title h3')?.textContent).toBe('Put an Acolyte to Work')
    expect(dialog.querySelector('.chronicles-inspector-title h3')?.textContent).not.toBe('Heart of the Woods')
  })

  it('reveals a targeted objective without changing saved Chronicle filters', async () => {
    const user = userEvent.setup()
    setUiPreferences({ screenState: { chronicles: { statusFilters: ['current'], trackFilters: ['main'], showOptional: false } } })
    useGameStore.setState((state) => {
      state.progress.chronicle.completedObjectiveIds = ['m1-choose-school', 'm2-first-blood']
      completeElementalOpening(state)
    })
    render(<GameShell />)

    await user.click(screen.getByRole('button', { name: /Strengthen Your Artifact/ }))

    const dialog = screen.getByRole('dialog', { name: 'Chronicles' })
    expect(within(dialog).getByRole('heading', { name: 'Strengthen Your Artifact' })).toBeTruthy()
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-ui-preferences-v1')!).screenState.chronicles.trackFilters).toEqual(['main'])
  })

  it('clears a targeted objective when the modal closes before a generic open', async () => {
    const user = userEvent.setup()
    useGameStore.setState((state) => {
      state.progress.chronicle.completedObjectiveIds = ['m1-choose-school', 'm2-first-blood']
      completeElementalOpening(state)
    })
    render(<GameShell />)

    await user.click(screen.getByRole('button', { name: /Strengthen Your Artifact/ }))
    expect(screen.getByRole('heading', { name: 'Strengthen Your Artifact' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Close Chronicles' }))
    await user.click(screen.getByRole('button', { name: 'Open Chronicles' }))

    expect(screen.getByRole('dialog', { name: 'Chronicles' }).querySelector('.chronicles-inspector-title h3')?.textContent).toBe('Heart of the Woods')
    expect(screen.queryByRole('heading', { name: 'Strengthen Your Artifact' })).toBeNull()
  })
})

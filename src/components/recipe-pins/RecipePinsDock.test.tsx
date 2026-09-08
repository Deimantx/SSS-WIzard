import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { getUiPreferences, resetAllUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { RecipePinsDock } from './RecipePinsDock'

describe('Recipe Pins Dock', () => {
  beforeEach(() => {
    useGameStore.getState().resetSave()
    resetAllUiPreferences()
    const current = useGameStore.getState()
    useGameStore.setState({ progress: { ...current.progress, lifetimeKillsByMonster: { ...current.progress.lifetimeKillsByMonster, 'forest-wisp': 1 } } })
  })

  it('renders only missing ingredient chips using legal consumable quantities', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'fire-fragment': 20, 'wisp-essence': 6, 'thorn-fiber': 7, 'grove-bark': 5, 'life-essence': 24 } })
    setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['ember-staff'] } } })

    render(<TooltipProvider><RecipePinsDock /></TooltipProvider>)

    expect(screen.getByLabelText('Wisp Essence. Missing 4. 6 usable, 10 required.')).toBeTruthy()
    expect(screen.getByLabelText('Thorn Fiber. Missing 3. 7 usable, 10 required.')).toBeTruthy()
    expect(screen.queryByText('Fire Fragment')).toBeNull()
    expect(screen.queryByText('Grove Bark')).toBeNull()
    expect(screen.queryByText('Life Essence')).toBeNull()
  })

  it('shows READY when all requirements are satisfied and FORGED after an Artifact is acquired', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'fire-fragment': 20, 'wisp-essence': 10, 'thorn-fiber': 10, 'grove-bark': 5, 'life-essence': 24 } })
    setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['ember-staff'] } } })
    render(<TooltipProvider><RecipePinsDock /></TooltipProvider>)
    expect(screen.getByText('READY TO FORGE')).toBeTruthy()

    act(() => useGameStore.setState({ inventory: { ...useGameStore.getState().inventory, 'ember-staff': 1 }, artifactProgress: { ...useGameStore.getState().artifactProgress, 'ember-staff': { level: 1, allocatedNodeIds: [], attunedNodeIds: [] } } }))
    expect(screen.getByText('FORGED')).toBeTruthy()
    expect(getUiPreferences().screenState.artificing.pinnedRecipeIds).toEqual(['ember-staff'])
  })

  it('collapses and expands without removing the pins', () => {
    setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['ember-staff'] } } })
    render(<TooltipProvider><RecipePinsDock /></TooltipProvider>)

    const collapse = screen.getByRole('button', { name: /Collapse Recipe Pins|Expand Recipe Pins/ })
    fireEvent.click(collapse)
    expect(getUiPreferences().screenState.artificing.pinsCollapsed).toBe(true)
    expect(screen.getByText('RECIPE PINS')).toBeTruthy()
  })
})

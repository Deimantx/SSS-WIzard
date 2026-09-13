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
    useGameStore.setState({ inventory: { ...current.inventory, 'fire-fragment': 20, 'artifact-essence': 6 } })
    setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['ember-staff'] } } })

    render(<TooltipProvider><RecipePinsDock /></TooltipProvider>)

    expect(screen.getByLabelText('Artifact Essence. Missing 14. 6 usable, 20 required.')).toBeTruthy()
    expect(screen.queryByText('Fire Fragment')).toBeNull()
    expect(screen.queryByText('Artifact Essence')).toBeTruthy()
  })

  it('shows READY and removes a pin after an Artifact is acquired', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'fire-fragment': 20, 'artifact-essence': 20 } })
    setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['ember-staff'] } } })
    render(<TooltipProvider><RecipePinsDock /></TooltipProvider>)
    expect(screen.getByText('READY TO FORGE')).toBeTruthy()

    act(() => useGameStore.setState({ inventory: { ...useGameStore.getState().inventory, 'ember-staff': 1 }, artifactProgress: { ...useGameStore.getState().artifactProgress, 'ember-staff': { level: 1, allocatedNodeIds: [], attunedNodeIds: [] } } }))
    expect(screen.queryByText('FORGED')).toBeNull()
    expect(getUiPreferences().screenState.artificing.pinnedRecipeIds).toEqual([])
  })

  it('auto-unpins both Artifact Forge and repeatable Equipment on successful live completion', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'fire-fragment': 20, 'artifact-essence': 20 } })
    setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['ember-staff'] } } })
    expect(useGameStore.getState().craftArtificingRecipe('ember-staff')).toBe(true)
    expect(getUiPreferences().screenState.artificing.pinnedRecipeIds).toEqual(['ember-staff'])
    act(() => {
      for (let index = 0; index < 5; index += 1) useGameStore.getState().tick(1_000)
    })
    expect(getUiPreferences().screenState.artificing.pinnedRecipeIds).toEqual([])

    useGameStore.setState({ inventory: { ...useGameStore.getState().inventory, 'water-fragment': 20, 'artifact-essence': 20 } })
    setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['tideglass-wand'] } } })
    expect(useGameStore.getState().craftArtificingRecipe('tideglass-wand')).toBe(true)
    act(() => {
      for (let index = 0; index < 5; index += 1) useGameStore.getState().tick(1_000)
    })
    expect(getUiPreferences().screenState.artificing.pinnedRecipeIds).toEqual([])
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

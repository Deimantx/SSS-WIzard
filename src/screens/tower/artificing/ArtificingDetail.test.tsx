import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { ARTIFICING_RECIPES } from '../../../game/content/recipes/artificingRecipes'
import { useGameStore } from '../../../store/gameStore'
import { getUiPreferences, resetAllUiPreferences, setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { ArtificingDetail } from './ArtificingDetail'

describe('Artificing detail ownership labels', () => {
  beforeEach(() => {
    useGameStore.getState().resetSave()
    resetAllUiPreferences()
    const current = useGameStore.getState()
    useGameStore.setState({ progress: { ...current.progress, lifetimeKillsByMonster: { ...current.progress.lifetimeKillsByMonster, 'forest-wisp': 1 } } })
  })

  it('uses binary ownership text for a forged Artifact', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'ember-staff': 1 }, artifactProgress: { ...current.artifactProgress, 'ember-staff': { level: 3, allocatedNodeIds: [], attunedNodeIds: [] } } })
    render(<TooltipProvider><ArtificingDetail recipe={ARTIFICING_RECIPES['ember-staff']} /></TooltipProvider>)

    expect(screen.getByText('OWNED')).toBeTruthy()
    expect(screen.queryByText('OWNED 1')).toBeNull()
  })

  it('keeps Artifact ownership text for every starter Artifact', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'tideglass-wand': 1 }, artifactProgress: { ...current.artifactProgress, 'tideglass-wand': { level: 1, allocatedNodeIds: [], attunedNodeIds: [] } } })
    render(<TooltipProvider><ArtificingDetail recipe={ARTIFICING_RECIPES['tideglass-wand']} /></TooltipProvider>)

    expect(screen.getAllByText('OWNED').length).toBeGreaterThan(0)
    expect(screen.queryByText('OWNED 1')).toBeNull()
  })

  it('pins and unpins a recipe from the action row', () => {
    render(<TooltipProvider><ArtificingDetail recipe={ARTIFICING_RECIPES['ember-staff']} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Pin Ember Staff' }))
    expect(getUiPreferences().screenState.artificing.pinnedRecipeIds).toEqual(['ember-staff'])
    fireEvent.click(screen.getByRole('button', { name: 'Unpin Ember Staff' }))
    expect(getUiPreferences().screenState.artificing.pinnedRecipeIds).toEqual([])
  })

  it('contains only the six starter Artifact recipes', () => {
    expect(Object.keys(ARTIFICING_RECIPES)).toEqual(['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'wispweave-robe', 'wispveil-hood'])
    expect((ARTIFICING_RECIPES as Record<string, unknown>)['windthread-charm']).toBeUndefined()
  })
})

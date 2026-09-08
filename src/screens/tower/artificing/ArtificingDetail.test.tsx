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

  it('keeps numeric ownership text for repeatable Equipment', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'windthread-charm': 3 } })
    render(<TooltipProvider><ArtificingDetail recipe={ARTIFICING_RECIPES['windthread-charm']} /></TooltipProvider>)

    expect(screen.getByText('OWNED 3')).toBeTruthy()
  })

  it('pins and unpins a recipe from the action row', () => {
    render(<TooltipProvider><ArtificingDetail recipe={ARTIFICING_RECIPES['ember-staff']} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Pin Ember Staff' }))
    expect(getUiPreferences().screenState.artificing.pinnedRecipeIds).toEqual(['ember-staff'])
    fireEvent.click(screen.getByRole('button', { name: 'Unpin Ember Staff' }))
    expect(getUiPreferences().screenState.artificing.pinnedRecipeIds).toEqual([])
  })

  it('disables an unpinned action when the six-pin limit is full', () => {
    setUiPreferences({ screenState: { artificing: { pinnedRecipeIds: ['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'prismatic-focus', 'wispweave-robe'] } } })
    render(<TooltipProvider><ArtificingDetail recipe={ARTIFICING_RECIPES['windthread-charm']} /></TooltipProvider>)

    expect((screen.getByRole('button', { name: 'Pin Windthread Charm' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

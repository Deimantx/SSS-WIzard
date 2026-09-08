import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { EquipmentCatalog } from './EquipmentCatalog'
import { GameContextMenuProvider } from '../../../ui/context-menu/GameContextMenuProvider'
import { ARTIFICING_RECIPES } from '../../../game/content/recipes/artificingRecipes'
import { getArtificingCraftIngredients } from '../../../game/systems/artificing/artificingSelectors'

describe('Artificing equipment catalog filters', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
    useGameStore.getState().setDebugShowLockedArtificingRecipes(true)
    resetAllUiPreferences()
  })

  const unlockWhisperingWoods = () => {
    const current = useGameStore.getState()
    useGameStore.setState({ progress: { ...current.progress, lifetimeKillsByMonster: { ...current.progress.lifetimeKillsByMonster, 'forest-wisp': 1 } } })
  }

  const provideIngredients = (recipeId: keyof typeof ARTIFICING_RECIPES) => {
    const current = useGameStore.getState()
    const inventory = { ...current.inventory }
    getArtificingCraftIngredients(recipeId)?.forEach(({ itemId, quantity }) => { inventory[itemId] = Math.max(inventory[itemId] ?? 0, quantity) })
    useGameStore.setState({ inventory })
  }

  it('renders compact player-tier boxes and combines them with the slot filter', () => {
    render(<TooltipProvider><EquipmentCatalog selected={null} onSelect={vi.fn()} query="" onQueryChange={vi.fn()} /></TooltipProvider>)

    const tierFilter = screen.getByRole('group', { name: 'TIER' })
    expect(within(tierFilter).getByRole('button', { name: 'ALL' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('21 SHOWN')).toBeTruthy()

    fireEvent.click(within(tierFilter).getByRole('button', { name: 'T2' }))
    expect(within(tierFilter).getByRole('button', { name: 'T2' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('0 SHOWN')).toBeTruthy()
    expect(screen.getByText('No Artificing recipes match the current filters.')).toBeTruthy()

    fireEvent.click(within(tierFilter).getByRole('button', { name: 'T1' }))
    expect(screen.getByText('21 SHOWN')).toBeTruthy()

    const slotFilter = screen.getByRole('group', { name: 'SLOT' })
    fireEvent.click(within(slotFilter).getByRole('button', { name: 'EARRING' }))
    expect(screen.getByText('3 SHOWN')).toBeTruthy()

    fireEvent.click(within(tierFilter).getByRole('button', { name: 'T2' }))
    expect(screen.getByText('0 SHOWN')).toBeTruthy()
  })

  it('separates Artifact and Equipment cards through the persisted Craft Type filter', () => {
    render(<TooltipProvider><EquipmentCatalog selected={null} onSelect={vi.fn()} query="" onQueryChange={vi.fn()} /></TooltipProvider>)

    const craftType = screen.getByRole('group', { name: 'CRAFT TYPE' })
    expect(within(craftType).getByRole('button', { name: 'ALL' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('region', { name: 'ARTIFACTS' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'EQUIPMENT' })).toBeTruthy()

    fireEvent.click(within(craftType).getByRole('button', { name: 'ARTIFACTS' }))
    expect(screen.getByText('7 SHOWN')).toBeTruthy()
    expect(screen.getByText('Ember Staff')).toBeTruthy()
    expect(screen.queryByText('Windthread Charm')).toBeNull()
    expect(within(craftType).getByRole('button', { name: 'ARTIFACTS' }).getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(within(craftType).getByRole('button', { name: 'EQUIPMENT' }))
    expect(screen.getByText('14 SHOWN')).toBeTruthy()
    expect(screen.getByText('Windthread Charm')).toBeTruthy()
    expect(screen.queryByText('Ember Staff')).toBeNull()
    expect(within(craftType).getByRole('button', { name: 'EQUIPMENT' }).getAttribute('aria-pressed')).toBe('true')

    const slotFilter = screen.getByRole('group', { name: 'SLOT' })
    fireEvent.click(within(slotFilter).getByRole('button', { name: 'EARRING' }))
    expect(screen.getByText('3 SHOWN')).toBeTruthy()
    expect(screen.getByText('Fangwire Earring')).toBeTruthy()
    expect(screen.queryByText('Ember Staff')).toBeNull()
  })

  it('shows owned Artifacts as FORGED with their current level', () => {
    unlockWhisperingWoods()
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'ember-staff': 1 }, artifactProgress: { ...current.artifactProgress, 'ember-staff': { level: 3, allocatedNodeIds: [], attunedNodeIds: [] } } })
    render(<TooltipProvider><EquipmentCatalog selected="ember-staff" onSelect={vi.fn()} query="ember-staff" onQueryChange={vi.fn()} /></TooltipProvider>)

    const card = document.querySelector('[data-recipe-id="ember-staff"]') as HTMLElement
    expect(card).toBeTruthy()
    expect(within(card).getByText('FORGED')).toBeTruthy()
    expect(within(card).getByText('LV 3 / 10')).toBeTruthy()
    expect(card.classList.contains('artifact-forged')).toBe(true)
    expect(within(card).queryByText('MISSING')).toBeNull()
  })

  it('keeps a materially-ready card READY while another recipe is crafting', () => {
    unlockWhisperingWoods()
    provideIngredients('ember-staff')
    provideIngredients('windthread-charm')
    const current = useGameStore.getState()
    useGameStore.setState({ activities: { ...current.activities, artificing: { activeJob: { kind: 'recipe', recipeId: 'windthread-charm' }, activeRecipeId: 'windthread-charm', progressMs: 1000 } } })
    render(<TooltipProvider><EquipmentCatalog selected="ember-staff" onSelect={vi.fn()} query="" onQueryChange={vi.fn()} /></TooltipProvider>)

    const ember = document.querySelector('[data-recipe-id="ember-staff"]') as HTMLElement
    const windthread = document.querySelector('[data-recipe-id="windthread-charm"]') as HTMLElement
    expect(within(ember).getByText('READY')).toBeTruthy()
    expect(within(windthread).getByText('CRAFTING')).toBeTruthy()
  })

  it('explains a busy Artificing slot in the catalog context menu', () => {
    unlockWhisperingWoods()
    provideIngredients('ember-staff')
    provideIngredients('windthread-charm')
    const current = useGameStore.getState()
    useGameStore.setState({ activities: { ...current.activities, artificing: { activeJob: { kind: 'recipe', recipeId: 'windthread-charm' }, activeRecipeId: 'windthread-charm', progressMs: 1000 } } })
    render(<TooltipProvider><GameContextMenuProvider><EquipmentCatalog selected="ember-staff" onSelect={vi.fn()} query="ember-staff" onQueryChange={vi.fn()} /></GameContextMenuProvider></TooltipProvider>)

    fireEvent.contextMenu(document.querySelector('[data-recipe-id="ember-staff"]') as HTMLElement)
    expect(screen.getByText('Another Artificing job is already active')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /Craft One/ }).getAttribute('aria-disabled')).toBe('true')
  })

  it('does not offer repeat forging for a forged Artifact', () => {
    unlockWhisperingWoods()
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'ember-staff': 1 }, artifactProgress: { ...current.artifactProgress, 'ember-staff': { level: 1, allocatedNodeIds: [], attunedNodeIds: [] } } })
    render(<TooltipProvider><GameContextMenuProvider><EquipmentCatalog selected="ember-staff" onSelect={vi.fn()} query="ember-staff" onQueryChange={vi.fn()} /></GameContextMenuProvider></TooltipProvider>)

    fireEvent.contextMenu(document.querySelector('[data-recipe-id="ember-staff"]') as HTMLElement)
    expect(screen.queryByRole('menuitem', { name: /Craft One/ })).toBeNull()
  })
})

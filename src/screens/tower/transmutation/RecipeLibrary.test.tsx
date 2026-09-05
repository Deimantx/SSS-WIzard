import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences, setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { RecipeLibrary } from './RecipeLibrary'

describe('RecipeLibrary screen preferences', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); useGameStore.getState().setDebugShowLockedTransmutationRecipes(true); useGameStore.setState(state => { state.player.mana = 100 }); resetAllUiPreferences() })

  it('hides locked authored recipes in the normal library', () => {
    useGameStore.getState().setDebugShowLockedTransmutationRecipes(false)
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    expect(screen.queryByText('Ember Staff')).toBeNull()
    expect(screen.getByText('5 / 5')).toBeTruthy()
  })

  it('keeps controls outside one scrollable recipe region and renders the full dev library inside it', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    const controls = document.querySelector('.transmutation-library-controls')
    const scroll = document.querySelector('.transmutation-library-scroll')
    expect(controls).toBeTruthy()
    expect(scroll).toBeTruthy()
    expect(controls?.querySelector('.transmutation-recipe-tile')).toBeNull()
    expect(scroll?.querySelectorAll('.transmutation-recipe-tile').length).toBe(5)
    expect(scroll?.querySelector('.transmutation-recipe-group')).toBeTruthy()
  })

  it('starts expanded and collapses a category without affecting other categories', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    const elemental = screen.getByRole('button', { name: /^ELEMENTAL, 4 recipes$/i })
    expect(elemental.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: /Fire Fragment/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Prismatic Fragment/ })).toBeTruthy()

    fireEvent.click(elemental)

    expect(elemental.getAttribute('aria-expanded')).toBe('false')
    expect(document.getElementById('transmutation-elemental-recipes')).toBeNull()
    expect(screen.queryByRole('button', { name: /Fire Fragment/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Prismatic Fragment/ })).toBeTruthy()

    fireEvent.click(elemental)
    expect(elemental.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById('transmutation-elemental-recipes')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Fire Fragment/ })).toBeTruthy()
  })

  it('persists category collapse state and reveals a collapsed category for its explicit filter', () => {
    const view = render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    const equipment = screen.getByRole('button', { name: /^MATERIALS, 1 recipes$/i })
    fireEvent.click(equipment)
    expect(equipment.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: /Prismatic Fragment/ })).toBeNull()

    view.unmount()
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    const remountedEquipment = screen.getByRole('button', { name: /^MATERIALS, 1 recipes$/i })
    expect(remountedEquipment.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: /Prismatic Fragment/ })).toBeNull()
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-ui-preferences-v1')!).screenState.transmutation.collapsedCategories.material).toBe(true)

    fireEvent.click(screen.getByRole('tab', { name: 'MATERIALS' }))

    expect(screen.queryByRole('button', { name: /^MATERIALS, 1 recipes$/i })).toBeNull()
    expect(document.querySelector('.transmutation-group-heading.is-static')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Prismatic Fragment/ })).toBeTruthy()
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-ui-preferences-v1')!).screenState.transmutation.collapsedCategories.material).toBe(true)

    fireEvent.click(screen.getAllByRole('tab', { name: 'ALL' })[0])
    expect(screen.queryByRole('button', { name: /Prismatic Fragment/ })).toBeNull()
  })

  it('temporarily reveals matching groups while searching and keeps idle tiles quiet', () => {
    setUiPreferences({ screenState: { transmutation: { collapsedCategories: { material: true } } } })
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /Prismatic Fragment/ })).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('Search recipes...'), { target: { value: 'prismatic' } })

    expect(screen.queryByRole('button', { name: /^MATERIALS, 1 recipes$/i })).toBeNull()
    expect(document.querySelector('.transmutation-group-heading.is-static')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Prismatic Fragment/ })).toBeTruthy()
    expect(screen.queryByText('PAUSED')).toBeNull()
    expect(screen.queryByText('LOCKED')).toBeNull()

    fireEvent.change(screen.getByPlaceholderText('Search recipes...'), { target: { value: '' } })
    expect(screen.queryByRole('button', { name: /Prismatic Fragment/ })).toBeNull()
  })

  it('uses a single ACTIVE status alongside the Echo badge', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    act(() => { useGameStore.getState().setTransmutationEchoes('fire-fragment', 1) })

    expect(useGameStore.getState().activities.transmutation.jobs['fire-fragment']?.echoesAssigned).toBe(1)
    expect(screen.getByRole('button', { name: /1E/ })).toBeTruthy()
    const tileStatuses = document.querySelectorAll('.transmutation-tile-status .status.active')
    expect(tileStatuses).toHaveLength(1)
    expect(tileStatuses[0].textContent).toBe('ACTIVE')
    expect(screen.queryByText('1E ACTIVE')).toBeNull()
  })

  it('persists its filter while search remains temporary', () => {
    const view = render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'MATERIALS' }))
    fireEvent.change(screen.getByPlaceholderText('Search recipes...'), { target: { value: 'prismatic' } })
    expect(screen.getByText('Prismatic Fragment')).toBeTruthy()
    view.unmount()

    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'MATERIALS' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Prismatic Fragment')).toBeTruthy()
    expect(screen.queryByText('Fire Fragment')).toBeNull()
  })

  it('does not offer unavailable tiers in a single-tier registry', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'ELEMENTAL' }))
    expect(screen.getByText('Fire Fragment')).toBeTruthy()
    expect(screen.queryByRole('tab', { name: 'T2' })).toBeNull()
  })

  it('uses material metadata and combinable production-only quick filters', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Fire Fragment/ }).querySelector('.transmutation-badge.tier')?.textContent).toBe('T1')
    expect(screen.queryByRole('tab', { name: 'EQUIPMENT' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'UNOWNED' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'CRAFTABLE' }))
    fireEvent.click(screen.getByRole('button', { name: 'ACTIVE' }))
    expect(screen.getByRole('button', { name: 'CRAFTABLE' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'ACTIVE' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Clear Show Only filters' }))
    expect(screen.getByRole('button', { name: 'ACTIVE' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('keeps selected, assigned, tier, and locked card semantics distinct', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    act(() => { useGameStore.getState().setTransmutationEchoes('water-fragment', 1) })

    const selectedTile = screen.getByRole('button', { name: /Fire Fragment/ })
    const activeTile = screen.getByRole('button', { name: /Water Fragment/ })
    expect(selectedTile.classList.contains('selected')).toBe(true)
    expect(selectedTile.classList.contains('assigned')).toBe(false)
    expect(activeTile.classList.contains('assigned')).toBe(true)
    expect(activeTile.classList.contains('selected')).toBe(false)
    expect(selectedTile.querySelector('.transmutation-badge.tier')?.textContent).toBe('T1')
    expect(selectedTile.querySelector('.transmutation-tile-footer')).toBeTruthy()
  })

  it('marks library group headings for contained sticky positioning', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    expect(document.querySelector('.transmutation-library-scroll .transmutation-group-heading')).toBeTruthy()
  })
})

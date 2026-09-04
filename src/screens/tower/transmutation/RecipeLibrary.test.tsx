import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences, setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { RecipeLibrary } from './RecipeLibrary'

describe('RecipeLibrary screen preferences', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); useGameStore.getState().setDebugShowLockedTransmutationRecipes(true); resetAllUiPreferences() })

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
    expect(scroll?.querySelectorAll('.transmutation-recipe-tile').length).toBeGreaterThan(30)
    expect(scroll?.querySelector('.transmutation-recipe-group')).toBeTruthy()
  })

  it('starts expanded and collapses a category without affecting other categories', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    const elemental = screen.getByRole('button', { name: /^ELEMENTAL, 4 recipes$/i })
    expect(elemental.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: /Fire Fragment/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Ember Staff/ })).toBeTruthy()

    fireEvent.click(elemental)

    expect(elemental.getAttribute('aria-expanded')).toBe('false')
    expect(document.getElementById('transmutation-elemental-recipes')).toBeNull()
    expect(screen.queryByRole('button', { name: /Fire Fragment/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Ember Staff/ })).toBeTruthy()

    fireEvent.click(elemental)
    expect(elemental.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById('transmutation-elemental-recipes')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Fire Fragment/ })).toBeTruthy()
  })

  it('persists category collapse state and reveals a collapsed category for its explicit filter', () => {
    const view = render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    const equipment = screen.getByRole('button', { name: /^EQUIPMENT, 27 recipes$/i })
    fireEvent.click(equipment)
    expect(equipment.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: /Ember Staff/ })).toBeNull()

    view.unmount()
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    const remountedEquipment = screen.getByRole('button', { name: /^EQUIPMENT, 27 recipes$/i })
    expect(remountedEquipment.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: /Ember Staff/ })).toBeNull()
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-ui-preferences-v1')!).screenState.transmutation.collapsedCategories.equipment).toBe(true)

    fireEvent.click(screen.getByRole('tab', { name: 'EQUIPMENT' }))

    expect(screen.queryByRole('button', { name: /^EQUIPMENT, 27 recipes$/i })).toBeNull()
    expect(document.querySelector('.transmutation-group-heading.is-static')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Ember Staff/ })).toBeTruthy()
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-ui-preferences-v1')!).screenState.transmutation.collapsedCategories.equipment).toBe(true)

    fireEvent.click(screen.getAllByRole('tab', { name: 'ALL' })[0])
    expect(screen.queryByRole('button', { name: /Ember Staff/ })).toBeNull()
  })

  it('temporarily reveals matching groups while searching and keeps idle tiles quiet', () => {
    setUiPreferences({ screenState: { transmutation: { collapsedCategories: { equipment: true } } } })
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /Ember Staff/ })).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('Search recipes...'), { target: { value: 'ember' } })

    expect(screen.queryByRole('button', { name: /^EQUIPMENT, 1 recipes$/i })).toBeNull()
    expect(document.querySelector('.transmutation-group-heading.is-static')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Ember Staff/ })).toBeTruthy()
    expect(screen.queryByText('PAUSED')).toBeNull()
    expect(screen.getByText('LOCKED')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Search recipes...'), { target: { value: '' } })
    expect(screen.queryByRole('button', { name: /Ember Staff/ })).toBeNull()
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
    fireEvent.click(screen.getByRole('tab', { name: 'EQUIPMENT' }))
    fireEvent.change(screen.getByPlaceholderText('Search recipes...'), { target: { value: 'ember' } })
    expect(screen.getByText('Ember Staff')).toBeTruthy()
    view.unmount()

    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'EQUIPMENT' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Ember Staff')).toBeTruthy()
    expect(screen.queryByText('Fire Fragment')).toBeNull()
  })

  it('shows shared Elemental tier controls and category-correct empty states', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'ELEMENTAL' }))

    expect(screen.getByText('ELEMENT TIER')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'T1' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'T2' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'T3' })).toBeTruthy()
    expect(screen.getByText('Fire Fragment')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'T2' }))
    expect(screen.getByText('No T2 elemental recipes are available.')).toBeTruthy()
  })

  it('uses readable badge metadata and Equipment-only Unowned state', () => {
    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    const fireTile = screen.getByRole('button', { name: /Fire Fragment/ })
    expect(fireTile.querySelector('.transmutation-badge.tier')?.textContent).toBe('T1')
    expect(fireTile.querySelectorAll('.transmutation-badge')).toHaveLength(2)
    expect(fireTile.textContent).toContain('ELEMENTAL')
    expect(fireTile.textContent).toContain('OWNED 0')

    fireEvent.click(screen.getByRole('tab', { name: 'EQUIPMENT' }))
    expect(screen.getByRole('button', { name: 'UNOWNED' })).toBeTruthy()
    expect(screen.queryByText('ELEMENT TIER')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'UNOWNED' }))
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-ui-preferences-v1')!).screenState.transmutation.unownedOnly).toBe(true)
  })
})

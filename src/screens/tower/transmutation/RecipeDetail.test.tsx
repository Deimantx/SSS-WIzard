import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RECIPES } from '../../../game/content/recipes/recipes'
import { useGameStore } from '../../../store/gameStore'
import { createInitialState } from '../../../store/initialState'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { RecipeDetail } from './RecipeDetail'

describe('RecipeDetail Used In summary', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('keeps Used In compact and opens the full list in a dialog', () => {
    const view = render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)
    expect(screen.getByText(/USED IN.*4 uses/)).toBeTruthy()
    expect(screen.queryByText('Prismatic Fragment')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'VIEW' }))
    expect(screen.getByRole('dialog', { name: /FIRE FRAGMENT/ })).toBeTruthy()
    expect(screen.getByText('Prismatic Fragment')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close Used In dialog' }))
    expect(screen.queryByRole('dialog', { name: /FIRE FRAGMENT/ })).toBeNull()
    view.unmount()
  })

  it('selects a downstream Transmutation recipe and closes the dialog', () => {
    const onSelectRecipe = vi.fn()
    render(<RecipeDetail recipe={RECIPES['fire-fragment']} onSelectRecipe={onSelectRecipe} />)
    fireEvent.click(screen.getByRole('button', { name: 'VIEW' }))
    fireEvent.click(screen.getByRole('button', { name: /Select Prismatic Fragment/ }))
    expect(onSelectRecipe).toHaveBeenCalledWith('prismatic-fragment')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps production metrics without a duplicate live Current Cycle block', () => {
    useGameStore.getState().setTransmutationEchoes('fire-fragment', 1)
    render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)

    expect(screen.getByText('EFFECTIVE TIME')).toBeTruthy()
    expect(screen.getByText('OUTPUT / H')).toBeTruthy()
    expect(screen.queryByText('CURRENT CYCLE')).toBeNull()
    expect(screen.queryByText('Progress is preserved.')).toBeNull()
  })

  it('keeps paused production concise when no Echoes are assigned', () => {
    render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)

    expect(document.querySelector('.transmutation-production-paused .status')?.textContent).toBe('PAUSED')
    expect(screen.getByText('Assign an Arcane Echo to begin production.')).toBeTruthy()
  })


  it('omits the empty material section while keeping the Mana requirement', () => {
    render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)

    expect(screen.queryByText('MATERIAL REQUIREMENTS')).toBeNull()
    expect(document.querySelector('.transmutation-mana-requirement')).toBeTruthy()
  })


  it('shows derived material capacity and missing ingredients only for material recipes', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 2
    state.inventory['water-fragment'] = 11
    state.inventory['earth-fragment'] = 11
    state.inventory['air-fragment'] = 11
    state.inventory['life-essence'] = 20
    useGameStore.getState().hydrateState(state)
    const view = render(<RecipeDetail recipe={RECIPES['prismatic-fragment']} />)

    expect(screen.getByText('PRODUCTION CAPACITY')).toBeTruthy()
    expect(screen.getByText('CAN CRAFT')).toBeTruthy()
    expect(screen.getByText('LIMITING MATERIAL')).toBeTruthy()
    expect(screen.getByText(/Fire Fragment/)).toBeTruthy()

    view.unmount()
  })

})

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
    expect(screen.getByText(/downstream uses/)).toBeTruthy()
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

  it('shows only the unlock explanation for locked recipes', () => {
    render(<RecipeDetail recipe={RECIPES['ember-staff']} />)

    expect(screen.getByText('LOCKED')).toBeTruthy()
    expect(document.querySelector('.transmutation-lock-reason .status')).toBeNull()
    expect(screen.queryByText('CURRENT PRODUCTION')).toBeNull()
    expect(screen.queryByText('PAUSED')).toBeNull()
  })

  it('omits the empty material section while keeping the Mana requirement', () => {
    render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)

    expect(screen.queryByText('MATERIAL REQUIREMENTS')).toBeNull()
    expect(document.querySelector('.transmutation-mana-requirement')).toBeTruthy()
  })

  it('hides the dedicated Mana requirement for zero-Mana equipment recipes', () => {
    const state = createInitialState()
    state.progress.firstBossKill = true
    useGameStore.getState().hydrateState(state)
    render(<RecipeDetail recipe={RECIPES['ember-staff']} />)

    expect(screen.getByText('MATERIAL REQUIREMENTS')).toBeTruthy()
    expect(document.querySelector('.transmutation-mana-requirement')).toBeNull()
    expect(screen.getByText('MANA')).toBeTruthy()
  })
})

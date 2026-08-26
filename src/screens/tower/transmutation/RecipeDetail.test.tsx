import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { RECIPES } from '../../../game/content/recipes/recipes'
import { useGameStore } from '../../../store/gameStore'
import { createInitialState } from '../../../store/initialState'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { RecipeDetail } from './RecipeDetail'

describe('RecipeDetail screen preferences', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('persists the Used In accordion state across remounts', () => {
    const view = render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)
    fireEvent.click(screen.getByRole('button', { name: /USED IN/ }))
    expect(screen.getByRole('button', { name: /USED IN/ }).getAttribute('aria-expanded')).toBe('false')
    view.unmount()

    render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)

    expect(screen.getByRole('button', { name: /USED IN/ }).getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps production metrics without a duplicate live Current Cycle block', () => {
    useGameStore.getState().setTransmutationEchoes('fire-fragment', 1)
    render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)

    expect(screen.getByText('EFFECTIVE TIME')).toBeTruthy()
    expect(screen.getByText('OUTPUT / H')).toBeTruthy()
    expect(screen.queryByText('CURRENT CYCLE')).toBeNull()
    expect(screen.queryByText('Progress is preserved.')).toBeNull()
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

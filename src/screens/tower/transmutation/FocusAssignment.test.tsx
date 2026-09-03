import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { FocusAssignment } from './FocusAssignment'

describe('FocusAssignment locked state', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); resetAllUiPreferences() })

  it('does not render Echo controls for a locked selected recipe', () => {
    useGameStore.getState().setTransmutationEchoes('fire-fragment', 1)
    render(<FocusAssignment selectedRecipeId="ember-staff" onSelect={vi.fn()} />)

    expect(screen.getByText('LOCKED')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Assign Echo to Ember Staff' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remove Echo from Ember Staff' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Echo from Fire Fragment' })).toBeTruthy()
  })

  it('places the entire Focus body inside one scroll viewport', () => {
    render(<FocusAssignment selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    const body = document.querySelector('.transmutation-focus-body')
    expect(body).toBeTruthy()
    expect(body?.querySelector('.transmutation-focus-pool')).toBeTruthy()
    expect(body?.querySelector('.transmutation-empty-assignments')).toBeTruthy()
    expect(body?.querySelector('.transmutation-active-heading')).toBeTruthy()
  })

  it('renders every active assignment row inside the Focus body', () => {
    const state = useGameStore.getState()
    state.setTransmutationEchoes('fire-fragment', 1)
    state.setTransmutationEchoes('water-fragment', 1)
    render(<FocusAssignment selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    const body = document.querySelector('.transmutation-focus-body')
    expect(body?.querySelectorAll('.transmutation-assignment-row')).toHaveLength(2)
  })
})

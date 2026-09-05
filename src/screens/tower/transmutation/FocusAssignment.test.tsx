import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { FocusAssignment } from './FocusAssignment'

describe('FocusAssignment locked state', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); useGameStore.setState(state => { state.player.mana = 100 }); resetAllUiPreferences() })


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

  it('shows authoritative output and Mana rates for active assignments', () => {
    useGameStore.getState().setTransmutationEchoes('fire-fragment', 1)
    render(<FocusAssignment selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    expect(document.querySelector('.transmutation-assignment-metrics')?.textContent).toContain('450 / hr')
    expect(document.querySelector('.transmutation-assignment-metrics')?.textContent).toContain('3.13 Mana/s')
  })

  it('keeps selected active recipe metrics compact without a duplicate cycle line', () => {
    useGameStore.getState().setTransmutationEchoes('fire-fragment', 1)
    render(<FocusAssignment selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    expect(document.querySelector('.transmutation-focus-selected-name strong')?.textContent).toContain('Fire Fragment')
    expect(document.querySelector('.transmutation-focus-selected-status')?.textContent).toBe('ACTIVE')
    expect(document.querySelector('.transmutation-focus-selected-metrics')?.textContent).toMatch(/1 Echo.*8\.0s.*450 \/ hr.*3\.13 Mana\/s/)
    expect(document.querySelector('.transmutation-focus-effective-time')).toBeNull()
  })
})

import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { resetAllUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { AcolyteAssignment } from './AcolyteAssignment'

describe('AcolyteAssignment', () => {
  beforeEach(() => { useGameStore.getState().resetSave(); useGameStore.setState(state => { state.player.mana = 100 }); resetAllUiPreferences() })

  it('keeps the entire assignment body inside one scroll viewport', () => {
    render(<AcolyteAssignment selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    const body = document.querySelector('.transmutation-acolyte-body')
    expect(body).toBeTruthy()
    expect(body?.querySelector('.transmutation-acolyte-pool')).toBeTruthy()
    expect(body?.querySelector('.transmutation-empty-assignments')).toBeTruthy()
    expect(body?.querySelector('.transmutation-active-heading')).toBeTruthy()
  })

  it('renders every active assignment row inside the Acolyte body', () => {
    const state = useGameStore.getState()
    state.setTransmutationAcolytes('fire-fragment', 1)
    state.setTransmutationAcolytes('water-fragment', 1)
    render(<AcolyteAssignment selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    expect(document.querySelector('.transmutation-acolyte-body')?.querySelectorAll('.transmutation-assignment-row')).toHaveLength(2)
  })

  it('shows authoritative output and Flux rates for active assignments', () => {
    useGameStore.getState().setTransmutationAcolytes('fire-fragment', 1)
    render(<AcolyteAssignment selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    expect(document.querySelector('.transmutation-assignment-metrics')?.textContent).toContain('450 / hr')
    expect(document.querySelector('.transmutation-assignment-metrics')?.textContent).toContain('1.25 Flux/s')
  })

  it('keeps selected active recipe metrics compact without a duplicate cycle line', () => {
    useGameStore.getState().setTransmutationAcolytes('fire-fragment', 1)
    render(<AcolyteAssignment selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    expect(document.querySelector('.transmutation-acolyte-selected-name strong')?.textContent).toContain('Fire Fragment')
    expect(document.querySelector('.transmutation-acolyte-selected-status')?.textContent).toBe('WAITING RESONANCE')
    expect(document.querySelector('.transmutation-acolyte-selected-metrics')?.textContent).toMatch(/ACOLYTE.*8\.0s.*450 \/ hr.*1\.25 Flux\/s/)
    expect(document.querySelector('.transmutation-acolyte-effective-time')).toBeNull()
  })
})

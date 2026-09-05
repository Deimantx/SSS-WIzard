import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { resetAllUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { InventoryDetail } from './InventoryDetail'

const renderDetail = (itemId: 'fire-fragment' | 'water-fragment', navigate = vi.fn()) => {
  const state = createInitialState()
  state.inventory['fire-fragment'] = 12
  return { navigate, ...render(<InventoryDetail itemId={itemId} inventory={state.inventory} protectedItems={state.protectedItems} equipment={state.equipment} economyState={state} navigate={navigate} />) }
}

describe('InventoryDetail accordions', () => {
  beforeEach(() => { resetAllUiPreferences() })

  it('removes generic needs and inline used-in sections while keeping source', () => {
    renderDetail('fire-fragment')
    expect(screen.queryByText('CURRENT NEEDS')).toBeNull()
    expect(screen.queryByText('USED IN')).toBeNull()
    expect(screen.getByRole('button', { name: /SOURCE/ }).getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps Research Value collapsed and persists its open state', () => {
    const view = renderDetail('fire-fragment')
    const researchHeader = screen.getByRole('button', { name: /RESEARCH VALUE/ })
    expect(researchHeader.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(researchHeader)
    expect(researchHeader.getAttribute('aria-expanded')).toBe('true')

    view.unmount()
    renderDetail('water-fragment')
    expect(screen.getByRole('button', { name: /RESEARCH VALUE/ }).getAttribute('aria-expanded')).toBe('true')
  })
})

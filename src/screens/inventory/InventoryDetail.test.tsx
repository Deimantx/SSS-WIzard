import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { resetAppearance } from '../../ui/preferences/uiPreferencesStore'
import { InventoryDetail } from './InventoryDetail'

const makeState = () => {
  const state = createInitialState()
  state.inventory['fire-fragment'] = 12
  state.progress.emberStaffUnlocked = true
  state.progress.guildUnlocked = true
  state.progress.requestProgress['arcane-supply'] = 8
  return state
}

const renderDetail = (itemId: 'fire-fragment' | 'water-fragment', navigate = vi.fn()) => {
  const state = makeState()
  return { navigate, ...render(<InventoryDetail itemId={itemId} inventory={state.inventory} protectedItems={state.protectedItems} equipment={state.equipment} economyState={state} navigate={navigate} />) }
}

describe('InventoryDetail accordions', () => {
  beforeEach(() => { resetAppearance() })

  it('uses the requested expanded and collapsed defaults', () => {
    renderDetail('fire-fragment')

    expect(screen.getByRole('button', { name: /CURRENT NEEDS/ }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: /SOURCE/ }).getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByRole('button', { name: /USED IN/ }).getAttribute('aria-expanded')).toBe('true')
    expect((document.getElementById('inventory-detail-currentNeeds-content') as HTMLDivElement).hidden).toBe(false)
    expect((document.getElementById('inventory-detail-usedIn-content') as HTMLDivElement).hidden).toBe(false)
    expect((document.getElementById('inventory-detail-source-content') as HTMLDivElement).hidden).toBe(true)
  })

  it('toggles the whole header while preserving existing row navigation', () => {
    const { navigate } = renderDetail('fire-fragment')
    const sourceHeader = screen.getByRole('button', { name: /SOURCE/ })
    const needsHeader = screen.getByRole('button', { name: /CURRENT NEEDS/ })
    const usedInHeader = screen.getByRole('button', { name: /USED IN/ })

    fireEvent.click(sourceHeader)
    expect(sourceHeader.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: /Go to Wizard Tower/ }))
    expect(navigate).toHaveBeenCalledWith('tower-transmutation')

    fireEvent.click(needsHeader)
    expect(needsHeader.getAttribute('aria-expanded')).toBe('false')
    expect((document.getElementById('inventory-detail-currentNeeds-content') as HTMLDivElement).hidden).toBe(true)
    fireEvent.click(needsHeader)
    fireEvent.click(screen.getByRole('button', { name: /Mana Resonance Lv.1/ }))
    expect(navigate).toHaveBeenCalledWith('tower-channeling')

    fireEvent.click(usedInHeader)
    expect(usedInHeader.getAttribute('aria-expanded')).toBe('false')
    expect((document.getElementById('inventory-detail-usedIn-content') as HTMLDivElement).hidden).toBe(true)
  })

  it('keeps screen-level accordion state when the selected item changes', () => {
    const state = makeState()
    const view = render(<InventoryDetail itemId="fire-fragment" inventory={state.inventory} protectedItems={state.protectedItems} equipment={state.equipment} economyState={state} />)
    fireEvent.click(screen.getByRole('button', { name: /USED IN/ }))
    fireEvent.click(screen.getByRole('button', { name: /SOURCE/ }))

    view.rerender(<InventoryDetail itemId="water-fragment" inventory={state.inventory} protectedItems={state.protectedItems} equipment={state.equipment} economyState={state} />)

    expect(screen.getByRole('button', { name: /SOURCE/ }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: /USED IN/ }).getAttribute('aria-expanded')).toBe('false')
  })
})

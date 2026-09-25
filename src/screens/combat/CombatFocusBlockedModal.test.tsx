import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CombatFocusBlockedModal } from './CombatFocusBlockedModal'

describe('CombatFocusBlockedModal', () => {
  it('shows the authoritative Focus preflight values and exposes both exits', () => {
    const onClose = vi.fn()
    const onManageFocus = vi.fn()
    render(<CombatFocusBlockedModal snapshot={{ kind: 'focus', loadoutName: 'Prepared Burst', maxFocus: 35, activeNonCombatFocus: 30, availableForCombat: 5, combatFocusRequired: 10, missingFocus: 5 }} onClose={onClose} onManageFocus={onManageFocus} />)

    expect(screen.getByRole('dialog', { name: 'NOT ENOUGH FOCUS' })).toBeTruthy()
    expect(screen.getByText('Prepared Burst')).toBeTruthy()
    expect(screen.getByText('10 FOCUS')).toBeTruthy()
    expect(screen.getAllByText('5 FOCUS')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'MANAGE FOCUS' }))
    fireEvent.click(screen.getByRole('button', { name: 'CLOSE' }))
    expect(onManageFocus).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

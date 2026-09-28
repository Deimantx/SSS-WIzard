import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { PlayerStatBreakdown } from './EquipmentStatBreakdown'

describe('Wizard Stat breakdown interaction', () => {
  it('opens the readable source ledger from the stat row by click', () => {
    const state = createInitialState()
    render(<TooltipProvider><PlayerStatBreakdown state={state} statKey="maxHealth" value={state.player.maxHealth}><div>Max Health row</div></PlayerStatBreakdown></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Max Health breakdown' }))
    expect(screen.getByRole('dialog', { name: 'Max Health stat breakdown' })).toBeTruthy()
    expect(screen.getByText('Base Character Value')).toBeTruthy()
    expect(screen.getByText('FINAL TOTAL')).toBeTruthy()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../../store/gameStore'
import { DeveloperCombatEncounter } from './DeveloperCombatEncounter'

describe('DeveloperCombatEncounter', () => {
  beforeEach(() => {
    useGameStore.getState().resetSave()
  })

  it('removes Threat-to-Boss debug controls for fixed sequence locations', () => {
    render(<TooltipProvider><DeveloperCombatEncounter /></TooltipProvider>)

    fireEvent.change(screen.getByRole('combobox', { name: 'Location to enter' }), { target: { value: 'black-gate' } })

    expect(screen.getByText('Sequence run setup')).toBeTruthy()
    expect(screen.getByText('Fast resolve sequence steps')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Clear to Boss' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Jump to Boss' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('checkbox', { name: 'Stop when boss is ready' }) as HTMLInputElement).disabled).toBe(true)
    expect(screen.queryByText('Threat')).toBeNull()
  })
})

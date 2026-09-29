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

    fireEvent.click(screen.getByRole('button', { name: 'Location to enter' }))
    fireEvent.click(screen.getByRole('option', { name: 'The Black Gate' }))

    expect(screen.getByText('Sequence run setup')).toBeTruthy()
    expect(screen.getByText('Fast resolve sequence steps')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Clear to Boss' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Jump to Boss' }) as HTMLButtonElement).disabled).toBe(true)
    const stopToggle = document.querySelector('[role="switch"]') as HTMLButtonElement
    expect(stopToggle.textContent).toContain('Boss-ready stop unavailable')
    expect(stopToggle.disabled).toBe(true)
    expect(screen.queryByText('Threat')).toBeNull()
  })

  it('keeps Hunting Ground DevTools bossless while allowing normal fast resolve', () => {
    render(<TooltipProvider><DeveloperCombatEncounter /></TooltipProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Location to enter' }))
    fireEvent.click(screen.getByRole('option', { name: 'Gloamridge' }))
    expect(screen.getByText('Bossless location')).toBeTruthy()
    expect(screen.queryByText('Threat')).toBeNull()
    expect((screen.getByRole('button', { name: 'Fast Resolve 5' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: 'Clear to Boss' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Jump to Boss' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: /Spawn Boss/ })).toBeNull()
  })
})

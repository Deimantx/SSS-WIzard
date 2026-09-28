import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { DeveloperSigils } from './DeveloperSigils'

describe('Developer Sigil Lab', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('uses themed controls and readable authored selection labels', () => {
    const { container } = render(<TooltipProvider><DeveloperSigils /></TooltipProvider>)

    expect(screen.getByRole('heading', { name: 'Sigil Lab' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Force Sigil Tier' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Force Sigil Quality' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Force Sigil Set' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Force Sigil Slot' })).toBeTruthy()
    expect(screen.getByRole('switch', { name: /Ignore global cap/ })).toBeTruthy()
    expect(container.querySelectorAll('select, input[type="checkbox"], input[type="radio"], [title]')).toHaveLength(0)
  })

  it('keeps dropdown options above docked DevTools and applies the selected value', () => {
    render(<TooltipProvider><section role="dialog" aria-modal="false"><DeveloperSigils /></section></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Force Sigil Tier' }))
    expect(screen.getByRole('listbox', { name: 'Force Sigil Tier' }).className).toContain('is-modal-dropdown')
    fireEvent.click(screen.getByRole('option', { name: 'T2' }))
    fireEvent.click(screen.getByRole('button', { name: 'SPAWN CONTROLLED SIGIL' }))

    expect(Object.values(useGameStore.getState().sigils.storage)[0].tier).toBe(2)
  })
  it('spawns and selects a tester Sigil, then applies the rank fixture to that instance', () => {
    render(<TooltipProvider><DeveloperSigils /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'SPAWN CONTROLLED SIGIL' }))
    const created = Object.values(useGameStore.getState().sigils.storage)
    expect(created).toHaveLength(1)
    expect(screen.getByRole('heading', { name: /Arcane Sigil · Slot I/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '+3 RANKS' }))
    expect(useGameStore.getState().sigils.storage[created[0].instanceId]?.rank).toBe(3)
  })

  it('shows human-readable read-only drop results without mutating the profile', () => {
    render(<TooltipProvider><DeveloperSigils /></TooltipProvider>)
    const before = useGameStore.getState().sigils

    fireEvent.click(screen.getByRole('button', { name: 'SIMULATE 100' }))

    expect(screen.getByText('By quality')).toBeTruthy()
    expect(screen.getByText('By Set')).toBeTruthy()
    expect(useGameStore.getState().sigils).toEqual(before)
  })
})

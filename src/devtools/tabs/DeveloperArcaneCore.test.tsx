import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { getArcaneCorePointsSpent, getArcaneCoreRingPointsSpent } from '../../game/systems/arcaneCore'
import { DeveloperArcaneCore } from './DeveloperArcaneCore'

describe('Developer Arcane Core tab', () => {
  beforeEach(() => useGameStore.getState().resetSave())

  it('exposes V6 point, Ring, Core, and diagnostics controls that update the real state', () => {
    render(<DeveloperArcaneCore />)
    expect(screen.getByText(/Arcane Core .* V6 tester controls/)).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Set selected Arcane Core node rank' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'MAX RING 1' })).toBeTruthy()
    expect(screen.getByText('Ring diagnostics')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'MAX RING 1' }))
    expect(getArcaneCoreRingPointsSpent(useGameStore.getState().arcaneCore, 'power', 1)).toBe(44)

    fireEvent.click(screen.getAllByRole('button', { name: 'MAX CORE' })[0]!)
    expect(getArcaneCorePointsSpent(useGameStore.getState().arcaneCore)).toBe(1716)

    fireEvent.click(screen.getAllByRole('button', { name: 'RESET CORE' })[0]!)
    expect(getArcaneCoreRingPointsSpent(useGameStore.getState().arcaneCore, 'power', 1)).toBe(0)
  })
})

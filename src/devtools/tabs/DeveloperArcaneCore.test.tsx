import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { getArcaneCorePointsSpent, getArcaneCoreRingPointsSpent } from '../../game/systems/arcaneCore'
import { DeveloperArcaneCore } from './DeveloperArcaneCore'

describe('Developer Arcane Core tab', () => {
  beforeEach(() => useGameStore.getState().resetSave())

  it('exposes rank, Ring, Core, and diagnostics controls that update the real state', () => {
    render(<DeveloperArcaneCore />)
    expect(screen.getByText('Arcane Core · V3 tester controls')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Set selected Arcane Core node rank' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'MAX RING 1' })).toHaveLength(4)
    expect(screen.getByText('Ring diagnostics')).toBeTruthy()

    fireEvent.click(screen.getAllByRole('button', { name: 'MAX RING 1' })[0])
    expect(getArcaneCoreRingPointsSpent(useGameStore.getState().arcaneCore, 'power', 1)).toBe(43)

    fireEvent.click(screen.getAllByRole('button', { name: 'MAX CORE' })[0])
    expect(getArcaneCorePointsSpent(useGameStore.getState().arcaneCore)).toBe(172)

    fireEvent.click(screen.getAllByRole('button', { name: 'RESET CORE' })[0])
    expect(getArcaneCoreRingPointsSpent(useGameStore.getState().arcaneCore, 'power', 1)).toBe(0)
  })
})

import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DeveloperArtifacts } from './DeveloperArtifacts'
import { useGameStore } from '../../store/gameStore'
import { setArtifactDevPanelVisible } from '../developerToolsStore'

describe('Developer Artifacts tab', () => {
  beforeEach(() => {
    setArtifactDevPanelVisible(false)
    useGameStore.getState().resetSave()
  })

  it('provides artifact selection, progression controls, overrides, and batch actions', () => {
    render(<DeveloperArtifacts />)
    expect(screen.getByText('Artifacts · path tester')).toBeTruthy()
    const selector = screen.getByRole('combobox', { name: 'Developer artifact target' })
    fireEvent.change(selector, { target: { value: 'prismatic-focus' } })
    expect(screen.getByText('Prismatic Focus')).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox', { name: /Free upgrade/ }))
    act(() => useGameStore.getState().debugSetArtifactLevel('prismatic-focus', 1))
    act(() => expect(useGameStore.getState().upgradeArtifact('prismatic-focus')).toBe(true))
    expect(useGameStore.getState().artifactProgress['prismatic-focus']?.level).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: '-1 LEVEL' }))
    expect(useGameStore.getState().artifactProgress['prismatic-focus']?.level).toBe(1)
    expect((screen.getByRole('button', { name: '-1 LEVEL' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'MAX ABSOLUTE' }))
    expect(useGameStore.getState().artifactProgress['prismatic-focus']?.level).toBe(10)
    fireEvent.click(screen.getByRole('checkbox', { name: /Ignore dungeon/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Allow beyond/ }))
    expect(useGameStore.getState().debug.artifactIgnoreDungeonGate).toBe(true)
    expect(useGameStore.getState().debug.artifactAllowBeyondLimit).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'UNLOCK ALL PATHS' }))
    expect(useGameStore.getState().inventory['ember-staff']).toBe(1)
    expect(useGameStore.getState().artifactProgress['ember-staff']?.allocatedNodeIds.length).toBeGreaterThan(0)
  })
})

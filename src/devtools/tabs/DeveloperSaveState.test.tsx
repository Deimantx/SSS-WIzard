import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DeveloperSaveState } from './DeveloperSaveState'
import { useGameStore } from '../../store/gameStore'
import { loadProfileGame } from '../../persistence/profileSaveManager'
import { createProfile, enterProfile } from '../../profiles/profileController'
import { refreshProfiles, setActiveProfileId } from '../../profiles/profileSessionStore'
import { setDeveloperSandbox } from '../developerToolsStore'

describe('Developer Save/Profile controls', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setDeveloperSandbox({ active: false, reason: null, snapshotPresent: false, startedAt: null })
    setActiveProfileId(null)
    refreshProfiles()
  })

  it('confirms and persists a reset for the active profile without changing profile selection', () => {
    expect(createProfile('slot-1', 'Dev Reset').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 3)
    useGameStore.getState().setSchoolXpDebug('fire', 2070)
    render(<DeveloperSaveState copy={async () => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reset Current Profile Progress' }))
    expect(screen.getByRole('dialog', { name: 'Reset current profile progress?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'RESET PROFILE' }))

    expect(useGameStore.getState().schools.fire).toEqual({ level: 1, xp: 0 })
    expect(useGameStore.getState().inventory).toEqual({})
    expect(loadProfileGame('slot-1').state?.schools.fire).toEqual({ level: 1, xp: 0 })
    expect(useGameStore.getState().progress.lifetimeKills).toBe(0)
  })

  it('disables manual save during Sandbox and reenables it after exit', async () => {
    expect(createProfile('slot-1', 'Sandbox Save').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    setDeveloperSandbox({ active: true, reason: 'test', snapshotPresent: true, startedAt: Date.now() })
    render(<DeveloperSaveState copy={async () => undefined} />)
    const save = screen.getByRole('button', { name: 'Save now' })
    expect((save as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/Restore and exit Developer Sandbox before saving the profile/)).toBeTruthy()
    setDeveloperSandbox({ active: false, reason: null, snapshotPresent: false, startedAt: null })
    await waitFor(() => expect((screen.getByRole('button', { name: 'Save now' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Save now' }))
    expect(loadProfileGame('slot-1').state).toBeTruthy()
  })
})

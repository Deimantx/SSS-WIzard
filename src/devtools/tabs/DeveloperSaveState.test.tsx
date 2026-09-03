import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeveloperSaveState } from './DeveloperSaveState'
import { useGameStore } from '../../store/gameStore'
import { loadProfileGame } from '../../persistence/profileSaveManager'
import { createProfile, enterProfile } from '../../profiles/profileController'
import { refreshProfiles, setActiveProfileId } from '../../profiles/profileSessionStore'

describe('Developer Save/Profile controls', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActiveProfileId(null)
    refreshProfiles()
  })

  it('confirms and persists a reset for the active profile without changing profile selection', () => {
    expect(createProfile('slot-1', 'Dev Reset').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 3)
    useGameStore.getState().setSchoolXpDebug('fire', 2070)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<DeveloperSaveState copy={async () => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reset Current Profile Progress' }))

    expect(confirm).toHaveBeenCalledWith('Reset current profile progress?')
    expect(useGameStore.getState().schools.fire).toEqual({ level: 1, xp: 0 })
    expect(useGameStore.getState().inventory).toEqual({})
    expect(loadProfileGame('slot-1').state?.schools.fire).toEqual({ level: 1, xp: 0 })
    expect(useGameStore.getState().progress.lifetimeKills).toBe(0)
    confirm.mockRestore()
  })
})

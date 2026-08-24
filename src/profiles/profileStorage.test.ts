import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { useGameStore } from '../store/gameStore'
import { loadProfileGame, saveProfileGame } from '../persistence/profileSaveManager'
import { LEGACY_SAVE_BACKUP_KEY, SAVE_KEY } from '../persistence/saveSchema'
import { createProfile, enterProfile, leaveToProfiles } from './profileController'
import { PROFILE_REGISTRY_KEY, profileSaveKey } from './profileKeys'
import { loadProfileRegistry, saveProfileRegistry } from './profileStorage'
import { refreshProfiles, setActiveProfileId } from './profileSessionStore'

describe('profile storage and session lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    setActiveProfileId(null)
    refreshProfiles()
  })

  it('keeps exactly three fixed slots and stores gameplay separately from metadata', () => {
    expect(createProfile('slot-1', 'Aster').ok).toBe(true)
    expect(createProfile('slot-2', 'Beryl').ok).toBe(true)
    const registry = loadProfileRegistry()
    expect(Object.keys(registry.slots)).toEqual(['slot-1', 'slot-2', 'slot-3'])
    expect(registry.slots['slot-1']?.name).toBe('Aster')
    expect(localStorage.getItem(PROFILE_REGISTRY_KEY)).toBeTruthy()
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBeTruthy()
    expect(localStorage.getItem(profileSaveKey('slot-2'))).toBeTruthy()
    expect(localStorage.getItem(profileSaveKey('slot-3'))).toBeNull()
  })

  it('migrates a legacy global save into Slot 1', () => {
    const state = createInitialState()
    state.progress.lifetimeKills = 17
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    const registry = loadProfileRegistry()
    expect(registry.slots['slot-1']?.name).toBe('Profile 1')
    expect(loadProfileGame('slot-1').state?.progress.lifetimeKills).toBe(17)
    expect(localStorage.getItem(LEGACY_SAVE_BACKUP_KEY)).toBeTruthy()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })

  it('recovers from corrupt registry data without creating extra slots', () => {
    localStorage.setItem(PROFILE_REGISTRY_KEY, '{not-json')
    const registry = loadProfileRegistry()
    expect(registry.version).toBe(1)
    expect(Object.keys(registry.slots)).toEqual(['slot-1', 'slot-2', 'slot-3'])
    expect(Object.values(registry.slots).every((slot) => slot === null)).toBe(true)
  })

  it('anchors offline time once when a profile is entered', () => {
    const state = createInitialState()
    state.lastSavedAt = Date.now() - 60_000
    expect(saveProfileGame('slot-1', state).ok).toBe(true)
    const registry = loadProfileRegistry()
    registry.slots['slot-1'] = { slotId: 'slot-1', slotNumber: 1, name: 'Offline Test', gameMode: 'default', difficulty: 'normal', createdAt: state.lastSavedAt, lastPlayedAt: null, lastSavedAt: state.lastSavedAt }
    expect(saveProfileRegistry(registry)).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    const firstBank = useGameStore.getState().offlineBankMs
    expect(firstBank).toBeGreaterThanOrEqual(59_000)
    expect(leaveToProfiles().ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    const secondBank = useGameStore.getState().offlineBankMs
    expect(secondBank).toBe(firstBank)
  })
})

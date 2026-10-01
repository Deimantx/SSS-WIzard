import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { loadProfileGame, saveProfileGame, serializeGameState } from './profileSaveManager'
import { profileSaveBackupKey, profileSaveKey } from '../profiles/profileKeys'
import { LEGACY_SAVE_KEY } from './saveSchema'
import { loadProfileRegistry } from '../profiles/profileStorage'

describe('V2 profile save loading', () => {
  beforeEach(() => localStorage.clear())

  it('returns no save for a fresh V2 slot', () => {
    expect(loadProfileGame('slot-1')).toMatchObject({ state: null, error: null, source: null })
  })

  it('loads a valid current V2 document without rewriting it', () => {
    const state = createInitialState()
    state.currencies.gold = 73
    expect(saveProfileGame('slot-1', state, { savedAt: 88 }).ok).toBe(true)
    const raw = localStorage.getItem(profileSaveKey('slot-1'))
    const loaded = loadProfileGame('slot-1')
    expect(loaded).toMatchObject({ source: 'primary', recovered: false, needsCanonicalRewrite: false })
    expect(loaded.state?.currencies.gold).toBe(73)
    expect(JSON.parse(raw!).schemaVersion).toBe(3)
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(raw)
  })

  it('falls back to the single backup when the primary is invalid and leaves both raw documents untouched', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 27
    const backup = JSON.stringify(serializeGameState(state, 100))
    localStorage.setItem(profileSaveBackupKey('slot-1'), backup)
    const corrupt = '{broken-json'
    localStorage.setItem(profileSaveKey('slot-1'), corrupt)

    const loaded = loadProfileGame('slot-1')
    expect(loaded).toMatchObject({ source: 'backup', recovered: true, needsCanonicalRewrite: true })
    expect(loaded.state?.inventory['fire-fragment']).toBe(27)
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(corrupt)
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBe(backup)
  })

  it('starts from fresh state when both V2 copies are invalid', () => {
    localStorage.setItem(profileSaveKey('slot-1'), '{primary-corrupt}')
    localStorage.setItem(profileSaveBackupKey('slot-1'), '{backup-corrupt}')
    const result = loadProfileGame('slot-1')
    expect(result).toMatchObject({ error: null, source: null, recovered: false, needsCanonicalRewrite: true })
    expect(result.state?.schools).toEqual(createInitialState().schools)
    expect(result.state?.inventory).toEqual(createInitialState().inventory)
    expect(result.diagnostics?.primary.ok).toBe(false)
    expect(result.diagnostics?.backup.ok).toBe(false)
  })

  it('ignores legacy saves when loading a slot and creating the profile registry', () => {
    const legacy = { ...createInitialState(), saveVersion: 53 }
    localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(legacy))
    localStorage.setItem('sss-wizard-profile-slot-1-save-v1', JSON.stringify(legacy))
    expect(loadProfileGame('slot-1').state).toBeNull()
    expect(loadProfileRegistry().slots['slot-1']).toBeNull()
    expect(localStorage.getItem(LEGACY_SAVE_KEY)).not.toBeNull()
  })
})

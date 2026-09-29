import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../store/initialState'
import { profileSaveBackupKey, profileSaveKey } from '../profiles/profileKeys'
import { loadProfileGame, resetProfileGame, saveProfileGame, serializeGameState } from './profileSaveManager'

describe('V2 profile primary and backup storage', () => {
  beforeEach(() => localStorage.clear())

  it('writes only the explicit current save and previous primary backup', () => {
    const first = createInitialState()
    first.inventory['fire-fragment'] = 3
    expect(saveProfileGame('slot-1', first, { savedAt: 100 }).ok).toBe(true)
    const second = createInitialState()
    second.inventory['fire-fragment'] = 8
    expect(saveProfileGame('slot-1', second, { savedAt: 200 }).ok).toBe(true)

    expect(JSON.parse(localStorage.getItem(profileSaveKey('slot-1'))!).inventory['fire-fragment']).toBe(8)
    expect(JSON.parse(localStorage.getItem(profileSaveBackupKey('slot-1'))!).inventory['fire-fragment']).toBe(3)
    expect(JSON.parse(localStorage.getItem(profileSaveKey('slot-1'))!).schemaVersion).toBe(1)
    expect(loadProfileGame('slot-1').state?.inventory['fire-fragment']).toBe(8)
  })

  it('does not block an intentional replacement when progression decreases', () => {
    const progressed = createInitialState()
    progressed.schools.fire.xp = 20_000
    progressed.progress.lifetimeKills = 100
    expect(saveProfileGame('slot-1', progressed, { savedAt: 100 }).ok).toBe(true)
    expect(saveProfileGame('slot-1', createInitialState(), { savedAt: 200 }).ok).toBe(true)
    expect(loadProfileGame('slot-1').state?.progress.lifetimeKills).toBe(0)
    expect(JSON.parse(localStorage.getItem(profileSaveBackupKey('slot-1'))!).progress.lifetimeKills).toBe(100)
  })

  it('clears the backup on explicit profile reset', () => {
    const progressed = createInitialState()
    progressed.progress.lifetimeKills = 20
    expect(saveProfileGame('slot-1', progressed).ok).toBe(true)
    expect(resetProfileGame('slot-1', createInitialState(), { savedAt: 500 }).ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(profileSaveKey('slot-1'))!).progress.lifetimeKills).toBe(0)
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBeNull()
  })

  it('restores both V2 keys when the primary write fails', () => {
    const state = createInitialState()
    expect(saveProfileGame('slot-1', state, { savedAt: 100 }).ok).toBe(true)
    const before = [profileSaveKey('slot-1'), profileSaveBackupKey('slot-1')].map((key) => localStorage.getItem(key))
    const originalSetItem = Storage.prototype.setItem
    let failed = false
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (!failed && key === profileSaveKey('slot-1')) { failed = true; throw new Error('simulated storage failure') }
      return originalSetItem.call(this, key, value)
    })
    try {
      const changed = structuredClone(state)
      changed.currencies.gold = 4
      expect(saveProfileGame('slot-1', changed, { savedAt: 300 }).ok).toBe(false)
    } finally { spy.mockRestore() }
    const after = [profileSaveKey('slot-1'), profileSaveBackupKey('slot-1')].map((key) => localStorage.getItem(key))
    expect(after).toEqual(before)
  })

  it('does not put the legacy profile namespace in the active read path', () => {
    const legacy = serializeGameState(createInitialState())
    localStorage.setItem('sss-wizard-profile-slot-1-save-v1', JSON.stringify(legacy))
    localStorage.setItem('sss-wizard-save-v1', JSON.stringify(legacy))
    expect(loadProfileGame('slot-1').state).toBeNull()
    expect(localStorage.getItem('sss-wizard-save-v1')).not.toBeNull()
  })
})

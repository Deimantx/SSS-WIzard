import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../store/initialState'
import { profileSaveBackup2Key, profileSaveBackup3Key, profileSaveBackupKey, profileSaveKey, profileSaveRecoveryKey, profileSaveSuspectKey } from '../profiles/profileKeys'
import { detectCatastrophicProgressRegression } from './progressionEvidence'
import { loadProfileGame, resetProfileGame, saveProfileGame, serializeGameState } from './profileSaveManager'

const clone = <T>(value: T) => JSON.parse(JSON.stringify(value)) as T

describe('progression-aware profile save protection', () => {
  beforeEach(() => localStorage.clear())

  it('detects permanent progression regressions but ignores normal resource spending', () => {
    const previous = createInitialState()
    previous.schools.fire.xp = 12000
    previous.schools.fire.level = 12
    previous.progress.lifetimeKills = 100
    previous.progress.lifetimeKillsByMonster['forest-wisp'] = 100
    previous.progress.bossKillsByBoss['forest-heart'] = 3
    previous.progress.spellRanks['fire-bolt'] = 3
    previous.progress.channeling.discoveries['stable-leyline'] = true
    previous.progress.magicLevelCap = 40
    previous.currencies.gold = 1000
    previous.inventory['fire-fragment'] = 20

    const spent = clone(previous)
    spent.currencies.gold = 100
    spent.inventory['fire-fragment'] = 2
    spent.player.health = 1
    spent.player.mana = 0
    expect(detectCatastrophicProgressRegression(previous, spent).catastrophic).toBe(false)

    const fresh = createInitialState()
    const regression = detectCatastrophicProgressRegression(previous, fresh)
    expect(regression.catastrophic).toBe(true)
    expect(regression.reasons).toEqual(expect.arrayContaining([
      'schoolXp.fire decreased (12000 → 0)',
      'bossKills.forest-heart decreased (3 → 0)',
      'lifetimeKills.forest-wisp decreased (100 → 0)',
      'spellRanks.fire-bolt decreased (3 → 0)',
      'levelCap decreased (40 → 20)',
    ]))
  })

  it('blocks an accidental fresh autosave and preserves a suspect snapshot', () => {
    const progressed = createInitialState()
    progressed.schools.fire.xp = 240
    progressed.schools.fire.level = 12
    progressed.progress.spellRanks['fire-bolt'] = 1
    progressed.progress.spellRanks.ignite = 1
    progressed.progress.lifetimeKills = 12
    progressed.progress.lifetimeKillsByMonster['forest-wisp'] = 12
    progressed.progress.bossKillsByBoss['forest-heart'] = 2
    expect(saveProfileGame('slot-1', progressed, { savedAt: 100 }).ok).toBe(true)
    const primaryBefore = localStorage.getItem(profileSaveKey('slot-1'))

    const result = saveProfileGame('slot-1', createInitialState(), { savedAt: 200 })

    expect(result.ok).toBe(false)
    expect(result.error).toContain('SAVE PROTECTION ACTIVE')
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(primaryBefore)
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBeNull()
    expect(localStorage.getItem(profileSaveSuspectKey('slot-1'))).toBeTruthy()
  })

  it('allows resource spending, lower HP/Mana, and higher progression', () => {
    const previous = createInitialState()
    previous.currencies.gold = 1000
    previous.inventory['fire-fragment'] = 20
    previous.schools.fire.xp = 20
    previous.schools.fire.level = 2
    previous.progress.spellRanks['fire-bolt'] = 1
    expect(saveProfileGame('slot-1', previous, { savedAt: 100 }).ok).toBe(true)

    const candidate = clone(previous)
    candidate.currencies.gold = 100
    candidate.inventory['fire-fragment'] = 2
    candidate.player.health = 1
    candidate.player.mana = 0
    candidate.schools.fire.xp = 40
    candidate.schools.fire.level = 3
    expect(saveProfileGame('slot-1', candidate, { savedAt: 200 }).ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(profileSaveKey('slot-1'))!).currencies.gold).toBe(100)
  })

  it('chooses a progressed valid backup over a fresh valid primary', () => {
    const progressed = createInitialState()
    progressed.schools.fire.xp = 200
    progressed.schools.fire.level = 10
    progressed.progress.bossKillsByBoss['forest-heart'] = 3
    const fresh = createInitialState()
    localStorage.setItem(profileSaveKey('slot-1'), JSON.stringify(serializeGameState(fresh, 200)))
    localStorage.setItem(profileSaveBackupKey('slot-1'), JSON.stringify(serializeGameState(progressed, 100)))

    const loaded = loadProfileGame('slot-1')

    expect(loaded.source).toBe('backup')
    expect(loaded.state?.schools.fire.xp).toBe(200)
    expect(localStorage.getItem(profileSaveSuspectKey('slot-1'))).toBeTruthy()
    expect(saveProfileGame('slot-1', loaded.state!, { savedAt: 300 }).ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(profileSaveBackupKey('slot-1'))!).schools.fire.xp).toBe(200)
  })

  it('retains three historical verified generations during rotation', () => {
    const state = createInitialState()
    expect(saveProfileGame('slot-1', state, { savedAt: 100 }).ok).toBe(true)
    expect(saveProfileGame('slot-1', state, { savedAt: 200 }).ok).toBe(true)
    expect(saveProfileGame('slot-1', state, { savedAt: 300 }).ok).toBe(true)
    expect(saveProfileGame('slot-1', state, { savedAt: 400 }).ok).toBe(true)

    expect(JSON.parse(localStorage.getItem(profileSaveKey('slot-1'))!).lastSavedAt).toBe(400)
    expect(JSON.parse(localStorage.getItem(profileSaveBackupKey('slot-1'))!).lastSavedAt).toBe(300)
    expect(JSON.parse(localStorage.getItem(profileSaveBackup2Key('slot-1'))!).lastSavedAt).toBe(200)
    expect(JSON.parse(localStorage.getItem(profileSaveBackup3Key('slot-1'))!).lastSavedAt).toBe(100)
  })

  it('explicit reset removes old generations and writes a fresh canonical save', () => {
    const progressed = createInitialState()
    progressed.progress.lifetimeKills = 20
    expect(saveProfileGame('slot-1', progressed).ok).toBe(true)
    localStorage.setItem(profileSaveRecoveryKey('slot-1'), 'rescue')
    localStorage.setItem(profileSaveSuspectKey('slot-1'), 'suspect')

    expect(resetProfileGame('slot-1', createInitialState(), { savedAt: 500 }).ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(profileSaveKey('slot-1'))!).progress.lifetimeKills).toBe(0)
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBeNull()
    expect(localStorage.getItem(profileSaveBackup2Key('slot-1'))).toBeNull()
    expect(localStorage.getItem(profileSaveBackup3Key('slot-1'))).toBeNull()
    expect(localStorage.getItem(profileSaveRecoveryKey('slot-1'))).toBeNull()
    expect(localStorage.getItem(profileSaveSuspectKey('slot-1'))).toBeNull()
  })

  it('restores all prior generations when a rotating write fails', () => {
    const state = createInitialState()
    expect(saveProfileGame('slot-1', state, { savedAt: 100 }).ok).toBe(true)
    expect(saveProfileGame('slot-1', state, { savedAt: 200 }).ok).toBe(true)
    const before = [profileSaveKey('slot-1'), profileSaveBackupKey('slot-1'), profileSaveBackup2Key('slot-1'), profileSaveBackup3Key('slot-1')].map((key) => localStorage.getItem(key))
    const originalSetItem = Storage.prototype.setItem
    let failed = false
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (!failed && key === profileSaveBackup2Key('slot-1')) { failed = true; throw new Error('simulated storage failure') }
      return originalSetItem.call(this, key, value)
    })
    try {
      const changed = clone(state)
      changed.currencies.gold = 4
      expect(saveProfileGame('slot-1', changed, { savedAt: 300 }).ok).toBe(false)
    } finally { spy.mockRestore() }
    const after = [profileSaveKey('slot-1'), profileSaveBackupKey('slot-1'), profileSaveBackup2Key('slot-1'), profileSaveBackup3Key('slot-1')].map((key) => localStorage.getItem(key))
    expect(after).toEqual(before)
  })
})

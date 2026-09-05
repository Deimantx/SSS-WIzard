import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { migrateSave } from './migrations'
import { getCriticalSaveSnapshot, criticalSaveSnapshotsEqual } from './saveIntegrity'
import { loadProfileGame, saveProfileGame, serializeGameState } from './profileSaveManager'
import { LEGACY_SAVE_BACKUP_KEY } from './saveSchema'
import { createProfile, enterProfile } from '../profiles/profileController'
import { profileSaveBackupKey, profileSaveKey, profileSaveRecoveryKey } from '../profiles/profileKeys'
import { LEGACY_V13_PROFILE, LEGACY_V14_PROFILE, LEGACY_V4_PROFILE, LEGACY_V9_PROFILE } from './fixtures/legacyProfileFixtures'

const store = (slotId: 'slot-1' | 'slot-2' | 'slot-3', value: unknown) => localStorage.setItem(profileSaveKey(slotId), JSON.stringify(value))

const currentStateWithData = () => {
  const state = createInitialState()
  state.inventory['fire-fragment'] = 27
  state.currencies.gold = 73
  state.progress.lifetimeKills = 4
  return state
}

describe('profile save recovery and historical compatibility', () => {
  beforeEach(() => localStorage.clear())

  it.each([
    ['V4', LEGACY_V4_PROFILE],
    ['V9', LEGACY_V9_PROFILE],
    ['V13', LEGACY_V13_PROFILE],
    ['V14', LEGACY_V14_PROFILE],
  ] as const)('loads the real %s-shaped document through localStorage and loadProfileGame', (label, fixture) => {
    const raw = JSON.stringify(fixture)
    store('slot-1', fixture)
    const loaded = loadProfileGame('slot-1')

    expect(loaded.state).not.toBeNull()
    expect(loaded.source).toBe('primary')
    expect(loaded.state?.saveVersion).toBe(label === 'V4' ? 8 : SAVE_VERSION)
    expect(loaded.diagnostics?.primary).toMatchObject({ present: true, ok: true, saveVersion: Number(label.slice(1)) })
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(raw)
    expect(loaded.state?.inventory['fire-fragment']).toBeGreaterThan(0)
    expect(loaded.state?.progress.lifetimeKills).toBeGreaterThan(0)
    expect(loaded.state?.offlineBankMs).toBeGreaterThan(0)

    if (label === 'V4') {
      expect(loaded.state?.equipment).toMatchObject({ weapon: null, armor: 'stoneweave-robe', offhand: 'tide-focus', amulet: 'windthread-charm' })
      expect(loaded.state?.currencies.gold).toBe(0)
      expect(loaded.state?.activities.research.slots['research-1']).toMatchObject({ itemId: 'fire-fragment', remainingQuantity: 9 })
      expect(loaded.state?.activities.transmutation.jobs).not.toHaveProperty('ember-staff')
      expect(loaded.state?.activities.transmutation.jobs['water-fragment']).toBeDefined()
      expect(loaded.state?.progress.channeling.pillars['arcane-reservoir'].level).toBe(3)
    }
    if (label === 'V9') {
      expect(loaded.state?.currencies.gold).toBe(321)
      expect(loaded.state?.activities.research.slots['research-1']).toMatchObject({ itemId: 'fire-fragment', remainingQuantity: 17 })
      expect(loaded.state?.activities.transmutation.jobs['fire-fragment']).toMatchObject({ progressMs: 500 })
      expect(loaded.state?.progress.focusImprovement.level).toBe(4)
    }
    if (label === 'V13') {
      expect(loaded.state?.combat.enemyCurrentActionId).toBe('arc-spark')
      expect(loaded.state?.combat.enemyCurrentStepId).toBe('arc-spark-step')
      expect(loaded.state?.combat.enemyActionDurationMs).toBe(2000)
      expect(loaded.state?.combat.playerBarrier).toBe(9)
    }
    if (label === 'V14') {
      expect(loaded.state?.combat.enemyActionPatternId).toBe('default')
      expect(loaded.state?.combat.enemyNextActionIndex).toBe(0)
      expect(loaded.state?.combat.enemyActionDurationMs).toBe(2000)
      expect(loaded.state?.combat.enemyCurrentActionId).toBe('arc-spark')
      expect(loaded.state?.combat.enemyCurrentStepId).toBe('arc-spark-step')
      expect(loaded.state?.combat.enemyCurrentActionPatternId).toBe('default')
    }
  })

  it('keeps critical gameplay data stable across a historical migration and a second current migration', () => {
    ;[LEGACY_V4_PROFILE, LEGACY_V9_PROFILE, LEGACY_V13_PROFILE, LEGACY_V14_PROFILE].forEach((fixture) => {
      const first = migrateSave(fixture)
      const second = migrateSave(JSON.parse(JSON.stringify(first)))
      expect(criticalSaveSnapshotsEqual(getCriticalSaveSnapshot(first), getCriticalSaveSnapshot(second))).toBe(true)
    })
  })

  it('loads a current V18 profile without requesting a rewrite', () => {
    const state = currentStateWithData()
    expect(saveProfileGame('slot-1', state).ok).toBe(true)
    const loaded = loadProfileGame('slot-1')
    expect(loaded.source).toBe('primary')
    expect(loaded.recovered).toBe(false)
    expect(loaded.needsCanonicalRewrite).toBe(false)
    expect(loaded.diagnostics?.backup.present).toBe(false)
    expect(loaded.state?.currencies.gold).toBe(73)
  })

  it('reports candidate diagnostics and a truthful missing-backup error', () => {
    const raw = '{primary-corrupt}'
    localStorage.setItem(profileSaveKey('slot-1'), raw)
    const loaded = loadProfileGame('slot-1')
    expect(loaded.error).toBe('Profile save could not be loaded. Primary save failed validation. No profile backup exists.')
    expect(loaded.error).not.toContain('Primary and backup')
    expect(loaded.diagnostics?.primary).toMatchObject({ present: true, ok: false, saveVersion: null })
    expect(loaded.diagnostics?.backup).toMatchObject({ present: false, ok: false, error: null })
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(raw)
  })

  it('returns a clear unsupported-version error without touching the raw save', () => {
    const raw = JSON.stringify({ saveVersion: 37 })
    localStorage.setItem(profileSaveKey('slot-1'), raw)
    const loaded = loadProfileGame('slot-1')
    expect(loaded.error).toBe('Profile save uses unsupported version 37.')
    expect(loaded.diagnostics?.primary).toMatchObject({ present: true, ok: false, saveVersion: 37 })
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(raw)
  })

  it('does not infer a missing saveVersion and leaves the raw candidate untouched', () => {
    const raw = JSON.stringify({ player: { health: 50 } })
    localStorage.setItem(profileSaveKey('slot-1'), raw)
    const loaded = loadProfileGame('slot-1')
    expect(loaded.error).toBe('Profile save is missing a valid saveVersion.')
    expect(loaded.diagnostics?.primary.error).toBe('Save data is missing a valid saveVersion.')
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(raw)
  })

  it('does not recover a version marker or tiny partial object as a fresh save', () => {
    const raw = JSON.stringify({ saveVersion: 15 })
    localStorage.setItem(profileSaveKey('slot-1'), raw)
    const loaded = loadProfileGame('slot-1')
    expect(loaded.state).toBeNull()
    expect(loaded.error).toBe('Profile save could not be loaded. Primary save failed validation. No profile backup exists.')
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(raw)
    expect(localStorage.getItem(profileSaveRecoveryKey('slot-1'))).toBeNull()
  })

  it('uses a valid profile backup after primary corruption and preserves the backup during anchoring', () => {
    expect(createProfile('slot-1', 'Backup Recovery').ok).toBe(true)
    const backupState = currentStateWithData()
    backupState.currencies.gold = 88
    const backupRaw = JSON.stringify(serializeGameState(backupState))
    localStorage.setItem(profileSaveBackupKey('slot-1'), backupRaw)
    const primaryRaw = '{primary-corrupt}'
    localStorage.setItem(profileSaveKey('slot-1'), primaryRaw)

    const loaded = loadProfileGame('slot-1')
    expect(loaded.source).toBe('backup')
    expect(loaded.recovered).toBe(true)
    expect(loaded.diagnostics?.primary.error).toContain('JSON')
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(primaryRaw)
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBe(backupRaw)
    expect(localStorage.getItem(profileSaveRecoveryKey('slot-1'))).toBe(primaryRaw)

    expect(enterProfile('slot-1').ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(profileSaveKey('slot-1'))!).saveVersion).toBe(SAVE_VERSION)
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBe(backupRaw)
  })

  it('recovers a malformed current candidate, snapshots its exact raw bytes, and anchors it safely', () => {
    expect(createProfile('slot-1', 'Rescue Recovery').ok).toBe(true)
    const state = currentStateWithData()
    const malformed = JSON.parse(JSON.stringify(state)) as Record<string, unknown>
    delete malformed.lastSavedAt
    const raw = JSON.stringify(malformed)
    localStorage.setItem(profileSaveKey('slot-1'), raw)
    localStorage.removeItem(profileSaveBackupKey('slot-1'))

    const loaded = loadProfileGame('slot-1')
    expect(loaded.source).toBe('primary')
    expect(loaded.recovered).toBe(true)
    expect(loaded.needsCanonicalRewrite).toBe(true)
    expect(loaded.diagnostics?.primary.error).toBe('Current save is missing required gameplay data.')
    expect(localStorage.getItem(profileSaveRecoveryKey('slot-1'))).toBe(raw)
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(raw)

    expect(enterProfile('slot-1').ok).toBe(true)
    const canonical = JSON.parse(localStorage.getItem(profileSaveKey('slot-1'))!)
    expect(canonical.saveVersion).toBe(SAVE_VERSION)
    expect(canonical.lastSavedAt).toEqual(expect.any(Number))
    expect(localStorage.getItem(profileSaveRecoveryKey('slot-1'))).toBe(raw)
  })

  it('does not overwrite an existing rescue snapshot', () => {
    expect(createProfile('slot-1', 'Rescue Snapshot').ok).toBe(true)
    const state = currentStateWithData()
    const malformed = JSON.parse(JSON.stringify(state)) as Record<string, unknown>
    delete malformed.lastSavedAt
    const raw = JSON.stringify(malformed)
    const existingRescue = 'first-rescue-copy'
    localStorage.setItem(profileSaveRecoveryKey('slot-1'), existingRescue)
    localStorage.setItem(profileSaveKey('slot-1'), raw)

    expect(loadProfileGame('slot-1').state).not.toBeNull()
    expect(localStorage.getItem(profileSaveRecoveryKey('slot-1'))).toBe(existingRescue)
  })

  it('uses the legacy global backup only as Slot-1 last-resort recovery', () => {
    const rawLegacy = JSON.stringify(LEGACY_V13_PROFILE)
    localStorage.setItem(profileSaveKey('slot-1'), '{primary-corrupt}')
    localStorage.setItem(LEGACY_SAVE_BACKUP_KEY, rawLegacy)
    const slotOne = loadProfileGame('slot-1')
    expect(slotOne.source).toBe('legacy-backup')
    expect(slotOne.recovered).toBe(true)
    expect(slotOne.state?.combat.enemyCurrentActionId).toBe('arc-spark')
    expect(localStorage.getItem(LEGACY_SAVE_BACKUP_KEY)).toBe(rawLegacy)

    localStorage.setItem(profileSaveKey('slot-2'), '{primary-corrupt}')
    const slotTwo = loadProfileGame('slot-2')
    expect(slotTwo.state).toBeNull()
    expect(slotTwo.source).toBeNull()
    expect(slotTwo.error).toContain('No profile backup exists.')
  })

  it('fails without altering either genuinely corrupt profile copy', () => {
    const primaryRaw = '{primary-corrupt}'
    const backupRaw = '{backup-corrupt}'
    localStorage.setItem(profileSaveKey('slot-1'), primaryRaw)
    localStorage.setItem(profileSaveBackupKey('slot-1'), backupRaw)
    const loaded = loadProfileGame('slot-1')
    expect(loaded.error).toBe('Profile save could not be loaded. Primary and profile backup both failed validation.')
    expect(loaded.diagnostics?.primary.ok).toBe(false)
    expect(loaded.diagnostics?.backup.ok).toBe(false)
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(primaryRaw)
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBe(backupRaw)
  })
})

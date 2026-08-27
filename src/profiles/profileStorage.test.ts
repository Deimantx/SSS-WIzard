import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { useGameStore } from '../store/gameStore'
import { loadProfileGame, saveProfileGame } from '../persistence/profileSaveManager'
import { SCHOOL_LEVEL_XP } from '../game/core/balance/balance'
import { LEGACY_SAVE_BACKUP_KEY, SAVE_KEY } from '../persistence/saveSchema'
import { createProfile, enterProfile, leaveToProfiles } from './profileController'
import { PROFILE_REGISTRY_KEY, profileSaveBackupKey, profileSaveKey } from './profileKeys'
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

  it('keeps newly earned items through a manual save and profile switch', () => {
    expect(createProfile('slot-1', 'Inventory Test').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 37)
    useGameStore.getState().addItem('life-essence', 9)
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)

    expect(leaveToProfiles().ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(37)
    expect(useGameStore.getState().inventory['life-essence']).toBe(9)
  })

  it('keeps item quantities and protection through autosave, visibility save, and reload', () => {
    expect(createProfile('slot-1', 'Autosave Test').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 5)
    useGameStore.getState().toggleItemProtection('fire-fragment')
    expect(useGameStore.getState().saveGame('autosave').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 2)
    expect(useGameStore.getState().saveGame('visibility').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 10)
    useGameStore.getState().reloadFromStorage()

    expect(useGameStore.getState().inventory['fire-fragment']).toBe(7)
    expect(useGameStore.getState().protectedItems['fire-fragment']).toBe(true)
  })

  it('round-trips Gold earned from selling through a profile switch', () => {
    expect(createProfile('slot-1', 'Gold Test').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 17)
    useGameStore.getState().sellItem('fire-fragment', 5)
    expect(useGameStore.getState().currencies.gold).toBe(5)
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)

    expect(leaveToProfiles().ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    expect(useGameStore.getState().currencies.gold).toBe(5)
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(12)
  })

  it('persists progression maps and permanent rewards exactly once', () => {
    expect(createProfile('slot-1', 'Progress Test').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useGameStore.setState((state) => {
      state.progress.lifetimeKillsByMonster['forest-wisp'] = 12
      state.progress.bossKillsByBoss['grove-sentinel'] = 2
      state.progress.requestProgress['arcane-supply'] = 20
      state.progress.requestClaims['arcane-supply'] = true
      state.progress.permanentFocusBonuses['forest-heart'] = 10
      state.progress.permanentFocusBonuses['guild-apprentice'] = 10
      state.progress.autoHuntBossByDungeon['whispering-woods'] = true
      return state
    })
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)

    expect(leaveToProfiles().ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    const progress = useGameStore.getState().progress
    expect(progress.lifetimeKillsByMonster['forest-wisp']).toBe(12)
    expect(progress.bossKillsByBoss['grove-sentinel']).toBe(2)
    expect(progress.requestProgress['arcane-supply']).toBe(20)
    expect(progress.requestClaims['arcane-supply']).toBe(true)
    expect(progress.permanentFocusBonuses).toEqual({ 'forest-heart': 10, 'guild-apprentice': 10 })
    expect(Object.values(progress.permanentFocusBonuses).reduce((sum, value) => sum + value, 0)).toBe(20)
    expect(progress.autoHuntBossByDungeon['whispering-woods']).toBe(true)
  })

  it('persists inventory, schools, activities, equipment, currency, and pillars through the profile lifecycle', () => {
    expect(createProfile('slot-1', 'Full Lifecycle').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 123)
    useGameStore.getState().addItem('water-fragment', 47)
    useGameStore.getState().addItem('life-essence', 99)
    useGameStore.getState().setSchoolDebug('fire', SCHOOL_LEVEL_XP(6) + 5, 7)
    useGameStore.getState().setSchoolDebug('water', SCHOOL_LEVEL_XP(3) + 5, 4)
    useGameStore.getState().setSchoolDebug('earth', SCHOOL_LEVEL_XP(2) + 5, 3)
    useGameStore.getState().setSchoolDebug('air', SCHOOL_LEVEL_XP(1) + 5, 2)
    useGameStore.getState().prepareResearch('fire-fragment', 'fire', 30)
    useGameStore.getState().setResearchEchoes('research-1', 1)
    useGameStore.getState().assignTransmutationEcho('fire-fragment')
    useGameStore.setState((state) => {
      state.currencies.gold = 321
      state.progress.channeling.pillars['leyline-conduit'] = { rank: 1, level: 3 }
      return state
    })
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)

    expect(leaveToProfiles().ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    expect(useGameStore.getState().inventory).toMatchObject({ 'fire-fragment': 123, 'water-fragment': 47, 'life-essence': 99 })
    expect(useGameStore.getState().schools).toEqual({
      fire: { xp: 125, level: 7 },
      water: { xp: 65, level: 4 },
      earth: { xp: 45, level: 3 },
      air: { xp: 25, level: 2 },
    })
    expect(useGameStore.getState().currencies.gold).toBe(321)
    expect(useGameStore.getState().equipment.weapon).toBe('apprentice-wand')
    expect(useGameStore.getState().progress.channeling.pillars['leyline-conduit']).toEqual({ rank: 1, level: 3 })
    expect(useGameStore.getState().activities.research.slots['research-1']).toMatchObject({ itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 30, remainingQuantity: 30, echoesAssigned: 1 })
    expect(useGameStore.getState().activities.transmutation.jobs['fire-fragment']).toEqual({ echoesAssigned: 1, progressMs: 0 })

    useGameStore.getState().addItem('fire-fragment', 7)
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)
    useGameStore.getState().hydrateState(createInitialState())
    useGameStore.getState().reloadFromStorage()
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(130)
    expect(useGameStore.getState().schools.fire).toEqual({ xp: 125, level: 7 })
    expect(useGameStore.getState().schools.water).toEqual({ xp: 65, level: 4 })
  })

  it('recovers a valid backup when the primary profile save is corrupt', () => {
    expect(createProfile('slot-1', 'Backup Test').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 23)
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)
    const primary = localStorage.getItem(profileSaveKey('slot-1'))
    expect(primary).toBeTruthy()
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBeTruthy()

    localStorage.setItem(profileSaveKey('slot-1'), '{corrupt')
    const loaded = loadProfileGame('slot-1')
    expect(loaded.source).toBe('backup')
    expect(loaded.recovered).toBe(true)
    expect(loaded.state?.inventory['fire-fragment']).toBe(23)
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe('{corrupt')
    expect(primary).not.toBeNull()
  })

  it('rejects a candidate that loses critical data without replacing the primary or backup', () => {
    expect(createProfile('slot-1', 'Integrity Test').ok).toBe(true)
    expect(enterProfile('slot-1').ok).toBe(true)
    useGameStore.getState().addItem('fire-fragment', 19)
    expect(useGameStore.getState().saveGame('manual').ok).toBe(true)
    const primaryBefore = localStorage.getItem(profileSaveKey('slot-1'))
    const backupBefore = localStorage.getItem(profileSaveBackupKey('slot-1'))
    const invalidState = { ...useGameStore.getState(), inventory: { ...useGameStore.getState().inventory, 'removed-item': 4 } } as never

    const result = saveProfileGame('slot-1', invalidState)

    expect(result.ok).toBe(false)
    expect(result.error).toContain('SAVE FAILED')
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBe(primaryBefore)
    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toBe(backupBefore)
  })

  it('keeps the player on Profile Select when both gameplay copies are unreadable', () => {
    expect(createProfile('slot-1', 'Unreadable Test').ok).toBe(true)
    localStorage.setItem(profileSaveKey('slot-1'), '{primary-corrupt')
    localStorage.setItem(profileSaveBackupKey('slot-1'), '{backup-corrupt')

    const result = enterProfile('slot-1')

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Profile save could not be loaded.')
  })
})

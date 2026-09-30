import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { loadProfileGame, saveProfileGame, serializeGameState } from '../profileSaveManager'
import { profileSaveBackupKey, profileSaveKey } from '../../profiles/profileKeys'
import { setDeveloperSandboxSavePaused } from '../developerSandboxSaveGuard'
import { validateV2RoundTrip } from './saveRoundTrip'
import { validateStoredSave } from '../saveIntegrity'
import { loadPersistedGameStateV1 } from './saveLoader'
import { parsePersistedGameStateV1, validatePersistedGameStateV1 } from './saveSchema'

describe('Save System V2', () => {
  beforeEach(() => {
    localStorage.clear()
    setDeveloperSandboxSavePaused(false)
  })

  it('round-trips a new game without saving runtime UI, developer, or notification state', () => {
    const state = createInitialState()
    state.debug.playerStats.maxHealthFlat = 500
    state.notifications = [{ id: 'test', text: 'runtime-only', tone: 'info' }]
    state.ui.screen = 'equipment'
    ;(state as typeof state & { recentAcquisitions?: unknown[] }).recentAcquisitions = [{ itemId: 'test' }]

    const document = serializeGameState(state, 1234)
    expect(document.schemaVersion).toBe(2)
    expect(document).not.toHaveProperty('debug')
    expect(document).not.toHaveProperty('ui')
    expect(document).not.toHaveProperty('notifications')
    expect(document).not.toHaveProperty('recentAcquisitions')
    expect(validateV2RoundTrip(JSON.stringify(document), state).ok).toBe(true)

    const result = saveProfileGame('slot-1', state, { savedAt: 1234 })
    expect(result.ok).toBe(true)
    expect(loadProfileGame('slot-1').state?.ui.screen).toBe('home')
    expect(loadProfileGame('slot-1').state?.debug.playerStats.maxHealthFlat).toBe(0)
    expect(loadProfileGame('slot-1').state?.notifications).toEqual([])
  })

  it('preserves inventory, equipment, world progress, resource values, and contract RNG exactly', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 17
    state.equipment.weapon = 'ember-staff'
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.availableContracts = []
    state.progress.huntersOrder.blockedTargets = ['forest-wisp', 'cinder-moth']
    state.progress.huntersOrder.pinnedContractIds = ['hunt-pinned']
    state.progress.huntersOrder.preferredContractType = 'family'
    state.progress.huntersOrder.preferredHuntingGroundId = 'hunters-ground'
    state.progress.huntersOrder.lastSelectedQuarryByGround = { 'hunters-ground': 'ashen-tracker' }
    state.progress.huntersOrder.rngState = 0x12345678
    state.progress.arcaneGuild.availableCommissions = []
    state.progress.arcaneGuild.rngState = 0x76543210
    state.player.health = 41
    state.player.mana = 19
    state.combat.playerBarrier = 7

    const encoded = JSON.stringify(serializeGameState(state, 500))
    const roundTrip = validateV2RoundTrip(encoded, state)
    expect(roundTrip.ok).toBe(true)
    expect(roundTrip.state?.progress.huntersOrder).toEqual(state.progress.huntersOrder)
    expect(roundTrip.state?.progress.arcaneGuild).toEqual(state.progress.arcaneGuild)
    expect(roundTrip.state?.inventory).toEqual(state.inventory)
    expect(roundTrip.state?.equipment).toEqual(state.equipment)
    expect(roundTrip.state?.player.health).toBe(41)
    expect(roundTrip.state?.player.mana).toBe(19)
    expect(roundTrip.state?.combat.playerBarrier).toBe(7)
  })

  it('preserves the explicit deterministic combat checkpoint while excluding the event log', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    state.combat.targetEnemyId = 'forest-wisp'
    state.combat.enemyWorldTier = 1
    state.combat.enemyInstanceSerial = 9
    state.combat.enemyInstanceKey = 'enemy:9'
    state.combat.enemyHp = 57
    state.combat.enemyMaxHp = 100
    state.combat.enemyActionTimerMs = 321
    state.combat.combatRngState = 0x12345678
    state.combat.arcaneCoreRuntime.elapsedMs = 4567
    state.combat.log = ['runtime-only event']

    const document = serializeGameState(state, 88)
    const roundTrip = validateV2RoundTrip(JSON.stringify(document), state)
    const expected = structuredClone(state.combat)
    delete (expected as Partial<typeof expected>).log
    expect(roundTrip.ok).toBe(true)
    expect(document.combat).toEqual(expected)
    expect(roundTrip.state?.combat.log).toEqual([])
  })

  it('round-trips active Wards and strips stale Wards from inactive saves', () => {
    const active = createInitialState()
    active.combat.active = true
    active.combat.dungeonId = 'emberfall-basin'
    active.combat.elementalDamageReductions = [{ element: 'fire', reduction: 0.15, sourceId: 'fire-ward', expiresAt: 21_000 }]
    const activeDocument = serializeGameState(active, 456)
    expect(validatePersistedGameStateV1(activeDocument)).toBe(true)
    expect(validateV2RoundTrip(JSON.stringify(activeDocument), active).state?.combat.elementalDamageReductions).toEqual(active.combat.elementalDamageReductions)

    const legacySchemaV2 = structuredClone(activeDocument) as unknown as { combat: Record<string, unknown> }
    delete legacySchemaV2.combat.elementalDamageReductions
    expect(validatePersistedGameStateV1(legacySchemaV2)).toBe(true)
    expect(loadPersistedGameStateV1(legacySchemaV2 as unknown as typeof activeDocument).combat.elementalDamageReductions).toEqual([])

    const inactive = createInitialState()
    inactive.combat.elementalDamageReductions = active.combat.elementalDamageReductions
    expect(serializeGameState(inactive, 457).combat.elementalDamageReductions).toEqual([])
  })

  it('keeps empty contract boards empty and never consumes Hunter or Guild RNG while loading', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.availableContracts = []
    state.progress.huntersOrder.activeContract = null
    state.progress.huntersOrder.rngState = 183
    state.progress.guildUnlocked = true
    state.progress.arcaneGuild.availableCommissions = []
    state.progress.arcaneGuild.rngState = 299
    const saved = JSON.stringify(serializeGameState(state, 99))

    const loaded = loadProfileGameFromRaw(saved)
    expect(loaded.progress.huntersOrder.availableContracts).toEqual([])
    expect(loaded.progress.huntersOrder.rngState).toBe(183)
    expect(loaded.progress.arcaneGuild.availableCommissions).toEqual([])
    expect(loaded.progress.arcaneGuild.rngState).toBe(299)
  })

  it('rebuilds derived caps and clamps saved HP, Mana, and Barrier during runtime initialization', () => {
    const state = createInitialState()
    const document = serializeGameState(state, 100)
    document.player.health = 1_000_000
    document.player.mana = 1_000_000
    document.combat.playerBarrier = -50
    const loaded = loadPersistedGameStateV1(parsePersistedGameStateV1(JSON.stringify(document)))

    expect(loaded.player.health).toBe(loaded.player.maxHealth)
    expect(loaded.player.mana).toBe(loaded.player.maxMana)
    expect(loaded.combat.playerBarrier).toBe(0)
  })

  it('uses only V2 storage and falls back from a corrupt current save to its single backup', () => {
    const first = createInitialState()
    first.inventory['fire-fragment'] = 3
    expect(saveProfileGame('slot-1', first, { savedAt: 100 }).ok).toBe(true)
    const next = createInitialState()
    next.inventory['fire-fragment'] = 8
    expect(saveProfileGame('slot-1', next, { savedAt: 200 }).ok).toBe(true)

    expect(localStorage.getItem(profileSaveBackupKey('slot-1'))).toContain('"savedAt":100')
    localStorage.setItem(profileSaveKey('slot-1'), '{invalid')
    const loaded = loadProfileGame('slot-1')
    expect(loaded.source).toBe('backup')
    expect(loaded.state?.inventory['fire-fragment']).toBe(3)
    expect(localStorage.getItem('sss-wizard-profile-slot-1-save-v1')).toBeNull()
  })

  it('suppresses writes without reporting a save failure during Developer Sandbox', () => {
    setDeveloperSandboxSavePaused(true)
    expect(saveProfileGame('slot-1', createInitialState())).toMatchObject({ ok: true, skipped: true, reason: 'developer-sandbox' })
    expect(localStorage.getItem(profileSaveKey('slot-1'))).toBeNull()
  })

  it('rejects malformed nested Hunter, Guild, Combat, and activity records', () => {
    const baseline = serializeGameState(createInitialState(), 77)
    const malformed: Array<[string, (document: typeof baseline) => void]> = [
      ['Hunter RNG', (document) => { (document.progress.huntersOrder as { rngState: number }).rngState = Number.NaN }],
      ['Hunter rank', (document) => { (document.progress.huntersOrder as { rankId: string }).rankId = 'not-a-rank' }],
      ['Guild node rank', (document) => { document.progress.guildSkillNodeRanks['mana-efficiency' as keyof typeof document.progress.guildSkillNodeRanks] = -1 }],
      ['monster ID', (document) => { (document.combat as { enemyId: string | null }).enemyId = 'missing-monster' }],
      ['dungeon ID', (document) => { (document.combat as { dungeonId: string | null }).dungeonId = 'missing-dungeon' }],
      ['unapproved combat field', (document) => { (document.combat as Record<string, unknown>).runtimeDebugOverride = true }],
      ['transmutation recipe ID', (document) => { (document.activities.transmutation.jobs as Record<string, unknown>)['missing-recipe'] = { acolyteAssigned: 1, progressMs: 1 } }],
      ['research item ID', (document) => { document.activities.research.slots['research-1'] = { itemId: 'missing-item', schoolId: 'fire', progressMs: 0, acolyteAssigned: 0 } as never }],
    ]
    for (const [label, corrupt] of malformed) {
      const document = structuredClone(baseline)
      corrupt(document)
      expect(validatePersistedGameStateV1(document), label).toBe(false)
    }
  })
})

const loadProfileGameFromRaw = (encoded: string) => {
  const result = validateStoredSave(encoded)
  if (!result.state) throw new Error(result.error ?? 'V2 fixture did not load.')
  return result.state
}

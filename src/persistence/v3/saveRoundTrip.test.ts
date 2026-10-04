import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../../store/initialState'
import { loadProfileGame, saveProfileGame, serializeGameState } from '../profileSaveManager'
import { profileSaveBackupKey, profileSaveKey } from '../../profiles/profileKeys'
import { setDeveloperSandboxSavePaused } from '../developerSandboxSaveGuard'
import { validateV3RoundTrip } from './saveRoundTrip'
import { validateStoredSave } from '../saveIntegrity'
import { loadPersistedGameStateV3 } from './saveLoader'
import { parsePersistedGameStateV3, validatePersistedGameStateV3 } from './saveSchema'
import { COMBAT_LOCATIONS } from '../../game/content/combat-locations/worldNavigation'

describe('current Save System', () => {
  beforeEach(() => {
    localStorage.clear()
    setDeveloperSandboxSavePaused(false)
  })

  it('round-trips a new game without saving transient UI, developer, or notification state', () => {
    const state = createInitialState()
    state.debug.playerStats.maxHealthFlat = 500
    state.notifications = [{ id: 'test', text: 'runtime-only', tone: 'info' }]
    state.ui.screen = 'equipment'
    ;(state as typeof state & { recentAcquisitions?: unknown[] }).recentAcquisitions = [{ itemId: 'test' }]

    const document = serializeGameState(state, 1234)
    expect(document.schemaVersion).toBe(3)
    expect(document.contentVersion).toBe(SAVE_VERSION)
    expect(SAVE_VERSION).toBe(66)
    expect(document).not.toHaveProperty('debug')
    expect(document).not.toHaveProperty('ui')
    expect(document).not.toHaveProperty('notifications')
    expect(document).not.toHaveProperty('recentAcquisitions')
    expect(validateV3RoundTrip(JSON.stringify(document), state).ok).toBe(true)

    const result = saveProfileGame('slot-1', state, { savedAt: 1234 })
    expect(result.ok).toBe(true)
    expect(loadProfileGame('slot-1').state?.ui.screen).toBe('home')
    expect(loadProfileGame('slot-1').state?.debug.playerStats.maxHealthFlat).toBe(0)
    expect(loadProfileGame('slot-1').state?.notifications).toEqual([])
  })

  it('migrates schema-2 Combat and Hunter location fields without losing an active checkpoint', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.locationId = 'black-gate'
    state.combat.sequenceIndex = 4
    state.combat.enemyId = 'black-gatekeeper'
    state.combat.enemyHp = 321
    state.progress.autoHuntBossByLocation['black-gate'] = true
    state.progress.huntersOrder.activeContract = {
      id: 'ground-patrol-contract', huntingGroundId: 'hunters-ground',
      targetSpec: { type: 'ground', groundId: 'hunters-ground' }, target: 125, progress: 9,
      tier: 'routine', reputationReward: 5, marksReward: 1,
    }
    const schema2 = serializeGameState(state, 1235) as unknown as Record<string, any>
    schema2.schemaVersion = 2
    schema2.contentVersion = 65
    schema2.combat.dungeonId = schema2.combat.locationId
    delete schema2.combat.locationId
    schema2.combat.dungeonSequenceIndex = schema2.combat.sequenceIndex
    delete schema2.combat.sequenceIndex
    schema2.progress.autoHuntBossByDungeon = schema2.progress.autoHuntBossByLocation
    delete schema2.progress.autoHuntBossByLocation
    schema2.progress.huntersOrder.activeContract.targetSpec.dungeonId = schema2.progress.huntersOrder.activeContract.targetSpec.groundId
    delete schema2.progress.huntersOrder.activeContract.targetSpec.groundId
    schema2.ui = { lastEnteredCombatDungeonId: 'black-gate', screen: 'combat' }

    const parsed = parsePersistedGameStateV3(JSON.stringify(schema2))
    const loaded = loadPersistedGameStateV3(parsed)
    expect(loaded.combat).toMatchObject({ active: true, locationId: 'black-gate', sequenceIndex: COMBAT_LOCATIONS['black-gate'].encounterSequence?.length, enemyId: 'black-gatekeeper', enemyHp: 321 })
    expect(loaded.progress.autoHuntBossByLocation['black-gate']).toBe(true)
    expect(loaded.progress.huntersOrder.activeContract?.targetSpec).toEqual({ type: 'ground', groundId: 'hunters-ground' })
    expect(loaded.ui.lastEnteredCombatLocationId).toBe('black-gate')
  })

  it('keeps a current active encounter World Tier snapshot and computes loot tier only at runtime', () => {
    const state = createInitialState()
    state.worldTier = { current: 2, highestUnlocked: 5 }
    state.combat.active = true
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyWorldTier = 5
    state.combat.enemyHp = 123
    const v62 = serializeGameState(state, 1236) as unknown as Record<string, any>
    v62.contentVersion = 65
    const parsed = parsePersistedGameStateV3(JSON.stringify(v62))
    const loaded = loadPersistedGameStateV3(parsed)
    expect(loaded.combat).toMatchObject({ active: true, enemyId: 'forest-wisp', enemyWorldTier: 5, enemyHp: 123 })
    expect(loaded.worldTier).toEqual({ current: 2, highestUnlocked: 5 })
    expect(JSON.stringify(v62)).not.toContain('lootTier')
  })

  it('persists only the last-entered Combat Location from UI state', () => {
    const state = createInitialState()
    state.ui.lastEnteredCombatLocationId = 'broken-meridian'
    state.ui.screen = 'combat'

    const document = serializeGameState(state, 1236)
    expect(document.ui).toEqual({ lastEnteredCombatLocationId: 'broken-meridian' })
    const loaded = loadPersistedGameStateV3(parsePersistedGameStateV3(JSON.stringify(document)))
    expect(loaded.ui.lastEnteredCombatLocationId).toBe('broken-meridian')
    expect(loaded.ui.screen).toBe('home')
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
    const roundTrip = validateV3RoundTrip(encoded, state)
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
    state.combat.locationId = 'whispering-woods'
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
    const roundTrip = validateV3RoundTrip(JSON.stringify(document), state)
    const expected = structuredClone(state.combat)
    delete (expected as Partial<typeof expected>).log
    expect(roundTrip.ok).toBe(true)
    expect(document.combat).toEqual(expected)
    expect(roundTrip.state?.combat.log).toEqual([])
  })

  it('round-trips active Wards and strips stale Wards from inactive saves', () => {
    const active = createInitialState()
    active.combat.active = true
    active.combat.locationId = 'emberfall-basin'
    active.combat.elementalDamageReductions = [{ element: 'fire', reduction: 0.15, sourceId: 'fire-ward', expiresAt: 21_000, durationMs: 20_000 }]
    const activeDocument = serializeGameState(active, 456)
    expect(validatePersistedGameStateV3(activeDocument)).toBe(true)
    expect(validateV3RoundTrip(JSON.stringify(activeDocument), active).state?.combat.elementalDamageReductions).toEqual(active.combat.elementalDamageReductions)

    const legacySchemaV2 = structuredClone(activeDocument) as unknown as { combat: Record<string, unknown> }
    delete legacySchemaV2.combat.elementalDamageReductions
    expect(validatePersistedGameStateV3(legacySchemaV2)).toBe(true)
    expect(loadPersistedGameStateV3(legacySchemaV2 as unknown as typeof activeDocument).combat.elementalDamageReductions).toEqual([])

    const inactive = createInitialState()
    inactive.combat.elementalDamageReductions = active.combat.elementalDamageReductions
    expect(serializeGameState(inactive, 457).combat.elementalDamageReductions).toEqual([])
  })

  it('strictly validates persisted Ward rows and sanitizes malformed runtime input', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.locationId = 'emberfall-basin'
    const valid = serializeGameState(state, 458)
    const badEntries: unknown[] = [
      { element: 'lightning', reduction: 0.2, sourceId: 'ward' },
      { element: 'fire', reduction: Number.NaN, sourceId: 'ward' },
      { element: 'fire', reduction: 0, sourceId: 'ward' },
      { element: 'fire', reduction: 1, sourceId: 'ward' },
      { element: 'fire', reduction: 0.2, sourceId: '  ' },
      { element: 'fire', reduction: 0.2, sourceId: 'ward', expiresAt: -1 },
      null,
    ]
    for (const ward of badEntries) {
      const document = structuredClone(valid) as unknown as { combat: Record<string, unknown> }
      document.combat.elementalDamageReductions = [ward]
      expect(validatePersistedGameStateV3(document)).toBe(false)
      expect(loadPersistedGameStateV3(document as unknown as typeof valid).combat.elementalDamageReductions).toEqual([])
    }
    const tooMany = structuredClone(valid) as unknown as { combat: Record<string, unknown> }
    tooMany.combat.elementalDamageReductions = Array.from({ length: 33 }, (_, index) => ({ element: 'fire', reduction: 0.15, sourceId: `ward-${index}` }))
    expect(validatePersistedGameStateV3(tooMany)).toBe(false)
    const sanitizeMany = loadPersistedGameStateV3(tooMany as unknown as typeof valid)
    expect(sanitizeMany.combat.elementalDamageReductions).toHaveLength(32)
  })

  it('starts a fresh character from an unversioned save', () => {
    const state = createInitialState()
    state.progress.lifetimeKills = 8
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    const oldDocument = serializeGameState(state, 459) as unknown as Record<string, unknown>
    delete oldDocument.contentVersion
    const loaded = loadProfileGameFromRaw(JSON.stringify(oldDocument))
    expect(loaded.progress.lifetimeKills).toBe(0)
    expect(loaded.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0).toBe(0)
    expect(loaded.resonance.arcane).toBe(0)
  })

  it('starts a fresh character from content versions 63 and below', () => {
    const progressed = createInitialState()
    progressed.player.health = 1
    progressed.progress.lifetimeKills = 900
    progressed.progress.bossKillsByBoss['corrupted-greatbear'] = 4
    progressed.resonance.arcane = 1234
    const document = serializeGameState(progressed, 460)
    document.contentVersion = 63

    const loaded = loadProfileGameFromRaw(JSON.stringify(document))
    expect(loaded.player).toEqual(createInitialState().player)
    expect(loaded.progress.lifetimeKills).toBe(0)
    expect(loaded.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0).toBe(0)
    expect(loaded.resonance.arcane).toBe(0)
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
    const loaded = loadPersistedGameStateV3(parsePersistedGameStateV3(JSON.stringify(document)))

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
      ['dungeon ID', (document) => { (document.combat as { locationId: string | null }).locationId = 'missing-dungeon' }],
      ['unapproved combat field', (document) => { (document.combat as Record<string, unknown>).runtimeDebugOverride = true }],
      ['transmutation recipe ID', (document) => { (document.activities.transmutation.jobs as Record<string, unknown>)['missing-recipe'] = { acolyteAssigned: 1, progressMs: 1 } }],
      ['research item ID', (document) => { document.activities.research.slots['research-1'] = { itemId: 'missing-item', schoolId: 'fire', progressMs: 0, acolyteAssigned: 0 } as never }],
    ]
    for (const [label, corrupt] of malformed) {
      const document = structuredClone(baseline)
      corrupt(document)
      expect(validatePersistedGameStateV3(document), label).toBe(false)
    }
  })
})

const loadProfileGameFromRaw = (encoded: string) => {
  const result = validateStoredSave(encoded)
  if (!result.state) throw new Error(result.error ?? 'V2 fixture did not load.')
  return result.state
}

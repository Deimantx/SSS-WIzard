import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../../store/initialState'
import { loadProfileGame, saveProfileGame, serializeGameState } from '../profileSaveManager'
import { profileSaveBackupKey, profileSaveKey } from '../../profiles/profileKeys'
import { setDeveloperSandboxSavePaused } from '../developerSandboxSaveGuard'
import { validateV3RoundTrip } from './saveRoundTrip'
import { validateStoredSave } from '../saveIntegrity'
import { loadPersistedGameStateV3 } from './saveLoader'
import { parsePersistedGameStateV3, validatePersistedGameStateV3 } from './saveSchema'

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
    expect(SAVE_VERSION).toBe(62)
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
      id: 'legacy-region-contract', huntingGroundId: 'hunters-ground',
      targetSpec: { type: 'region', locationId: 'hunters-ground' }, target: 125, progress: 9,
      tier: 'routine', reputationReward: 5, marksReward: 1,
    }
    const schema2 = serializeGameState(state, 1235) as unknown as Record<string, any>
    schema2.schemaVersion = 2
    schema2.contentVersion = 61
    schema2.combat.dungeonId = schema2.combat.locationId
    delete schema2.combat.locationId
    schema2.combat.dungeonSequenceIndex = schema2.combat.sequenceIndex
    delete schema2.combat.sequenceIndex
    schema2.progress.autoHuntBossByDungeon = schema2.progress.autoHuntBossByLocation
    delete schema2.progress.autoHuntBossByLocation
    schema2.progress.huntersOrder.activeContract.targetSpec.dungeonId = schema2.progress.huntersOrder.activeContract.targetSpec.locationId
    delete schema2.progress.huntersOrder.activeContract.targetSpec.locationId
    schema2.ui = { lastEnteredCombatDungeonId: 'black-gate', screen: 'combat' }

    const parsed = parsePersistedGameStateV3(JSON.stringify(schema2))
    const loaded = loadPersistedGameStateV3(parsed)
    expect(loaded.combat).toMatchObject({ active: true, locationId: 'black-gate', sequenceIndex: 4, enemyId: 'black-gatekeeper', enemyHp: 321 })
    expect(loaded.progress.autoHuntBossByLocation['black-gate']).toBe(true)
    expect(loaded.progress.huntersOrder.activeContract?.targetSpec).toEqual({ type: 'region', locationId: 'hunters-ground' })
    expect(loaded.ui.lastEnteredCombatLocationId).toBe('black-gate')
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

  it('reconciles old 22-second canonical Wards and Black Sigil Chronicle history without replaying rewards', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.locationId = 'black-gate'
    state.combat.enemyId = 'black-gatekeeper'
    state.combat.targetEnemyId = 'black-gatekeeper'
    state.combat.arcaneCoreRuntime.elapsedMs = 5_000
    state.combat.elementalDamageReductions = [
      { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', expiresAt: 27_000 },
      { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', expiresAt: 26_000 },
      { element: 'water', reduction: 0.1, sourceId: 'legacy-water-source', expiresAt: 27_000 },
    ]
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    state.progress.bossKillsByBoss['unspoken-prelate'] = 1
    state.progress.bossKillsByBoss['sigil-warden'] = 1
    state.progress.bossKillsByBoss['black-gatekeeper'] = 1
    state.progress.chronicle.grantedUnlockRewardIds.push('sf-socket-first-crystal')
    const oldDocument = serializeGameState(state, 460)
    oldDocument.contentVersion = 59

    const migrated = loadProfileGameFromRaw(JSON.stringify(oldDocument))
    expect(migrated.combat.elementalDamageReductions).toEqual([
      { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', expiresAt: 25_000, durationMs: 20_000 },
      { element: 'water', reduction: 0.1, sourceId: 'legacy-water-source', expiresAt: 27_000 },
    ])
    expect(migrated.progress.chronicle.completedObjectiveIds).toEqual(expect.arrayContaining([
      'sf-m5a-break-black-sigil-reach', 'sf-m5b-enter-black-gate', 'sf-m5c-black-gatekeeper',
    ]))
    expect(migrated.worldTier.highestUnlocked).toBe(5)
    expect(migrated.progress.chronicle.grantedUnlockRewardIds.filter((id) => id === 'sf-socket-first-crystal')).toHaveLength(1)
    expect(migrated.combat).toMatchObject({ active: true, locationId: 'black-gate', enemyId: 'black-gatekeeper' })
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

  it('reconciles progressed canonical V2 saves with no contentVersion before activation', () => {
    const state = createInitialState()
    state.progress.lifetimeKills = 8
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    const oldDocument = serializeGameState(state, 459) as unknown as Record<string, unknown>
    delete oldDocument.contentVersion
    const loaded = loadProfileGameFromRaw(JSON.stringify(oldDocument))
    expect(loaded.progress.chronicle.eventFlags['elemental-tutorial-zones-opened']).toBe(true)
    expect(loaded.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated']).toBe(true)
    expect(loaded.progress.chronicle.completedObjectiveIds).toContain('m2d-defeat-elemental-boss')
    expect(loaded.progress.chronicle.completedObjectiveIds).toContain('m3-heart-of-the-woods')
    expect(loaded.progress.chronicle.completedObjectiveIds).toContain('m4-break-the-den')
    expect(loaded.progress.bossKillsByBoss['corrupted-greatbear']).toBe(1)
    expect(loadPersistedGameStateV3(serializeGameState(loaded)).progress.chronicle.completedObjectiveIds).toEqual(loaded.progress.chronicle.completedObjectiveIds)
  })

  it('migrates v57 Elemental Scar history through the canonical V2 profile loader', () => {
    const cases = [
      { bosses: ['archmage-edrin-shade'], highestTier: 2, completed: [] },
      { bosses: ['archmage-edrin-shade', 'corrupted-elemental-gatekeeper'], highestTier: 2, completed: ['sf-m1-cross-fractured-approach', 'sf-m2-elemental-gatekeeper'] },
      { bosses: ['archmage-edrin-shade', 'corrupted-elemental-gatekeeper', 'drowned-keeper'], highestTier: 2, completed: ['sf-m2-elemental-gatekeeper'] },
      { bosses: ['archmage-edrin-shade', 'corrupted-elemental-gatekeeper', 'drowned-keeper', 'flamebound-revenant', 'rootscar-ancient'], highestTier: 2, completed: ['sf-m3a-stabilize-elemental-scar'] },
      { bosses: ['archmage-edrin-shade', 'corrupted-elemental-gatekeeper', 'drowned-keeper', 'flamebound-revenant', 'rootscar-ancient', 'crossroads-keeper'], highestTier: 3, completed: ['sf-m3c-crossroads-keeper'] },
    ] as const
    for (const fixture of cases) {
      const state = createInitialState()
      state.progress.bossKillsByBoss = Object.fromEntries(fixture.bosses.map((bossId) => [bossId, 1])) as typeof state.progress.bossKillsByBoss
      const document = serializeGameState(state, 500)
      document.contentVersion = 57
      const migrated = loadProfileGameFromRaw(JSON.stringify(document))
      expect(migrated.worldTier.highestUnlocked).toBe(fixture.highestTier)
      for (const objectiveId of fixture.completed) expect(migrated.progress.chronicle.completedObjectiveIds).toContain(objectiveId)
      expect(migrated.progress.bossKillsByBoss).toMatchObject(state.progress.bossKillsByBoss)
      expect(loadProfileGameFromRaw(JSON.stringify(serializeGameState(migrated, 501))).progress.chronicle.completedObjectiveIds).toEqual(migrated.progress.chronicle.completedObjectiveIds)
    }
  })

  it('reconciles 58-to-59 Shattered Meridian history through canonical V2 documents', () => {
    const cases = [
      { bosses: ['crossroads-keeper'], completed: [] },
      { bosses: ['crossroads-keeper', 'graveglass-behemoth'], completed: [] },
      { bosses: ['crossroads-keeper', 'graveglass-behemoth', 'storm-archivist'], completed: [] },
      { bosses: ['crossroads-keeper', 'graveglass-behemoth', 'storm-archivist', 'fallen-astromancer'], completed: ['sf-m3d-stabilize-shattered-meridian'] },
      { bosses: ['crossroads-keeper', 'graveglass-behemoth', 'storm-archivist', 'fallen-astromancer', 'meridian-splitter'], completed: ['sf-m3d-stabilize-shattered-meridian', 'sf-m4-reach-meridian', 'sf-m5-meridian-splitter'] },
    ] as const
    for (const fixture of cases) {
      const state = createInitialState()
      state.progress.bossKillsByBoss = Object.fromEntries(fixture.bosses.map((bossId) => [bossId, 1])) as typeof state.progress.bossKillsByBoss
      const document = serializeGameState(state, 600)
      document.contentVersion = 58
      const migrated = loadProfileGameFromRaw(JSON.stringify(document))
      for (const objectiveId of fixture.completed as readonly string[]) expect(migrated.progress.chronicle.completedObjectiveIds).toContain(objectiveId)
      if ((fixture.bosses as readonly string[]).includes('meridian-splitter')) {
        expect(migrated.worldTier.highestUnlocked).toBeGreaterThanOrEqual(4)
        expect(migrated.progress.chronicle.completedObjectiveIds).toContain('sf-m3d-stabilize-shattered-meridian')
        expect(migrated.progress.chronicle.completedObjectiveIds).toContain('sf-m4-reach-meridian')
        expect(migrated.progress.chronicle.completedObjectiveIds).toContain('sf-m5-meridian-splitter')
        expect(migrated.crystals.unlockedSlots).toBeGreaterThan(0)
        expect(migrated.crystals.owned['force-t1']).toBe(1)
        const reload = loadProfileGameFromRaw(JSON.stringify(serializeGameState(migrated, 601)))
        expect(reload.crystals.owned['force-t1']).toBe(1)
      }
    }
  })

  it('preserves an active Shattered combat checkpoint while restarting only a removed action', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['crossroads-keeper'] = 1
    state.combat.active = true
    state.combat.locationId = 'graveglass-hollow'
    state.combat.enemyId = 'graveglass-shade'
    state.combat.targetEnemyId = 'graveglass-shade'
    state.combat.enemyWorldTier = 3
    state.combat.enemyHp = 4321
    state.combat.enemyMaxHp = 5700
    state.combat.enemyCurrentActionId = 'removed-phase-action'
    state.combat.enemyActionPatternId = 'removed-pattern'
    const document = serializeGameState(state, 602)
    document.contentVersion = 58
    const migrated = loadProfileGameFromRaw(JSON.stringify(document))
    expect(migrated.combat).toMatchObject({ active: true, locationId: 'graveglass-hollow', enemyId: 'graveglass-shade', targetEnemyId: 'graveglass-shade', enemyWorldTier: 3, enemyHp: 4321, enemyActionPatternId: 'default', enemyCurrentActionId: null })
  })

  it('treats historical Broken Meridian entry as valid without granting a Splitter kill', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['crossroads-keeper'] = 1
    state.progress.bossKillsByBoss['graveglass-behemoth'] = 1
    state.progress.bossKillsByBoss['storm-archivist'] = 1
    state.progress.bossKillsByBoss['fallen-astromancer'] = 1
    state.combat.active = true
    state.combat.locationId = 'broken-meridian'
    state.combat.enemyId = 'meridian-warden'
    state.combat.targetEnemyId = 'meridian-warden'
    const document = serializeGameState(state, 605)
    document.contentVersion = 58
    const migrated = loadProfileGameFromRaw(JSON.stringify(document))
    expect(migrated.progress.chronicle.completedObjectiveIds).toContain('sf-m3d-stabilize-shattered-meridian')
    expect(migrated.progress.chronicle.completedObjectiveIds).toContain('sf-m4-reach-meridian')
    expect(migrated.progress.chronicle.completedObjectiveIds).not.toContain('sf-m5-meridian-splitter')
    expect(migrated.progress.bossKillsByBoss['meridian-splitter'] ?? 0).toBe(0)
    expect(migrated.combat).toMatchObject({ active: true, locationId: 'broken-meridian', enemyId: 'meridian-warden', targetEnemyId: 'meridian-warden' })
  })

  it('reconciles an inactive historical Broken Meridian checkpoint without inventing a kill', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['crossroads-keeper'] = 1
    state.progress.bossKillsByBoss['graveglass-behemoth'] = 1
    state.progress.bossKillsByBoss['storm-archivist'] = 1
    state.progress.bossKillsByBoss['fallen-astromancer'] = 1
    state.combat.active = false
    state.combat.locationId = 'broken-meridian'
    state.ui.lastEnteredCombatLocationId = 'broken-meridian'
    const document = serializeGameState(state, 606)
    document.contentVersion = 60
    const migrated = loadProfileGameFromRaw(JSON.stringify(document))
    expect(migrated.progress.chronicle.completedObjectiveIds).toContain('sf-m3d-stabilize-shattered-meridian')
    expect(migrated.progress.chronicle.completedObjectiveIds).toContain('sf-m4-reach-meridian')
    expect(migrated.progress.chronicle.completedObjectiveIds).not.toContain('sf-m5-meridian-splitter')
    expect(migrated.progress.bossKillsByBoss['meridian-splitter'] ?? 0).toBe(0)
  })

  it('normalizes active Wards on v60 load and remains stable through a v61 save round trip', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    state.combat.arcaneCoreRuntime.elapsedMs = 5_000
    state.combat.elementalDamageReductions = [
      { element: 'fire', sourceId: 'fire-ward', reduction: 0.15, expiresAt: 15_000, durationMs: 20_000 },
      { element: 'water', sourceId: 'expired', reduction: 0.15, expiresAt: 4_000, durationMs: 20_000 },
      { element: 'earth', sourceId: 'duplicate', reduction: 0.1, expiresAt: 12_000, durationMs: 10_000 },
      { element: 'earth', sourceId: 'duplicate', reduction: 0.2, expiresAt: 16_000, durationMs: 10_000 },
      { element: 'air', sourceId: 'permanent-a', reduction: 0.15 },
      { element: 'air', sourceId: 'permanent-a', reduction: 0.1, expiresAt: 40_000, durationMs: 35_000 },
    ]
    const document = serializeGameState(state, 607)
    document.contentVersion = 60
    const migrated = loadProfileGameFromRaw(JSON.stringify(document))
    expect(migrated.combat.elementalDamageReductions).toEqual([
      { element: 'fire', sourceId: 'fire-ward', reduction: 0.15, expiresAt: 15_000, durationMs: 20_000 },
      { element: 'earth', sourceId: 'duplicate', reduction: 0.2, expiresAt: 16_000, durationMs: 10_000 },
      { element: 'air', sourceId: 'permanent-a', reduction: 0.15 },
    ])
    const savedAgain = serializeGameState(migrated, 608)
    expect(savedAgain.schemaVersion).toBe(3)
    expect(savedAgain.contentVersion).toBe(62)
    expect(loadProfileGameFromRaw(JSON.stringify(savedAgain)).combat.elementalDamageReductions).toEqual(migrated.combat.elementalDamageReductions)
    savedAgain.combat.arcaneCoreRuntime.elapsedMs = 30_000
    const loadedWithStaleRuntimeWard = loadProfileGameFromRaw(JSON.stringify(savedAgain))
    expect(loadedWithStaleRuntimeWard.combat.elementalDamageReductions).toEqual([{ element: 'air', sourceId: 'permanent-a', reduction: 0.15 }])
  })

  it('keeps the starter Crystal reward idempotent when a legacy profile already recorded it', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    state.progress.chronicle.grantedUnlockRewardIds.push('sf-socket-first-crystal')
    state.crystals.owned['force-t1'] = 1
    const document = serializeGameState(state, 603)
    document.contentVersion = 58
    const migrated = loadProfileGameFromRaw(JSON.stringify(document))
    expect(migrated.crystals.owned['force-t1']).toBe(1)
    expect(loadProfileGameFromRaw(JSON.stringify(serializeGameState(migrated, 604))).crystals.owned['force-t1']).toBe(1)
  })

  it('keeps an active checkpoint and resets only a removed current enemy action', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    state.combat.enemyId = 'forest-heart'
    state.combat.enemyHp = 321
    state.combat.enemyMaxHp = 900
    state.combat.enemyCurrentActionId = 'rejuvenating-sap'
    state.combat.enemyActionPatternId = 'removed-pattern'
    const document = serializeGameState(state, 502)
    document.contentVersion = 57
    const migrated = loadProfileGameFromRaw(JSON.stringify(document))
    expect(migrated.combat.active).toBe(true)
    expect(migrated.combat.locationId).toBe('whispering-woods')
    expect(migrated.combat.enemyId).toBe('forest-heart')
    expect(migrated.combat.enemyCurrentActionId).toBeNull()
    expect(migrated.combat.enemyActionPatternId).toBe('default')
    expect(migrated.combat.enemyHp).toBe(321)
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

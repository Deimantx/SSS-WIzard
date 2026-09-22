import { describe, expect, it } from 'vitest'
import { migrateSave } from './migrations'
import { serializeGameState } from './profileSaveManager'
import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { DUNGEONS, DUNGEON_ORDER, isDungeonUnlocked, isTutorialCompleted } from '../game/content/dungeons/dungeons'
import { MAX_ACTION_WORK_MS } from '../game/core/balance/combatTiming'
import { getSchoolTotalXpForLevel } from '../game/core/balance/schoolXpCurve'
import { SUMMONING_UNLOCK_BOSS_ID } from '../game/content/guardians/guardians'
import { getCriticalSaveSnapshot, validateSerializedSave } from './saveIntegrity'

describe('V27 story progression migration', () => {
  it('keeps the Dark Portal hidden when an old save has no Edrin kill', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 27, storyProgress: undefined, ui: { screen: 'home' } })

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.storyProgress).toEqual({ pendingEventIds: [], completedEventIds: [] })
    expect(migrated.inventory['black-portal-shard']).toBeUndefined()
  })

  it('queues the new event and restores one shard for an old save with Edrin killed', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 27, storyProgress: undefined, inventory: { 'black-portal-shard': 1 }, progress: { ...initial.progress, bossKillsByBoss: { 'archmage-edrin-shade': 1 } } })

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.inventory['black-portal-shard']).toBeUndefined()
    expect(migrated.darkPortal.recoveredShards).toEqual(['black-portal-shard'])
    expect(migrated.storyProgress.pendingEventIds).toEqual(['edrin-dark-portal-discovery'])
    expect(migrated.storyProgress.completedEventIds).toEqual([])
  })
})

describe('save navigation migration', () => {
  it('round-trips the last successfully entered combat dungeon and tolerates old saves without it', () => {
    const initial = createInitialState()
    const oldSave = migrateSave({ ...initial, saveVersion: 31, ui: { screen: 'combat' } } as any)
    expect(oldSave.ui.lastEnteredCombatDungeonId).toBeUndefined()

    const state = createInitialState()
    state.progress.bossKillsByBoss['forest-heart'] = 1
    state.ui.lastEnteredCombatDungeonId = 'howling-den'
    const loaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(state))))
    expect(loaded.ui.lastEnteredCombatDungeonId).toBe('howling-den')

    const malformed = migrateSave({ ...state, saveVersion: 31, ui: { screen: 'combat', lastEnteredCombatDungeonId: 'not-a-dungeon' } } as any)
    expect(malformed.ui.lastEnteredCombatDungeonId).toBeUndefined()
  })

  it('preserves the hidden-until-unlocked Summoning route and normalizes Guardian state', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 31,
      ui: { screen: 'tower-summoning' },
      progress: { ...initial.progress, bossKillsByBoss: { [SUMMONING_UNLOCK_BOSS_ID]: 1 } },
      guardians: { selectedGuardianId: 'fire-guardian', progress: { 'fire-guardian': { level: 7, rank: 4 } } },
    } as any)

    expect(migrated.ui.screen).toBe('tower-summoning')
    expect(migrated.progress.bossKillsByBoss[SUMMONING_UNLOCK_BOSS_ID]).toBe(1)
    expect(migrated.guardians.selectedGuardianId).toBe('fire-guardian')
    expect(migrated.guardians.progress['fire-guardian']).toEqual({ level: 7, rank: 4 })
  })

  it('migrates V28 saves with clean Rank I Transmutation Arrays', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 28, progress: { ...initial.progress, transmutation: { arrays: { 'temporal-array': { rank: 9, level: 999 }, 'unknown-array': { rank: 7, level: 7 } } } } } as any)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(Object.keys(migrated.progress.transmutation.arrays)).toEqual(['temporal-array', 'conservation-array', 'replication-array', 'mana-refinement-array', 'echo-stabilization-array'])
    expect(migrated.progress.transmutation.arrays['temporal-array']).toEqual({ rank: 1, level: 10 })
    expect(Object.values(migrated.progress.transmutation.arrays).filter((array) => array.level === 0)).toHaveLength(4)
  })

  it('maps the old aggregate Tower screen to Channeling', () => {
    const old = { ...createInitialState(), saveVersion: 1, ui: { screen: 'tower' } }
    expect(migrateSave(old).ui.screen).toBe('tower-channeling')
  })

  it('maps the removed Condensation destination to Transmutation', () => {
    const old = { ...createInitialState(), saveVersion: 7, ui: { screen: 'tower-condensation' } }
    expect(migrateSave(old).ui.screen).toBe('tower-transmutation')
  })

  it('keeps malformed Offline Bank values finite and safely bounded', () => {
    const initial = createInitialState()
    expect(migrateSave({ ...initial, saveVersion: SAVE_VERSION, offlineBankMs: Number.POSITIVE_INFINITY }).offlineBankMs).toBe(0)
    expect(migrateSave({ ...initial, saveVersion: SAVE_VERSION, offlineBankMs: Number.MAX_SAFE_INTEGER + 1 }).offlineBankMs).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('migrates V2 Auto Channel to one Arcane Echo with clean V7 defaults', () => {
    const migrated = migrateSave({ ...createInitialState(), saveVersion: 2, activities: { ...createInitialState().activities, autoChannel: true, channelCooldownMs: 500 } })
    expect(migrated.saveVersion).toBe(8)
    expect(migrated.activities.channeling.echoesAssigned).toBe(1)
    expect(migrated.progress.channeling.pillars['arcane-reservoir']).toMatchObject({ rank: 1, level: 0 })
    expect(migrated.progress.channeling.pillars['leyline-conduit']).toMatchObject({ rank: 1, level: 0 })
    expect(migrated.progress.channeling.totalManaGenerated).toBe(0)
    expect(migrated.progress.channeling.fiveEchoSustainMs).toBe(0)
    expect(migrated.progress.channeling.discoveries).toEqual({ 'stable-leyline': false, 'echo-resonance': false, 'deep-reservoir': false })
    expect('autoChannel' in migrated.activities).toBe(false)
    expect('channelCooldownMs' in migrated).toBe(false)
  })

  it('migrates V3 ranks into the matching Rank I Pillars and preserves Discoveries', () => {
    const old = { ...createInitialState(), saveVersion: 3, progress: { ...createInitialState().progress, channeling: { manaReservoirRank: 4, leylineConduitRank: 3, totalManaGenerated: 120, fiveEchoSustainMs: 5000, discoveries: { 'stable-leyline': true, 'echo-resonance': false, 'deep-reservoir': true } } } }
    const migrated = migrateSave(old)
    expect(migrated.saveVersion).toBe(8)
    expect(migrated.progress.channeling.pillars['arcane-reservoir']).toEqual({ rank: 1, level: 4 })
    expect(migrated.progress.channeling.pillars['leyline-conduit']).toEqual({ rank: 1, level: 3 })
    expect(migrated.progress.channeling.pillars['mana-resonance']).toEqual({ rank: 1, level: 0 })
    expect(migrated.progress.channeling.totalManaGenerated).toBe(120)
    expect(migrated.progress.channeling.discoveries['deep-reservoir']).toBe(true)
    expect('manaReservoirRank' in migrated.progress.channeling).toBe(false)
  })

  it('preserves dynamic content records that are absent from the initial state', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 4,
      inventory: { 'apprentice-wand': 1, 'fire-fragment': 37, 'life-essence': 9, 'removed-item': 12 },
      protectedItems: { 'apprentice-wand': true, 'fire-fragment': true, 'removed-item': true },
      progress: {
        ...initial.progress,
        requestProgress: { 'arcane-supply': 7, 'removed-request': 99 },
        requestClaims: { 'arcane-supply': true, 'removed-request': true },
        permanentFocusBonuses: { 'forest-heart': 10, 'guild-apprentice': 10, 'removed-reward': 40 },
        lifetimeKillsByMonster: { 'forest-wisp': 12, 'thornling': 3, 'removed-monster': 100 },
        bossKillsByBoss: { 'grove-sentinel': 2, 'forest-heart': 1, 'removed-boss': 100 },
        autoHuntBossByDungeon: { 'whispering-woods': true, 'removed-dungeon': true },
      },
      combat: { ...initial.combat, enemySpecialUsed: { 'ancient-growth': true, 'living-core': false, 'removed-special': true } },
    })

    expect(migrated.inventory).toMatchObject({ 'fire-fragment': 37, 'life-essence': 9 })
    expect(migrated.protectedItems['fire-fragment']).toBe(true)
    expect(migrated.progress.requestProgress).toEqual({ 'arcane-supply': 7, 'sentinel-breaker': 2 })
    expect(migrated.progress.requestClaims).toEqual({ 'arcane-supply': true })
    expect(migrated.progress.permanentFocusBonuses).toEqual({ 'forest-heart': 10, 'guild-apprentice': 10 })
    expect(migrated.progress.lifetimeKillsByMonster).toEqual({ 'forest-wisp': 12, thornling: 3 })
    expect(migrated.progress.bossKillsByBoss).toEqual({ 'grove-sentinel': 2, 'forest-heart': 1 })
    expect(migrated.progress.autoHuntBossByDungeon).toEqual(Object.fromEntries(DUNGEON_ORDER.map((dungeonId) => [dungeonId, dungeonId === 'whispering-woods'])))
    expect(migrated.combat.triggeredRuleIds).toContain('enemy:trait:grove-sentinel-ancient-growth:grove-sentinel-ancient-growth-threshold')
    expect(migrated.combat).not.toHaveProperty('enemySpecialUsed')
    expect(migrated.inventory).not.toHaveProperty('removed-item')
  })

  it('maps the legacy main-boss milestone to Forest Heart evidence only', () => {
    const initial = createInitialState()
    const old = {
      ...initial,
      saveVersion: SAVE_VERSION,
      progress: { ...initial.progress, firstMainBossKill: true, bossKillsByBoss: {}, requestProgress: {} },
    }
    const migrated = migrateSave(old)

    expect(migrated.progress.bossKillsByBoss['forest-heart']).toBe(1)
    expect(migrated.progress.bossKillsByBoss['corrupted-greatbear']).toBeUndefined()
    expect(migrated.progress.bossKillsByBoss['archmage-edrin-shade']).toBeUndefined()
    expect(isDungeonUnlocked(DUNGEONS['howling-den'], migrated.progress)).toBe(true)
    expect(isDungeonUnlocked(DUNGEONS['abandoned-catacombs'], migrated.progress)).toBe(false)
    expect(isTutorialCompleted(migrated.progress)).toBe(false)

    const rerun = migrateSave(migrated)
    expect(rerun.progress.bossKillsByBoss['forest-heart']).toBe(1)
    expect(rerun.progress.requestProgress['sentinel-breaker']).toBe(0)
  })

  it('preserves stronger Forest Heart evidence and seeds the historical Sentinel request', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: SAVE_VERSION,
      progress: { ...initial.progress, firstMainBossKill: true, bossKillsByBoss: { 'forest-heart': 4, 'grove-sentinel': 2 }, requestProgress: {} },
    })

    expect(migrated.progress.bossKillsByBoss['forest-heart']).toBe(4)
    expect(migrated.progress.bossKillsByBoss['grove-sentinel']).toBe(2)
    expect(migrated.progress.requestProgress['sentinel-breaker']).toBe(2)
  })

  it('migrates V4 saves to V7 with zero Gold while preserving gameplay state', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 4,
      currencies: undefined,
      inventory: { ...initial.inventory, 'fire-fragment': 17 },
      progress: { ...initial.progress, lifetimeKills: 23 },
    })

    expect(migrated.saveVersion).toBe(8)
    expect(migrated.currencies.gold).toBe(0)
    expect(migrated.inventory['fire-fragment']).toBe(17)
    expect(migrated.progress.lifetimeKills).toBe(23)
  })

  it('falls back safely from removed direct content references', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 4,
      equipment: { ...initial.equipment, weapon: 'removed-equipment' },
      activities: {
        ...initial.activities,
        research: { ...initial.activities.research, itemId: 'removed-item', targetSchoolId: 'removed-school' },
        transmutation: { ...initial.activities.transmutation, jobs: { 'removed-recipe': { echoesAssigned: 1, progressMs: 100 } } },
      },
      combat: { ...initial.combat, dungeonId: 'removed-dungeon', enemyId: 'removed-enemy', pendingBossId: 'removed-boss' },
    })

    expect(migrated.equipment.weapon).toBeNull()
    expect(migrated.activities.research.itemId).toBeNull()
    expect(migrated.activities.research.targetSchoolId).toBeNull()
    expect(migrated.activities.transmutation.jobs).not.toHaveProperty('removed-recipe')
    expect(migrated.combat.dungeonId).toBeNull()
    expect(migrated.combat.enemyId).toBeNull()
    expect(migrated.combat.pendingBossId).toBeNull()
  })

  it('removes retired inventory and stale Artificing jobs without touching current content', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: SAVE_VERSION,
      inventory: { 'wisp-essence': 8, 'grove-bark': 2, 'artifact-essence': 4 },
      protectedItems: { 'grove-bark': true, 'artifact-essence': true },
      progress: { ...initial.progress, discoveredItems: ['wisp-essence', 'grove-bark', 'artifact-essence'] },
      activities: { ...initial.activities, artificing: { activeJob: { kind: 'recipe', recipeId: 'obsolete-recipe' }, activeRecipeId: 'obsolete-recipe', progressMs: 3_000 } },
    } as any)

    expect(migrated.inventory).toEqual({ 'artifact-essence': 4 })
    expect(migrated.protectedItems).toEqual({ 'artifact-essence': true })
    expect(migrated.progress.discoveredItems).toEqual(['artifact-essence'])
    expect(migrated.activities.artificing).toEqual({ activeJob: null, activeRecipeId: null, progressMs: 0 })
  })

  it('drops obsolete equipment positions from a historical save without converting items', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 6,
      inventory: { ...initial.inventory, 'ember-staff': 1 },
      equipment: { weapon: 'apprentice-wand', offhand: null, armor: null, helmet: null, amulet: null, earrings: 'ember-staff', ring1: null, ring2: null },
    } as any)
    expect(migrated.saveVersion).toBe(8)
    expect(migrated.equipment).toEqual({ weapon: null, armor: null, head: null })
    expect(migrated.inventory['ember-staff']).toBe(1)
  })

  it('ignores an invalid historical equipment value without creating a stale slot', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 6,
      equipment: { ...initial.equipment, earrings: 'not-an-item' },
    })
    expect(migrated.equipment).toEqual({ weapon: null, armor: null, head: null })
  })

  it('sanitizes dynamic values without wiping valid item keys', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 4,
      inventory: { 'fire-fragment': 12.9, 'life-essence': -4, 'water-fragment': Number.NaN },
      progress: { ...initial.progress, lifetimeKillsByMonster: { 'forest-wisp': 6.8 } },
    })

    expect(migrated.inventory['fire-fragment']).toBe(12)
    expect(migrated.inventory['life-essence']).toBe(0)
    expect(migrated.inventory).not.toHaveProperty('water-fragment')
    expect(migrated.progress.lifetimeKillsByMonster['forest-wisp']).toBe(6)
  })

  it('migrates an active V7 Condensation job into its matching fragment recipe', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 7,
      activities: { ...initial.activities, condense: { running: true, element: 'water', progressMs: 3000 } },
    } as any)

    expect(migrated.activities.transmutation.jobs['water-fragment']).toEqual({ echoesAssigned: 1, progressMs: 4000 })
    expect(migrated.activities.transmutation.jobs['fire-fragment']).toBeUndefined()
  })

  it('drops legacy Equipment jobs while preserving fragment work and inventory', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 7,
      inventory: { ...initial.inventory, 'ember-staff': 2, 'fire-fragment': 48, 'artifact-essence': 24 },
      activities: {
        ...initial.activities,
        condense: { running: true, element: 'fire', progressMs: 1500 },
        transmutation: { running: true, recipeId: 'ember-staff', progressMs: 4000, durationMs: 8000 },
      },
    } as any)

    expect(migrated.activities.transmutation.jobs['fire-fragment']).toEqual({ echoesAssigned: 1, progressMs: 2000 })
    expect(migrated.activities.transmutation.jobs).not.toHaveProperty('ember-staff')
    expect(migrated.inventory).toMatchObject({ 'ember-staff': 2, 'fire-fragment': 48, 'artifact-essence': 24 })
    expect(migrated.saveVersion).toBe(8)
  })

  it('ignores inactive or unknown legacy queues and clamps migrated Focus deterministically', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 7,
      player: { ...initial.player, baseMaxFocus: 10, maxFocus: 10 },
      activities: {
        ...initial.activities,
        condense: { running: false, element: 'earth', progressMs: 3000 },
        transmutation: { running: true, recipeId: 'removed-recipe', progressMs: 500 },
      },
    } as any)

    expect(migrated.activities.transmutation.jobs).toEqual({})
    expect(migrated.activities.channeling.echoesAssigned).toBe(0)
  })

  it('migrates an active V8 Research queue into research-1 with one Echo', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 8,
      inventory: { ...initial.inventory, 'fire-fragment': 20 },
      activities: {
        ...initial.activities,
        research: { ...initial.activities.research, running: true, itemId: 'fire-fragment', targetSchoolId: 'water', requestedQuantity: 12, remainingQuantity: 9, progressMs: 2300, status: 'running' },
      },
    } as any)

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.activities.research.slots['research-1']).toEqual({ itemId: 'fire-fragment', targetSchoolId: 'water', requestedQuantity: 12, remainingQuantity: 9, progressMs: 2300, echoesAssigned: 1, status: 'running' })
  })

  it('keeps blocked V8 Research work prepared without assigning an Echo', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 8,
      activities: {
        ...initial.activities,
        research: { ...initial.activities.research, running: true, itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 3, remainingQuantity: 3, progressMs: Number.POSITIVE_INFINITY, status: 'level-cap' },
      },
    } as any)

    expect(migrated.activities.research.slots['research-1']).toMatchObject({ remainingQuantity: 3, progressMs: 0, echoesAssigned: 0, status: 'level-cap' })
  })

  it('round-trips V9 Research slots with independent targets, progress, and Echoes', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 50
    state.inventory['water-fragment'] = 50
    state.inventory['earth-fragment'] = 50
    state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 20, remainingQuantity: 17, progressMs: 1200, echoesAssigned: 2, status: 'running' }
    state.activities.research.slots['research-2'] = { itemId: 'fire-fragment', targetSchoolId: 'water', requestedQuantity: 15, remainingQuantity: 15, progressMs: 3400, echoesAssigned: 1, status: 'running' }
    state.activities.research.slots['research-3'] = { itemId: 'earth-fragment', targetSchoolId: 'air', requestedQuantity: 8, remainingQuantity: 8, progressMs: 800, echoesAssigned: 2, status: 'running' }

    const migrated = migrateSave(JSON.parse(JSON.stringify(state)))

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.activities.research.slots).toEqual(state.activities.research.slots)
  })

  it('preserves a non-default current V9 gameplay snapshot through serialization and migration', () => {
    const state = createInitialState()
    state.inventory = { 'tideglass-wand': 1, 'fire-fragment': 123, 'water-fragment': 47, 'life-essence': 99 }
    state.schools = { fire: { xp: 125, level: 7 }, water: { xp: 65, level: 4 }, earth: { xp: 45, level: 3 }, air: { xp: 25, level: 2 } }
    state.currencies.gold = 321
    state.equipment.weapon = 'tideglass-wand'
    state.progress.channeling.pillars['leyline-conduit'] = { rank: 1, level: 3 }
    state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 30, remainingQuantity: 30, progressMs: 0, echoesAssigned: 1, status: 'running' }
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }

    const migrated = migrateSave(JSON.parse(JSON.stringify(serializeGameState(state))))

    expect(migrated.inventory).toMatchObject({ 'fire-fragment': 123, 'water-fragment': 47, 'life-essence': 99 })
    expect(migrated.schools).toEqual(state.schools)
    expect(migrated.currencies).toEqual({ gold: 321 })
    expect(migrated.equipment.weapon).toBe('tideglass-wand')
    expect(migrated.progress.channeling.pillars['leyline-conduit']).toEqual({ rank: 1, level: 3 })
    expect(migrated.activities.research.slots['research-1']).toEqual(state.activities.research.slots['research-1'])
    expect(migrated.activities.transmutation.jobs['fire-fragment']).toEqual({ echoesAssigned: 1, progressMs: 0 })
  })

  it('round-trips V18 committed Basic, Skill, and switched-Pattern timing state', () => {
    const basic = createInitialState()
    basic.combat.active = true
    basic.combat.dungeonId = 'whispering-woods'
    basic.combat.enemyId = 'forest-wisp'
    basic.combat.enemyHp = 40
    basic.combat.enemyMaxHp = 44
    basic.combat.enemyActionPatternId = 'default'
    basic.combat.enemyNextActionIndex = 2
    basic.combat.enemyCurrentStepId = 'basic-2'
    basic.combat.enemyCurrentActionId = null
    basic.combat.enemyCurrentActionPatternId = 'default'
    basic.combat.enemyActionDurationMs = 2_800
    basic.combat.enemyActionTimerMs = 1_743
    const basicLoaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(basic))))
    expect(basicLoaded.combat).toMatchObject({ enemyActionPatternId: 'default', enemyNextActionIndex: 2, enemyCurrentStepId: 'basic-2', enemyCurrentActionId: null, enemyCurrentActionPatternId: 'default', enemyActionDurationMs: 2_800, enemyActionTimerMs: 1_743 })

    const skill = createInitialState()
    skill.combat.active = true
    skill.combat.dungeonId = 'whispering-woods'
    skill.combat.enemyId = 'forest-wisp'
    skill.combat.enemyHp = 40
    skill.combat.enemyMaxHp = 44
    skill.combat.enemyActionPatternId = 'default'
    skill.combat.enemyNextActionIndex = 0
    skill.combat.enemyCurrentStepId = 'arc-spark-step'
    skill.combat.enemyCurrentActionId = 'arc-spark'
    skill.combat.enemyCurrentActionPatternId = 'default'
    skill.combat.enemyActionDurationMs = 2_000
    skill.combat.enemyActionTimerMs = 901
    const skillLoaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(skill))))
    expect(skillLoaded.combat).toMatchObject({ enemyCurrentStepId: 'arc-spark-step', enemyCurrentActionId: 'arc-spark', enemyCurrentActionPatternId: 'default', enemyActionDurationMs: 2_000, enemyActionTimerMs: 901 })

    const switched = createInitialState()
    switched.combat.active = true
    switched.combat.dungeonId = 'howling-den'
    switched.combat.enemyId = 'corrupted-greatbear'
    switched.combat.enemyHp = 900
    switched.combat.enemyMaxHp = 900
    switched.combat.enemyActionPatternId = 'corrupted'
    switched.combat.enemyNextActionIndex = 4
    switched.combat.enemyCurrentStepId = 'crushing-maul-step'
    switched.combat.enemyCurrentActionId = 'crushing-maul'
    switched.combat.enemyCurrentActionPatternId = 'default'
    switched.combat.enemyActionDurationMs = 1_800
    switched.combat.enemyActionTimerMs = 901
    const switchedLoaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(switched))))
    expect(switchedLoaded.combat).toMatchObject({ enemyActionPatternId: 'corrupted', enemyNextActionIndex: 4, enemyCurrentStepId: 'crushing-maul-step', enemyCurrentActionId: 'crushing-maul', enemyCurrentActionPatternId: 'default', enemyActionDurationMs: 1_800, enemyActionTimerMs: 901 })
  })

  it('clamps malformed current action work to the shared safety cap', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: SAVE_VERSION, combat: {
      ...initial.combat,
      active: true,
      dungeonId: 'whispering-woods',
      enemyId: 'forest-wisp',
      enemyHp: 44,
      enemyMaxHp: 44,
      enemyCurrentStepId: 'basic-1',
      enemyCurrentActionId: null,
      enemyCurrentActionPatternId: 'default',
      enemyActionPatternId: 'default',
      enemyActionDurationMs: 9e15,
      enemyActionTimerMs: 9e15,
    } } as any)
    expect(migrated.combat.enemyActionDurationMs).toBeLessThanOrEqual(MAX_ACTION_WORK_MS)
    expect(migrated.combat.enemyActionTimerMs).toBe(MAX_ACTION_WORK_MS)
  })

  it('preserves V21 equipment provider identity on ActiveStatus normalization', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 21, combat: {
      ...initial.combat,
      active: true,
      dungeonId: 'whispering-woods',
      enemyId: 'forest-wisp',
      enemyHp: 44,
      enemyMaxHp: 44,
      enemyStatuses: [{ statusId: 'burning', holder: 'enemy', instanceKey: 'player:equipment:test-weapon:provider:weapon', source: { actor: 'player', kind: 'equipment', sourceId: 'test-weapon', providerInstanceKey: 'weapon' }, remainingMs: 4_000, initialDurationMs: 5_000, stacks: 1, nextTickMs: 1_000, appliedAt: 0 }],
    } } as any)
    expect(migrated.combat.enemyStatuses[0].source).toMatchObject({ kind: 'equipment', sourceId: 'test-weapon', providerInstanceKey: 'weapon' })
  })

  it('keeps V20 equipment sources compatible without a provider identity', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 20, combat: {
      ...initial.combat,
      active: true,
      dungeonId: 'whispering-woods',
      enemyId: 'forest-wisp',
      enemyHp: 44,
      enemyMaxHp: 44,
      enemyStatuses: [{ statusId: 'burning', holder: 'enemy', instanceKey: 'player:equipment:test-weapon', source: { actor: 'player', kind: 'equipment', sourceId: 'test-weapon', providerInstanceKey: 'weapon' }, remainingMs: 4_000, initialDurationMs: 5_000, stacks: 1, nextTickMs: 1_000, appliedAt: 0 }],
    } } as any)
    expect(migrated.combat.enemyStatuses[0].source).toMatchObject({ kind: 'equipment', sourceId: 'test-weapon' })
    expect(migrated.combat.enemyStatuses[0].source.providerInstanceKey).toBeUndefined()
    expect(migrated.combat.enemyId).toBe('forest-wisp')
  })

  it('migrates a realistic V23 Equipment save to V27 without wiping valid progression', () => {
    const initial = createInitialState()
    const v23 = {
      ...initial,
      saveVersion: 23,
      schools: { ...initial.schools, fire: { xp: 321, level: 4 }, water: { xp: 87, level: 2 } },
      currencies: { gold: 987 },
       inventory: { ...initial.inventory, 'apprentice-wand': 1, 'ember-staff': 1, 'prismatic-focus': 1, 'fire-fragment': 17 },
      protectedItems: { 'apprentice-wand': true, 'fire-fragment': true },
      equipment: { ...initial.equipment, weapon: 'apprentice-wand', offhand: 'prismatic-focus' },
      progress: { ...initial.progress, discoveredItems: ['apprentice-wand', 'ember-staff', 'prismatic-focus'], lifetimeKillsByMonster: { 'grove-sentinel': 3 }, bossKillsByBoss: { 'forest-heart': 2 } },
      activities: { ...initial.activities, transmutation: { jobs: { 'fire-fragment': { echoesAssigned: 1, progressMs: 1000 } } } },
    } as any

    const migrated = migrateSave(v23)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.inventory).toMatchObject({ 'ember-staff': 1, 'fire-fragment': 17 })
    expect(migrated.inventory).not.toHaveProperty('prismatic-focus')
    expect(migrated.inventory).not.toHaveProperty('apprentice-wand')
    expect(migrated.protectedItems).toEqual({ 'fire-fragment': true })
    expect(migrated.equipment.weapon).toBeNull()
    expect(migrated.equipment).not.toHaveProperty('offhand')
    expect(migrated.progress.discoveredItems).toEqual(['ember-staff'])
    expect(migrated.progress.lifetimeKillsByMonster['grove-sentinel']).toBe(3)
    expect(migrated.progress.bossKillsByBoss['forest-heart']).toBe(2)
    expect(migrated.schools).toMatchObject({ fire: { xp: getSchoolTotalXpForLevel(4), level: 4 }, water: { xp: getSchoolTotalXpForLevel(2), level: 2 } })
    expect(migrated.currencies.gold).toBe(987)
    expect(migrated.activities.transmutation.jobs['fire-fragment']).toMatchObject({ echoesAssigned: 1, progressMs: 1000 })

    const rerun = migrateSave(migrated)
    expect(rerun.saveVersion).toBe(SAVE_VERSION)
    expect(rerun.inventory).toEqual(migrated.inventory)
    expect(rerun.protectedItems).toEqual(migrated.protectedItems)
    expect(rerun.equipment).toEqual(migrated.equipment)
    expect(rerun.schools).toEqual(migrated.schools)
    expect(rerun.progress).toEqual(migrated.progress)
    expect(rerun.activities).toEqual(migrated.activities)
  })

  it('drops legacy secondary equipment without creating an obsolete loadout slot', () => {
    const initial = createInitialState()
    const migrateLegacyEquipment = (weapon: unknown, offhand: unknown) => migrateSave({
      ...initial,
      saveVersion: SAVE_VERSION - 1,
      inventory: { ...initial.inventory, 'tideglass-wand': 1, 'ember-staff': 1 },
      equipment: { ...initial.equipment, weapon, offhand },
    } as any)

    const existingWeapon = migrateLegacyEquipment('tideglass-wand', 'ember-staff')
    expect(existingWeapon.equipment.weapon).toBe('tideglass-wand')
    expect(existingWeapon.equipment).not.toHaveProperty('offhand')
    expect(existingWeapon.inventory['ember-staff']).toBe(1)

    const secondaryOnly = migrateLegacyEquipment(null, 'ember-staff')
    expect(secondaryOnly.equipment.weapon).toBeNull()
    expect(secondaryOnly.equipment).not.toHaveProperty('offhand')

    const empty = migrateLegacyEquipment(null, null)
    expect(empty.equipment.weapon).toBeNull()
    expect(empty.equipment).not.toHaveProperty('offhand')

    const stale = migrateLegacyEquipment(null, 'removed-equipment')
    expect(stale.equipment.weapon).toBeNull()
    expect(stale.equipment).not.toHaveProperty('offhand')
  })

  it('cleans removed Prismatic Focus content from V26 saves', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 26,
      inventory: { ...initial.inventory, 'prismatic-focus': 1 },
      protectedItems: { 'prismatic-focus': true },
      equipment: { ...initial.equipment, weapon: 'prismatic-focus' },
      artifactProgress: {
        ...initial.artifactProgress,
        'prismatic-focus': { level: 6, allocatedNodeIds: ['prismatic-conduit', 'reservoir'], attunedNodeIds: ['heartwell'] },
      },
      progress: { ...initial.progress, discoveredItems: ['prismatic-focus'] },
      activities: { ...initial.activities, artificing: { activeJob: { kind: 'recipe', recipeId: 'prismatic-focus' }, activeRecipeId: 'prismatic-focus', progressMs: 12_000 } },
    } as any)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.inventory).not.toHaveProperty('prismatic-focus')
    expect(migrated.protectedItems).not.toHaveProperty('prismatic-focus')
    expect(migrated.artifactProgress).not.toHaveProperty('prismatic-focus')
    expect(migrated.progress.discoveredItems).not.toContain('prismatic-focus')
    expect(migrated.equipment.weapon).toBeNull()
    expect(migrated.activities.artificing).toEqual({ activeJob: null, activeRecipeId: null, progressMs: 0 })

    const artifactForge = migrateSave({
      ...initial,
      saveVersion: 26,
      activities: { ...initial.activities, artificing: { activeJob: { kind: 'artifact-forge', artifactId: 'prismatic-focus' }, activeRecipeId: null, progressMs: 12_000 } },
    } as any)
    expect(artifactForge.activities.artificing).toEqual({ activeJob: null, activeRecipeId: null, progressMs: 0 })
  })

  it('migrates suspended legacy periodic damage into the first-class Hit payload', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: SAVE_VERSION, combat: {
      ...initial.combat,
      active: true,
      dungeonId: 'whispering-woods',
      enemyId: 'forest-wisp',
      enemyHp: 44,
      enemyMaxHp: 44,
      playerStatuses: [{ statusId: 'burning', holder: 'player', instanceKey: 'single:burning', source: { actor: 'enemy', kind: 'action', sourceId: 'arc-spark' }, remainingMs: 2_000, initialDurationMs: 5_000, stacks: 1, nextTickMs: 1_000, periodicEffects: [{ type: 'deal-damage', target: 'self', damageType: 'fire', magnitude: { type: 'flat', value: 5 } }] }],
    } } as any)
    expect(migrated.combat.playerStatuses[0].periodicEffects?.[0]).toEqual({ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 5 } }] })
  })

  it('keeps durable progression while rebuilding a V17 Player Basic cycle', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 17,
      currencies: { gold: 321 },
      inventory: { ...initial.inventory, 'fire-fragment': 37, 'tideglass-wand': 1 },
      equipment: { ...initial.equipment, weapon: 'tideglass-wand' },
      progress: { ...initial.progress, spellRanks: { ...initial.progress.spellRanks, 'fire-bolt': 1 }, bossKillsByBoss: { ...initial.progress.bossKillsByBoss, 'forest-heart': 2 } },
      combat: { ...initial.combat, active: true, dungeonId: 'whispering-woods', enemyId: 'forest-wisp', playerAttackTimerMs: 500 },
    })

    expect(migrated.currencies.gold).toBe(321)
    expect(migrated.inventory['fire-fragment']).toBe(37)
    expect(migrated.equipment.weapon).toBe('tideglass-wand')
    expect(migrated.progress.spellRanks['fire-bolt']).toBe(1)
    expect(migrated.progress.bossKillsByBoss['forest-heart']).toBe(2)
    expect(migrated.combat.playerAttackTimerMs).toBe(migrated.combat.playerAttackDurationMs)
  })

  it('clears legacy Transmutation full bars so they cannot craft for free', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 10,
      activities: { ...initial.activities, transmutation: { jobs: { 'fire-fragment': { echoesAssigned: 1, progressMs: 8000 } } } },
    } as any)
    expect(migrated.activities.transmutation.jobs['fire-fragment']).toEqual({ echoesAssigned: 1, progressMs: 0 })
  })

  it('clears legacy Research waiting-Mana full bars while preserving the batch', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 10,
      inventory: { ...initial.inventory, 'fire-fragment': 3 },
      activities: {
        ...initial.activities,
        research: {
          slots: {
            'research-1': { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 3, remainingQuantity: 3, progressMs: 10000, echoesAssigned: 1, status: 'waiting-mana' },
            'research-2': null,
            'research-3': null,
            'research-4': null,
          },
        },
      },
    } as any)
    expect(migrated.activities.research.slots['research-1']).toMatchObject({ remainingQuantity: 3, echoesAssigned: 1, progressMs: 0, status: 'waiting-mana' })
  })
})

describe('v42 power-based Threat migration', () => {
  const activeLegacySave = (dungeonId: 'whispering-woods' | 'howling-den' | 'fractured-approach', threatCleared: number, worldTier: 1 | 2 = 1) => {
    const initial = createInitialState()
    return {
      ...initial,
      saveVersion: 42,
      worldTier: { current: worldTier, highestUnlocked: worldTier },
      combat: { ...initial.combat, active: true, dungeonId, enemyId: dungeonId === 'howling-den' ? 'cavefang-wolf' : dungeonId === 'fractured-approach' ? 'warded-husk' : 'forest-wisp', threatCleared },
    }
  }

  it.each([
    ['whispering-woods', 10, 1, 2500],
    ['whispering-woods', 10, 2, 5000],
    ['howling-den', 12, 1, 4800],
  ] as const)('preserves %s progress as a percentage of the new requirement', (dungeonId, oldThreat, worldTier, expectedThreat) => {
    const migrated = migrateSave(activeLegacySave(dungeonId, oldThreat, worldTier) as any)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.combat.threatCleared).toBe(expectedThreat)
  })

  it('preserves ready state and clears converted sequence Threat', () => {
    const ready = migrateSave(activeLegacySave('whispering-woods', 20) as any)
    expect(ready.combat.threatCleared).toBe(5000)

    const legacy = migrateSave(activeLegacySave('fractured-approach', 7) as any)
    expect(legacy.combat.threatCleared).toBe(0)
  })

  it('round-trips v43 point Threat without converting it back to kills', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.threatCleared = 3720
    const loaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(state))))
    expect(loaded.saveVersion).toBe(SAVE_VERSION)
    expect(loaded.combat.threatCleared).toBe(3720)
  })
})

describe('v43 Elemental Scar migration', () => {
  const activeLegacySave = (dungeonId: 'flooded-reliquary' | 'ashen-watch' | 'rootscar-hollow', enemyId: 'mist-wraith' | 'cinder-hound' | 'thorn-maw', threatCleared: number, worldTier: 1 | 2) => {
    const initial = createInitialState()
    return {
      ...initial,
      saveVersion: 43,
      worldTier: { current: worldTier, highestUnlocked: worldTier },
      combat: { ...initial.combat, active: true, dungeonId, enemyId, threatCleared },
    }
  }

  it.each([
    ['flooded-reliquary', 'mist-wraith', 10_000, 1, 20],
    ['ashen-watch', 'cinder-hound', 20_000, 2, 20],
    ['rootscar-hollow', 'thorn-maw', 5_000, 1, 10],
  ] as const)('converts legacy %s kill Threat and preserves the active target', (dungeonId, enemyId, expectedThreat, worldTier, oldThreat) => {
    const migrated = migrateSave(activeLegacySave(dungeonId, enemyId, oldThreat, worldTier) as any)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.combat.targetEnemyId).toBe(enemyId)
    expect(migrated.combat.threatCleared).toBe(expectedThreat)
  })

  it.each([
    ['fractured-approach', 'withered-watcher', 2],
    ['crossroads-of-ruin', 'broken-construct', 3],
  ] as const)('infers %s sequence position and clears Threat', (dungeonId, enemyId, expectedIndex) => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 43,
      combat: { ...initial.combat, active: true, dungeonId, enemyId, threatCleared: 40, dungeonSequenceIndex: undefined },
    } as any)
    expect(migrated.combat.dungeonSequenceIndex).toBe(expectedIndex)
    expect(migrated.combat.threatCleared).toBe(0)
    expect(migrated.combat.targetEnemyId).toBeNull()
  })

  it.each([
    ['fractured-approach', 'corrupted-elemental-gatekeeper', 20],
    ['crossroads-of-ruin', 'crossroads-keeper', 44],
  ] as const)('does not reuse old Threat as sequence progress for %s between encounters', (dungeonId, pendingBossId, threatCleared) => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 43,
      combat: { ...initial.combat, active: true, dungeonId, enemyId: null, targetEnemyId: 'forest-wisp', pendingBossId, threatCleared, dungeonSequenceIndex: undefined },
    } as any)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.combat.dungeonSequenceIndex).toBe(0)
    expect(migrated.combat.threatCleared).toBe(0)
    expect(migrated.combat.targetEnemyId).toBeNull()
    expect(migrated.combat.pendingBossId).toBeNull()
  })

  it('preserves a legitimate active Fractured Approach boss at the final sequence index', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 43,
      combat: { ...initial.combat, active: true, dungeonId: 'fractured-approach', enemyId: 'corrupted-elemental-gatekeeper', threatCleared: 20, dungeonSequenceIndex: undefined },
    } as any)
    expect(migrated.combat.dungeonSequenceIndex).toBe(4)
    expect(migrated.combat.inBossFight).toBe(true)
    expect(migrated.combat.threatCleared).toBe(0)
    expect(migrated.combat.targetEnemyId).toBeNull()
    expect(migrated.combat.pendingBossId).toBeNull()
  })
})

describe('v44 Shattered Meridian migration', () => {
  const activeSave = (combat: Partial<ReturnType<typeof createInitialState>['combat']>, worldTier: 1 | 2 | 3 | 4 | 5 = 1) => {
    const initial = createInitialState()
    return {
      ...initial,
      saveVersion: 44,
      worldTier: { current: worldTier, highestUnlocked: worldTier },
      combat: { ...initial.combat, active: true, ...combat },
    }
  }

  it.each([
    ['graveglass-hollow', 'graveglass-shade', 1, 15_000],
    ['starfallen-observatory', 'comet-wraith', 3, 45_000],
  ] as const)('scales legacy %s Threat from the old 50-point requirement', (dungeonId, enemyId, worldTier, expectedThreat) => {
    const migrated = migrateSave(activeSave({ dungeonId, enemyId, threatCleared: 25 }, worldTier) as any)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.combat.targetEnemyId).toBe(enemyId)
    expect(migrated.combat.threatCleared).toBe(expectedThreat)
  })

  it('clamps converted Shattered Threat, recovers the first target, and preserves a pending boss', () => {
    const migrated = migrateSave(activeSave({ dungeonId: 'graveglass-hollow', enemyId: 'graveglass-behemoth', targetEnemyId: 'ossuary-oracle', pendingBossId: 'graveglass-behemoth', threatCleared: 80 }) as any)
    expect(migrated.combat.targetEnemyId).toBe('graveglass-shade')
    expect(migrated.combat.pendingBossId).toBe('graveglass-behemoth')
    expect(migrated.combat.threatCleared).toBe(30_000)

    const noEnemy = migrateSave(activeSave({ dungeonId: 'stormvault-gallery', enemyId: null, targetEnemyId: null, threatCleared: 0 }) as any)
    expect(noEnemy.combat.targetEnemyId).toBe('volt-wisp')
  })

  it('converts Broken Meridian v44 saves to its authored sequence without using old Threat or indices', () => {
    const initial = createInitialState()
    const activeNormal = migrateSave({
      ...activeSave({ dungeonId: 'broken-meridian', enemyId: 'arc-surge-horror', targetEnemyId: 'forest-wisp', pendingBossId: 'meridian-splitter', threatCleared: 99, dungeonSequenceIndex: 0 }),
    } as any)
    expect(activeNormal.combat.dungeonSequenceIndex).toBe(2)
    expect(activeNormal.combat.threatCleared).toBe(0)
    expect(activeNormal.combat.targetEnemyId).toBeNull()
    expect(activeNormal.combat.pendingBossId).toBeNull()

    const noEnemy = migrateSave({
      ...initial,
      saveVersion: 44,
      combat: { ...initial.combat, active: true, dungeonId: 'broken-meridian', enemyId: null, threatCleared: 55, dungeonSequenceIndex: 3 },
    } as any)
    expect(noEnemy.combat.dungeonSequenceIndex).toBe(0)
    expect(noEnemy.combat.threatCleared).toBe(0)

    const boss = migrateSave({
      ...initial,
      saveVersion: 44,
      combat: { ...initial.combat, active: true, dungeonId: 'broken-meridian', enemyId: 'meridian-splitter', threatCleared: 55, dungeonSequenceIndex: 1 },
    } as any)
    expect(boss.combat.dungeonSequenceIndex).toBe(4)
    expect(boss.combat.inBossFight).toBe(true)
  })

  it('reconciles World Tier from boss evidence silently and remains idempotent', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 44,
      worldTier: { current: 2, highestUnlocked: 2 },
      progress: { ...initial.progress, bossKillsByBoss: { 'crossroads-keeper': 1, 'meridian-splitter': 1, 'black-gatekeeper': 1 } },
    } as any)
    expect(migrated.worldTier).toEqual({ current: 2, highestUnlocked: 5 })
    expect(migrated.notifications).toEqual([])
    expect(migrateSave(JSON.parse(JSON.stringify(migrated))).worldTier).toEqual(migrated.worldTier)

    const validHighTier = migrateSave({ ...initial, saveVersion: 44, worldTier: { current: 5, highestUnlocked: 5 } } as any)
    expect(validHighTier.worldTier).toEqual({ current: 5, highestUnlocked: 5 })
  })
})

describe('structured dungeon save migration', () => {
  it('infers legacy Catacombs sequence progress from the active encounter and Threat', () => {
    const initial = createInitialState()
    const wraith = migrateSave({
      ...initial,
      saveVersion: 41,
      combat: { ...initial.combat, active: true, dungeonId: 'abandoned-catacombs', enemyId: 'grave-wraith', threatCleared: 1, dungeonSequenceIndex: undefined },
    } as any)
    expect(wraith.combat.dungeonSequenceIndex).toBe(1)
    expect(wraith.combat.threatCleared).toBe(0)

    const boss = migrateSave({
      ...initial,
      saveVersion: 41,
      combat: { ...initial.combat, active: true, dungeonId: 'abandoned-catacombs', enemyId: 'archmage-edrin-shade', dungeonSequenceIndex: undefined },
    } as any)
    expect(boss.combat.dungeonSequenceIndex).toBe(3)
  })

  it('repairs malformed sequence indices and clears sequence state outside sequence dungeons', () => {
    const initial = createInitialState()
    const malformed = migrateSave({
      ...initial,
      saveVersion: SAVE_VERSION,
      combat: { ...initial.combat, active: true, dungeonId: 'abandoned-catacombs', enemyId: 'restless-skeleton', dungeonSequenceIndex: 99 },
    } as any)
    expect(malformed.combat.dungeonSequenceIndex).toBe(0)
    expect(malformed.combat.threatCleared).toBe(0)

    const nonSequence = migrateSave({
      ...initial,
      saveVersion: SAVE_VERSION,
      combat: { ...initial.combat, active: true, dungeonId: 'howling-den', enemyId: 'cavefang-wolf', dungeonSequenceIndex: 2 },
    } as any)
    expect(nonSequence.combat.dungeonSequenceIndex).toBeNull()
  })
})

describe('v45 Black Sigil Reach migration', () => {
  const activeSave = (combat: Partial<ReturnType<typeof createInitialState>['combat']>, worldTier: 1 | 2 | 3 | 4 | 5 = 1, progress: Partial<ReturnType<typeof createInitialState>['progress']> = {}) => {
    const initial = createInitialState()
    return {
      ...initial,
      saveVersion: 45,
      worldTier: { current: worldTier, highestUnlocked: worldTier },
      progress: { ...initial.progress, ...progress },
      combat: { ...initial.combat, active: true, ...combat },
    }
  }

  it('converts Hall kill Threat proportionally and preserves the valid target', () => {
    const migrated = migrateSave(activeSave({ dungeonId: 'hall-of-unbound-names', enemyId: 'name-eater', targetEnemyId: 'name-eater', threatCleared: 30 }) as any)
    expect(migrated.saveVersion).toBe(47)
    expect(migrated.combat.targetEnemyId).toBe('name-eater')
    expect(migrated.combat.threatCleared).toBe(20000)
  })

  it('converts Vault kill Threat against the captured WT4 requirement', () => {
    const migrated = migrateSave(activeSave({ dungeonId: 'vault-of-the-black-sigil', enemyId: 'blackscript-colossus', threatCleared: 30 }, 4) as any)
    expect(migrated.combat.targetEnemyId).toBe('blackscript-colossus')
    expect(migrated.combat.threatCleared).toBe(80000)
  })

  it.each([
    ['hall-of-unbound-names', 'unspoken-prelate', 'name-eater'],
    ['vault-of-the-black-sigil', 'sigil-warden', 'black-seal-parasite'],
  ] as const)('preserves an active %s boss while assigning the first future normal target', (dungeonId, bossId, firstTarget) => {
    const migrated = migrateSave(activeSave({ dungeonId, enemyId: bossId, targetEnemyId: bossId, threatCleared: 60 }) as any)
    expect(migrated.combat.enemyId).toBe(bossId)
    expect(migrated.combat.inBossFight).toBe(true)
    expect(migrated.combat.targetEnemyId).toBe(firstTarget)
    expect(migrated.combat.targetEnemyId).not.toBe(bossId)
  })

  it('converts an active Black Gate normal encounter to its exact sequence index', () => {
    const migrated = migrateSave(activeSave({ dungeonId: 'black-gate', enemyId: 'portalbound-acolyte', threatCleared: 70, targetEnemyId: 'name-eater', pendingBossId: 'black-gatekeeper' }) as any)
    expect(migrated.combat.dungeonSequenceIndex).toBe(2)
    expect(migrated.combat.threatCleared).toBe(0)
    expect(migrated.combat.targetEnemyId).toBeNull()
    expect(migrated.combat.pendingBossId).toBeNull()
  })

  it('starts a converted Black Gate between encounters at step zero regardless of old Threat', () => {
    const migrated = migrateSave(activeSave({ dungeonId: 'black-gate', enemyId: null, threatCleared: 70, dungeonSequenceIndex: 4 }) as any)
    expect(migrated.combat.dungeonSequenceIndex).toBe(0)
    expect(migrated.combat.threatCleared).toBe(0)
    expect(migrated.combat.targetEnemyId).toBeNull()
  })

  it('preserves an active Black Gate boss at the final sequence index', () => {
    const migrated = migrateSave(activeSave({ dungeonId: 'black-gate', enemyId: 'black-gatekeeper', threatCleared: 70 }) as any)
    expect(migrated.combat.dungeonSequenceIndex).toBe(4)
    expect(migrated.combat.inBossFight).toBe(true)
    expect(migrated.combat.threatCleared).toBe(0)
  })

  it('reconciles stale WT4 access to WT5 from existing Black Gatekeeper evidence without a notification', () => {
    const migrated = migrateSave(activeSave({ dungeonId: 'black-gate', enemyId: null }, 4, { bossKillsByBoss: { 'black-gatekeeper': 1 } }) as any)
    expect(migrated.worldTier).toEqual({ current: 4, highestUnlocked: 5 })
    expect(migrated.notifications).toEqual([])
  })

  it('round-trips targeted and sequence v46 combat state without losing the save version', () => {
    const targeted = createInitialState()
    targeted.combat.active = true
    targeted.combat.dungeonId = 'hall-of-unbound-names'
    targeted.combat.targetEnemyId = 'nameless-cantor'
    targeted.combat.enemyId = 'nameless-cantor'
    targeted.combat.enemyHp = 3210
    targeted.combat.enemyWorldTier = 4
    targeted.combat.threatCleared = 80000
    targeted.worldTier.current = 4
    targeted.worldTier.highestUnlocked = 4
    const targetedLoaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(targeted))))
    expect(targetedLoaded.saveVersion).toBe(47)
    expect(targetedLoaded.combat).toMatchObject({ targetEnemyId: 'nameless-cantor', enemyId: 'nameless-cantor', enemyHp: 3210, enemyWorldTier: 4, threatCleared: 80000 })

    const sequence = createInitialState()
    sequence.combat.active = true
    sequence.combat.dungeonId = 'black-gate'
    sequence.combat.dungeonSequenceIndex = 4
    sequence.combat.enemyId = 'black-gatekeeper'
    sequence.combat.inBossFight = true
    sequence.combat.enemyHp = 12000
    const sequenceLoaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(sequence))))
    expect(sequenceLoaded.saveVersion).toBe(47)
    expect(sequenceLoaded.combat).toMatchObject({ dungeonId: 'black-gate', dungeonSequenceIndex: 4, enemyId: 'black-gatekeeper', enemyHp: 12000, inBossFight: true, targetEnemyId: null, threatCleared: 0 })
  })
})

describe('targeted combat migration', () => {
  const migrateCombat = (combat: Partial<ReturnType<typeof createInitialState>['combat']>, saveVersion = 40) => {
    const initial = createInitialState()
    return migrateSave({
      ...initial,
      saveVersion,
      combat: { ...initial.combat, ...combat },
    } as any)
  }

  it('recovers a Whispering Woods target from the active normal enemy or the authored first target', () => {
    expect(migrateCombat({ active: true, dungeonId: 'whispering-woods', enemyId: 'cinder-moth' }).combat.targetEnemyId).toBe('cinder-moth')
    expect(migrateCombat({ active: true, dungeonId: 'whispering-woods', enemyId: null }).combat.targetEnemyId).toBe('forest-wisp')
  })

  it('never restores the Whispering Woods boss as a farming target', () => {
    expect(migrateCombat({ active: true, dungeonId: 'whispering-woods', enemyId: 'forest-heart', targetEnemyId: 'forest-heart' }).combat.targetEnemyId).toBe('forest-wisp')
  })

  it('clears targeted farming state outside the targeted combat zone and repairs malformed IDs', () => {
    expect(migrateCombat({ active: true, dungeonId: 'abandoned-catacombs', enemyId: 'thornling', targetEnemyId: 'forest-wisp' }).combat.targetEnemyId).toBeNull()
    expect(migrateCombat({ active: true, dungeonId: 'whispering-woods', enemyId: 'thornling', targetEnemyId: 'removed-monster' as any }).combat.targetEnemyId).toBe('thornling')
  })

  it('preserves the target in the critical save snapshot and serialized round trip', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'tempest-stag'
    state.combat.targetEnemyId = 'tempest-stag'
    const encoded = JSON.stringify(serializeGameState(state))
    const validation = validateSerializedSave(encoded, state)

    expect(validation.ok).toBe(true)
    expect(validation.state?.combat.targetEnemyId).toBe('tempest-stag')
    expect(getCriticalSaveSnapshot(validation.state!).targetEnemyId).toBe('tempest-stag')
  })
})

describe('V25 Magic School XP semantic migration', () => {
  it('preserves old School levels while discarding old partial XP', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 24,
      schools: {
        fire: { level: 1, xp: 17 },
        water: { level: 8, xp: 153 },
        earth: { level: 20, xp: 380 },
        air: { level: Number.NaN, xp: 999 },
      },
    } as any)

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.schools).toEqual({
      fire: { level: 1, xp: 0 },
      water: { level: 8, xp: 2070 },
      earth: { level: 20, xp: 29870 },
      air: { level: 1, xp: 0 },
    })
    expect(migrated.progress.spellRanks).toMatchObject({ 'water-bolt': 1, 'mending-waters': 1 })
  })

  it('clamps a migrated level to the current cap and authored maximum', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 24,
      progress: { ...initial.progress, magicLevelCap: 40 },
      schools: { ...initial.schools, fire: { level: 999, xp: 1 } },
    } as any)
    expect(migrated.schools.fire).toEqual({ level: 40, xp: getSchoolTotalXpForLevel(40) })
  })

  it('does not remap already migrated V25 partial progress', () => {
    const initial = createInitialState()
    const v25 = {
      ...initial,
      saveVersion: 25,
      progress: { ...initial.progress, magicLevelCap: 40 },
      schools: { ...initial.schools, fire: { level: 8, xp: 2270 } },
    }
    const migrated = migrateSave(v25)
    expect(migrated.schools.fire).toEqual({ level: 8, xp: 2270 })
    expect(migrateSave(migrated).schools.fire).toEqual({ level: 8, xp: 2270 })
  })

  it('applies the same conversion to an older save representative', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 15,
      schools: { ...initial.schools, fire: { level: 4, xp: 70 } },
    } as any)
    expect(migrated.schools.fire).toEqual({ level: 4, xp: getSchoolTotalXpForLevel(4) })
  })
})

describe('legacy Artifact level-up migration', () => {
  it('finalizes a valid timed upgrade and clears the obsolete Artificing job', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: SAVE_VERSION,
      inventory: { ...initial.inventory, 'ember-staff': 1 },
      artifactProgress: { ...initial.artifactProgress, 'ember-staff': { level: 1, allocatedNodeIds: [], attunedNodeIds: [] } },
      activities: {
        ...initial.activities,
        artificing: { activeJob: { kind: 'artifact-upgrade', artifactId: 'ember-staff', fromLevel: 1, toLevel: 2 }, activeRecipeId: null, progressMs: 2500 },
      },
    } as any)

    expect(migrated.artifactProgress['ember-staff']?.level).toBe(2)
    expect(migrated.activities.artificing.activeJob).toBeNull()
    expect(migrated.activities.artificing.progressMs).toBe(0)
  })
})

describe('Arcane Core V6 migration', () => {
  it('does not restore transient manual Spell queue intent', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: SAVE_VERSION, combat: { ...initial.combat, queuedPlayerSpellId: 'wind-blade' } } as any)
    expect(migrated.combat.queuedPlayerSpellId).toBeNull()
  })

  it('does not restore transient pending Spell cast work', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: SAVE_VERSION, combat: {
      ...initial.combat,
      pendingPlayerSpellCast: {
        spellId: 'fire-bolt', targetInstanceKey: 'enemy:1', remainingWorkMs: 200,
        castWorkMs: 1_000, manaCostSnapshot: 30, arcaneCoreFree: false, castWorkMultiplier: 1,
      },
    } } as any)
    expect(migrated.combat.pendingPlayerSpellCast).toBeNull()
  })

  it('keeps valid ranked allocations and the direct wallet in current saves', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: SAVE_VERSION, arcaneCore: { totalPointsEarned: 500, nodes: { 'power-r1-arcane-force': { rank: 3 } } } } as any)
    expect(migrated.arcaneCore).toEqual({ totalPointsEarned: 500, nodes: { 'power-r1-arcane-force': { rank: 3 } } })
  })

  it('reprices V37 allocations while preserving old unspent Arcane Points', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
       saveVersion: 37,
       arcaneCore: { totalPointsEarned: 100, nodes: { 'power-r1-arcane-force': { rank: 5 }, 'power-r1-overwhelming-force': { rank: 1 } } },
    } as any)
    // V37 spent 5 standard points and 4 major points. V38 reprices those
    // allocations to 25 + 12 while carrying forward the old 91-point wallet.
    expect(migrated.arcaneCore).toEqual({ totalPointsEarned: 128, nodes: { 'power-r1-arcane-force': { rank: 5 }, 'power-r1-overwhelming-force': { rank: 1 } } })
  })

  it('does not mint points when a malformed V37 wallet is below old allocation spend', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
       saveVersion: 37,
       arcaneCore: { totalPointsEarned: 4, nodes: { 'power-r1-arcane-force': { rank: 5 } } },
    } as any)
    expect(migrated.arcaneCore).toEqual({ totalPointsEarned: 25, nodes: { 'power-r1-arcane-force': { rank: 5 } } })
  })

  it('sanitizes malformed V3 ranks without changing unrelated save content', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: SAVE_VERSION,
      inventory: { 'fire-fragment': 17 },
      arcaneCore: {
        totalPointsEarned: 321,
        nodes: {
          'power-r1-arcane-force': { rank: 99 },
          'power-r1-forceful-strikes': { rank: -2 },
          'obsolete-node': { rank: 5 },
          'power-r1-critical-insight': { rank: 'five' },
        },
      },
    } as any)
    expect(migrated.arcaneCore).toEqual({ totalPointsEarned: 321, nodes: { 'power-r1-arcane-force': { rank: 5 } } })
    expect(migrated.inventory).toEqual({ 'fire-fragment': 17 })
  })
})

describe('Combat Spell Loadout V35 to V36 migration', () => {
  it('converts legacy spellIds to AUTO slots and lastAppliedPresetId to selectedPresetId exactly once', () => {
    const initial = createInitialState()
    const legacy = {
      ...initial,
      saveVersion: 35,
      progress: { ...initial.progress, spellRanks: { 'fire-bolt': 1, 'wind-blade': 1 } },
      spellPresets: { presets: [{ id: 'spell-preset-1', name: 'Legacy', spellIds: ['fire-bolt', 'wind-blade'] }], lastAppliedPresetId: 'spell-preset-1' },
    }
    const migrated = migrateSave(legacy as any)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.spellPresets).toEqual({ presets: [{ id: 'spell-preset-1', name: 'Legacy', slots: [{ spellId: 'fire-bolt', autoCast: true }, { spellId: 'wind-blade', autoCast: true }] }], selectedPresetId: 'spell-preset-1' })
    expect(migrateSave(JSON.parse(JSON.stringify(migrated))).spellPresets).toEqual(migrated.spellPresets)
  })

  it('falls back from legacy runtime Auto-Cast priority to ordered AUTO then MANUAL slots', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 35,
      spellPresets: undefined,
      progress: { ...initial.progress, spellRanks: { 'fire-bolt': 1, 'wind-blade': 1, 'water-bolt': 1 } },
      activities: { ...initial.activities, autoCast: { ...initial.activities.autoCast, 'wind-blade': true }, autoCastPriority: ['wind-blade'] },
    } as any)
    expect(migrated.spellPresets.presets[0]).toEqual({ id: 'spell-preset-1', name: 'Combat Loadout', slots: [{ spellId: 'wind-blade', autoCast: true }, { spellId: 'fire-bolt', autoCast: false }, { spellId: 'water-bolt', autoCast: false }] })
  })

  it('restores a persisted active encounter snapshot without replacing it from the selected preset', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: SAVE_VERSION,
      progress: { ...initial.progress, spellRanks: { 'fire-bolt': 1, 'wind-blade': 1 } },
      spellPresets: { presets: [{ id: 'spell-preset-1', name: 'Selected', slots: [{ spellId: 'wind-blade', autoCast: false }] }], selectedPresetId: 'spell-preset-1' },
      combat: { ...initial.combat, active: true, enemyId: 'forest-wisp', activeSpellLoadout: { presetId: 'spell-preset-old', presetName: 'Encounter Deck', slots: [{ spellId: 'fire-bolt', autoCast: true }], signature: 'stale' } },
    } as any)
    expect(migrated.combat.activeSpellLoadout).toEqual({ presetId: 'spell-preset-old', presetName: 'Encounter Deck', slots: [{ spellId: 'fire-bolt', autoCast: true }], signature: 'fire-bolt:1' })
    expect(migrated.activities.autoCastPriority).toEqual(['fire-bolt'])
  })
})

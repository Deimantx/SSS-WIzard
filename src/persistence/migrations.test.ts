import { describe, expect, it } from 'vitest'
import { migrateSave } from './migrations'
import { serializeGameState } from './profileSaveManager'
import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { DUNGEONS, isDungeonUnlocked, isTutorialCompleted } from '../game/content/dungeons/dungeons'
import { MAX_ACTION_WORK_MS } from '../game/core/balance/combatTiming'

describe('save navigation migration', () => {
  it('maps the old aggregate Tower screen to Channeling', () => {
    const old = { ...createInitialState(), saveVersion: 1, ui: { screen: 'tower' } }
    expect(migrateSave(old).ui.screen).toBe('tower-channeling')
  })

  it('maps the removed Condensation destination to Transmutation', () => {
    const old = { ...createInitialState(), saveVersion: 7, ui: { screen: 'tower-condensation' } }
    expect(migrateSave(old).ui.screen).toBe('tower-transmutation')
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
    expect(migrated.progress.autoHuntBossByDungeon).toEqual({ 'whispering-woods': true, 'howling-den': false, 'abandoned-catacombs': false })
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

  it('migrates v6 Earrings state to an empty Cape without converting the item', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 6,
      inventory: { ...initial.inventory, 'tide-focus': 1 },
      equipment: { weapon: 'apprentice-wand', offhand: null, armor: null, helmet: null, amulet: null, earrings: 'tide-focus', ring1: null, ring2: null },
    })
    expect(migrated.saveVersion).toBe(8)
    expect(migrated.equipment.cape).toBeNull()
    expect('earrings' in migrated.equipment).toBe(false)
    expect(migrated.inventory['tide-focus']).toBe(1)
  })

  it('ignores an invalid v6 Earrings value without creating a Cape item', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 6,
      equipment: { ...initial.equipment, earrings: 'not-an-item' },
    })
    expect(migrated.equipment.cape).toBeNull()
    expect('earrings' in migrated.equipment).toBe(false)
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

    expect(migrated.activities.transmutation.jobs['water-fragment']).toEqual({ echoesAssigned: 1, progressMs: 3000 })
    expect(migrated.activities.transmutation.jobs['fire-fragment']).toBeUndefined()
  })

  it('migrates an active old Transmutation queue and preserves both legacy activities', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 7,
      activities: {
        ...initial.activities,
        condense: { running: true, element: 'fire', progressMs: 1500 },
        transmutation: { running: true, recipeId: 'ember-staff', progressMs: 4000, durationMs: 8000 },
      },
    } as any)

    expect(migrated.activities.transmutation.jobs['fire-fragment']).toEqual({ echoesAssigned: 1, progressMs: 1500 })
    expect(migrated.activities.transmutation.jobs['ember-staff']).toEqual({ echoesAssigned: 1, progressMs: 4000 })
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
    state.inventory = { 'apprentice-wand': 1, 'fire-fragment': 123, 'water-fragment': 47, 'life-essence': 99 }
    state.schools = { fire: { xp: 125, level: 7 }, water: { xp: 65, level: 4 }, earth: { xp: 45, level: 3 }, air: { xp: 25, level: 2 } }
    state.currencies.gold = 321
    state.equipment.weapon = 'apprentice-wand'
    state.progress.channeling.pillars['leyline-conduit'] = { rank: 1, level: 3 }
    state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 30, remainingQuantity: 30, progressMs: 0, echoesAssigned: 1, status: 'running' }
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }

    const migrated = migrateSave(JSON.parse(JSON.stringify(serializeGameState(state))))

    expect(migrated.inventory).toMatchObject({ 'fire-fragment': 123, 'water-fragment': 47, 'life-essence': 99 })
    expect(migrated.schools).toEqual(state.schools)
    expect(migrated.currencies).toEqual({ gold: 321 })
    expect(migrated.equipment.weapon).toBe('apprentice-wand')
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
    basic.combat.playerAttackDurationMs = 2_200
    basic.combat.playerAttackTimerMs = 777
    const basicLoaded = migrateSave(JSON.parse(JSON.stringify(serializeGameState(basic))))
    expect(basicLoaded.combat).toMatchObject({ enemyActionPatternId: 'default', enemyNextActionIndex: 2, enemyCurrentStepId: 'basic-2', enemyCurrentActionId: null, enemyCurrentActionPatternId: 'default', enemyActionDurationMs: 2_800, enemyActionTimerMs: 1_743, playerAttackDurationMs: 2_200, playerAttackTimerMs: 777 })

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
      playerAttackDurationMs: 9e15,
      playerAttackTimerMs: 9e15,
    } } as any)
    expect(migrated.combat.enemyActionDurationMs).toBeLessThanOrEqual(MAX_ACTION_WORK_MS)
    expect(migrated.combat.enemyActionTimerMs).toBe(MAX_ACTION_WORK_MS)
    expect(migrated.combat.playerAttackDurationMs).toBeLessThanOrEqual(MAX_ACTION_WORK_MS)
    expect(migrated.combat.playerAttackTimerMs).toBe(MAX_ACTION_WORK_MS)
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
      enemyStatuses: [{ statusId: 'burning', holder: 'enemy', instanceKey: 'player:equipment:test-ring:provider:ring1', source: { actor: 'player', kind: 'equipment', sourceId: 'test-ring', providerInstanceKey: 'ring1' }, remainingMs: 4_000, initialDurationMs: 5_000, stacks: 1, nextTickMs: 1_000, appliedAt: 0 }],
    } } as any)
    expect(migrated.combat.enemyStatuses[0].source).toMatchObject({ kind: 'equipment', sourceId: 'test-ring', providerInstanceKey: 'ring1' })
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
      enemyStatuses: [{ statusId: 'burning', holder: 'enemy', instanceKey: 'player:equipment:test-ring', source: { actor: 'player', kind: 'equipment', sourceId: 'test-ring', providerInstanceKey: 'ring1' }, remainingMs: 4_000, initialDurationMs: 5_000, stacks: 1, nextTickMs: 1_000, appliedAt: 0 }],
    } } as any)
    expect(migrated.combat.enemyStatuses[0].source).toMatchObject({ kind: 'equipment', sourceId: 'test-ring' })
    expect(migrated.combat.enemyStatuses[0].source.providerInstanceKey).toBeUndefined()
    expect(migrated.combat.enemyId).toBe('forest-wisp')
  })

  it('keeps durable progression while rebuilding a V17 Player Basic cycle', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 17,
      currencies: { gold: 321 },
      inventory: { ...initial.inventory, 'fire-fragment': 37 },
      equipment: { ...initial.equipment, weapon: 'apprentice-wand' },
      progress: { ...initial.progress, spellRanks: { ...initial.progress.spellRanks, 'fire-bolt': 1 }, bossKillsByBoss: { ...initial.progress.bossKillsByBoss, 'forest-heart': 2 } },
      combat: { ...initial.combat, active: true, dungeonId: 'whispering-woods', enemyId: 'forest-wisp', playerAttackTimerMs: 500 },
    })

    expect(migrated.currencies.gold).toBe(321)
    expect(migrated.inventory['fire-fragment']).toBe(37)
    expect(migrated.equipment.weapon).toBe('apprentice-wand')
    expect(migrated.progress.spellRanks['fire-bolt']).toBe(1)
    expect(migrated.progress.bossKillsByBoss['forest-heart']).toBe(2)
    expect(migrated.combat.playerAttackTimerMs).toBe(migrated.combat.playerAttackDurationMs)
  })

  it('clears legacy Transmutation full bars so they cannot craft for free', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 10,
      activities: { ...initial.activities, transmutation: { jobs: { 'fire-fragment': { echoesAssigned: 1, progressMs: 6000 } } } },
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
            'research-1': { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 3, remainingQuantity: 3, progressMs: 5000, echoesAssigned: 1, status: 'waiting-mana' },
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

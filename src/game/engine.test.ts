import { describe, expect, it } from 'vitest'
import { BALANCE } from './data/balance'
import { getSchoolTotalXpForLevel } from './core/balance/schoolXpCurve'
import { MANA_PILLARS, PILLAR_LEVEL_COSTS } from './data/manaPillars'
import { chooseMonster } from './data/dungeons'
import { MONSTERS } from './data/monsters'
import { getResearchXp } from './data/items'
import { completeResearchCycle, focusReservations, getSchoolLevel, manaRegenPerSecond, selectFreeFocus, selectRawFreeFocus, selectUsedFocus, usedFocus } from './engine'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from './engine/channelingEngine'
import { migrateSave } from '../persistence/migrations'
import { serializeGameState } from '../persistence/profileSaveManager'
import { makeInitialState, useGameStore } from '../store/gameStore'

describe('focus reservation engine', () => {
  it('reserves Focus for running activities and releases it when paused', () => {
    const state = makeInitialState()
    state.activities.channeling.echoesAssigned = 1
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    expect(usedFocus(state)).toBe(20)
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 0, progressMs: 0 }
    expect(usedFocus(state)).toBe(BALANCE.channeling.echoFocusCost)
    expect(focusReservations(state).map((item) => item.label)).toEqual(['Arcane Echo Channeling'])
  })

  it('rejects a Focus activity when the action would exceed max Focus', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setPlayer({ baseMaxFocus: 15 })
    game.addArcaneEcho()
    game.assignTransmutationEcho('fire-fragment')
    const state = useGameStore.getState()
    expect(state.activities.channeling.echoesAssigned).toBe(1)
    expect(state.activities.transmutation.jobs['fire-fragment']?.echoesAssigned ?? 0).toBe(0)
    expect(selectUsedFocus(state)).toBe(BALANCE.channeling.echoFocusCost)
  })

  it('rejects spell Auto-Cast when insufficient Focus is available', () => {
    const game = useGameStore.getState()
    game.preset('combat')
    game.setPlayer({ baseMaxFocus: 9 })
    game.toggleAutoCast('fire-bolt')
    expect(useGameStore.getState().activities.autoCast['fire-bolt']).toBe(false)
  })
})

describe('research rules', () => {
  it('consumes a fragment only on completion and grants school XP', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 1
    const result = completeResearchCycle(state, 'fire-fragment')
    expect(result.completed).toBe(true)
    expect(state.inventory['fire-fragment']).toBe(0)
    expect(state.schools.fire.xp).toBe(12)
  })

  it('preserves the next item at the level cap', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 1
    state.progress.magicLevelCap = 10
    state.schools.fire.level = 10
    state.schools.fire.xp = getSchoolTotalXpForLevel(10)
    const result = completeResearchCycle(state, 'fire-fragment')
    expect(result).toMatchObject({ completed: false, reason: 'cap' })
    expect(state.inventory['fire-fragment']).toBe(1)
  })

  it('maps XP to the expected level thresholds', () => {
    expect(getSchoolLevel(0, 10)).toBe(1)
    expect(getSchoolLevel(getSchoolTotalXpForLevel(2), 10)).toBe(2)
    expect(getSchoolLevel(getSchoolTotalXpForLevel(10) - 1, 10)).toBe(9)
    expect(getSchoolLevel(getSchoolTotalXpForLevel(20), 20)).toBe(20)
  })
})

describe('central game loop', () => {
  it('keeps dungeon threat while navigating and resets it on death', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.enterDungeon()
    game.killCurrentEnemy()
    expect(useGameStore.getState().combat.threatCleared).toBe(1)
    game.setScreen('tower-channeling')
    expect(useGameStore.getState().combat.threatCleared).toBe(1)
    game.setPlayer({ health: 1 })
    for (let index = 0; index < 12; index += 1) game.tick(1000)
    expect(useGameStore.getState().combat.threatCleared).toBe(0)
    expect(useGameStore.getState().progress.lifetimeKills).toBe(1)
  })

  it('first Forest Heart kill unlocks the Guild and the next dungeon', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.enterDungeon()
    game.killCurrentEnemy()
    game.setThreat(BALANCE.dungeon.whisperingWoodsThreatRequired)
    game.engageBoss('forest-heart')
    game.killCurrentEnemy()
    const state = useGameStore.getState()
    expect(state.progress.firstBossKill).toBe(true)
    expect(state.progress.guildUnlocked).toBe(true)
    expect(state.progress.forestHeartUnlocked).toBe(true)
    expect(state.progress.autoHuntBossUnlocked).toBe(true)
  })

  it('unlocks Auto Hunt after a manual boss kill and queues the current dungeon boss', () => {
    const game = useGameStore.getState()
    game.resetSave()
    expect(useGameStore.getState().progress.autoHuntBossUnlocked).toBe(false)
    game.enterDungeon()
    game.killCurrentEnemy()
    game.setThreat(BALANCE.dungeon.whisperingWoodsThreatRequired)
    game.engageBoss('forest-heart')
    game.killCurrentEnemy()
    expect(useGameStore.getState().progress.autoHuntBossUnlocked).toBe(true)
    game.toggleAutoHunt()
    expect(useGameStore.getState().progress.autoHuntBossByDungeon['whispering-woods']).toBe(true)
    for (let index = 0; index < 5; index += 1) game.tick(1000)
    game.setThreat(BALANCE.dungeon.whisperingWoodsThreatRequired)
    game.killCurrentEnemy()
    for (let index = 0; index < 5; index += 1) game.tick(1000)
    expect(useGameStore.getState().combat.enemyId).toBe('forest-heart')
    expect(useGameStore.getState().combat.inBossFight).toBe(true)
  })

  it('allows Threat to exceed the requirement while Auto Hunt is off', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.enterDungeon()
    game.setThreat(19)
    game.killCurrentEnemy()
    for (let index = 0; index < 5; index += 1) game.tick(1000)
    game.killCurrentEnemy()
    expect(useGameStore.getState().combat.threatCleared).toBe(21)
    expect(useGameStore.getState().combat.pendingBossId).toBeNull()
  })
})

describe('Pillars of Mana economy', () => {
  it('uses the exact common cost curve and makes all five Pillars available fresh', () => {
    expect(Object.values(PILLAR_LEVEL_COSTS).map((cost) => cost.fragment)).toEqual([5, 10, 15, 25, 40, 60, 90, 130, 180, 250])
    expect(Object.values(PILLAR_LEVEL_COSTS).map((cost) => cost.lifeEssence)).toEqual([10, 20, 30, 50, 80, 120, 180, 260, 360, 500])
    expect(Object.values(makeInitialState().progress.channeling.pillars).every((pillar) => pillar.rank === 1 && pillar.level === 0)).toBe(true)
    expect(Object.keys(MANA_PILLARS)).toHaveLength(5)
  })

  it('regenerates fresh Mana at +5/s and tracks only actual Mana gained', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setPlayer({ mana: 0 })
    game.tick(1000)
    expect(useGameStore.getState().player.mana).toBe(5)
    expect(useGameStore.getState().progress.channeling.totalManaGenerated).toBe(5)
    game.setPlayer({ mana: 100 })
    game.tick(1000)
    expect(useGameStore.getState().progress.channeling.totalManaGenerated).toBe(5)
  })

  it('adds exactly five Mana per Echo and reserves ten Focus per Echo', () => {
    const game = useGameStore.getState()
    game.resetSave()
    for (let index = 0; index < 5; index += 1) game.addArcaneEcho()
    const state = useGameStore.getState()
    expect(state.activities.channeling.echoesAssigned).toBe(5)
    expect(selectUsedFocus(state)).toBe(50)
    expect(manaRegenPerSecond(state)).toBe(30)
    game.removeArcaneEcho()
    expect(selectUsedFocus(useGameStore.getState())).toBe(40)
    expect(manaRegenPerSecond(useGameStore.getState())).toBe(25)
  })

  it('rejects an Echo when only five Focus is free', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setPlayer({ baseMaxFocus: 5 })
    game.addArcaneEcho()
    const state = useGameStore.getState()
    expect(state.activities.channeling.echoesAssigned).toBe(0)
    expect(selectUsedFocus(state)).toBe(0)
    expect(state.notifications[state.notifications.length - 1]?.text).toContain('Not enough free Focus')
  })

  it('applies Leyline Conduit levels as additive passive regen', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setManaPillarLevel('leyline-conduit', 3)
    expect(manaRegenPerSecond(useGameStore.getState())).toBe(8)
    game.setChannelingEchoes(5)
    expect(manaRegenPerSecond(useGameStore.getState())).toBe(33)
    game.setManaPillarLevel('leyline-conduit', 5)
    expect(manaRegenPerSecond(useGameStore.getState())).toBe(35)
  })

  it('purchases Arcane Reservoir with Fragments plus Life Essence and preserves current Mana', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setPlayer({ mana: 50 })
    game.addItem('earth-fragment', 5)
    game.addItem('water-fragment', 5)
    game.addItem('life-essence', 10)
    game.upgradeManaPillar('arcane-reservoir')
    const state = useGameStore.getState()
    expect(state.progress.channeling.pillars['arcane-reservoir'].level).toBe(1)
    expect(state.inventory['earth-fragment']).toBe(0)
    expect(state.inventory['water-fragment']).toBe(0)
    expect(state.inventory['life-essence']).toBe(0)
    expect(state.player.maxMana).toBe(125)
    expect(state.player.mana).toBe(50)
  })

  it('blocks purchases when Life Essence is protected without consuming anything', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.addItem('earth-fragment', 5)
    game.addItem('water-fragment', 5)
    game.addItem('life-essence', 10)
    game.toggleItemProtection('life-essence')
    game.upgradeManaPillar('arcane-reservoir')
    const state = useGameStore.getState()
    expect(state.progress.channeling.pillars['arcane-reservoir'].level).toBe(0)
    expect(state.inventory['earth-fragment']).toBe(5)
    expect(state.inventory['water-fragment']).toBe(5)
    expect(state.inventory['life-essence']).toBe(10)
    expect(state.notifications[state.notifications.length - 1]?.text).toContain('protected')
  })

  it('blocks an incomplete transaction when one required resource is missing', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.addItem('earth-fragment', 5)
    game.addItem('water-fragment', 5)
    game.addItem('life-essence', 9)
    game.upgradeManaPillar('arcane-reservoir')
    const state = useGameStore.getState()
    expect(state.progress.channeling.pillars['arcane-reservoir'].level).toBe(0)
    expect(state.inventory['earth-fragment']).toBe(5)
    expect(state.inventory['water-fragment']).toBe(5)
  })

  it('tracks capped Mana generation instead of theoretical flow', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setChannelingEchoes(5)
    game.setPlayer({ mana: 99 })
    game.tick(1000)
    expect(useGameStore.getState().player.mana).toBe(100)
    expect(useGameStore.getState().progress.channeling.totalManaGenerated).toBe(1)
  })

  it('completes Stable Leyline and Echo Resonance exactly once', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setPlayer({ mana: 0 })
    game.setChannelingManaGenerated(2499)
    game.tick(1000)
    expect(useGameStore.getState().progress.channeling.discoveries['stable-leyline']).toBe(true)
    const stableNotifications = useGameStore.getState().notifications.filter((note) => note.text.includes('Stable Leyline'))
    expect(stableNotifications).toHaveLength(1)
    game.setChannelingEchoes(5)
    for (let index = 0; index < 119; index += 1) game.tick(1000)
    expect(useGameStore.getState().progress.channeling.discoveries['echo-resonance']).toBe(false)
    game.tick(1000)
    expect(useGameStore.getState().progress.channeling.discoveries['echo-resonance']).toBe(true)
    expect(manaRegenPerSecond(useGameStore.getState())).toBe(33.5)
  })

  it('resets the continuous Echo timer when five Echoes stop sustaining', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setChannelingEchoes(5)
    for (let index = 0; index < 90; index += 1) game.tick(1000)
    game.setChannelingEchoes(4)
    game.tick(1000)
    expect(useGameStore.getState().progress.channeling.fiveEchoSustainMs).toBe(0)
  })

  it('adds Deep Reservoir capacity as a derived discovery bonus', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setManaPillarLevel('arcane-reservoir', 5)
    const state = useGameStore.getState()
    expect(state.progress.channeling.discoveries['deep-reservoir']).toBe(true)
    expect(state.player.maxMana).toBe(250)
  })

  it('separates passive Mana Resonance from Echo output', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setManaPillarLevel('leyline-conduit', 10)
    game.setManaPillarLevel('mana-resonance', 10)
    game.setManaPillarLevel('echo-attunement', 10)
    game.setChannelingEchoes(5)
    const regen = getManaRegenBreakdown(useGameStore.getState())
    expect(regen.passiveBeforeResonance).toBe(15)
    expect(regen.passiveAfterResonance).toBe(22.5)
    expect(regen.echoTotal).toBe(37.5)
    expect(regen.total).toBe(60)
  })

  it('amplifies the full Max Mana pool with Astral Expansion and floors once', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setManaPillarLevel('arcane-reservoir', 4)
    game.setChannelingDiscovery('deep-reservoir', false)
    game.setManaPillarLevel('astral-expansion', 10)
    game.setChannelingDiscovery('deep-reservoir', false)
    expect(getManaCapacityBreakdown(useGameStore.getState())).toMatchObject({ preAmplification: 200, total: 300 })
    game.setManaPillarLevel('astral-expansion', 5)
    game.setChannelingDiscovery('deep-reservoir', false)
    game.setPlayer({ baseMaxMana: 101 })
    expect(getManaCapacityBreakdown(useGameStore.getState()).total).toBe(251)
  })

  it('stacks Echo Attunement multiplicatively with Echo Resonance', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setManaPillarLevel('echo-attunement', 10)
    game.setChannelingEchoes(5)
    game.setChannelingDiscovery('echo-resonance', true)
    expect(getManaRegenBreakdown(useGameStore.getState()).echoTotal).toBeCloseTo(41.25)
  })

  it('cannot raise a Pillar beyond Level 10 or spend after mastery', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setManaPillarLevel('mana-resonance', 10)
    game.addItem('fire-fragment', 250)
    game.addItem('air-fragment', 250)
    game.addItem('life-essence', 500)
    game.upgradeManaPillar('mana-resonance')
    const state = useGameStore.getState()
    expect(state.progress.channeling.pillars['mana-resonance'].level).toBe(10)
    expect(state.inventory['life-essence']).toBe(500)
  })
})

describe('Life Essence combat material', () => {
  it('is guaranteed at 1-3 quantity for every current monster while preserving existing loot', () => {
    Object.values(MONSTERS).forEach((monster) => {
      expect(monster.loot).toContainEqual({ itemId: 'life-essence', min: 1, max: 3, chance: 1 })
    })
    expect(MONSTERS['forest-heart'].loot.some((drop) => drop.itemId === 'heartseed')).toBe(true)
  })
})

describe('Developer channeling overrides', () => {
  it('adds a temporary Mana regen source and restores the normal calculation', () => {
    const game = useGameStore.getState()
    game.resetSave()
    const normal = getManaRegenBreakdown(useGameStore.getState()).total
    game.setDebugManaRegenBonus(100)
    expect(getManaRegenBreakdown(useGameStore.getState())).toMatchObject({ developerBonus: 100, total: normal + 100 })
    game.resetDebugOverrides()
    expect(getManaRegenBreakdown(useGameStore.getState()).total).toBe(normal)
  })

  it('applies a debug Max Mana flat bonus before Astral Expansion', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.forceSetManaPillarLevel('astral-expansion', 10)
    game.setDebugMaxManaBonus(500)
    expect(getManaCapacityBreakdown(useGameStore.getState())).toMatchObject({ developerCapacityBonus: 500, preAmplification: 600, total: 900 })
  })

  it('allows explicit Mana over-cap testing without changing normal clamps', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setDebugAllowManaOverCap(true)
    game.setPlayer({ mana: 1000 })
    expect(useGameStore.getState().player.mana).toBe(1000)
    game.tick(1000)
    expect(useGameStore.getState().player.mana).toBeGreaterThan(1000)
    game.setDebugAllowManaOverCap(false)
    expect(useGameStore.getState().player.mana).toBe(useGameStore.getState().player.maxMana)
  })

  it('reports raw negative Focus while keeping gameplay free Focus safe', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setDebugMaxFocusBonus(500)
    game.setDebugIgnoreEchoLimit(true)
    game.forceSetEchoes(20)
    const state = useGameStore.getState()
    expect(state.player.maxFocus).toBe(600)
    expect(selectRawFreeFocus(state)).toBe(400)
    game.setDebugMaxFocusBonus(0)
    expect(selectRawFreeFocus(useGameStore.getState())).toBe(-100)
  })

  it('allows normal Focus actions to exceed the pool only in debug over-reservation mode', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setPlayer({ baseMaxFocus: 5 })
    game.setDebugAllowFocusOverCap(true)
    game.addArcaneEcho()
    const state = useGameStore.getState()
    expect(state.activities.channeling.echoesAssigned).toBe(1)
    expect(selectRawFreeFocus(state)).toBe(-5)
    expect(selectFreeFocus(state)).toBe(0)
  })

  it('force sets Echoes and Pillars without consuming materials', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.forceSetEchoes(20)
    expect(useGameStore.getState().activities.channeling.echoesAssigned).toBe(5)
    game.setDebugIgnoreEchoLimit(true)
    game.forceSetEchoes(20)
    game.forceSetManaPillarLevel('leyline-conduit', 10)
    expect(useGameStore.getState().activities.channeling.echoesAssigned).toBe(20)
    expect(useGameStore.getState().progress.channeling.pillars['leyline-conduit'].level).toBe(10)
    expect(getManaRegenBreakdown(useGameStore.getState()).echoTotal).toBe(100)
  })

  it('resets only debug controls and strips them from normal profile serialization', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.addItem('fire-fragment', 9)
    game.setManaPillarLevel('mana-resonance', 1)
    game.setDebugManaRegenBonus(500)
    game.setDebugMaxManaBonus(500)
    game.setDebugMaxFocusBonus(500)
    game.setDebugAllowManaOverCap(true)
    game.setDebugAllowFocusOverCap(true)
    game.setDebugIgnoreEchoLimit(true)
    const before = useGameStore.getState()
    const serialized = serializeGameState(before)
    expect(serialized).not.toHaveProperty('debug')
    game.resetDebugOverrides()
    const after = useGameStore.getState()
    expect(after.debug).toEqual({ bonusManaRegenFlat: 0, bonusMaxManaFlat: 0, bonusMaxFocusFlat: 0, allowManaOverCap: false, allowFocusOverCap: false, ignoreEchoLimit: false, transmutationEchoCapacityOverride: null, showLockedTransmutationRecipes: false, playerImmortal: false, enemyImmortal: false, infiniteMana: false, ignoreSpellCooldowns: false, disablePlayerBasicAttack: false, disableAutoCast: false, freezePlayerActions: false, freezeEnemyActions: false, combatPaused: false, combatTimeScale: 1 })
    expect(after.inventory['fire-fragment']).toBe(before.inventory['fire-fragment'])
    expect(after.progress.channeling.pillars['mana-resonance'].level).toBe(1)
  })
})

describe('Phase 2 progression', () => {
  it('uses the Rank-based Auto-Cast Focus formula', () => {
    const state = makeInitialState()
    state.progress.spellRanks = { 'water-ward': 1 }
    state.activities.autoCast['water-ward'] = true
    expect(selectUsedFocus(state)).toBe(10)
    state.activities.autoCast['water-ward'] = false
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.activities.autoCast['fire-bolt'] = true
    expect(selectUsedFocus(state)).toBe(10)
  })

  it('keeps Research item and target school independent', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 1
    expect(getResearchXp('fire-fragment', 'fire')).toBe(12)
    expect(getResearchXp('fire-fragment', 'earth')).toBe(8)
    const result = completeResearchCycle(state, 'fire-fragment', 'earth')
    expect(result.xp).toBe(8)
    expect(state.schools.earth.xp).toBe(8)
    expect(state.inventory['fire-fragment']).toBe(0)
  })

  it('chooses normal monsters from dungeon data using injectable RNG', () => {
    const pool = ['forest-wisp', 'thornling', 'stone-root'] as const
    expect(chooseMonster([...pool], () => 0)).toBe('forest-wisp')
    expect(chooseMonster([...pool], () => 0.5)).toBe('thornling')
    expect(chooseMonster([...pool], () => 0.99)).toBe('stone-root')
    expect(MONSTERS['forest-wisp'].actions['arc-spark'].name).toBe('Arc Spark')
  })

  it('migrates a v1 save and rejects an unknown version safely', () => {
    const migrated = migrateSave({ saveVersion: 1, player: { mana: 42, maxFocus: 100 }, inventory: { 'fire-fragment': 2 }, equipment: { weapon: 'apprentice-wand' }, activities: { research: { running: true, itemId: 'fire-fragment', progressMs: 1000 } } })
    expect(migrated.saveVersion).toBe(8)
    expect(migrated.activities.research.targetSchoolId).toBe('fire')
    expect(migrated.inventory['fire-fragment']).toBe(2)
    expect(() => migrateSave({ saveVersion: 99 })).toThrow('Unsupported save version')
  })

  it('claims Guild Requests once and grants the Apprentice Focus bonus once', () => {
    const game = useGameStore.getState()
    game.preset('guild')
    game.donateGuildRequest('arcane-supply', 'max')
    game.claimGuildReward('arcane-supply')
    game.claimGuildReward('arcane-supply')
    game.claimGuildReward('clear-the-woods')
    game.claimGuildReward('sentinel-breaker')
    game.promoteGuild()
    const state = useGameStore.getState()
    expect(state.progress.requestClaims['arcane-supply']).toBe(true)
    expect(state.progress.guildReputation).toBe(275)
    expect(state.progress.guildRank).toBe('apprentice')
    expect(state.player.maxFocus).toBe(110)
    game.promoteGuild()
    expect(useGameStore.getState().player.maxFocus).toBe(110)
  })
})

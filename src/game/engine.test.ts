import { describe, expect, it } from 'vitest'
import { BALANCE, SCHOOL_LEVEL_XP } from './data/balance'
import { CHANNELING_RANK_COSTS } from './data/channeling'
import { chooseMonster } from './data/dungeons'
import { MONSTERS } from './data/monsters'
import { getResearchXp } from './data/items'
import { completeResearchCycle, focusReservations, getSchoolLevel, manaRegenPerSecond, selectUsedFocus, usedFocus } from './engine'
import { migrateSave } from '../persistence/migrations'
import { makeInitialState, useGameStore } from '../store/gameStore'

describe('focus reservation engine', () => {
  it('reserves Focus for running activities and releases it when paused', () => {
    const state = makeInitialState()
    state.activities.channeling.echoesAssigned = 1
    state.activities.condense.running = true
    expect(usedFocus(state)).toBe(30)
    state.activities.condense.running = false
    expect(usedFocus(state)).toBe(BALANCE.channeling.echoFocusCost)
    expect(focusReservations(state).map((item) => item.label)).toEqual(['Arcane Echo Channeling'])
  })

  it('rejects a Focus activity when the action would exceed max Focus', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setPlayer({ baseMaxFocus: 20 })
    game.addArcaneEcho()
    game.toggleCondense()
    const state = useGameStore.getState()
    expect(state.activities.channeling.echoesAssigned).toBe(1)
    expect(state.activities.condense.running).toBe(false)
    expect(selectUsedFocus(state)).toBe(BALANCE.channeling.echoFocusCost)
  })

  it('rejects spell Auto-Cast when insufficient Focus is available', () => {
    const game = useGameStore.getState()
    game.preset('combat')
    game.setPlayer({ baseMaxFocus: 10 })
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
    state.schools.fire.level = 10
    state.schools.fire.xp = SCHOOL_LEVEL_XP(10)
    const result = completeResearchCycle(state, 'fire-fragment')
    expect(result).toMatchObject({ completed: false, reason: 'cap' })
    expect(state.inventory['fire-fragment']).toBe(1)
  })

  it('maps XP to the expected level thresholds', () => {
    expect(getSchoolLevel(0, 10)).toBe(1)
    expect(getSchoolLevel(SCHOOL_LEVEL_XP(1), 10)).toBe(2)
    expect(getSchoolLevel(SCHOOL_LEVEL_XP(9), 10)).toBe(10)
    expect(getSchoolLevel(SCHOOL_LEVEL_XP(20), 20)).toBe(20)
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

  it('first Grove Sentinel kill unlocks the Guild and Forest Heart', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.enterDungeon()
    game.setThreat(BALANCE.dungeon.whisperingWoodsThreatRequired)
    game.engageBoss('grove-sentinel')
    game.killCurrentEnemy()
    const state = useGameStore.getState()
    expect(state.progress.firstBossKill).toBe(true)
    expect(state.progress.guildUnlocked).toBe(true)
    expect(state.progress.forestHeartUnlocked).toBe(true)
    expect(state.progress.autoHuntBossUnlocked).toBe(true)
  })

  it('unlocks Auto Hunt after a manual Sentinel kill and queues the boss at threshold', () => {
    const game = useGameStore.getState()
    game.resetSave()
    expect(useGameStore.getState().progress.autoHuntBossUnlocked).toBe(false)
    game.enterDungeon()
    game.setThreat(BALANCE.dungeon.whisperingWoodsThreatRequired)
    game.engageBoss('grove-sentinel')
    game.killCurrentEnemy()
    expect(useGameStore.getState().progress.autoHuntBossUnlocked).toBe(true)
    game.toggleAutoHunt()
    expect(useGameStore.getState().progress.autoHuntBossByDungeon['whispering-woods']).toBe(true)
    for (let index = 0; index < 5; index += 1) game.tick(1000)
    game.setThreat(BALANCE.dungeon.whisperingWoodsThreatRequired)
    game.killCurrentEnemy()
    for (let index = 0; index < 5; index += 1) game.tick(1000)
    expect(useGameStore.getState().combat.enemyId).toBe('grove-sentinel')
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

describe('Channeling V2 economy', () => {
  it('uses the confirmed cost curve for both infrastructure families', () => {
    expect(Object.values(CHANNELING_RANK_COSTS)).toEqual([9, 18, 50, 160, 250])
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

  it('uses the confirmed conduit regen values', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setChannelingUpgradeRank('leyline-conduit', 3)
    expect(manaRegenPerSecond(useGameStore.getState())).toBe(8)
    game.setChannelingEchoes(5)
    expect(manaRegenPerSecond(useGameStore.getState())).toBe(33)
    game.setChannelingUpgradeRank('leyline-conduit', 5)
    expect(manaRegenPerSecond(useGameStore.getState())).toBe(35)
  })

  it('purchases reservoir upgrades at the exact cost and preserves current Mana', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setPlayer({ mana: 50 })
    game.addItem('earth-fragment', 9)
    game.addItem('water-fragment', 9)
    game.purchaseChannelingUpgrade('mana-reservoir')
    const state = useGameStore.getState()
    expect(state.progress.channeling.manaReservoirRank).toBe(1)
    expect(state.inventory['earth-fragment']).toBe(0)
    expect(state.inventory['water-fragment']).toBe(0)
    expect(state.player.maxMana).toBe(125)
    expect(state.player.mana).toBe(50)
  })

  it('blocks purchases when a required Fragment is protected', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.addItem('earth-fragment', 9)
    game.addItem('water-fragment', 9)
    game.toggleItemProtection('earth-fragment')
    game.purchaseChannelingUpgrade('mana-reservoir')
    const state = useGameStore.getState()
    expect(state.progress.channeling.manaReservoirRank).toBe(0)
    expect(state.inventory['earth-fragment']).toBe(9)
    expect(state.notifications[state.notifications.length - 1]?.text).toContain('protected')
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

  it('resets the continuous Echo timer when five Echoes are interrupted', () => {
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
    game.setChannelingUpgradeRank('mana-reservoir', 5)
    const state = useGameStore.getState()
    expect(state.progress.channeling.discoveries['deep-reservoir']).toBe(true)
    expect(state.player.maxMana).toBe(250)
  })
})

describe('Phase 2 progression', () => {
  it('uses spell-specific Auto-Cast Focus values', () => {
    const state = makeInitialState()
    state.progress.unlockedSpells = ['water-ward']
    state.activities.autoCast['water-ward'] = true
    expect(selectUsedFocus(state)).toBe(20)
    state.activities.autoCast['water-ward'] = false
    state.progress.unlockedSpells = ['fire-bolt']
    state.activities.autoCast['fire-bolt'] = true
    expect(selectUsedFocus(state)).toBe(15)
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
    expect(MONSTERS['forest-wisp'].actionSequence[2].name).toBe('Arc Spark')
  })

  it('migrates a v1 save and rejects an unknown version safely', () => {
    const migrated = migrateSave({ saveVersion: 1, player: { mana: 42, maxFocus: 100 }, inventory: { 'fire-fragment': 2 }, equipment: { weapon: 'apprentice-wand' }, activities: { research: { running: true, itemId: 'fire-fragment', progressMs: 1000 } } })
    expect(migrated.saveVersion).toBe(3)
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

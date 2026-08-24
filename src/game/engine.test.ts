import { describe, expect, it } from 'vitest'
import { BALANCE, SCHOOL_LEVEL_XP } from './data/balance'
import { completeResearchCycle, focusReservations, getSchoolLevel, usedFocus } from './engine'
import { makeInitialState, useGameStore } from '../store/gameStore'

describe('focus reservation engine', () => {
  it('reserves Focus for running activities and releases it when paused', () => {
    const state = makeInitialState()
    state.activities.autoChannel = true
    state.activities.condense.running = true
    expect(usedFocus(state)).toBe(35)
    state.activities.condense.running = false
    expect(usedFocus(state)).toBe(BALANCE.mana.autoChannelFocus)
    expect(focusReservations(state).map((item) => item.label)).toEqual(['Auto Channeling'])
  })

  it('does not exceed max Focus', () => {
    const state = makeInitialState()
    state.player.maxFocus = 30
    state.activities.autoChannel = true
    state.activities.condense.running = true
    state.activities.research.running = true
    expect(usedFocus(state)).toBe(60)
    expect(Math.max(0, state.player.maxFocus - usedFocus(state))).toBe(0)
  })
})

describe('research rules', () => {
  it('consumes a fragment only on completion and grants school XP', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 1
    const result = completeResearchCycle(state, 'fire-fragment')
    expect(result.completed).toBe(true)
    expect(state.inventory['fire-fragment']).toBe(0)
    expect(state.schools.fire.xp).toBe(10)
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
    game.setScreen('tower')
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
  })
})

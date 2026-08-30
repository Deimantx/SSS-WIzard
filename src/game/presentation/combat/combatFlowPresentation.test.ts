import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import { getCombatFlowPresentation, type CombatFlowRuntimeInput } from './combatFlowPresentation'

const enemy = MONSTERS['grove-sentinel']
const dungeon = DUNGEONS['whispering-woods']
const pattern = enemy.actionPatterns.default

const input = (changes: Partial<CombatFlowRuntimeInput> = {}): CombatFlowRuntimeInput => ({
  active: true, dungeonId: 'whispering-woods', selectedDungeonId: 'whispering-woods', enemyId: 'grove-sentinel', dungeon, enemy,
  threatCleared: 0, inBossFight: false, encounterTimerMs: 0, playerAttackTimerMs: 500, playerAttackIntervalMs: 2800,
  enemyActionTimerMs: 1200, enemyActionRecoveryMs: 2600, enemyActionIndex: 0, enemyTelegraphMs: 0, enemyTelegraphActionId: null,
  enemyTelegraphStepId: null, enemyTelegraphPatternId: null, enemyActionPatternId: 'default', playerBasicDamage: 8,
  playerStunned: false, enemyStunned: false, pattern, nextStep: pattern.steps[0], telegraphAction: undefined, ...changes,
})

describe('getCombatFlowPresentation', () => {
  it('selects Player Basic Attack when the player timer resolves sooner, including an exact runtime tie', () => {
    expect(getCombatFlowPresentation(input()).nextResolution).toMatchObject({ actor: 'player', label: 'Player Basic Attack', remainingMs: 500 })
    expect(getCombatFlowPresentation(input({ playerAttackTimerMs: 1200 })).nextResolution?.actor).toBe('player')
  })

  it('selects the enemy action when its recovery resolves sooner', () => {
    const presentation = getCombatFlowPresentation(input({ playerAttackTimerMs: 1500, enemyActionTimerMs: 400, nextStep: pattern.steps[2], enemyActionIndex: 2 }))
    expect(presentation.nextResolution).toMatchObject({ actor: 'enemy', label: 'Root Crush', remainingMs: 400 })
    expect(presentation.enemyTimeline).toMatchObject({ label: 'Root Crush', state: 'recovery', remainingMs: 400 })
  })

  it('uses the telegraph runtime for enemy timing and intent', () => {
    const action = enemy.actions['root-crush']
    const presentation = getCombatFlowPresentation(input({ playerAttackTimerMs: 1500, enemyTelegraphMs: 800, enemyTelegraphActionId: 'root-crush', enemyTelegraphStepId: 'root-crush-step', telegraphAction: action, nextStep: pattern.steps[3], enemyActionIndex: 3 }))
    expect(presentation.nextResolution).toMatchObject({ actor: 'enemy', label: 'Root Crush', remainingMs: 800 })
    expect(presentation.enemyTimeline).toMatchObject({ state: 'telegraph', remainingMs: 800, progress: 60 })
    expect(presentation.enemyIntent).toMatchObject({ label: 'Root Crush', special: true })
    expect(presentation.patternIndex).toBe(2)
  })

  it('switches to non-timer modes outside an active enemy encounter', () => {
    expect(getCombatFlowPresentation(input({ active: false, enemyId: null, enemy: null })).mode).toBe('tower')
    expect(getCombatFlowPresentation(input({ enemyId: null, enemy: null, threatCleared: 20 })).mode).toBe('boss-ready')
    expect(getCombatFlowPresentation(input({ enemyId: null, enemy: null, threatCleared: 0, encounterTimerMs: 3200 })).mode).toBe('encounter-delay')
  })
})

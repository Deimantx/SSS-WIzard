import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import { getCombatFlowPresentation, type CombatFlowRuntimeInput } from './combatFlowPresentation'

const enemy = MONSTERS['grove-sentinel']
const dungeon = DUNGEONS['whispering-woods']
const pattern = enemy.actionPatterns.default

const input = (changes: Partial<CombatFlowRuntimeInput> = {}): CombatFlowRuntimeInput => ({
  active: true, dungeonId: 'whispering-woods', selectedDungeonId: 'whispering-woods', enemyId: 'grove-sentinel', dungeon, enemy,
  threatCleared: 0, inBossFight: false, encounterTimerMs: 0, playerAttackTimerMs: 500, playerAttackDurationMs: 2800,
  enemyActionTimerMs: 1200, enemyActionDurationMs: 2600, enemyNextActionIndex: 3, enemyCurrentActionId: 'root-crush',
  enemyCurrentStepId: pattern.steps[2].id, enemyCurrentActionPatternId: 'default', enemyActionPatternId: 'default', playerBasicDamage: 8,
  playerStunned: false, enemyStunned: false, pattern, nextStep: pattern.steps[3], currentStep: pattern.steps[2], currentAction: enemy.actions['root-crush'], ...changes,
})

describe('getCombatFlowPresentation', () => {
  it('keeps player and enemy timing readable with acting states', () => {
    const presentation = getCombatFlowPresentation(input())
    expect(presentation.playerTimeline).toMatchObject({ actor: 'player', label: 'Basic Attack', remainingMs: 500, state: 'acting' })
    expect(presentation.enemyTimeline).toMatchObject({ label: 'Root Crush', state: 'acting', remainingMs: 1200 })
  })

  it('renders the committed action and its current pattern step', () => {
    const presentation = getCombatFlowPresentation(input({ enemyActionTimerMs: 800, enemyActionDurationMs: 2000, currentAction: enemy.actions['root-crush'] }))
    expect(presentation.enemyIntent).toMatchObject({ label: 'Root Crush', special: true, iconKind: 'direct-damage' })
    expect(presentation.enemyTimeline?.progress).toBe(60)
    expect(presentation.currentStepIndex).toBe(2)
    expect(presentation.currentActionId).toBe('root-crush')
  })

  it('renders a committed Basic Attack without inventing an instant hit', () => {
    const basic = pattern.steps[0]
    const presentation = getCombatFlowPresentation(input({ enemyActionTimerMs: 1500, enemyActionDurationMs: 2500, enemyCurrentActionId: null, enemyCurrentStepId: basic.id, currentStep: basic, currentAction: undefined }))
    expect(presentation.enemyIntent).toMatchObject({ label: 'Basic Attack', special: false })
    expect(presentation.enemyTimeline?.remainingMs).toBe(1500)
    expect(presentation.enemyTimeline?.progress).toBe(40)
  })

  it('clamps negative live timers to zero', () => {
    const presentation = getCombatFlowPresentation(input({ playerAttackTimerMs: -200, enemyActionTimerMs: -100 }))
    expect(presentation.playerTimeline?.remainingMs).toBe(0)
    expect(presentation.enemyTimeline?.remainingMs).toBe(0)
  })

  it('switches to non-timer modes outside an active enemy encounter', () => {
    expect(getCombatFlowPresentation(input({ active: false, enemyId: null, enemy: null })).mode).toBe('tower')
    expect(getCombatFlowPresentation(input({ enemyId: null, enemy: null, threatCleared: 20 })).mode).toBe('boss-ready')
    expect(getCombatFlowPresentation(input({ enemyId: null, enemy: null, threatCleared: 0, encounterTimerMs: 3200 })).mode).toBe('encounter-delay')
  })
})

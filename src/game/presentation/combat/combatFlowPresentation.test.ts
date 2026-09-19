import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import { getCombatFlowPresentation, type CombatFlowRuntimeInput } from './combatFlowPresentation'

const enemy = MONSTERS['grove-sentinel']
const dungeon = DUNGEONS['whispering-woods']
const pattern = enemy.actionPatterns.default

const input = (changes: Partial<CombatFlowRuntimeInput> = {}): CombatFlowRuntimeInput => ({
  active: true, dungeonId: 'whispering-woods', selectedDungeonId: 'whispering-woods', enemyId: 'grove-sentinel', dungeon, enemy,
  threatCleared: 0, inBossFight: false, encounterTimerMs: 0,
  playerSpellCast: { spellId: 'fire-bolt', targetInstanceKey: 'enemy:1', remainingWorkMs: 500, castWorkMs: 2800, manaCostSnapshot: 30, arcaneCoreFree: false, castWorkMultiplier: 1 },
  playerSpellCastRate: 1,
  enemyActionTimerMs: 1200, enemyActionDurationMs: 2600, enemyNextActionIndex: 3, enemyCurrentActionId: 'root-crush',
  enemyCurrentStepId: pattern.steps[2].id, enemyCurrentActionPatternId: 'default', enemyActionPatternId: 'default', playerBasicDamage: 8,
  playerStunned: false, enemyStunned: false, pattern, nextStep: pattern.steps[3], currentStep: pattern.steps[2], currentAction: enemy.actions['root-crush'], ...changes,
})

describe('getCombatFlowPresentation', () => {
  it('keeps player and enemy timing readable with acting states', () => {
    const presentation = getCombatFlowPresentation(input())
    expect(presentation.playerTimeline).toMatchObject({ actor: 'player', label: 'Fire Bolt', remainingMs: 500, state: 'acting' })
    expect(presentation.enemyTimeline).toMatchObject({ label: 'Root Crush', state: 'acting', remainingMs: 1200 })
  })

  it('renders the committed action and its current pattern step', () => {
    const presentation = getCombatFlowPresentation(input({ enemyActionTimerMs: 800, enemyActionDurationMs: 2000, currentAction: enemy.actions['root-crush'] }))
    expect(presentation.enemyCurrentAction).toMatchObject({ label: 'Root Crush', special: true, iconKind: 'direct-damage' })
    expect(presentation.enemyTimeline?.progress).toBe(60)
    expect(presentation.currentStepIndex).toBe(2)
    expect(presentation.currentActionId).toBe('root-crush')
  })

  it('renders a committed Basic Attack without inventing an instant hit', () => {
    const basic = pattern.steps[0]
    const presentation = getCombatFlowPresentation(input({ enemyActionTimerMs: 1500, enemyActionDurationMs: 2500, enemyCurrentActionId: null, enemyCurrentStepId: basic.id, currentStep: basic, currentAction: undefined }))
    expect(presentation.enemyCurrentAction).toMatchObject({ label: 'Basic Attack', special: false })
    expect(presentation.enemyTimeline?.remainingMs).toBe(1500)
    expect(presentation.enemyTimeline?.progress).toBe(40)
  })

  it('clamps negative live timers to zero', () => {
    const presentation = getCombatFlowPresentation(input({ playerSpellCast: { ...input().playerSpellCast!, remainingWorkMs: -200 }, enemyActionTimerMs: -100 }))
    expect(presentation.playerTimeline?.remainingMs).toBe(0)
    expect(presentation.playerTimeline).toMatchObject({ remainingWorkMs: 0, etaMs: 0, progress: 100 })
    expect(presentation.enemyTimeline?.remainingMs).toBe(0)
  })

  it('keeps frozen progress and remaining time visible while Stunned', () => {
    const presentation = getCombatFlowPresentation(input({ enemyActionTimerMs: 800, enemyActionDurationMs: 2000, enemyStunned: true }))
    expect(presentation.enemyTimeline).toMatchObject({ state: 'stunned', remainingMs: null, progress: 60, label: 'Root Crush' })
  })

  it('does not invent an enemy action when canonical timing says none is committed', () => {
    const presentation = getCombatFlowPresentation(input({
      enemyTiming: null,
      enemyCurrentStepId: null,
      enemyCurrentActionId: null,
      currentStep: undefined,
      currentAction: undefined,
    }))
    expect(presentation.mode).toBe('combat')
    expect(presentation.enemyTimeline).toBeNull()
    expect(presentation.enemyCurrentAction).toBeNull()
    expect(presentation.currentStepIndex).toBe(-1)
  })

  it('uses the legacy timing fallback only when canonical enemy timing is omitted', () => {
    const presentation = getCombatFlowPresentation(input({ enemyTiming: undefined }))
    expect(presentation.enemyTimeline).toMatchObject({ label: 'Root Crush', remainingMs: 1200 })
  })

  it('keeps debug pauses and paused spell casts distinct from Stunned', () => {
    const frozen = getCombatFlowPresentation(input({ enemyTiming: { baseWorkMs: 2600, remainingWorkMs: 1200, progress: 100 - 1200 / 2600 * 100, rate: 0, etaMs: null, blocked: true, blockReason: 'debug-freeze' } }))
    const paused = getCombatFlowPresentation(input({ playerSpellCastRate: 0 }))
    expect(frozen.enemyTimeline).toMatchObject({ state: 'paused', blockReason: 'debug-freeze' })
    expect(paused.playerTimeline).toMatchObject({ state: 'paused', blocked: true, remainingMs: null, remainingWorkMs: 500 })
    expect(frozen.enemyTimeline?.state).not.toBe('stunned')
    expect(paused.playerTimeline?.state).not.toBe('stunned')
  })

  it('does not show a player Basic Attack from legacy timers when no spell is committed', () => {
    expect(getCombatFlowPresentation(input({ playerSpellCast: null, playerAttackTimerMs: 500, playerAttackDurationMs: 2800 })).playerTimeline).toBeNull()
  })

  it('switches to non-timer modes outside an active enemy encounter', () => {
    expect(getCombatFlowPresentation(input({ active: false, enemyId: null, enemy: null })).mode).toBe('tower')
    expect(getCombatFlowPresentation(input({ enemyId: null, enemy: null, threatCleared: 20 })).mode).toBe('boss-ready')
    expect(getCombatFlowPresentation(input({ enemyId: null, enemy: null, threatCleared: 0, encounterTimerMs: 3200 })).mode).toBe('encounter-delay')
  })
})

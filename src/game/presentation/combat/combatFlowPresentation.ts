import type { DungeonDefinition } from '../../content/dungeons/dungeons'
import type { MonsterDefinition } from '../../content/monsters'
import { buildCombatActionPresentation, formatCombatEffect, type CombatActionPresentation, type CombatEffectPresentation } from './combatActionPresentation'
import { classifyEnemyActionPatternIcon, type EnemyPatternIconKind } from './enemyPatternIconPresentation'
import type { ActionPattern, ActionStep, CombatActionDefinition } from '../../systems/combat/combatTypes'
import type { DungeonId, MonsterId } from '../../types'
import { getFallbackTimedActionState, type TimedActionState } from '../../systems/combat/actionTiming'

export type CombatFlowMode = 'tower' | 'boss-ready' | 'encounter-delay' | 'combat'
export type CombatFlowTimelineState = 'acting' | 'stunned' | 'paused' | 'disabled'

export interface CombatFlowTimeline {
  actor: 'player' | 'enemy'
  label: string
  remainingMs: number | null
  remainingWorkMs: number
  baseWorkMs: number
  rate: number
  etaMs: number | null
  blocked: boolean
  blockReason: TimedActionState['blockReason']
  progress: number | null
  state: CombatFlowTimelineState
}

export interface CombatFlowPresentation {
  mode: CombatFlowMode
  dungeonId: DungeonId
  dungeon: DungeonDefinition
  enemy: MonsterDefinition | null
  playerTimeline: CombatFlowTimeline | null
  enemyTimeline: CombatFlowTimeline | null
  enemyCurrentAction: { label: string; action: CombatActionPresentation | null; basic: CombatEffectPresentation | null; special: boolean; iconKind: EnemyPatternIconKind } | null
  pattern: ActionPattern | undefined
  currentStepIndex: number
  currentStepId: string | null
  currentActionId: string | null
  currentPatternOriginId: string | null
  currentActionDurationMs: number
  encounterTimerMs: number
}

export interface CombatFlowRuntimeInput {
  active: boolean
  dungeonId: DungeonId | null
  selectedDungeonId: DungeonId
  enemyId: MonsterId | null
  dungeon: DungeonDefinition
  enemy: MonsterDefinition | null
  threatCleared: number
  inBossFight: boolean
  encounterTimerMs: number
  playerAttackTimerMs: number
  playerAttackDurationMs: number
  enemyActionTimerMs: number
  enemyActionDurationMs: number
  enemyNextActionIndex: number
  enemyCurrentActionId: string | null
  enemyCurrentStepId: string | null
  enemyCurrentActionPatternId: string | null
  enemyActionPatternId: string | null
  playerBasicDamage: number
  /** Legacy/pure-presentation hint; live UI supplies canonical timing state. */
  playerStunned?: boolean
  enemyStunned?: boolean
  pattern?: ActionPattern
  nextStep?: ActionStep
  currentStep?: ActionStep
  currentAction?: CombatActionDefinition
  playerTiming?: TimedActionState
  enemyTiming?: TimedActionState | null
}

const stepIndex = (pattern: ActionPattern | undefined, stepId: string | null | undefined, fallback = -1) => {
  if (!pattern) return -1
  const index = stepId ? pattern.steps.findIndex((step) => step.id === stepId) : -1
  return index >= 0 ? index : fallback
}
export function getCombatFlowPresentation(input: CombatFlowRuntimeInput): CombatFlowPresentation {
  const dungeonId = input.dungeonId ?? input.selectedDungeonId
  const bossReady = input.active && !input.enemy && !input.inBossFight && input.threatCleared >= input.dungeon.threatRequired
  if (!input.active) return { mode: 'tower', dungeonId, dungeon: input.dungeon, enemy: null, playerTimeline: null, enemyTimeline: null, enemyCurrentAction: null, pattern: undefined, currentStepIndex: -1, currentStepId: null, currentActionId: null, currentPatternOriginId: null, currentActionDurationMs: 0, encounterTimerMs: input.encounterTimerMs }
  if (!input.enemy && bossReady) return { mode: 'boss-ready', dungeonId, dungeon: input.dungeon, enemy: null, playerTimeline: null, enemyTimeline: null, enemyCurrentAction: null, pattern: undefined, currentStepIndex: -1, currentStepId: null, currentActionId: null, currentPatternOriginId: null, currentActionDurationMs: 0, encounterTimerMs: input.encounterTimerMs }
  if (!input.enemy) return { mode: 'encounter-delay', dungeonId, dungeon: input.dungeon, enemy: null, playerTimeline: null, enemyTimeline: null, enemyCurrentAction: null, pattern: undefined, currentStepIndex: -1, currentStepId: null, currentActionId: null, currentPatternOriginId: null, currentActionDurationMs: 0, encounterTimerMs: Math.max(0, input.encounterTimerMs) }

  const enemyAction = input.currentAction
  const enemyActionPresentation = enemyAction ? buildCombatActionPresentation(enemyAction) : null
  const basicPresentation = !enemyActionPresentation && input.currentStep?.type === 'basic'
    ? formatCombatEffect({ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: input.enemy.basicAttackDamage } }, { actor: 'enemy', kind: 'basic-attack' })
    : null
  const enemyTotalMs = input.enemyActionDurationMs || input.enemy.basicAttackTimeMs
  const playerTiming = input.playerTiming ?? getFallbackTimedActionState(input.playerAttackDurationMs, input.playerAttackTimerMs, Boolean(input.playerStunned))
  // `undefined` means a legacy caller omitted canonical timing; `null` is a
  // deliberate live-runtime statement that no enemy action is committed.
  const enemyTiming = input.enemyTiming === undefined
    ? getFallbackTimedActionState(enemyTotalMs, input.enemyActionTimerMs, Boolean(input.enemyStunned))
    : input.enemyTiming
  const hasCommittedEnemyAction = enemyTiming !== null && Boolean(input.currentStep || input.currentAction || input.enemyCurrentStepId)
  const timelineState = (timing: TimedActionState, legacyStunned = false): CombatFlowTimelineState => {
    if (legacyStunned || timing.blockReason === 'status-control') return 'stunned'
    if (timing.blockReason === 'disabled') return 'disabled'
    if (timing.blockReason === 'debug-freeze') return 'paused'
    return 'acting'
  }
  const playerTimeline: CombatFlowTimeline = { actor: 'player', label: 'Basic Attack', remainingMs: playerTiming.etaMs, remainingWorkMs: playerTiming.remainingWorkMs, baseWorkMs: playerTiming.baseWorkMs, rate: playerTiming.rate, etaMs: playerTiming.etaMs, blocked: playerTiming.blocked, blockReason: playerTiming.blockReason, progress: playerTiming.progress, state: timelineState(playerTiming, input.playerStunned) }
  const enemyTimeline: CombatFlowTimeline | null = hasCommittedEnemyAction && enemyTiming
    ? { actor: 'enemy', label: enemyAction?.name ?? (input.currentStep?.type === 'basic' ? 'Basic Attack' : 'Enemy Action'), remainingMs: enemyTiming.etaMs, remainingWorkMs: enemyTiming.remainingWorkMs, baseWorkMs: enemyTiming.baseWorkMs, rate: enemyTiming.rate, etaMs: enemyTiming.etaMs, blocked: enemyTiming.blocked, blockReason: enemyTiming.blockReason, progress: enemyTiming.progress, state: timelineState(enemyTiming, input.enemyStunned) }
    : null

  const rawIndex = Number.isFinite(input.enemyNextActionIndex) ? Math.max(0, Math.floor(input.enemyNextActionIndex) - 1) : -1
  const currentPatternChanged = Boolean(input.enemyCurrentActionPatternId && input.pattern && input.enemyCurrentActionPatternId !== input.pattern.id)
  const currentIndex = !hasCommittedEnemyAction || currentPatternChanged ? -1 : stepIndex(input.pattern, input.currentStep?.id, rawIndex)
  const enemyCurrentAction = hasCommittedEnemyAction && enemyTiming ? { label: enemyAction?.name ?? (basicPresentation ? 'Basic Attack' : 'Enemy Action'), action: enemyActionPresentation, basic: basicPresentation, special: Boolean(enemyActionPresentation), iconKind: enemyAction ? classifyEnemyActionPatternIcon(enemyAction) : 'basic-attack' } : null
  return {
    mode: 'combat', dungeonId, dungeon: input.dungeon, enemy: input.enemy,
    playerTimeline, enemyTimeline,
    enemyCurrentAction,
    pattern: input.pattern, currentStepIndex: currentIndex, currentStepId: hasCommittedEnemyAction ? input.currentStep?.id ?? null : null, currentActionId: hasCommittedEnemyAction ? input.enemyCurrentActionId : null, currentPatternOriginId: hasCommittedEnemyAction ? input.enemyCurrentActionPatternId : null, currentActionDurationMs: enemyTimeline?.baseWorkMs ?? 0,
    encounterTimerMs: input.encounterTimerMs,
  }
}

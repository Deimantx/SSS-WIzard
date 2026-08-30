import type { DungeonDefinition } from '../../content/dungeons/dungeons'
import type { MonsterDefinition } from '../../content/monsters'
import { buildCombatActionPresentation, formatCombatEffect, type CombatActionPresentation, type CombatEffectPresentation } from './combatActionPresentation'
import type { ActionPattern, ActionStep, CombatActionDefinition } from '../../systems/combat/combatTypes'
import type { DungeonId, MonsterId } from '../../types'

export type CombatFlowMode = 'tower' | 'boss-ready' | 'encounter-delay' | 'combat'
export type CombatFlowTimelineState = 'ready' | 'telegraph' | 'recovery' | 'stunned'

export interface CombatFlowTimeline {
  actor: 'player' | 'enemy'
  label: string
  remainingMs: number | null
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
  enemyIntent: { label: string; action: CombatActionPresentation | null; basic: CombatEffectPresentation | null; special: boolean } | null
  pattern: ActionPattern | undefined
  patternIndex: number
  activeStepId: string | null
  activeActionId: string | null
  activeOriginMatchesCurrent: boolean
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
  playerAttackIntervalMs: number
  enemyActionTimerMs: number
  enemyActionRecoveryMs: number
  enemyActionIndex: number
  enemyTelegraphMs: number
  enemyTelegraphActionId: string | null
  enemyTelegraphStepId: string | null
  enemyTelegraphPatternId: string | null
  enemyActionPatternId: string | null
  playerBasicDamage: number
  playerStunned: boolean
  enemyStunned: boolean
  pattern?: ActionPattern
  nextStep?: ActionStep
  telegraphAction?: CombatActionDefinition
}

const clampProgress = (remainingMs: number, totalMs: number) => Math.max(0, Math.min(100, (1 - remainingMs / Math.max(1, totalMs)) * 100))
const stepIndex = (pattern: ActionPattern | undefined, stepId: string | null, fallback = -1) => {
  if (!pattern) return -1
  const index = stepId ? pattern.steps.findIndex((step) => step.id === stepId) : -1
  return index >= 0 ? index : fallback
}
export function getCombatFlowPresentation(input: CombatFlowRuntimeInput): CombatFlowPresentation {
  const dungeonId = input.dungeonId ?? input.selectedDungeonId
  const bossReady = input.active && !input.enemy && !input.inBossFight && input.threatCleared >= input.dungeon.threatRequired
  if (!input.active) return { mode: 'tower', dungeonId, dungeon: input.dungeon, enemy: null, playerTimeline: null, enemyTimeline: null, enemyIntent: null, pattern: undefined, patternIndex: -1, activeStepId: null, activeActionId: null, activeOriginMatchesCurrent: true, encounterTimerMs: input.encounterTimerMs }
  if (!input.enemy && bossReady) return { mode: 'boss-ready', dungeonId, dungeon: input.dungeon, enemy: null, playerTimeline: null, enemyTimeline: null, enemyIntent: null, pattern: undefined, patternIndex: -1, activeStepId: null, activeActionId: null, activeOriginMatchesCurrent: true, encounterTimerMs: input.encounterTimerMs }
  if (!input.enemy) return { mode: 'encounter-delay', dungeonId, dungeon: input.dungeon, enemy: null, playerTimeline: null, enemyTimeline: null, enemyIntent: null, pattern: undefined, patternIndex: -1, activeStepId: null, activeActionId: null, activeOriginMatchesCurrent: true, encounterTimerMs: Math.max(0, input.encounterTimerMs) }

  const telegraphAction = input.telegraphAction
  const activeTelegraph = Boolean(telegraphAction)
  const enemyAction = telegraphAction ?? (input.nextStep?.type === 'action' ? input.enemy.actions[input.nextStep.actionId] : undefined)
  const enemyActionPresentation = enemyAction ? buildCombatActionPresentation(enemyAction) : null
  const basicPresentation = !enemyActionPresentation && input.nextStep?.type === 'basic'
    ? formatCombatEffect({ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: input.enemy.basicAttackDamage } }, { actor: 'enemy', kind: 'basic-attack' })
    : null
  const enemyRemainingMs = Math.max(0, activeTelegraph ? input.enemyTelegraphMs : input.enemyActionTimerMs)
  const enemyTotalMs = activeTelegraph ? telegraphAction?.telegraphMs ?? 1 : input.enemyActionRecoveryMs || input.enemy.actionIntervalMs
  const playerRemainingMs = Math.max(0, input.playerAttackTimerMs)
  const playerTimeline: CombatFlowTimeline = { actor: 'player', label: 'Basic Attack', remainingMs: input.playerStunned ? null : playerRemainingMs, progress: input.playerStunned ? null : clampProgress(playerRemainingMs, input.playerAttackIntervalMs), state: input.playerStunned ? 'stunned' : 'ready' }
  const enemyTimeline: CombatFlowTimeline = { actor: 'enemy', label: enemyAction?.name ?? (input.nextStep?.type === 'basic' ? 'Basic Attack' : 'Enemy Action'), remainingMs: input.enemyStunned ? null : enemyRemainingMs, progress: input.enemyStunned ? null : clampProgress(enemyRemainingMs, enemyTotalMs), state: input.enemyStunned ? 'stunned' : activeTelegraph ? 'telegraph' : 'recovery' }

  const rawIndex = Number.isFinite(input.enemyActionIndex) ? Math.max(0, Math.floor(input.enemyActionIndex)) : -1
  const currentIndex = stepIndex(input.pattern, input.enemyTelegraphStepId, rawIndex)
  return {
    mode: 'combat', dungeonId, dungeon: input.dungeon, enemy: input.enemy,
    playerTimeline, enemyTimeline,
    enemyIntent: { label: enemyAction?.name ?? (basicPresentation ? 'Basic Attack' : 'Preparing'), action: enemyActionPresentation, basic: basicPresentation, special: Boolean(enemyActionPresentation) },
    pattern: input.pattern, patternIndex: currentIndex, activeStepId: input.enemyTelegraphStepId, activeActionId: input.enemyTelegraphActionId, activeOriginMatchesCurrent: !input.enemyTelegraphPatternId || input.enemyTelegraphPatternId === input.enemyActionPatternId,
    encounterTimerMs: input.encounterTimerMs,
  }
}

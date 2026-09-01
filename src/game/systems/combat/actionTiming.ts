import { BALANCE } from '../../core/balance/balance'
import type { GameState } from '../../types'
import {
  getCurrentEnemyActionRate,
  getPlayerBasicAttackRate,
  MAX_ACTION_WORK_MS,
  MIN_ACTION_TIME_MS,
} from './actionRuntime'

export interface TimedActionState {
  /** Authored work before live speed modifiers are applied. */
  baseWorkMs: number
  /** Remaining authored work on the action clock. */
  remainingWorkMs: number
  /** Completion percentage of the work clock. */
  progress: number
  /** Work consumed per real simulation millisecond. */
  rate: number
  /** Real simulation milliseconds until completion, or null while blocked. */
  etaMs: number | null
  blocked: boolean
}

const finiteWork = (value: number, fallback: number) => Math.min(
  MAX_ACTION_WORK_MS,
  Math.max(MIN_ACTION_TIME_MS, Number.isFinite(value) && value > 0 ? value : fallback),
)

const buildTiming = (baseWorkMs: number, remainingWorkMs: number, rate: number): TimedActionState => {
  const base = finiteWork(baseWorkMs, MIN_ACTION_TIME_MS)
  const remaining = Math.min(MAX_ACTION_WORK_MS, Math.max(0, Number.isFinite(remainingWorkMs) ? remainingWorkMs : base))
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 0
  return {
    baseWorkMs: base,
    remainingWorkMs: remaining,
    progress: Math.max(0, Math.min(100, (1 - remaining / base) * 100)),
    rate: safeRate,
    etaMs: safeRate > 0 ? remaining / safeRate : null,
    blocked: safeRate <= 0,
  }
}

export const getTimedActionState = (baseWorkMs: number, remainingWorkMs: number, rate: number) => buildTiming(baseWorkMs, remainingWorkMs, rate)

export const getPlayerBasicTiming = (state: GameState): TimedActionState => buildTiming(
  state.combat.playerAttackDurationMs || BALANCE.player.basicAttackIntervalMs,
  state.combat.playerAttackTimerMs,
  state.debug.freezePlayerActions || state.debug.disablePlayerBasicAttack ? 0 : getPlayerBasicAttackRate(state),
)

export const getCurrentEnemyActionTiming = (state: GameState): TimedActionState | null => {
  if (!state.combat.enemyId || !state.combat.enemyCurrentStepId) return null
  const rate = state.debug.freezeEnemyActions ? 0 : getCurrentEnemyActionRate(state)
  const authoredBase = state.combat.enemyActionDurationMs
  return buildTiming(authoredBase, state.combat.enemyActionTimerMs, rate)
}

/** Shared presentation fallback for callers that only have a raw timer. */
export const getFallbackTimedActionState = (baseWorkMs: number, remainingWorkMs: number, blocked: boolean) => buildTiming(baseWorkMs, remainingWorkMs, blocked ? 0 : 1)

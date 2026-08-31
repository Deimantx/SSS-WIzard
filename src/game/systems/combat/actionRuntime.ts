import { MONSTERS } from '../../content/monsters'
import { appendLog } from '../../engine'
import type { GameState } from '../../types'
import type { CombatActor } from './magnitude'
import { getCombatModifiers } from './modifiers'
import { actorCannotAct } from './statusRuntime'
import { runCombatTriggers, type CombatEventContext } from './triggerRuntime'
import type { ActionStep, CombatActionDefinition, CombatEffect, CombatEventSink, CombatSource, CombatTag, CombatTrigger } from './combatTypes'

export type ActionEffectExecutor = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink) => void
export type ActionLifecycleEvent = Extract<CombatTrigger, 'on-action-start' | 'on-action-resolve'>

const opponentOf = (actor: CombatActor): CombatActor => actor === 'player' ? 'enemy' : 'player'

const actionTags = (action: CombatActionDefinition): CombatTag[] => [...new Set<CombatTag>(['special', ...(action.tags ?? [])])]

const actionSource = (action: CombatActionDefinition): CombatSource => ({
  actor: 'enemy',
  kind: 'action',
  sourceId: action.id,
  tags: actionTags(action),
})

const patternFor = (state: GameState, patternId?: string) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return undefined
  const monster = MONSTERS[enemyId]
  const id = patternId ?? state.combat.enemyActionPatternId ?? monster.defaultActionPatternId
  return monster.actionPatterns[id] ?? (patternId ? undefined : monster.actionPatterns[monster.defaultActionPatternId])
}

export const getEnemyActionPattern = (state: GameState, patternId?: string) => patternFor(state, patternId)

export const getEnemyAction = (state: GameState, actionId: string | null | undefined) => {
  const enemyId = state.combat.enemyId
  return enemyId && actionId ? MONSTERS[enemyId].actions[actionId] : undefined
}

export const getCurrentEnemyActionStep = (state: GameState) => {
  const pattern = patternFor(state)
  if (!pattern || pattern.steps.length === 0) return undefined
  const rawIndex = Number.isFinite(state.combat.enemyActionIndex) ? Math.floor(state.combat.enemyActionIndex) : 0
  const index = Math.max(0, rawIndex) % pattern.steps.length
  return pattern.steps[index]
}

export const resolveActionRecoveryMs = (state: GameState, actor: CombatActor, baseRecoveryMs: number) => {
  const actionSpeed = getCombatModifiers(state, actor, 'action-speed-percent', { sourceTags: ['special'] })
  return Math.max(100, Math.round(Math.max(0, baseRecoveryMs) * Math.max(0.1, 1 - actionSpeed)))
}

export const scheduleEnemyRecovery = (state: GameState, baseRecoveryMs: number) => {
  const recovery = resolveActionRecoveryMs(state, 'enemy', baseRecoveryMs)
  state.combat.enemyActionRecoveryMs = recovery
  state.combat.enemyActionTimerMs = recovery
  return recovery
}

/** Clears runtime state for administrative cleanup. It never emits gameplay events. */
export const resetEnemyActionRuntime = (state: GameState) => {
  state.combat.enemyActionPatternId = null
  state.combat.enemyActionIndex = 0
  state.combat.enemyActionTimerMs = 0
  state.combat.enemyActionRecoveryMs = 0
  clearActiveEnemyAction(state)
}

/** Clears only the currently telegraphed Action; future Pattern state survives. */
export const clearActiveEnemyAction = (state: GameState) => {
  state.combat.enemyTelegraphMs = 0
  state.combat.enemyTelegraphActionId = null
  state.combat.enemyTelegraphStepId = null
  state.combat.enemyTelegraphPatternId = null
}

/** Initializes a new enemy before combat-start observers run. */
export const initializeEnemyActionRuntime = (state: GameState) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) {
    resetEnemyActionRuntime(state)
    return
  }
  const monster = MONSTERS[enemyId]
  state.combat.enemyActionPatternId = monster.defaultActionPatternId
  state.combat.enemyActionIndex = 0
  state.combat.enemyActionTimerMs = 0
  state.combat.enemyActionRecoveryMs = 0
  clearActiveEnemyAction(state)
}

export const setEnemyActionPattern = (state: GameState, patternId: string, uiEvents?: CombatEventSink) => {
  const pattern = patternFor(state, patternId)
  if (!pattern || pattern.steps.length === 0 || !state.combat.enemyId) return false
  state.combat.enemyActionPatternId = pattern.id
  state.combat.enemyActionIndex = 0
  uiEvents?.push({ source: state.combat.enemyId ? { kind: 'enemy', monsterId: state.combat.enemyId } : { kind: 'system' }, sourceKind: 'system', dungeonId: state.combat.dungeonId ?? undefined, category: 'pattern', sourceId: pattern.id })
  return true
}

const actionContext = (action: CombatActionDefinition, patternId: string | undefined, stepId: string | undefined): CombatEventContext => {
  const source = actionSource(action)
  return {
    source,
    sourceTags: source.tags,
    actionId: action.id,
    actionStepId: stepId,
    actionPatternId: patternId,
    eventActionTags: source.tags,
  }
}

/** Action lifecycle observers are intentionally routed source actor first, opponent second. */
export const runActionEventObservers = (
  state: GameState,
  event: ActionLifecycleEvent,
  context: CombatEventContext,
  executeEffects: ActionEffectExecutor,
  depth = 0,
  uiEvents?: CombatEventSink,
) => {
  const sourceActor = context.source?.actor
  if (!sourceActor) return
  runCombatTriggers(state, sourceActor, event, context, executeEffects, depth, [], uiEvents)
  runCombatTriggers(state, opponentOf(sourceActor), event, context, executeEffects, depth, [], uiEvents)
}

const startActionDefinition = (state: GameState, action: CombatActionDefinition, stepId: string | undefined, executeEffects: ActionEffectExecutor, patternId = state.combat.enemyActionPatternId ?? undefined, depth = 0, uiEvents?: CombatEventSink) => {
  state.combat.enemyTelegraphActionId = action.id
  state.combat.enemyTelegraphStepId = stepId ?? null
  state.combat.enemyTelegraphPatternId = patternId ?? null
  state.combat.enemyTelegraphMs = Math.max(0, action.telegraphMs)
  const context = actionContext(action, patternId, stepId)
  uiEvents?.push({ source: { kind: 'enemy', monsterId: state.combat.enemyId as NonNullable<typeof state.combat.enemyId> }, sourceKind: 'action', dungeonId: state.combat.dungeonId ?? undefined, target: 'player', category: 'system', sourceId: action.id, actionId: action.id, actionPhase: 'telegraph' })
  runActionEventObservers(state, 'on-action-start', context, executeEffects, depth, uiEvents)
  if (state.combat.enemyTelegraphActionId !== action.id) return true
  if (state.combat.enemyTelegraphMs <= 0 && !actorCannotAct(state, 'enemy')) resolveActiveEnemyAction(state, executeEffects, depth, uiEvents)
  else appendLog(state, `${action.name} telegraphed · ${formatMilliseconds(action.telegraphMs)}`)
  return true
}

const formatMilliseconds = (milliseconds: number) => `${(Math.max(0, milliseconds) / 1000).toFixed(1)}s`

export const startEnemyAction = (state: GameState, actionId: string, executeEffects: ActionEffectExecutor, stepId?: string, depth = 0, uiEvents?: CombatEventSink) => {
  if (!state.combat.enemyId || state.combat.enemyTelegraphActionId) return false
  const action = getEnemyAction(state, actionId)
  if (!action) return false
  return startActionDefinition(state, action, stepId, executeEffects, state.combat.enemyActionPatternId ?? undefined, depth, uiEvents)
}

export const startNextEnemyAction = (state: GameState, executeEffects: ActionEffectExecutor, depth = 0, uiEvents?: CombatEventSink) => {
  const enemyId = state.combat.enemyId
  if (!enemyId || state.combat.enemyTelegraphActionId || actorCannotAct(state, 'enemy')) return false
  const monster = MONSTERS[enemyId]
  const pattern = patternFor(state)
  if (!pattern || pattern.steps.length === 0) return false
  state.combat.enemyActionPatternId = pattern.id
  const rawIndex = Number.isFinite(state.combat.enemyActionIndex) ? Math.floor(state.combat.enemyActionIndex) : 0
  state.combat.enemyActionIndex = Math.max(0, rawIndex) % pattern.steps.length
  const step: ActionStep = pattern.steps[state.combat.enemyActionIndex]
  state.combat.enemyActionIndex = (state.combat.enemyActionIndex + 1) % pattern.steps.length

  if (step.type === 'basic') {
    const source: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: `${enemyId}-basic-attack`, tags: ['basic-attack', 'direct'] }
    const before = state.player.health
    executeEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: monster.basicAttackDamage }, tags: ['basic-attack', 'direct'] }], source, depth, uiEvents)
    appendLog(state, `${monster.name} Basic hits for ${Math.max(0, before - state.player.health)}.`)
    scheduleEnemyRecovery(state, monster.actionIntervalMs)
    return true
  }

  const action = monster.actions[step.actionId]
  if (!action) {
    scheduleEnemyRecovery(state, monster.actionIntervalMs)
    return false
  }
  return startActionDefinition(state, action, step.id, executeEffects, pattern.id, depth, uiEvents)
}

export const resolveActiveEnemyAction = (state: GameState, executeEffects: ActionEffectExecutor, depth = 0, uiEvents?: CombatEventSink) => {
  const enemyId = state.combat.enemyId
  const actionId = state.combat.enemyTelegraphActionId
  if (!enemyId || !actionId || actorCannotAct(state, 'enemy')) return false
  const action = MONSTERS[enemyId].actions[actionId]
  if (!action) {
    clearActiveEnemyAction(state)
    return false
  }
  const stepId = state.combat.enemyTelegraphStepId ?? undefined
  const patternId = state.combat.enemyTelegraphPatternId ?? state.combat.enemyActionPatternId ?? undefined
  const context = actionContext(action, patternId, stepId)
  clearActiveEnemyAction(state)
  if (action.effects.length === 0) uiEvents?.push({ source: { kind: 'enemy', monsterId: enemyId }, sourceKind: 'action', dungeonId: state.combat.dungeonId ?? undefined, target: 'player', category: 'enemy-action', sourceId: action.id, actionId: action.id })
  executeEffects(state, action.effects, context.source as CombatSource, depth + 1, uiEvents)
  runActionEventObservers(state, 'on-action-resolve', context, executeEffects, depth + 1, uiEvents)
  scheduleEnemyRecovery(state, action.recoveryMs ?? MONSTERS[enemyId].actionIntervalMs)
  appendLog(state, `${action.name} resolves.`)
  return true
}

/** Direct developer resolution; it still uses Action effects and resolve observers. */
export const forceResolveEnemyAction = (state: GameState, actionId: string, executeEffects: ActionEffectExecutor, depth = 0, uiEvents?: CombatEventSink) => {
  if (state.combat.enemyTelegraphActionId === actionId) return resolveActiveEnemyAction(state, executeEffects, depth, uiEvents)
  if (state.combat.enemyTelegraphActionId) return false
  const enemyId = state.combat.enemyId
  const action = getEnemyAction(state, actionId)
  if (!enemyId || !action) return false
  const context = actionContext(action, state.combat.enemyActionPatternId ?? undefined, undefined)
  if (action.effects.length === 0) uiEvents?.push({ source: { kind: 'enemy', monsterId: enemyId }, sourceKind: 'action', dungeonId: state.combat.dungeonId ?? undefined, target: 'player', category: 'enemy-action', sourceId: action.id, actionId: action.id })
  executeEffects(state, action.effects, context.source as CombatSource, depth + 1, uiEvents)
  runActionEventObservers(state, 'on-action-resolve', context, executeEffects, depth + 1, uiEvents)
  scheduleEnemyRecovery(state, action.recoveryMs ?? MONSTERS[enemyId].actionIntervalMs)
  appendLog(state, `${action.name} resolves.`)
  return true
}

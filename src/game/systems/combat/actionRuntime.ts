import { MONSTERS } from '../../content/monsters'
import { appendLog } from '../../engine'
import type { GameState } from '../../types'
import type { CombatActor } from './magnitude'
import { getCombatModifiers } from './modifiers'
import { actorCannotAct } from './statusRuntime'
import { runCombatTriggers, type CombatEventContext } from './triggerRuntime'
import type { ActionPattern, ActionStep, CombatActionDefinition, CombatEffect, CombatEventSink, CombatSource, CombatTag, CombatTrigger } from './combatTypes'

export const MIN_ACTION_TIME_MS = 100
export type ActionEffectExecutor = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink) => void
export type ActionLifecycleEvent = Extract<CombatTrigger, 'on-action-start' | 'on-action-resolve'>

const opponentOf = (actor: CombatActor): CombatActor => actor === 'player' ? 'enemy' : 'player'
const resolvingStates = new WeakSet<GameState>()
const actionTags = (action: CombatActionDefinition): CombatTag[] => [...new Set<CombatTag>(['special', ...(action.tags ?? [])])]
const actionSource = (action: CombatActionDefinition): CombatSource => ({ actor: 'enemy', kind: 'action', sourceId: action.id, tags: actionTags(action) })

const patternFor = (state: GameState, patternId?: string) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return undefined
  const monster = MONSTERS[enemyId]
  const id = patternId ?? state.combat.enemyActionPatternId ?? monster.defaultActionPatternId
  return monster.actionPatterns[id] ?? (patternId ? undefined : monster.actionPatterns[monster.defaultActionPatternId])
}

const normalizeIndex = (value: number, length: number) => {
  const raw = Number.isFinite(value) ? Math.floor(value) : 0
  return Math.max(0, raw) % Math.max(1, length)
}

export const getEnemyActionPattern = (state: GameState, patternId?: string) => patternFor(state, patternId)

export const getEnemyAction = (state: GameState, actionId: string | null | undefined) => {
  const enemyId = state.combat.enemyId
  return enemyId && actionId ? MONSTERS[enemyId].actions[actionId] : undefined
}

export const getCurrentEnemyAction = (state: GameState) => getEnemyAction(state, state.combat.enemyCurrentActionId)

export const getNextEnemyActionStep = (state: GameState) => {
  const pattern = patternFor(state)
  if (!pattern || pattern.steps.length === 0) return undefined
  return pattern.steps[normalizeIndex(state.combat.enemyNextActionIndex, pattern.steps.length)]
}

export const getCurrentEnemyActionStep = (state: GameState) => {
  const stepId = state.combat.enemyCurrentStepId
  const pattern = patternFor(state, state.combat.enemyCurrentActionPatternId ?? undefined)
  if (!stepId || !pattern) return undefined
  return pattern.steps.find((step) => step.id === stepId)
}

export const resolveEnemyBasicAttackTimeMs = (state: GameState, baseTimeMs: number) => {
  const speed = getCombatModifiers(state, 'enemy', 'basic-attack-speed-percent', { sourceTags: ['basic-attack'] })
  return Math.max(MIN_ACTION_TIME_MS, Math.round(Math.max(0, baseTimeMs) * Math.max(0.1, 1 - speed)))
}

export const resolveEnemySkillActionTimeMs = (state: GameState, baseTimeMs: number) => {
  const speed = getCombatModifiers(state, 'enemy', 'action-speed-percent', { sourceTags: ['special'] })
  return Math.max(MIN_ACTION_TIME_MS, Math.round(Math.max(0, baseTimeMs) * Math.max(0.1, 1 - speed)))
}

/** Clears only the committed action. Selected Pattern and next cursor survive. */
export const clearCurrentEnemyAction = (state: GameState) => {
  state.combat.enemyCurrentStepId = null
  state.combat.enemyCurrentActionId = null
  state.combat.enemyCurrentActionPatternId = null
  state.combat.enemyActionTimerMs = 0
  state.combat.enemyActionDurationMs = 0
}

/** Clears runtime state for administrative cleanup. It never emits gameplay events. */
export const resetEnemyActionRuntime = (state: GameState) => {
  state.combat.enemyActionPatternId = null
  state.combat.enemyNextActionIndex = 0
  clearCurrentEnemyAction(state)
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
  state.combat.enemyNextActionIndex = 0
  clearCurrentEnemyAction(state)
}

export const setEnemyActionPattern = (state: GameState, patternId: string, uiEvents?: CombatEventSink) => {
  const pattern = patternFor(state, patternId)
  if (!pattern || pattern.steps.length === 0 || !state.combat.enemyId) return false
  state.combat.enemyActionPatternId = pattern.id
  state.combat.enemyNextActionIndex = 0
  uiEvents?.push({ source: { kind: 'enemy', monsterId: state.combat.enemyId }, sourceKind: 'system', dungeonId: state.combat.dungeonId ?? undefined, category: 'pattern', sourceId: pattern.id })
  return true
}

const actionContext = (action: CombatActionDefinition, patternId: string | undefined, stepId: string | undefined): CombatEventContext => {
  const source = actionSource(action)
  return { source, sourceTags: source.tags, actionId: action.id, actionStepId: stepId, actionPatternId: patternId, eventActionTags: source.tags }
}

/** Action lifecycle observers are intentionally routed source actor first, opponent second. */
export const runActionEventObservers = (state: GameState, event: ActionLifecycleEvent, context: CombatEventContext, executeEffects: ActionEffectExecutor, depth = 0, uiEvents?: CombatEventSink) => {
  const sourceActor = context.source?.actor
  if (!sourceActor) return
  runCombatTriggers(state, sourceActor, event, context, executeEffects, depth, [], uiEvents)
  runCombatTriggers(state, opponentOf(sourceActor), event, context, executeEffects, depth, [], uiEvents)
}

const commitAction = (state: GameState, stepId: string | null, actionId: string | null, patternId: string, durationMs: number) => {
  state.combat.enemyCurrentStepId = stepId
  state.combat.enemyCurrentActionId = actionId
  state.combat.enemyCurrentActionPatternId = patternId
  state.combat.enemyActionDurationMs = Math.max(MIN_ACTION_TIME_MS, durationMs)
  state.combat.enemyActionTimerMs = state.combat.enemyActionDurationMs
}

const startActionDefinition = (state: GameState, action: CombatActionDefinition, stepId: string | null, patternId: string, executeEffects: ActionEffectExecutor, depth = 0, uiEvents?: CombatEventSink) => {
  if (!state.combat.enemyId || state.combat.enemyCurrentStepId) return false
  commitAction(state, stepId, action.id, patternId, resolveEnemySkillActionTimeMs(state, action.actionTimeMs))
  const context = actionContext(action, patternId, stepId ?? undefined)
  uiEvents?.push({ source: { kind: 'enemy', monsterId: state.combat.enemyId }, sourceKind: 'action', dungeonId: state.combat.dungeonId ?? undefined, target: 'player', category: 'system', sourceId: action.id, actionId: action.id, actionPhase: 'start', durationMs: state.combat.enemyActionDurationMs })
  runActionEventObservers(state, 'on-action-start', context, executeEffects, depth, uiEvents)
  if (state.combat.enemyHp <= 0 || state.player.health <= 0) clearCurrentEnemyAction(state)
  return true
}

export const startEnemyAction = (state: GameState, actionId: string, executeEffects: ActionEffectExecutor, stepId?: string, depth = 0, uiEvents?: CombatEventSink) => {
  const enemyId = state.combat.enemyId
  const action = getEnemyAction(state, actionId)
  if (!enemyId || !action || state.combat.enemyHp <= 0 || state.player.health <= 0 || state.combat.enemyCurrentStepId || actorCannotAct(state, 'enemy')) return false
  const selectedPattern = patternFor(state)
  const selectedStep = selectedPattern?.steps.find((step) => step.type === 'action' && step.actionId === actionId && (!stepId || step.id === stepId))
    ?? selectedPattern?.steps.find((step) => step.type === 'action' && step.actionId === actionId)
  const authoredPattern = selectedStep
    ? selectedPattern
    : Object.values(MONSTERS[enemyId].actionPatterns).find((candidate) => candidate.steps.some((step) => step.type === 'action' && step.actionId === actionId))
  if (!authoredPattern) return false
  const authoredStep = selectedStep?.id ?? authoredPattern.steps.find((step) => step.type === 'action' && step.actionId === actionId)?.id ?? null
  if (selectedStep && selectedPattern) {
    // Manual testing of an action that belongs to the selected Pattern joins
    // the normal sequence at the step immediately after that action.
    const selectedIndex = selectedPattern.steps.findIndex((step) => step.id === selectedStep.id)
    state.combat.enemyNextActionIndex = (selectedIndex + 1) % selectedPattern.steps.length
  }
  // An action outside the selected Pattern is intentionally standalone; leave
  // the selected Pattern cursor untouched for isolated developer testing.
  return startActionDefinition(state, action, authoredStep, authoredPattern.id, executeEffects, depth, uiEvents)
}

export const startNextEnemyAction = (state: GameState, executeEffects: ActionEffectExecutor, depth = 0, uiEvents?: CombatEventSink) => {
  const enemyId = state.combat.enemyId
  if (!enemyId || state.combat.enemyHp <= 0 || state.player.health <= 0 || state.combat.enemyCurrentStepId || actorCannotAct(state, 'enemy')) return false
  const monster = MONSTERS[enemyId]
  const pattern = patternFor(state)
  if (!pattern || pattern.steps.length === 0) return false
  state.combat.enemyActionPatternId = pattern.id
  const index = normalizeIndex(state.combat.enemyNextActionIndex, pattern.steps.length)
  const step: ActionStep = pattern.steps[index]
  state.combat.enemyNextActionIndex = (index + 1) % pattern.steps.length

  if (step.type === 'basic') {
    commitAction(state, step.id, null, pattern.id, resolveEnemyBasicAttackTimeMs(state, monster.basicAttackTimeMs))
    return true
  }

  const action = monster.actions[step.actionId]
  if (!action) return false
  return startActionDefinition(state, action, step.id, pattern.id, executeEffects, depth, uiEvents)
}

const resolveBasicAttack = (state: GameState, monsterId: NonNullable<GameState['combat']['enemyId']>, monster: typeof MONSTERS[NonNullable<GameState['combat']['enemyId']>], executeEffects: ActionEffectExecutor, depth: number, uiEvents?: CombatEventSink) => {
  const source: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: `${monsterId}-basic-attack`, tags: ['basic-attack', 'direct'] }
  const before = state.player.health
  executeEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: monster.basicAttackDamage }, tags: ['basic-attack', 'direct'] }], source, depth, uiEvents)
  appendLog(state, `${monster.name} Basic hits for ${Math.max(0, before - state.player.health)}.`)
}

/** Resolves the one currently committed enemy action and immediately starts the next Pattern step. */
export const resolveCurrentEnemyAction = (state: GameState, executeEffects: ActionEffectExecutor, depth = 0, uiEvents?: CombatEventSink) => {
  const enemyId = state.combat.enemyId
  const step = getCurrentEnemyActionStep(state)
  if (!enemyId || !step || actorCannotAct(state, 'enemy') || resolvingStates.has(state)) return false
  resolvingStates.add(state)
  try {
    const actionId = step.type === 'action' ? state.combat.enemyCurrentActionId : null
    const originPatternId = state.combat.enemyCurrentActionPatternId ?? state.combat.enemyActionPatternId ?? undefined
    const action = actionId ? MONSTERS[enemyId].actions[actionId] : undefined
    if (step.type === 'action' && !action) {
      clearCurrentEnemyAction(state)
      return false
    }

    const stepId = state.combat.enemyCurrentStepId
    if (!action) {
      resolveBasicAttack(state, enemyId, MONSTERS[enemyId], executeEffects, depth + 1, uiEvents)
    } else {
      const context = actionContext(action, originPatternId, stepId ?? undefined)
      if (action.effects.length === 0) uiEvents?.push({ source: { kind: 'enemy', monsterId: enemyId }, sourceKind: 'action', dungeonId: state.combat.dungeonId ?? undefined, target: 'player', category: 'enemy-action', sourceId: action.id, actionId: action.id, actionPhase: 'resolve' })
      executeEffects(state, action.effects, context.source as CombatSource, depth + 1, uiEvents)
      runActionEventObservers(state, 'on-action-resolve', context, executeEffects, depth + 1, uiEvents)
      appendLog(state, `${action.name} resolves.`)
    }

    clearCurrentEnemyAction(state)

    if (state.combat.enemyId && state.combat.enemyHp > 0 && state.player.health > 0) startNextEnemyAction(state, executeEffects, depth, uiEvents)
    return true
  } finally {
    resolvingStates.delete(state)
  }
}

/** Direct developer resolution through the same committed-action resolver. */
export const forceResolveEnemyAction = (state: GameState, actionId: string, executeEffects: ActionEffectExecutor, depth = 0, uiEvents?: CombatEventSink) => {
  if (state.combat.enemyCurrentStepId) return state.combat.enemyCurrentActionId === actionId ? resolveCurrentEnemyAction(state, executeEffects, depth, uiEvents) : false
  if (!startEnemyAction(state, actionId, executeEffects, undefined, depth, uiEvents)) return false
  return resolveCurrentEnemyAction(state, executeEffects, depth, uiEvents)
}

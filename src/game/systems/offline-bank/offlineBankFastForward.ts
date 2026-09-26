import { BALANCE } from '../../core/balance/balance'
import { advanceChannelingState, advanceGameStateContinuous, advanceGameStateStep, advanceCombatStateWithRemaining, getNextCombatBoundaryMs, type AdvanceContext } from '../simulation/advanceGameState'
import { playerManaRegenPerSecond as manaRegenPerSecond } from '../mana/playerMana'
import { getActiveArtificingJob } from '../artificing/artificingSelectors'
import { buildResearchWorkRequests, ensureResearchActivity } from '../research/researchEngine'
import { TRANSMUTATION_RECIPES, TRANSMUTATION_RECIPE_ORDER } from '../../content/recipes/recipes'
import { isRecipeUnlocked } from '../transmutation/transmutationSelectors'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { getEffectiveTransmutationWorkMultiplier } from '../transmutation/transmutationArrays'
import { buildTransmutationWorkRequests } from '../transmutation/transmutationEngine'
import type { TowerFluxWorkRequest } from '../simulation/towerFluxScheduler'
import { prepareAutoCastRuntime, type PreparedAutoCastRuntime } from '../spells'
import type { CombatEventSink } from '../combat/combatTypes'
import type { GameState, ItemId } from '../../types'
import { RESOURCE_EPSILON } from '../../presentation/resources/resourcePresentation'

export const OFFLINE_FAST_FORWARD_EPSILON_MS = 0.001
export const OFFLINE_FAST_FORWARD_ITERATION_LIMIT = 100_000
const OFFLINE_CPU_SLICE_BUDGET_MS = 30

export interface OfflineFastForwardMetrics {
  eventBoundaries: number
  largestJumpMs: number
  totalJumpMs: number
  combatSelections: number
  statusTicks: number
  researchCompletions: number
  transmutationCompletions: number
  artificingCompletions: number
  yields: number
  longestCpuSliceMs: number
  combatBoundaryCalls: number
  researchPlannerCalls: number
  transmutationPlannerCalls: number
  continuousManaAllocationCalls: number
  autoCastChecks: number
  timing: {
    boundaryMs: number
    combatMs: number
    continuousManaMs: number
    autoCastMs: number
    analyticsMs: number
    yieldMs: number
  }
}

export interface OfflineFastForwardOptions {
  onProgress?: (simulatedMs: number) => void
  onCombatEvent?: (event: Parameters<NonNullable<CombatEventSink['push']>>[0]) => void
}

const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now()
const yieldToBrowser = () => new Promise<void>((resolve) => {
  const schedulerApi = (globalThis as typeof globalThis & { scheduler?: { yield?: () => Promise<void> } }).scheduler
  if (schedulerApi?.yield) { void schedulerApi.yield().then(resolve); return }
  if (typeof MessageChannel !== 'undefined') {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolve() }
    channel.port2.postMessage(undefined)
    return
  }
  if (typeof window !== 'undefined') window.setTimeout(resolve, 0)
  else setTimeout(resolve, 0)
})
const minBoundary = (values: readonly (number | null | undefined)[]) => {
  let next: number | null = null
  values.forEach((value) => {
    if (value === null || value === undefined || !Number.isFinite(value) || value < 0) return
    next = next === null ? value : Math.min(next, value)
  })
  return next
}
const positiveRateBoundary = (remaining: number, ratePerSecond: number) => ratePerSecond > 0 && Number.isFinite(ratePerSecond) ? Math.max(0, remaining / ratePerSecond * 1000) : null

const getNextManaBoundaryMs = (state: GameState, production = manaRegenPerSecond(state)) => {
  if (state.debug.allowManaOverCap) return null
  const net = production
  const epsilonManaMovement = Math.max(RESOURCE_EPSILON, OFFLINE_FAST_FORWARD_EPSILON_MS * Math.abs(net) / 1000)
  if (net < 0 && state.player.mana > epsilonManaMovement) return state.player.mana / -net * 1000
  if (net > 0 && state.player.mana < state.player.maxMana) {
    const remainingMana = state.player.maxMana - state.player.mana
    if (remainingMana > epsilonManaMovement) return remainingMana / net * 1000
  }
  return null
}

const getNextResearchBoundaryMs = (state: GameState) => {
  const research = ensureResearchActivity(state)
  let next: number | null = null
  Object.values(research.slots).forEach((job) => {
    if (!job || job.remainingQuantity <= 0 || !job.acolyteAssigned) return
    const remaining = Math.max(0, BALANCE.research.durationPerItemMs - Math.max(0, job.progressMs))
    next = minBoundary([next, positiveRateBoundary(remaining, 1)])
  })
  return next
}

const getNextTransmutationBoundaryMs = (state: GameState) => {
  let next: number | null = null
  TRANSMUTATION_RECIPE_ORDER.forEach((recipeId) => {
    const recipe = TRANSMUTATION_RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    if (!job || !job.acolyteAssigned || !isRecipeUnlocked(state, recipe)) return
    const hasMaterials = recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity)
    if (!hasMaterials) return
    const remaining = Math.max(0, recipe.baseDurationMs - Math.max(0, job.progressMs))
    const rate = getEffectiveTransmutationWorkMultiplier(state, 1)
    next = minBoundary([next, positiveRateBoundary(remaining, rate)])
  })
  return next
}

const getNextArtificingBoundaryMs = (state: GameState) => {
  if (!getActiveArtificingJob(state)) return null
  return Math.max(0, 5_000 - Math.max(0, state.activities.artificing.progressMs))
}

const getNextChannelingBoundaryMs = (state: GameState) => {
  const channeling = state.progress.channeling
  const boundaries: (number | null)[] = []
  const acolytes = Math.max(0, Math.floor(state.activities.channeling.acolytesAssigned ?? 0))
  const fluxRate = acolytes > 0 ? BALANCE.channeling.baseFluxPerAcolytePerSecond * acolytes : 0
  const fluxCanAccrue = state.tower.resources.arcaneFlux < BALANCE.channeling.baseArcaneFluxCapacity
  if (!channeling.discoveries['stable-leyline'] && fluxRate > 0 && fluxCanAccrue) boundaries.push((BALANCE.channeling.stableLeylineThreshold - (channeling.totalFluxGenerated ?? 0)) / fluxRate * 1000)
  if (!channeling.discoveries['echo-resonance'] && acolytes >= BALANCE.channeling.harmonicWorkforceAcolytes) boundaries.push(BALANCE.channeling.echoResonanceDurationMs - channeling.fiveEchoSustainMs)
  if (state.tower.resources.arcaneFlux >= BALANCE.channeling.deepReservoirThreshold && !channeling.discoveries['deep-reservoir']) boundaries.push(0)
  return minBoundary(boundaries)
}

/**
 * Finds the next meaningful Offline boundary. The ordinary live runner keeps
 * its 100ms safety quantum; this helper is only consumed by the detached bank
 * runner and therefore may return long production/combat intervals.
 */
export const getNextOfflineSimulationBoundaryMs = (state: GameState): number | null => {
  const productionOnly = !state.combat.active
  return minBoundary([
    productionOnly ? null : getNextCombatBoundaryMs(state),
    getNextManaBoundaryMs(state),
    getNextResearchBoundaryMs(state),
    getNextTransmutationBoundaryMs(state),
    getNextArtificingBoundaryMs(state),
    getNextChannelingBoundaryMs(state),
  ])
}

const stateBoundarySignature = (state: GameState) => [
  state.combat.enemyId,
  state.combat.enemyCurrentStepId,
  state.combat.enemyActionTimerMs,
  state.combat.encounterTimerMs,
  state.combat.pendingPlayerSpellCast?.remainingWorkMs,
  state.combat.playerStatuses.length,
  state.combat.enemyStatuses.length,
  state.player.mana,
  state.tower.resources.arcaneFlux,
  state.player.health,
  state.activities.artificing.progressMs,
].join('|')

const wrapEvents = (sink: CombatEventSink | undefined, onEvent: OfflineFastForwardOptions['onCombatEvent']): CombatEventSink | undefined => sink ? {
  push: (event) => {
    onEvent?.(event)
    sink.push(event)
  },
} : undefined

const createMetrics = (): OfflineFastForwardMetrics => ({
  eventBoundaries: 0,
  largestJumpMs: 0,
  totalJumpMs: 0,
  combatSelections: 0,
  statusTicks: 0,
  researchCompletions: 0,
  transmutationCompletions: 0,
  artificingCompletions: 0,
  yields: 0,
  longestCpuSliceMs: 0,
  combatBoundaryCalls: 0,
  researchPlannerCalls: 0,
  transmutationPlannerCalls: 0,
  continuousManaAllocationCalls: 0,
  autoCastChecks: 0,
  timing: { boundaryMs: 0, combatMs: 0, continuousManaMs: 0, autoCastMs: 0, analyticsMs: 0, yieldMs: 0 },
})

interface PreparedWorkTemplate {
  request: TowerFluxWorkRequest
  progressPerMs: number
  fluxPerMs: number
  prepared: TowerFluxWorkRequest
}

interface OfflineContinuousEpoch {
  manaRate: number
  fluxDemandPerSecond: number
  research: PreparedWorkTemplate[]
  transmutation: PreparedWorkTemplate[]
  preparedResearch: TowerFluxWorkRequest[]
  preparedTransmutation: TowerFluxWorkRequest[]
  preparedRequests: TowerFluxWorkRequest[]
  autoCastRuntime: PreparedAutoCastRuntime
}

interface OfflineEventSchedule {
  combatAt: number | null
  researchAt: number | null
  transmutationAt: number | null
  artificingAt: number | null
  channelingAt: number | null
  manaAt: number | null
}

const createEpoch = (state: GameState, context: AdvanceContext, metrics: OfflineFastForwardMetrics): OfflineContinuousEpoch => {
  const researchRequests = buildResearchWorkRequests(state, 1, context)
  const transmutationRequests = buildTransmutationWorkRequests(state, 1)
  metrics.researchPlannerCalls += 1
  metrics.transmutationPlannerCalls += 1
  const toTemplate = (request: TowerFluxWorkRequest): PreparedWorkTemplate => ({
    request,
    progressPerMs: request.requestedProgressMs,
    fluxPerMs: request.requestedFlux,
    prepared: { ...request, requestedProgressMs: 0, requestedFlux: 0 },
  })
  const research = researchRequests.map(toTemplate)
  const transmutation = transmutationRequests.map(toTemplate)
  const fluxDemandPerSecond = [...researchRequests, ...transmutationRequests].reduce((total, request) => total + request.requestedFlux * 1000, 0)
  const preparedResearch = research.map((template) => template.prepared)
  const preparedTransmutation = transmutation.map((template) => template.prepared)
  return { manaRate: manaRegenPerSecond(state), fluxDemandPerSecond, research, transmutation, preparedResearch, preparedTransmutation, preparedRequests: [...preparedResearch, ...preparedTransmutation], autoCastRuntime: prepareAutoCastRuntime(state) }
}

const scalePreparedWork = (templates: readonly PreparedWorkTemplate[], deltaMs: number) => templates.forEach(({ prepared, progressPerMs, fluxPerMs }) => {
  prepared.requestedProgressMs = progressPerMs * deltaMs
  prepared.requestedFlux = fluxPerMs * deltaMs
})

const prepareEpochWork = (epoch: OfflineContinuousEpoch, deltaMs: number) => {
  scalePreparedWork(epoch.research, deltaMs)
  scalePreparedWork(epoch.transmutation, deltaMs)
}

const itemCanChangePassiveWork = (state: GameState, itemId: ItemId) => {
  const researchUsesItem = Object.values(ensureResearchActivity(state).slots).some((job) => Boolean(job?.acolyteAssigned && job.itemId === itemId))
  if (researchUsesItem) return true
  return TRANSMUTATION_RECIPE_ORDER.some((recipeId) => {
    const job = state.activities.transmutation.jobs[recipeId]
    if (!job || !job.acolyteAssigned) return false
    return TRANSMUTATION_RECIPES[recipeId].ingredients.some((ingredient) => ingredient.itemId === itemId)
  })
}

const getPreparedWorkBoundaryMs = (state: GameState, templates: readonly PreparedWorkTemplate[], kind: 'research' | 'transmutation', epoch: OfflineContinuousEpoch) => {
  if (!templates.length || (state.tower.resources.arcaneFlux <= OFFLINE_FAST_FORWARD_EPSILON_MS && epoch.fluxDemandPerSecond <= 0)) return null
  let next: number | null = null
  for (const template of templates) {
    const job = kind === 'research'
      ? state.activities.research.slots[template.request.sourceId as keyof typeof state.activities.research.slots]
      : state.activities.transmutation.jobs[template.request.sourceId as keyof typeof state.activities.transmutation.jobs]
    if (!job || template.progressPerMs <= 0) continue
    const duration = template.request.cycleDurationMs
    const remaining = Math.max(0, duration - Math.max(0, job.progressMs))
    next = minBoundary([next, remaining / template.progressPerMs])
  }
  return next
}

const createEventSchedule = (state: GameState, epoch: OfflineContinuousEpoch, metrics: OfflineFastForwardMetrics): OfflineEventSchedule => {
  const boundaryStartedAt = now()
  metrics.combatBoundaryCalls += 1
  const combatAt = state.combat.active ? getNextCombatBoundaryMs(state, { manaDeltaPerSecond: epoch.manaRate, autoCastRuntime: epoch.autoCastRuntime }) : null
  metrics.timing.boundaryMs += now() - boundaryStartedAt
  return {
    combatAt,
    researchAt: getPreparedWorkBoundaryMs(state, epoch.research, 'research', epoch),
    transmutationAt: getPreparedWorkBoundaryMs(state, epoch.transmutation, 'transmutation', epoch),
    artificingAt: getNextArtificingBoundaryMs(state),
    channelingAt: getNextChannelingBoundaryMs(state),
    manaAt: getNextManaBoundaryMs(state, epoch.manaRate),
  }
}

const scheduleMinimum = (schedule: OfflineEventSchedule) => minBoundary(Object.values(schedule))
const decrementSchedule = (schedule: OfflineEventSchedule, deltaMs: number) => {
  ;(Object.keys(schedule) as Array<keyof OfflineEventSchedule>).forEach((key) => {
    const value = schedule[key]
    if (value !== null) schedule[key] = Math.max(0, value - deltaMs)
  })
}

const runReferenceBanked = async (state: GameState, durationMs: number, context: AdvanceContext, options: OfflineFastForwardOptions) => {
  const metrics = createMetrics()
  const startedAt = now()
  let lastYieldAt = startedAt
  let lastProgressAt = startedAt
  let simulatedMs = 0
  let remaining = Math.max(0, durationMs)
  let zeroBoundaryStalls = 0
  const eventContext: AdvanceContext = {
    ...context,
    uiEvents: wrapEvents(context.uiEvents, (event) => {
      if (event.category === 'status' && event.statusPhase === undefined) metrics.statusTicks += 1
      options.onCombatEvent?.(event)
    }),
    onAutoCastSelection: () => { metrics.combatSelections += 1; context.onAutoCastSelection?.() },
    onResearchComplete: () => { metrics.researchCompletions += 1; context.onResearchComplete?.() },
    onTransmutationComplete: (recipeId) => { metrics.transmutationCompletions += 1; context.onTransmutationComplete?.(recipeId) },
    onArtificingComplete: (completion) => { metrics.artificingCompletions += 1; context.onArtificingComplete?.(completion) },
  }

  while (remaining > OFFLINE_FAST_FORWARD_EPSILON_MS) {
    if (metrics.eventBoundaries >= OFFLINE_FAST_FORWARD_ITERATION_LIMIT) {
      const details = JSON.stringify({ remaining, enemyId: state.combat.enemyId, encounterTimerMs: state.combat.encounterTimerMs, nextBoundaryMs: getNextOfflineSimulationBoundaryMs(state) })
      throw new Error(`Offline fast-forward iteration guard exceeded: ${details}`)
    }
    metrics.eventBoundaries += 1
    const boundary = 100
    let delta = Math.min(remaining, boundary === null ? remaining : Math.max(0, boundary))
    if (delta <= OFFLINE_FAST_FORWARD_EPSILON_MS) {
      const beforeSignature = stateBoundarySignature(state)
      delta = Math.min(remaining, OFFLINE_FAST_FORWARD_EPSILON_MS)
      advanceGameStateStep(state, delta, eventContext)
      remaining = Math.max(0, remaining - delta)
      simulatedMs += delta
      if (beforeSignature === stateBoundarySignature(state) && getNextOfflineSimulationBoundaryMs(state) !== null && (getNextOfflineSimulationBoundaryMs(state) ?? Infinity) <= OFFLINE_FAST_FORWARD_EPSILON_MS) {
        zeroBoundaryStalls += 1
        if (zeroBoundaryStalls >= 3) throw new Error('Offline fast-forward stalled at zero-time boundary.')
      } else zeroBoundaryStalls = 0
    } else {
      advanceGameStateStep(state, delta, eventContext)
      remaining = Math.max(0, remaining - delta)
      simulatedMs += delta
      metrics.largestJumpMs = Math.max(metrics.largestJumpMs, delta)
      metrics.totalJumpMs += delta
      zeroBoundaryStalls = 0
    }
    const timestamp = now()
    if (timestamp - lastProgressAt >= 100) {
      options.onProgress?.(Math.min(durationMs, simulatedMs))
      lastProgressAt = timestamp
    }
    if (timestamp - lastYieldAt >= OFFLINE_CPU_SLICE_BUDGET_MS) {
      const slice = timestamp - lastYieldAt
      metrics.longestCpuSliceMs = Math.max(metrics.longestCpuSliceMs, slice)
      if (slice > 20 && import.meta.env.DEV) console.warn(`[Offline Bank] long fast-forward CPU slice: ${slice.toFixed(1)}ms`)
      await yieldToBrowser()
      metrics.yields += 1
      lastYieldAt = now()
    }
  }
  options.onProgress?.(durationMs)
  return { metrics, realExecutionMs: now() - startedAt }
}

const runOptimizedBanked = async (state: GameState, durationMs: number, context: AdvanceContext, options: OfflineFastForwardOptions) => {
  const metrics = createMetrics()
  const startedAt = now()
  let lastYieldAt = startedAt
  let lastProgressAt = startedAt
  let simulatedMs = 0
  let remaining = Math.max(0, durationMs)
  let zeroBoundaryStalls = 0
  let epochDirty = false
  let epoch = createEpoch(state, context, metrics)
  // The normal UI only offers minute-scale skips. Keep sub-minute calls on the
  // reference timeline so short mixed-work calls retain exact parity while
  // player-facing minute-scale skips use the batched epoch path below.
  const useMixedEpochBatching = durationMs >= 60_000
  const hasInitialPassiveWork = epoch.research.length > 0 || epoch.transmutation.length > 0 || Boolean(getActiveArtificingJob(state))
  if (!useMixedEpochBatching && state.combat.active && hasInitialPassiveWork) {
    return runReferenceBanked(state, durationMs, context, options)
  }

  const eventContext: AdvanceContext = {
    ...context,
    uiEvents: wrapEvents(context.uiEvents, (event) => {
      if (event.category === 'status' && event.statusPhase === undefined) metrics.statusTicks += 1
      options.onCombatEvent?.(event)
    }),
    onAutoCastSelection: () => { metrics.combatSelections += 1; context.onAutoCastSelection?.() },
    onResearchComplete: () => { metrics.researchCompletions += 1; epochDirty = true; context.onResearchComplete?.() },
    onTransmutationComplete: (recipeId) => { metrics.transmutationCompletions += 1; epochDirty = true; context.onTransmutationComplete?.(recipeId) },
    onArtificingComplete: (completion) => { metrics.artificingCompletions += 1; context.onArtificingComplete?.(completion) },
    onItemAcquired: (itemId, quantity) => {
      if (itemCanChangePassiveWork(state, itemId)) epochDirty = true
      context.onItemAcquired?.(itemId, quantity)
    },
    autoCastRuntime: epoch.autoCastRuntime,
    manaDeltaPerSecond: epoch.manaRate,
    onAutoCastCheck: (elapsedMs) => { metrics.autoCastChecks += 1; metrics.timing.autoCastMs += elapsedMs; context.onAutoCastCheck?.(elapsedMs) },
    onContinuousManaAllocation: () => { metrics.continuousManaAllocationCalls += 1; context.onContinuousManaAllocation?.() },
    onAnalyticsAdvance: (elapsedMs) => { metrics.timing.analyticsMs += elapsedMs; context.onAnalyticsAdvance?.(elapsedMs) },
  }
  const advanceContinuousElapsed = (elapsedMs: number) => {
    if (elapsedMs <= 0) return
    const hasPassiveWork = epoch.research.length > 0 || epoch.transmutation.length > 0 || Boolean(getActiveArtificingJob(state))
    if (!hasPassiveWork) {
      advanceChannelingState(state, elapsedMs, eventContext, manaRegenPerSecond(state))
      return
    }
    prepareEpochWork(epoch, elapsedMs)
    advanceGameStateContinuous(state, elapsedMs, eventContext, {
      preparedWorkRequests: epoch.preparedRequests,
      preparedResearchRequests: epoch.preparedResearch,
      preparedTransmutationRequests: epoch.preparedTransmutation,
      manaRegenPerSecondOverride: manaRegenPerSecond(state),
    })
  }
  eventContext.onCombatElapsed = (elapsedMs) => {
    const hasPassiveWork = epoch.research.length > 0 || epoch.transmutation.length > 0 || Boolean(getActiveArtificingJob(state))
    if (!hasPassiveWork) {
      advanceChannelingState(state, elapsedMs, eventContext, manaRegenPerSecond(state))
    } else if (useMixedEpochBatching) {
      advanceContinuousElapsed(elapsedMs)
    }
  }
  let schedule = createEventSchedule(state, epoch, metrics)

  const refreshCombatSchedule = () => {
    const started = now()
    metrics.combatBoundaryCalls += 1
      schedule.combatAt = state.combat.active
      ? getNextCombatBoundaryMs(state, { manaDeltaPerSecond: epoch.manaRate, autoCastRuntime: epoch.autoCastRuntime })
      : null
    metrics.timing.boundaryMs += now() - started
  }
  const refreshPassiveSchedules = () => {
    schedule.researchAt = getPreparedWorkBoundaryMs(state, epoch.research, 'research', epoch)
    schedule.transmutationAt = getPreparedWorkBoundaryMs(state, epoch.transmutation, 'transmutation', epoch)
    schedule.artificingAt = getNextArtificingBoundaryMs(state)
    schedule.channelingAt = getNextChannelingBoundaryMs(state)
    schedule.manaAt = getNextManaBoundaryMs(state, epoch.manaRate)
  }

  while (remaining > OFFLINE_FAST_FORWARD_EPSILON_MS) {
    if (metrics.eventBoundaries >= OFFLINE_FAST_FORWARD_ITERATION_LIMIT) {
      const details = JSON.stringify({ remaining, enemyId: state.combat.enemyId, encounterTimerMs: state.combat.encounterTimerMs, nextBoundaryMs: scheduleMinimum(schedule) })
      throw new Error(`Offline fast-forward iteration guard exceeded: ${details}`)
    }
    metrics.eventBoundaries += 1
    const hasPassiveWork = epoch.research.length > 0 || epoch.transmutation.length > 0 || Boolean(getActiveArtificingJob(state))
    const passiveBoundary = minBoundary([schedule.researchAt, schedule.transmutationAt, schedule.artificingAt, schedule.channelingAt, schedule.manaAt])
    const mixedEpochBatch = state.combat.active && hasPassiveWork && useMixedEpochBatching
    const combatBatch = state.combat.active && (!hasPassiveWork || mixedEpochBatch)
    const boundary = combatBatch ? passiveBoundary : scheduleMinimum(schedule)
    const quietFrozenBatch = combatBatch && (state.debug.freezePlayerActions || state.debug.freezeEnemyActions)
    const delta = Math.min(remaining, combatBatch ? quietFrozenBatch ? remaining : Math.min(1_000, boundary ?? remaining) : boundary === null ? remaining : Math.max(OFFLINE_FAST_FORWARD_EPSILON_MS, boundary))
    const due = {
      combat: schedule.combatAt !== null && schedule.combatAt <= delta + OFFLINE_FAST_FORWARD_EPSILON_MS,
      research: schedule.researchAt !== null && schedule.researchAt <= delta + OFFLINE_FAST_FORWARD_EPSILON_MS,
      transmutation: schedule.transmutationAt !== null && schedule.transmutationAt <= delta + OFFLINE_FAST_FORWARD_EPSILON_MS,
      artificing: schedule.artificingAt !== null && schedule.artificingAt <= delta + OFFLINE_FAST_FORWARD_EPSILON_MS,
      channeling: schedule.channelingAt !== null && schedule.channelingAt <= delta + OFFLINE_FAST_FORWARD_EPSILON_MS,
      mana: schedule.manaAt !== null && schedule.manaAt <= delta + OFFLINE_FAST_FORWARD_EPSILON_MS,
    }
    const beforeSignature = stateBoundarySignature(state)
    const combatStarted = now()
    if (combatBatch) {
      const unconsumedCombatMs = advanceCombatStateWithRemaining(state, delta, eventContext)
      if (unconsumedCombatMs > 0) {
        const continuousStarted = now()
        advanceContinuousElapsed(unconsumedCombatMs)
        metrics.timing.continuousManaMs += now() - continuousStarted
      }
    } else if (state.combat.active) {
      const continuousStarted = now()
      prepareEpochWork(epoch, delta)
      advanceGameStateContinuous(state, delta, eventContext, { preparedWorkRequests: epoch.preparedRequests, manaRegenPerSecondOverride: manaRegenPerSecond(state) })
      metrics.timing.continuousManaMs += now() - continuousStarted
      if (state.combat.active) advanceCombatStateWithRemaining(state, delta, eventContext)
    } else {
      const continuousStarted = now()
      prepareEpochWork(epoch, delta)
      advanceGameStateContinuous(state, delta, eventContext, { preparedWorkRequests: epoch.preparedRequests, manaRegenPerSecondOverride: manaRegenPerSecond(state) })
      metrics.timing.continuousManaMs += now() - continuousStarted
      if (state.combat.active) advanceCombatStateWithRemaining(state, delta, eventContext)
    }
    metrics.timing.combatMs += now() - combatStarted
    decrementSchedule(schedule, delta)
    remaining = Math.max(0, remaining - delta)
    simulatedMs += delta
    metrics.largestJumpMs = Math.max(metrics.largestJumpMs, delta)
    metrics.totalJumpMs += delta

    if (beforeSignature === stateBoundarySignature(state) && boundary !== null && boundary <= OFFLINE_FAST_FORWARD_EPSILON_MS) {
      zeroBoundaryStalls += 1
      if (zeroBoundaryStalls >= 3) throw new Error(`Offline fast-forward stalled at zero-time boundary: ${JSON.stringify({ schedule, combat: { active: state.combat.active, enemyId: state.combat.enemyId, targetEnemyId: state.combat.targetEnemyId, activeLoadout: Boolean(state.combat.activeSpellLoadout), enemyCurrentStepId: state.combat.enemyCurrentStepId, enemyActionTimerMs: state.combat.enemyActionTimerMs, encounterTimerMs: state.combat.encounterTimerMs, pendingCast: state.combat.pendingPlayerSpellCast?.remainingWorkMs }, mana: state.player.mana })}`)
    } else zeroBoundaryStalls = 0

    const epochRateChanged = Math.abs(manaRegenPerSecond(state) - epoch.manaRate) > 1e-9
    if (epochDirty || epochRateChanged) {
      epoch = createEpoch(state, eventContext, metrics)
      epochDirty = false
      eventContext.autoCastRuntime = epoch.autoCastRuntime
      eventContext.manaDeltaPerSecond = epoch.manaRate
      schedule = createEventSchedule(state, epoch, metrics)
    } else {
      if (due.research || due.transmutation || due.artificing || due.channeling || due.mana) refreshPassiveSchedules()
      if (due.combat || due.mana) refreshCombatSchedule()
    }

    const timestamp = now()
    if (timestamp - lastProgressAt >= 100) {
      options.onProgress?.(Math.min(durationMs, simulatedMs))
      lastProgressAt = timestamp
    }
    if (timestamp - lastYieldAt >= OFFLINE_CPU_SLICE_BUDGET_MS) {
      const slice = timestamp - lastYieldAt
      metrics.longestCpuSliceMs = Math.max(metrics.longestCpuSliceMs, slice)
      const yieldStarted = now()
      if (slice > 50 && import.meta.env.DEV) console.warn(`[Offline Bank] long fast-forward CPU slice: ${slice.toFixed(1)}ms`)
      await yieldToBrowser()
      metrics.timing.yieldMs += now() - yieldStarted
      metrics.yields += 1
      lastYieldAt = now()
    }
  }
  options.onProgress?.(durationMs)
  return { metrics, realExecutionMs: now() - startedAt }
}

const runBanked = (state: GameState, durationMs: number, context: AdvanceContext, options: OfflineFastForwardOptions, reference: boolean) =>
  reference ? runReferenceBanked(state, durationMs, context, options) : runOptimizedBanked(state, durationMs, context, options)

export const advanceGameStateBanked = (state: GameState, durationMs: number, context: AdvanceContext, options: OfflineFastForwardOptions = {}) => runBanked(state, durationMs, context, options, false)

/** DEV-only deterministic reference runner retained for parity comparisons. */
export const advanceGameStateBankedReference = (state: GameState, durationMs: number, context: AdvanceContext, options: OfflineFastForwardOptions = {}) => runBanked(state, durationMs, context, options, true)

export const shouldUseOfflineBankReferenceEngine = () => Boolean(import.meta.env.DEV && (globalThis as typeof globalThis & { __SSS_WIZARD_OFFLINE_BANK_ENGINE?: 'fast' | 'reference' }).__SSS_WIZARD_OFFLINE_BANK_ENGINE === 'reference')

import { BALANCE } from '../../core/balance/balance'
import { advanceGameStateStep, getNextCombatBoundaryMs, type AdvanceContext } from '../simulation/advanceGameState'
import { manaRegenPerSecond } from '../../engine/channelingEngine'
import { getActiveArtificingJob } from '../artificing/artificingSelectors'
import { ensureResearchActivity } from '../research/researchEngine'
import { TRANSMUTATION_RECIPES, TRANSMUTATION_RECIPE_ORDER } from '../../content/recipes/recipes'
import { isRecipeUnlocked } from '../transmutation/transmutationSelectors'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { getEffectiveTransmutationWorkMultiplier } from '../transmutation/transmutationArrays'
import { getContinuousManaDemandPerSecond } from '../simulation/continuousManaScheduler'
import type { CombatEventSink } from '../combat/combatTypes'
import type { GameState } from '../../types'

export const OFFLINE_FAST_FORWARD_EPSILON_MS = 0.001
export const OFFLINE_FAST_FORWARD_ITERATION_LIMIT = 100_000
const OFFLINE_CPU_SLICE_BUDGET_MS = 10

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
}

export interface OfflineFastForwardOptions {
  onProgress?: (simulatedMs: number) => void
  onCombatEvent?: (event: Parameters<NonNullable<CombatEventSink['push']>>[0]) => void
}

const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now()
const yieldToBrowser = () => new Promise<void>((resolve) => {
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

const getNextManaBoundaryMs = (state: GameState) => {
  if (state.debug.allowManaOverCap) return null
  const production = manaRegenPerSecond(state)
  const demand = getContinuousManaDemandPerSecond(state)
  const net = production - demand
  if (net < 0 && state.player.mana > 0) return state.player.mana / -net * 1000
  if (net > 0 && state.player.mana < state.player.maxMana) return (state.player.maxMana - state.player.mana) / net * 1000
  return null
}

const getNextResearchBoundaryMs = (state: GameState) => {
  const research = ensureResearchActivity(state)
  let next: number | null = null
  Object.values(research.slots).forEach((job) => {
    if (!job || job.remainingQuantity <= 0 || job.echoesAssigned <= 0) return
    const remaining = Math.max(0, BALANCE.research.durationPerItemMs - Math.max(0, job.progressMs))
    next = minBoundary([next, positiveRateBoundary(remaining, job.echoesAssigned)])
  })
  return next
}

const getNextTransmutationBoundaryMs = (state: GameState) => {
  let next: number | null = null
  TRANSMUTATION_RECIPE_ORDER.forEach((recipeId) => {
    const recipe = TRANSMUTATION_RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    if (!job || job.echoesAssigned <= 0 || !isRecipeUnlocked(state, recipe)) return
    const hasMaterials = recipe.ingredients.every((ingredient) => getConsumableQuantity(state, ingredient.itemId) >= ingredient.quantity)
    if (!hasMaterials) return
    const remaining = Math.max(0, recipe.baseDurationMs - Math.max(0, job.progressMs))
    const rate = getEffectiveTransmutationWorkMultiplier(state, job.echoesAssigned)
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
  const manaRate = manaRegenPerSecond(state)
  const boundaries: (number | null)[] = []
  const manaCanAccrue = state.debug.allowManaOverCap || state.player.mana < state.player.maxMana
  if (!channeling.discoveries['stable-leyline'] && manaRate > 0 && manaCanAccrue) boundaries.push((BALANCE.channeling.stableLeylineThreshold - channeling.totalManaGenerated) / manaRate * 1000)
  if (!channeling.discoveries['echo-resonance'] && state.activities.channeling.echoesAssigned === BALANCE.channeling.maxEchoes) boundaries.push(BALANCE.channeling.echoResonanceDurationMs - channeling.fiveEchoSustainMs)
  if (state.player.maxMana >= BALANCE.channeling.deepReservoirThreshold && !channeling.discoveries['deep-reservoir']) boundaries.push(0)
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
  state.player.health,
  state.activities.artificing.progressMs,
].join('|')

const wrapEvents = (sink: CombatEventSink | undefined, onEvent: OfflineFastForwardOptions['onCombatEvent']): CombatEventSink | undefined => sink ? {
  push: (event) => {
    onEvent?.(event)
    sink.push(event)
  },
} : undefined

const createMetrics = (): OfflineFastForwardMetrics => ({ eventBoundaries: 0, largestJumpMs: 0, totalJumpMs: 0, combatSelections: 0, statusTicks: 0, researchCompletions: 0, transmutationCompletions: 0, artificingCompletions: 0, yields: 0, longestCpuSliceMs: 0 })

const runBanked = async (state: GameState, durationMs: number, context: AdvanceContext, options: OfflineFastForwardOptions, reference: boolean) => {
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
    onTransmutationComplete: () => { metrics.transmutationCompletions += 1; context.onTransmutationComplete?.() },
    onArtificingComplete: (completion) => { metrics.artificingCompletions += 1; context.onArtificingComplete?.(completion) },
  }

  while (remaining > OFFLINE_FAST_FORWARD_EPSILON_MS) {
    if (metrics.eventBoundaries >= OFFLINE_FAST_FORWARD_ITERATION_LIMIT) {
      const details = JSON.stringify({ remaining, enemyId: state.combat.enemyId, encounterTimerMs: state.combat.encounterTimerMs, nextBoundaryMs: getNextOfflineSimulationBoundaryMs(state) })
      throw new Error(`Offline fast-forward iteration guard exceeded: ${details}`)
    }
    metrics.eventBoundaries += 1
    const boundary = reference ? 100 : getNextOfflineSimulationBoundaryMs(state)
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

export const advanceGameStateBanked = (state: GameState, durationMs: number, context: AdvanceContext, options: OfflineFastForwardOptions = {}) => runBanked(state, durationMs, context, options, false)

/** DEV-only deterministic reference runner retained for parity comparisons. */
export const advanceGameStateBankedReference = (state: GameState, durationMs: number, context: AdvanceContext, options: OfflineFastForwardOptions = {}) => runBanked(state, durationMs, context, options, true)

export const shouldUseOfflineBankReferenceEngine = () => Boolean(import.meta.env.DEV && (globalThis as typeof globalThis & { __SSS_WIZARD_OFFLINE_BANK_ENGINE?: 'fast' | 'reference' }).__SSS_WIZARD_OFFLINE_BANK_ENGINE === 'reference')

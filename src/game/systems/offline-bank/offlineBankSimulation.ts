import { advanceGameStateBanked, advanceGameStateBankedReference, shouldUseOfflineBankReferenceEngine, type OfflineFastForwardMetrics } from './offlineBankFastForward'
import type { AdvanceContext } from '../simulation/advanceGameState'
import { pushNotification } from '../../engine'
import type { ArtificingRecipeId, GameState, ItemId } from '../../types'
import type { CombatEventSink } from '../combat/combatTypes'
import type { CombatTelemetryObserver } from '../../telemetry/combat/combatTelemetryTypes'
import type { DungeonStatisticsObserver } from '../../telemetry/dungeon/dungeonStatisticsTypes'
import { formatOfflineBank } from '../../utils'
import { createOfflineBankReportCollector, type OfflineBankReport } from './offlineBankReport'
import { createOfflineCombatTrace, type OfflineCombatDefeatResult } from './offlineCombatTrace'
import type { CombatTelemetryScope } from '../../telemetry/combat/combatTelemetryTypes'
import { createCombatEventSink } from '../combat/combatEventSink'

export interface OfflineBankPerformanceMetrics {
  requestedDurationMs: number
  realExecutionMs: number
  simulationQuanta: number
  yields: number
  combatEvents: number
  longestCpuSliceMs: number
  finalSaveMs: number
  eventBoundaries: number
  largestJumpMs: number
  averageJumpMs: number
  combatSelections: number
  statusTicks: number
  researchCompletions: number
  transmutationCompletions: number
  artificingCompletions: number
  combatBoundaryCalls: number
  researchPlannerCalls: number
  transmutationPlannerCalls: number
  continuousManaAllocationCalls: number
  autoCastChecks: number
  timing: { boundaryMs: number; combatMs: number; continuousManaMs: number; autoCastMs: number; analyticsMs: number; yieldMs: number }
}
export interface OfflineBankResult { ok: boolean; error?: string; report?: OfflineBankReport; completedArtificingRecipeIds?: ArtificingRecipeId[]; combatDefeat?: OfflineCombatDefeatResult; performance?: OfflineBankPerformanceMetrics }
type StateSetter = (recipe: (state: GameState) => void) => void
type SilentSave = () => void
type ItemAcquired = (state: GameState, itemId: ItemId, quantity: number) => void
export type OfflineBankProgress = { phase: 'simulating' | 'finalizing' | 'saving'; percent: number }
export interface OfflineBankDetachedObservers {
  telemetry?: CombatTelemetryObserver
  statistics?: DungeonStatisticsObserver
  /** Receives every resolved combat event produced by the detached simulation. */
  combatEvents?: CombatEventSink
  getEncounterTelemetry?: () => CombatTelemetryScope | null
  onCombatCompleted?: (state: GameState, dungeonId: import('../../types').DungeonId) => void
  commit: () => void
}
export interface OfflineBankSimulationObservers {
  uiEvents?: CombatEventSink
  telemetry?: CombatTelemetryObserver
  statistics?: DungeonStatisticsObserver
  getEncounterTelemetry?: () => CombatTelemetryScope | null
  snapshot?: () => unknown
  restore?: (snapshot: unknown) => void
  onCombatCompleted?: (state: GameState, dungeonId: import('../../types').DungeonId) => void
  createDetached?: () => OfflineBankDetachedObservers
}

let active = false
export const isOfflineBankSimulationActive = () => active
const isMajorNotification = (text: string) => /Arcane Discovery|reached Level|unlocked|defeated|Defeated|FIRST CHAPTER|Guild unlocked|mastered|ready/i.test(text)
const yieldToBrowser = () => new Promise<void>((resolve) => {
  if (typeof window !== 'undefined') window.setTimeout(resolve, 0)
  else setTimeout(resolve, 0)
})
const cloneGameState = (state: GameState) => JSON.parse(JSON.stringify(state)) as GameState

export const advanceWithOfflineBank = async (durationMs: number, getState: () => GameState, setState: StateSetter, silentSave: SilentSave, onItemAcquired?: ItemAcquired, observers?: OfflineBankSimulationObservers, onProgress?: (progress: OfflineBankProgress) => void): Promise<OfflineBankResult> => {
  const duration = Math.floor(durationMs)
  if (active) return { ok: false, error: 'Offline Bank is already advancing.' }
  if (!Number.isFinite(duration) || duration <= 0) return { ok: false, error: 'Choose a positive duration.' }
  if (duration > 3_600_000) return { ok: false, error: 'Offline Bank advances are limited to one hour.' }
  const before = getState()
  const available = Math.max(0, before.offlineBankMs)
  if (duration > available) return { ok: false, error: 'Not enough time in the Offline Bank.' }

  active = true
  const snapshot = cloneGameState(before)
  const workingState = cloneGameState(before)
  const analyticsSnapshot = observers?.snapshot?.()
  const detached = observers?.createDetached?.()
  const telemetry = detached?.telemetry ?? observers?.telemetry
  const statistics = detached?.statistics ?? observers?.statistics
  const getEncounterTelemetry = detached?.getEncounterTelemetry ?? observers?.getEncounterTelemetry
  const onCombatCompleted = detached?.onCombatCompleted ?? observers?.onCombatCompleted
  const previousNotifications = before.notifications
  const previousIds = new Set(previousNotifications.map((note) => note.id))
  const collector = createOfflineBankReportCollector(before, duration, available)
  const combatTrace = createOfflineCombatTrace()
  const simulationEvents = createCombatEventSink(combatTrace.sink, detached?.combatEvents, observers?.uiEvents)
  const completedArtificingRecipeIds = new Set<ArtificingRecipeId>()
  const acquiredItems = new Map<ItemId, number>()
  const simulationStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
  let combatEvents = 0
  let finalSaveMs = 0
  let fastForwardMetrics: OfflineFastForwardMetrics = { eventBoundaries: 0, largestJumpMs: 0, totalJumpMs: 0, combatSelections: 0, statusTicks: 0, researchCompletions: 0, transmutationCompletions: 0, artificingCompletions: 0, yields: 0, longestCpuSliceMs: 0, combatBoundaryCalls: 0, researchPlannerCalls: 0, transmutationPlannerCalls: 0, continuousManaAllocationCalls: 0, autoCastChecks: 0, timing: { boundaryMs: 0, combatMs: 0, continuousManaMs: 0, autoCastMs: 0, analyticsMs: 0, yieldMs: 0 } }
  const performanceMetrics = (): OfflineBankPerformanceMetrics => ({ requestedDurationMs: duration, realExecutionMs: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - simulationStartedAt, simulationQuanta: fastForwardMetrics.eventBoundaries, yields: fastForwardMetrics.yields, combatEvents, longestCpuSliceMs: fastForwardMetrics.longestCpuSliceMs, finalSaveMs, eventBoundaries: fastForwardMetrics.eventBoundaries, largestJumpMs: fastForwardMetrics.largestJumpMs, averageJumpMs: fastForwardMetrics.eventBoundaries > 0 ? fastForwardMetrics.totalJumpMs / fastForwardMetrics.eventBoundaries : 0, combatSelections: fastForwardMetrics.combatSelections, statusTicks: fastForwardMetrics.statusTicks, researchCompletions: fastForwardMetrics.researchCompletions, transmutationCompletions: fastForwardMetrics.transmutationCompletions, artificingCompletions: fastForwardMetrics.artificingCompletions, combatBoundaryCalls: fastForwardMetrics.combatBoundaryCalls, researchPlannerCalls: fastForwardMetrics.researchPlannerCalls, transmutationPlannerCalls: fastForwardMetrics.transmutationPlannerCalls, continuousManaAllocationCalls: fastForwardMetrics.continuousManaAllocationCalls, autoCastChecks: fastForwardMetrics.autoCastChecks, timing: fastForwardMetrics.timing })
  try {
    const context: AdvanceContext = { mode: 'banked', report: collector, onItemAcquired: (itemId, quantity) => { acquiredItems.set(itemId, (acquiredItems.get(itemId) ?? 0) + quantity) }, onArtificingComplete: (completion) => completedArtificingRecipeIds.add(completion.recipeId), uiEvents: simulationEvents, onPlayerDefeated: (event) => combatTrace.captureDefeat(event, getEncounterTelemetry?.()), onCombatCompleted, telemetry, statistics }
    const runner = shouldUseOfflineBankReferenceEngine() ? advanceGameStateBankedReference : advanceGameStateBanked
    const fastForwardResult = await runner(workingState, duration, context, {
      onProgress: (simulatedMs) => onProgress?.({ phase: 'simulating', percent: Math.min(99, duration > 0 ? simulatedMs / duration * 100 : 100) }),
      onCombatEvent: () => { combatEvents += 1 },
    })
    fastForwardMetrics = fastForwardResult.metrics
    workingState.offlineBankMs = Math.max(0, workingState.offlineBankMs - duration)
    onProgress?.({ phase: 'finalizing', percent: 100 })
    await yieldToBrowser()
    for (const [itemId, quantity] of acquiredItems) onItemAcquired?.(workingState, itemId, quantity)
    const report = collector.finalize(workingState)
    const majorEvents = workingState.notifications.filter((note) => !previousIds.has(note.id) && isMajorNotification(note.text))
    workingState.notifications = [...previousNotifications, ...majorEvents].slice(-3)
    pushNotification(workingState, `Advanced ${formatOfflineBank(duration)} using Offline Bank.`, 'info')
    setState((state) => {
      Object.assign(state, workingState)
      return state
    })
    detached?.commit()
    onProgress?.({ phase: 'saving', percent: 100 })
    await yieldToBrowser()
    const saveStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    silentSave()
    finalSaveMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - saveStartedAt
    return { ok: true, report, completedArtificingRecipeIds: [...completedArtificingRecipeIds], combatDefeat: combatTrace.getDefeat(), performance: performanceMetrics() }
  } catch (error) {
    try { setState((state) => { Object.assign(state, snapshot); return state }) } catch { /* preserve the original failure result */ }
    try { if (analyticsSnapshot !== undefined) observers?.restore?.(analyticsSnapshot) } catch { /* preserve the original failure result */ }
    return { ok: false, error: error instanceof Error ? error.message : 'Offline Bank simulation failed and was rolled back.' }
  } finally {
    active = false
  }
}

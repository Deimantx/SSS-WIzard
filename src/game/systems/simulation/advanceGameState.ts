import { BALANCE } from '../../core/balance/balance'
import { CHANNELING_DISCOVERIES } from '../../content/channeling/channelingDiscoveries'
import { MONSTERS } from '../../content/monsters'
import { SPELLS } from '../../content/spells/spells'
import { advanceChanneling, manaRegenPerSecond } from '../../engine/channelingEngine'
import { pushNotification, recalculateDerivedStats } from '../../engine'
import { castSpellInternal, getPlayerSpellCastRate, getSpellStartFailure, resolvePlayerSpellCast, spellRequiresEnemyTarget } from '../../engine/spellEngine'
import { executeCombatEffects } from '../combat/effectResolver'
import { resolveCombatDeaths, spawnNextEnemy, type CombatLootObserver } from '../combat/combatRuntime'
import { getCurrentEnemyActionRate, resolveCurrentEnemyAction, startNextEnemyAction } from '../combat/actionRuntime'
import { actorCannotAct, actorCannotCastSpells, expirePendingStatuses, getNextCombatStatusEventMs, getNextPlayerStatusEventMs, tickStatuses } from '../combat/statusRuntime'
import { getNextCombatBarrierEventMs, getNextPlayerBarrierEventMs, tickBarriers } from '../combat/barrierRuntime'
import { getCooldownRecoveryMultiplier, getPlayerCombatStats } from '../combat/combatStats'
import { tickRuleCooldowns } from '../combat/triggerRuntime'
import type { GameState, ItemId, SpellId } from '../../types'
import type { CombatAlertObserver, CombatEventSink } from '../combat/combatTypes'
import { clamp } from '../../utils'
import type { SimulationReportCollector } from '../offline-bank/offlineBankReport'
import { applyTransmutationAllocations, buildTransmutationWorkRequests } from '../transmutation/transmutationEngine'
import { advanceArtificing, type ArtificingCompletion } from '../artificing/artificingEngine'
import { applyResearchAllocations, buildResearchWorkRequests } from '../research/researchEngine'
import { allocateContinuousMana, getContinuousManaDemandPerSecond, type ContinuousManaWorkRequest } from './continuousManaScheduler'
import { getNextAutoCastEligibilityBoundaryMs, getNextAutomatedSpellCooldownMs, isSpellUnlocked, selectNextAutomatedSpellFast, type PreparedAutoCastRuntime } from '../spells'
import { MAX_SIMULATION_DELTA_MS, SIMULATION_QUANTUM_MS } from './simulationConstants'
import type { CombatTelemetryObserver } from '../../telemetry/combat/combatTelemetryTypes'
import type { DungeonStatisticsObserver } from '../../telemetry/dungeon/dungeonStatisticsTypes'
import { sanitizeCombatTimeScale } from '../../../store/actions/debugActions'
import { advanceGuardianUpkeep, ensureGuardianForCurrentEncounter, getGuardianAttackBoundary, resolveGuardianAttack, suppressGuardianIfOutOfMana } from '../summoning/summoningRuntime'
import { advanceArcaneCoreV6RuntimeTime } from '../arcaneCore/arcaneCoreRuntime'
import { recordArcaneCoreV7CooldownCompletion } from '../arcaneCore/arcaneCoreV7Runtime'

export interface AdvanceContext {
  mode: 'live' | 'banked'
  report?: SimulationReportCollector
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
  onArtificingComplete?: (completion: ArtificingCompletion) => void
  onCombatLoot?: CombatLootObserver
  onPlayerDefeated?: (event: import('../combat/combatTypes').CombatEvent, state: GameState) => void
  onCombatCompleted?: (state: GameState, dungeonId: import('../../types').DungeonId) => void
  uiEvents?: CombatEventSink
  telemetry?: CombatTelemetryObserver
  alerts?: CombatAlertObserver
  statistics?: DungeonStatisticsObserver
  onAutoCastSelection?: () => void
  onResearchComplete?: () => void
  onTransmutationComplete?: () => void
  onAutoCastCheck?: (elapsedMs: number) => void
  onContinuousManaAllocation?: () => void
  autoCastRuntime?: PreparedAutoCastRuntime
  onCombatElapsed?: (deltaMs: number) => void
  manaDeltaPerSecond?: number
  onAnalyticsAdvance?: (elapsedMs: number) => void
}

/**
 * Optional prepared continuous-work input used by detached Offline Bank
 * epochs. Live simulation intentionally leaves this unset so it keeps the
 * normal authoritative request planning path.
 */
export interface AdvanceContinuousOptions {
  preparedWorkRequests?: readonly ContinuousManaWorkRequest[]
  preparedResearchRequests?: readonly ContinuousManaWorkRequest[]
  preparedTransmutationRequests?: readonly ContinuousManaWorkRequest[]
  manaRegenPerSecondOverride?: number
}

const spellUnlocked = isSpellUnlocked
const resolveDeaths = (state: GameState, context: AdvanceContext) => resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents, { onLootResolved: context.onCombatLoot, onPlayerDefeated: context.onPlayerDefeated, onCombatCompleted: context.onCombatCompleted })

const autoCastReadySpells = (state: GameState, context: AdvanceContext) => {
  if (state.combat.pendingPlayerSpellCast) return
  if (state.combat.queuedPlayerSpellId) {
    const queuedId = state.combat.queuedPlayerSpellId
    const queuedSpell = SPELLS[queuedId]
    if (!queuedSpell || !spellUnlocked(state, queuedId)) {
      state.combat.queuedPlayerSpellId = null
      return
    }
    const failure = getSpellStartFailure(state, queuedId, { castOrigin: 'manual-queued' })
    if (!failure) {
      if (castSpellInternal(state, queuedId, true, context.uiEvents, 'manual-queued')) state.combat.queuedPlayerSpellId = null
    } else if (failure === 'unknown' || failure === 'locked' || failure === 'inactive' || failure === 'not-in-loadout') {
      state.combat.queuedPlayerSpellId = null
    }
    // A manual queue is a hard priority gate, including while it waits for a
    // target, cooldown, Mana, or temporary status recovery.
    return
  }
  if (actorCannotAct(state, 'player') || state.debug.freezePlayerActions || state.debug.disableAutoCast) return
  {
    const selectionStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const selection = selectNextAutomatedSpellFast(state, context.autoCastRuntime)
    context.onAutoCastCheck?.((typeof performance !== 'undefined' ? performance.now() : Date.now()) - selectionStartedAt)
    if (selection) {
      context.onAutoCastSelection?.()
      castSpellInternal(state, selection.spellId, true, context.uiEvents)
    }
  }
  suppressGuardianIfOutOfMana(state)
}

const hasReadyAutoCast = (state: GameState, autoCastRuntime?: PreparedAutoCastRuntime) => {
  if (actorCannotAct(state, 'player') || state.debug.freezePlayerActions || state.debug.disableAutoCast) return false
  return !state.combat.pendingPlayerSpellCast && Boolean(selectNextAutomatedSpellFast(state, autoCastRuntime))
}

const tickSpellCooldowns = (state: GameState, deltaMs: number, cooldownRecovery: number) => {
  const delta = Math.max(0, deltaMs) * cooldownRecovery
  Object.keys(state.combat.spellCooldowns).forEach((id) => {
    const spellId = id as SpellId
    const previous = state.combat.spellCooldowns[spellId] ?? 0
    const next = Math.max(0, previous - delta)
    state.combat.spellCooldowns[spellId] = next
    recordArcaneCoreV7CooldownCompletion(state, previous, next)
  })
}

/** Auto-Cast readiness is a combat-clock boundary, not an outer-quantum side effect. */
const getNextAutoCastCooldownEventMs = (state: GameState, cooldownRecovery: number, autoCastRuntime?: PreparedAutoCastRuntime): number | null => {
  if (state.combat.queuedPlayerSpellId || cooldownRecovery <= 0 || state.debug.freezePlayerActions || state.debug.disableAutoCast || state.debug.ignoreSpellCooldowns) return null
  return getNextAutomatedSpellCooldownMs(state, cooldownRecovery, autoCastRuntime)
}

export const getNextQueuedSpellCooldownEventMs = (state: GameState, cooldownRecovery: number): number | null => {
  const queuedId = state.combat.queuedPlayerSpellId
  if (!queuedId || state.combat.pendingPlayerSpellCast || cooldownRecovery <= 0 || state.debug.ignoreSpellCooldowns) return null
  const cooldown = state.combat.spellCooldowns[queuedId] ?? 0
  if (cooldown <= 0 || !Number.isFinite(cooldown)) return null
  return cooldown / cooldownRecovery
}

const hasImmediateCombatTimelineEvent = (state: GameState) => {
  if (getNextCombatStatusEventMs(state) === 0 || getNextCombatBarrierEventMs(state) === 0) return true
  if (!actorCannotAct(state, 'player') && !state.debug.freezePlayerActions && state.combat.pendingPlayerSpellCast && state.combat.pendingPlayerSpellCast.remainingWorkMs <= 0) return true
  if (!actorCannotAct(state, 'enemy') && !state.debug.freezeEnemyActions && state.combat.enemyCurrentStepId && state.combat.enemyActionTimerMs <= 0) return true
  if (state.combat.guardian.activeGuardianId && state.combat.guardian.attackTimerMs <= 0) return true
  return false
}

const advanceObservers = (state: GameState, delta: number, context: AdvanceContext) => {
  if (delta <= 0) return
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
  context.telemetry?.advance(delta, state)
  context.statistics?.advance(delta, state)
  context.onAnalyticsAdvance?.((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt)
}

export const advanceChannelingState = (state: GameState, delta: number, context: AdvanceContext, manaRateOverride?: number) => {
  const channelingTick = advanceChanneling(state, delta, manaRateOverride)
  if (channelingTick.discoveries.includes('deep-reservoir')) recalculateDerivedStats(state)
  channelingTick.discoveries.forEach((id) => {
    context.report?.recordDiscovery(id)
    const discovery = CHANNELING_DISCOVERIES.find((entry) => entry.id === id)
    if (discovery) pushNotification(state, `Arcane Discovery: ${discovery.name}`, 'success')
  })
  return channelingTick
}

const getNextHealthRegenEventMs = (state: GameState, skipFullHealth = false) => skipFullHealth && state.player.health >= state.player.maxHealth ? Number.POSITIVE_INFINITY : state.player.healthRegenTimerMs > 0 ? state.player.healthRegenTimerMs : Number.POSITIVE_INFINITY

/** Earliest combat-owned boundary used by the banked event-driven runner. */
export const getNextCombatBoundaryMs = (state: GameState, options: { manaDeltaPerSecond?: number; autoCastRuntime?: PreparedAutoCastRuntime } = {}): number | null => {
  if (!state.combat.active || (state.combat.enemyId && !MONSTERS[state.combat.enemyId])) return null
  const cooldownRecovery = getCooldownRecoveryMultiplier(state)
  const manaDeltaPerSecond = options.manaDeltaPerSecond ?? (manaRegenPerSecond(state) - getContinuousManaDemandPerSecond(state))
  if (state.player.health <= 0 || (state.combat.enemyId && state.combat.enemyHp <= 0)) return 0
  if (!state.combat.enemyId) {
    if (state.combat.encounterTimerMs <= 0) return 0
    const playerBlocked = actorCannotAct(state, 'player') || state.debug.freezePlayerActions
    const playerRate = getPlayerSpellCastRate(state)
    const pending = state.combat.pendingPlayerSpellCast
    const playerRemaining = playerBlocked || playerRate <= 0 || !pending ? Number.POSITIVE_INFINITY : Math.max(0, pending.remainingWorkMs) / playerRate
    return Math.min(
      Math.max(0, state.combat.encounterTimerMs),
      playerRemaining,
      getNextPlayerStatusEventMs(state) ?? Number.POSITIVE_INFINITY,
      getNextPlayerBarrierEventMs(state) ?? Number.POSITIVE_INFINITY,
      getNextHealthRegenEventMs(state, true),
      getNextQueuedSpellCooldownEventMs(state, cooldownRecovery) ?? Number.POSITIVE_INFINITY,
      getNextAutoCastCooldownEventMs(state, cooldownRecovery, options.autoCastRuntime) ?? Number.POSITIVE_INFINITY,
      getNextAutoCastEligibilityBoundaryMs(state, cooldownRecovery, manaDeltaPerSecond, options.autoCastRuntime) ?? Number.POSITIVE_INFINITY,
    )
  }
  if (!state.combat.enemyCurrentStepId && !actorCannotAct(state, 'enemy') && !state.debug.freezeEnemyActions) return 0
  const playerBlocked = actorCannotAct(state, 'player') || state.debug.freezePlayerActions
  const enemyBlocked = actorCannotAct(state, 'enemy') || state.debug.freezeEnemyActions
  const playerRate = getPlayerSpellCastRate(state)
  const arcanePauseUntilMs = Math.max(state.combat.arcaneCoreRuntime.absoluteStasisUntilMs ?? 0, state.combat.arcaneCoreRuntime.stasisCollapseUntilMs ?? 0)
  const arcaneStasisActive = arcanePauseUntilMs > state.combat.arcaneCoreRuntime.elapsedMs
  const enemyRate = arcaneStasisActive ? 0 : state.combat.enemyCurrentStepId ? getCurrentEnemyActionRate(state) : 0
  const playerRemaining = playerBlocked || playerRate <= 0 || !state.combat.pendingPlayerSpellCast ? Number.POSITIVE_INFINITY : Math.max(0, state.combat.pendingPlayerSpellCast.remainingWorkMs) / playerRate
  const enemyRemaining = enemyBlocked || !state.combat.enemyCurrentStepId || enemyRate <= 0 ? Number.POSITIVE_INFINITY : Math.max(0, state.combat.enemyActionTimerMs) / enemyRate
  return Math.min(
    playerRemaining,
    enemyRemaining,
    getNextCombatStatusEventMs(state) ?? Number.POSITIVE_INFINITY,
    getNextCombatBarrierEventMs(state) ?? Number.POSITIVE_INFINITY,
    getNextHealthRegenEventMs(state, true),
    getNextQueuedSpellCooldownEventMs(state, cooldownRecovery) ?? Number.POSITIVE_INFINITY,
    getNextAutoCastCooldownEventMs(state, cooldownRecovery, options.autoCastRuntime) ?? Number.POSITIVE_INFINITY,
    getNextAutoCastEligibilityBoundaryMs(state, cooldownRecovery, manaDeltaPerSecond, options.autoCastRuntime) ?? Number.POSITIVE_INFINITY,
    state.combat.guardian.activeGuardianId ? Math.max(0, state.combat.guardian.attackTimerMs) : Number.POSITIVE_INFINITY,
    arcaneStasisActive ? Math.max(0, arcanePauseUntilMs - state.combat.arcaneCoreRuntime.elapsedMs) : Number.POSITIVE_INFINITY,
  )
}

const resolveHealthRegenTick = (state: GameState, activeCombat: boolean, context: AdvanceContext) => {
  const interval = BALANCE.player.healthRegenIntervalMs
  state.player.healthRegenTimerMs = interval
  if (activeCombat && state.player.health <= 0) return
  const rate = getPlayerCombatStats(state).healthRegen * (activeCombat ? 1 : BALANCE.player.outOfCombatRegenMultiplier)
  const attemptedAmount = Math.max(0, rate)
  const effectiveAmount = Math.min(Math.max(0, state.player.maxHealth - state.player.health), attemptedAmount)
  state.player.health = clamp(state.player.health + effectiveAmount, 0, state.player.maxHealth)
  if (activeCombat && effectiveAmount > 0) context.telemetry?.consume({ source: { kind: 'system' }, sourceKind: 'system', target: 'player', category: 'heal', sourceId: 'health-regeneration', amount: effectiveAmount, attemptedAmount, effectiveAmount, overheal: Math.max(0, attemptedAmount - effectiveAmount) })
}

const advanceHealthRegenTimer = (state: GameState, delta: number, activeCombat: boolean, context: AdvanceContext) => {
  if (context.mode === 'banked' && delta > 0 && state.player.health >= state.player.maxHealth) {
    const interval = BALANCE.player.healthRegenIntervalMs
    const timer = Math.max(0, state.player.healthRegenTimerMs)
    const remainder = ((timer - delta) % interval + interval) % interval
    state.player.healthRegenTimerMs = remainder > 0 ? remainder : interval
    return
  }
  let remaining = Math.max(0, delta)
  let guard = 0
  while (remaining > 0 && guard++ < 1000) {
    const untilTick = getNextHealthRegenEventMs(state)
    const elapsed = Math.min(remaining, untilTick)
    state.player.healthRegenTimerMs = Math.max(0, state.player.healthRegenTimerMs - elapsed)
    remaining -= elapsed
    if (state.player.healthRegenTimerMs > 0) break
    resolveHealthRegenTick(state, activeCombat, context)
  }
  if (delta === 0 && state.player.healthRegenTimerMs <= 0) resolveHealthRegenTick(state, activeCombat, context)
}

/**
 * Advances every combat-local clock on one chronological timeline. The outer
 * simulation quantum remains a batching limit; it is not a gameplay boundary.
 */
const advanceCombatTimeline = (state: GameState, delta: number, context: AdvanceContext) => {
  let remaining = Math.max(0, delta)
  let guard = 0
  let attemptedImmediateAutoCast = false
  while (guard < 10_000 && state.combat.enemyId && (remaining > 0 || hasImmediateCombatTimelineEvent(state))) {
    guard += 1
    if (!state.combat.enemyCurrentStepId && !actorCannotAct(state, 'enemy') && !state.debug.freezeEnemyActions) {
      startNextEnemyAction(state, executeCombatEffects, 0, context.uiEvents)
      if (resolveDeaths(state, context)) break
    }
    ensureGuardianForCurrentEncounter(state)
    if (!state.combat.enemyId) break

    // A ready Auto-Cast spell is attempted once at encounter start. Casts are
    // committed work; effects and payment happen only at completion.
    if (!attemptedImmediateAutoCast && (state.combat.queuedPlayerSpellId !== null || hasReadyAutoCast(state, context.autoCastRuntime))
      && !actorCannotAct(state, 'player')
      && getNextCombatStatusEventMs(state) !== 0
      && getNextCombatBarrierEventMs(state) !== 0) {
      attemptedImmediateAutoCast = true
      autoCastReadySpells(state, context)
      if (!state.combat.enemyId) break
    }

    const playerBlockedAtSegmentStart = actorCannotAct(state, 'player') || state.debug.freezePlayerActions
    const enemyBlockedAtSegmentStart = actorCannotAct(state, 'enemy') || state.debug.freezeEnemyActions
    const playerRate = getPlayerSpellCastRate(state)
    const arcanePauseUntilMs = Math.max(state.combat.arcaneCoreRuntime.absoluteStasisUntilMs ?? 0, state.combat.arcaneCoreRuntime.stasisCollapseUntilMs ?? 0)
    const arcaneStasisActive = arcanePauseUntilMs > state.combat.arcaneCoreRuntime.elapsedMs
    const enemyRate = arcaneStasisActive ? 0 : state.combat.enemyCurrentStepId ? getCurrentEnemyActionRate(state) : 0
    // Timers hold remaining work. Convert only the next boundary to real
    // simulation milliseconds; completed work is never recomputed.
    const playerRemaining = playerBlockedAtSegmentStart || playerRate <= 0 || !state.combat.pendingPlayerSpellCast ? Number.POSITIVE_INFINITY : Math.max(0, state.combat.pendingPlayerSpellCast.remainingWorkMs) / playerRate
    const enemyRemaining = enemyBlockedAtSegmentStart || !state.combat.enemyCurrentStepId || enemyRate <= 0 ? Number.POSITIVE_INFINITY : Math.max(0, state.combat.enemyActionTimerMs) / enemyRate
    const cooldownRecovery = getCooldownRecoveryMultiplier(state)
    const boundaries = [
      playerRemaining,
      enemyRemaining,
      getNextCombatStatusEventMs(state),
      getNextCombatBarrierEventMs(state),
      getNextHealthRegenEventMs(state, context.mode === 'banked'),
      getNextQueuedSpellCooldownEventMs(state, cooldownRecovery),
      getNextAutoCastCooldownEventMs(state, cooldownRecovery, context.autoCastRuntime),
      getGuardianAttackBoundary(state),
      arcaneStasisActive ? Math.max(0, arcanePauseUntilMs - state.combat.arcaneCoreRuntime.elapsedMs) : null,
    ].filter((value): value is number => value !== null && Number.isFinite(value))
    const untilEvent = boundaries.length ? Math.min(...boundaries) : remaining
    const elapsed = Math.min(remaining, Math.max(0, untilEvent))
    context.onCombatElapsed?.(elapsed)
    advanceArcaneCoreV6RuntimeTime(state, elapsed)

    if (!playerBlockedAtSegmentStart && playerRate > 0 && state.combat.pendingPlayerSpellCast) state.combat.pendingPlayerSpellCast.remainingWorkMs = Math.max(0, state.combat.pendingPlayerSpellCast.remainingWorkMs - elapsed * playerRate)
    if (!enemyBlockedAtSegmentStart && state.combat.enemyCurrentStepId && enemyRate > 0) state.combat.enemyActionTimerMs = Math.max(0, state.combat.enemyActionTimerMs - elapsed * enemyRate)
    if (state.combat.guardian.activeGuardianId) state.combat.guardian.attackTimerMs = Math.max(0, state.combat.guardian.attackTimerMs - elapsed)
    tickRuleCooldowns(state, elapsed)
    const pendingStatusExpirations = tickStatuses(state, elapsed, executeCombatEffects, context.uiEvents, ['player', 'enemy'], { deferExpiry: true })
    tickBarriers(state, elapsed)
    tickSpellCooldowns(state, elapsed, cooldownRecovery)
    advanceGuardianUpkeep(state, elapsed)
    advanceHealthRegenTimer(state, elapsed, true, context)
    remaining = Math.max(0, remaining - elapsed)

    // Observe only the exact engaged segment. Death/despawn resolution below
    // determines whether the remainder belongs to downtime.
    advanceObservers(state, elapsed, context)

    // Status/Barrier callbacks have priority at an exact boundary.
    const combatEnded = resolveDeaths(state, context)
    expirePendingStatuses(state, pendingStatusExpirations, executeCombatEffects, context.uiEvents)
    if (combatEnded) break

    let playerSpellResolved = false
    if (!actorCannotAct(state, 'player') && !state.debug.freezePlayerActions && state.combat.pendingPlayerSpellCast?.remainingWorkMs === 0
      && (!spellRequiresEnemyTarget(SPELLS[state.combat.pendingPlayerSpellCast.spellId]) || Boolean(state.combat.enemyId))) {
      playerSpellResolved = resolvePlayerSpellCast(state, context.uiEvents)
      if (resolveDeaths(state, context)) break
    }

    // The manual queue gets the first chance at the exact completion
    // timestamp. Auto-Cast is considered only after the queue is empty.
    if (playerSpellResolved && state.combat.enemyId) autoCastReadySpells(state, context)

    suppressGuardianIfOutOfMana(state)
    // Exact boundary order: player Spell completion, then guardian, then enemy.
    if (state.combat.enemyId && state.combat.guardian.activeGuardianId && state.combat.guardian.attackTimerMs <= 0) {
      resolveGuardianAttack(state, context.uiEvents)
      if (resolveDeaths(state, context)) break
    }

    const reachedMeaningfulBoundary = elapsed <= 0 || boundaries.some((value) => value <= elapsed)
    if (playerSpellResolved || reachedMeaningfulBoundary) autoCastReadySpells(state, context)
    if (!state.combat.enemyId) break
    if (!actorCannotAct(state, 'enemy') && !state.debug.freezeEnemyActions && state.combat.enemyCurrentStepId && state.combat.enemyActionTimerMs <= 0) {
      resolveCurrentEnemyAction(state, executeCombatEffects, 0, context.uiEvents)
      if (resolveDeaths(state, context)) break
      suppressGuardianIfOutOfMana(state)
      // An enemy action can make a conditional spell ready at this exact
      // timestamp (for example, Flow Mend after taking damage).
      autoCastReadySpells(state, context)
    }
  }
  return remaining
}

const advanceCombatDowntimeTimeline = (state: GameState, delta: number, context: AdvanceContext) => {
  let remaining = Math.max(0, delta)
  let guard = 0
  while (guard < 10_000 && state.combat.active && !state.combat.enemyId && remaining > 0) {
    guard += 1
    // Manual self-only casts are allowed during active encounter downtime.
    // A queued enemy-target spell remains parked until spawn provides a target.
    autoCastReadySpells(state, context)
    if (state.combat.encounterTimerMs <= 0) {
      spawnNextEnemy(state, context.uiEvents)
      if (resolveDeaths(state, context)) break
      // Spawn is an exact boundary. A ready spell must not wait for the next
      // outer simulation quantum before attempting its first cast.
      autoCastReadySpells(state, context)
      break
    }

    const cooldownRecovery = getCooldownRecoveryMultiplier(state)
    const playerBlockedAtSegmentStart = actorCannotAct(state, 'player') || state.debug.freezePlayerActions
    const playerRate = getPlayerSpellCastRate(state)
    const pendingPlayerCast = state.combat.pendingPlayerSpellCast
    const playerRemaining = playerBlockedAtSegmentStart || playerRate <= 0 || !pendingPlayerCast ? Number.POSITIVE_INFINITY : Math.max(0, pendingPlayerCast.remainingWorkMs) / playerRate
    const boundaries = [
      playerRemaining,
      Math.max(0, state.combat.encounterTimerMs),
      getNextPlayerStatusEventMs(state),
      getNextPlayerBarrierEventMs(state),
      getNextHealthRegenEventMs(state, context.mode === 'banked'),
      getNextQueuedSpellCooldownEventMs(state, cooldownRecovery),
      getNextAutoCastCooldownEventMs(state, cooldownRecovery, context.autoCastRuntime),
    ].filter((value): value is number => value !== null && Number.isFinite(value))
    const untilEvent = boundaries.length ? Math.min(...boundaries) : remaining
    const elapsed = Math.min(remaining, Math.max(0, untilEvent))
    context.onCombatElapsed?.(elapsed)
    advanceArcaneCoreV6RuntimeTime(state, elapsed)

    const pendingStatusExpirations = tickStatuses(state, elapsed, executeCombatEffects, context.uiEvents, ['player'], { deferExpiry: true })
    tickBarriers(state, elapsed, ['player'])
    // Player-owned trait/status/equipment cooldowns live across enemy
    // downtime; enemy-owned cooldowns were cleared when the enemy died.
    tickRuleCooldowns(state, elapsed, 'player')
    tickSpellCooldowns(state, elapsed, cooldownRecovery)
    if (!playerBlockedAtSegmentStart && playerRate > 0 && state.combat.pendingPlayerSpellCast) {
      state.combat.pendingPlayerSpellCast.remainingWorkMs = Math.max(0, state.combat.pendingPlayerSpellCast.remainingWorkMs - elapsed * playerRate)
    }
    advanceHealthRegenTimer(state, elapsed, true, context)
    state.combat.encounterTimerMs = Math.max(0, state.combat.encounterTimerMs - elapsed)
    remaining = Math.max(0, remaining - elapsed)
    advanceObservers(state, elapsed, context)

    const combatEnded = resolveDeaths(state, context)
    expirePendingStatuses(state, pendingStatusExpirations, executeCombatEffects, context.uiEvents)
    if (combatEnded) break
    if (!actorCannotAct(state, 'player') && !state.debug.freezePlayerActions && state.combat.pendingPlayerSpellCast?.remainingWorkMs === 0) {
      const pendingSpell = SPELLS[state.combat.pendingPlayerSpellCast.spellId]
      if (pendingSpell && !spellRequiresEnemyTarget(pendingSpell)) {
        resolvePlayerSpellCast(state, context.uiEvents)
        autoCastReadySpells(state, context)
      }
    }
    if (state.combat.encounterTimerMs <= 0) {
      spawnNextEnemy(state, context.uiEvents)
      if (resolveDeaths(state, context)) break
      autoCastReadySpells(state, context)
      break
    }
    if (elapsed <= 0) break
  }
  return remaining
}

const tickCombat = (state: GameState, delta: number, context: AdvanceContext) => {
  if (!state.combat.active) return Math.max(0, delta)
  if (state.combat.enemyId && !MONSTERS[state.combat.enemyId]) return Math.max(0, delta)
  let remaining = Math.max(0, delta)
  let guard = 0
  while (guard < 10_000 && remaining > 0 && state.combat.active) {
    guard += 1
    remaining = state.combat.enemyId
      ? advanceCombatTimeline(state, remaining, context)
      : advanceCombatDowntimeTimeline(state, remaining, context)
  }
  return remaining
}

/** Advances only Combat-local systems. Developer stepping uses this same path. */
export const advanceCombatState = (state: GameState, delta: number, context: AdvanceContext) => {
  advanceCombatStateWithRemaining(state, delta, context)
  return state
}

/** Banked callers may need to continue non-combat systems after a defeat. */
export const advanceCombatStateWithRemaining = (state: GameState, delta: number, context: AdvanceContext) => {
  const bounded = Math.max(0, delta)
  if (bounded <= 0 || !state.combat.active) return bounded
  context.alerts?.advance(bounded, state)
  return tickCombat(state, bounded, context)
}

export const advanceGameStateContinuous = (state: GameState, delta: number, context: AdvanceContext, options: AdvanceContinuousOptions = {}) => {
  advanceChannelingState(state, delta, context, options.manaRegenPerSecondOverride)
  if (!state.combat.active) advanceHealthRegenTimer(state, delta, false, context)
  advanceArtificing(state, delta, (completion) => {
    context.report?.recordArtificing(completion.recipeId, completion.itemId)
    if (completion.kind === 'recipe' || completion.kind === 'artifact-forge') context.onItemAcquired?.(completion.itemId, 1)
    if (completion.kind !== 'recipe') recalculateDerivedStats(state)
    context.onArtificingComplete?.(completion)
  })
  const researchRequests = options.preparedResearchRequests
    ?? (options.preparedWorkRequests
      ? options.preparedWorkRequests.filter((request) => request.system === 'research')
      : undefined)
    ?? buildResearchWorkRequests(state, delta, context)
  const transmutationRequests = options.preparedTransmutationRequests
    ?? (options.preparedWorkRequests
      ? options.preparedWorkRequests.filter((request) => request.system === 'transmutation')
      : undefined)
    ?? buildTransmutationWorkRequests(state, delta)
  const continuousRequests = options.preparedWorkRequests ?? [...researchRequests, ...transmutationRequests]
  if (continuousRequests.length > 0) {
    const funding = allocateContinuousMana(state, continuousRequests)
    context.onContinuousManaAllocation?.()
    applyResearchAllocations(state, researchRequests, funding.allocations, context)
    applyTransmutationAllocations(state, transmutationRequests, funding.allocations, context)
  }
  return state
}

export const advanceGameStateStep = (state: GameState, delta: number, context: AdvanceContext) => {
  advanceGameStateContinuous(state, delta, context)
  const combatDelta = context.mode === 'live'
    ? (state.debug.combatPaused ? 0 : delta * sanitizeCombatTimeScale(state.debug.combatTimeScale))
    : delta
  if (state.combat.active) advanceCombatState(state, combatDelta, context)
  else context.alerts?.advance(delta, state)
  return state
}

export const advanceGameState = (state: GameState, deltaMs: number, context: AdvanceContext = { mode: 'live' }) => {
  const bounded = Math.min(MAX_SIMULATION_DELTA_MS, Math.max(0, deltaMs))
  // Banked simulation keeps analytical observation parity while omitting
  // presentation-only alert delivery. Its caller supplies an analytics-only
  // event sink, so skipped combat never replays the live UI history.
  const simulationContext = context.mode === 'live' ? context : { ...context, alerts: undefined }
  let remaining = bounded

  while (remaining > 0) {
    const step = Math.min(SIMULATION_QUANTUM_MS, remaining)
    advanceGameStateStep(state, step, simulationContext)
    remaining -= step
  }

  return state
}

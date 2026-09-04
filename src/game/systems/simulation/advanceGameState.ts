import { BALANCE } from '../../core/balance/balance'
import { CHANNELING_DISCOVERIES } from '../../content/channeling/channelingDiscoveries'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { SPELLS } from '../../content/spells/spells'
import { advanceChanneling } from '../../engine/channelingEngine'
import { appendLog, playerBasicDamage, pushNotification, recalculateDerivedStats } from '../../engine'
import { castSpellInternal, getSpellCastFailure } from '../../engine/spellEngine'
import { executeCombatEffects, getBasicAttackTags } from '../combat/effectResolver'
import { resolveCombatDeaths, spawnNextEnemy, type CombatLootObserver } from '../combat/combatRuntime'
import { getCurrentEnemyActionRate, getPlayerBasicAttackRate, resolveCurrentEnemyAction, startNextEnemyAction } from '../combat/actionRuntime'
import { actorCannotAct, expirePendingStatuses, getNextCombatStatusEventMs, getNextPlayerStatusEventMs, tickStatuses } from '../combat/statusRuntime'
import { getNextCombatBarrierEventMs, getNextPlayerBarrierEventMs, tickBarriers } from '../combat/barrierRuntime'
import { getCooldownRecoveryMultiplier, getEffectiveManaCost } from '../combat/combatStats'
import { tickRuleCooldowns } from '../combat/triggerRuntime'
import type { GameState, ItemId, SpellId, CombatSource } from '../../types'
import type { CombatAlertObserver, CombatEventSink } from '../combat/combatTypes'
import { clamp } from '../../utils'
import type { SimulationReportCollector } from '../offline-bank/offlineBankReport'
import { applyTransmutationAllocations, buildTransmutationWorkRequests } from '../transmutation/transmutationEngine'
import { applyResearchAllocations, buildResearchWorkRequests } from '../research/researchEngine'
import { allocateContinuousMana } from './continuousManaScheduler'
import { isSpellUnlocked } from '../spells'
import { MAX_SIMULATION_DELTA_MS, SIMULATION_QUANTUM_MS } from './simulationConstants'
import type { CombatTelemetryObserver } from '../../telemetry/combat/combatTelemetryTypes'
import type { DungeonStatisticsObserver } from '../../telemetry/dungeon/dungeonStatisticsTypes'
import { sanitizeCombatTimeScale } from '../../../store/actions/debugActions'
import { MAX_ACTION_WORK_MS, MIN_ACTION_TIME_MS } from '../../core/balance/combatTiming'

export interface AdvanceContext {
  mode: 'live' | 'banked'
  report?: SimulationReportCollector
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
  onCombatLoot?: CombatLootObserver
  uiEvents?: CombatEventSink
  telemetry?: CombatTelemetryObserver
  alerts?: CombatAlertObserver
  statistics?: DungeonStatisticsObserver
}

const spellUnlocked = isSpellUnlocked
const resolveDeaths = (state: GameState, context: AdvanceContext) => resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents, { onLootResolved: context.onCombatLoot })

const meetsAutoCondition = (state: GameState, spellId: SpellId) => {
  const condition = SPELLS[spellId].autoCondition
  if (!condition || condition.type === 'always') return true
  if (condition.type === 'health-below') return state.player.health / Math.max(1, state.player.maxHealth) * 100 < condition.percent
  return state.combat.playerBarrier < condition.value
}

const playerBasicAttack = (state: GameState, uiEvents?: CombatEventSink) => {
  const weapon = state.equipment.weapon ? ITEMS[state.equipment.weapon] : undefined
  const source: CombatSource = { actor: 'player', kind: weapon?.attackTags?.length ? 'weapon' : 'basic-attack', sourceId: weapon?.attackTags?.length && state.equipment.weapon ? state.equipment.weapon : 'player-basic-attack', tags: getBasicAttackTags(state) }
  executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: weapon?.damageType ?? 'physical', magnitude: { type: 'flat', value: playerBasicDamage(state) } }], tags: ['basic-attack', 'direct'] }], source, undefined, uiEvents)
  return state.combat.lastDamageDealt
}

const isAutoCastEligible = (state: GameState, spellId: SpellId) => Boolean(state.activities.autoCast[spellId]) && spellUnlocked(state, spellId) && Boolean(state.combat.enemyId) && (state.debug.ignoreSpellCooldowns || (state.combat.spellCooldowns[spellId] ?? 0) <= 0) && meetsAutoCondition(state, spellId)

const autoCastReadySpells = (state: GameState, context: AdvanceContext) => {
  const latches = state.combat.autoCastManaStarvedSpells ?? (state.combat.autoCastManaStarvedSpells = [])
  latches.slice().forEach((spellId) => { if (!isAutoCastEligible(state, spellId)) latches.splice(latches.indexOf(spellId), 1) })
  if (actorCannotAct(state, 'player') || !state.combat.enemyId || state.debug.freezePlayerActions || state.debug.disableAutoCast) return
  for (const id of Object.keys(state.activities.autoCast)) {
    const spellId = id as SpellId
    if (actorCannotAct(state, 'player')) break
    if (isAutoCastEligible(state, spellId)) {
      const spell = SPELLS[spellId]
      if (latches.includes(spellId) && !state.debug.infiniteMana && state.player.mana < getEffectiveManaCost(state, spell.manaCost)) continue
      const latchIndex = latches.indexOf(spellId)
      if (latchIndex >= 0) latches.splice(latchIndex, 1)
      castSpellInternal(state, spellId, true, context.uiEvents)
      if (getSpellCastFailure(state, spellId) === 'mana' && !latches.includes(spellId)) latches.push(spellId)
      if (resolveDeaths(state, context)) return
    }
  }
}

const hasReadyAutoCast = (state: GameState) => {
  if (actorCannotAct(state, 'player') || !state.combat.enemyId || state.debug.freezePlayerActions || state.debug.disableAutoCast) return false
  return Object.keys(state.activities.autoCast).some((id) => {
    const spellId = id as SpellId
    return Boolean(state.activities.autoCast[spellId]) && spellUnlocked(state, spellId) && (state.debug.ignoreSpellCooldowns || (state.combat.spellCooldowns[spellId] ?? 0) <= 0) && meetsAutoCondition(state, spellId)
  })
}

const ensurePlayerBasicRuntime = (state: GameState) => {
  if (state.combat.playerAttackDurationMs > 0) {
    state.combat.playerAttackDurationMs = Math.min(MAX_ACTION_WORK_MS, Math.max(MIN_ACTION_TIME_MS, state.combat.playerAttackDurationMs))
    state.combat.playerAttackTimerMs = Math.min(MAX_ACTION_WORK_MS, Math.max(0, Number.isFinite(state.combat.playerAttackTimerMs) ? state.combat.playerAttackTimerMs : state.combat.playerAttackDurationMs))
    return
  }
  // Player Basic uses the same work model as enemy actions. The duration is
  // authored base work; the live rate is consumed by the timeline below.
  state.combat.playerAttackDurationMs = Math.min(MAX_ACTION_WORK_MS, Math.max(MIN_ACTION_TIME_MS, BALANCE.player.basicAttackIntervalMs))
}

const tickSpellCooldowns = (state: GameState, deltaMs: number, cooldownRecovery: number) => {
  const delta = Math.max(0, deltaMs) * cooldownRecovery
  Object.keys(state.combat.spellCooldowns).forEach((id) => {
    const spellId = id as SpellId
    state.combat.spellCooldowns[spellId] = Math.max(0, (state.combat.spellCooldowns[spellId] ?? 0) - delta)
  })
}

/** Auto-Cast readiness is a combat-clock boundary, not an outer-quantum side effect. */
const getNextAutoCastCooldownEventMs = (state: GameState, cooldownRecovery: number): number | null => {
  if (!state.combat.enemyId || cooldownRecovery <= 0 || state.debug.freezePlayerActions || state.debug.disableAutoCast || state.debug.ignoreSpellCooldowns) return null
  let next: number | null = null
  Object.keys(state.activities.autoCast).forEach((id) => {
    const spellId = id as SpellId
    if (!state.activities.autoCast[spellId] || !spellUnlocked(state, spellId) || state.debug.ignoreSpellCooldowns) return
    const cooldown = state.combat.spellCooldowns[spellId] ?? 0
    if (cooldown <= 0 || !Number.isFinite(cooldown)) return
    const boundary = cooldown / cooldownRecovery
    if (next === null || boundary < next) next = boundary
  })
  return next
}

const hasImmediateCombatTimelineEvent = (state: GameState) => {
  if (getNextCombatStatusEventMs(state) === 0 || getNextCombatBarrierEventMs(state) === 0) return true
  if (!actorCannotAct(state, 'player') && !state.debug.freezePlayerActions && !state.debug.disablePlayerBasicAttack && state.combat.playerAttackTimerMs <= 0) return true
  if (!actorCannotAct(state, 'enemy') && !state.debug.freezeEnemyActions && state.combat.enemyCurrentStepId && state.combat.enemyActionTimerMs <= 0) return true
  return false
}

const advanceObservers = (state: GameState, delta: number, context: AdvanceContext) => {
  if (delta <= 0) return
  context.telemetry?.advance(delta, state)
  context.statistics?.advance(delta, state)
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
    ensurePlayerBasicRuntime(state)
    if (!state.combat.enemyId) break

    // A spell that is already ready when an encounter starts should be
    // attempted at t=0. Keep Player Basic's exact-boundary priority and let
    // status/barrier callbacks settle first when they are also due at t=0.
    if (!attemptedImmediateAutoCast && hasReadyAutoCast(state)
      && !actorCannotAct(state, 'player')
      && state.combat.playerAttackTimerMs > 0
      && getNextCombatStatusEventMs(state) !== 0
      && getNextCombatBarrierEventMs(state) !== 0) {
      attemptedImmediateAutoCast = true
      autoCastReadySpells(state, context)
      if (!state.combat.enemyId) break
    }

    const playerBlockedAtSegmentStart = actorCannotAct(state, 'player') || state.debug.freezePlayerActions || state.debug.disablePlayerBasicAttack
    const enemyBlockedAtSegmentStart = actorCannotAct(state, 'enemy') || state.debug.freezeEnemyActions
    const playerRate = getPlayerBasicAttackRate(state)
    const enemyRate = state.combat.enemyCurrentStepId ? getCurrentEnemyActionRate(state) : 0
    // Timers hold remaining work. Convert only the next boundary to real
    // simulation milliseconds; completed work is never recomputed.
    const playerRemaining = playerBlockedAtSegmentStart || playerRate <= 0 ? Number.POSITIVE_INFINITY : Math.max(0, state.combat.playerAttackTimerMs) / playerRate
    const enemyRemaining = enemyBlockedAtSegmentStart || !state.combat.enemyCurrentStepId || enemyRate <= 0 ? Number.POSITIVE_INFINITY : Math.max(0, state.combat.enemyActionTimerMs) / enemyRate
    const cooldownRecovery = getCooldownRecoveryMultiplier(state)
    const boundaries = [
      playerRemaining,
      enemyRemaining,
      getNextCombatStatusEventMs(state),
      getNextCombatBarrierEventMs(state),
      getNextAutoCastCooldownEventMs(state, cooldownRecovery),
    ].filter((value): value is number => value !== null && Number.isFinite(value))
    const untilEvent = boundaries.length ? Math.min(...boundaries) : remaining
    const elapsed = Math.min(remaining, Math.max(0, untilEvent))

    if (!playerBlockedAtSegmentStart && playerRate > 0) state.combat.playerAttackTimerMs = Math.max(0, state.combat.playerAttackTimerMs - elapsed * playerRate)
    if (!enemyBlockedAtSegmentStart && state.combat.enemyCurrentStepId && enemyRate > 0) state.combat.enemyActionTimerMs = Math.max(0, state.combat.enemyActionTimerMs - elapsed * enemyRate)
    tickRuleCooldowns(state, elapsed)
    const pendingStatusExpirations = tickStatuses(state, elapsed, executeCombatEffects, context.uiEvents, ['player', 'enemy'], { deferExpiry: true })
    tickBarriers(state, elapsed)
    tickSpellCooldowns(state, elapsed, cooldownRecovery)
    remaining = Math.max(0, remaining - elapsed)

    // Observe only the exact engaged segment. Death/despawn resolution below
    // determines whether the remainder belongs to downtime.
    advanceObservers(state, elapsed, context)

    // Status/Barrier callbacks have priority at an exact boundary.
    const combatEnded = resolveDeaths(state, context)
    expirePendingStatuses(state, pendingStatusExpirations, executeCombatEffects, context.uiEvents)
    if (combatEnded) break

    let playerBasicResolved = false
    if (!actorCannotAct(state, 'player') && !state.debug.freezePlayerActions && !state.debug.disablePlayerBasicAttack && state.combat.playerAttackTimerMs <= 0 && state.combat.enemyId) {
      const damage = playerBasicAttack(state, context.uiEvents)
      appendLog(state, `Basic Attack hits for ${damage}.`)
      state.combat.playerAttackDurationMs = Math.min(MAX_ACTION_WORK_MS, Math.max(MIN_ACTION_TIME_MS, BALANCE.player.basicAttackIntervalMs))
      state.combat.playerAttackTimerMs = state.combat.playerAttackDurationMs
      playerBasicResolved = true
      if (resolveDeaths(state, context)) break
    }

    const reachedMeaningfulBoundary = elapsed <= 0 || boundaries.some((value) => value <= elapsed)
    if (playerBasicResolved || reachedMeaningfulBoundary) autoCastReadySpells(state, context)
    if (!state.combat.enemyId) break
    if (!actorCannotAct(state, 'enemy') && !state.debug.freezeEnemyActions && state.combat.enemyCurrentStepId && state.combat.enemyActionTimerMs <= 0) {
      resolveCurrentEnemyAction(state, executeCombatEffects, 0, context.uiEvents)
      if (resolveDeaths(state, context)) break
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
    if (state.combat.encounterTimerMs <= 0) {
      spawnNextEnemy(state, context.uiEvents)
      if (resolveDeaths(state, context)) break
      // Spawn is an exact boundary. A ready spell must not wait for the next
      // outer simulation quantum before attempting its first cast.
      autoCastReadySpells(state, context)
      break
    }

    const cooldownRecovery = getCooldownRecoveryMultiplier(state)
    const boundaries = [
      Math.max(0, state.combat.encounterTimerMs),
      getNextPlayerStatusEventMs(state),
      getNextPlayerBarrierEventMs(state),
    ].filter((value): value is number => value !== null && Number.isFinite(value))
    const untilEvent = boundaries.length ? Math.min(...boundaries) : remaining
    const elapsed = Math.min(remaining, Math.max(0, untilEvent))

    const pendingStatusExpirations = tickStatuses(state, elapsed, executeCombatEffects, context.uiEvents, ['player'], { deferExpiry: true })
    tickBarriers(state, elapsed, ['player'])
    // Player-owned trait/status/equipment cooldowns live across enemy
    // downtime; enemy-owned cooldowns were cleared when the enemy died.
    tickRuleCooldowns(state, elapsed, 'player')
    tickSpellCooldowns(state, elapsed, cooldownRecovery)
    state.combat.encounterTimerMs = Math.max(0, state.combat.encounterTimerMs - elapsed)
    remaining = Math.max(0, remaining - elapsed)
    advanceObservers(state, elapsed, context)

    const combatEnded = resolveDeaths(state, context)
    expirePendingStatuses(state, pendingStatusExpirations, executeCombatEffects, context.uiEvents)
    if (combatEnded) break
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
  if (!state.combat.active) return
  if (state.combat.enemyId && !MONSTERS[state.combat.enemyId]) return
  let remaining = Math.max(0, delta)
  let guard = 0
  while (guard < 10_000 && remaining > 0 && state.combat.active) {
    guard += 1
    remaining = state.combat.enemyId
      ? advanceCombatTimeline(state, remaining, context)
      : advanceCombatDowntimeTimeline(state, remaining, context)
  }
}

/** Advances only Combat-local systems. Developer stepping uses this same path. */
export const advanceCombatState = (state: GameState, delta: number, context: AdvanceContext) => {
  const bounded = Math.max(0, delta)
  if (bounded <= 0 || !state.combat.active) return state
  context.alerts?.advance(bounded, state)
  tickCombat(state, bounded, context)
  return state
}

const advanceGameStateStep = (state: GameState, delta: number, context: AdvanceContext) => {
  const channelingTick = advanceChanneling(state, delta)
  if (channelingTick.discoveries.includes('deep-reservoir')) recalculateDerivedStats(state)
  channelingTick.discoveries.forEach((id) => {
    context.report?.recordDiscovery(id)
    const discovery = CHANNELING_DISCOVERIES.find((entry) => entry.id === id)
    if (discovery) pushNotification(state, `Arcane Discovery: ${discovery.name}`, 'success')
  })
  if (!state.combat.active) state.player.health = clamp(state.player.health + BALANCE.player.healthRegenPerSecond * delta / 1000 * BALANCE.player.outOfCombatRegenMultiplier, 0, state.player.maxHealth)
  const researchRequests = buildResearchWorkRequests(state, delta, context)
  const transmutationRequests = buildTransmutationWorkRequests(state, delta)
  const funding = allocateContinuousMana(state, [...researchRequests, ...transmutationRequests])
  applyResearchAllocations(state, researchRequests, funding.allocations, context)
  applyTransmutationAllocations(state, transmutationRequests, funding.allocations, context)
  const combatDelta = context.mode === 'live'
    ? (state.debug.combatPaused ? 0 : delta * sanitizeCombatTimeScale(state.debug.combatTimeScale))
    : delta
  if (state.combat.active) advanceCombatState(state, combatDelta, context)
  else context.alerts?.advance(delta, state)
  return state
}

export const advanceGameState = (state: GameState, deltaMs: number, context: AdvanceContext = { mode: 'live' }) => {
  const bounded = Math.min(MAX_SIMULATION_DELTA_MS, Math.max(0, deltaMs))
  const simulationContext = context.mode === 'live' ? context : { ...context, uiEvents: undefined, telemetry: undefined, alerts: undefined, statistics: undefined }
  let remaining = bounded

  while (remaining > 0) {
    const step = Math.min(SIMULATION_QUANTUM_MS, remaining)
    advanceGameStateStep(state, step, simulationContext)
    remaining -= step
  }

  return state
}

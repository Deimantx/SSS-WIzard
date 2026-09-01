import { BALANCE } from '../../core/balance/balance'
import { CHANNELING_DISCOVERIES } from '../../content/channeling/channelingDiscoveries'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { SPELLS } from '../../content/spells/spells'
import { advanceChanneling } from '../../engine/channelingEngine'
import { appendLog, playerBasicDamage, pushNotification, recalculateDerivedStats } from '../../engine'
import { castSpellInternal } from '../../engine/spellEngine'
import { executeCombatEffects, getBasicAttackTags, resolveBasicAttackInterval } from '../combat/effectResolver'
import { resolveCombatDeaths, spawnNextEnemy } from '../combat/combatRuntime'
import { resolveCurrentEnemyAction, startNextEnemyAction } from '../combat/actionRuntime'
import { actorCannotAct, getNextCombatStatusEventMs, tickStatuses } from '../combat/statusRuntime'
import { getNextCombatBarrierEventMs, tickBarriers } from '../combat/barrierRuntime'
import { getCombatModifiers } from '../combat/modifiers'
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

export interface AdvanceContext {
  mode: 'live' | 'banked'
  report?: SimulationReportCollector
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
  uiEvents?: CombatEventSink
  telemetry?: CombatTelemetryObserver
  alerts?: CombatAlertObserver
  statistics?: DungeonStatisticsObserver
}

const spellUnlocked = isSpellUnlocked

const meetsAutoCondition = (state: GameState, spellId: SpellId) => {
  const condition = SPELLS[spellId].autoCondition
  if (!condition || condition.type === 'always') return true
  if (condition.type === 'health-below') return state.player.health / Math.max(1, state.player.maxHealth) * 100 < condition.percent
  return state.combat.playerBarrier < condition.value
}

const playerBasicAttack = (state: GameState, uiEvents?: CombatEventSink) => {
  const weapon = state.equipment.weapon ? ITEMS[state.equipment.weapon] : undefined
  const source: CombatSource = { actor: 'player', kind: weapon?.attackTags?.length ? 'weapon' : 'basic-attack', sourceId: 'player-basic-attack', tags: getBasicAttackTags(state) }
  executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: weapon?.damageType ?? 'physical', magnitude: { type: 'flat', value: playerBasicDamage(state) }, tags: ['basic-attack', 'direct'] }], source, undefined, uiEvents)
  return state.combat.lastDamageDealt
}

const autoCastReadySpells = (state: GameState, context: AdvanceContext) => {
  if (actorCannotAct(state, 'player') || !state.combat.enemyId) return
  for (const id of Object.keys(state.activities.autoCast)) {
    const spellId = id as SpellId
    if (actorCannotAct(state, 'player')) break
    if (state.activities.autoCast[spellId] && spellUnlocked(state, spellId) && state.combat.spellCooldowns[spellId] <= 0 && meetsAutoCondition(state, spellId)) {
      castSpellInternal(state, spellId, true, context.uiEvents)
      if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) return
    }
  }
}

const ensurePlayerBasicRuntime = (state: GameState) => {
  if (state.combat.playerAttackDurationMs > 0) return
  state.combat.playerAttackDurationMs = resolveBasicAttackInterval(state, 'player', BALANCE.player.basicAttackIntervalMs)
}

const cooldownRecoveryMultiplier = (state: GameState) => Math.max(0, 1 + getCombatModifiers(state, 'player', 'cooldown-recovery-percent'))

const tickSpellCooldowns = (state: GameState, deltaMs: number, cooldownRecovery: number) => {
  const delta = Math.max(0, deltaMs) * cooldownRecovery
  Object.keys(state.combat.spellCooldowns).forEach((id) => {
    const spellId = id as SpellId
    state.combat.spellCooldowns[spellId] = Math.max(0, (state.combat.spellCooldowns[spellId] ?? 0) - delta)
  })
}

/** Auto-Cast readiness is a combat-clock boundary, not an outer-quantum side effect. */
const getNextAutoCastCooldownEventMs = (state: GameState, cooldownRecovery: number): number | null => {
  if (!state.combat.enemyId || cooldownRecovery <= 0) return null
  let next: number | null = null
  Object.keys(state.activities.autoCast).forEach((id) => {
    const spellId = id as SpellId
    if (!state.activities.autoCast[spellId] || !spellUnlocked(state, spellId)) return
    const cooldown = state.combat.spellCooldowns[spellId] ?? 0
    if (cooldown <= 0 || !Number.isFinite(cooldown)) return
    const boundary = cooldown / cooldownRecovery
    if (next === null || boundary < next) next = boundary
  })
  return next
}

const hasImmediateCombatTimelineEvent = (state: GameState) => {
  if (getNextCombatStatusEventMs(state) === 0 || getNextCombatBarrierEventMs(state) === 0) return true
  if (!actorCannotAct(state, 'player') && state.combat.playerAttackTimerMs <= 0) return true
  if (!actorCannotAct(state, 'enemy') && state.combat.enemyCurrentStepId && state.combat.enemyActionTimerMs <= 0) return true
  return false
}

/**
 * Advances every combat-local clock on one chronological timeline. The outer
 * simulation quantum remains a batching limit; it is not a gameplay boundary.
 */
const advanceCombatTimeline = (state: GameState, delta: number, context: AdvanceContext) => {
  let remaining = Math.max(0, delta)
  let guard = 0
  while (guard < 10_000 && state.combat.enemyId && (remaining > 0 || hasImmediateCombatTimelineEvent(state))) {
    guard += 1
    if (!state.combat.enemyCurrentStepId && !actorCannotAct(state, 'enemy')) {
      startNextEnemyAction(state, executeCombatEffects, 0, context.uiEvents)
      if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) break
    }
    ensurePlayerBasicRuntime(state)
    if (!state.combat.enemyId) break

    const playerBlockedAtSegmentStart = actorCannotAct(state, 'player')
    const enemyBlockedAtSegmentStart = actorCannotAct(state, 'enemy')
    const playerRemaining = playerBlockedAtSegmentStart ? Number.POSITIVE_INFINITY : Math.max(0, state.combat.playerAttackTimerMs)
    const enemyRemaining = enemyBlockedAtSegmentStart || !state.combat.enemyCurrentStepId ? Number.POSITIVE_INFINITY : Math.max(0, state.combat.enemyActionTimerMs)
    const cooldownRecovery = cooldownRecoveryMultiplier(state)
    const boundaries = [
      playerRemaining,
      enemyRemaining,
      getNextCombatStatusEventMs(state),
      getNextCombatBarrierEventMs(state),
      getNextAutoCastCooldownEventMs(state, cooldownRecovery),
    ].filter((value): value is number => value !== null && Number.isFinite(value))
    const untilEvent = boundaries.length ? Math.min(...boundaries) : remaining
    const elapsed = Math.min(remaining, Math.max(0, untilEvent))

    if (!playerBlockedAtSegmentStart) state.combat.playerAttackTimerMs = Math.max(0, state.combat.playerAttackTimerMs - elapsed)
    if (!enemyBlockedAtSegmentStart && state.combat.enemyCurrentStepId) state.combat.enemyActionTimerMs = Math.max(0, state.combat.enemyActionTimerMs - elapsed)
    tickRuleCooldowns(state, elapsed)
    tickStatuses(state, elapsed, executeCombatEffects, context.uiEvents)
    tickBarriers(state, elapsed)
    tickSpellCooldowns(state, elapsed, cooldownRecovery)
    remaining = Math.max(0, remaining - elapsed)

    // Status/Barrier callbacks have priority at an exact boundary.
    if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) break

    if (!actorCannotAct(state, 'player') && state.combat.playerAttackTimerMs <= 0 && state.combat.enemyId) {
      const damage = playerBasicAttack(state, context.uiEvents)
      appendLog(state, `Basic Attack hits for ${damage}.`)
      state.combat.playerAttackDurationMs = resolveBasicAttackInterval(state, 'player', BALANCE.player.basicAttackIntervalMs)
      state.combat.playerAttackTimerMs = state.combat.playerAttackDurationMs
      if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) break
    }

    autoCastReadySpells(state, context)
    if (!state.combat.enemyId) break
    if (!actorCannotAct(state, 'enemy') && state.combat.enemyCurrentStepId && state.combat.enemyActionTimerMs <= 0) {
      resolveCurrentEnemyAction(state, executeCombatEffects, 0, context.uiEvents)
      if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) break
    }
  }
}

const tickCombat = (state: GameState, delta: number, context: AdvanceContext) => {
  if (!state.combat.active) return
  if (!state.combat.enemyId) { state.combat.encounterTimerMs -= delta; if (state.combat.encounterTimerMs <= 0) { spawnNextEnemy(state, context.uiEvents); resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents) } return }
  const enemy = state.combat.enemyId ? MONSTERS[state.combat.enemyId] : null
  if (!enemy) return
  advanceCombatTimeline(state, delta, context)
}

const advanceGameStateStep = (state: GameState, delta: number, context: AdvanceContext) => {
  context.telemetry?.advance(delta, state)
  context.alerts?.advance(delta, state)
  context.statistics?.advance(delta, state)
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
  tickCombat(state, delta, context)
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

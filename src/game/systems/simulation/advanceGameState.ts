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
import { resolveActiveEnemyAction, startNextEnemyAction } from '../combat/actionRuntime'
import { actorCannotAct, tickStatuses } from '../combat/statusRuntime'
import { tickBarriers } from '../combat/barrierRuntime'
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

const tickCombatStatuses = (state: GameState, delta: number, uiEvents?: CombatEventSink) => tickStatuses(state, delta, executeCombatEffects, uiEvents)

const playerBasicAttack = (state: GameState, uiEvents?: CombatEventSink) => {
  const weapon = state.equipment.weapon ? ITEMS[state.equipment.weapon] : undefined
  const source: CombatSource = { actor: 'player', kind: weapon?.attackTags?.length ? 'weapon' : 'basic-attack', sourceId: 'player-basic-attack', tags: getBasicAttackTags(state) }
  executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: weapon?.damageType ?? 'physical', magnitude: { type: 'flat', value: playerBasicDamage(state) }, tags: ['basic-attack', 'direct'] }], source, undefined, uiEvents)
  return state.combat.lastDamageDealt
}

const tickCombat = (state: GameState, delta: number, context: AdvanceContext) => {
  if (!state.combat.active) return
  if (!state.combat.enemyId) { state.combat.encounterTimerMs -= delta; if (state.combat.encounterTimerMs <= 0) { spawnNextEnemy(state, context.uiEvents); resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents) } return }

  tickRuleCooldowns(state, delta)
  tickCombatStatuses(state, delta, context.uiEvents)
  tickBarriers(state, delta)
  if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) return
  const enemy = state.combat.enemyId ? MONSTERS[state.combat.enemyId] : null
  if (!enemy) return

  const cooldownRecovery = Math.max(0, 1 + getCombatModifiers(state, 'player', 'cooldown-recovery-percent'))
  const playerStunned = actorCannotAct(state, 'player')
  if (!playerStunned) state.combat.playerAttackTimerMs -= delta
  Object.keys(state.combat.spellCooldowns).forEach((id) => { state.combat.spellCooldowns[id as SpellId] = Math.max(0, state.combat.spellCooldowns[id as SpellId] - delta * cooldownRecovery) })
  if (!playerStunned && state.combat.playerAttackTimerMs <= 0 && state.combat.enemyId) {
    const damage = playerBasicAttack(state, context.uiEvents)
    appendLog(state, `Basic Attack hits for ${damage}.`)
    state.combat.playerAttackTimerMs = resolveBasicAttackInterval(state, 'player', BALANCE.player.basicAttackIntervalMs)
    if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) return
  }
  if (state.combat.enemyId) {
    for (const id of Object.keys(state.activities.autoCast)) {
      const spellId = id as SpellId
      if (actorCannotAct(state, 'player')) break
      if (state.activities.autoCast[spellId] && spellUnlocked(state, spellId) && state.combat.spellCooldowns[spellId] <= 0 && meetsAutoCondition(state, spellId)) {
        castSpellInternal(state, spellId, true, context.uiEvents)
        if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) return
      }
    }
  }
  if (!state.combat.enemyId) return
  if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) return

  if (!actorCannotAct(state, 'enemy') && state.combat.enemyTelegraphActionId) {
    state.combat.enemyTelegraphMs -= delta
    if (state.combat.enemyTelegraphMs <= 0) {
      resolveActiveEnemyAction(state, executeCombatEffects, 0, context.uiEvents)
      if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) return
    }
  } else if (!actorCannotAct(state, 'enemy')) {
    state.combat.enemyActionTimerMs -= delta
    if (state.combat.enemyActionTimerMs <= 0) {
      startNextEnemyAction(state, executeCombatEffects, 0, context.uiEvents)
      if (resolveCombatDeaths(state, context.report, context.onItemAcquired, context.uiEvents)) return
    }
  }
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

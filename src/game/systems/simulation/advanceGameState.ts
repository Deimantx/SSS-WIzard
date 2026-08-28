import { BALANCE } from '../../core/balance/balance'
import { CHANNELING_DISCOVERIES } from '../../content/channeling/channelingDiscoveries'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { SPELLS } from '../../content/spells/spells'
import { advanceChanneling } from '../../engine/channelingEngine'
import { appendLog, playerBasicDamage, pushNotification, recalculateDerivedStats } from '../../engine'
import { castSpellInternal } from '../../engine/spellEngine'
import { executeCombatEffects, getBasicAttackTags, resolveBasicAttackInterval } from '../combat/effectResolver'
import { executeEnemyAction, executeSpecial, finishEnemy, spawnNextEnemy } from '../combat/combatRuntime'
import { actorCannotAct, tickStatuses } from '../combat/statusRuntime'
import { getCombatModifiers } from '../combat/modifiers'
import type { GameState, ItemId, SpellId, CombatSource } from '../../types'
import { clamp } from '../../utils'
import type { SimulationReportCollector } from '../offline-bank/offlineBankReport'
import { applyTransmutationAllocations, buildTransmutationWorkRequests } from '../transmutation/transmutationEngine'
import { applyResearchAllocations, buildResearchWorkRequests } from '../research/researchEngine'
import { allocateContinuousMana } from './continuousManaScheduler'

export interface AdvanceContext {
  mode: 'live' | 'banked'
  report?: SimulationReportCollector
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
}

const spellUnlocked = (state: GameState, spellId: SpellId) => state.progress.unlockedSpells.includes(spellId)

const meetsAutoCondition = (state: GameState, spellId: SpellId) => {
  const condition = SPELLS[spellId].autoCondition
  if (!condition || condition.type === 'always') return true
  if (condition.type === 'health-below') return state.player.health / Math.max(1, state.player.maxHealth) * 100 < condition.percent
  return state.combat.playerBarrier < condition.value
}

const tickCombatStatuses = (state: GameState, delta: number) => tickStatuses(state, delta, executeCombatEffects)

const playerBasicAttack = (state: GameState) => {
  const weapon = state.equipment.weapon ? ITEMS[state.equipment.weapon] : undefined
  const source: CombatSource = { actor: 'player', kind: weapon?.attackTags?.length ? 'weapon' : 'basic-attack', sourceId: 'player-basic-attack', tags: getBasicAttackTags(state) }
  executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: weapon?.damageType ?? 'physical', magnitude: { type: 'flat', value: playerBasicDamage(state) }, tags: ['basic-attack', 'direct'] }], source)
  return state.combat.lastDamageDealt
}

const tickCombat = (state: GameState, delta: number, context: AdvanceContext) => {
  if (!state.combat.active) return
  if (!state.combat.enemyId) { state.combat.encounterTimerMs -= delta; if (state.combat.encounterTimerMs <= 0) spawnNextEnemy(state); return }

  tickCombatStatuses(state, delta)
  if (state.combat.enemyId && state.combat.enemyHp <= 0) { finishEnemy(state, context.report, context.onItemAcquired); return }
  const enemy = state.combat.enemyId ? MONSTERS[state.combat.enemyId] : null
  if (!enemy) return

  const cooldownRecovery = Math.max(0, 1 + getCombatModifiers(state, 'player', 'cooldown-recovery-percent'))
  const playerStunned = actorCannotAct(state, 'player')
  if (!playerStunned) state.combat.playerAttackTimerMs -= delta
  Object.keys(state.combat.spellCooldowns).forEach((id) => { state.combat.spellCooldowns[id as SpellId] = Math.max(0, state.combat.spellCooldowns[id as SpellId] - delta * cooldownRecovery) })
  if (!playerStunned && state.combat.playerAttackTimerMs <= 0 && state.combat.enemyId) {
    const damage = playerBasicAttack(state)
    appendLog(state, `Basic Attack hits for ${damage}.`)
    state.combat.playerAttackTimerMs = resolveBasicAttackInterval(state, 'player', BALANCE.player.basicAttackIntervalMs)
  }
  if (state.combat.enemyId) Object.keys(state.activities.autoCast).forEach((id) => { const spellId = id as SpellId; if (state.activities.autoCast[spellId] && spellUnlocked(state, spellId) && state.combat.spellCooldowns[spellId] <= 0 && meetsAutoCondition(state, spellId)) castSpellInternal(state, spellId, true) })
  if (!state.combat.enemyId) return
  if (state.combat.enemyHp <= 0) { finishEnemy(state, context.report, context.onItemAcquired); return }

  state.combat.enemyIntervalMs = resolveBasicAttackInterval(state, 'enemy', enemy.attackIntervalMs)
  if (!actorCannotAct(state, 'enemy') && state.combat.enemyTelegraphMs > 0) {
    state.combat.enemyTelegraphMs -= delta
    if (state.combat.enemyTelegraphMs <= 0 && state.combat.enemyTelegraphActionId) {
      executeSpecial(state, state.combat.enemyTelegraphActionId)
      state.combat.enemyTelegraphActionId = null
      state.combat.enemyActionTimerMs = state.combat.enemyIntervalMs
    }
  } else if (!actorCannotAct(state, 'enemy')) {
    state.combat.enemyActionTimerMs -= delta
    if (state.combat.enemyActionTimerMs <= 0) executeEnemyAction(state)
  }
  if (state.player.health <= 0 && !state.player.godMode) {
    context.report?.recordPlayerDeath()
    state.combat.active = false
    state.combat.enemyId = null
    state.combat.enemyHp = 0
    state.combat.enemyBarrier = 0
    state.combat.playerBarrier = 0
    state.combat.playerStatuses = []
    state.combat.enemyStatuses = []
    state.combat.triggeredRuleIds = []
    state.combat.threatCleared = 0
    state.combat.inBossFight = false
    pushNotification(state, 'Defeated · recovering in the Tower', 'warning')
    appendLog(state, 'The wizard falls. Threat Cleared resets to 0.')
  }
}

export const advanceGameState = (state: GameState, deltaMs: number, context: AdvanceContext = { mode: 'live' }) => {
  const delta = Math.min(1000, Math.max(0, deltaMs))
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

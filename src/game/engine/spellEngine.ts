import { SPELLS } from '../content/spells'
import { appendLog, pushNotification } from '../engine'
import { executeCombatEffects } from '../systems/combat/effectResolver'
import { actorCannotAct, actorCannotCastSpells, removeStatus } from '../systems/combat/statusRuntime'
import { isSpellUnlocked } from '../systems/spells'
import type { CanonicalSpellId, GameState, PendingPlayerSpellCast, SpellDefinition, SpellId } from '../types'
import type { CombatEffect, CombatEventSink, CombatSource } from '../systems/combat/combatTypes'
import { scaleMagnitude } from '../systems/combat/combatTypes'
import { getEffectiveManaCost } from '../systems/combat/combatStats'
import { getCombatModifiers } from '../systems/combat/modifiers'
import { getSpellCombatSource } from '../systems/spells/spellSource'
import { hasEnoughResource, stabilizeResourceValue } from '../presentation/resources/resourcePresentation'
import { beginArcaneCoreSpellCast, isArcaneCoreSpellFree } from '../systems/arcaneCore/arcaneCoreRuntime'
import { getArcaneCoreV6CastModifiers, type ArcaneCoreCastOrigin, type ArcaneCoreV6CastModifiers } from '../systems/arcaneCore/arcaneCoreV6Runtime'
import { getArcaneCoreCooldownPulseReduction } from '../systems/arcaneCore/arcaneCoreRuntime'
import { runCombatTriggers } from '../systems/combat/triggerRuntime'
import { createCombatResolutionContext } from '../systems/combat/combatTypes'

const canonicalSpellId = (spellId: SpellId): CanonicalSpellId => SPELLS[spellId].id

/** Offensive/target-bound spells require the currently spawned enemy. */
export const spellRequiresEnemyTarget = (spell: SpellDefinition | SpellId) => {
  const definition = typeof spell === 'string' ? SPELLS[spell] : spell
  return Boolean(definition?.effects.some((effect) => effect.target === 'opponent'))
}

export type SpellCastFailure = 'unknown' | 'locked' | 'stunned' | 'silenced' | 'inactive' | 'not-in-loadout' | 'no-target' | 'cooldown' | 'mana' | 'casting'

export type SpellStartFailure = Exclude<SpellCastFailure, 'casting'>

export type ManualSpellRequestResult =
  | { ok: true; action: 'started' | 'interrupted-and-started' | 'queued' | 'queue-cancelled' | 'already-casting' }
  | { ok: false; reason: SpellCastFailure }

export interface SpellRequestOptions { ignoreCombatLoadout?: boolean; castOrigin?: ArcaneCoreCastOrigin }

export const isSpellInActiveCombatLoadout = (state: Pick<GameState, 'combat'>, spellId: SpellId) => {
  const canonicalId = SPELLS[spellId]?.id
  return Boolean(canonicalId && state.combat.activeSpellLoadout?.slots.some((slot) => slot.spellId === canonicalId))
}

export const getSpellStartFailure = (state: GameState, spellId: SpellId, options: SpellRequestOptions = {}): SpellStartFailure | null => {
  const spell = SPELLS[spellId]
  if (!spell) return 'unknown'
  if (!isSpellUnlocked(state, spellId)) return 'locked'
  if (actorCannotAct(state, 'player')) return 'stunned'
  if (actorCannotCastSpells(state, 'player')) return 'silenced'
  if (!state.combat.active) return 'inactive'
  if (!options.ignoreCombatLoadout && !isSpellInActiveCombatLoadout(state, spell.id)) return 'not-in-loadout'
  if (spellRequiresEnemyTarget(spell) && !state.combat.enemyId) return 'no-target'
  if (!state.debug.ignoreSpellCooldowns && (state.combat.spellCooldowns[spell.id] ?? 0) > 0) return 'cooldown'
  const manaCost = getEffectiveManaCost(state, spell.manaCost)
  const castOrigin = options.castOrigin ?? (state.combat.queuedPlayerSpellId === spell.id ? 'manual-queued' : 'auto')
  const v6Preview = getArcaneCoreV6CastModifiers(state, { origin: castOrigin, spellId: spell.id, loadoutSlotIndex: state.combat.activeSpellLoadout?.slots.findIndex((slot) => slot.spellId === spell.id) ?? null, damaging: spell.effects.some((effect) => effect.type === 'deal-damage'), manaCost, maxMana: state.player.maxMana, playerMana: state.player.mana, enemyHealthPercent: state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) * 100 }, true)
  const requiredMana = Math.max(1, Math.ceil(manaCost * v6Preview.manaCostMultiplier))
  if (!state.debug.infiniteMana && !isArcaneCoreSpellFree(state) && !v6Preview.free && !hasEnoughResource(state.player.mana, requiredMana)) return 'mana'
  return null
}

/** Start eligibility intentionally includes the active-cast blocker for callers
 * that only want to know whether a Spell can begin without an interrupt. */
export const getSpellCastFailure = (state: GameState, spellId: SpellId, options: SpellRequestOptions = {}): SpellCastFailure | null => {
  if (state.combat.pendingPlayerSpellCast) return 'casting'
  return getSpellStartFailure(state, spellId, options)
}

export const notifySpellCastFailure = (state: GameState, spellId: SpellId, failure: SpellCastFailure) => {
  const spell = SPELLS[spellId]
  if (failure === 'stunned') pushNotification(state, 'Cannot cast while Stunned.', 'warning')
  else if (failure === 'silenced') pushNotification(state, 'Cannot cast while Silenced.', 'warning')
  else if (failure === 'casting') pushNotification(state, 'A Spell is already being cast.', 'warning')
  else if (failure === 'cooldown' && spell) pushNotification(state, `${spell.name} is cooling down`, 'warning')
  else if (failure === 'mana' && spell) pushNotification(state, 'Not enough Mana', 'warning')
  else if (failure === 'inactive') pushNotification(state, 'Enter combat before using that spell', 'warning')
  else if (failure === 'not-in-loadout') pushNotification(state, 'That Spell is not in the active Combat Loadout.', 'warning')
  else if (failure === 'no-target') pushNotification(state, 'Enter combat before using that spell', 'warning')
}

const reportSpellFailure = (state: GameState, spellId: CanonicalSpellId, failure: 'mana' | 'no-target', uiEvents?: CombatEventSink) => {
  uiEvents?.push({ source: { kind: 'player' }, sourceKind: 'spell', dungeonId: state.combat.dungeonId ?? undefined, target: state.combat.enemyId ? 'enemy' : undefined, targetMonsterId: state.combat.enemyId ?? undefined, category: 'system', sourceId: 'spell-cast-failed', spellId, failure, attemptedAmount: failure === 'mana' ? getEffectiveManaCost(state, SPELLS[spellId].manaCost) : undefined })
}

const getSpellCastRate = (state: GameState) => {
  if (actorCannotAct(state, 'player')) return 0
  const rate = 1 + getCombatModifiers(state, 'player', 'action-speed-percent', { sourceTags: ['spell', 'magic'] })
  return Number.isFinite(rate) ? Math.max(0, rate) : 0
}

export const getPlayerSpellCastRate = getSpellCastRate

const getCastWorkMultiplier = (state: GameState) => state.combat.playerStatuses.some((status) => status.statusId === 'gust') ? 0.7 : 1

const startSpellCast = (state: GameState, spellId: SpellId, quiet: boolean, uiEvents?: CombatEventSink, options: SpellRequestOptions = {}) => {
  const spell = SPELLS[spellId]
  const failure = getSpellCastFailure(state, spellId, options)
  if (!spell || failure) {
    if (failure === 'mana' || failure === 'no-target') reportSpellFailure(state, spell.id, failure, uiEvents)
    return false
  }
  const canonicalId = spell.id
  const baseManaCost = getEffectiveManaCost(state, spell.manaCost)
  const castOrigin = options.castOrigin ?? 'auto'
  const loadoutSlotIndex = state.combat.activeSpellLoadout?.slots.findIndex((slot) => slot.spellId === spell.id) ?? -1
  const v6Preview = getArcaneCoreV6CastModifiers(state, { origin: castOrigin, spellId: spell.id, loadoutSlotIndex: loadoutSlotIndex >= 0 ? loadoutSlotIndex : null, damaging: spell.effects.some((effect) => effect.type === 'deal-damage'), manaCost: baseManaCost, maxMana: state.player.maxMana, playerMana: state.player.mana, enemyHealthPercent: state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) * 100 }, true)
  const free = isArcaneCoreSpellFree(state) || v6Preview.free
  const manaCost = Math.max(1, Math.ceil(baseManaCost * v6Preview.manaCostMultiplier))
  const gustMultiplier = getCastWorkMultiplier(state)
  const multiplier = gustMultiplier / Math.max(0.1, v6Preview.actionSpeedMultiplier)
  const castWorkMs = spell.castTimeMs * multiplier
  state.combat.pendingPlayerSpellCast = {
    spellId: canonicalId,
    targetInstanceKey: spellRequiresEnemyTarget(spell) ? state.combat.enemyInstanceKey : null,
    remainingWorkMs: castWorkMs,
    castWorkMs,
    manaCostSnapshot: manaCost,
    arcaneCoreFree: free,
    castWorkMultiplier: multiplier,
    castOrigin,
    loadoutSlotIndex: loadoutSlotIndex >= 0 ? loadoutSlotIndex : null,
    arcaneCoreActionSpeedMultiplier: v6Preview.actionSpeedMultiplier,
    arcaneCoreManaCostMultiplier: v6Preview.manaCostMultiplier,
    arcaneCoreEffectivenessMultiplier: v6Preview.effectivenessMultiplier,
    arcaneCoreCritChanceBonus: v6Preview.critChanceBonus,
    arcaneCoreCritDamageBonus: v6Preview.critDamageBonus,
    arcaneCoreGuaranteedCrit: v6Preview.guaranteedCrit,
    castWasGust: gustMultiplier < 1,
  }
  if (!quiet) pushNotification(state, `${spell.name} casting`, 'info')
  return true
}

export type PendingSpellCancelReason = 'manual-interrupt' | 'target-lost' | 'combat-ended' | 'player-defeated'

/**
 * Cancels committed cast work without invoking any successful-cast pathway.
 * Mana, cooldowns, statuses, Arcane Core counters, Gust and Static are all
 * committed only by resolvePlayerSpellCast, so cancellation is deliberately
 * just a pending-work clear.
 */
export const cancelPendingPlayerSpellCast = (state: GameState, _reason: PendingSpellCancelReason) => {
  if (!state.combat.pendingPlayerSpellCast) return false
  state.combat.pendingPlayerSpellCast = null
  return true
}

const canRemainQueued = (failure: SpellStartFailure) => failure === 'cooldown' || failure === 'mana' || failure === 'stunned' || failure === 'silenced' || failure === 'no-target'

/**
 * Handles player intent at the game boundary. A manual click either starts,
 * interrupts into, or replaces/cancels the one-slot manual queue; Auto-Cast
 * never writes this field.
 */
export const requestManualSpell = (state: GameState, spellId: SpellId, uiEvents?: CombatEventSink, options: SpellRequestOptions = {}): ManualSpellRequestResult => {
  const spell = SPELLS[spellId]
  if (!spell) return { ok: false, reason: 'unknown' }
  const canonicalId = spell.id
  const current = state.combat.pendingPlayerSpellCast
  if (current?.spellId === canonicalId) return { ok: true, action: 'already-casting' }
  if (state.combat.queuedPlayerSpellId === canonicalId) {
    state.combat.queuedPlayerSpellId = null
    return { ok: true, action: 'queue-cancelled' }
  }

  const failure = getSpellStartFailure(state, canonicalId, { ...options, castOrigin: 'manual-direct' })
  if (!failure) {
    const wasInterrupted = Boolean(current)
    if (wasInterrupted) cancelPendingPlayerSpellCast(state, 'manual-interrupt')
    const started = startSpellCast(state, canonicalId, false, uiEvents, { ...options, castOrigin: 'manual-direct' })
    if (started) {
      state.combat.queuedPlayerSpellId = null
      return { ok: true, action: wasInterrupted ? 'interrupted-and-started' : 'started' }
    }
    return { ok: false, reason: getSpellStartFailure(state, canonicalId, options) ?? 'unknown' }
  }

  if (canRemainQueued(failure) && state.combat.active) {
    state.combat.queuedPlayerSpellId = canonicalId
    return { ok: true, action: 'queued' }
  }
  notifySpellCastFailure(state, canonicalId, failure)
  return { ok: false, reason: failure }
}

const buildCompletionSource = (state: GameState, pending: PendingPlayerSpellCast, staticDamageBonus = 0, arcaneCoreCast?: Pick<ArcaneCoreV6CastModifiers, 'critChanceBonus' | 'critDamageBonus' | 'guaranteedCrit'>): CombatSource => {
  const spell = SPELLS[pending.spellId]
  const targetHas = (statusId: string) => state.combat.enemyStatuses.some((status) => status.statusId === statusId)
  let spellDamageMultiplier = 1
  if (pending.spellId === 'flame-burst' && targetHas('burning')) spellDamageMultiplier += 0.5
  if (pending.spellId === 'execution-flame') {
    if (state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) < 0.25) spellDamageMultiplier += 0.25
    if (targetHas('burning')) spellDamageMultiplier += 0.25
  }
  if (pending.spellId === 'frozen-current' && targetHas('chilled')) spellDamageMultiplier += 0.25
  spellDamageMultiplier += staticDamageBonus
  return { ...getSpellCombatSource(pending.spellId), spellDamageMultiplier, spellCritChanceBonus: (pending.spellId === 'lightning-spark' ? 0.25 : 0) + (arcaneCoreCast?.critChanceBonus ?? pending.arcaneCoreCritChanceBonus ?? 0) + (arcaneCoreCast?.guaranteedCrit || pending.arcaneCoreGuaranteedCrit ? 1 : 0), spellCritDamageBonus: (pending.spellId === 'thunderstrike' ? 0.5 : 0) + (arcaneCoreCast?.critDamageBonus ?? pending.arcaneCoreCritDamageBonus ?? 0), castOrigin: pending.castOrigin ?? 'auto', loadoutSlotIndex: pending.loadoutSlotIndex ?? null }
}

const scaleSpellEffect = (effect: CombatEffect, factor: number, statusDurationMultiplier = 1): CombatEffect => {
  switch (effect.type) {
    case 'deal-damage': return { ...effect, components: effect.components.map((component) => ({ ...component, magnitude: scaleMagnitude(component.magnitude, factor) })) }
    case 'heal': return { ...effect, magnitude: scaleMagnitude(effect.magnitude, factor) }
    case 'gain-barrier': return { ...effect, magnitude: scaleMagnitude(effect.magnitude, factor) }
    case 'apply-status': return { ...effect, durationMs: effect.durationMs === undefined || effect.durationMs === null ? effect.durationMs : effect.durationMs * statusDurationMultiplier, periodicEffects: effect.periodicEffects?.map((periodicEffect) => scaleSpellEffect(periodicEffect, factor, statusDurationMultiplier)) }
    default: return effect
  }
}

/** Resolves a committed cast at its exact timeline boundary. */
export const resolvePlayerSpellCast = (state: GameState, uiEvents?: CombatEventSink) => {
  const pending = state.combat.pendingPlayerSpellCast
  if (!pending) return false
  state.combat.pendingPlayerSpellCast = null
  const spell = SPELLS[pending.spellId]
  if (!spell) return false
  if (spellRequiresEnemyTarget(spell) && (!state.combat.enemyId || pending.targetInstanceKey !== state.combat.enemyInstanceKey)) return false
  const freeAtCompletion = isArcaneCoreSpellFree(state) || Boolean(pending.arcaneCoreFree)
  if (!state.debug.infiniteMana && !freeAtCompletion && !hasEnoughResource(state.player.mana, pending.manaCostSnapshot)) {
    reportSpellFailure(state, pending.spellId, 'mana', uiEvents)
    return false
  }
  const arcaneCoreCast = beginArcaneCoreSpellCast(state, spell.effects.some((effect) => effect.type === 'deal-damage'), { origin: pending.castOrigin ?? 'auto', spellId: pending.spellId, loadoutSlotIndex: pending.loadoutSlotIndex ?? null, damaging: spell.effects.some((effect) => effect.type === 'deal-damage'), manaCost: pending.manaCostSnapshot, maxMana: state.player.maxMana, playerMana: state.player.mana, enemyHealthPercent: state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) * 100 })
  const castIsFree = freeAtCompletion || arcaneCoreCast.free
  const paidMana = castIsFree ? 0 : pending.manaCostSnapshot
  if (!state.debug.infiniteMana) state.player.mana = stabilizeResourceValue(Math.max(0, state.player.mana - paidMana))
  state.combat.spellCooldowns[pending.spellId] = state.debug.ignoreSpellCooldowns ? 0 : spell.cooldownMs
  const hadGust = pending.castWasGust ?? pending.castWorkMultiplier < 1
  const hadStatic = spell.school === 'air' && spell.effects.some((effect) => effect.type === 'deal-damage') && state.combat.playerStatuses.some((status) => status.statusId === 'static')
  // Snapshot and consume the old Static before resolving effects. Static Charge
  // itself may apply a replacement Static, which must not be removed as part of
  // the old charge's cleanup.
  const staticDamageBonus = hadStatic ? 0.75 + (pending.spellId === 'thunderstrike' ? 0.25 : 0) : 0
  if (hadStatic) removeStatus(state, 'player', 'static')
  const effectivenessMultiplier = arcaneCoreCast.effectivenessMultiplier ?? pending.arcaneCoreEffectivenessMultiplier ?? 1
  const source = buildCompletionSource(state, pending, staticDamageBonus, arcaneCoreCast)
  const resolution = createCombatResolutionContext()
  resolution.arcaneCoreDamageMultiplier = arcaneCoreCast.damageMultiplier
  const wasChilled = state.combat.enemyStatuses.some((status) => status.statusId === 'chilled')
  const healingTideEmpowered = pending.spellId === 'healing-tide' && state.player.health / Math.max(1, state.player.maxHealth) < 0.25
  const effects = spell.effects.map((effect) => {
    let adjusted: CombatEffect = effect
    if (pending.spellId === 'frozen-current' && wasChilled && effect.type === 'apply-status' && effect.statusId === 'chilled') adjusted = { ...effect, statusId: 'frozen' as const, durationMs: 4000 }
    if (healingTideEmpowered && adjusted.type === 'heal') adjusted = { ...adjusted, magnitude: adjusted.magnitude.type === 'spell-power' ? { ...adjusted.magnitude, coefficient: adjusted.magnitude.coefficient * 1.25 } : adjusted.magnitude }
    if (healingTideEmpowered && adjusted.type === 'apply-status' && adjusted.periodicEffects) adjusted = { ...adjusted, periodicEffects: adjusted.periodicEffects.map((periodicEffect) => periodicEffect.type === 'heal' && periodicEffect.magnitude.type === 'spell-power' ? { ...periodicEffect, magnitude: { ...periodicEffect.magnitude, coefficient: periodicEffect.magnitude.coefficient * 1.25 } } : periodicEffect) }
    return scaleSpellEffect(adjusted, effectivenessMultiplier, arcaneCoreCast.statusDurationMultiplier ?? 1)
  })
  executeCombatEffects(state, effects, source, undefined, uiEvents, resolution)
  if (!state.debug.infiniteMana && arcaneCoreCast.manaRestoreFlat > 0) state.player.mana = stabilizeResourceValue(Math.min(state.player.maxMana, state.player.mana + arcaneCoreCast.manaRestoreFlat))
  if (!state.debug.infiniteMana && arcaneCoreCast.manaRefundPercent > 0 && paidMana > 0) state.player.mana = stabilizeResourceValue(Math.min(state.player.maxMana, state.player.mana + paidMana * arcaneCoreCast.manaRefundPercent))
  if (hadGust) removeStatus(state, 'player', 'gust')
  if (arcaneCoreCast.cooldownPulse) {
    const pulse = getArcaneCoreCooldownPulseReduction(state)
    if (pulse > 0) executeCombatEffects(state, [{ type: 'modify-cooldown', target: 'self', amountMs: -pulse }], { actor: 'player', kind: 'arcane-core', sourceId: 'control-rapid-cycle-10', tags: ['special'] }, undefined, uiEvents, resolution)
  }
  runCombatTriggers(state, 'player', 'on-spell-cast', { source, eventTarget: state.combat.enemyId ? 'enemy' : 'player', sourceTags: source.tags ?? ['spell', 'magic'], amount: paidMana }, executeCombatEffects, 0, [], uiEvents, resolution)
  appendLog(state, `${spell.name} cast${spell.effects.some((effect) => effect.type === 'deal-damage') ? ` for ${resolution.spellHealthDamageTotal ?? state.combat.lastDamageDealt}` : ''}.`)
  return true
}

export const castSpellInternal = (state: GameState, spellId: SpellId, quiet = false, uiEvents?: CombatEventSink, castOrigin: ArcaneCoreCastOrigin = 'auto') => startSpellCast(state, spellId, quiet, uiEvents, { castOrigin })

export const castSpellAction = (state: GameState, spellId: SpellId, uiEvents?: CombatEventSink) => {
  return requestManualSpell(state, spellId, uiEvents).ok
}

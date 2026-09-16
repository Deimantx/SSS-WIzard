import { SPELLS } from '../content/spells'
import { appendLog, pushNotification } from '../engine'
import { executeCombatEffects } from '../systems/combat/effectResolver'
import { actorCannotAct, actorCannotCastSpells } from '../systems/combat/statusRuntime'
import { isSpellUnlocked } from '../systems/spells'
import type { GameState, SpellId } from '../types'
import type { CombatEventSink } from '../systems/combat/combatTypes'
import { getEffectiveManaCost } from '../systems/combat/combatStats'
import { getSpellCombatSource } from '../systems/spells/spellSource'
import { hasEnoughResource, stabilizeResourceValue } from '../presentation/resources/resourcePresentation'
import { beginArcaneCoreSpellCast, getArcaneCoreCooldownPulseReduction, isArcaneCoreSpellFree } from '../systems/arcaneCore/arcaneCoreRuntime'
import { runCombatTriggers } from '../systems/combat/triggerRuntime'
import { createCombatResolutionContext, type CombatSource } from '../systems/combat/combatTypes'

const hasEnemyTarget = (spellId: SpellId) => SPELLS[spellId].effects.some((effect) => effect.target === 'opponent')

export type SpellCastFailure = 'unknown' | 'locked' | 'stunned' | 'silenced' | 'inactive' | 'no-target' | 'cooldown' | 'mana'

export const getSpellCastFailure = (state: GameState, spellId: SpellId): SpellCastFailure | null => {
  const spell = SPELLS[spellId]
  if (!spell) return 'unknown'
  if (!isSpellUnlocked(state, spellId)) return 'locked'
  if (actorCannotAct(state, 'player')) return 'stunned'
  if (actorCannotCastSpells(state, 'player')) return 'silenced'
  if (!state.combat.active) return 'inactive'
  if (hasEnemyTarget(spellId) && !state.combat.enemyId) return 'no-target'
  if (!state.debug.ignoreSpellCooldowns && state.combat.spellCooldowns[spellId] > 0) return 'cooldown'
  if (!state.debug.infiniteMana && !isArcaneCoreSpellFree(state) && !hasEnoughResource(state.player.mana, getEffectiveManaCost(state, spell.manaCost))) return 'mana'
  return null
}

export const notifySpellCastFailure = (state: GameState, spellId: SpellId, failure: SpellCastFailure) => {
  const spell = SPELLS[spellId]
  if (failure === 'stunned') pushNotification(state, 'Cannot cast while Stunned.', 'warning')
  else if (failure === 'silenced') pushNotification(state, 'Cannot cast while Silenced.', 'warning')
  else if (failure === 'cooldown' && spell) pushNotification(state, `${spell.name} is cooling down`, 'warning')
  else if (failure === 'mana' && spell) pushNotification(state, 'Not enough Mana', 'warning')
  else if (failure === 'inactive' || failure === 'no-target') pushNotification(state, 'Enter combat before using that spell', 'warning')
}

const reportManaStarvation = (state: GameState, spellId: SpellId, uiEvents?: CombatEventSink) => {
  const spell = SPELLS[spellId]
  if (!spell || !uiEvents) return
  uiEvents.push({
    source: { kind: 'player' },
    sourceKind: 'spell',
    dungeonId: state.combat.dungeonId ?? undefined,
    target: state.combat.enemyId ? 'enemy' : undefined,
    targetMonsterId: state.combat.enemyId ?? undefined,
    category: 'system',
    sourceId: 'spell-cast-failed',
    spellId,
    failure: 'mana',
    attemptedAmount: getEffectiveManaCost(state, spell.manaCost),
  })
}

export const castSpellInternal = (state: GameState, spellId: SpellId, quiet = false, uiEvents?: CombatEventSink) => {
  const spell = SPELLS[spellId]
  const failure = getSpellCastFailure(state, spellId)
  if (!spell || failure) {
    if (failure === 'mana') reportManaStarvation(state, spellId, uiEvents)
    return false
  }
  const manaCost = getEffectiveManaCost(state, spell.manaCost)
  const damaging = spell.effects.some((effect) => effect.type === 'deal-damage')
  const arcaneCoreCast = beginArcaneCoreSpellCast(state, damaging)
  const paidMana = arcaneCoreCast.free ? 0 : manaCost
  if (!state.debug.infiniteMana) state.player.mana = stabilizeResourceValue(Math.max(0, state.player.mana - paidMana))
  state.combat.spellCooldowns[spellId] = state.debug.ignoreSpellCooldowns ? 0 : spell.cooldownMs
  const source = getSpellCombatSource(spellId)
  const resolution = createCombatResolutionContext()
  resolution.arcaneCoreDamageMultiplier = arcaneCoreCast.damageMultiplier
  executeCombatEffects(state, spell.effects, source, undefined, uiEvents, resolution)
  if (arcaneCoreCast.cooldownPulse) {
    const pulse = getArcaneCoreCooldownPulseReduction(state)
    if (pulse > 0) executeCombatEffects(state, [{ type: 'modify-cooldown', target: 'self', amountMs: -pulse }], { actor: 'player', kind: 'arcane-core', sourceId: 'control-rapid-cycle-10', tags: ['special'] }, undefined, uiEvents, resolution)
  }
  runCombatTriggers(state, 'player', 'on-spell-cast', { source, eventTarget: state.combat.enemyId ? 'enemy' : 'player', sourceTags: source.tags ?? ['spell', 'magic'], amount: paidMana }, executeCombatEffects, 0, [], uiEvents, resolution)
  const damageEffect = damaging
  appendLog(state, `${spell.name} cast${damageEffect ? ` for ${state.combat.lastDamageDealt}` : ''}.`)
  if (!quiet) pushNotification(state, `${spell.name} cast`, 'info')
  return true
}

export const castSpellAction = (state: GameState, spellId: SpellId, uiEvents?: CombatEventSink) => {
  if (!isSpellUnlocked(state, spellId)) return false
  const spell = SPELLS[spellId]
  const failure = getSpellCastFailure(state, spellId)
  if (failure) { if (failure === 'mana') reportManaStarvation(state, spellId, uiEvents); notifySpellCastFailure(state, spellId, failure); return false }
  return castSpellInternal(state, spellId, false, uiEvents)
}

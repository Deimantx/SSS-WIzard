import { SPELLS } from '../content/spells'
import { appendLog, pushNotification } from '../engine'
import { executeCombatEffects } from '../systems/combat/effectResolver'
import { actorCannotAct } from '../systems/combat/statusRuntime'
import { isSpellUnlocked } from '../systems/spells'
import type { CombatSource, GameState, SpellId } from '../types'
import type { CombatEventSink } from '../systems/combat/combatTypes'

const hasEnemyTarget = (spellId: SpellId) => SPELLS[spellId].effects.some((effect) => effect.target === 'opponent')

export type SpellCastFailure = 'unknown' | 'locked' | 'stunned' | 'inactive' | 'no-target' | 'cooldown' | 'mana'

export const getSpellCastFailure = (state: GameState, spellId: SpellId): SpellCastFailure | null => {
  const spell = SPELLS[spellId]
  if (!spell) return 'unknown'
  if (!isSpellUnlocked(state, spellId)) return 'locked'
  if (actorCannotAct(state, 'player')) return 'stunned'
  if (!state.combat.active) return 'inactive'
  if (hasEnemyTarget(spellId) && !state.combat.enemyId) return 'no-target'
  if (!state.debug.ignoreSpellCooldowns && state.combat.spellCooldowns[spellId] > 0) return 'cooldown'
  if (!state.debug.infiniteMana && state.player.mana < spell.manaCost) return 'mana'
  return null
}

export const notifySpellCastFailure = (state: GameState, spellId: SpellId, failure: SpellCastFailure) => {
  const spell = SPELLS[spellId]
  if (failure === 'stunned') pushNotification(state, 'Cannot cast while Stunned.', 'warning')
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
    attemptedAmount: spell.manaCost,
  })
}

export const castSpellInternal = (state: GameState, spellId: SpellId, quiet = false, uiEvents?: CombatEventSink) => {
  const spell = SPELLS[spellId]
  const failure = getSpellCastFailure(state, spellId)
  if (!spell || failure) {
    if (failure === 'mana') reportManaStarvation(state, spellId, uiEvents)
    return false
  }
  if (!state.debug.infiniteMana) state.player.mana -= spell.manaCost
  state.combat.spellCooldowns[spellId] = state.debug.ignoreSpellCooldowns ? 0 : spell.cooldownMs
  const source: CombatSource = { actor: 'player', kind: 'spell', sourceId: spell.id, school: spell.school, tags: ['spell', 'magic', spell.school] }
  executeCombatEffects(state, spell.effects, source, undefined, uiEvents)
  const damageEffect = spell.effects.some((effect) => effect.type === 'deal-damage')
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

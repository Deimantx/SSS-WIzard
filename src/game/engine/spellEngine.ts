import { SPELLS } from '../content/spells'
import { appendLog, pushNotification } from '../engine'
import { executeCombatEffects } from '../systems/combat/effectResolver'
import { actorCannotAct } from '../systems/combat/statusRuntime'
import { isSpellUnlocked } from '../systems/spells'
import type { CombatSource, GameState, SpellId } from '../types'
import type { CombatUiEventSink } from '../systems/combat/combatTypes'

const hasEnemyTarget = (spellId: SpellId) => SPELLS[spellId].effects.some((effect) => effect.target === 'opponent')

export type SpellCastFailure = 'unknown' | 'locked' | 'stunned' | 'inactive' | 'no-target' | 'cooldown' | 'mana'

export const getSpellCastFailure = (state: GameState, spellId: SpellId): SpellCastFailure | null => {
  const spell = SPELLS[spellId]
  if (!spell) return 'unknown'
  if (!isSpellUnlocked(state, spellId)) return 'locked'
  if (actorCannotAct(state, 'player')) return 'stunned'
  if (!state.combat.active) return 'inactive'
  if (hasEnemyTarget(spellId) && !state.combat.enemyId) return 'no-target'
  if (state.combat.spellCooldowns[spellId] > 0) return 'cooldown'
  if (state.player.mana < spell.manaCost) return 'mana'
  return null
}

export const notifySpellCastFailure = (state: GameState, spellId: SpellId, failure: SpellCastFailure) => {
  const spell = SPELLS[spellId]
  if (failure === 'stunned') pushNotification(state, 'Cannot cast while Stunned.', 'warning')
  else if (failure === 'cooldown' && spell) pushNotification(state, `${spell.name} is cooling down`, 'warning')
  else if (failure === 'mana' && spell) pushNotification(state, 'Not enough Mana', 'warning')
  else if (failure === 'inactive' || failure === 'no-target') pushNotification(state, 'Enter combat before using that spell', 'warning')
}

export const castSpellInternal = (state: GameState, spellId: SpellId, quiet = false, uiEvents?: CombatUiEventSink) => {
  const spell = SPELLS[spellId]
  if (!spell || getSpellCastFailure(state, spellId)) return false
  state.player.mana -= spell.manaCost
  state.combat.spellCooldowns[spellId] = spell.cooldownMs
  const source: CombatSource = { actor: 'player', kind: 'spell', sourceId: spell.id, school: spell.school, tags: ['spell', 'magic', spell.school] }
  executeCombatEffects(state, spell.effects, source, undefined, uiEvents)
  const damageEffect = spell.effects.some((effect) => effect.type === 'deal-damage')
  appendLog(state, `${spell.name} cast${damageEffect ? ` for ${state.combat.lastDamageDealt}` : ''}.`)
  if (!quiet) pushNotification(state, `${spell.name} cast`, 'info')
  return true
}

export const castSpellAction = (state: GameState, spellId: SpellId, uiEvents?: CombatUiEventSink) => {
  if (!isSpellUnlocked(state, spellId)) return false
  const spell = SPELLS[spellId]
  const failure = getSpellCastFailure(state, spellId)
  if (failure) { notifySpellCastFailure(state, spellId, failure); return false }
  return castSpellInternal(state, spellId, false, uiEvents)
}

import { SPELLS } from '../content/spells'
import { appendLog, pushNotification } from '../engine'
import { executeCombatEffects } from '../systems/combat/effectResolver'
import type { CombatSource, GameState, SpellId } from '../types'

const hasEnemyTarget = (spellId: SpellId) => SPELLS[spellId].effects.some((effect) => effect.type === 'deal-damage' || effect.type === 'apply-status' && effect.target === 'opponent')

export const castSpellInternal = (state: GameState, spellId: SpellId, quiet = false) => {
  const spell = SPELLS[spellId]
  if (!spell || state.player.mana < spell.manaCost || state.combat.spellCooldowns[spellId] > 0) return false
  if (hasEnemyTarget(spellId) && !state.combat.enemyId) return false
  state.player.mana -= spell.manaCost
  state.combat.spellCooldowns[spellId] = spell.cooldownMs
  const source: CombatSource = { actor: 'player', kind: 'spell', sourceId: spell.id, school: spell.school, tags: ['spell', 'magic', spell.school] }
  executeCombatEffects(state, spell.effects, source)
  const damageEffect = spell.effects.some((effect) => effect.type === 'deal-damage')
  appendLog(state, `${spell.name} cast${damageEffect ? ` for ${state.combat.lastDamageDealt}` : ''}.`)
  if (!quiet) pushNotification(state, `${spell.name} cast`, 'info')
  return true
}

export const castSpellAction = (state: GameState, spellId: SpellId) => {
  if (!state.progress.unlockedSpells.includes(spellId)) return false
  const spell = SPELLS[spellId]
  if (state.combat.spellCooldowns[spellId] > 0) { pushNotification(state, `${spell.name} is cooling down`, 'warning'); return false }
  if (state.player.mana < spell.manaCost) { pushNotification(state, 'Not enough Mana', 'warning'); return false }
  if (!state.combat.active || (hasEnemyTarget(spellId) && !state.combat.enemyId)) { pushNotification(state, 'Enter combat before using that spell', 'warning'); return false }
  return castSpellInternal(state, spellId)
}

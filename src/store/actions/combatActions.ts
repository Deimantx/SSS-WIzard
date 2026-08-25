import { SPELLS } from '../../game/content/spells'
import { appendLog, pushNotification, spellDamageMultiplier } from '../../game/engine'
import { addStatus, applyBarrier, damageEnemy } from '../../game/systems/combat/combatRuntime'
import type { GameState, SpellEffect, SpellId } from '../../game/types'

const applySpellEffect = (state: GameState, spellId: SpellId, effect: SpellEffect) => {
  const spell = SPELLS[spellId]
  if (effect.type === 'damage') damageEnemy(state, (effect.amount + state.schools[spell.school].level * 2) * spellDamageMultiplier(state, spell.school), 'spell')
  if (effect.type === 'heal') state.player.health = Math.min(state.player.maxHealth, state.player.health + effect.amount)
  if (effect.type === 'barrier') applyBarrier(state, effect.amount)
  if (effect.type === 'dot') {
    damageEnemy(state, 10 * spellDamageMultiplier(state, spell.school), 'spell')
    addStatus(state.combat.enemyStatuses, { id: effect.statusId, remainingMs: effect.durationMs, value: effect.damagePerTick, tickIntervalMs: effect.tickMs, nextTickMs: effect.tickMs })
  }
  if (effect.type === 'buff') addStatus(state.combat.playerStatuses, { id: effect.statusId, remainingMs: effect.durationMs, value: effect.value })
}

export const castSpellAction = (state: GameState, spellId: SpellId) => {
  if (!state.progress.unlockedSpells.includes(spellId)) return false
  const spell = SPELLS[spellId]
  if (state.combat.spellCooldowns[spellId] > 0) { pushNotification(state, `${spell.name} is cooling down`, 'warning'); return false }
  if (state.player.mana < spell.manaCost) { pushNotification(state, 'Not enough Mana', 'warning'); return false }
  if (!state.combat.active || ((spell.type === 'damage' || spell.type === 'dot') && !state.combat.enemyId)) { pushNotification(state, 'Enter combat before using that spell', 'warning'); return false }
  state.player.mana -= spell.manaCost
  state.combat.spellCooldowns[spellId] = spell.cooldownMs
  applySpellEffect(state, spellId, spell.effect)
  appendLog(state, `${spell.name} cast${spell.type === 'damage' || spell.type === 'dot' ? ` for ${state.combat.lastDamageDealt}` : ''}.`)
  pushNotification(state, `${spell.name} cast`, 'info')
  return true
}


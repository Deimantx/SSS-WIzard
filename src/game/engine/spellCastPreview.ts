import { SPELLS } from '../content/spells'
import { getEffectiveManaCost } from '../systems/combat/combatStats'
import { isArcaneCoreSpellFree } from '../systems/arcaneCore/arcaneCoreRuntime'
import { getArcaneCoreCastModifiers, type ArcaneCoreCastOrigin } from '../systems/arcaneCore/arcaneCoreMechanicRuntime'
import { getArtifactPreCastManaMultiplier } from '../systems/artifacts/artifactProgression'
import type { CanonicalSpellId, GameState, SpellId } from '../types'

/**
 * The single Mana/Arcane Core preview used by both real cast admission and
 * automation inspection. Keeping this calculation shared prevents the UI from
 * claiming that a spell is affordable when the cast engine would reject it.
 */
export const getSpellManaPreview = (state: GameState, requestedSpellId: SpellId, castOrigin: ArcaneCoreCastOrigin = 'auto') => {
  const spell = SPELLS[requestedSpellId]
  if (!spell) return null
  const spellId: CanonicalSpellId = spell.id
  const baseManaCost = getEffectiveManaCost(state, spell.manaCost)
  const loadoutSlotIndex = state.combat.activeSpellLoadout?.slots.findIndex((slot) => slot.spellId === spellId) ?? -1
  const context = {
    origin: castOrigin,
    spellId,
    loadoutSlotIndex: loadoutSlotIndex >= 0 ? loadoutSlotIndex : null,
    damaging: spell.effects.some((effect) => effect.type === 'deal-damage'),
    nominalManaCost: baseManaCost,
    maxMana: state.player.maxMana,
    playerMana: state.player.mana,
    enemyHealthPercent: state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) * 100,
  }
  const initialModifiers = getArcaneCoreCastModifiers(state, context, true)
  const initialFree = isArcaneCoreSpellFree(state) || initialModifiers.free
  const initialManaCost = Math.max(1, Math.ceil(baseManaCost * initialModifiers.manaCostMultiplier))
  const manaCost = Math.max(1, Math.ceil(initialManaCost * getArtifactPreCastManaMultiplier(state)))
  const free = initialFree
  const modifiers = getArcaneCoreCastModifiers(state, { ...context, paidMana: free ? 0 : manaCost, manaBeforeCost: state.player.mana, manaAfterCost: Math.max(0, state.player.mana - (free ? 0 : manaCost)) }, true)
  return { spellId, baseManaCost, manaCost, free, modifiers }
}

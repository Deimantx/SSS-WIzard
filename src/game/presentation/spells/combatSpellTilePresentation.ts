import { SPELLS } from '../../content/spells/spells'
import { getSpellAutoCastFocusCost, formatSpellRank, type SpellRank } from '../../systems/spells'
import type { CanonicalSpellId } from '../../types'
import { formatTime } from '../../utils'
import { getEffectiveSpellCooldown, getEffectiveSpellManaCost, type SpellPresentationState } from './effectiveSpellPresentation'

export interface CombatSpellTilePresentation {
  spellId: CanonicalSpellId
  rank: SpellRank
  rankLabel: string
  manaCost: number
  castTimeLabel: string
  cooldownMs: number
  cooldownLabel: string
  autoCastFocus: number
}

/** Cheap, build-only read model for the visible Combat Spell tile. */
export const buildCombatSpellTilePresentation = (state: SpellPresentationState, spellId: CanonicalSpellId, rank: SpellRank): CombatSpellTilePresentation => {
  const spell = SPELLS[spellId]
  const mana = getEffectiveSpellManaCost(state, spellId)
  const cooldown = getEffectiveSpellCooldown(state, spellId)
  return {
    spellId,
    rank,
    rankLabel: formatSpellRank(rank),
    manaCost: mana.effective,
    castTimeLabel: formatTime(spell.castTimeMs),
    cooldownMs: cooldown.effective,
    cooldownLabel: formatTime(cooldown.effective),
    autoCastFocus: getSpellAutoCastFocusCost(state, spellId) ?? 0,
  }
}

export interface CombatSpellTileLiveState {
  playerMana: number
  cooldownActive: boolean
  playerCannotAct: boolean
  playerCannotCast: boolean
  combatActive: boolean
  inLoadout: boolean
  hasTarget: boolean
  ignoreCooldowns: boolean
  infiniteMana: boolean
  unlocked: boolean
}

/** Cheap visible blocker read model. Cast requests still run canonical validation. */
export const getCombatSpellTileBlocker = (spellId: CanonicalSpellId, presentation: Pick<CombatSpellTilePresentation, 'manaCost'>, live: CombatSpellTileLiveState) => {
  const spell = SPELLS[spellId]
  if (!spell || !live.unlocked) return 'locked' as const
  if (live.playerCannotAct) return 'stunned' as const
  if (live.playerCannotCast) return 'silenced' as const
  if (!live.combatActive) return 'inactive' as const
  if (!live.inLoadout) return 'not-in-loadout' as const
  if (spell.effects.some((effect) => effect.target === 'opponent') && !live.hasTarget) return 'no-target' as const
  if (!live.ignoreCooldowns && live.cooldownActive) return 'cooldown' as const
  if (!live.infiniteMana && live.playerMana < Math.max(1, Math.ceil(presentation.manaCost))) return 'mana' as const
  return null
}

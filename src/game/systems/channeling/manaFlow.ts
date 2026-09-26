import { SPELLS } from '../../content/spells/spells'
import { getEffectiveManaCost } from '../combat/combatStats'
import { playerManaRegenPerSecond } from '../mana/playerMana'
import type { GameState, ManaDemandSource, ManaFlowBreakdown } from '../../types'
import { isSpellUnlocked } from '../spells'

const FLOW_EPSILON = 0.05

/** Player Mana is combat-local now; Tower work consumes Arcane Flux instead. */
export const getManaDemandBreakdown = (state: GameState): ManaDemandSource[] => {
  if (!state.combat.active) return []
  return (state.combat.activeSpellLoadout?.slots ?? []).filter((slot) => slot.autoCast).flatMap((slot) => {
    const spell = SPELLS[slot.spellId]
    if (!spell || !isSpellUnlocked(state, spell.id) || spell.cooldownMs <= 0) return []
    return [{ id: `autocast-${spell.id}`, label: `Auto-Cast · ${spell.name}`, manaPerSecond: getEffectiveManaCost(state, spell.manaCost) / (spell.cooldownMs / 1000), estimated: true }]
  })
}

export const getManaFlowBreakdown = (state: GameState): ManaFlowBreakdown => {
  const production = playerManaRegenPerSecond(state)
  const demandSources = getManaDemandBreakdown(state)
  const demand = demandSources.reduce((total, source) => total + source.manaPerSecond, 0)
  const net = production - demand
  const stateName = net > FLOW_EPSILON ? 'surplus' : net < -FLOW_EPSILON ? 'deficit' : 'balanced'
  let etaMs: number | null = null
  let etaKind: ManaFlowBreakdown['etaKind'] = null
  if (stateName === 'surplus' && state.player.mana < state.player.maxMana) { etaMs = ((state.player.maxMana - state.player.mana) / net) * 1000; etaKind = 'full' }
  else if (stateName === 'deficit' && state.player.mana <= 0) etaKind = 'starved'
  else if (stateName === 'deficit') { etaMs = (state.player.mana / Math.abs(net)) * 1000; etaKind = 'empty' }
  return { production, demand, net, state: stateName, demandSources, etaMs, etaKind }
}

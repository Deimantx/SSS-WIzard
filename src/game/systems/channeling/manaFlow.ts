import { SCHOOLS } from '../../content/schools/schools'
import { SPELLS } from '../../content/spells/spells'
import { BALANCE } from '../../core/balance/balance'
import { getManaRegenBreakdown } from '../../engine/channelingEngine'
import type { GameState, ManaDemandSource, ManaFlowBreakdown } from '../../types'

const FLOW_EPSILON = 0.05

export const getManaDemandBreakdown = (state: GameState): ManaDemandSource[] => {
  const sources: ManaDemandSource[] = []
  const condense = state.activities.condense
  if (condense.running && BALANCE.condense.durationMs > 0) {
    sources.push({
      id: 'condensation',
      label: `Condensation · ${SCHOOLS[condense.element].name}`,
      manaPerSecond: BALANCE.condense.manaCost / (BALANCE.condense.durationMs / 1000),
    })
  }

  const research = state.activities.research
  if (research.running && research.remainingQuantity > 0 && research.durationPerItemMs > 0) {
    sources.push({
      id: 'research',
      label: 'Research',
      manaPerSecond: research.manaPerItem / (research.durationPerItemMs / 1000),
    })
  }

  if (state.combat.active) {
    Object.entries(state.activities.autoCast).forEach(([id, enabled]) => {
      if (!enabled) return
      const spell = SPELLS[id as keyof typeof SPELLS]
      if (!spell || !state.progress.unlockedSpells.includes(spell.id) || spell.cooldownMs <= 0) return
      sources.push({
        id: `autocast-${spell.id}`,
        label: `Auto-Cast · ${spell.name}`,
        manaPerSecond: spell.manaCost / (spell.cooldownMs / 1000),
        estimated: true,
      })
    })
  }

  return sources
}

export const getManaFlowBreakdown = (state: GameState): ManaFlowBreakdown => {
  const production = getManaRegenBreakdown(state).total
  const demandSources = getManaDemandBreakdown(state)
  const demand = demandSources.reduce((total, source) => total + source.manaPerSecond, 0)
  const net = production - demand
  const stateName = net > FLOW_EPSILON ? 'surplus' : net < -FLOW_EPSILON ? 'deficit' : 'balanced'
  let etaMs: number | null = null
  let etaKind: ManaFlowBreakdown['etaKind'] = null

  if (stateName === 'surplus') {
    if (state.player.mana >= state.player.maxMana) etaKind = 'full'
    else if (state.player.maxMana > state.player.mana) {
      etaMs = ((state.player.maxMana - state.player.mana) / net) * 1000
      etaKind = 'full'
    }
  } else if (stateName === 'deficit') {
    if (state.player.mana <= 0) etaKind = 'starved'
    else {
      etaMs = (state.player.mana / Math.abs(net)) * 1000
      etaKind = 'empty'
    }
  }

  return { production, demand, net, state: stateName, demandSources, etaMs, etaKind }
}

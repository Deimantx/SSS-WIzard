import { BALANCE } from '../../core/balance/balance'
import { getEquipmentStats, type EquipmentStatsState } from '../../core/equipment/equipmentStats'
import { getArcaneCoreDynamicSpellPower } from '../arcaneCore/arcaneCoreRuntime'
import type { GameState } from '../../types'

export interface SpellPowerBreakdown {
  base: number
  equipment: number
  permanent?: number
  total: number
}

/** Canonical Spell Power: authored base plus effective equipped-build Spell Power. */
export type SpellPowerState = EquipmentStatsState & {
  activities?: Pick<GameState['activities'], 'channeling' | 'research' | 'transmutation' | 'autoCast'>
  progress?: Pick<GameState['progress'], 'spellRanks'>
  player?: Partial<Pick<GameState['player'], 'health' | 'maxHealth' | 'mana' | 'maxMana' | 'maxFocus'>>
}

export const getSpellPowerBreakdown = (state: SpellPowerState): SpellPowerBreakdown => {
  const base = BALANCE.player.baseSpellPower
  const equipment = getEquipmentStats(state).spellPower ?? 0
  const dynamic = state.arcaneCore && state.activities && state.progress && state.player ? getArcaneCoreDynamicSpellPower(state as never) : 0
  return { base, equipment: equipment + dynamic, total: Math.max(0, base + equipment + dynamic) }
}

export const getSpellPower = (state: EquipmentStatsState) => getSpellPowerBreakdown(state).total

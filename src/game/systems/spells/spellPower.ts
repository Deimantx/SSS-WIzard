import { BALANCE } from '../../core/balance/balance'
import { getEquipmentStats, type EquipmentStatsState } from '../../core/equipment/equipmentStats'

export interface SpellPowerBreakdown {
  base: number
  equipment: number
  permanent?: number
  total: number
}

/** Canonical Spell Power: authored base plus effective equipped-build Spell Power. */
export const getSpellPowerBreakdown = (state: EquipmentStatsState): SpellPowerBreakdown => {
  const base = BALANCE.player.baseSpellPower
  const equipment = getEquipmentStats(state).spellPower ?? 0
  return { base, equipment, total: Math.max(0, base + equipment) }
}

export const getSpellPower = (state: EquipmentStatsState) => getSpellPowerBreakdown(state).total

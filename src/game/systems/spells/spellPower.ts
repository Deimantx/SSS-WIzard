import { BALANCE } from '../../core/balance/balance'
import { getEquipmentStats, type EquipmentStatsState } from '../../core/equipment/equipmentStats'
import { getArcaneCoreDynamicSpellPower } from '../arcaneCore/arcaneCoreRuntime'

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
  const dynamic = 'activities' in state && 'progress' in state && 'player' in state ? getArcaneCoreDynamicSpellPower(state as never) : 0
  return { base, equipment: equipment + dynamic, total: Math.max(0, base + equipment + dynamic) }
}

export const getSpellPower = (state: EquipmentStatsState) => getSpellPowerBreakdown(state).total

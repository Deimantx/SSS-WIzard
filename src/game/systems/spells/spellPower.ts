import { BALANCE } from '../../core/balance/balance'
import { getEquipmentStats, type EquipmentStatsState } from '../../core/equipment/equipmentStats'
import type { GameState } from '../../types'

export interface SpellPowerBreakdown {
  base: number
  equipment: number
  developerFlat: number
  equipmentPercent: number
  developerPercent: number
  permanent?: number
  total: number
}

/** Canonical Spell Power: authored base plus effective equipped-build Spell Power. */
export type SpellPowerState = EquipmentStatsState & {
  activities?: Pick<GameState['activities'], 'channeling' | 'research' | 'transmutation' | 'autoCast'>
  progress?: Pick<GameState['progress'], 'spellRanks'>
  player?: Partial<Pick<GameState['player'], 'health' | 'maxHealth' | 'mana' | 'maxMana'>>
}

export const getSpellPowerBreakdown = (state: SpellPowerState): SpellPowerBreakdown => {
  const base = BALANCE.player.baseSpellPower
  const stats = getEquipmentStats(state)
  const debug = (state as SpellPowerState & Partial<Pick<GameState, 'debug'>>).debug?.playerStats
  const equipment = stats.spellPower ?? 0
  const developerFlat = debug?.spellPowerFlat ?? 0
  const equipmentPercent = stats.spellPowerPct ?? 0
  const developerPercent = debug?.spellPowerPercent ?? 0
  const raw = Math.max(0, base + equipment + developerFlat)
  return { base, equipment, developerFlat, equipmentPercent, developerPercent, total: Math.max(0, raw * (1 + equipmentPercent + developerPercent)) }
}

export const getSpellPower = (state: EquipmentStatsState) => getSpellPowerBreakdown(state).total

import { BALANCE } from '../../core/balance/balance'
import { getEquipmentStats } from '../../core/equipment/equipmentStats'
import type { GameState } from '../../types'

export interface SpellPowerBreakdown {
  base: number
  equipment: number
  permanent?: number
  total: number
}

/** Canonical V1 Spell Power: authored base plus flat equipped Spell Power. */
export const getSpellPowerBreakdown = (state: Pick<GameState, 'equipment'>): SpellPowerBreakdown => {
  const base = BALANCE.player.baseSpellPower
  const equipment = getEquipmentStats(state).spellPower ?? 0
  return { base, equipment, total: Math.max(0, base + equipment) }
}

export const getSpellPower = (state: Pick<GameState, 'equipment'>) => getSpellPowerBreakdown(state).total

import { addEquipmentStats } from '../../core/equipment/equipmentStatAggregation'
import { getCrystalVariantStats } from '../../content/crystals/crystals'
import type { CrystalVariantId, EquipmentStats, GameState } from '../../types'

/** Canonical aggregate used by equipment, combat, resource and UI selectors. */
export const getEquippedCrystalStats = (state: Pick<GameState, 'crystals'>): EquipmentStats => {
  const total: EquipmentStats = {}
  state.crystals.equippedSlots.forEach((variantId) => {
    if (variantId) addEquipmentStats(total, getCrystalVariantStats(variantId as CrystalVariantId))
  })
  return total
}


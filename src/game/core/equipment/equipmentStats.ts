import { ITEMS } from '../../content/items/items'
import type { EquipmentStats, GameState } from '../../types'

/** Aggregates authored equipped-item stats for every derived combat/system selector. */
export const getEquipmentStats = (state: Pick<GameState, 'equipment'>): EquipmentStats => {
  const total: EquipmentStats = {}
  Object.values(state.equipment).forEach((itemId) => {
    if (!itemId || !ITEMS[itemId]) return
    const stats = ITEMS[itemId].stats ?? {}
    Object.entries(stats).forEach(([key, value]) => {
      if (key === 'resistances' && value && typeof value === 'object') {
        const resistances = (total.resistances ?? {}) as NonNullable<EquipmentStats['resistances']>
        Object.entries(value as Record<string, number>).forEach(([damageType, resistance]) => {
          resistances[damageType as keyof typeof resistances] = (resistances[damageType as keyof typeof resistances] ?? 0) + (resistance ?? 0)
        })
        total.resistances = resistances
        return
      }
      total[key as keyof EquipmentStats] = ((total[key as keyof EquipmentStats] ?? 0) as number + (value ?? 0)) as never
    })
  })
  return total
}

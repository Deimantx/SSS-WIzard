import { ITEMS } from '../../content/items/items'
import type { CombatModifier, CombatTag, DamageType, EquipmentStats, GameState, ModifierKey } from '../../types'

export interface EquipmentModifierContext {
  sourceKinds?: CombatModifier['sourceKinds']
  sourceTags?: CombatTag[]
  damageType?: DamageType
  statusTags?: CombatTag[]
}

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

/** Sums unconditional authored Equipment modifiers for stable sheet read models. */
export const getEquipmentCombatModifierTotal = (state: Pick<GameState, 'equipment'>, key: ModifierKey, context: EquipmentModifierContext = {}) => {
  const sourceTags = context.sourceTags ?? []
  return Object.values(state.equipment).reduce((total, itemId) => {
    const modifiers = itemId ? ITEMS[itemId]?.combat?.modifiers ?? [] : []
    return total + modifiers.reduce((itemTotal, modifier) => {
      if (modifier.key !== key || modifier.condition) return itemTotal
      if (context.sourceKinds?.length && (!modifier.sourceKinds || !context.sourceKinds.some((kind) => modifier.sourceKinds?.includes(kind)))) return itemTotal
      if (modifier.sourceTags?.length && !modifier.sourceTags.every((tag) => sourceTags.includes(tag))) return itemTotal
      if (context.damageType && modifier.damageTypes?.length && !modifier.damageTypes.includes(context.damageType)) return itemTotal
      if (context.statusTags && modifier.statusTags?.length && !modifier.statusTags.every((tag) => context.statusTags?.includes(tag))) return itemTotal
      return itemTotal + modifier.value
    }, 0)
  }, 0)
}

import type { EquipmentStats, ItemDefinition } from '../../game/types'
import { formatStat, friendlyStatLabel } from '../../components/ui/item/ItemTooltip'

export interface EquipmentComparisonRow {
  key: string
  label: string
  selectedValue: string
  equippedValue: string
  delta: string
  direction: 'positive' | 'negative' | 'neutral'
}

export function getEquipmentComparison(selected: ItemDefinition, equipped: ItemDefinition | null): EquipmentComparisonRow[] {
  const selectedStats = selected.stats ?? {}
  const equippedStats = equipped?.stats ?? {}
  const flatten = (stats: EquipmentStats) => Object.fromEntries(Object.entries(stats).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object' ? Object.entries(value).map(([type, resistance]) => [`resistance-${type}`, Number(resistance)]) : [[key, Number(value)]])) as Record<string, number>
  const selectedFlat = flatten(selectedStats)
  const equippedFlat = flatten(equippedStats)
  const keys = [...new Set([...Object.keys(selectedFlat), ...Object.keys(equippedFlat)])]
  return keys.filter((key) => (selectedFlat[key] ?? 0) !== 0 || (equippedFlat[key] ?? 0) !== 0).map((key) => {
    const selectedValue = selectedFlat[key] ?? 0
    const equippedValue = equippedFlat[key] ?? 0
    const delta = selectedValue - equippedValue
    return { key, label: friendlyStatLabel(key), selectedValue: formatStat(key, selectedValue), equippedValue: formatStat(key, equippedValue), delta: formatStat(key, delta), direction: delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral' }
  })
}

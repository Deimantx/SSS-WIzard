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
  const keys = [...new Set([...Object.keys(selectedStats), ...Object.keys(equippedStats)])]
  return keys.filter((key) => (selectedStats[key as keyof EquipmentStats] ?? 0) !== 0 || (equippedStats[key as keyof EquipmentStats] ?? 0) !== 0).map((key) => {
    const selectedValue = Number(selectedStats[key as keyof EquipmentStats] ?? 0)
    const equippedValue = Number(equippedStats[key as keyof EquipmentStats] ?? 0)
    const delta = selectedValue - equippedValue
    return { key, label: friendlyStatLabel(key), selectedValue: formatStat(key, selectedValue), equippedValue: formatStat(key, equippedValue), delta: formatStat(key, delta), direction: delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral' }
  })
}

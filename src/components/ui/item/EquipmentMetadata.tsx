import { EQUIPMENT_BUILD_TAG_LABELS, formatEquipmentTier } from '../../../game/content/items/equipmentBalance'
import type { ItemDefinition } from '../../../game/types'

type EquipmentMetadataItem = Pick<ItemDefinition, 'kind' | 'equipmentTier' | 'buildTags'>

export function EquipmentMetadata({ item, className = '' }: { item: EquipmentMetadataItem; className?: string }) {
  if (item.kind !== 'equipment' || item.equipmentTier === undefined || !item.buildTags?.length) return null
  const tier = formatEquipmentTier(item.equipmentTier)
  const tags = item.buildTags.map((tag) => EQUIPMENT_BUILD_TAG_LABELS[tag])
  return <div className={`equipment-metadata ${className}`.trim()} aria-label={`Tier ${tier}. Build tags: ${tags.join(', ')}`}>
    <span className="equipment-tier-badge">TIER {tier}</span>
    <span className="equipment-build-tags">{item.buildTags.map((tag) => <span className="equipment-build-tag" key={tag}>{EQUIPMENT_BUILD_TAG_LABELS[tag]}</span>)}</span>
  </div>
}

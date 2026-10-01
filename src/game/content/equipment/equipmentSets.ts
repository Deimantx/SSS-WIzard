import { ARTIFACTS, ARTIFACT_ITEM_ORDER, isArtifactId } from '../artifacts/artifacts'
import { ITEMS } from '../items/items'
import type { ItemDefinition, ItemId } from '../../types'

export const validateEquipmentSetDefinitions = (items: Record<string, ItemDefinition> = ITEMS) => {
  const errors: string[] = []
  const artifactIds = new Set<ItemId>(ARTIFACT_ITEM_ORDER)
  ARTIFACT_ITEM_ORDER.forEach((itemId) => {
    if (!items[itemId] || items[itemId].kind !== 'equipment') errors.push(`${itemId}: Artifact group entry must be Equipment`)
    if (!isArtifactId(itemId) || !ARTIFACTS[itemId]) errors.push(`${itemId}: Artifact group entry is missing from ARTIFACTS`)
  })
  Object.entries(items).forEach(([itemId, item]) => {
    if (item.kind === 'equipment' && !artifactIds.has(itemId as ItemId)) errors.push(`${itemId}: non-Artifact Equipment is not allowed`)
  })
  return errors
}

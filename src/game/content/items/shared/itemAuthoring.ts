import type {
  InventoryMaterialSubtype,
  ItemDefinition,
  ItemId,
  SchoolId,
  ScreenId,
} from '../../../types'

/**
 * Shared authoring shape. Final inventory defaults are applied by the canonical
 * registry in ../items.ts so content files can stay focused on authored data.
 */
export type AuthoredItemDefinition = Omit<
  ItemDefinition,
  'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'
> & Partial<Pick<ItemDefinition, 'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'>>

export type AuthoredItemRegistry = Readonly<Record<string, AuthoredItemDefinition>>

export type AuthoredEquipmentDefinition = Omit<
  AuthoredItemDefinition,
  'kind' | 'category' | 'inventoryCategory' | 'source' | 'sourceNavigation'
> & Required<Pick<ItemDefinition, 'equipmentSlot' | 'equipmentTier' | 'buildTags' | 'equipmentBudgetProfile'>>

const MATERIAL_SUBTYPES: readonly InventoryMaterialSubtype[] = ['elemental', 'creature', 'ore', 'refined', 'arcane']

export const material = (
  id: ItemId,
  name: string,
  description: string,
  icon: string,
  color: string,
  category: ItemDefinition['category'],
  source: string,
  subtypeOrSchool?: InventoryMaterialSubtype | SchoolId,
  researchSchool?: SchoolId,
  sourceNavigation?: ScreenId,
): AuthoredItemDefinition => {
  const materialSubtype = subtypeOrSchool && MATERIAL_SUBTYPES.includes(subtypeOrSchool as InventoryMaterialSubtype)
    ? subtypeOrSchool as InventoryMaterialSubtype
    : category === 'elemental' ? 'elemental' : 'creature'
  const affinity = subtypeOrSchool && !MATERIAL_SUBTYPES.includes(subtypeOrSchool as InventoryMaterialSubtype)
    ? subtypeOrSchool as SchoolId
    : researchSchool

  return {
    id,
    name,
    description,
    icon,
    color,
    kind: 'material',
    category,
    inventoryCategory: 'material',
    materialSubtype,
    materialTier: 1,
    source,
    ...(sourceNavigation ? { sourceNavigation } : {}),
    ...(affinity ? { researchSchool: affinity } : {}),
  }
}

export const universalMaterial = (
  id: ItemId,
  name: string,
  description: string,
  icon: string,
  color: string,
  category: ItemDefinition['category'],
  source: string,
  materialSubtype?: InventoryMaterialSubtype,
  sourceNavigation?: ScreenId,
): AuthoredItemDefinition => ({
  id,
  name,
  description,
  icon,
  color,
  kind: 'material',
  category,
  inventoryCategory: 'material',
  ...(materialSubtype ? { materialSubtype } : {}),
  materialTier: 1,
  source,
  ...(sourceNavigation ? { sourceNavigation } : {}),
})

/** Adds only the common shape shared by every finished equipment definition. */
export const equipment = (
  definition: AuthoredEquipmentDefinition,
  source = 'Artificing',
  sourceNavigation: ScreenId = source === 'Artificing' ? 'tower-artificing' : 'combat',
): AuthoredItemDefinition => ({
  ...definition,
  source,
  sourceNavigation,
  kind: 'equipment',
  category: 'equipment',
  inventoryCategory: 'equipment',
})

export const combatEquipment = (
  definition: AuthoredEquipmentDefinition,
  sourceName: string,
) => equipment(definition, `Combat → ${sourceName}`, 'combat')

/**
 * Merge authored registries without allowing a later spread to silently hide
 * a duplicate ItemId.
 */
export const mergeItemRegistries = (...registries: AuthoredItemRegistry[]): Record<string, AuthoredItemDefinition> => {
  const merged: Record<string, AuthoredItemDefinition> = {}
  registries.forEach((registry) => {
    Object.entries(registry).forEach(([id, item]) => {
      if (Object.prototype.hasOwnProperty.call(merged, id)) throw new Error(`Duplicate authored ItemId: ${id}`)
      if (id !== item.id) throw new Error(`Authored ItemId key mismatch: ${id} != ${item.id}`)
      merged[id] = item
    })
  })
  return merged
}

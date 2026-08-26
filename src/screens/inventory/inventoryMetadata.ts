import { GUILD_REQUESTS } from '../../game/content/guild/guildRequests'
import { MANA_PILLARS } from '../../game/content/channeling/manaPillars'
import { RECIPES } from '../../game/content/recipes/recipes'
import { getItemSourceLabel, ITEMS } from '../../game/content/items/items'
import type { InventoryCategory, InventoryMaterialSubtype, ItemId, ScreenId } from '../../game/types'

export const INVENTORY_CATEGORIES = ['All', 'Materials', 'Loot', 'Equipment', 'Special'] as const
export type InventoryCategoryFilter = typeof INVENTORY_CATEGORIES[number]
export const MATERIAL_SUBCATEGORIES = ['All Materials', 'Elemental', 'Creature', 'Ore', 'Refined', 'Arcane'] as const
export type MaterialSubcategoryFilter = typeof MATERIAL_SUBCATEGORIES[number]

export const INVENTORY_CATEGORY_ORDER: InventoryCategory[] = ['material', 'loot', 'equipment', 'special']
export const CATEGORY_LABELS: Record<InventoryCategory, string> = { material: 'Materials', loot: 'Loot', equipment: 'Equipment', special: 'Special' }
export const MATERIAL_SUBTYPE_LABELS: Record<InventoryMaterialSubtype, string> = { elemental: 'Elemental', creature: 'Creature', ore: 'Ore', refined: 'Refined', arcane: 'Arcane' }

export const getInventoryCategory = (itemId: ItemId) => ITEMS[itemId].inventoryCategory
export const getMaterialSubtype = (itemId: ItemId) => ITEMS[itemId].materialSubtype
export const getInventoryCategoryLabel = (itemId: ItemId) => CATEGORY_LABELS[getInventoryCategory(itemId)]
export const getInventorySubcategoryLabel = (itemId: ItemId) => {
  const subtype = getMaterialSubtype(itemId)
  return subtype ? MATERIAL_SUBTYPE_LABELS[subtype] : undefined
}
export const getInventoryAccentClass = (itemId: ItemId) => {
  const item = ITEMS[itemId]
  return `inventory-accent-${item.inventoryCategory}${item.materialSubtype ? ` inventory-accent-${item.materialSubtype}` : ''}`
}

export interface InventoryDestination {
  label: string
  destination: ScreenId
  detail?: string
}

export function getItemSourceDestination(itemId: ItemId): InventoryDestination | null {
  const destination = ITEMS[itemId].sourceNavigation
  return destination ? { label: getItemSourceLabel(itemId), destination } : null
}

/** Used-in links are derived from authored recipes, Pillars, Guild requests, and Research eligibility. */
export function getItemUses(itemId: ItemId): InventoryDestination[] {
  const uses: InventoryDestination[] = []
  Object.values(RECIPES).forEach((recipe) => {
    if (recipe.ingredients.some((ingredient) => ingredient.itemId === itemId)) uses.push({ label: recipe.name, destination: 'tower-transmutation', detail: 'Transmutation recipe' })
  })
  if (itemId === 'life-essence' || Object.values(MANA_PILLARS).some((pillar) => pillar.fragmentRequirements.includes(itemId))) {
    uses.push({ label: 'Pillars of Mana', destination: 'tower-channeling', detail: 'Permanent Tower progression' })
  }
  Object.values(GUILD_REQUESTS).forEach((request) => {
    if (request.kind === 'donation' && request.itemId === itemId) uses.push({ label: request.name, destination: 'guild', detail: 'Guild request' })
  })
  if (ITEMS[itemId].researchSchool) uses.push({ label: 'Research', destination: 'tower-research', detail: 'Arcane Crucible' })
  return uses
}

const friendlyStatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').toLowerCase()

/** Small normalized metadata index for smart Inventory search. */
export function getInventorySearchText(itemId: ItemId): string {
  const item = ITEMS[itemId]
  const uses = getItemUses(itemId)
  const stats = Object.keys(item.stats ?? {}).map(friendlyStatKey)
  const fields = [
    item.name,
    item.inventoryCategory,
    item.materialSubtype,
    item.category,
    item.source,
    getItemSourceLabel(itemId),
    item.equipmentSlot,
    item.researchSchool,
    item.researchSchool ? 'research researchable' : '',
    uses.map((use) => `${use.label} ${use.detail ?? ''}`).join(' '),
    stats.join(' '),
  ]
  return fields.filter(Boolean).join(' ').toLowerCase()
}

export function matchesInventorySearch(itemId: ItemId, query: string) {
  return !query.trim() || getInventorySearchText(itemId).includes(query.trim().toLowerCase())
}


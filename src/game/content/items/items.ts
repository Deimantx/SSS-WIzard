import type { InventoryCategory, InventoryMaterialSubtype, ItemDefinition, ItemId, SchoolId, ScreenId } from '../../types'

type AuthoredItemDefinition = Omit<ItemDefinition, 'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'> & Partial<Pick<ItemDefinition, 'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'>>
const materialSubtypes: InventoryMaterialSubtype[] = ['elemental', 'creature', 'ore', 'refined', 'arcane']
const material = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, subtypeOrSchool?: InventoryMaterialSubtype | SchoolId, researchSchool?: SchoolId, sourceNavigation?: ScreenId): AuthoredItemDefinition => {
  const materialSubtype = subtypeOrSchool && materialSubtypes.includes(subtypeOrSchool as InventoryMaterialSubtype) ? subtypeOrSchool as InventoryMaterialSubtype : category === 'elemental' ? 'elemental' : 'creature'
  const affinity = subtypeOrSchool && !materialSubtypes.includes(subtypeOrSchool as InventoryMaterialSubtype) ? subtypeOrSchool as SchoolId : researchSchool
  return { id, name, description, icon, color, kind: 'material', category, inventoryCategory: 'material', materialSubtype, source, ...(sourceNavigation ? { sourceNavigation } : {}), ...(affinity ? { researchSchool: affinity, researchXp: 10 } : {}) }
}
const universalMaterial = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, materialSubtype?: InventoryMaterialSubtype, sourceNavigation?: ScreenId): AuthoredItemDefinition => ({ id, name, description, icon, color, kind: 'material', category, inventoryCategory: 'material', ...(materialSubtype ? { materialSubtype } : {}), source, ...(sourceNavigation ? { sourceNavigation } : {}) })
const authoredItems: Record<ItemId, AuthoredItemDefinition> = {
  'life-essence': universalMaterial('life-essence', 'Life Essence', 'Vital residue released when living magic is defeated. A universal catalyst for permanent Tower upgrades.', '✧', '#8fe0c0', 'monster-loot', 'All monsters'),
  'fire-fragment': material('fire-fragment', 'Fire Fragment', 'A hot shard of condensed elemental force.', '◆', '#ff745d', 'elemental', 'Elemental Condensation', 'fire'),
  'water-fragment': material('water-fragment', 'Water Fragment', 'A cool fragment that remembers the tide.', '◇', '#64b7ff', 'elemental', 'Elemental Condensation', 'water'),
  'earth-fragment': material('earth-fragment', 'Earth Fragment', 'Dense mineral magic from the deep places.', '⬢', '#d5a36b', 'elemental', 'Elemental Condensation', 'earth'),
  'air-fragment': material('air-fragment', 'Air Fragment', 'A weightless mote humming with motion.', '≈', '#b9d8d0', 'elemental', 'Elemental Condensation', 'air'),
  'wisp-essence': material('wisp-essence', 'Wisp Essence', 'Loot from the lesser spirits of Whispering Woods.', '☼', '#c3a7ff', 'monster-loot', 'Whispering Woods normal monsters'),
  'grove-bark': material('grove-bark', 'Grove Bark', 'Resilient bark shed by the Sentinel.', '▥', '#9eaa75', 'monster-loot', 'Grove Sentinel'),
  heartseed: material('heartseed', 'Heartseed', 'A living seed left by the Forest Heart.', '✤', '#f4c46e', 'boss-loot', 'Forest Heart first and repeat kills'),
  'apprentice-wand': { id: 'apprentice-wand', name: 'Apprentice Wand', description: 'A dependable starter focus.', icon: '⌁', color: '#e8c98a', kind: 'equipment', category: 'equipment', source: 'Fresh save', equipmentSlot: 'weapon', stats: {} },
  'ember-staff': { id: 'ember-staff', name: 'Ember Staff', description: 'A staff that makes every basic hit burn brighter.', icon: '⚒', color: '#ff956f', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'weapon', stats: { basicDamage: 4, maxMana: 10, fireSpellDamagePct: 0.2 } },
  'tide-focus': { id: 'tide-focus', name: 'Tide Focus', description: 'A fluid focus that deepens Water barriers.', icon: '◈', color: '#64b7ff', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'focus', stats: { maxMana: 15, waterBarrierPct: 0.2 } },
  'stoneweave-robe': { id: 'stoneweave-robe', name: 'Stoneweave Robe', description: 'A heavy robe that turns barriers into shelter.', icon: '▤', color: '#d5a36b', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'robe', stats: { maxHealth: 20, barrierReceived: 10 } },
  'windthread-charm': { id: 'windthread-charm', name: 'Windthread Charm', description: 'A charm that leaves room for one more automation.', icon: '⌁', color: '#b9d8d0', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'charm', stats: { maxFocus: 10, airSpellDamagePct: 0.1 } },
}

/** Normalize authored content once so every current item has an explicit Vault classification. */
const sourceNavigationByItem: Partial<Record<ItemId, ScreenId>> = {
  'life-essence': 'combat',
  'fire-fragment': 'tower-condensation',
  'water-fragment': 'tower-condensation',
  'earth-fragment': 'tower-condensation',
  'air-fragment': 'tower-condensation',
  'wisp-essence': 'combat',
  'grove-bark': 'combat',
  heartseed: 'combat',
  'ember-staff': 'tower-transmutation',
  'tide-focus': 'tower-transmutation',
  'stoneweave-robe': 'tower-transmutation',
  'windthread-charm': 'tower-transmutation',
}
const inventoryCategoryOverrides: Partial<Record<ItemId, InventoryCategory>> = { heartseed: 'loot' }
const sellValues: Record<ItemId, number | null> = {
  'life-essence': 2,
  'fire-fragment': 1,
  'water-fragment': 1,
  'earth-fragment': 1,
  'air-fragment': 1,
  'wisp-essence': 3,
  'grove-bark': 5,
  heartseed: null,
  'apprentice-wand': null,
  'ember-staff': 40,
  'tide-focus': 40,
  'stoneweave-robe': 40,
  'windthread-charm': 40,
}
const destroyability: Partial<Record<ItemId, boolean>> = { 'apprentice-wand': false, heartseed: false }
const actionRestrictionReasons: Partial<Record<ItemId, string>> = { 'apprentice-wand': 'Starter equipment cannot be destroyed.', heartseed: 'This progression item cannot be destroyed.' }
export const ITEMS: Record<ItemId, ItemDefinition> = Object.fromEntries(
  Object.entries(authoredItems).map(([id, item]) => {
    const inventoryCategory = inventoryCategoryOverrides[id as ItemId] ?? item.inventoryCategory ?? (item.kind === 'equipment' ? 'equipment' : item.category === 'boss-loot' ? 'loot' : 'material')
    const itemId = id as ItemId
    return [id, { ...item, inventoryCategory, ...(inventoryCategory === 'material' ? { materialSubtype: item.materialSubtype ?? (item.category === 'elemental' ? 'elemental' : 'creature') } : {}), sourceNavigation: item.sourceNavigation ?? sourceNavigationByItem[itemId], sellValue: item.sellValue !== undefined ? item.sellValue : sellValues[itemId], canDestroy: item.canDestroy ?? destroyability[itemId] ?? true, ...(item.actionRestrictionReason || actionRestrictionReasons[itemId] ? { actionRestrictionReason: item.actionRestrictionReason ?? actionRestrictionReasons[itemId] } : {}) }]
  }),
) as Record<ItemId, ItemDefinition>

export const getResearchXp = (itemId: ItemId, targetSchoolId: SchoolId) => ITEMS[itemId].researchSchool === targetSchoolId ? 12 : 8

export const getItemSourceLabel = (itemId: ItemId) => ITEMS[itemId].sourceNavigation === 'tower-condensation' || ITEMS[itemId].materialSubtype === 'elemental' ? 'Wizard Tower → Condensation' : itemId === 'life-essence' ? 'Combat → all monsters' : ITEMS[itemId].source

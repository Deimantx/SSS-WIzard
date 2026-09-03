import type { DamageType } from '../../systems/combat/combatTypes'
import type { EquipmentStats, InventoryCategory, InventoryMaterialSubtype, ItemDefinition, ItemId, SchoolId, ScreenId } from '../../types'
import { BALANCE } from '../../core/balance/balance'
import { MAX_BLOCK_CHANCE, MAX_RESISTANCE, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { createCombatValidationContext, validateCombatProvider } from '../../systems/combat/combatEffectValidation'
import { STATUS_DEFINITIONS } from '../statuses/statuses'

type AuthoredItemDefinition = Omit<ItemDefinition, 'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'> & Partial<Pick<ItemDefinition, 'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'>>

const materialSubtypes: InventoryMaterialSubtype[] = ['elemental', 'creature', 'ore', 'refined', 'arcane']
const material = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, subtypeOrSchool?: InventoryMaterialSubtype | SchoolId, researchSchool?: SchoolId, sourceNavigation?: ScreenId): AuthoredItemDefinition => {
  const materialSubtype = subtypeOrSchool && materialSubtypes.includes(subtypeOrSchool as InventoryMaterialSubtype) ? subtypeOrSchool as InventoryMaterialSubtype : category === 'elemental' ? 'elemental' : 'creature'
  const affinity = subtypeOrSchool && !materialSubtypes.includes(subtypeOrSchool as InventoryMaterialSubtype) ? subtypeOrSchool as SchoolId : researchSchool
  return { id, name, description, icon, color, kind: 'material', category, inventoryCategory: 'material', materialSubtype, source, ...(sourceNavigation ? { sourceNavigation } : {}), ...(affinity ? { researchSchool: affinity } : {}) }
}
const universalMaterial = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, materialSubtype?: InventoryMaterialSubtype, sourceNavigation?: ScreenId): AuthoredItemDefinition => ({ id, name, description, icon, color, kind: 'material', category, inventoryCategory: 'material', ...(materialSubtype ? { materialSubtype } : {}), source, ...(sourceNavigation ? { sourceNavigation } : {}) })
const equipment = (definition: Omit<AuthoredItemDefinition, 'kind' | 'category' | 'inventoryCategory'> & Pick<ItemDefinition, 'equipmentSlot'>): AuthoredItemDefinition => ({ ...definition, kind: 'equipment', category: 'equipment' })

/** One authoritative item registry for materials, loot, and all authored equipment. */
const authoredItems: Record<ItemId, AuthoredItemDefinition> = {
  'prismatic-fragment': universalMaterial('prismatic-fragment', 'Prismatic Fragment', "A harmonized shard formed from all four elemental forces. Used to strengthen the tower's Focus capacity.", '*', '#c8a8ff', 'material', 'Transmutation', 'arcane', 'tower-transmutation'),
  'life-essence': universalMaterial('life-essence', 'Life Essence', 'Vital residue released when living magic is defeated. A universal catalyst for permanent Tower upgrades.', '+', '#8fe0c0', 'monster-loot', 'All monsters', undefined, 'combat'),
  'fire-fragment': material('fire-fragment', 'Fire Fragment', 'A hot shard of transmuted elemental force.', '◆', '#ff745d', 'elemental', 'Transmutation', 'fire'),
  'water-fragment': material('water-fragment', 'Water Fragment', 'A cool fragment shaped by transmutation.', '◇', '#64b7ff', 'elemental', 'Transmutation', 'water'),
  'earth-fragment': material('earth-fragment', 'Earth Fragment', 'Dense mineral magic made by transmutation.', '⬟', '#d5a36b', 'elemental', 'Transmutation', 'earth'),
  'air-fragment': material('air-fragment', 'Air Fragment', 'A weightless mote formed through transmutation.', '≈', '#b9d8d0', 'elemental', 'Transmutation', 'air'),
  'wisp-essence': material('wisp-essence', 'Wisp Essence', 'Loot from the lesser spirits of Whispering Woods.', '✦', '#c3a7ff', 'monster-loot', 'Whispering Woods normal monsters', 'creature', undefined, 'combat'),
  'grove-bark': material('grove-bark', 'Grove Bark', 'Resilient bark shed by the Sentinel.', '▰', '#9eaa75', 'monster-loot', 'Grove Sentinel', 'creature', undefined, 'combat'),
  heartseed: material('heartseed', 'Heartseed', 'A living seed left by the Forest Heart.', '✤', '#f4c46e', 'boss-loot', 'Forest Heart first and repeat kills', 'creature', undefined, 'combat'),

  'ember-staff': equipment({ id: 'ember-staff', name: 'Ember Staff', description: 'A two-handed staff that makes Fire spells burn brighter.', icon: '⚒', color: '#ff956f', source: 'Transmutation', equipmentSlot: 'weapon', weaponHands: 2, stats: { basicDamage: 4, maxMana: 10, spellPower: 20 }, combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.2, sourceKinds: ['spell'], damageTypes: ['fire'] }] } }),
  'wispwood-wand': equipment({ id: 'wispwood-wand', name: 'Wispwood Wand', description: 'A light one-handed wand made for flexible caster loadouts.', icon: '|', color: '#c3a7ff', source: 'Transmutation', equipmentSlot: 'weapon', weaponHands: 1, stats: { basicDamage: 2, maxMana: 5, spellPower: 10 } }),
  'tide-focus': equipment({ id: 'tide-focus', name: 'Tide Focus', description: 'A fluid focus that deepens Water barriers.', icon: '◈', color: '#64b7ff', source: 'Transmutation', equipmentSlot: 'offhand', equipmentPresentation: 'focus', stats: { maxMana: 15, spellPower: 10 }, combat: { modifiers: [{ key: 'barrier-power-percent', value: 0.2, sourceKinds: ['spell'], damageTypes: ['water'] }] } }),
  'stoneweave-robe': equipment({ id: 'stoneweave-robe', name: 'Stoneweave Robe', description: 'A heavy robe that turns barriers into shelter.', icon: '◇', color: '#d5a36b', source: 'Transmutation', equipmentSlot: 'armor', stats: { maxHealth: 20 }, combat: { modifiers: [{ key: 'barrier-received-flat', value: 10 }] } }),
  'windthread-charm': equipment({ id: 'windthread-charm', name: 'Windthread Charm', description: 'A charm that leaves room for one more automation.', icon: '~', color: '#b9d8d0', source: 'Transmutation', equipmentSlot: 'amulet', stats: { maxFocus: 10, spellPower: 10 }, combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, sourceKinds: ['spell'], damageTypes: ['air'] }] } }),
  'wispveil-hood': equipment({ id: 'wispveil-hood', name: 'Wispveil Hood', description: 'A soft hood threaded with a wisp’s steady rhythm.', icon: '◇', color: '#b8a8e8', source: 'Transmutation', equipmentSlot: 'helmet', stats: { maxMana: 15, manaRegen: 1 } }),
  'grovekeeper-mantle': equipment({ id: 'grovekeeper-mantle', name: 'Grovekeeper Mantle', description: 'A mantle carrying the quiet resilience of the inner grove.', icon: '▼', color: '#9eaa75', source: 'Transmutation', equipmentSlot: 'cape', stats: { maxHealth: 15, resistances: { physical: 0.03 } } }),
  'wispbound-ring': equipment({ id: 'wispbound-ring', name: 'Wispbound Ring', description: 'A small ring that keeps Mana flowing between spells.', icon: 'O', color: '#c3a7ff', source: 'Transmutation', equipmentSlot: 'ring', stats: { manaRegen: 1, maxMana: 10 } }),
  'heartseed-necklace': equipment({ id: 'heartseed-necklace', name: 'Heartseed Necklace', description: 'A living seed that answers a moment of mortal danger.', icon: '✤', color: '#f4c46e', source: 'Transmutation', equipmentSlot: 'amulet', stats: { maxHealth: 20 }, combat: { modifiers: [{ key: 'healing-done-percent', value: 0.05 }], rules: [{ id: 'living-seed', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 30 }, oncePerEncounter: true, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], ui: { name: 'Living Seed' } }] } }),

  'predator-fang': material('predator-fang', 'Predator Fang', 'A keen fang shed by the predators of Howling Den.', '◆', '#d7a06d', 'monster-loot', 'Howling Den predators', 'creature', undefined, 'combat'),
  'predator-hide': material('predator-hide', 'Predator Hide', 'Tough hide carrying the scent of the hunt.', '◇', '#a87862', 'monster-loot', 'Howling Den predators', 'creature', undefined, 'combat'),
  'corrupted-beast-essence': material('corrupted-beast-essence', 'Corrupted Beast Essence', 'Unstable essence drawn from beasts warped by magic.', '*', '#9277bd', 'monster-loot', 'Corrupted Dire Wolf and Corrupted Greatbear', 'arcane', undefined, 'combat'),
  'greatbear-core': material('greatbear-core', 'Greatbear Core', 'A dense magical core left by the Corrupted Greatbear.', 'O', '#806b69', 'boss-loot', 'Corrupted Greatbear', 'arcane', undefined, 'combat'),
  'fangbound-dagger': equipment({ id: 'fangbound-dagger', name: 'Fangbound Dagger', description: 'A quick blade that rewards a steady Basic Attack rhythm.', icon: '/', color: '#d49b75', source: 'Transmutation', equipmentSlot: 'weapon', weaponHands: 1, stats: { basicDamage: 8, basicAttackSpeedPct: 0.08, critChance: 0.05 } }),
  'fangbound-buckler': equipment({ id: 'fangbound-buckler', name: 'Fangbound Buckler', description: 'A predator’s buckler that turns momentum aside.', icon: 'O', color: '#bd8c6e', source: 'Transmutation', equipmentSlot: 'offhand', equipmentPresentation: 'shield', stats: { maxHealth: 30, blockChance: 0.15, resistances: { physical: 0.03 } } }),
  'corrupted-howlstaff': equipment({ id: 'corrupted-howlstaff', name: 'Corrupted Howlstaff', description: 'A warped staff that accelerates spells and stretches their statuses.', icon: 'Y', color: '#7e6c9f', source: 'Transmutation', equipmentSlot: 'weapon', weaponHands: 2, stats: { spellPower: 30, cooldownRecoveryPct: 0.1, statusDurationPct: 0.1 } }),
  'razorclaw-circlet': equipment({ id: 'razorclaw-circlet', name: 'Razorclaw Circlet', description: 'A circlet honed for critical strikes and swift attacks.', icon: '^', color: '#c18b73', source: 'Transmutation', equipmentSlot: 'helmet', stats: { critChance: 0.02, critDamage: 0.15, basicAttackSpeedPct: 0.05 } }),
  'predator-hide-mantle': equipment({ id: 'predator-hide-mantle', name: 'Predator-Hide Mantle', description: 'A mantle that blunts physical blows and shakes off hostile magic.', icon: '▼', color: '#8f7469', source: 'Transmutation', equipmentSlot: 'cape', stats: { resistances: { physical: 0.05 } }, combat: { modifiers: [{ key: 'status-duration-received-percent', value: -0.1, statusTags: ['debuff'] }] } }),
  'greatbear-vestment': equipment({ id: 'greatbear-vestment', name: 'Greatbear Vestment', description: 'A massive vestment built for endurance.', icon: '◇', color: '#806b69', source: 'Transmutation', equipmentSlot: 'armor', stats: { maxHealth: 40, defense: 10, resistances: { physical: 0.1 } } }),
  'howling-signet': equipment({ id: 'howling-signet', name: 'Howling Signet', description: 'A signet that feeds the hunter after every kill.', icon: 'O', color: '#c18b73', source: 'Transmutation', equipmentSlot: 'ring', stats: { maxMana: 20, maxHealth: 10 }, combat: { rules: [{ id: 'predators-feast', event: 'on-kill', effects: [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 25 } }], ui: { name: "Predator's Feast" } }] } }),
  'greatbear-heartstone': equipment({ id: 'greatbear-heartstone', name: 'Greatbear Heartstone', description: 'A corrupted heartstone that refuses to yield.', icon: 'O', color: '#806b69', source: 'Transmutation', equipmentSlot: 'amulet', stats: { maxHealth: 25, resistances: { fire: 0.05, water: 0.05, earth: 0.05, air: 0.05 } }, combat: { rules: [{ id: 'unyielding', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 35 }, oncePerEncounter: true, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 } }], ui: { name: 'Unyielding' } }] } }),

  'ossuary-remnant': material('ossuary-remnant', 'Ossuary Remnant', 'A fragment of bone animated by forgotten commands.', '+', '#c9c3ae', 'monster-loot', 'Restless Skeleton and Fallen Acolyte', 'creature', undefined, 'combat'),
  'graveglass-shard': material('graveglass-shard', 'Graveglass Shard', 'A sharp shard of glass darkened by old sorcery.', '◇', '#8d9dc9', 'monster-loot', 'Grave Wraith, Fallen Acolyte, and Archmage Edrin’s Shade', 'arcane', undefined, 'combat'),
  'soul-residue': material('soul-residue', 'Soul Residue', 'A quiet remnant of a spirit’s unfinished passage.', '*', '#9b7eaa', 'monster-loot', 'Grave Wraith, Fallen Acolyte, and Archmage Edrin’s Shade', 'arcane', undefined, 'combat'),
  'edrin-remnant': material('edrin-remnant', 'Edrin Remnant', 'A rare remnant of the Archmage’s final spell.', '✦', '#70619b', 'boss-loot', 'Archmage Edrin’s Shade', 'arcane', undefined, 'combat'),
  'graveglass-wand': equipment({ id: 'graveglass-wand', name: 'Graveglass Wand', description: 'A one-handed wand that makes every spell more economical.', icon: '|', color: '#8d9dc9', source: 'Transmutation', equipmentSlot: 'weapon', weaponHands: 1, stats: { spellPower: 30, cooldownRecoveryPct: 0.1, manaCostReductionPct: 0.1 } }),
  'edrins-remnant-staff': equipment({ id: 'edrins-remnant-staff', name: "Edrin's Remnant Staff", description: 'A staff carrying forbidden arcane memory into every spell.', icon: 'Y', color: '#70619b', source: 'Transmutation', equipmentSlot: 'weapon', weaponHands: 2, stats: { spellPower: 50, cooldownRecoveryPct: 0.1, statusDurationPct: 0.15 }, combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.1, sourceKinds: ['spell'], condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } }),
  'soulward-focus': equipment({ id: 'soulward-focus', name: 'Soulward Focus', description: 'A focus that releases stored Mana when your Barrier breaks.', icon: '◈', color: '#9b7eaa', source: 'Transmutation', equipmentSlot: 'offhand', equipmentPresentation: 'focus', stats: { maxMana: 15, manaRegen: 5, barrierPowerPct: 0.15 }, combat: { rules: [{ id: 'soul-release-mana', event: 'on-barrier-broken', effects: [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 15 } }], ui: { name: 'Soul Release' } }] } }),
  'soulward-shield': equipment({ id: 'soulward-shield', name: 'Soulward Shield', description: 'A shield that answers a broken Barrier with a physical backlash.', icon: 'O', color: '#9b7eaa', source: 'Transmutation', equipmentSlot: 'offhand', equipmentPresentation: 'shield', stats: { maxHealth: 20, manaRegen: 1, blockChance: 0.15, barrierPowerPct: 0.1, resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } }, combat: { rules: [{ id: 'soul-release-damage', event: 'on-barrier-broken', effects: [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 20 } }], tags: ['equipment', 'direct', 'physical'] }], ui: { name: 'Soul Release' } }] } }),
  'acolyte-vestments': equipment({ id: 'acolyte-vestments', name: 'Acolyte Vestments', description: 'Protective vestments strengthened by elemental wards.', icon: '◇', color: '#9b7eaa', source: 'Transmutation', equipmentSlot: 'armor', stats: { maxMana: 20, healingDonePct: 0.1, resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } } }),
  'wraithveil-hood': equipment({ id: 'wraithveil-hood', name: 'Wraithveil Hood', description: 'A hood that extends your statuses while shortening hostile ones.', icon: '◇', color: '#8d9dc9', source: 'Transmutation', equipmentSlot: 'helmet', stats: { spellPower: 25, statusDurationPct: 0.15 }, combat: { modifiers: [{ key: 'status-duration-received-percent', value: -0.1, statusTags: ['debuff'] }] } }),
  'ossuary-mantle': equipment({ id: 'ossuary-mantle', name: 'Ossuary Mantle', description: 'A broad mantle layered with elemental-resistant bone.', icon: '▼', color: '#c9c3ae', source: 'Transmutation', equipmentSlot: 'cape', stats: { maxHealth: 25, maxMana: 20, resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } } }),
  'soulglass-amulet': equipment({ id: 'soulglass-amulet', name: 'Soulglass Amulet', description: 'An amulet that sharpens damage over time and status magic.', icon: '✤', color: '#8d9dc9', source: 'Transmutation', equipmentSlot: 'amulet', stats: { spellPower: 10, statusDurationPct: 0.15, damageOverTimePct: 0.15 } }),
  'gravebinder-ring': equipment({ id: 'gravebinder-ring', name: 'Gravebinder Ring', description: 'A ring that exploits every negative status on the enemy.', icon: 'O', color: '#70619b', source: 'Transmutation', equipmentSlot: 'ring', stats: { spellPower: 10 }, combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.1, condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } }),
  'edrins-signet': equipment({ id: 'edrins-signet', name: "Edrin's Signet", description: 'A remnant signet that turns hostile status magic into a ward.', icon: 'O', color: '#70619b', source: 'Transmutation', equipmentSlot: 'ring', stats: { maxMana: 25, manaCostReductionPct: 0.1 }, combat: { rules: [{ id: 'arcane-remnant', event: 'on-status-applied', condition: { type: 'all', conditions: [{ type: 'source-is-opponent' }, { type: 'event-target-is-self' }, { type: 'event-status-has-tag', tag: 'debuff' }] }, cooldownMs: 30_000, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], ui: { name: 'Arcane Remnant' } }] } }),
}

const sourceNavigationByItem: Partial<Record<ItemId, ScreenId>> = {
  'prismatic-fragment': 'tower-transmutation', 'life-essence': 'combat', 'fire-fragment': 'tower-transmutation', 'water-fragment': 'tower-transmutation', 'earth-fragment': 'tower-transmutation', 'air-fragment': 'tower-transmutation',
  'wisp-essence': 'combat', 'grove-bark': 'combat', heartseed: 'combat',
  'ember-staff': 'tower-transmutation', 'wispwood-wand': 'tower-transmutation', 'tide-focus': 'tower-transmutation', 'stoneweave-robe': 'tower-transmutation', 'windthread-charm': 'tower-transmutation', 'wispveil-hood': 'tower-transmutation', 'grovekeeper-mantle': 'tower-transmutation', 'wispbound-ring': 'tower-transmutation', 'heartseed-necklace': 'tower-transmutation',
  'predator-fang': 'combat', 'predator-hide': 'combat', 'corrupted-beast-essence': 'combat', 'greatbear-core': 'combat', 'fangbound-dagger': 'tower-transmutation', 'fangbound-buckler': 'tower-transmutation', 'corrupted-howlstaff': 'tower-transmutation', 'razorclaw-circlet': 'tower-transmutation', 'predator-hide-mantle': 'tower-transmutation', 'greatbear-vestment': 'tower-transmutation', 'howling-signet': 'tower-transmutation', 'greatbear-heartstone': 'tower-transmutation',
  'ossuary-remnant': 'combat', 'graveglass-shard': 'combat', 'soul-residue': 'combat', 'edrin-remnant': 'combat', 'graveglass-wand': 'tower-transmutation', 'edrins-remnant-staff': 'tower-transmutation', 'soulward-focus': 'tower-transmutation', 'soulward-shield': 'tower-transmutation', 'acolyte-vestments': 'tower-transmutation', 'wraithveil-hood': 'tower-transmutation', 'ossuary-mantle': 'tower-transmutation', 'soulglass-amulet': 'tower-transmutation', 'gravebinder-ring': 'tower-transmutation', 'edrins-signet': 'tower-transmutation',
}
const inventoryCategoryOverrides: Partial<Record<ItemId, InventoryCategory>> = { heartseed: 'loot', 'heartseed-necklace': 'equipment', 'greatbear-heartstone': 'equipment', 'edrins-signet': 'equipment' }
const sellValues: Record<ItemId, number | null> = {
  'prismatic-fragment': 20, 'life-essence': 2, 'fire-fragment': 1, 'water-fragment': 1, 'earth-fragment': 1, 'air-fragment': 1, 'wisp-essence': 3, 'grove-bark': 5, heartseed: null,
  'ember-staff': 40, 'wispwood-wand': 40, 'tide-focus': 40, 'stoneweave-robe': 40, 'windthread-charm': 40, 'wispveil-hood': 40, 'grovekeeper-mantle': 40, 'wispbound-ring': 40, 'heartseed-necklace': null,
  'predator-fang': 4, 'predator-hide': 5, 'corrupted-beast-essence': 6, 'greatbear-core': 20, 'fangbound-dagger': 70, 'fangbound-buckler': 70, 'corrupted-howlstaff': 70, 'razorclaw-circlet': 70, 'predator-hide-mantle': 70, 'greatbear-vestment': 70, 'howling-signet': 70, 'greatbear-heartstone': null,
  'ossuary-remnant': 4, 'graveglass-shard': 5, 'soul-residue': 6, 'edrin-remnant': 20, 'graveglass-wand': 110, 'edrins-remnant-staff': 110, 'soulward-focus': 110, 'soulward-shield': 110, 'acolyte-vestments': 110, 'wraithveil-hood': 110, 'ossuary-mantle': 110, 'soulglass-amulet': 110, 'gravebinder-ring': 110, 'edrins-signet': null,
}
const destroyability: Partial<Record<ItemId, boolean>> = { heartseed: false }
const actionRestrictionReasons: Partial<Record<ItemId, string>> = { heartseed: 'This progression item cannot be destroyed.' }

export const ITEMS: Record<ItemId, ItemDefinition> = Object.fromEntries(Object.entries(authoredItems).map(([id, item]) => {
  const itemId = id as ItemId
  const inventoryCategory = inventoryCategoryOverrides[itemId] ?? item.inventoryCategory ?? (item.kind === 'equipment' ? 'equipment' : item.category === 'boss-loot' ? 'loot' : 'material')
  return [id, { ...item, inventoryCategory, ...(inventoryCategory === 'material' ? { materialSubtype: item.materialSubtype ?? (item.category === 'elemental' ? 'elemental' : 'creature') } : {}), sourceNavigation: item.sourceNavigation ?? sourceNavigationByItem[itemId], sellValue: item.sellValue !== undefined ? item.sellValue : sellValues[itemId], canDestroy: item.canDestroy ?? destroyability[itemId] ?? true, ...(item.actionRestrictionReason || actionRestrictionReasons[itemId] ? { actionRestrictionReason: item.actionRestrictionReason ?? actionRestrictionReasons[itemId] } : {}) }]
})) as Record<ItemId, ItemDefinition>

/** The eight provisional dungeon materials introduced with the first equipment slice. */
export const SUPPORTING_DUNGEON_MATERIAL_IDS: readonly ItemId[] = [
  'predator-fang', 'predator-hide', 'corrupted-beast-essence', 'greatbear-core',
  'ossuary-remnant', 'graveglass-shard', 'soul-residue', 'edrin-remnant',
]

const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']
const EQUIPMENT_NUMERIC_FIELDS: readonly (keyof EquipmentStats)[] = ['basicDamage', 'spellPower', 'maxHealth', 'maxMana', 'manaRegen', 'maxFocus', 'defense', 'critChance', 'critDamage', 'basicAttackSpeedPct', 'blockChance', 'cooldownRecoveryPct', 'healingDonePct', 'barrierPowerPct', 'damageOverTimePct', 'statusDurationPct', 'manaCostReductionPct', 'focusEfficiencyPct']
const validateEquipmentStats = (itemId: string, stats: EquipmentStats | undefined, errors: string[]) => {
  if (stats === undefined) return
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) { errors.push(`${itemId}: invalid equipment stats`); return }
  EQUIPMENT_NUMERIC_FIELDS.forEach((field) => { const value = stats[field]; if (value !== undefined && !Number.isFinite(value as number)) errors.push(`${itemId}: non-finite equipment stat ${field}`) })
  const bounded = (field: keyof EquipmentStats, min: number, max: number) => { const value = stats[field] as number | undefined; if (value !== undefined && Number.isFinite(value) && (value < min || value > max)) errors.push(`${itemId}: invalid equipment stat ${String(field)}`) }
  bounded('defense', 0, Number.POSITIVE_INFINITY); bounded('critChance', 0, 1); bounded('critDamage', 0, Number.POSITIVE_INFINITY); bounded('blockChance', 0, MAX_BLOCK_CHANCE); bounded('manaCostReductionPct', 0, 0.8); bounded('focusEfficiencyPct', 0, 0.8)
  if (stats.resistances !== undefined) {
    if (!stats.resistances || typeof stats.resistances !== 'object' || Array.isArray(stats.resistances)) errors.push(`${itemId}: invalid equipment resistances`)
    else Object.entries(stats.resistances as Record<string, unknown>).forEach(([damageType, value]) => { if (!DAMAGE_TYPES.includes(damageType as DamageType) || typeof value !== 'number' || !Number.isFinite(value) || value < MIN_RESISTANCE || value > MAX_RESISTANCE) errors.push(`${itemId}: invalid ${damageType} resistance`) })
  }
}

export const validateItemDefinitions = (items: Record<string, ItemDefinition> = ITEMS) => {
  const errors: string[] = []
  Object.entries(items).forEach(([key, item]) => {
    if (key !== item.id) errors.push(`${key}: key/id mismatch`)
    if (item.kind === 'equipment' && !item.equipmentSlot) errors.push(`${item.id}: equipment slot is required`)
    if (item.kind !== 'equipment' && item.weaponHands !== undefined) errors.push(`${item.id}: only equipment items may define weaponHands`)
    if (item.weaponHands !== undefined && (item.equipmentSlot !== 'weapon' || (item.weaponHands !== 1 && item.weaponHands !== 2))) errors.push(`${item.id}: weaponHands requires a 1H or 2H weapon`)
    if (item.equipmentSlot === 'weapon' && item.weaponHands === undefined) errors.push(`${item.id}: weapons must define weaponHands`)
    validateEquipmentStats(item.id, item.stats, errors)
    if (item.combat && item.kind !== 'equipment') errors.push(`${item.id}: only equipment items may define combat metadata`)
    errors.push(...validateCombatProvider(item.combat, `${item.id}.combat`, createCombatValidationContext(STATUS_DEFINITIONS)))
  })
  if (errors.length && import.meta.env.DEV) console.error(`[combat-items] ${errors.join('; ')}`)
  return errors
}

export const getResearchXp = (itemId: ItemId, targetSchoolId: SchoolId) => ITEMS[itemId].researchSchool === targetSchoolId ? BALANCE.research.matchingXp : BALANCE.research.nonMatchingXp
export const getResearchableItemIds = () => (Object.keys(ITEMS) as ItemId[]).filter((itemId) => ITEMS[itemId].kind === 'material' && Boolean(ITEMS[itemId].researchSchool))
export const getItemSourceLabel = (itemId: ItemId) => ITEMS[itemId].materialSubtype === 'elemental' || itemId === 'prismatic-fragment' ? 'Wizard Tower → Transmutation' : itemId === 'life-essence' ? 'Combat → all monsters' : ITEMS[itemId].source

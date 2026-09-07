import type { DamageType } from '../../systems/combat/combatTypes'
import type { EquipmentBuildTag, EquipmentBudgetProfileId, EquipmentStats, InventoryCategory, InventoryMaterialSubtype, ItemDefinition, ItemId, SchoolId, ScreenId } from '../../types'
import { BALANCE } from '../../core/balance/balance'
import { MAX_BLOCK_CHANCE, MAX_RESISTANCE, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { createCombatValidationContext, validateCombatProvider } from '../../systems/combat/combatEffectValidation'
import { STATUS_DEFINITIONS } from '../statuses/statuses'
import { EQUIPMENT_BUILD_TAG_LABELS, EQUIPMENT_BUDGET_PROFILES, validateEquipmentBudgetProfiles } from './equipmentBalance'

type AuthoredItemDefinition = Omit<ItemDefinition, 'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'> & Partial<Pick<ItemDefinition, 'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'>>

const materialSubtypes: InventoryMaterialSubtype[] = ['elemental', 'creature', 'ore', 'refined', 'arcane']
const material = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, subtypeOrSchool?: InventoryMaterialSubtype | SchoolId, researchSchool?: SchoolId, sourceNavigation?: ScreenId): AuthoredItemDefinition => {
  const materialSubtype = subtypeOrSchool && materialSubtypes.includes(subtypeOrSchool as InventoryMaterialSubtype) ? subtypeOrSchool as InventoryMaterialSubtype : category === 'elemental' ? 'elemental' : 'creature'
  const affinity = subtypeOrSchool && !materialSubtypes.includes(subtypeOrSchool as InventoryMaterialSubtype) ? subtypeOrSchool as SchoolId : researchSchool
  return { id, name, description, icon, color, kind: 'material', category, inventoryCategory: 'material', materialSubtype, materialTier: 1, source, ...(sourceNavigation ? { sourceNavigation } : {}), ...(affinity ? { researchSchool: affinity } : {}) }
}
const universalMaterial = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, materialSubtype?: InventoryMaterialSubtype, sourceNavigation?: ScreenId): AuthoredItemDefinition => ({ id, name, description, icon, color, kind: 'material', category, inventoryCategory: 'material', ...(materialSubtype ? { materialSubtype } : {}), materialTier: 1, source, ...(sourceNavigation ? { sourceNavigation } : {}) })
type AuthoredEquipmentDefinition = Omit<AuthoredItemDefinition, 'kind' | 'category' | 'inventoryCategory' | 'source' | 'sourceNavigation' | 'equipmentTier' | 'buildTags' | 'equipmentBudgetProfile'> & Required<Pick<ItemDefinition, 'equipmentSlot' | 'equipmentTier' | 'buildTags' | 'equipmentBudgetProfile'>>
/**
 * Equipment stat chassis:
 * Weapon: Basic Damage + Spell Power; Focus: Mana + Spell Power; Shield: Health + Defense + Block.
 * Armor/Helmet/Cape: Health + Defense; Amulet and Ring: two meaningful core/resource stats.
 * Additional stats and combat effects define the build.
 */
const equipment = (definition: AuthoredEquipmentDefinition): AuthoredItemDefinition => ({ ...definition, source: 'Artificing', sourceNavigation: 'tower-artificing', kind: 'equipment', category: 'equipment' })

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

  'ember-staff': equipment({ id: 'ember-staff', name: 'Ember Staff', description: 'A two-handed staff that makes Fire spells burn brighter.', icon: '⚒', color: '#ff956f', equipmentTier: 1.0, buildTags: ['spell', 'fire'], equipmentBudgetProfile: 'signature', equipmentSlot: 'weapon', weaponHands: 2, stats: { basicDamage: 6, maxMana: 10, spellPower: 24 }, combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.2, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } }),
  'wispwood-wand': equipment({ id: 'wispwood-wand', name: 'Wispwood Wand', description: 'A light one-handed wand made for flexible caster loadouts.', icon: '|', color: '#c3a7ff', equipmentTier: 1.0, buildTags: ['spell', 'mana'], equipmentBudgetProfile: 'standard', equipmentSlot: 'weapon', weaponHands: 1, stats: { basicDamage: 4, maxMana: 5, spellPower: 12 } }),
  'tide-focus': equipment({ id: 'tide-focus', name: 'Tide Focus', description: 'A fluid focus that deepens Water barriers.', icon: '◈', color: '#64b7ff', equipmentTier: 1.0, buildTags: ['spell', 'water', 'barrier'], equipmentBudgetProfile: 'signature', equipmentSlot: 'offhand', equipmentPresentation: 'focus', stats: { maxMana: 15, spellPower: 12 }, combat: { modifiers: [{ key: 'barrier-power-percent', value: 0.2, sourceKinds: ['spell'], damageTypes: ['water'] }] } }),
  'stoneweave-robe': equipment({ id: 'stoneweave-robe', name: 'Stoneweave Robe', description: 'A heavy robe that turns barriers into shelter.', icon: '◇', color: '#d5a36b', equipmentTier: 1.0, buildTags: ['barrier', 'defense', 'mana'], equipmentBudgetProfile: 'signature', equipmentSlot: 'armor', stats: { maxHealth: 30, maxMana: 10, defense: 6 }, combat: { modifiers: [{ key: 'barrier-received-flat', value: 10 }] } }),
  'windthread-charm': equipment({ id: 'windthread-charm', name: 'Windthread Charm', description: 'A charm that leaves room for one more automation.', icon: '~', color: '#b9d8d0', equipmentTier: 1.0, buildTags: ['spell', 'air', 'focus'], equipmentBudgetProfile: 'signature', equipmentSlot: 'amulet', stats: { maxMana: 10, maxFocus: 10, spellPower: 8 }, combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['air'] }] } }),
  'wispveil-hood': equipment({ id: 'wispveil-hood', name: 'Wispveil Hood', description: 'A soft hood threaded with a wisp’s steady rhythm.', icon: '◇', color: '#b8a8e8', equipmentTier: 1.0, buildTags: ['mana', 'sustain', 'defense'], equipmentBudgetProfile: 'standard', equipmentSlot: 'helmet', stats: { maxHealth: 15, defense: 4, maxMana: 15, manaRegen: 1 } }),
  'grovekeeper-mantle': equipment({ id: 'grovekeeper-mantle', name: 'Grovekeeper Mantle', description: 'A mantle carrying the quiet resilience of the inner grove.', icon: '▼', color: '#9eaa75', equipmentTier: 1.0, buildTags: ['defense'], equipmentBudgetProfile: 'standard', equipmentSlot: 'cape', stats: { maxHealth: 15, defense: 3, resistances: { physical: 0.03 } } }),
  'wispbound-ring': equipment({ id: 'wispbound-ring', name: 'Wispbound Ring', description: 'A small ring that keeps Mana flowing between spells.', icon: 'O', color: '#c3a7ff', equipmentTier: 1.0, buildTags: ['spell', 'mana', 'sustain'], equipmentBudgetProfile: 'standard', equipmentSlot: 'ring', stats: { maxMana: 10, manaRegen: 1, spellPower: 5 } }),
  'heartseed-necklace': equipment({ id: 'heartseed-necklace', name: 'Heartseed Necklace', description: 'A living seed that answers a moment of mortal danger.', icon: '✤', color: '#f4c46e', equipmentTier: 1.0, buildTags: ['defense', 'healing', 'barrier', 'sustain'], equipmentBudgetProfile: 'boss', equipmentSlot: 'amulet', stats: { maxHealth: 25, defense: 10, resistances: { physical: 0.03 } }, combat: { modifiers: [{ key: 'healing-done-percent', value: 0.05 }], rules: [{ id: 'living-seed', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 30 }, oncePerEncounter: true, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], ui: { name: 'Living Seed' } }] } }),

  'predator-fang': material('predator-fang', 'Predator Fang', 'A keen fang shed by the predators of Howling Den.', '◆', '#d7a06d', 'monster-loot', 'Howling Den predators', 'creature', undefined, 'combat'),
  'predator-hide': material('predator-hide', 'Predator Hide', 'Tough hide carrying the scent of the hunt.', '◇', '#a87862', 'monster-loot', 'Howling Den predators', 'creature', undefined, 'combat'),
  'corrupted-beast-essence': material('corrupted-beast-essence', 'Corrupted Beast Essence', 'Unstable essence drawn from beasts warped by magic.', '*', '#9277bd', 'monster-loot', 'Corrupted Dire Wolf and Corrupted Greatbear', 'arcane', undefined, 'combat'),
  'greatbear-core': material('greatbear-core', 'Greatbear Core', 'A dense magical core left by the Corrupted Greatbear.', 'O', '#806b69', 'boss-loot', 'Corrupted Greatbear', 'arcane', undefined, 'combat'),
  'fangbound-dagger': equipment({ id: 'fangbound-dagger', name: 'Fangbound Dagger', description: 'A quick blade that rewards a steady Basic Attack rhythm.', icon: '/', color: '#d49b75', equipmentTier: 1.3, buildTags: ['basic-attack', 'crit'], equipmentBudgetProfile: 'standard', equipmentSlot: 'weapon', weaponHands: 1, stats: { basicDamage: 14, spellPower: 8, basicAttackSpeedPct: 0.08, critChance: 0.05 } }),
  'fangbound-buckler': equipment({ id: 'fangbound-buckler', name: 'Fangbound Buckler', description: 'A predator’s buckler that turns momentum aside.', icon: 'O', color: '#bd8c6e', equipmentTier: 1.3, buildTags: ['defense'], equipmentBudgetProfile: 'standard', equipmentSlot: 'offhand', equipmentPresentation: 'shield', stats: { maxHealth: 35, defense: 12, blockChance: 0.15, resistances: { physical: 0.03 } } }),
  'corrupted-howlstaff': equipment({ id: 'corrupted-howlstaff', name: 'Corrupted Howlstaff', description: 'A warped staff that accelerates spells and stretches their statuses.', icon: 'Y', color: '#7e6c9f', equipmentTier: 1.3, buildTags: ['spell', 'status'], equipmentBudgetProfile: 'standard', equipmentSlot: 'weapon', weaponHands: 2, stats: { basicDamage: 8, spellPower: 36, cooldownRecoveryPct: 0.1, statusDurationPct: 0.1 } }),
  'razorclaw-circlet': equipment({ id: 'razorclaw-circlet', name: 'Razorclaw Circlet', description: 'A circlet honed for critical strikes and swift attacks.', icon: '^', color: '#c18b73', equipmentTier: 1.3, buildTags: ['basic-attack', 'crit'], equipmentBudgetProfile: 'standard', equipmentSlot: 'helmet', stats: { maxHealth: 20, defense: 5, critChance: 0.02, critDamage: 0.15, basicAttackSpeedPct: 0.05 } }),
  'predator-hide-mantle': equipment({ id: 'predator-hide-mantle', name: 'Predator-Hide Mantle', description: 'A mantle that blunts physical blows and shakes off hostile magic.', icon: '▼', color: '#8f7469', equipmentTier: 1.3, buildTags: ['defense', 'status'], equipmentBudgetProfile: 'signature', equipmentSlot: 'cape', stats: { maxHealth: 20, defense: 5, resistances: { physical: 0.05 } }, combat: { modifiers: [{ key: 'status-duration-received-percent', value: -0.1, statusTags: ['debuff'] }] } }),
  'greatbear-vestment': equipment({ id: 'greatbear-vestment', name: 'Greatbear Vestment', description: 'A massive vestment built for endurance.', icon: '◇', color: '#806b69', equipmentTier: 1.3, buildTags: ['defense', 'mana'], equipmentBudgetProfile: 'standard', equipmentSlot: 'armor', stats: { maxHealth: 45, maxMana: 10, defense: 12, resistances: { physical: 0.1 } } }),
  'howling-signet': equipment({ id: 'howling-signet', name: 'Howling Signet', description: 'A signet that feeds the hunter after every kill.', icon: 'O', color: '#c18b73', equipmentTier: 1.3, buildTags: ['basic-attack', 'crit', 'sustain'], equipmentBudgetProfile: 'signature', equipmentSlot: 'ring', stats: { maxHealth: 15, maxMana: 20, critChance: 0.02, basicAttackSpeedPct: 0.02 }, combat: { rules: [{ id: 'predators-feast', event: 'on-kill', effects: [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 25 } }], ui: { name: "Predator's Feast" } }] } }),
  'greatbear-heartstone': equipment({ id: 'greatbear-heartstone', name: 'Greatbear Heartstone', description: 'A corrupted heartstone that refuses to yield.', icon: 'O', color: '#806b69', equipmentTier: 1.3, buildTags: ['defense', 'sustain', 'barrier'], equipmentBudgetProfile: 'boss', equipmentSlot: 'amulet', stats: { maxHealth: 40, healthRegen: 1, defense: 15, resistances: { fire: 0.05, water: 0.05, earth: 0.05, air: 0.05 } }, combat: { rules: [{ id: 'unyielding', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 35 }, oncePerEncounter: true, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 } }], ui: { name: 'Unyielding' } }] } }),

  'ossuary-remnant': material('ossuary-remnant', 'Ossuary Remnant', 'A fragment of bone animated by forgotten commands.', '+', '#c9c3ae', 'monster-loot', 'Restless Skeleton and Fallen Acolyte', 'creature', undefined, 'combat'),
  'graveglass-shard': material('graveglass-shard', 'Graveglass Shard', 'A sharp shard of glass darkened by old sorcery.', '◇', '#8d9dc9', 'monster-loot', 'Grave Wraith, Fallen Acolyte, and Archmage Edrin’s Shade', 'arcane', undefined, 'combat'),
  'soul-residue': material('soul-residue', 'Soul Residue', 'A quiet remnant of a spirit’s unfinished passage.', '*', '#9b7eaa', 'monster-loot', 'Grave Wraith, Fallen Acolyte, and Archmage Edrin’s Shade', 'arcane', undefined, 'combat'),
  'edrin-remnant': material('edrin-remnant', 'Edrin Remnant', 'A rare remnant of the Archmage’s final spell.', '✦', '#70619b', 'boss-loot', 'Archmage Edrin’s Shade', 'arcane', undefined, 'combat'),
  'graveglass-wand': equipment({ id: 'graveglass-wand', name: 'Graveglass Wand', description: 'A one-handed wand that makes every spell more economical.', icon: '|', color: '#8d9dc9', equipmentTier: 1.6, buildTags: ['spell', 'mana'], equipmentBudgetProfile: 'standard', equipmentSlot: 'weapon', weaponHands: 1, stats: { basicDamage: 8, spellPower: 32, cooldownRecoveryPct: 0.1, manaCostReductionPct: 0.1 } }),
  'edrins-remnant-staff': equipment({ id: 'edrins-remnant-staff', name: "Edrin's Remnant Staff", description: 'A staff carrying forbidden arcane memory into every spell.', icon: 'Y', color: '#70619b', equipmentTier: 1.6, buildTags: ['spell', 'status', 'mana'], equipmentBudgetProfile: 'boss', equipmentSlot: 'weapon', weaponHands: 2, stats: { basicDamage: 14, spellPower: 50, manaRegen: 10, cooldownRecoveryPct: 0.1, statusDurationPct: 0.15 }, combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.1, originSourceKinds: ['spell'], condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } }),
  'soulward-focus': equipment({ id: 'soulward-focus', name: 'Soulward Focus', description: 'A focus that releases stored Mana when your Barrier breaks.', icon: '◈', color: '#9b7eaa', equipmentTier: 1.6, buildTags: ['spell', 'mana', 'barrier'], equipmentBudgetProfile: 'signature', equipmentSlot: 'offhand', equipmentPresentation: 'focus', stats: { maxMana: 25, manaRegen: 5, spellPower: 20, barrierPowerPct: 0.15 }, combat: { rules: [{ id: 'soul-release-mana', event: 'on-barrier-broken', effects: [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 15 } }], ui: { name: 'Soul Release' } }] } }),
  'soulward-shield': equipment({ id: 'soulward-shield', name: 'Soulward Shield', description: 'A shield that answers a broken Barrier with a physical backlash.', icon: 'O', color: '#9b7eaa', equipmentTier: 1.6, buildTags: ['defense', 'barrier', 'mana'], equipmentBudgetProfile: 'signature', equipmentSlot: 'offhand', equipmentPresentation: 'shield', stats: { maxHealth: 35, defense: 10, manaRegen: 1, blockChance: 0.15, barrierPowerPct: 0.1, resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } }, combat: { rules: [{ id: 'soul-release-damage', event: 'on-barrier-broken', effects: [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 20 } }], tags: ['equipment', 'direct', 'physical'] }], ui: { name: 'Soul Release' } }] } }),
  'acolyte-vestments': equipment({ id: 'acolyte-vestments', name: 'Acolyte Vestments', description: 'Protective vestments strengthened by elemental wards.', icon: '◇', color: '#9b7eaa', equipmentTier: 1.6, buildTags: ['defense', 'healing', 'mana'], equipmentBudgetProfile: 'standard', equipmentSlot: 'armor', stats: { maxHealth: 50, defense: 12, maxMana: 20, healingDonePct: 0.1, resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } } }),
  'wraithveil-hood': equipment({ id: 'wraithveil-hood', name: 'Wraithveil Hood', description: 'A hood that extends your statuses while shortening hostile ones.', icon: '◇', color: '#8d9dc9', equipmentTier: 1.6, buildTags: ['spell', 'status', 'defense'], equipmentBudgetProfile: 'signature', equipmentSlot: 'helmet', stats: { maxHealth: 25, defense: 7, spellPower: 25, statusDurationPct: 0.15 }, combat: { modifiers: [{ key: 'status-duration-received-percent', value: -0.1, statusTags: ['debuff'] }] } }),
  'ossuary-mantle': equipment({ id: 'ossuary-mantle', name: 'Ossuary Mantle', description: 'A broad mantle layered with elemental-resistant bone.', icon: '▼', color: '#c9c3ae', equipmentTier: 1.6, buildTags: ['defense', 'mana'], equipmentBudgetProfile: 'standard', equipmentSlot: 'cape', stats: { maxHealth: 30, defense: 8, maxMana: 20, resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } } }),
  'soulglass-amulet': equipment({ id: 'soulglass-amulet', name: 'Soulglass Amulet', description: 'An amulet that sharpens damage over time and status magic.', icon: '✤', color: '#8d9dc9', equipmentTier: 1.6, buildTags: ['spell', 'status', 'dot'], equipmentBudgetProfile: 'standard', equipmentSlot: 'amulet', stats: { maxHealth: 20, spellPower: 15, statusDurationPct: 0.15, damageOverTimePct: 0.15 } }),
  'gravebinder-ring': equipment({ id: 'gravebinder-ring', name: 'Gravebinder Ring', description: 'A ring that exploits every negative status on the enemy.', icon: 'O', color: '#70619b', equipmentTier: 1.6, buildTags: ['spell', 'status'], equipmentBudgetProfile: 'signature', equipmentSlot: 'ring', stats: { maxMana: 15, spellPower: 15 }, combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.1, condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } }),
  'edrins-signet': equipment({ id: 'edrins-signet', name: "Edrin's Signet", description: 'A remnant signet that turns hostile status magic into a ward.', icon: 'O', color: '#70619b', equipmentTier: 1.6, buildTags: ['spell', 'status', 'mana', 'barrier'], equipmentBudgetProfile: 'boss', equipmentSlot: 'ring', stats: { maxHealth: 20, maxMana: 20, manaRegen: 3, spellPower: 20, manaCostReductionPct: 0.1 }, combat: { rules: [{ id: 'arcane-remnant', event: 'on-status-applied', condition: { type: 'all', conditions: [{ type: 'source-is-opponent' }, { type: 'event-target-is-self' }, { type: 'event-status-has-tag', tag: 'debuff' }] }, cooldownMs: 30_000, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], ui: { name: 'Arcane Remnant' } }] } }),
}

const sourceNavigationByItem: Partial<Record<ItemId, ScreenId>> = {
  'prismatic-fragment': 'tower-transmutation', 'life-essence': 'combat', 'fire-fragment': 'tower-transmutation', 'water-fragment': 'tower-transmutation', 'earth-fragment': 'tower-transmutation', 'air-fragment': 'tower-transmutation',
  'wisp-essence': 'combat', 'grove-bark': 'combat', heartseed: 'combat',
  'predator-fang': 'combat', 'predator-hide': 'combat', 'corrupted-beast-essence': 'combat', 'greatbear-core': 'combat',
  'ossuary-remnant': 'combat', 'graveglass-shard': 'combat', 'soul-residue': 'combat', 'edrin-remnant': 'combat',
}
const inventoryCategoryOverrides: Partial<Record<ItemId, InventoryCategory>> = { 'heartseed-necklace': 'equipment', 'greatbear-heartstone': 'equipment', 'edrins-signet': 'equipment' }
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
  const inventoryCategory = inventoryCategoryOverrides[itemId] ?? item.inventoryCategory ?? (item.kind === 'equipment' ? 'equipment' : 'material')
  return [id, { ...item, inventoryCategory, ...(inventoryCategory === 'material' ? { materialSubtype: item.materialSubtype ?? (item.category === 'elemental' ? 'elemental' : 'creature') } : {}), sourceNavigation: item.sourceNavigation ?? sourceNavigationByItem[itemId], sellValue: item.sellValue !== undefined ? item.sellValue : sellValues[itemId], canDestroy: item.canDestroy ?? destroyability[itemId] ?? true, ...(item.actionRestrictionReason || actionRestrictionReasons[itemId] ? { actionRestrictionReason: item.actionRestrictionReason ?? actionRestrictionReasons[itemId] } : {}) }]
})) as Record<ItemId, ItemDefinition>

/** The eight provisional dungeon materials introduced with the first equipment slice. */
export const SUPPORTING_DUNGEON_MATERIAL_IDS: readonly ItemId[] = [
  'predator-fang', 'predator-hide', 'corrupted-beast-essence', 'greatbear-core',
  'ossuary-remnant', 'graveglass-shard', 'soul-residue', 'edrin-remnant',
]

const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']
const EQUIPMENT_NUMERIC_FIELDS: readonly (keyof EquipmentStats)[] = ['basicDamage', 'spellPower', 'maxHealth', 'healthRegen', 'maxMana', 'manaRegen', 'maxFocus', 'defense', 'critChance', 'critDamage', 'basicAttackSpeedPct', 'blockChance', 'cooldownRecoveryPct', 'healingDonePct', 'barrierPowerPct', 'damageOverTimePct', 'statusDurationPct', 'manaCostReductionPct', 'focusEfficiencyPct']
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

const hasPositiveEquipmentStat = (stats: EquipmentStats | undefined, field: keyof EquipmentStats) => {
  const value = stats?.[field]
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
const requireEquipmentStats = (itemId: string, stats: EquipmentStats | undefined, fields: readonly (keyof EquipmentStats)[], errors: string[]) => {
  const missing = fields.filter((field) => !hasPositiveEquipmentStat(stats, field))
  if (missing.length) errors.push(`${itemId}: equipment requires positive ${missing.join(' and ')}`)
}
const requireEquipmentCoreStats = (itemId: string, stats: EquipmentStats | undefined, fields: readonly (keyof EquipmentStats)[], label: string, errors: string[]) => {
  if (fields.filter((field) => hasPositiveEquipmentStat(stats, field)).length < 2) errors.push(`${itemId}: ${label} requires at least two positive core/resource stats`)
}
const validateEquipmentChassis = (item: ItemDefinition, errors: string[]) => {
  if (item.kind !== 'equipment') return
  if (item.equipmentSlot === 'weapon') requireEquipmentStats(item.id, item.stats, ['basicDamage', 'spellPower'], errors)
  if (item.equipmentSlot === 'armor' || item.equipmentSlot === 'helmet' || item.equipmentSlot === 'cape') requireEquipmentStats(item.id, item.stats, ['maxHealth', 'defense'], errors)
  if (item.equipmentSlot === 'offhand' && item.equipmentPresentation === 'focus') requireEquipmentStats(item.id, item.stats, ['maxMana', 'spellPower'], errors)
  if (item.equipmentSlot === 'offhand' && item.equipmentPresentation === 'shield') requireEquipmentStats(item.id, item.stats, ['maxHealth', 'defense', 'blockChance'], errors)
  if (item.equipmentSlot === 'amulet') requireEquipmentCoreStats(item.id, item.stats, ['maxHealth', 'maxMana', 'spellPower', 'defense'], 'amulets', errors)
  if (item.equipmentSlot === 'ring') requireEquipmentCoreStats(item.id, item.stats, ['maxHealth', 'maxMana', 'spellPower', 'manaRegen'], 'rings', errors)
}

const validateEquipmentMetadata = (item: ItemDefinition, errors: string[]) => {
  if (item.kind !== 'equipment') {
    if (item.equipmentTier !== undefined) errors.push(`${item.id}: only equipment items may define equipmentTier`)
    if (item.buildTags !== undefined) errors.push(`${item.id}: only equipment items may define buildTags`)
    if (item.equipmentBudgetProfile !== undefined) errors.push(`${item.id}: only equipment items may define equipmentBudgetProfile`)
    return
  }
  if (item.equipmentTier === undefined || !Number.isFinite(item.equipmentTier) || item.equipmentTier <= 0) errors.push(`${item.id}: equipmentTier must be finite and greater than 0`)
  const tags = item.buildTags
  if (!Array.isArray(tags) || tags.length < 1 || tags.length > 4) errors.push(`${item.id}: buildTags must contain 1 to 4 tags`)
  else {
    const seen = new Set<EquipmentBuildTag>()
    tags.forEach((tag) => {
      if (!Object.prototype.hasOwnProperty.call(EQUIPMENT_BUILD_TAG_LABELS, tag)) errors.push(`${item.id}: unknown equipment build tag ${String(tag)}`)
      if (seen.has(tag)) errors.push(`${item.id}: duplicate equipment build tag ${tag}`)
      seen.add(tag)
    })
  }
  const profileId = item.equipmentBudgetProfile
  if (!profileId || !Object.prototype.hasOwnProperty.call(EQUIPMENT_BUDGET_PROFILES, profileId)) errors.push(`${item.id}: unknown equipment budget profile`)
  else {
    const profile = EQUIPMENT_BUDGET_PROFILES[profileId as EquipmentBudgetProfileId]
    const hasSignatureEffect = Boolean(item.combat?.modifiers?.length || item.combat?.rules?.length)
    if (profileId === 'standard' && hasSignatureEffect) errors.push(`${item.id}: standard equipment must not define combat modifiers or rules`)
    if ((profileId === 'signature' || profileId === 'boss') && !hasSignatureEffect) errors.push(`${item.id}: ${profileId} equipment requires a combat modifier or rule`)
    if (!profile) errors.push(`${item.id}: invalid equipment budget profile`) // Defensive runtime check for casted authored data.
  }
}

export const validateItemDefinitions = (items: Record<string, ItemDefinition> = ITEMS) => {
  const errors: string[] = []
  validateEquipmentBudgetProfiles(errors)
  Object.entries(items).forEach(([key, item]) => {
    if (key !== item.id) errors.push(`${key}: key/id mismatch`)
    if (item.kind === 'equipment' && !item.equipmentSlot) errors.push(`${item.id}: equipment slot is required`)
    if (item.kind === 'equipment' && item.materialTier !== undefined) errors.push(`${item.id}: equipment must not define materialTier`)
    const materialTier = item.materialTier
    if (item.kind === 'material' && (materialTier === undefined || !Number.isInteger(materialTier) || materialTier < 1)) errors.push(`${item.id}: materialTier must be a positive integer`)
    if (item.kind !== 'equipment' && item.weaponHands !== undefined) errors.push(`${item.id}: only equipment items may define weaponHands`)
    if (item.weaponHands !== undefined && (item.equipmentSlot !== 'weapon' || (item.weaponHands !== 1 && item.weaponHands !== 2))) errors.push(`${item.id}: weaponHands requires a 1H or 2H weapon`)
    if (item.equipmentSlot === 'weapon' && item.weaponHands === undefined) errors.push(`${item.id}: weapons must define weaponHands`)
    validateEquipmentStats(item.id, item.stats, errors)
    validateEquipmentChassis(item, errors)
    validateEquipmentMetadata(item, errors)
    if (item.combat && item.kind !== 'equipment') errors.push(`${item.id}: only equipment items may define combat metadata`)
    errors.push(...validateCombatProvider(item.combat, `${item.id}.combat`, createCombatValidationContext(STATUS_DEFINITIONS)))
  })
  if (errors.length && import.meta.env.DEV) console.error(`[combat-items] ${errors.join('; ')}`)
  return errors
}

export const getResearchXp = (itemId: ItemId, targetSchoolId: SchoolId) => ITEMS[itemId].researchSchool === targetSchoolId ? BALANCE.research.matchingXp : BALANCE.research.nonMatchingXp
export const getResearchableItemIds = () => (Object.keys(ITEMS) as ItemId[]).filter((itemId) => ITEMS[itemId].kind === 'material' && Boolean(ITEMS[itemId].researchSchool))
export const getItemSourceLabel = (itemId: ItemId) => ITEMS[itemId].materialSubtype === 'elemental' || itemId === 'prismatic-fragment' ? 'Wizard Tower → Transmutation' : itemId === 'life-essence' ? 'Combat → all monsters' : ITEMS[itemId].source

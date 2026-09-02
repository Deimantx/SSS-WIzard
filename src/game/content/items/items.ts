import type { DamageType } from '../../systems/combat/combatTypes'
import type { EquipmentStats, InventoryCategory, InventoryMaterialSubtype, ItemDefinition, ItemId, ModifierKey, SchoolId, ScreenId } from '../../types'
import { BALANCE } from '../../core/balance/balance'
import { MAX_BLOCK_CHANCE, MAX_RESISTANCE, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { isPersistedCombatEffect } from '../../systems/combat/combatEffectValidation'

type AuthoredItemDefinition = Omit<ItemDefinition, 'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'> & Partial<Pick<ItemDefinition, 'inventoryCategory' | 'materialSubtype' | 'sellValue' | 'canDestroy' | 'actionRestrictionReason'>>
const materialSubtypes: InventoryMaterialSubtype[] = ['elemental', 'creature', 'ore', 'refined', 'arcane']
const material = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, subtypeOrSchool?: InventoryMaterialSubtype | SchoolId, researchSchool?: SchoolId, sourceNavigation?: ScreenId): AuthoredItemDefinition => {
  const materialSubtype = subtypeOrSchool && materialSubtypes.includes(subtypeOrSchool as InventoryMaterialSubtype) ? subtypeOrSchool as InventoryMaterialSubtype : category === 'elemental' ? 'elemental' : 'creature'
  const affinity = subtypeOrSchool && !materialSubtypes.includes(subtypeOrSchool as InventoryMaterialSubtype) ? subtypeOrSchool as SchoolId : researchSchool
  return { id, name, description, icon, color, kind: 'material', category, inventoryCategory: 'material', materialSubtype, source, ...(sourceNavigation ? { sourceNavigation } : {}), ...(affinity ? { researchSchool: affinity } : {}) }
}
const universalMaterial = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, materialSubtype?: InventoryMaterialSubtype, sourceNavigation?: ScreenId): AuthoredItemDefinition => ({ id, name, description, icon, color, kind: 'material', category, inventoryCategory: 'material', ...(materialSubtype ? { materialSubtype } : {}), source, ...(sourceNavigation ? { sourceNavigation } : {}) })
const authoredItems: Record<ItemId, AuthoredItemDefinition> = {
  'prismatic-fragment': universalMaterial('prismatic-fragment', 'Prismatic Fragment', 'A harmonized shard formed from all four elemental forces. Used to strengthen the tower\'s Focus capacity.', '✦', '#c8a8ff', 'material', 'Transmutation', 'arcane', 'tower-transmutation'),
  'life-essence': universalMaterial('life-essence', 'Life Essence', 'Vital residue released when living magic is defeated. A universal catalyst for permanent Tower upgrades.', '✧', '#8fe0c0', 'monster-loot', 'All monsters'),
  'fire-fragment': material('fire-fragment', 'Fire Fragment', 'A hot shard of transmuted elemental force.', '◆', '#ff745d', 'elemental', 'Transmutation', 'fire'),
  'water-fragment': material('water-fragment', 'Water Fragment', 'A cool fragment shaped by transmutation.', '◇', '#64b7ff', 'elemental', 'Transmutation', 'water'),
  'earth-fragment': material('earth-fragment', 'Earth Fragment', 'Dense mineral magic made by transmutation.', '⬢', '#d5a36b', 'elemental', 'Transmutation', 'earth'),
  'air-fragment': material('air-fragment', 'Air Fragment', 'A weightless mote formed through transmutation.', '≈', '#b9d8d0', 'elemental', 'Transmutation', 'air'),
  'wisp-essence': material('wisp-essence', 'Wisp Essence', 'Loot from the lesser spirits of Whispering Woods.', '☼', '#c3a7ff', 'monster-loot', 'Whispering Woods normal monsters'),
  'grove-bark': material('grove-bark', 'Grove Bark', 'Resilient bark shed by the Sentinel.', '▥', '#9eaa75', 'monster-loot', 'Grove Sentinel'),
  heartseed: material('heartseed', 'Heartseed', 'A living seed left by the Forest Heart.', '✤', '#f4c46e', 'boss-loot', 'Forest Heart first and repeat kills'),
  'apprentice-wand': { id: 'apprentice-wand', name: 'Apprentice Wand', description: 'A dependable starter focus.', icon: '⌁', color: '#e8c98a', kind: 'equipment', category: 'equipment', source: 'Fresh save', equipmentSlot: 'weapon', weaponHands: 1, stats: {} },
  'ember-staff': { id: 'ember-staff', name: 'Ember Staff', description: 'A staff that increases Spell Power and makes every Fire spell burn brighter.', icon: '⚒', color: '#ff956f', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'weapon', weaponHands: 2, stats: { basicDamage: 4, maxMana: 10, spellPower: 20, fireSpellDamagePct: 0.2 } },
  'tide-focus': { id: 'tide-focus', name: 'Tide Focus', description: 'A fluid focus that increases Spell Power and deepens Water barriers.', icon: '◈', color: '#64b7ff', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'offhand', stats: { maxMana: 15, spellPower: 15, waterBarrierPct: 0.2 } },
  'stoneweave-robe': { id: 'stoneweave-robe', name: 'Stoneweave Robe', description: 'A heavy robe that turns barriers into shelter.', icon: '▤', color: '#d5a36b', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'armor', stats: { maxHealth: 20, barrierReceived: 10 } },
  'windthread-charm': { id: 'windthread-charm', name: 'Windthread Charm', description: 'A charm that increases Spell Power and leaves room for one more automation.', icon: '⌁', color: '#b9d8d0', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'amulet', stats: { maxFocus: 10, spellPower: 10, airSpellDamagePct: 0.1 } },
}

/** Normalize authored content once so every current item has an explicit Vault classification. */
const sourceNavigationByItem: Partial<Record<ItemId, ScreenId>> = {
  'prismatic-fragment': 'tower-transmutation',
  'life-essence': 'combat',
  'fire-fragment': 'tower-transmutation',
  'water-fragment': 'tower-transmutation',
  'earth-fragment': 'tower-transmutation',
  'air-fragment': 'tower-transmutation',
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
  'prismatic-fragment': 20,
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

const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']
const EQUIPMENT_NUMERIC_FIELDS: readonly (keyof EquipmentStats)[] = [
  'basicDamage', 'spellPower', 'maxHealth', 'maxMana', 'manaRegen', 'maxFocus', 'barrierReceived',
  'defense', 'critChance', 'critDamage', 'basicAttackSpeedPct', 'blockChance', 'cooldownRecoveryPct',
  'healingDonePct', 'barrierPowerPct', 'damageOverTimePct', 'statusDurationPct', 'manaCostReductionPct', 'focusEfficiencyPct',
  'fireSpellDamagePct', 'waterBarrierPct', 'earthSpellDamagePct', 'airSpellDamagePct',
]

const validateEquipmentStats = (itemId: string, stats: EquipmentStats | undefined, errors: string[]) => {
  if (stats === undefined) return
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) { errors.push(`${itemId}: invalid equipment stats`); return }
  EQUIPMENT_NUMERIC_FIELDS.forEach((field) => {
    const value = stats[field]
    if (value !== undefined && !Number.isFinite(value as number)) errors.push(`${itemId}: non-finite equipment stat ${field}`)
  })
  const bounded = (field: keyof EquipmentStats, min: number, max: number) => {
    const value = stats[field] as number | undefined
    if (value !== undefined && Number.isFinite(value) && (value < min || value > max)) errors.push(`${itemId}: invalid equipment stat ${String(field)}`)
  }
  bounded('defense', 0, Number.POSITIVE_INFINITY)
  bounded('critChance', 0, 1)
  bounded('critDamage', 0, Number.POSITIVE_INFINITY)
  bounded('blockChance', 0, MAX_BLOCK_CHANCE)
  bounded('manaCostReductionPct', 0, 0.8)
  bounded('focusEfficiencyPct', 0, 0.8)
  if (stats.resistances !== undefined) {
    if (!stats.resistances || typeof stats.resistances !== 'object' || Array.isArray(stats.resistances)) errors.push(`${itemId}: invalid equipment resistances`)
    else Object.entries(stats.resistances as Record<string, unknown>).forEach(([damageType, value]) => {
      if (!DAMAGE_TYPES.includes(damageType as DamageType) || typeof value !== 'number' || !Number.isFinite(value) || value < MIN_RESISTANCE || value > MAX_RESISTANCE) errors.push(`${itemId}: invalid ${damageType} resistance`)
    })
  }
}

export const validateItemDefinitions = (items: Record<string, ItemDefinition> = ITEMS) => {
  const errors: string[] = []
  const modifierKeys: readonly ModifierKey[] = ['damage-dealt-percent', 'damage-taken-percent', 'basic-attack-damage-percent', 'basic-attack-speed-percent', 'action-speed-percent', 'spell-damage-percent', 'melee-damage-percent', 'ranged-damage-percent', 'healing-done-percent', 'healing-received-percent', 'barrier-power-percent', 'barrier-received-percent', 'mana-regen-percent', 'cooldown-recovery-percent', 'control-duration-received-percent', 'status-duration-dealt-percent', 'status-duration-received-percent', 'defense-flat', 'crit-chance', 'crit-damage', 'block-chance', 'damage-over-time-percent', 'resistance-percent']
  Object.entries(items).forEach(([key, item]) => {
    if (key !== item.id) errors.push(`${key}: key/id mismatch`)
    validateEquipmentStats(item.id, item.stats, errors)
    if (item.combat && item.kind !== 'equipment') errors.push(`${item.id}: only equipment items may define combat metadata`)
    const modifiers = item.combat?.modifiers ?? []
    modifiers.forEach((modifier) => {
      if (!modifierKeys.includes(modifier.key)) errors.push(`${item.id}: invalid combat modifier key`)
      if (!Number.isFinite(modifier.value)) errors.push(`${item.id}: non-finite combat modifier`)
    })
    const rules = item.combat?.rules ?? []
    const ruleIds = rules.map((rule) => rule.id)
    if (new Set(ruleIds).size !== ruleIds.length) errors.push(`${item.id}: duplicate combat rule id`)
    rules.forEach((rule) => {
      if (!rule.id.trim()) errors.push(`${item.id}: combat rule id is required`)
      if (rule.cooldownMs !== undefined && (!Number.isFinite(rule.cooldownMs) || rule.cooldownMs < 0)) errors.push(`${item.id}:${rule.id}: invalid cooldown`)
      if (!Array.isArray(rule.effects) || !rule.effects.every(isPersistedCombatEffect)) errors.push(`${item.id}:${rule.id}: invalid combat effects`)
    })
  })
  if (errors.length && import.meta.env.DEV) console.error(`[combat-items] ${errors.join('; ')}`)
  return errors
}

validateItemDefinitions()

export const getResearchXp = (itemId: ItemId, targetSchoolId: SchoolId) => ITEMS[itemId].researchSchool === targetSchoolId ? BALANCE.research.matchingXp : BALANCE.research.nonMatchingXp

/** Research content is data-driven: only authored research affinities enter the Crucible library. */
export const getResearchableItemIds = () => (Object.keys(ITEMS) as ItemId[]).filter((itemId) => ITEMS[itemId].kind === 'material' && Boolean(ITEMS[itemId].researchSchool))

export const getItemSourceLabel = (itemId: ItemId) => ITEMS[itemId].materialSubtype === 'elemental' || itemId === 'prismatic-fragment' ? 'Wizard Tower → Transmutation' : itemId === 'life-essence' ? 'Combat → all monsters' : ITEMS[itemId].source

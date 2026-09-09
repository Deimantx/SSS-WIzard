import type { DamageType } from '../../systems/combat/combatTypes'
import type { EquipmentBuildTag, EquipmentBudgetProfileId, EquipmentStats, InventoryCategory, InventoryMaterialSubtype, ItemDefinition, ItemId, SchoolId, ScreenId } from '../../types'
import { BALANCE } from '../../core/balance/balance'
import { MAX_BLOCK_CHANCE, MAX_RESISTANCE, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { ARTIFACTS, validateArtifactDefinitions } from '../artifacts/artifacts'
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
 * Weapon: Basic Damage + Spell Power.
 * Armor/Helmet/Cape: Health + Defense; Amulet/Ring/Earring: two meaningful core/resource stats.
 * Additional stats and combat effects define the build.
 */
const equipment = (definition: AuthoredEquipmentDefinition): AuthoredItemDefinition => ({ ...definition, source: 'Artificing', sourceNavigation: 'tower-artificing', kind: 'equipment', category: 'equipment' })

/** One authoritative item registry for materials, loot, and all authored equipment. */
const authoredItems: Record<ItemId, AuthoredItemDefinition> = {
  'thorn-fiber': material('thorn-fiber', 'Thorn Fiber', 'Tough living strands stripped from thorn growth; light, flexible, and eager to hold enchantment.', '~', '#cb7899', 'monster-loot', 'Thornling', 'creature', undefined, 'combat'),
  'rootstone-shard': material('rootstone-shard', 'Rootstone Shard', 'A petrified knot of root and mineral formed where ancient growth drank deeply of stone.', '#', '#b28f79', 'monster-loot', 'Stone Root', 'creature', undefined, 'combat'),
  'predator-sinew': material('predator-sinew', 'Predator Sinew', 'Dense tendon harvested from den predators, prized for bindings that must flex without yielding.', '~', '#c18b73', 'monster-loot', 'Cavefang Wolf', 'creature', undefined, 'combat'),
  'burial-cloth': material('burial-cloth', 'Burial Cloth', 'Age-darkened funerary wrapping steeped in grave dust and lingering soul resonance.', '=', '#a99a9f', 'monster-loot', 'Restless Skeleton and Fallen Acolyte', 'creature', undefined, 'combat'),
  'prismatic-fragment': universalMaterial('prismatic-fragment', 'Prismatic Fragment', "A harmonized shard formed from all four elemental forces. Used to strengthen the tower's Focus capacity.", '*', '#c8a8ff', 'material', 'Transmutation', 'arcane', 'tower-transmutation'),
  'life-essence': universalMaterial('life-essence', 'Life Essence', 'Vital residue released when living magic is defeated. A universal catalyst for permanent Tower upgrades.', '+', '#8fe0c0', 'monster-loot', 'All monsters', undefined, 'combat'),
  'fire-fragment': material('fire-fragment', 'Fire Fragment', 'A hot shard of transmuted elemental force.', '◆', '#ff745d', 'elemental', 'Transmutation', 'fire'),
  'water-fragment': material('water-fragment', 'Water Fragment', 'A cool fragment shaped by transmutation.', '◇', '#64b7ff', 'elemental', 'Transmutation', 'water'),
  'earth-fragment': material('earth-fragment', 'Earth Fragment', 'Dense mineral magic made by transmutation.', '⬟', '#d5a36b', 'elemental', 'Transmutation', 'earth'),
  'air-fragment': material('air-fragment', 'Air Fragment', 'A weightless mote formed through transmutation.', '≈', '#b9d8d0', 'elemental', 'Transmutation', 'air'),
  'wisp-essence': material('wisp-essence', 'Wisp Essence', 'Loot from the lesser spirits of Whispering Woods.', '✦', '#c3a7ff', 'monster-loot', 'Whispering Woods normal monsters', 'creature', undefined, 'combat'),
  'grove-bark': material('grove-bark', 'Grove Bark', 'Resilient bark shed by the Sentinel.', '▰', '#9eaa75', 'monster-loot', 'Grove Sentinel', 'creature', undefined, 'combat'),
  heartseed: material('heartseed', 'Heartseed', 'A living seed left by the Forest Heart.', '✤', '#f4c46e', 'boss-loot', 'Forest Heart first and repeat kills', 'creature', undefined, 'combat'),

  'ember-staff': equipment({ id: 'ember-staff', name: 'Ember Staff', description: 'A blackened staff veined with embers that never cool; each reforging wakes a deeper furnace sealed within its core.', icon: '⚒', color: '#ff956f', equipmentTier: 1.0, buildTags: ['spell', 'fire', 'dot', 'status'], equipmentBudgetProfile: 'signature', equipmentSlot: 'weapon' }),
  'tideglass-wand': equipment({ id: 'tideglass-wand', name: 'Tideglass Wand', description: 'Sea-blue glass beads with cold water even in dry air, bending every incantation into a steadier and more deliberate current.', icon: '◇', color: '#64b7ff', equipmentTier: 1.0, buildTags: ['spell', 'water', 'barrier', 'status'], equipmentBudgetProfile: 'signature', equipmentSlot: 'weapon' }),
  'stoneheart-scepter': equipment({ id: 'stoneheart-scepter', name: 'Stoneheart Scepter', description: 'Carved around a living stone core, the scepter answers every spell with a deeper pulse, as though the earth itself were listening.', icon: '⬟', color: '#d5a36b', equipmentTier: 1.0, buildTags: ['spell', 'earth', 'defense', 'barrier'], equipmentBudgetProfile: 'signature', equipmentSlot: 'weapon' }),
  'windthread-wand': equipment({ id: 'windthread-wand', name: 'Windthread Wand', description: 'Silverwood bound with threads of captive wind trembles before a spell is spoken, snapping released magic forward like a drawn bowstring.', icon: '~', color: '#b9d8d0', equipmentTier: 1.0, buildTags: ['spell', 'air', 'crit', 'mana'], equipmentBudgetProfile: 'signature', equipmentSlot: 'weapon' }),
  'wispweave-robe': equipment({ id: 'wispweave-robe', name: 'Wispweave Robe', description: 'Pale spirit-thread tightens around incoming force as though unseen hands were pulling every stitch into place at the moment of impact.', icon: '◇', color: '#a9b8d8', equipmentTier: 1.0, buildTags: ['defense', 'sustain', 'barrier', 'mana'], equipmentBudgetProfile: 'signature', equipmentSlot: 'armor' }),
  'windthread-charm': equipment({ id: 'windthread-charm', name: 'Windthread Charm', description: 'A knot of silver thread wound around a captured gust, keeping a sliver of the mind clear even while several spells compete for attention.', icon: '~', color: '#b9d8d0', equipmentTier: 1.0, buildTags: ['spell', 'air', 'focus'], equipmentBudgetProfile: 'signature', equipmentSlot: 'amulet', stats: { maxMana: 10, maxFocus: 10, spellPower: 8 }, combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['air'] }] } }),
  'wispveil-hood': equipment({ id: 'wispveil-hood', name: 'Wispveil Hood', description: 'Violet mist clings to the inside of this hood; beneath its veil, wandering thoughts sharpen and hostile enchantments struggle to take hold.', icon: '◇', color: '#b8a8e8', equipmentTier: 1.0, buildTags: ['spell', 'mana', 'status', 'crit'], equipmentBudgetProfile: 'signature', equipmentSlot: 'helmet' }),
  'grovekeeper-mantle': equipment({ id: 'grovekeeper-mantle', name: 'Grovekeeper Mantle', description: 'Living fibers run through bark-soft cloth, stiffening under impact like a grove closing ranks around its keeper.', icon: '▼', color: '#9eaa75', equipmentTier: 1.0, buildTags: ['defense'], equipmentBudgetProfile: 'standard', equipmentSlot: 'cape', stats: { maxHealth: 15, defense: 3, resistances: { physical: 0.03 } } }),
  'wispglass-earring': equipment({ id: 'wispglass-earring', name: 'Wispglass Earring', description: 'A loop of translucent wispglass rings without sound whenever mana slips from a spell, drawing the loose current back toward its wearer.', icon: '◌', color: '#c8b8ff', equipmentTier: 1.0, buildTags: ['spell', 'mana', 'sustain'], equipmentBudgetProfile: 'standard', equipmentSlot: 'earring', stats: { maxMana: 12, manaRegen: 1, spellPower: 5, cooldownRecoveryPct: 0.03 } }),
  'wispbound-ring': equipment({ id: 'wispbound-ring', name: 'Wispbound Ring', description: 'A pale ring that drinks the mana left between incantations and returns it in a slow, steady pulse against the wearer\'s hand.', icon: 'O', color: '#c3a7ff', equipmentTier: 1.0, buildTags: ['spell', 'mana', 'sustain'], equipmentBudgetProfile: 'standard', equipmentSlot: 'ring', stats: { maxMana: 10, manaRegen: 1, spellPower: 5 } }),
  'heartseed-necklace': equipment({ id: 'heartseed-necklace', name: 'Heartseed Necklace', description: 'The seed still beats faintly against the chest; when its wearer falters, roots of light flare outward before the killing blow can land.', icon: '✤', color: '#f4c46e', equipmentTier: 1.0, buildTags: ['defense', 'healing', 'barrier', 'sustain'], equipmentBudgetProfile: 'boss', equipmentSlot: 'amulet', stats: { maxHealth: 25, defense: 10, resistances: { physical: 0.03 } }, combat: { modifiers: [{ key: 'healing-done-percent', value: 0.05 }], rules: [{ id: 'living-seed', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 30 }, oncePerEncounter: true, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], ui: { name: 'Living Seed' } }] } }),

  'predator-fang': material('predator-fang', 'Predator Fang', 'A keen fang shed by the predators of Howling Den.', '◆', '#d7a06d', 'monster-loot', 'Howling Den predators', 'creature', undefined, 'combat'),
  'predator-hide': material('predator-hide', 'Predator Hide', 'Tough hide carrying the scent of the hunt.', '◇', '#a87862', 'monster-loot', 'Howling Den predators', 'creature', undefined, 'combat'),
  'corrupted-beast-essence': material('corrupted-beast-essence', 'Corrupted Beast Essence', 'Unstable essence drawn from beasts warped by magic.', '*', '#9277bd', 'monster-loot', 'Corrupted Dire Wolf and Corrupted Greatbear', 'arcane', undefined, 'combat'),
  'greatbear-core': material('greatbear-core', 'Greatbear Core', 'A dense magical core left by the Corrupted Greatbear.', 'O', '#806b69', 'boss-loot', 'Corrupted Greatbear', 'arcane', undefined, 'combat'),
  'predator-hide-mantle': equipment({ id: 'predator-hide-mantle', name: 'Predator-Hide Mantle', description: 'Cured from hides steeped in corrupted moonlight, the mantle carries a hunter\'s stubbornness and refuses to let wounds slow the chase.', icon: '▼', color: '#8f7469', equipmentTier: 1.3, buildTags: ['defense', 'status'], equipmentBudgetProfile: 'signature', equipmentSlot: 'cape', stats: { maxHealth: 20, defense: 5, resistances: { physical: 0.05 } }, combat: { modifiers: [{ key: 'status-duration-received-percent', value: -0.1, statusTags: ['debuff'] }] } }),
  'fangwire-earring': equipment({ id: 'fangwire-earring', name: 'Fangwire Earring', description: 'A predator fang hung from blackened wire warms against the skin when an opening appears, turning hesitation into a sharper strike.', icon: '⌁', color: '#c18b73', equipmentTier: 1.3, buildTags: ['spell', 'crit', 'basic-attack'], equipmentBudgetProfile: 'standard', equipmentSlot: 'earring', stats: { maxHealth: 10, spellPower: 8, critChance: 0.03, critDamage: 0.10 } }),
  'howling-signet': equipment({ id: 'howling-signet', name: 'Howling Signet', description: 'Scratched with the marks of successful hunts, the signet drinks the last warmth of a fallen foe and feeds it back into its bearer.', icon: 'O', color: '#c18b73', equipmentTier: 1.3, buildTags: ['basic-attack', 'crit', 'sustain'], equipmentBudgetProfile: 'signature', equipmentSlot: 'ring', stats: { maxHealth: 15, maxMana: 20, critChance: 0.02, basicAttackSpeedPct: 0.02 }, combat: { rules: [{ id: 'predators-feast', event: 'on-kill', effects: [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 25 } }], ui: { name: "Predator's Feast" } }] } }),
  'greatbear-heartstone': equipment({ id: 'greatbear-heartstone', name: 'Greatbear Heartstone', description: 'A fist-sized core that pulses with the Greatbear\'s refusal to die, gathering shattered magic around the same stubborn rhythm.', icon: 'O', color: '#806b69', equipmentTier: 1.3, buildTags: ['defense', 'sustain', 'barrier'], equipmentBudgetProfile: 'boss', equipmentSlot: 'amulet', stats: { maxHealth: 40, healthRegen: 1, defense: 15, resistances: { fire: 0.05, water: 0.05, earth: 0.05, air: 0.05 } }, combat: { rules: [{ id: 'unyielding', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 35 }, oncePerEncounter: true, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 } }], ui: { name: 'Unyielding' } }] } }),

  'ossuary-remnant': material('ossuary-remnant', 'Ossuary Remnant', 'A fragment of bone animated by forgotten commands.', '+', '#c9c3ae', 'monster-loot', 'Restless Skeleton and Fallen Acolyte', 'creature', undefined, 'combat'),
  'graveglass-shard': material('graveglass-shard', 'Graveglass Shard', 'A sharp shard of glass darkened by old sorcery.', '◇', '#8d9dc9', 'monster-loot', 'Grave Wraith, Fallen Acolyte, and Archmage Edrin’s Shade', 'arcane', undefined, 'combat'),
  'soul-residue': material('soul-residue', 'Soul Residue', 'A quiet remnant of a spirit’s unfinished passage.', '*', '#9b7eaa', 'monster-loot', 'Grave Wraith, Fallen Acolyte, and Archmage Edrin’s Shade', 'arcane', undefined, 'combat'),
  'edrin-remnant': material('edrin-remnant', 'Edrin Remnant', 'A rare remnant of the Archmage’s final spell.', '✦', '#70619b', 'boss-loot', 'Archmage Edrin’s Shade', 'arcane', undefined, 'combat'),
  'ossuary-mantle': equipment({ id: 'ossuary-mantle', name: 'Ossuary Mantle', description: 'Catacomb bone is stitched beneath dark cloth, each shard remembering a different element and dulling the bite of magic that strikes it.', icon: '▼', color: '#c9c3ae', equipmentTier: 1.6, buildTags: ['defense', 'mana'], equipmentBudgetProfile: 'standard', equipmentSlot: 'cape', stats: { maxHealth: 30, defense: 8, maxMana: 20, resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } } }),
  'mourning-glass-earring': equipment({ id: 'mourning-glass-earring', name: 'Mourning Glass Earring', description: 'A sliver of graveglass polished with soul residue catches the dying echo of a curse and refuses to let the whisper fade too quickly.', icon: '◍', color: '#8d9dc9', equipmentTier: 1.6, buildTags: ['spell', 'status', 'dot', 'mana'], equipmentBudgetProfile: 'standard', equipmentSlot: 'earring', stats: { maxMana: 15, spellPower: 12, statusDurationPct: 0.10, cooldownRecoveryPct: 0.05 } }),
  'gravebinder-ring': equipment({ id: 'gravebinder-ring', name: 'Gravebinder Ring', description: 'Tiny runes crawl around this graveglass band whenever an enemy is afflicted, tightening with every weakness already laid upon them.', icon: 'O', color: '#70619b', equipmentTier: 1.6, buildTags: ['spell', 'status'], equipmentBudgetProfile: 'signature', equipmentSlot: 'ring', stats: { maxMana: 15, spellPower: 15 }, combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.1, condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } }),
  'edrins-signet': equipment({ id: 'edrins-signet', name: "Edrin's Signet", description: "The Archmage's broken seal still carries a fragment of his warding instinct, raising a pale remnant whenever hostile magic takes hold.", icon: 'O', color: '#70619b', equipmentTier: 1.6, buildTags: ['spell', 'status', 'mana', 'barrier'], equipmentBudgetProfile: 'boss', equipmentSlot: 'ring', stats: { maxHealth: 20, maxMana: 20, manaRegen: 3, spellPower: 20, manaCostReductionPct: 0.1 }, combat: { rules: [{ id: 'arcane-remnant', event: 'on-status-applied', condition: { type: 'all', conditions: [{ type: 'source-is-opponent' }, { type: 'event-target-is-self' }, { type: 'event-status-has-tag', tag: 'debuff' }] }, cooldownMs: 30_000, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], ui: { name: 'Arcane Remnant' } }] } }),
  'soulglass-amulet': equipment({ id: 'soulglass-amulet', name: 'Soulglass Amulet', description: "A shard of soulglass bound around the echo of Edrin's final spell; curses linger near it as though unwilling to leave.", icon: '✤', color: '#8d9dc9', equipmentTier: 1.6, buildTags: ['spell', 'status', 'dot'], equipmentBudgetProfile: 'standard', equipmentSlot: 'amulet', stats: { maxHealth: 20, spellPower: 15, statusDurationPct: 0.15, damageOverTimePct: 0.15 } }),
}

const sourceNavigationByItem: Partial<Record<ItemId, ScreenId>> = {
  'prismatic-fragment': 'tower-transmutation', 'life-essence': 'combat', 'fire-fragment': 'tower-transmutation', 'water-fragment': 'tower-transmutation', 'earth-fragment': 'tower-transmutation', 'air-fragment': 'tower-transmutation',
  'wisp-essence': 'combat', 'thorn-fiber': 'combat', 'rootstone-shard': 'combat', 'grove-bark': 'combat', heartseed: 'combat',
  'predator-fang': 'combat', 'predator-hide': 'combat', 'predator-sinew': 'combat', 'corrupted-beast-essence': 'combat', 'greatbear-core': 'combat',
  'ossuary-remnant': 'combat', 'graveglass-shard': 'combat', 'soul-residue': 'combat', 'burial-cloth': 'combat', 'edrin-remnant': 'combat',
}
const inventoryCategoryOverrides: Partial<Record<ItemId, InventoryCategory>> = { 'heartseed-necklace': 'equipment', 'greatbear-heartstone': 'equipment', 'edrins-signet': 'equipment' }
const sellValues: Record<ItemId, number | null> = {
  'prismatic-fragment': 20, 'life-essence': 2, 'fire-fragment': 1, 'water-fragment': 1, 'earth-fragment': 1, 'air-fragment': 1, 'wisp-essence': 3, 'thorn-fiber': 4, 'rootstone-shard': 5, 'grove-bark': 5, heartseed: null,
  'ember-staff': null, 'tideglass-wand': null, 'stoneheart-scepter': null, 'windthread-wand': null, 'wispweave-robe': null, 'windthread-charm': 40, 'wispveil-hood': null, 'grovekeeper-mantle': 40, 'wispglass-earring': 40, 'wispbound-ring': 40, 'heartseed-necklace': null,
  'predator-fang': 4, 'predator-hide': 5, 'predator-sinew': 6, 'corrupted-beast-essence': 6, 'greatbear-core': 20, 'predator-hide-mantle': 70, 'fangwire-earring': 70, 'howling-signet': 70, 'greatbear-heartstone': null,
  'ossuary-remnant': 4, 'graveglass-shard': 5, 'soul-residue': 6, 'burial-cloth': 6, 'edrin-remnant': 20, 'ossuary-mantle': 110, 'mourning-glass-earring': 110, 'soulglass-amulet': 110, 'gravebinder-ring': 110, 'edrins-signet': null,
}
const destroyability: Partial<Record<ItemId, boolean>> = { heartseed: false }
const actionRestrictionReasons: Partial<Record<ItemId, string>> = { heartseed: 'This progression item cannot be destroyed.' }
export const ITEMS: Record<ItemId, ItemDefinition> = Object.fromEntries(Object.entries(authoredItems).map(([id, item]) => {
  const itemId = id as ItemId
  const inventoryCategory = inventoryCategoryOverrides[itemId] ?? item.inventoryCategory ?? (item.kind === 'equipment' ? 'equipment' : 'material')
  const isArtifact = Boolean(ARTIFACTS[itemId])
  return [id, { ...item, inventoryCategory, ...(inventoryCategory === 'material' ? { materialSubtype: item.materialSubtype ?? (item.category === 'elemental' ? 'elemental' : 'creature') } : {}), sourceNavigation: item.sourceNavigation ?? sourceNavigationByItem[itemId], sellValue: isArtifact ? null : item.sellValue !== undefined ? item.sellValue : sellValues[itemId], canDestroy: isArtifact ? false : item.canDestroy ?? destroyability[itemId] ?? true, ...(isArtifact || item.actionRestrictionReason || actionRestrictionReasons[itemId] ? { actionRestrictionReason: isArtifact ? 'Artifact Equipment cannot be sold or destroyed.' : item.actionRestrictionReason ?? actionRestrictionReasons[itemId] } : {}) }]
})) as Record<ItemId, ItemDefinition>

/** Provisional dungeon materials used by the first equipment slice. */
export const SUPPORTING_DUNGEON_MATERIAL_IDS: readonly ItemId[] = [
  'wisp-essence', 'thorn-fiber', 'rootstone-shard', 'grove-bark', 'heartseed',
  'predator-fang', 'predator-hide', 'predator-sinew', 'corrupted-beast-essence', 'greatbear-core',
  'ossuary-remnant', 'graveglass-shard', 'soul-residue', 'burial-cloth', 'edrin-remnant',
]

export const NEW_DUNGEON_MATERIAL_IDS: readonly ItemId[] = ['thorn-fiber', 'rootstone-shard', 'predator-sinew', 'burial-cloth']

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
  if (ARTIFACTS[item.id]) return
  if (item.equipmentSlot === 'weapon') requireEquipmentStats(item.id, item.stats, ['basicDamage', 'spellPower'], errors)
  if (item.equipmentSlot === 'armor' || item.equipmentSlot === 'helmet' || item.equipmentSlot === 'cape') requireEquipmentStats(item.id, item.stats, ['maxHealth', 'defense'], errors)
  if (item.equipmentSlot === 'amulet') requireEquipmentCoreStats(item.id, item.stats, ['maxHealth', 'maxMana', 'spellPower', 'defense'], 'amulets', errors)
  if (item.equipmentSlot === 'ring') requireEquipmentCoreStats(item.id, item.stats, ['maxHealth', 'maxMana', 'spellPower', 'manaRegen'], 'rings', errors)
  if (item.equipmentSlot === 'earring') requireEquipmentCoreStats(item.id, item.stats, ['maxHealth', 'maxMana', 'spellPower', 'manaRegen'], 'earrings', errors)
}

const validateEquipmentMetadata = (item: ItemDefinition, errors: string[]) => {
  if (item.kind !== 'equipment') {
    if (item.equipmentTier !== undefined) errors.push(`${item.id}: only equipment items may define equipmentTier`)
    if (item.buildTags !== undefined) errors.push(`${item.id}: only equipment items may define buildTags`)
    if (item.equipmentBudgetProfile !== undefined) errors.push(`${item.id}: only equipment items may define equipmentBudgetProfile`)
    return
  }
  if (ARTIFACTS[item.id]) return
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
    validateEquipmentStats(item.id, item.stats, errors)
    validateEquipmentChassis(item, errors)
    validateEquipmentMetadata(item, errors)
    if (item.combat && item.kind !== 'equipment') errors.push(`${item.id}: only equipment items may define combat metadata`)
    errors.push(...validateCombatProvider(item.combat, `${item.id}.combat`, createCombatValidationContext(STATUS_DEFINITIONS)))
  })
  errors.push(...validateArtifactDefinitions(items))
  if (errors.length && import.meta.env.DEV) console.error(`[combat-items] ${errors.join('; ')}`)
  return errors
}

export const getResearchXp = (itemId: ItemId, targetSchoolId: SchoolId) => ITEMS[itemId].researchSchool === targetSchoolId ? BALANCE.research.matchingXp : BALANCE.research.nonMatchingXp
export const getResearchableItemIds = () => (Object.keys(ITEMS) as ItemId[]).filter((itemId) => ITEMS[itemId].kind === 'material' && Boolean(ITEMS[itemId].researchSchool))
export const getItemSourceLabel = (itemId: ItemId) => ITEMS[itemId].materialSubtype === 'elemental' || itemId === 'prismatic-fragment' ? 'Wizard Tower → Transmutation' : itemId === 'life-essence' ? 'Combat → all monsters' : ITEMS[itemId].source

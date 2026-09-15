import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 0 — Abandoned Catacombs — normal and boss Equipment/materials. */
export const ABANDONED_CATACOMBS_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Abandoned Catacombs. */
  'ossuary-mantle': combatEquipment({
    id: 'ossuary-mantle',
    name: 'Ossuary Mantle',
    description: 'Catacomb bone is stitched beneath dark cloth, each shard remembering a different element and dulling the bite of magic that strikes it.',
    icon: '▼',
    color: '#c9c3ae',
    equipmentTier: 1.6,
    buildTags: ['defense', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 30, defense: 8, maxMana: 20, resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } },
    sellValue: 110,
  }, 'Abandoned Catacombs'),

  /** Normal drop — Abandoned Catacombs. */
  'mourning-glass-earring': combatEquipment({
    id: 'mourning-glass-earring',
    name: 'Mourning Glass Earring',
    description: 'A sliver of graveglass polished with soul residue catches the dying echo of a curse and refuses to let the whisper fade too quickly.',
    icon: '◍',
    color: '#8d9dc9',
    equipmentTier: 1.6,
    buildTags: ['spell', 'status', 'dot', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 15, spellPower: 12, statusDurationPct: 0.10, cooldownRecoveryPct: 0.05 },
    sellValue: 110,
  }, 'Abandoned Catacombs'),

  /** Normal drop — Abandoned Catacombs. */
  'gravebinder-ring': combatEquipment({
    id: 'gravebinder-ring',
    name: 'Gravebinder Ring',
    description: 'Tiny runes crawl around this graveglass band whenever an enemy is afflicted, tightening with every weakness already laid upon them.',
    icon: 'O',
    color: '#70619b',
    equipmentTier: 1.6,
    buildTags: ['spell', 'status'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'ring',
    stats: { maxMana: 15, spellPower: 15 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.1, condition: { type: 'target-has-status-tag', tag: 'debuff' } }] },
    sellValue: 110,
  }, 'Abandoned Catacombs'),

  /** Normal drop — Abandoned Catacombs. */
  'soulglass-amulet': combatEquipment({
    id: 'soulglass-amulet',
    name: 'Soulglass Amulet',
    description: "A shard of soulglass bound around the echo of Edrin's final spell; curses linger near it as though unwilling to leave.",
    icon: '✤',
    color: '#8d9dc9',
    equipmentTier: 1.6,
    buildTags: ['spell', 'status', 'dot'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 20, spellPower: 15, statusDurationPct: 0.15, damageOverTimePct: 0.15 },
    sellValue: 110,
  }, 'Abandoned Catacombs'),

  /** Boss drop — Archmage Edrin's Shade. */
  'edrins-signet': combatEquipment({
    id: 'edrins-signet',
    name: "Edrin's Signet",
    description: "The Archmage's broken seal still carries a fragment of his warding instinct, raising a pale remnant whenever hostile magic takes hold.",
    icon: 'O',
    color: '#70619b',
    equipmentTier: 1.6,
    buildTags: ['spell', 'status', 'mana', 'barrier'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'ring',
    stats: { maxHealth: 20, maxMana: 20, manaRegen: 3, spellPower: 20, manaCostReductionPct: 0.1 },
    combat: { rules: [{ id: 'arcane-remnant', event: 'on-status-applied', condition: { type: 'all', conditions: [{ type: 'source-is-opponent' }, { type: 'event-target-is-self' }, { type: 'event-status-has-tag', tag: 'debuff' }] }, cooldownMs: 30_000, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], ui: { name: 'Arcane Remnant' } }] },
    sellValue: null,
  }, "Archmage Edrin's Shade"),

  /** Boss progression material — Archmage Edrin's Shade. */
  'black-portal-shard': {
    id: 'black-portal-shard',
    name: 'Black Portal Shard',
    description: 'A shard of impossible black crystal recovered from Archmage Edrin. Cold light shifts beneath its fractured surface, and the Wizard Tower itself seems to answer its presence.',
    icon: '◆',
    color: '#7760a8',
    kind: 'material',
    category: 'material',
    inventoryCategory: 'special',
    materialTier: 1,
    source: "Archmage Edrin's Shade — first defeat",
    sourceNavigation: 'combat',
    sellValue: null,
    canDestroy: false,
    actionRestrictionReason: 'The shard is bound to the Dark Portal and cannot be discarded.',
  },
}

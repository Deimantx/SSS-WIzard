import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Broken Meridian — normal and boss Equipment. */
export const BROKEN_MERIDIAN_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Broken Meridian. */
  'meridian-ring': combatEquipment({
    id: 'meridian-ring',
    name: 'Meridian Ring',
    description: 'Meridian Ring keeps critical timing sharp while shortening the recovery between actions.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.5,
    buildTags: ['crit', 'spell'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { critChance: 0.06, cooldownRecoveryPct: 0.08 },
    sellValue: 180,
  }, 'Broken Meridian'),

  /** Normal drop — Broken Meridian. */
  'linebreaker-earring': combatEquipment({
    id: 'linebreaker-earring',
    name: 'Linebreaker Earring',
    description: 'Linebreaker Earring channels the broken leyline into raw spell power and a larger Mana reserve.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.5,
    buildTags: ['spell', 'hybrid'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { spellPower: 23, maxMana: 26 },
    sellValue: 180,
  }, 'Broken Meridian'),

  /** Normal drop — Broken Meridian. */
  'fractured-conduit-pendant': combatEquipment({
    id: 'fractured-conduit-pendant',
    name: 'Fractured Conduit Pendant',
    description: 'Fractured Conduit Pendant protects a larger Focus reserve and makes its use more efficient.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2.5,
    buildTags: ['focus', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxFocus: 18, focusEfficiencyPct: 0.14 },
    sellValue: 180,
  }, 'Broken Meridian'),

  /** Normal drop — Broken Meridian. */
  'leyline-mantle': combatEquipment({
    id: 'leyline-mantle',
    name: 'Leyline Mantle',
    description: 'Leyline Mantle reinforces the body with a broad defensive shell for the Meridian\'s unstable currents.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 2.5,
    buildTags: ['defense', 'hybrid'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 66, defense: 14 },
    sellValue: 180,
  }, 'Broken Meridian'),

  /** Boss drop — Meridian Splitter. */
  'splitters-meridian-core': combatEquipment({
    id: 'splitters-meridian-core',
    name: "Splitter's Meridian Core",
    description: "Splitter's Meridian Core joins spell power with a durable frame and rewards steady damage across the fight.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.5,
    buildTags: ['hybrid', 'defense', 'spell'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 54, spellPower: 20 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.1 }] },
    sellValue: 180,
  }, 'Meridian Splitter'),
}

import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Broken Meridian — normal and boss Equipment. */
export const BROKEN_MERIDIAN_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Broken Meridian. */
  'meridian-ring': combatEquipment({
    id: 'meridian-ring',
    name: 'Meridian Ring',
    description: 'Meridian Ring carries the signature of Broken Meridian.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.5,
    buildTags: ['spell', 'hybrid', 'crit', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 25, spellPower: 14, critChance: 0.04, manaRegen: 2 },
    sellValue: 180,
  }, 'Broken Meridian'),

  /** Normal drop — Broken Meridian. */
  'linebreaker-earring': combatEquipment({
    id: 'linebreaker-earring',
    name: 'Linebreaker Earring',
    description: 'Linebreaker Earring carries the signature of Broken Meridian.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.5,
    buildTags: ['spell', 'hybrid', 'focus', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 31, spellPower: 15, maxFocus: 8 },
    sellValue: 180,
  }, 'Broken Meridian'),

  /** Normal drop — Broken Meridian. */
  'fractured-conduit-pendant': combatEquipment({
    id: 'fractured-conduit-pendant',
    name: 'Fractured Conduit Pendant',
    description: 'Fractured Conduit Pendant carries the signature of Broken Meridian.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2.5,
    buildTags: ['spell', 'hybrid', 'mana', 'focus'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 40, maxMana: 30, spellPower: 15, maxFocus: 10 },
    sellValue: 180,
  }, 'Broken Meridian'),

  /** Normal drop — Broken Meridian. */
  'leyline-mantle': combatEquipment({
    id: 'leyline-mantle',
    name: 'Leyline Mantle',
    description: 'Leyline Mantle carries the signature of Broken Meridian.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 2.5,
    buildTags: ['defense', 'hybrid', 'sustain', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 46, defense: 12, maxMana: 16, resistances: { fire: 0.04, water: 0.04, earth: 0.04, air: 0.04 } },
    sellValue: 180,
  }, 'Broken Meridian'),

  /** Boss drop — Meridian Splitter. */
  'splitters-meridian-core': combatEquipment({
    id: 'splitters-meridian-core',
    name: "Splitter's Meridian Core",
    description: "Splitter's Meridian Core carries the signature of Meridian Splitter.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.5,
    buildTags: ['spell', 'hybrid', 'mana', 'focus'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 62, maxMana: 46, maxFocus: 14, spellPower: 20 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.1 }] },
    sellValue: 180,
  }, 'Meridian Splitter'),
}

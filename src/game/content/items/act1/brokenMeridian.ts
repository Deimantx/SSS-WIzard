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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 36, maxMana: 18 },
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
    buildTags: ['defense', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 48, defense: 12 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Meridian Splitter'),
}

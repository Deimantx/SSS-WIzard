import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Crossroads of Ruin — normal and boss Equipment. */
export const CROSSROADS_OF_RUIN_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Crossroads of Ruin. */
  'wayfarer-earring': combatEquipment({
    id: 'wayfarer-earring',
    name: 'Wayfarer Earring',
    description: 'Wayfarer Earring carries the signature of Crossroads of Ruin.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2,
    buildTags: ['spell', 'hybrid', 'mana', 'focus'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 26, spellPower: 13, maxFocus: 6 },
    sellValue: 180,
  }, 'Crossroads of Ruin'),

  /** Normal drop — Crossroads of Ruin. */
  'crossroads-signet': combatEquipment({
    id: 'crossroads-signet',
    name: 'Crossroads Signet',
    description: 'Crossroads Signet carries the signature of Crossroads of Ruin.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2,
    buildTags: ['spell', 'hybrid', 'crit', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 18, spellPower: 12, critChance: 0.035, manaRegen: 2 },
    sellValue: 180,
  }, 'Crossroads of Ruin'),

  /** Normal drop — Crossroads of Ruin. */
  'confluence-pendant': combatEquipment({
    id: 'confluence-pendant',
    name: 'Confluence Pendant',
    description: 'Confluence Pendant carries the signature of Crossroads of Ruin.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2,
    buildTags: ['spell', 'hybrid', 'mana', 'focus'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 34, maxMana: 25, maxFocus: 8, spellPower: 10 },
    sellValue: 180,
  }, 'Crossroads of Ruin'),

  /** Boss drop — Crossroads Keeper. */
  'keepers-roadseal': combatEquipment({
    id: 'keepers-roadseal',
    name: "Keeper's Roadseal",
    description: "Keeper's Roadseal carries the signature of Crossroads Keeper.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2,
    buildTags: ['spell', 'hybrid', 'mana', 'focus'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 50, maxMana: 38, maxFocus: 12, spellPower: 17 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.08 }] },
    sellValue: 180,
  }, 'Crossroads Keeper'),
}

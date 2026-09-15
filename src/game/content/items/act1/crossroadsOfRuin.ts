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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 36, maxMana: 18 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Crossroads Keeper'),
}

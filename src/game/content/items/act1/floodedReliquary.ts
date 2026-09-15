import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Flooded Reliquary — normal and boss Equipment. */
export const FLOODED_RELIQUARY_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Flooded Reliquary. */
  'mistglass-earring': combatEquipment({
    id: 'mistglass-earring',
    name: 'Mistglass Earring',
    description: 'Mistglass Earring carries the signature of Flooded Reliquary.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
    sellValue: 180,
  }, 'Flooded Reliquary'),

  /** Normal drop — Flooded Reliquary. */
  'reliquary-ring': combatEquipment({
    id: 'reliquary-ring',
    name: 'Reliquary Ring',
    description: 'Reliquary Ring carries the signature of Flooded Reliquary.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
    sellValue: 180,
  }, 'Flooded Reliquary'),

  /** Normal drop — Flooded Reliquary. */
  'drowned-chain-pendant': combatEquipment({
    id: 'drowned-chain-pendant',
    name: 'Drowned Chain Pendant',
    description: 'Drowned Chain Pendant carries the signature of Flooded Reliquary.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 36, maxMana: 18 },
    sellValue: 180,
  }, 'Flooded Reliquary'),

  /** Boss drop — Drowned Keeper. */
  'keepers-tide-seal': combatEquipment({
    id: 'keepers-tide-seal',
    name: "Keeper's Tide Seal",
    description: "Keeper's Tide Seal carries the signature of Drowned Keeper.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 1.8,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Drowned Keeper'),
}

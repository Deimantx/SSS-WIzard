import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Flooded Reliquary — normal and boss Equipment. */
export const FLOODED_RELIQUARY_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Flooded Reliquary. */
  'mistglass-earring': combatEquipment({
    id: 'mistglass-earring',
    name: 'Mistglass Earring',
    description: 'Mistglass Earring turns the Reliquary’s cold pressure into a stronger Mana reserve and ward.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['mana', 'barrier'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 36, barrierPowerPct: 0.08 },
    sellValue: 180,
  }, 'Flooded Reliquary'),

  /** Normal drop — Flooded Reliquary. */
  'reliquary-ring': combatEquipment({
    id: 'reliquary-ring',
    name: 'Reliquary Ring',
    description: 'Reliquary Ring keeps the wearer supplied with deeper Mana and a steady recovery tide.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['mana', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 22, manaRegen: 3 },
    sellValue: 180,
  }, 'Flooded Reliquary'),

  /** Normal drop — Flooded Reliquary. */
  'drowned-chain-pendant': combatEquipment({
    id: 'drowned-chain-pendant',
    name: 'Drowned Chain Pendant',
    description: 'Drowned Chain Pendant anchors the wearer in the Reliquary’s current, preserving health and incoming Barrier.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['water', 'sustain', 'barrier'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 42, maxMana: 24 },
    combat: { modifiers: [{ key: 'barrier-received-percent', value: 0.08 }] },
    sellValue: 180,
  }, 'Flooded Reliquary'),

  /** Boss drop — Drowned Keeper. */
  'keepers-tide-seal': combatEquipment({
    id: 'keepers-tide-seal',
    name: "Keeper's Tide Seal",
    description: "Keeper's Tide Seal commands the Drowned Keeper's tide, expanding Mana and reinforcing every Barrier received.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 1.8,
    buildTags: ['water', 'mana', 'barrier'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxMana: 42, barrierPowerPct: 0.12 },
    combat: { modifiers: [{ key: 'barrier-received-percent', value: 0.14 }] },
    sellValue: 180,
  }, 'Drowned Keeper'),
}

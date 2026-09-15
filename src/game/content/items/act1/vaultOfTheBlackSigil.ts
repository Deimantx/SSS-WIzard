import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Vault of the Black Sigil — normal and boss Equipment. */
export const VAULT_OF_THE_BLACK_SIGIL_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Vault of the Black Sigil. */
  'black-sigil-ring': combatEquipment({
    id: 'black-sigil-ring',
    name: 'Black Sigil Ring',
    description: 'Black Sigil Ring layers a hard ward over the hand, improving Defense and Barrier strength.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['defense', 'barrier'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { defense: 8, barrierPowerPct: 0.14 },
    sellValue: 180,
  }, 'Vault of the Black Sigil'),

  /** Normal drop — Vault of the Black Sigil. */
  'inkbound-earring': combatEquipment({
    id: 'inkbound-earring',
    name: 'Inkbound Earring',
    description: 'Inkbound Earring stores Mana inside a reinforced seal, making the wearer\'s Barrier more resilient.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['mana', 'barrier'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 34, barrierPowerPct: 0.16 },
    sellValue: 180,
  }, 'Vault of the Black Sigil'),

  /** Normal drop — Vault of the Black Sigil. */
  'vaultseal-mantle': combatEquipment({
    id: 'vaultseal-mantle',
    name: 'Vaultseal Mantle',
    description: 'Vaultseal Mantle fortifies the body with broad elemental wards and a heavy defensive shell.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['defense', 'barrier', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 72, defense: 16, resistances: { fire: 0.05, water: 0.05, earth: 0.05, air: 0.05 } },
    sellValue: 180,
  }, 'Vault of the Black Sigil'),

  /** Boss drop — Sigil Warden. */
  'wardens-black-sigil': combatEquipment({
    id: 'wardens-black-sigil',
    name: "Warden's Black Sigil",
    description: "Warden's Black Sigil raises a formidable defense and makes every incoming Barrier harder to break.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.7,
    buildTags: ['defense', 'barrier'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 78, defense: 18 },
    combat: { modifiers: [{ key: 'barrier-received-percent', value: 0.18 }] },
    sellValue: 180,
  }, 'Sigil Warden'),
}

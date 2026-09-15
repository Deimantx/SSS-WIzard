import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Vault of the Black Sigil — normal and boss Equipment. */
export const VAULT_OF_THE_BLACK_SIGIL_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Vault of the Black Sigil. */
  'black-sigil-ring': combatEquipment({
    id: 'black-sigil-ring',
    name: 'Black Sigil Ring',
    description: 'Black Sigil Ring carries the signature of Vault of the Black Sigil.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['defense', 'barrier', 'mana', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxHealth: 32, maxMana: 20, defense: 6, barrierPowerPct: 0.1 },
    sellValue: 180,
  }, 'Vault of the Black Sigil'),

  /** Normal drop — Vault of the Black Sigil. */
  'inkbound-earring': combatEquipment({
    id: 'inkbound-earring',
    name: 'Inkbound Earring',
    description: 'Inkbound Earring carries the signature of Vault of the Black Sigil.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['defense', 'barrier', 'mana', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxHealth: 25, maxMana: 26, spellPower: 10, barrierPowerPct: 0.12 },
    sellValue: 180,
  }, 'Vault of the Black Sigil'),

  /** Normal drop — Vault of the Black Sigil. */
  'vaultseal-mantle': combatEquipment({
    id: 'vaultseal-mantle',
    name: 'Vaultseal Mantle',
    description: 'Vaultseal Mantle carries the signature of Vault of the Black Sigil.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['defense', 'barrier', 'sustain', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 54, defense: 14, maxMana: 18, resistances: { fire: 0.06, water: 0.06, earth: 0.06, air: 0.06 } },
    sellValue: 180,
  }, 'Vault of the Black Sigil'),

  /** Boss drop — Sigil Warden. */
  'wardens-black-sigil': combatEquipment({
    id: 'wardens-black-sigil',
    name: "Warden's Black Sigil",
    description: "Warden's Black Sigil carries the signature of Sigil Warden.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.7,
    buildTags: ['defense', 'barrier', 'mana', 'sustain'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 70, maxMana: 38, defense: 18, barrierPowerPct: 0.16 },
    combat: { modifiers: [{ key: 'barrier-received-percent', value: 0.16 }] },
    sellValue: 180,
  }, 'Sigil Warden'),
}

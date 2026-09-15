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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
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
    buildTags: ['defense', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 48, defense: 12 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Sigil Warden'),
}

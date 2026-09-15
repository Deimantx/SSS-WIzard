import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Stormvault Gallery — normal and boss Equipment. */
export const STORMVAULT_GALLERY_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Stormvault Gallery. */
  'voltglass-earring': combatEquipment({
    id: 'voltglass-earring',
    name: 'Voltglass Earring',
    description: 'Voltglass Earring carries the signature of Stormvault Gallery.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
    sellValue: 180,
  }, 'Stormvault Gallery'),

  /** Normal drop — Stormvault Gallery. */
  'stormcoil-ring': combatEquipment({
    id: 'stormcoil-ring',
    name: 'Stormcoil Ring',
    description: 'Stormcoil Ring carries the signature of Stormvault Gallery.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
    sellValue: 180,
  }, 'Stormvault Gallery'),

  /** Normal drop — Stormvault Gallery. */
  'gale-scribe-pendant': combatEquipment({
    id: 'gale-scribe-pendant',
    name: 'Gale Scribe Pendant',
    description: 'Gale Scribe Pendant carries the signature of Stormvault Gallery.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 36, maxMana: 18 },
    sellValue: 180,
  }, 'Stormvault Gallery'),

  /** Boss drop — Storm Archivist. */
  'archivists-conductor': combatEquipment({
    id: 'archivists-conductor',
    name: "Archivist's Conductor",
    description: "Archivist's Conductor carries the signature of Storm Archivist.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Storm Archivist'),
}

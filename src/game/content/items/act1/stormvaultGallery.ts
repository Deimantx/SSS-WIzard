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
    buildTags: ['spell', 'air', 'basic-attack', 'crit'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 24, spellPower: 13, cooldownRecoveryPct: 0.07 },
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
    buildTags: ['spell', 'air', 'basic-attack', 'crit'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 16, spellPower: 11, critChance: 0.04, basicAttackSpeedPct: 0.04, cooldownRecoveryPct: 0.06 },
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
    buildTags: ['spell', 'air', 'mana', 'focus'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 28, maxMana: 25, spellPower: 12, cooldownRecoveryPct: 0.05 },
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
    buildTags: ['spell', 'air', 'basic-attack', 'crit'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 48, maxMana: 32, spellPower: 17, cooldownRecoveryPct: 0.1 },
    combat: { modifiers: [{ key: 'action-speed-percent', value: 0.08 }] },
    sellValue: 180,
  }, 'Storm Archivist'),
}

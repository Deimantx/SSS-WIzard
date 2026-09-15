import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Stormvault Gallery — normal and boss Equipment. */
export const STORMVAULT_GALLERY_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Stormvault Gallery. */
  'voltglass-earring': combatEquipment({
    id: 'voltglass-earring',
    name: 'Voltglass Earring',
    description: 'Voltglass Earring turns the Gallery\'s charged air into faster spell recovery and precise casting power.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'air'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { spellPower: 17, cooldownRecoveryPct: 0.10 },
    sellValue: 180,
  }, 'Stormvault Gallery'),

  /** Normal drop — Stormvault Gallery. */
  'stormcoil-ring': combatEquipment({
    id: 'stormcoil-ring',
    name: 'Stormcoil Ring',
    description: 'Stormcoil Ring accelerates basic attacks while keeping critical hits ready for the next opening.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['basic-attack', 'crit'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { critChance: 0.05, basicAttackSpeedPct: 0.08 },
    sellValue: 180,
  }, 'Stormvault Gallery'),

  /** Normal drop — Stormvault Gallery. */
  'gale-scribe-pendant': combatEquipment({
    id: 'gale-scribe-pendant',
    name: 'Gale Scribe Pendant',
    description: 'Gale Scribe Pendant gives an Air caster the Mana reserve and tempo needed to keep pressure flowing.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['mana', 'air'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxMana: 32, cooldownRecoveryPct: 0.08 },
    sellValue: 180,
  }, 'Stormvault Gallery'),

  /** Boss drop — Storm Archivist. */
  'archivists-conductor': combatEquipment({
    id: 'archivists-conductor',
    name: "Archivist's Conductor",
    description: "Archivist's Conductor conducts charged Air through every spell, shortening recovery and accelerating action speed.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.2,
    buildTags: ['spell', 'air'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { cooldownRecoveryPct: 0.12, spellPower: 19 },
    combat: { modifiers: [{ key: 'action-speed-percent', value: 0.08 }] },
    sellValue: 180,
  }, 'Storm Archivist'),
}

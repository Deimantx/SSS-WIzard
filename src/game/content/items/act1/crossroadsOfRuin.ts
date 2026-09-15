import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Crossroads of Ruin — normal and boss Equipment. */
export const CROSSROADS_OF_RUIN_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Crossroads of Ruin. */
  'wayfarer-earring': combatEquipment({
    id: 'wayfarer-earring',
    name: 'Wayfarer Earring',
    description: 'Wayfarer Earring helps a roaming caster keep spells moving through every turn of the crossing.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2,
    buildTags: ['spell', 'hybrid'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { spellPower: 16, cooldownRecoveryPct: 0.08 },
    sellValue: 180,
  }, 'Crossroads of Ruin'),

  /** Normal drop — Crossroads of Ruin. */
  'crossroads-signet': combatEquipment({
    id: 'crossroads-signet',
    name: 'Crossroads Signet',
    description: 'Crossroads Signet sharpens critical timing while restoring a small amount of Mana between casts.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2,
    buildTags: ['crit', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { critChance: 0.05, manaRegen: 3 },
    sellValue: 180,
  }, 'Crossroads of Ruin'),

  /** Normal drop — Crossroads of Ruin. */
  'confluence-pendant': combatEquipment({
    id: 'confluence-pendant',
    name: 'Confluence Pendant',
    description: 'Confluence Pendant gathers the crossing roads into deeper Focus and more efficient spell preparation.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2,
    buildTags: ['focus', 'hybrid'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'amulet',
    stats: { maxFocus: 14, focusEfficiencyPct: 0.12 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.08 }] },
    sellValue: 180,
  }, 'Crossroads of Ruin'),

  /** Boss drop — Crossroads Keeper. */
  'keepers-roadseal': combatEquipment({
    id: 'keepers-roadseal',
    name: "Keeper's Roadseal",
    description: "Keeper's Roadseal lets the Crossroads Keeper's ward travel with the wizard, balancing resilience with reliable damage.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2,
    buildTags: ['hybrid', 'sustain'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 48, maxMana: 30 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.08 }] },
    sellValue: 180,
  }, 'Crossroads Keeper'),
}

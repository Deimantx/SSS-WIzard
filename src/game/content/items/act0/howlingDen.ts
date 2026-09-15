import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 0 — Howling Den — normal and boss Equipment. */
export const HOWLING_DEN_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Howling Den. */
  'predator-hide-mantle': combatEquipment({
    id: 'predator-hide-mantle',
    name: 'Predator-Hide Mantle',
    description: 'Cured from hides steeped in corrupted moonlight, the mantle carries a hunter\'s stubbornness and refuses to let wounds slow the chase.',
    icon: '▼',
    color: '#8f7469',
    equipmentTier: 1.3,
    buildTags: ['defense', 'status'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'cape',
    stats: { maxHealth: 20, defense: 5, resistances: { physical: 0.05 } },
    combat: { modifiers: [{ key: 'status-duration-received-percent', value: -0.1, statusTags: ['debuff'] }] },
    sellValue: 70,
  }, 'Howling Den'),

  /** Normal drop — Howling Den. */
  'fangwire-earring': combatEquipment({
    id: 'fangwire-earring',
    name: 'Fangwire Earring',
    description: 'A predator fang hung from blackened wire warms against the skin when an opening appears, turning hesitation into a sharper strike.',
    icon: '⌁',
    color: '#c18b73',
    equipmentTier: 1.3,
    buildTags: ['spell', 'crit', 'basic-attack'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxHealth: 10, spellPower: 8, critChance: 0.03, critDamage: 0.10 },
    sellValue: 70,
  }, 'Howling Den'),

  /** Normal drop — Howling Den. */
  'howling-signet': combatEquipment({
    id: 'howling-signet',
    name: 'Howling Signet',
    description: 'Scratched with the marks of successful hunts, the signet drinks the last warmth of a fallen foe and feeds it back into its bearer.',
    icon: 'O',
    color: '#c18b73',
    equipmentTier: 1.3,
    buildTags: ['basic-attack', 'crit', 'sustain'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'ring',
    stats: { maxHealth: 15, maxMana: 20, critChance: 0.02, basicAttackSpeedPct: 0.02 },
    combat: { rules: [{ id: 'predators-feast', event: 'on-kill', effects: [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 25 } }], ui: { name: "Predator's Feast" } }] },
    sellValue: 70,
  }, 'Howling Den'),

  /** Boss drop — Corrupted Greatbear. */
  'greatbear-heartstone': combatEquipment({
    id: 'greatbear-heartstone',
    name: 'Greatbear Heartstone',
    description: 'A fist-sized core that pulses with the Greatbear\'s refusal to die, gathering shattered magic around the same stubborn rhythm.',
    icon: 'O',
    color: '#806b69',
    equipmentTier: 1.3,
    buildTags: ['defense', 'sustain', 'barrier'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 40, healthRegen: 1, defense: 15, resistances: { fire: 0.05, water: 0.05, earth: 0.05, air: 0.05 } },
    combat: { rules: [{ id: 'unyielding', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 35 }, oncePerEncounter: true, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 } }], ui: { name: 'Unyielding' } }] },
    sellValue: null,
  }, 'Corrupted Greatbear'),
}

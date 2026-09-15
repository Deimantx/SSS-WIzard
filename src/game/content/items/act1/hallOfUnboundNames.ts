import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Hall of Unbound Names — normal and boss Equipment. */
export const HALL_OF_UNBOUND_NAMES_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Hall of Unbound Names. */
  'nameless-ring': combatEquipment({
    id: 'nameless-ring',
    name: 'Nameless Ring',
    description: 'Nameless Ring makes debuffs linger while keeping damage over time effects active for longer.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['status', 'dot'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { statusDurationPct: 0.16, damageOverTimePct: 0.14 },
    sellValue: 180,
  }, 'Hall of Unbound Names'),

  /** Normal drop — Hall of Unbound Names. */
  'whisper-earring': combatEquipment({
    id: 'whisper-earring',
    name: 'Whisper Earring',
    description: 'Whisper Earring turns every debuffed target into an opening for stronger spell damage.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['spell', 'status'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'earring',
    stats: { spellPower: 21 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.10, condition: { type: 'target-has-status-tag', tag: 'debuff' } }] },
    sellValue: 180,
  }, 'Hall of Unbound Names'),

  /** Normal drop — Hall of Unbound Names. */
  'unbound-seal-pendant': combatEquipment({
    id: 'unbound-seal-pendant',
    name: 'Unbound Seal Pendant',
    description: 'Unbound Seal Pendant expands Focus while reducing the time hostile control can hold the wearer.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['focus', 'defense'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'amulet',
    stats: { maxFocus: 18, focusEfficiencyPct: 0.10 },
    combat: { modifiers: [{ key: 'control-duration-received-percent', value: -0.18 }] },
    sellValue: 180,
  }, 'Hall of Unbound Names'),

  /** Boss drop — Unspoken Prelate. */
  'prelates-unspoken-seal': combatEquipment({
    id: 'prelates-unspoken-seal',
    name: "Prelate's Unspoken Seal",
    description: "Prelate's Unspoken Seal makes hostile debuffs linger longer while empowering the wizard's spellcraft.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.7,
    buildTags: ['spell', 'status', 'dot'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { spellPower: 22, statusDurationPct: 0.18 },
    combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.15, statusTags: ['debuff'] }] },
    sellValue: 180,
  }, 'Unspoken Prelate'),
}

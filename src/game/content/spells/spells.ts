import type { CombatEffect, SpellDefinition, SpellId } from '../../types'

const damage = (school: 'fire' | 'water' | 'earth' | 'air', value: number, levelScaling = false): CombatEffect => ({
  type: 'deal-damage', target: 'opponent', damageType: school, school, magnitude: levelScaling ? { type: 'school-level', base: value, perLevel: 2, school } : { type: 'flat', value }, tags: ['direct'],
})
const barrier = (value: number): CombatEffect => ({ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value }, mode: 'replace', durationMs: 9000, tags: ['barrier'] })
const heal = (value: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'flat', value }, tags: ['heal', 'direct', 'water'] })

export const SPELLS: Record<SpellId, SpellDefinition> = {
  'fire-bolt': { id: 'fire-bolt', name: 'Fire Bolt', school: 'fire', description: 'A fast, reliable bolt of flame.', unlockLevel: 2, manaCost: 12, cooldownMs: 3500, autoCastFocus: 15, type: 'damage', effects: [damage('fire', 28, true)], damage: 28, autoCondition: { type: 'always' } },
  'water-ward': { id: 'water-ward', name: 'Water Ward', school: 'water', description: 'Wraps the wizard in a temporary barrier.', unlockLevel: 2, manaCost: 15, cooldownMs: 8000, autoCastFocus: 20, type: 'barrier', effects: [barrier(35)], barrier: 35, autoCondition: { type: 'barrier-below', value: 10 } },
  'earth-spike': { id: 'earth-spike', name: 'Earth Spike', school: 'earth', description: 'A heavy spike that punishes rooted enemies.', unlockLevel: 2, manaCost: 18, cooldownMs: 5000, autoCastFocus: 20, type: 'damage', effects: [damage('earth', 40, true)], damage: 40, autoCondition: { type: 'always' } },
  'air-lance': { id: 'air-lance', name: 'Air Lance', school: 'air', description: 'A sharp gust that disrupts the next attack.', unlockLevel: 2, manaCost: 14, cooldownMs: 6000, autoCastFocus: 15, type: 'damage', effects: [damage('air', 24, true)], damage: 24, autoCondition: { type: 'always' } },
  ignite: { id: 'ignite', name: 'Ignite', school: 'fire', description: 'A spark that burns after it lands.', unlockLevel: 4, manaCost: 18, cooldownMs: 9000, autoCastFocus: 20, type: 'dot', effects: [damage('fire', 10), { type: 'apply-status', target: 'opponent', statusId: 'burning', tags: ['debuff'] }], autoCondition: { type: 'always' } },
  'flow-mend': { id: 'flow-mend', name: 'Flow Mend', school: 'water', description: 'A restorative current for a wounded wizard.', unlockLevel: 4, manaCost: 18, cooldownMs: 10000, autoCastFocus: 25, type: 'heal', effects: [heal(30)], autoCondition: { type: 'health-below', percent: 70 } },
  stoneguard: { id: 'stoneguard', name: 'Stoneguard', school: 'earth', description: 'A durable shell of living stone.', unlockLevel: 4, manaCost: 20, cooldownMs: 12000, autoCastFocus: 25, type: 'barrier', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 45 }, mode: 'replace', durationMs: 9000, tags: ['barrier'] }], autoCondition: { type: 'barrier-below', value: 10 } },
  quickening: { id: 'quickening', name: 'Quickening', school: 'air', description: 'A gust that accelerates every Basic Attack.', unlockLevel: 4, manaCost: 16, cooldownMs: 12000, autoCastFocus: 20, type: 'buff', effects: [{ type: 'apply-status', target: 'self', statusId: 'quickening', tags: ['buff'] }], autoCondition: { type: 'always' } },
}

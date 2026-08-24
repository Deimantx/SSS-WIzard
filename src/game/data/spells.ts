import type { SpellDefinition, SpellEffect, SpellId } from '../types'

const damage = (amount: number): SpellEffect => ({ type: 'damage', amount })

export const SPELLS: Record<SpellId, SpellDefinition> = {
  'fire-bolt': { id: 'fire-bolt', name: 'Fire Bolt', school: 'fire', description: 'A fast, reliable bolt of flame.', unlockLevel: 2, manaCost: 12, cooldownMs: 3500, autoCastFocus: 15, type: 'damage', effect: damage(28), damage: 28, autoCondition: { type: 'always' } },
  'water-ward': { id: 'water-ward', name: 'Water Ward', school: 'water', description: 'Wraps the wizard in a temporary barrier.', unlockLevel: 2, manaCost: 15, cooldownMs: 8000, autoCastFocus: 20, type: 'barrier', effect: { type: 'barrier', amount: 35 }, barrier: 35, autoCondition: { type: 'barrier-below', value: 10 } },
  'earth-spike': { id: 'earth-spike', name: 'Earth Spike', school: 'earth', description: 'A heavy spike that punishes rooted enemies.', unlockLevel: 2, manaCost: 18, cooldownMs: 5000, autoCastFocus: 20, type: 'damage', effect: damage(40), damage: 40, autoCondition: { type: 'always' } },
  'air-lance': { id: 'air-lance', name: 'Air Lance', school: 'air', description: 'A sharp gust that disrupts the next attack.', unlockLevel: 2, manaCost: 14, cooldownMs: 6000, autoCastFocus: 15, type: 'damage', effect: damage(24), damage: 24, autoCondition: { type: 'always' } },
  ignite: { id: 'ignite', name: 'Ignite', school: 'fire', description: 'A spark that burns after it lands.', unlockLevel: 4, manaCost: 18, cooldownMs: 9000, autoCastFocus: 20, type: 'dot', effect: { type: 'dot', statusId: 'burning', durationMs: 5000, damagePerTick: 5, tickMs: 1000 }, autoCondition: { type: 'always' } },
  'flow-mend': { id: 'flow-mend', name: 'Flow Mend', school: 'water', description: 'A restorative current for a wounded wizard.', unlockLevel: 4, manaCost: 18, cooldownMs: 10000, autoCastFocus: 25, type: 'heal', effect: { type: 'heal', amount: 30 }, autoCondition: { type: 'health-below', percent: 70 } },
  stoneguard: { id: 'stoneguard', name: 'Stoneguard', school: 'earth', description: 'A durable shell of living stone.', unlockLevel: 4, manaCost: 20, cooldownMs: 12000, autoCastFocus: 25, type: 'barrier', effect: { type: 'barrier', amount: 45 }, autoCondition: { type: 'barrier-below', value: 10 } },
  quickening: { id: 'quickening', name: 'Quickening', school: 'air', description: 'A gust that accelerates every Basic Attack.', unlockLevel: 4, manaCost: 16, cooldownMs: 12000, autoCastFocus: 20, type: 'buff', effect: { type: 'buff', statusId: 'quickening', durationMs: 6000, value: 0.25 }, autoCondition: { type: 'always' } },
}

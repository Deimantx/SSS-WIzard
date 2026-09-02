import type { CombatEffect, SpellDefinition, SpellId } from '../../types'
import { SCHOOLS } from '../schools/schools'
import { periodicDamageStatus } from '../statuses/periodicDamageStatus'
import { validateCombatEffect } from '../../systems/combat/combatEffectValidation'

const damage = (school: 'fire' | 'water' | 'earth' | 'air', coefficient: number): CombatEffect => ({
  type: 'deal-damage', target: 'opponent', components: [{ damageType: school, magnitude: { type: 'spell-power', coefficient } }], school, tags: ['direct'],
})
const barrier = (coefficient: number): CombatEffect => ({ type: 'gain-barrier', target: 'self', magnitude: { type: 'spell-power', coefficient }, mode: 'replace', durationMs: 9000, tags: ['barrier'] })
const heal = (coefficient: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'spell-power', coefficient }, tags: ['heal', 'direct', 'water'] })

export const SPELLS: Record<SpellId, SpellDefinition> = {
  'fire-bolt': { id: 'fire-bolt', name: 'Fire Bolt', school: 'fire', description: 'A fast, reliable bolt of flame.', unlockLevel: 2, manaCost: 12, cooldownMs: 3500, type: 'damage', effects: [damage('fire', 0.6)], autoCondition: { type: 'always' } },
  ignite: { id: 'ignite', name: 'Ignite', school: 'fire', description: 'A spark that burns after it lands.', unlockLevel: 8, manaCost: 18, cooldownMs: 9000, type: 'dot', effects: [damage('fire', 0.1), periodicDamageStatus({ statusId: 'burning', durationMs: 6000, totalMagnitude: { type: 'spell-power', coefficient: 1 }, damageType: 'fire' })], autoCondition: { type: 'always' } },
  fireball: { id: 'fireball', name: 'Fireball', school: 'fire', description: 'A heavy sphere of flame that erupts on impact and leaves a lasting burn.', unlockLevel: 16, manaCost: 28, cooldownMs: 10000, type: 'damage', effects: [damage('fire', 1), periodicDamageStatus({ statusId: 'burning', durationMs: 10000, totalMagnitude: { type: 'spell-power', coefficient: 0.2 }, damageType: 'fire' })], autoCondition: { type: 'always' } },
  'water-ward': { id: 'water-ward', name: 'Water Ward', school: 'water', description: 'Wraps the wizard in a frequent, flexible barrier.', unlockLevel: 2, manaCost: 15, cooldownMs: 8000, type: 'barrier', effects: [barrier(0.7)], autoCondition: { type: 'barrier-below', value: 10 } },
  'flow-mend': { id: 'flow-mend', name: 'Flow Mend', school: 'water', description: 'A restorative current for a wounded wizard.', unlockLevel: 8, manaCost: 18, cooldownMs: 10000, type: 'heal', effects: [heal(0.8)], autoCondition: { type: 'health-below', percent: 70 } },
  frostbite: { id: 'frostbite', name: 'Frostbite', school: 'water', description: 'Bites into the enemy with cold and slows its combat tempo.', unlockLevel: 16, manaCost: 22, cooldownMs: 10000, type: 'damage', effects: [damage('water', 0.65), { type: 'apply-status', target: 'opponent', statusId: 'chilled', tags: ['debuff', 'control'] }], autoCondition: { type: 'always' } },
  'earth-spike': { id: 'earth-spike', name: 'Earth Spike', school: 'earth', description: 'A heavy spike that strikes with earthen force.', unlockLevel: 2, manaCost: 18, cooldownMs: 5000, type: 'damage', effects: [damage('earth', 0.85)], autoCondition: { type: 'always' } },
  stoneguard: { id: 'stoneguard', name: 'Stoneguard', school: 'earth', description: 'A large shell of living stone prepared for danger.', unlockLevel: 8, manaCost: 22, cooldownMs: 18000, type: 'barrier', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'spell-power', coefficient: 1.3 }, mode: 'replace', durationMs: 9000, tags: ['barrier'] }], autoCondition: { type: 'barrier-below', value: 10 } },
  fortify: { id: 'fortify', name: 'Fortify', school: 'earth', description: 'Reduces all incoming damage for a short duration.', unlockLevel: 16, manaCost: 20, cooldownMs: 18000, type: 'buff', effects: [{ type: 'apply-status', target: 'self', statusId: 'fortified', tags: ['buff'] }], autoCondition: { type: 'always' } },
  'air-lance': { id: 'air-lance', name: 'Air Lance', school: 'air', description: 'A focused lance of compressed air that strikes the enemy.', unlockLevel: 2, manaCost: 14, cooldownMs: 6000, type: 'damage', effects: [damage('air', 0.6)], autoCondition: { type: 'always' } },
  quickening: { id: 'quickening', name: 'Quickening', school: 'air', description: 'A gust that accelerates every Basic Attack.', unlockLevel: 8, manaCost: 16, cooldownMs: 12000, type: 'buff', effects: [{ type: 'apply-status', target: 'self', statusId: 'quickening', tags: ['buff'] }], autoCondition: { type: 'always' } },
  'shock-spark': { id: 'shock-spark', name: 'Shock Spark', school: 'air', description: 'A spark that leaves the enemy vulnerable to subsequent Air damage.', unlockLevel: 16, manaCost: 18, cooldownMs: 8000, type: 'damage', effects: [damage('air', 0.45), { type: 'apply-status', target: 'opponent', statusId: 'shock', stacks: 1, tags: ['debuff'] }], autoCondition: { type: 'always' } },
}

export const validateSpellDefinitions = () => {
  const errors: string[] = []
  const ids = Object.values(SPELLS).map((spell) => spell.id)
  if (new Set(ids).size !== ids.length) errors.push('duplicate spell id')
  Object.entries(SPELLS).forEach(([key, spell]) => {
    if (key !== spell.id) errors.push(`${key}: key/id mismatch`)
    if (!SCHOOLS[spell.school]) errors.push(`${spell.id}: unknown school`)
    if (!Number.isInteger(spell.unlockLevel) || spell.unlockLevel < 1) errors.push(`${spell.id}: invalid unlock level`)
    if (!Number.isFinite(spell.manaCost) || spell.manaCost < 0) errors.push(`${spell.id}: invalid mana cost`)
    if (!Number.isFinite(spell.cooldownMs) || spell.cooldownMs < 0) errors.push(`${spell.id}: invalid cooldown`)
    if (!spell.effects.length) errors.push(`${spell.id}: effects must not be empty`)
    const validateEffect = (effect: CombatEffect) => {
      errors.push(...validateCombatEffect(effect, `${spell.id}.effect`))
      if (effect.type === 'apply-status') {
        effect.periodicEffects?.forEach((periodicEffect) => {
          if (periodicEffect.type === 'deal-damage' && periodicEffect.components.some((component) => component.damageType !== spell.school)) errors.push(`${spell.id}: periodic damage school mismatch`)
        })
      }
    }
    spell.effects.forEach((effect) => {
      validateEffect(effect)
      if (effect.type === 'deal-damage' && (effect.components.some((component) => component.damageType !== spell.school) || (effect.school !== undefined && effect.school !== spell.school))) errors.push(`${spell.id}: damage school mismatch`)
    })
  })
  if (errors.length && import.meta.env.DEV) console.error(`[spells] ${errors.join('; ')}`)
  return errors
}

validateSpellDefinitions()

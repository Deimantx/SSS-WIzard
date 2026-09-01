import type { CombatEffect, ModifierKey, SpellDefinition, SpellId } from '../../types'
import { SCHOOLS } from '../schools/schools'
import { STATUS_DEFINITIONS } from '../statuses'
import { periodicDamageStatus } from '../statuses/periodicDamageStatus'
import { COMBAT_MODIFIER_KEYS, hasValidStatusModifierOverrides } from '../../systems/combat/combatEffectValidation'

const damage = (school: 'fire' | 'water' | 'earth' | 'air', value: number, levelScaling = false): CombatEffect => ({
  type: 'deal-damage', target: 'opponent', damageType: school, school, magnitude: levelScaling ? { type: 'school-level', base: value, perLevel: 2, school } : { type: 'flat', value }, tags: ['direct'],
})
const barrier = (value: number): CombatEffect => ({ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value }, mode: 'replace', durationMs: 9000, tags: ['barrier'] })
const heal = (value: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'flat', value }, tags: ['heal', 'direct', 'water'] })

export const SPELLS: Record<SpellId, SpellDefinition> = {
  'fire-bolt': { id: 'fire-bolt', name: 'Fire Bolt', school: 'fire', description: 'A fast, reliable bolt of flame.', unlockLevel: 2, manaCost: 12, cooldownMs: 3500, type: 'damage', effects: [damage('fire', 28, true)], autoCondition: { type: 'always' } },
  ignite: { id: 'ignite', name: 'Ignite', school: 'fire', description: 'A spark that burns after it lands.', unlockLevel: 8, manaCost: 18, cooldownMs: 9000, type: 'dot', effects: [damage('fire', 10), periodicDamageStatus({ statusId: 'burning', durationMs: 6000, totalBaseDamage: 100, damageType: 'fire' })], autoCondition: { type: 'always' } },
  fireball: { id: 'fireball', name: 'Fireball', school: 'fire', description: 'A heavy sphere of flame that erupts on impact and leaves a lasting burn.', unlockLevel: 16, manaCost: 28, cooldownMs: 10000, type: 'damage', effects: [damage('fire', 60, true), periodicDamageStatus({ statusId: 'burning', durationMs: 10000, totalBaseDamage: 20, damageType: 'fire' })], autoCondition: { type: 'always' } },
  'water-ward': { id: 'water-ward', name: 'Water Ward', school: 'water', description: 'Wraps the wizard in a frequent, flexible barrier.', unlockLevel: 2, manaCost: 15, cooldownMs: 8000, type: 'barrier', effects: [barrier(35)], autoCondition: { type: 'barrier-below', value: 10 } },
  'flow-mend': { id: 'flow-mend', name: 'Flow Mend', school: 'water', description: 'A restorative current for a wounded wizard.', unlockLevel: 8, manaCost: 18, cooldownMs: 10000, type: 'heal', effects: [heal(30)], autoCondition: { type: 'health-below', percent: 70 } },
  frostbite: { id: 'frostbite', name: 'Frostbite', school: 'water', description: 'Bites into the enemy with cold and slows its combat tempo.', unlockLevel: 16, manaCost: 22, cooldownMs: 10000, type: 'damage', effects: [damage('water', 26, true), { type: 'apply-status', target: 'opponent', statusId: 'chilled', tags: ['debuff', 'control'] }], autoCondition: { type: 'always' } },
  'earth-spike': { id: 'earth-spike', name: 'Earth Spike', school: 'earth', description: 'A heavy spike that strikes with earthen force.', unlockLevel: 2, manaCost: 18, cooldownMs: 5000, type: 'damage', effects: [damage('earth', 40, true)], autoCondition: { type: 'always' } },
  stoneguard: { id: 'stoneguard', name: 'Stoneguard', school: 'earth', description: 'A large shell of living stone prepared for danger.', unlockLevel: 8, manaCost: 22, cooldownMs: 18000, type: 'barrier', effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 70 }, mode: 'replace', durationMs: 9000, tags: ['barrier'] }], autoCondition: { type: 'barrier-below', value: 10 } },
  fortify: { id: 'fortify', name: 'Fortify', school: 'earth', description: 'Reduces all incoming damage for a short duration.', unlockLevel: 16, manaCost: 20, cooldownMs: 18000, type: 'buff', effects: [{ type: 'apply-status', target: 'self', statusId: 'fortified', tags: ['buff'] }], autoCondition: { type: 'always' } },
  'air-lance': { id: 'air-lance', name: 'Air Lance', school: 'air', description: 'A focused lance of compressed air that strikes the enemy.', unlockLevel: 2, manaCost: 14, cooldownMs: 6000, type: 'damage', effects: [damage('air', 24, true)], autoCondition: { type: 'always' } },
  quickening: { id: 'quickening', name: 'Quickening', school: 'air', description: 'A gust that accelerates every Basic Attack.', unlockLevel: 8, manaCost: 16, cooldownMs: 12000, type: 'buff', effects: [{ type: 'apply-status', target: 'self', statusId: 'quickening', tags: ['buff'] }], autoCondition: { type: 'always' } },
  'shock-spark': { id: 'shock-spark', name: 'Shock Spark', school: 'air', description: 'A spark that leaves the enemy vulnerable to subsequent Air damage.', unlockLevel: 16, manaCost: 18, cooldownMs: 8000, type: 'damage', effects: [damage('air', 18, true), { type: 'apply-status', target: 'opponent', statusId: 'shock', stacks: 1, tags: ['debuff'] }], autoCondition: { type: 'always' } },
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
      if (effect.type === 'apply-status' && !STATUS_DEFINITIONS[effect.statusId]) errors.push(`${spell.id}: unknown status ${effect.statusId}`)
      if ('magnitude' in effect) {
        const magnitude = effect.magnitude
        if ('value' in magnitude && !Number.isFinite(magnitude.value)) errors.push(`${spell.id}: non-finite magnitude`)
        if (magnitude.type === 'school-level' && (!Number.isFinite(magnitude.base) || !Number.isFinite(magnitude.perLevel))) errors.push(`${spell.id}: non-finite school magnitude`)
      }
      if (effect.type === 'apply-status') {
        if (effect.periodicEffects && !STATUS_DEFINITIONS[effect.statusId]?.periodic) errors.push(`${spell.id}: periodic override requires a periodic status`)
        if (effect.durationMs !== undefined && effect.durationMs !== null && (!Number.isFinite(effect.durationMs) || effect.durationMs <= 0)) errors.push(`${spell.id}: periodic status duration must be positive and finite`)
        if (effect.modifierOverrides) {
          Object.entries(effect.modifierOverrides).forEach(([key, value]) => { if (!COMBAT_MODIFIER_KEYS.includes(key as ModifierKey)) errors.push(`${spell.id}: unknown modifier override ${key}`); if (!Number.isFinite(value)) errors.push(`${spell.id}: non-finite modifier override`) })
          if (!hasValidStatusModifierOverrides(effect.statusId, effect.modifierOverrides)) errors.push(`${spell.id}: modifier override is not valid for ${effect.statusId}`)
        }
        effect.periodicEffects?.forEach((periodicEffect) => {
          if (periodicEffect.type === 'deal-damage' && periodicEffect.damageType !== spell.school) errors.push(`${spell.id}: periodic damage school mismatch`)
          validateEffect(periodicEffect)
        })
      }
    }
    spell.effects.forEach((effect) => {
      validateEffect(effect)
      if (effect.type === 'deal-damage' && (effect.damageType !== spell.school || (effect.school !== undefined && effect.school !== spell.school))) errors.push(`${spell.id}: damage school mismatch`)
    })
  })
  if (errors.length && import.meta.env.DEV) console.error(`[spells] ${errors.join('; ')}`)
  return errors
}

validateSpellDefinitions()

import type { CanonicalSpellId, CombatEffect, SpellDefinition, SpellId } from '../../types'
import type { CombatTag } from '../../systems/combat/combatTypes'
import { SCHOOLS } from '../schools/schools'
import { periodicDamageStatus } from '../statuses/periodicDamageStatus'
import { STATUS_DEFINITIONS } from '../statuses/statuses'
import { createCombatValidationContext, validateCombatEffect } from '../../systems/combat/combatEffectValidation'

const damage = (school: 'fire' | 'water' | 'earth' | 'air', coefficient: number, extra: Partial<Extract<CombatEffect, { type: 'deal-damage' }>> = {}): CombatEffect => ({
  type: 'deal-damage', target: 'opponent', components: [{ damageType: school, magnitude: { type: 'spell-power', coefficient } }], school, tags: ['direct', school], ...extra,
})
const barrier = (coefficient: number): CombatEffect => ({ type: 'gain-barrier', target: 'self', magnitude: { type: 'spell-power', coefficient }, mode: 'replace-if-stronger', durationMs: 10000, tags: ['barrier', 'earth'] })
const heal = (coefficient: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'spell-power', coefficient }, tags: ['heal', 'direct', 'water'] })
const status = (target: 'self' | 'opponent', statusId: Extract<keyof typeof STATUS_DEFINITIONS, string>, durationMs?: number, tags: CombatTag[] = ['status']) => ({ type: 'apply-status' as const, target, statusId, durationMs, tags })
const spell = (definition: Omit<SpellDefinition, 'id'> & { id: CanonicalSpellId }): SpellDefinition => definition

export const SPELLS = {
  'fire-bolt': spell({ id: 'fire-bolt', name: 'Fire Bolt', school: 'fire', description: 'A quick bolt of flame. It does not burn.', unlockLevel: 2, manaCost: 30, castTimeMs: 1000, cooldownMs: 3500, type: 'damage', effects: [damage('fire', 0.75)], autoCondition: { type: 'always' } }),
  'searing-touch': spell({ id: 'searing-touch', name: 'Searing Touch', school: 'fire', description: 'Scorches the enemy and leaves a six-second Burning wound.', unlockLevel: 7, manaCost: 45, castTimeMs: 750, cooldownMs: 10000, type: 'dot', effects: [damage('fire', 0.25), periodicDamageStatus({ statusId: 'burning', durationMs: 6000, totalMagnitude: { type: 'spell-power', coefficient: 0.5 }, damageType: 'fire' })], autoCondition: { type: 'always' } }),
  'flame-burst': spell({ id: 'flame-burst', name: 'Flame Burst', school: 'fire', description: 'A heavy burst that deals 50% more damage to Burning enemies.', unlockLevel: 12, manaCost: 55, castTimeMs: 1500, cooldownMs: 14000, type: 'damage', effects: [damage('fire', 0.6)], autoCondition: { type: 'always' } }),
  kindling: spell({ id: 'kindling', name: 'Kindling', school: 'fire', description: 'Kindles the enemy, making it take 25% more Fire damage.', unlockLevel: 17, manaCost: 55, castTimeMs: 1000, cooldownMs: 18000, type: 'debuff', effects: [status('opponent', 'kindled', 18000, ['debuff', 'fire'])], autoCondition: { type: 'always' } }),
  firestorm: spell({ id: 'firestorm', name: 'Firestorm', school: 'fire', description: 'Six independent hits of flame.', unlockLevel: 22, manaCost: 105, castTimeMs: 2500, cooldownMs: 25000, type: 'damage', effects: [damage('fire', 0.2, { hitCount: 6 })], autoCondition: { type: 'always' } }),
  combustion: spell({ id: 'combustion', name: 'Combustion', school: 'fire', description: 'Deals damage and detonates your Burning effect.', unlockLevel: 28, manaCost: 75, castTimeMs: 1600, cooldownMs: 25000, type: 'damage', effects: [damage('fire', 0.5), { type: 'detonate-status', target: 'opponent', statusId: 'burning', multiplier: 1, consume: true }], autoCondition: { type: 'always' } }),
  inferno: spell({ id: 'inferno', name: 'Inferno', school: 'fire', description: 'A powerful hit followed by a twelve-second burn.', unlockLevel: 34, manaCost: 125, castTimeMs: 3000, cooldownMs: 30000, type: 'dot', effects: [damage('fire', 0.5), periodicDamageStatus({ statusId: 'burning', durationMs: 12000, totalMagnitude: { type: 'spell-power', coefficient: 0.75 }, damageType: 'fire' })], autoCondition: { type: 'always' } }),
  'execution-flame': spell({ id: 'execution-flame', name: 'Execution Flame', school: 'fire', description: 'A lethal flame empowered against wounded or Burning enemies.', unlockLevel: 40, manaCost: 150, castTimeMs: 1500, cooldownMs: 45000, type: 'damage', effects: [damage('fire', 1)], autoCondition: { type: 'always' } }),

  'water-bolt': spell({ id: 'water-bolt', name: 'Water Bolt', school: 'water', description: 'A bolt of water that Chills its target.', unlockLevel: 2, manaCost: 20, castTimeMs: 1000, cooldownMs: 3000, type: 'damage', effects: [damage('water', 0.4), status('opponent', 'chilled', 5000, ['debuff', 'control', 'water'])], autoCondition: { type: 'always' } }),
  'mending-waters': spell({ id: 'mending-waters', name: 'Mending Waters', school: 'water', description: 'Restores a portion of the wizard’s health.', unlockLevel: 7, manaCost: 50, castTimeMs: 1600, cooldownMs: 10000, type: 'heal', effects: [heal(0.5)], autoCondition: { type: 'health-below', percent: 70 } }),
  'frost-touch': spell({ id: 'frost-touch', name: 'Frost Touch', school: 'water', description: 'Deals Water damage and applies a stronger Chill.', unlockLevel: 12, manaCost: 45, castTimeMs: 1100, cooldownMs: 12000, type: 'damage', effects: [damage('water', 0.7), { ...status('opponent', 'chilled', 5000, ['debuff', 'control', 'water']), modifierOverrides: { 'action-speed-percent': -0.25, 'basic-attack-speed-percent': -0.25 } }], autoCondition: { type: 'always' } }),
  regeneration: spell({ id: 'regeneration', name: 'Regeneration', school: 'water', description: 'Restores health every second for ten seconds.', unlockLevel: 17, manaCost: 60, castTimeMs: 1000, cooldownMs: 10000, type: 'heal', effects: [{ type: 'apply-status', target: 'self', statusId: 'regeneration', durationMs: 10000, periodicEffects: [{ type: 'heal', target: 'self', magnitude: { type: 'spell-power', coefficient: 0.1 }, tags: ['heal', 'hot', 'water'] }], tags: ['buff', 'hot', 'water'] }], autoCondition: { type: 'all', conditions: [{ type: 'health-below', percent: 90 }, { type: 'self-status-missing', statusId: 'regeneration' }] } }),
  'frozen-current': spell({ id: 'frozen-current', name: 'Frozen Current', school: 'water', description: 'A current that intensifies against Chilled enemies.', unlockLevel: 22, manaCost: 75, castTimeMs: 1500, cooldownMs: 16000, type: 'damage', effects: [damage('water', 1), status('opponent', 'chilled', 5000, ['debuff', 'control', 'water'])], autoCondition: { type: 'always' } }),
  'cleansing-tide': spell({ id: 'cleansing-tide', name: 'Cleansing Tide', school: 'water', description: 'Heals and cleanses all cleanseable negative effects.', unlockLevel: 28, manaCost: 50, castTimeMs: 500, cooldownMs: 18000, type: 'heal', effects: [heal(0.5), { type: 'cleanse', target: 'self', mode: 'all' }], autoCondition: { type: 'self-has-cleanseable-debuff' } }),
  'deep-freeze': spell({ id: 'deep-freeze', name: 'Deep Freeze', school: 'water', description: 'Deals Water damage and heavily slows the enemy.', unlockLevel: 34, manaCost: 80, castTimeMs: 2000, cooldownMs: 20000, type: 'damage', effects: [damage('water', 0.75), status('opponent', 'frozen', 4000, ['debuff', 'control', 'water'])], autoCondition: { type: 'always' } }),
  'healing-tide': spell({ id: 'healing-tide', name: 'Healing Tide', school: 'water', description: 'Heals immediately and continues restoring health for six seconds.', unlockLevel: 40, manaCost: 75, castTimeMs: 2000, cooldownMs: 23000, type: 'heal', effects: [heal(1), { type: 'apply-status', target: 'self', statusId: 'healing-tide', durationMs: 6000, periodicEffects: [{ type: 'heal', target: 'self', magnitude: { type: 'spell-power', coefficient: 0.15 }, tags: ['heal', 'hot', 'water'] }], tags: ['buff', 'hot', 'water'] }], autoCondition: { type: 'health-below', percent: 90 } }),

  'stone-shard': spell({ id: 'stone-shard', name: 'Stone Shard', school: 'earth', description: 'Strikes the enemy and fractures it over three seconds.', unlockLevel: 2, manaCost: 25, castTimeMs: 1700, cooldownMs: 4000, type: 'dot', effects: [damage('earth', 0.25), periodicDamageStatus({ statusId: 'earth-fracture', durationMs: 3000, totalMagnitude: { type: 'spell-power', coefficient: 0.25 }, damageType: 'earth' })], autoCondition: { type: 'always' } }),
  'stone-skin': spell({ id: 'stone-skin', name: 'Stone Skin', school: 'earth', description: 'Raises Defense by 20% for ten seconds.', unlockLevel: 7, manaCost: 50, castTimeMs: 1500, cooldownMs: 16000, type: 'buff', effects: [status('self', 'stone-skin', 10000, ['buff', 'earth'])], autoCondition: { type: 'self-status-missing', statusId: 'stone-skin' } }),
  'earthen-barrier': spell({ id: 'earthen-barrier', name: 'Earthen Barrier', school: 'earth', description: 'Creates a strong barrier, replacing it only when stronger.', unlockLevel: 12, manaCost: 60, castTimeMs: 1800, cooldownMs: 14000, type: 'barrier', effects: [barrier(1.2)], autoCondition: { type: 'barrier-below', value: 10 } }),
  harden: spell({ id: 'harden', name: 'Harden', school: 'earth', description: 'Reduces damage taken by 25% for five seconds.', unlockLevel: 17, manaCost: 100, castTimeMs: 500, cooldownMs: 22000, type: 'buff', effects: [status('self', 'hardened', 5000, ['buff', 'earth'])], autoCondition: { type: 'self-status-missing', statusId: 'hardened' } }),
  rockfall: spell({ id: 'rockfall', name: 'Rockfall', school: 'earth', description: 'A heavy Earth strike.', unlockLevel: 22, manaCost: 65, castTimeMs: 2500, cooldownMs: 16000, type: 'damage', effects: [damage('earth', 1.4)], autoCondition: { type: 'always' } }),
  'rend-armor': spell({ id: 'rend-armor', name: 'Rend Armor', school: 'earth', description: 'Deals damage and reduces enemy Defense by 20%.', unlockLevel: 28, manaCost: 75, castTimeMs: 1700, cooldownMs: 16000, type: 'damage', effects: [damage('earth', 0.75), status('opponent', 'rend-armor', 10000, ['debuff', 'earth'])], autoCondition: { type: 'always' } }),
  tremors: spell({ id: 'tremors', name: 'Tremors', school: 'earth', description: 'Seven independent Earth hits that slow enemy actions.', unlockLevel: 34, manaCost: 100, castTimeMs: 2500, cooldownMs: 25000, type: 'damage', effects: [damage('earth', 0.25, { hitCount: 7 }), status('opponent', 'tremored', 5000, ['debuff', 'control', 'earth'])], autoCondition: { type: 'always' } }),
  'living-mountain': spell({ id: 'living-mountain', name: 'Living Mountain', school: 'earth', description: 'Massively strengthens Defense and reduces damage taken.', unlockLevel: 40, manaCost: 100, castTimeMs: 3000, cooldownMs: 25000, type: 'buff', effects: [status('self', 'living-mountain', 14000, ['buff', 'earth'])], autoCondition: { type: 'self-status-missing', statusId: 'living-mountain' } }),

  'wind-blade': spell({ id: 'wind-blade', name: 'Wind Blade', school: 'air', description: 'A swift blade of compressed air.', unlockLevel: 2, manaCost: 25, castTimeMs: 650, cooldownMs: 2500, type: 'damage', effects: [damage('air', 0.4)], autoCondition: { type: 'always' } }),
  'lightning-spark': spell({ id: 'lightning-spark', name: 'Lightning Spark', school: 'air', description: 'A Spark with a spell-specific critical chance bonus.', unlockLevel: 7, manaCost: 50, castTimeMs: 750, cooldownMs: 8000, type: 'damage', effects: [damage('air', 0.5)], autoCondition: { type: 'always' } }),
  gust: spell({ id: 'gust', name: 'Gust', school: 'air', description: 'The next Spell cast resolves with 30% less work.', unlockLevel: 12, manaCost: 65, castTimeMs: 600, cooldownMs: 12000, type: 'damage', effects: [damage('air', 0.5), status('self', 'gust', 6000, ['buff', 'air'])], autoCondition: { type: 'always' } }),
  'chain-lightning': spell({ id: 'chain-lightning', name: 'Chain Lightning', school: 'air', description: 'Five independent lightning hits.', unlockLevel: 17, manaCost: 75, castTimeMs: 1100, cooldownMs: 12000, type: 'damage', effects: [damage('air', 0.2, { hitCount: 5 })], autoCondition: { type: 'always' } }),
  tailwind: spell({ id: 'tailwind', name: 'Tailwind', school: 'air', description: 'Increases action speed by 25% for ten seconds.', unlockLevel: 22, manaCost: 100, castTimeMs: 750, cooldownMs: 20000, type: 'buff', effects: [status('self', 'tailwind', 10000, ['buff', 'air'])], autoCondition: { type: 'self-status-missing', statusId: 'tailwind' } }),
  'static-charge': spell({ id: 'static-charge', name: 'Static Charge', school: 'air', description: 'Charges the next damaging Air Spell with extra damage.', unlockLevel: 28, manaCost: 75, castTimeMs: 900, cooldownMs: 10000, type: 'damage', effects: [damage('air', 0.5), status('self', 'static', 10000, ['buff', 'air'])], autoCondition: { type: 'always' } }),
  thunderstrike: spell({ id: 'thunderstrike', name: 'Thunderstrike', school: 'air', description: 'A devastating Air strike with bonus critical damage.', unlockLevel: 34, manaCost: 90, castTimeMs: 1450, cooldownMs: 16000, type: 'damage', effects: [damage('air', 1)], autoCondition: { type: 'always' } }),
  'eye-of-the-storm': spell({ id: 'eye-of-the-storm', name: 'Eye of the Storm', school: 'air', description: 'Improves cooldown recovery, critical chance, and action speed.', unlockLevel: 40, manaCost: 100, castTimeMs: 1700, cooldownMs: 25000, type: 'buff', effects: [status('self', 'eye-of-the-storm', 10000, ['buff', 'air'])], autoCondition: { type: 'self-status-missing', statusId: 'eye-of-the-storm' } }),
} as unknown as Record<SpellId, SpellDefinition>

export const LEGACY_SPELL_ID_MAP: Partial<Record<string, CanonicalSpellId>> = {
  ignite: 'searing-touch', fireball: 'flame-burst', 'flow-mend': 'mending-waters', frostbite: 'frost-touch',
  'earth-spike': 'stone-shard', stoneguard: 'earthen-barrier', fortify: 'harden', 'air-lance': 'wind-blade', quickening: 'tailwind', 'shock-spark': 'static-charge',
}
Object.entries(LEGACY_SPELL_ID_MAP).forEach(([legacyId, canonicalId]) => { if (canonicalId) Object.defineProperty(SPELLS, legacyId, { value: SPELLS[canonicalId], enumerable: false, configurable: false }) })

export const CANONICAL_SPELL_IDS = Object.keys(SPELLS) as CanonicalSpellId[]

export const validateSpellDefinitions = () => {
  const errors: string[] = []
  const validationContext = createCombatValidationContext(STATUS_DEFINITIONS)
  const ids = Object.values(SPELLS).map((spell) => spell.id)
  if (ids.length !== 32) errors.push(`expected 32 spells, received ${ids.length}`)
  if (new Set(ids).size !== ids.length) errors.push('duplicate spell id')
  const expectedUnlockLevels = [2, 7, 12, 17, 22, 28, 34, 40]
  Object.keys(SCHOOLS).forEach((schoolId) => {
    const schoolSpells = Object.values(SPELLS).filter((spell) => spell.school === schoolId).sort((a, b) => a.unlockLevel - b.unlockLevel)
    if (schoolSpells.length !== 8) errors.push(`${schoolId}: expected 8 spells, received ${schoolSpells.length}`)
    if (schoolSpells.some((spell, index) => spell.unlockLevel !== expectedUnlockLevels[index])) errors.push(`${schoolId}: invalid unlock sequence`)
  })
  Object.entries(SPELLS).forEach(([key, spell]) => {
    if (key !== spell.id) errors.push(`${key}: key/id mismatch`)
    if (!SCHOOLS[spell.school]) errors.push(`${spell.id}: unknown school`)
    if (!Number.isInteger(spell.unlockLevel) || spell.unlockLevel < 1) errors.push(`${spell.id}: invalid unlock level`)
    if (!Number.isFinite(spell.manaCost) || spell.manaCost < 0) errors.push(`${spell.id}: invalid mana cost`)
    if (!Number.isFinite(spell.castTimeMs) || spell.castTimeMs <= 0) errors.push(`${spell.id}: invalid cast time`)
    if (!Number.isFinite(spell.cooldownMs) || spell.cooldownMs < 0) errors.push(`${spell.id}: invalid cooldown`)
    if (!spell.effects.length) errors.push(`${spell.id}: effects must not be empty`)
    spell.effects.forEach((effect) => errors.push(...validateCombatEffect(effect, `${spell.id}.effect`, validationContext)))
  })
  if (errors.length && import.meta.env.DEV) console.error(`[spells] ${errors.join('; ')}`)
  return errors
}

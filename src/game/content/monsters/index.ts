import { getTraitDefinition, getTraitDefinitions } from '../traits'
import type { CombatEffect, CombatTag, DamageType, MonsterId } from '../../types'
import { ABANDONED_CATACOMBS_MONSTERS } from './abandonedCatacombs'
import { HOWLING_DEN_MONSTERS } from './howlingDen'
import { WHISPERING_WOODS_MONSTERS, WHISPERING_WOODS_MONSTER_IDS } from './whisperingWoods'
import type { MonsterDefinition } from './monsterTypes'
import { createCombatValidationContext, validateCombatEffect } from '../../systems/combat/combatEffectValidation'
import { STATUS_DEFINITIONS } from '../statuses/statuses'
import { MAX_ACTION_WORK_MS, MIN_ACTION_TIME_MS } from '../../core/balance/combatTiming'
import { MAX_BLOCK_CHANCE, MAX_CRIT_CHANCE, MAX_CRIT_DAMAGE_MULTIPLIER, MAX_RESISTANCE, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { ITEMS } from '../items/items'

export type { MonsterDefinition } from './monsterTypes'
export { WHISPERING_WOODS_MONSTERS, WHISPERING_WOODS_MONSTER_IDS } from './whisperingWoods'
export { HOWLING_DEN_MONSTERS } from './howlingDen'
export { ABANDONED_CATACOMBS_MONSTERS } from './abandonedCatacombs'

const MONSTER_REGISTRIES = [WHISPERING_WOODS_MONSTERS, HOWLING_DEN_MONSTERS, ABANDONED_CATACOMBS_MONSTERS] as const
const registryIdCounts = MONSTER_REGISTRIES.flatMap((registry) => Object.keys(registry)).reduce<Record<string, number>>((counts, id) => { counts[id] = (counts[id] ?? 0) + 1; return counts }, {})
const duplicateMonsterIds = Object.entries(registryIdCounts).filter(([, count]) => count > 1).map(([id]) => id)

export const MONSTERS = Object.assign({}, ...MONSTER_REGISTRIES) as Record<MonsterId, MonsterDefinition>

export const isBossMonster = (monster: MonsterDefinition) => monster.bestiaryCategory === 'boss'
export const MONSTER_IDS = Object.keys(MONSTERS) as MonsterId[]

const COMBAT_TAGS: readonly CombatTag[] = ['basic-attack', 'spell', 'weapon', 'equipment', 'melee', 'ranged', 'magic', 'direct', 'heal', 'dot', 'hot', 'status', 'special', 'trait', 'buff', 'debuff', 'control', 'barrier', 'physical', 'arcane', 'fire', 'water', 'earth', 'air']
const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']

const validateEffects = (owner: string, effects: CombatEffect[], errors: string[]) => effects.forEach((effect) => {
  errors.push(...validateCombatEffect(effect, owner, createCombatValidationContext(STATUS_DEFINITIONS)))
  if (effect.type === 'set-action-pattern' && !effect.patternId.trim()) errors.push(`${owner}: action pattern id is required`)
})

export const validateMonsterDefinitions = (monsters: Record<string, MonsterDefinition> = MONSTERS) => {
  const errors: string[] = duplicateMonsterIds.map((id) => `${id}: duplicate monster registry entry`)
  Object.entries(monsters).forEach(([key, monster]) => {
    if (key !== monster.id) errors.push(`${monster.id}: key/id mismatch`)
    if (!Number.isFinite(monster.maxHealth) || monster.maxHealth <= 0 || !Number.isFinite(monster.basicAttackDamage) || monster.basicAttackDamage < 0 || !Number.isFinite(monster.basicAttackTimeMs) || monster.basicAttackTimeMs < MIN_ACTION_TIME_MS || monster.basicAttackTimeMs > MAX_ACTION_WORK_MS) errors.push(`${monster.id}: invalid combat numbers`)
    if (monster.defense !== undefined && (!Number.isFinite(monster.defense) || monster.defense < 0)) errors.push(`${monster.id}: invalid defense`)
    if (monster.critChance !== undefined && (!Number.isFinite(monster.critChance) || monster.critChance < 0 || monster.critChance > MAX_CRIT_CHANCE)) errors.push(`${monster.id}: invalid crit chance`)
    if (monster.critDamage !== undefined && (!Number.isFinite(monster.critDamage) || monster.critDamage < 1 || monster.critDamage > MAX_CRIT_DAMAGE_MULTIPLIER)) errors.push(`${monster.id}: invalid crit damage`)
    if (monster.blockChance !== undefined && (!Number.isFinite(monster.blockChance) || monster.blockChance < 0 || monster.blockChance > MAX_BLOCK_CHANCE)) errors.push(`${monster.id}: invalid block chance`)
    if (new Set(monster.traitIds).size !== monster.traitIds.length) errors.push(`${monster.id}: duplicate trait id`)
    monster.loot.forEach((drop) => {
      if (!ITEMS[drop.itemId]) errors.push(`${monster.id}: unknown loot item ${drop.itemId}`)
      if (!Number.isFinite(drop.chance) || drop.chance < 0 || drop.chance > 1) errors.push(`${monster.id}: invalid loot chance`)
      if (!Number.isInteger(drop.min) || !Number.isInteger(drop.max) || drop.min < 1 || drop.max < drop.min) errors.push(`${monster.id}: invalid loot quantity`)
    })
    monster.traitIds.forEach((traitId) => { if (!getTraitDefinition(traitId)) errors.push(`${monster.id}: unknown trait ${traitId}`) })
    if (!monster.actionPatterns[monster.defaultActionPatternId]) errors.push(`${monster.id}: missing default action pattern`)
    Object.entries(monster.resistances ?? {}).forEach(([damageType, resistance]) => { if (!DAMAGE_TYPES.includes(damageType as DamageType) || !Number.isFinite(resistance) || resistance < MIN_RESISTANCE || resistance > MAX_RESISTANCE) errors.push(`${monster.id}: invalid ${damageType} resistance`) })
    Object.entries(monster.actions).forEach(([actionKey, action]) => {
      if (actionKey !== action.id) errors.push(`${monster.id}/${actionKey}: key/id mismatch`)
      if (!action.name.trim() || !action.description.trim()) errors.push(`${monster.id}/${action.id}: name and description are required`)
      if (!Number.isFinite(action.actionTimeMs) || action.actionTimeMs < MIN_ACTION_TIME_MS || action.actionTimeMs > MAX_ACTION_WORK_MS) errors.push(`${monster.id}/${action.id}: invalid action time`)
      validateEffects(`${monster.id}/${action.id}`, action.effects, errors)
      action.effects.forEach((effect) => { if (effect.type === 'set-action-pattern' && effect.target === 'self' && !monster.actionPatterns[effect.patternId]) errors.push(`${monster.id}/${action.id}: missing action pattern ${effect.patternId}`) })
      action.tags?.forEach((tag) => { if (!COMBAT_TAGS.includes(tag)) errors.push(`${monster.id}/${action.id}: invalid action tag`) })
    })
    Object.entries(monster.actionPatterns).forEach(([patternKey, pattern]) => {
      if (patternKey !== pattern.id) errors.push(`${monster.id}/${patternKey}: key/id mismatch`)
      if (pattern.steps.length === 0) errors.push(`${monster.id}/${pattern.id}: empty pattern`)
      const stepIds = pattern.steps.map((step) => step.id)
      if (new Set(stepIds).size !== stepIds.length) errors.push(`${monster.id}/${pattern.id}: duplicate step id`)
      pattern.steps.forEach((step) => { if (!step.id.trim()) errors.push(`${monster.id}/${pattern.id}: step id is required`); if (step.type === 'action' && !monster.actions[step.actionId]) errors.push(`${monster.id}/${pattern.id}: missing action reference ${step.actionId}`) })
    })
    getTraitDefinitions(monster.traitIds).forEach((trait) => trait.rules?.forEach((rule) => {
      validateEffects(`${monster.id}/${trait.id}/${rule.id}`, rule.effects, errors)
      rule.effects.forEach((effect) => { if (effect.type === 'set-action-pattern' && effect.target === 'self' && !monster.actionPatterns[effect.patternId]) errors.push(`${monster.id}/${trait.id}/${rule.id}: missing action pattern ${effect.patternId}`) })
    }))
  })
  if (errors.length && import.meta.env.DEV) console.error(`[combat-monsters] ${errors.join('; ')}`)
  return errors
}

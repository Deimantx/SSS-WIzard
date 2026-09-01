import { STATUS_DEFINITIONS } from '../statuses'
import { getTraitDefinition, getTraitDefinitions } from '../traits'
import type { CombatEffect, CombatTag, MonsterId } from '../../types'
import { ABANDONED_CATACOMBS_MONSTERS } from './abandonedCatacombs'
import { HOWLING_DEN_MONSTERS } from './howlingDen'
import { WHISPERING_WOODS_MONSTERS, WHISPERING_WOODS_MONSTER_IDS } from './whisperingWoods'
import type { MonsterDefinition } from './monsterTypes'
import { isPersistedCombatEffect } from '../../systems/combat/combatEffectValidation'
import { MAX_ACTION_WORK_MS, MIN_ACTION_TIME_MS } from '../../core/balance/combatTiming'

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

const validateEffects = (owner: string, effects: CombatEffect[], errors: string[]) => effects.forEach((effect) => {
  if (!isPersistedCombatEffect(effect)) errors.push(`${owner}: invalid combat effect`)
  if ('magnitude' in effect) {
    const magnitude = effect.magnitude
    if ('value' in magnitude && (!Number.isFinite(magnitude.value) || magnitude.value < 0)) errors.push(`${owner}: invalid magnitude`)
    if (magnitude.type === 'school-level' && (!Number.isFinite(magnitude.base) || !Number.isFinite(magnitude.perLevel))) errors.push(`${owner}: invalid school magnitude`)
  }
  if (effect.type === 'apply-status' && !STATUS_DEFINITIONS[effect.statusId]) errors.push(`${owner}: unknown status ${effect.statusId}`)
  if (effect.type === 'set-action-pattern' && !effect.patternId.trim()) errors.push(`${owner}: action pattern id is required`)
})

export const validateMonsterDefinitions = () => {
  const errors: string[] = duplicateMonsterIds.map((id) => `${id}: duplicate monster registry entry`)
  Object.entries(MONSTERS).forEach(([key, monster]) => {
    if (key !== monster.id) errors.push(`${monster.id}: key/id mismatch`)
    if (!Number.isFinite(monster.maxHealth) || monster.maxHealth <= 0 || !Number.isFinite(monster.basicAttackDamage) || monster.basicAttackDamage < 0 || !Number.isFinite(monster.basicAttackTimeMs) || monster.basicAttackTimeMs < MIN_ACTION_TIME_MS || monster.basicAttackTimeMs > MAX_ACTION_WORK_MS) errors.push(`${monster.id}: invalid combat numbers`)
    if (new Set(monster.traitIds).size !== monster.traitIds.length) errors.push(`${monster.id}: duplicate trait id`)
    monster.traitIds.forEach((traitId) => { if (!getTraitDefinition(traitId)) errors.push(`${monster.id}: unknown trait ${traitId}`) })
    if (!monster.actionPatterns[monster.defaultActionPatternId]) errors.push(`${monster.id}: missing default action pattern`)
    Object.entries(monster.resistances ?? {}).forEach(([damageType, resistance]) => { if (!Number.isFinite(resistance) || resistance < -1 || resistance > 0.9) errors.push(`${monster.id}: invalid ${damageType} resistance`) })
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

validateMonsterDefinitions()

import { getTraitDefinition, getTraitDefinitions } from '../traits'
import type { CombatEffect, DamageType, MonsterId } from '../../types'
import { WHISPERING_WOODS_MONSTERS, WHISPERING_WOODS_MONSTER_IDS } from './combat-zones/whisperingWoods'
import { HOWLING_DEN_MONSTERS } from './elite-zones/howlingDen'
import { ABANDONED_CATACOMBS_MONSTERS } from './dungeons/abandonedCatacombs'
import { ELEMENTAL_TUTORIAL_MONSTERS } from './elementalTutorial'
import { ESTABLISHED_COMBAT_MONSTERS } from './establishedCombatMonsters'
import { EXPANSION_MONSTERS } from './expansionMonsters'
import { HUNTERS_ORDER_MONSTERS } from './hunting-grounds/gloamridge'
import type { MonsterDefinition } from './monsterTypes'
import { isElementId } from '../elements/elements'
import { COMBAT_TAGS, DAMAGE_TYPES, createCombatValidationContext, validateCombatEffect } from '../../systems/combat/combatEffectValidation'
import { STATUS_DEFINITIONS } from '../statuses/statuses'
import { MAX_ACTION_WORK_MS, MIN_ACTION_TIME_MS } from '../../core/balance/combatTiming'
import { MAX_BLOCK_CHANCE, MAX_CRIT_CHANCE, MAX_CRIT_DAMAGE_MULTIPLIER, MAX_RESISTANCE, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { ITEMS } from '../items/items'
import { RESONANCE_TYPES } from '../resonance/resonance'
import { UNIVERSAL_LOOT_CATEGORIES, UNIVERSAL_LOOT_TIERS } from '../loot/universalLootTiers'
import type { LootCategory, MonsterLootDropDefinition } from '../loot/lootCategoryTypes'

export type { MonsterDefinition } from './monsterTypes'
export { WHISPERING_WOODS_MONSTERS, WHISPERING_WOODS_MONSTER_IDS } from './combat-zones/whisperingWoods'
export { HOWLING_DEN_MONSTERS } from './elite-zones/howlingDen'
export { ABANDONED_CATACOMBS_MONSTERS } from './dungeons/abandonedCatacombs'
export { HUNTERS_ORDER_MONSTERS } from './hunting-grounds/gloamridge'

const MONSTER_REGISTRIES = [WHISPERING_WOODS_MONSTERS, HOWLING_DEN_MONSTERS, HUNTERS_ORDER_MONSTERS, ABANDONED_CATACOMBS_MONSTERS, ELEMENTAL_TUTORIAL_MONSTERS, ESTABLISHED_COMBAT_MONSTERS, EXPANSION_MONSTERS] as const
const registryIdCounts = MONSTER_REGISTRIES.flatMap((registry) => Object.keys(registry)).reduce<Record<string, number>>((counts, id) => { counts[id] = (counts[id] ?? 0) + 1; return counts }, {})
const duplicateMonsterIds = Object.entries(registryIdCounts).filter(([, count]) => count > 1).map(([id]) => id)

const authoredMonsterIndex = Object.assign({}, ...MONSTER_REGISTRIES) as Record<MonsterId, MonsterDefinition>
export const MONSTERS = authoredMonsterIndex
export const ARCANE_PRIMARY_RESONANCE_AUDIT = Object.values(MONSTERS)
  .filter((monster) => monster.primaryAffinity === 'arcane')
  .map(({ id, resonanceYield }) => ({ id, resonanceYield }))

export const isBossMonster = (monster: MonsterDefinition) => monster.bestiaryCategory === 'boss'
export const MONSTER_IDS = Object.keys(MONSTERS) as MonsterId[]
export const HUNTER_EXCLUSIVE_MONSTER_IDS = MONSTER_IDS.filter((id) => MONSTERS[id].hunter?.exclusive)
export const HUNTER_REGULAR_MONSTER_IDS = HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => MONSTERS[id].bestiaryCategory !== 'boss')

const DIRECT_MONSTER_LOOT_CATEGORIES: readonly LootCategory[] = ['material', 'equipment', 'unique']
const VALID_LOOT_TIER_IDS = new Set(UNIVERSAL_LOOT_TIERS.map(({ tier }) => tier))

export const validateMonsterLootDrop = (
  monsterId: string,
  drop: MonsterLootDropDefinition,
  items: Record<string, { kind: string } | undefined> = ITEMS,
  validLootTierIds: ReadonlySet<number> = VALID_LOOT_TIER_IDS,
) => {
  const errors: string[] = []
  const item = items[drop.itemId]
  if (!item) errors.push(`${monsterId}: unknown loot item ${drop.itemId}`)
  else if (drop.category === 'material' && item.kind !== 'material') errors.push(`${monsterId}: material loot requires material item; ${drop.itemId} is ${item.kind}`)
  else if (drop.category === 'equipment' && item.kind !== 'equipment') errors.push(`${monsterId}: equipment loot requires equipment item; ${drop.itemId} is ${item.kind}`)
  else if (drop.category === 'unique' && item.kind !== 'material' && item.kind !== 'equipment') errors.push(`${monsterId}: unique loot requires material or equipment item; ${drop.itemId} is ${item.kind}`)
  if (!UNIVERSAL_LOOT_CATEGORIES.includes(drop.category)) errors.push(`${monsterId}: unknown loot category ${drop.category}`)
  else if (!DIRECT_MONSTER_LOOT_CATEGORIES.includes(drop.category)) errors.push(`${monsterId}: ${drop.category} loot must use its dedicated reward system`)
  if (!Number.isFinite(drop.baseChance) || drop.baseChance < 0 || drop.baseChance > 1) errors.push(`${monsterId}: invalid loot base chance`)
  if (!Number.isInteger(drop.quantity.min) || !Number.isInteger(drop.quantity.max) || drop.quantity.min < 1 || drop.quantity.max < drop.quantity.min) errors.push(`${monsterId}: invalid loot quantity`)
  if (drop.minLootTier !== undefined && (!Number.isInteger(drop.minLootTier) || !validLootTierIds.has(drop.minLootTier))) errors.push(`${monsterId}: invalid minimum loot tier`)
  if (drop.scaling && Object.entries(drop.scaling).some(([key, value]) => !['tierQuantity', 'tierChance', 'tierRarity', 'bossQuantity', 'bossChance', 'bossRarity'].includes(key) || typeof value !== 'boolean')) errors.push(`${monsterId}: invalid loot scaling rule`)
  return errors
}

const validateEffects = (owner: string, effects: CombatEffect[], errors: string[]) => effects.forEach((effect) => {
  errors.push(...validateCombatEffect(effect, owner, createCombatValidationContext(STATUS_DEFINITIONS)))
  if (effect.type === 'set-action-pattern' && !effect.patternId.trim()) errors.push(`${owner}: action pattern id is required`)
})

export const validateMonsterDefinitions = (monsters: Record<string, MonsterDefinition> = MONSTERS) => {
  const errors: string[] = duplicateMonsterIds.map((id) => `${id}: duplicate monster registry entry`)
  Object.entries(monsters).forEach(([key, monster]) => {
    if (key !== monster.id) errors.push(`${monster.id}: key/id mismatch`)
    if (!isElementId(monster.primaryAffinity)) errors.push(`${monster.id}: invalid primary affinity`)
    if (!isElementId(monster.basicAttackElement)) errors.push(`${monster.id}: invalid basic attack element`)
    if (!Number.isFinite(monster.maxHealth) || monster.maxHealth <= 0 || !Number.isFinite(monster.basicAttackDamage) || monster.basicAttackDamage < 0 || !Number.isFinite(monster.basicAttackTimeMs) || monster.basicAttackTimeMs < MIN_ACTION_TIME_MS || monster.basicAttackTimeMs > MAX_ACTION_WORK_MS) errors.push(`${monster.id}: invalid combat numbers`)
    if (monster.defense !== undefined && (!Number.isFinite(monster.defense) || monster.defense < 0)) errors.push(`${monster.id}: invalid defense`)
    if (monster.critChance !== undefined && (!Number.isFinite(monster.critChance) || monster.critChance < 0 || monster.critChance > MAX_CRIT_CHANCE)) errors.push(`${monster.id}: invalid crit chance`)
    if (monster.critDamage !== undefined && (!Number.isFinite(monster.critDamage) || monster.critDamage < 1 || monster.critDamage > MAX_CRIT_DAMAGE_MULTIPLIER)) errors.push(`${monster.id}: invalid crit damage`)
    if (monster.blockChance !== undefined && (!Number.isFinite(monster.blockChance) || monster.blockChance < 0 || monster.blockChance > MAX_BLOCK_CHANCE)) errors.push(`${monster.id}: invalid block chance`)
    if (new Set(monster.traitIds).size !== monster.traitIds.length) errors.push(`${monster.id}: duplicate trait id`)
    if (monster.loot.some((drop) => drop.itemId === 'life-essence')) errors.push(`${monster.id}: Life Essence must be resolved dynamically, not authored in monster loot`)
    if (monster.loot.some((drop) => drop.itemId === 'artifact-essence')) errors.push(`${monster.id}: Artifact Essence must be resolved dynamically, not authored in monster loot`)
    monster.loot.forEach((drop) => {
      errors.push(...validateMonsterLootDrop(monster.id, drop))
    })
    monster.traitIds.forEach((traitId) => { if (!getTraitDefinition(traitId)) errors.push(`${monster.id}: unknown trait ${traitId}`) })
    if (!monster.actionPatterns[monster.defaultActionPatternId]) errors.push(`${monster.id}: missing default action pattern`)
    Object.entries(monster.resistances ?? {}).forEach(([damageType, resistance]) => { if (!DAMAGE_TYPES.includes(damageType as DamageType) || !Number.isFinite(resistance) || resistance < MIN_RESISTANCE || resistance > MAX_RESISTANCE) errors.push(`${monster.id}: invalid ${damageType} resistance`) })
    Object.entries(monster.resonanceYield ?? {}).forEach(([type, amount]) => { if (!RESONANCE_TYPES.includes(type as typeof RESONANCE_TYPES[number]) || !Number.isSafeInteger(amount) || amount <= 0) errors.push(`${monster.id}: invalid Resonance yield ${type}`) })
    if (monster.primaryAffinity === 'arcane') {
      const arcaneYield = monster.resonanceYield?.arcane ?? 0
      const strongestSecondaryYield = Math.max(0, ...Object.entries(monster.resonanceYield ?? {}).filter(([type]) => type !== 'arcane').map(([, amount]) => amount ?? 0))
      if (arcaneYield <= 0) errors.push(`${monster.id}: Arcane-primary Monster must explicitly author Arcane Resonance`)
      else if (arcaneYield < strongestSecondaryYield) errors.push(`${monster.id}: Arcane-primary Monster Arcane Resonance must not be lower than its strongest secondary yield`)
    }
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

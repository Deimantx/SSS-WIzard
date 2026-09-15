import type { DamageType } from '../../systems/combat/combatTypes'
import type { EquipmentBuildTag, EquipmentBudgetProfileId, EquipmentStats, ItemDefinition, ItemId, SchoolId } from '../../types'
import { BALANCE } from '../../core/balance/balance'
import { MAX_BLOCK_CHANCE, MAX_RESISTANCE, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { isArtifactId, validateArtifactDefinitions } from '../artifacts/artifacts'
import { createCombatValidationContext, validateCombatProvider } from '../../systems/combat/combatEffectValidation'
import { STATUS_DEFINITIONS } from '../statuses/statuses'
import { EQUIPMENT_BUILD_TAG_LABELS, EQUIPMENT_BUDGET_PROFILES, validateEquipmentBudgetProfiles } from './equipmentBalance'
import { ACT0_ITEMS } from './act0'
import { ACT1_ITEMS } from './act1'
import { mergeItemRegistries, SHARED_ITEMS } from './shared'

/**
 * One canonical runtime registry assembled from readable ownership files.
 * Duplicate authored IDs fail during module initialization instead of being
 * silently overwritten by object spread order.
 */
const authoredItems = mergeItemRegistries(SHARED_ITEMS, ACT0_ITEMS, ACT1_ITEMS)

export const ITEMS: Record<ItemId, ItemDefinition> = Object.fromEntries(
  Object.entries(authoredItems).map(([id, item]) => {
    const itemId = id as ItemId
    const inventoryCategory = item.inventoryCategory ?? (item.kind === 'equipment' ? 'equipment' : 'material')
    const isArtifact = isArtifactId(itemId)
    return [id, {
      ...item,
      inventoryCategory,
      ...(inventoryCategory === 'material' ? { materialSubtype: item.materialSubtype ?? (item.category === 'elemental' ? 'elemental' : 'creature') } : {}),
      sellValue: isArtifact ? null : item.sellValue ?? (item.kind === 'equipment' ? 180 : null),
      canDestroy: isArtifact ? false : item.canDestroy ?? true,
      ...(isArtifact || item.actionRestrictionReason ? {
        actionRestrictionReason: isArtifact ? 'Artifact Equipment cannot be sold or destroyed.' : item.actionRestrictionReason,
      } : {}),
    }]
  }),
) as Record<ItemId, ItemDefinition>

const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']
const EQUIPMENT_NUMERIC_FIELDS: readonly (keyof EquipmentStats)[] = ['basicDamage', 'spellPower', 'maxHealth', 'healthRegen', 'maxMana', 'manaRegen', 'maxFocus', 'defense', 'critChance', 'critDamage', 'basicAttackSpeedPct', 'blockChance', 'cooldownRecoveryPct', 'healingDonePct', 'barrierPowerPct', 'damageOverTimePct', 'statusDurationPct', 'manaCostReductionPct', 'focusEfficiencyPct']
const validateEquipmentStats = (itemId: string, stats: EquipmentStats | undefined, errors: string[]) => {
  if (stats === undefined) return
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) { errors.push(`${itemId}: invalid equipment stats`); return }
  EQUIPMENT_NUMERIC_FIELDS.forEach((field) => { const value = stats[field]; if (value !== undefined && !Number.isFinite(value as number)) errors.push(`${itemId}: non-finite equipment stat ${field}`) })
  const bounded = (field: keyof EquipmentStats, min: number, max: number) => { const value = stats[field] as number | undefined; if (value !== undefined && Number.isFinite(value) && (value < min || value > max)) errors.push(`${itemId}: invalid equipment stat ${String(field)}`) }
  bounded('defense', 0, Number.POSITIVE_INFINITY); bounded('critChance', 0, 1); bounded('critDamage', 0, Number.POSITIVE_INFINITY); bounded('blockChance', 0, MAX_BLOCK_CHANCE); bounded('manaCostReductionPct', 0, 0.8); bounded('focusEfficiencyPct', 0, 0.8)
  if (stats.resistances !== undefined) {
    if (!stats.resistances || typeof stats.resistances !== 'object' || Array.isArray(stats.resistances)) errors.push(`${itemId}: invalid equipment resistances`)
    else Object.entries(stats.resistances as Record<string, unknown>).forEach(([damageType, value]) => { if (!DAMAGE_TYPES.includes(damageType as DamageType) || typeof value !== 'number' || !Number.isFinite(value) || value < MIN_RESISTANCE || value > MAX_RESISTANCE) errors.push(`${itemId}: invalid ${damageType} resistance`) })
  }
}

const hasPositiveEquipmentStat = (stats: EquipmentStats | undefined, field: keyof EquipmentStats) => {
  const value = stats?.[field]
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
const requireEquipmentStats = (itemId: string, stats: EquipmentStats | undefined, fields: readonly (keyof EquipmentStats)[], errors: string[]) => {
  const missing = fields.filter((field) => !hasPositiveEquipmentStat(stats, field))
  if (missing.length) errors.push(`${itemId}: equipment requires positive ${missing.join(' and ')}`)
}
const requireEquipmentCoreStats = (itemId: string, stats: EquipmentStats | undefined, fields: readonly (keyof EquipmentStats)[], label: string, errors: string[]) => {
  if (fields.filter((field) => hasPositiveEquipmentStat(stats, field)).length < 2) errors.push(`${itemId}: ${label} requires at least two positive core/resource stats`)
}
const validateEquipmentChassis = (item: ItemDefinition, errors: string[]) => {
  if (item.kind !== 'equipment') return
  if (isArtifactId(item.id)) return
  if (item.equipmentSlot === 'weapon') requireEquipmentStats(item.id, item.stats, ['basicDamage', 'spellPower'], errors)
  if (item.equipmentSlot === 'armor' || item.equipmentSlot === 'helmet' || item.equipmentSlot === 'cape') requireEquipmentStats(item.id, item.stats, ['maxHealth', 'defense'], errors)
  if (item.equipmentSlot === 'amulet') requireEquipmentCoreStats(item.id, item.stats, ['maxHealth', 'maxMana', 'spellPower', 'defense'], 'amulets', errors)
  if (item.equipmentSlot === 'ring') requireEquipmentCoreStats(item.id, item.stats, ['maxHealth', 'maxMana', 'spellPower', 'manaRegen'], 'rings', errors)
  if (item.equipmentSlot === 'earring') requireEquipmentCoreStats(item.id, item.stats, ['maxHealth', 'maxMana', 'spellPower', 'manaRegen'], 'earrings', errors)
}

const validateEquipmentMetadata = (item: ItemDefinition, errors: string[]) => {
  if (item.kind !== 'equipment') {
    if (item.equipmentTier !== undefined) errors.push(`${item.id}: only equipment items may define equipmentTier`)
    if (item.buildTags !== undefined) errors.push(`${item.id}: only equipment items may define buildTags`)
    if (item.equipmentBudgetProfile !== undefined) errors.push(`${item.id}: only equipment items may define equipmentBudgetProfile`)
    return
  }
  if (isArtifactId(item.id)) return
  if (item.equipmentTier === undefined || !Number.isFinite(item.equipmentTier) || item.equipmentTier <= 0) errors.push(`${item.id}: equipmentTier must be finite and greater than 0`)
  const tags = item.buildTags
  if (!Array.isArray(tags) || tags.length < 1 || tags.length > 4) errors.push(`${item.id}: buildTags must contain 1 to 4 tags`)
  else {
    const seen = new Set<EquipmentBuildTag>()
    tags.forEach((tag) => {
      if (!Object.prototype.hasOwnProperty.call(EQUIPMENT_BUILD_TAG_LABELS, tag)) errors.push(`${item.id}: unknown equipment build tag ${String(tag)}`)
      if (seen.has(tag)) errors.push(`${item.id}: duplicate equipment build tag ${tag}`)
      seen.add(tag)
    })
  }
  const profileId = item.equipmentBudgetProfile
  if (!profileId || !Object.prototype.hasOwnProperty.call(EQUIPMENT_BUDGET_PROFILES, profileId)) errors.push(`${item.id}: unknown equipment budget profile`)
  else {
    const profile = EQUIPMENT_BUDGET_PROFILES[profileId as EquipmentBudgetProfileId]
    const hasSignatureEffect = Boolean(item.combat?.modifiers?.length || item.combat?.rules?.length)
    if (profileId === 'standard' && hasSignatureEffect) errors.push(`${item.id}: standard equipment must not define combat modifiers or rules`)
    if ((profileId === 'signature' || profileId === 'boss') && !hasSignatureEffect) errors.push(`${item.id}: ${profileId} equipment requires a combat modifier or rule`)
    if (!profile) errors.push(`${item.id}: invalid equipment budget profile`) // Defensive runtime check for casted authored data.
  }
}

export const validateItemDefinitions = (items: Record<string, ItemDefinition> = ITEMS) => {
  const errors: string[] = []
  validateEquipmentBudgetProfiles(errors)
  Object.entries(items).forEach(([key, item]) => {
    if (key !== item.id) errors.push(`${key}: key/id mismatch`)
    if (item.kind === 'equipment' && !item.equipmentSlot) errors.push(`${item.id}: equipment slot is required`)
    if (item.kind === 'equipment' && item.materialTier !== undefined) errors.push(`${item.id}: equipment must not define materialTier`)
    const materialTier = item.materialTier
    if (item.kind === 'material' && (materialTier === undefined || !Number.isInteger(materialTier) || materialTier < 1)) errors.push(`${item.id}: materialTier must be a positive integer`)
    validateEquipmentStats(item.id, item.stats, errors)
    validateEquipmentChassis(item, errors)
    validateEquipmentMetadata(item, errors)
    if (item.combat && item.kind !== 'equipment') errors.push(`${item.id}: only equipment items may define combat metadata`)
    errors.push(...validateCombatProvider(item.combat, `${item.id}.combat`, createCombatValidationContext(STATUS_DEFINITIONS)))
  })
  errors.push(...validateArtifactDefinitions(items))
  if (errors.length && import.meta.env.DEV) console.error(`[combat-items] ${errors.join('; ')}`)
  return errors
}

export const getResearchXp = (itemId: ItemId, targetSchoolId: SchoolId) => ITEMS[itemId].researchSchool === targetSchoolId ? BALANCE.research.matchingXp : BALANCE.research.nonMatchingXp
export const getResearchableItemIds = () => (Object.keys(ITEMS) as ItemId[]).filter((itemId) => ITEMS[itemId].kind === 'material' && Boolean(ITEMS[itemId].researchSchool))
export const getItemSourceLabel = (itemId: ItemId) => ITEMS[itemId].materialSubtype === 'elemental' || itemId === 'prismatic-fragment' ? 'Wizard Tower → Transmutation' : itemId === 'life-essence' ? 'Combat → all monsters' : ITEMS[itemId].source

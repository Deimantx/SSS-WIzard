import { ITEMS } from '../../content/items/items'
import { getEquipmentCombatModifierTotal } from '../../core/equipment/equipmentStats'
import { evaluateEquipmentChange, type EquipmentChangeFailureReason } from '../../core/equipment/equipmentChange'
import { getPlayerSheetCombatStats } from '../../systems/combat/combatStats'
import type { DamageType, EquipmentStats, EquipmentPosition, GameState, ItemId } from '../../types'

export type EquipmentSheetState = Pick<GameState, 'player' | 'progress' | 'activities' | 'equipment' | 'inventory'> & Partial<Pick<GameState, 'debug' | 'artifactProgress'>>

export interface EquipmentStatSnapshot {
  maxHealth: number
  healthRegen: number
  maxMana: number
  maxFocus: number
  manaRegen: number
  basicDamage: number
  spellPower: number
  basicAttackSpeedMultiplier: number
  basicAttackIntervalMs: number
  critChance: number
  critDamageMultiplier: number
  defense: number
  damageReduction: number
  blockChance: number
  damageOverTimeBonus: number
  statusDurationBonus: number
  cooldownRecovery: number
  healingDoneBonus: number
  barrierPowerBonus: number
  manaCostReduction: number
  focusEfficiency: number
  fireSpellDamage: number
  airSpellDamage: number
  waterBarrierPower: number
  barrierReceivedFlat: number
  negativeStatusDurationReceived: number
  resistances: Partial<Record<DamageType, number>>
}

export interface EquipmentImpactStats extends EquipmentStats {
  damageReduction?: number
  fireSpellDamage?: number
  airSpellDamage?: number
  waterBarrierPower?: number
  barrierReceivedFlat?: number
  negativeStatusDurationReceived?: number
}

export interface EquipmentPreview {
  compatible: boolean
  reason: string | null
  failureReason: EquipmentChangeFailureReason | null
  position: EquipmentPosition | null
  equipment: GameState['equipment'] | null
  current: EquipmentStatSnapshot
  preview: EquipmentStatSnapshot | null
  impact: EquipmentImpactStats
}

/** Compatibility projections for the current Equipment sheet; filtered modifiers use the generic evaluator. */
const getStableEquipmentModifiers = (state: EquipmentSheetState, equipment: GameState['equipment']) => ({
  fireSpellDamage: getEquipmentCombatModifierTotal({ ...state, equipment }, 'spell-damage-percent', { originSourceKinds: ['spell'], damageType: 'fire' }),
  airSpellDamage: getEquipmentCombatModifierTotal({ ...state, equipment }, 'spell-damage-percent', { originSourceKinds: ['spell'], damageType: 'air' }),
  waterBarrierPower: getEquipmentCombatModifierTotal({ ...state, equipment }, 'barrier-power-percent', { sourceKinds: ['spell'], damageType: 'water' }),
  barrierReceivedFlat: getEquipmentCombatModifierTotal({ ...state, equipment }, 'barrier-received-flat'),
  negativeStatusDurationReceived: getEquipmentCombatModifierTotal({ ...state, equipment }, 'status-duration-received-percent', { statusTags: ['debuff'] }),
})

export const getEquipmentStatSnapshot = (state: EquipmentSheetState, equipment: GameState['equipment']): EquipmentStatSnapshot => {
  const runtimeState = { ...state, equipment }
  const sheet = getPlayerSheetCombatStats(runtimeState)
  const equipmentModifiers = getStableEquipmentModifiers(state, equipment)
  return {
    maxHealth: sheet.maxHealth,
    healthRegen: sheet.healthRegen,
    maxMana: sheet.maxMana,
    maxFocus: sheet.maxFocus,
    manaRegen: sheet.manaRegen,
    basicDamage: sheet.basicAttackDamage,
    spellPower: sheet.spellPower,
    basicAttackSpeedMultiplier: sheet.basicAttackSpeedMultiplier,
    basicAttackIntervalMs: sheet.basicAttackIntervalMs,
    critChance: sheet.critChance,
    critDamageMultiplier: sheet.critDamageMultiplier,
    defense: sheet.defense,
    damageReduction: sheet.defenseReduction,
    blockChance: sheet.blockChance,
    damageOverTimeBonus: sheet.damageOverTimeBonus,
    statusDurationBonus: sheet.statusDurationBonus,
    cooldownRecovery: sheet.cooldownRecovery,
    healingDoneBonus: sheet.healingDoneBonus,
    barrierPowerBonus: sheet.barrierPowerBonus,
    manaCostReduction: sheet.manaCostReduction,
    focusEfficiency: sheet.focusEfficiency,
    ...equipmentModifiers,
    resistances: { ...sheet.resistances },
  }
}

const subtractSnapshots = (current: EquipmentStatSnapshot, preview: EquipmentStatSnapshot): EquipmentImpactStats => ({
  maxHealth: preview.maxHealth - current.maxHealth,
  healthRegen: preview.healthRegen - current.healthRegen,
  maxMana: preview.maxMana - current.maxMana,
  maxFocus: preview.maxFocus - current.maxFocus,
  manaRegen: preview.manaRegen - current.manaRegen,
  basicDamage: preview.basicDamage - current.basicDamage,
  spellPower: preview.spellPower - current.spellPower,
  basicAttackSpeedPct: preview.basicAttackSpeedMultiplier - current.basicAttackSpeedMultiplier,
  critChance: preview.critChance - current.critChance,
  critDamage: preview.critDamageMultiplier - current.critDamageMultiplier,
  defense: preview.defense - current.defense,
  damageReduction: preview.damageReduction - current.damageReduction,
  blockChance: preview.blockChance - current.blockChance,
  damageOverTimePct: preview.damageOverTimeBonus - current.damageOverTimeBonus,
  statusDurationPct: preview.statusDurationBonus - current.statusDurationBonus,
  cooldownRecoveryPct: preview.cooldownRecovery - current.cooldownRecovery,
  healingDonePct: preview.healingDoneBonus - current.healingDoneBonus,
  barrierPowerPct: preview.barrierPowerBonus - current.barrierPowerBonus,
  manaCostReductionPct: preview.manaCostReduction - current.manaCostReduction,
  focusEfficiencyPct: preview.focusEfficiency - current.focusEfficiency,
  fireSpellDamage: preview.fireSpellDamage - current.fireSpellDamage,
  airSpellDamage: preview.airSpellDamage - current.airSpellDamage,
  waterBarrierPower: preview.waterBarrierPower - current.waterBarrierPower,
  barrierReceivedFlat: preview.barrierReceivedFlat - current.barrierReceivedFlat,
  negativeStatusDurationReceived: preview.negativeStatusDurationReceived - current.negativeStatusDurationReceived,
  resistances: Object.fromEntries(Object.keys({ ...current.resistances, ...preview.resistances }).map((damageType) => [damageType, (preview.resistances[damageType as DamageType] ?? 0) - (current.resistances[damageType as DamageType] ?? 0)])) as EquipmentStats['resistances'],
})

const failureMessage: Record<EquipmentChangeFailureReason, string> = {
  'missing-item': 'That item no longer exists.',
  'not-owned': 'You do not own this item.',
  'not-equipment': 'That item cannot be equipped.',
  incompatible: 'This item cannot be equipped in that slot.',
  'ring-target-required': 'Choose Ring 1 or Ring 2 to replace.',
  'insufficient-copies': 'A second copy is required for this Ring position.',
  'duplicate-ring': 'The same Ring cannot be equipped twice.',
}

const getFailureMessage = (_state: EquipmentSheetState, _itemId: ItemId, reason: EquipmentChangeFailureReason) => failureMessage[reason]

export function getEquipmentPreview(state: EquipmentSheetState, itemId: ItemId, targetPosition?: EquipmentPosition): EquipmentPreview {
  const current = getEquipmentStatSnapshot(state, state.equipment)
  const result = evaluateEquipmentChange(state, itemId, targetPosition)
  if (!result.ok) return { compatible: false, reason: getFailureMessage(state, itemId, result.reason), failureReason: result.reason, position: targetPosition ?? null, equipment: null, current, preview: null, impact: {} }
  const preview = getEquipmentStatSnapshot(state, result.nextEquipment)
  return { compatible: true, reason: null, failureReason: null, position: result.position, equipment: result.nextEquipment, current, preview, impact: subtractSnapshots(current, preview) }
}

export const getEquipmentCopyAvailability = (state: Pick<GameState, 'equipment' | 'inventory'>, itemId: ItemId) => {
  const owned = Math.max(0, Math.floor(state.inventory[itemId] ?? 0))
  const equipped = Object.values(state.equipment).filter((equippedItemId) => equippedItemId === itemId).length
  return { owned, equipped, available: Math.max(0, owned - equipped) }
}

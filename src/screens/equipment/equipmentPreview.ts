import { ITEMS } from '../../game/content/items/items'
import { equipmentStats } from '../../game/engine'
import { getPlayerSheetCombatStats } from '../../game/systems/combat/combatStats'
import { isPositionCompatible, isTwoHandedWeapon, previewEquipmentState } from '../../game/core/equipment'
import type { EquipmentPosition, EquipmentStats, GameState, ItemId } from '../../game/types'
import type { DamageType } from '../../game/systems/combat/combatTypes'

export interface EquipmentStatSnapshot {
  maxHealth: number
  maxMana: number
  maxFocus: number
  manaRegen: number
  basicDamage: number
  spellPower: number
  barrierReceived: number
  fireSpellDamagePct: number
  waterBarrierPct: number
  earthSpellDamagePct: number
  airSpellDamagePct: number
  basicAttackSpeedMultiplier: number
  critChance: number
  critDamageMultiplier: number
  defense: number
  blockChance: number
  damageOverTimeBonus: number
  statusDurationBonus: number
  cooldownRecovery: number
  healingDoneBonus: number
  barrierPowerBonus: number
  manaCostReduction: number
  focusEfficiency: number
  resistances: Partial<Record<DamageType, number>>
}

export interface EquipmentPreview {
  compatible: boolean
  reason: string | null
  position: EquipmentPosition | null
  equipment: GameState['equipment'] | null
  removedOffhand: ItemId | null
  current: EquipmentStatSnapshot
  preview: EquipmentStatSnapshot | null
  impact: EquipmentStats
}

export const getEquipmentStatSnapshot = (state: Pick<GameState, 'player' | 'progress' | 'activities' | 'equipment'> & Partial<Pick<GameState, 'debug'>>, equipment: GameState['equipment']): EquipmentStatSnapshot => {
  const stats = equipmentStats({ equipment })
  const sheet = getPlayerSheetCombatStats({ ...state, equipment } as GameState)
  return {
    maxHealth: sheet.maxHealth,
    maxMana: sheet.maxMana,
    maxFocus: sheet.maxFocus,
    manaRegen: sheet.manaRegen,
    basicDamage: sheet.basicAttackDamage,
    spellPower: sheet.spellPower,
    barrierReceived: stats.barrierReceived ?? 0,
    fireSpellDamagePct: stats.fireSpellDamagePct ?? 0,
    waterBarrierPct: stats.waterBarrierPct ?? 0,
    earthSpellDamagePct: stats.earthSpellDamagePct ?? 0,
    airSpellDamagePct: stats.airSpellDamagePct ?? 0,
    basicAttackSpeedMultiplier: sheet.basicAttackSpeedMultiplier,
    critChance: sheet.critChance,
    critDamageMultiplier: sheet.critDamageMultiplier,
    defense: sheet.defense,
    blockChance: sheet.blockChance,
    damageOverTimeBonus: sheet.damageOverTimeBonus,
    statusDurationBonus: sheet.statusDurationBonus,
    cooldownRecovery: sheet.cooldownRecovery,
    healingDoneBonus: sheet.healingDoneBonus,
    barrierPowerBonus: sheet.barrierPowerBonus,
    manaCostReduction: sheet.manaCostReduction,
    focusEfficiency: sheet.focusEfficiency,
    resistances: { ...sheet.resistances },
  }
}

const subtractSnapshots = (current: EquipmentStatSnapshot, preview: EquipmentStatSnapshot): EquipmentStats => ({
  maxHealth: preview.maxHealth - current.maxHealth,
  maxMana: preview.maxMana - current.maxMana,
  maxFocus: preview.maxFocus - current.maxFocus,
  manaRegen: preview.manaRegen - current.manaRegen,
  basicDamage: preview.basicDamage - current.basicDamage,
  spellPower: preview.spellPower - current.spellPower,
  barrierReceived: preview.barrierReceived - current.barrierReceived,
  fireSpellDamagePct: preview.fireSpellDamagePct - current.fireSpellDamagePct,
  waterBarrierPct: preview.waterBarrierPct - current.waterBarrierPct,
  earthSpellDamagePct: preview.earthSpellDamagePct - current.earthSpellDamagePct,
  airSpellDamagePct: preview.airSpellDamagePct - current.airSpellDamagePct,
  basicAttackSpeedPct: preview.basicAttackSpeedMultiplier - current.basicAttackSpeedMultiplier,
  critChance: preview.critChance - current.critChance,
  critDamage: preview.critDamageMultiplier - current.critDamageMultiplier,
  defense: preview.defense - current.defense,
  blockChance: preview.blockChance - current.blockChance,
  damageOverTimePct: preview.damageOverTimeBonus - current.damageOverTimeBonus,
  statusDurationPct: preview.statusDurationBonus - current.statusDurationBonus,
  cooldownRecoveryPct: preview.cooldownRecovery - current.cooldownRecovery,
  healingDonePct: preview.healingDoneBonus - current.healingDoneBonus,
  barrierPowerPct: preview.barrierPowerBonus - current.barrierPowerBonus,
  manaCostReductionPct: preview.manaCostReduction - current.manaCostReduction,
  focusEfficiencyPct: preview.focusEfficiency - current.focusEfficiency,
  resistances: Object.fromEntries(Object.keys({ ...current.resistances, ...preview.resistances }).map((damageType) => [damageType, (preview.resistances[damageType as DamageType] ?? 0) - (current.resistances[damageType as DamageType] ?? 0)])) as EquipmentStats['resistances'],
})

export function getEquipmentPreview(state: Pick<GameState, 'player' | 'progress' | 'activities' | 'equipment'> & Partial<Pick<GameState, 'debug'>>, itemId: ItemId, targetPosition?: EquipmentPosition): EquipmentPreview {
  const current = getEquipmentStatSnapshot(state, state.equipment)
  const item = getItem(itemId)
  const requestedPosition = targetPosition ?? (item?.equipmentSlot === 'ring' ? state.equipment.ring1 ? state.equipment.ring2 ? undefined : 'ring2' : 'ring1' : item?.equipmentSlot as EquipmentPosition | undefined)
  const removedOffhand = item && isTwoHandedWeapon(itemId) ? state.equipment.offhand : null
  if (!item || !requestedPosition || !isPositionCompatible(itemId, requestedPosition)) return { compatible: false, reason: item?.equipmentSlot === 'ring' && !requestedPosition ? 'Choose Ring 1 or Ring 2 to replace.' : 'This item cannot be equipped in that slot.', position: requestedPosition ?? null, equipment: null, removedOffhand: null, current, preview: null, impact: {} }
  if (item.equipmentSlot === 'offhand' && isTwoHandedWeapon(state.equipment.weapon)) return { compatible: false, reason: 'Requires a one-handed Weapon.', position: requestedPosition, equipment: null, removedOffhand: null, current, preview: null, impact: {} }
  const next = previewEquipmentState(state.equipment, itemId, requestedPosition)
  if (!next) return { compatible: false, reason: 'This item cannot be equipped in that slot.', position: requestedPosition, equipment: null, removedOffhand: null, current, preview: null, impact: {} }
  const preview = getEquipmentStatSnapshot(state, next)
  return { compatible: true, reason: null, position: requestedPosition, equipment: next, removedOffhand, current, preview, impact: subtractSnapshots(current, preview) }
}

function getItem(itemId: ItemId) {
  return ITEMS[itemId]
}

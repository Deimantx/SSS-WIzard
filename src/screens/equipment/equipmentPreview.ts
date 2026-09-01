import { BALANCE } from '../../game/core/balance/balance'
import { ITEMS } from '../../game/content/items/items'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from '../../game/engine/channelingEngine'
import { equipmentStats } from '../../game/engine'
import { getSpellPower } from '../../game/systems/spells/spellPower'
import { isPositionCompatible, isTwoHandedWeapon, previewEquipmentState } from '../../game/core/equipment'
import type { EquipmentPosition, EquipmentStats, GameState, ItemId } from '../../game/types'

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
  const capacity = getManaCapacityBreakdown({ player: state.player, progress: state.progress, equipment, debug: state.debug })
  const regen = getManaRegenBreakdown({ activities: state.activities, progress: state.progress, equipment, debug: state.debug })
  const permanentFocus = Object.values(state.progress.permanentFocusBonuses).reduce((sum, value) => sum + value, 0)
  return {
    maxHealth: state.player.baseMaxHealth + (stats.maxHealth ?? 0),
    maxMana: capacity.total,
    maxFocus: Math.max(0, state.player.baseMaxFocus + permanentFocus + (stats.maxFocus ?? 0) + (state.debug?.bonusMaxFocusFlat ?? 0)),
    manaRegen: regen.total,
    basicDamage: BALANCE.player.basicAttackDamage + (stats.basicDamage ?? 0),
    spellPower: getSpellPower({ equipment }),
    barrierReceived: stats.barrierReceived ?? 0,
    fireSpellDamagePct: stats.fireSpellDamagePct ?? 0,
    waterBarrierPct: stats.waterBarrierPct ?? 0,
    earthSpellDamagePct: stats.earthSpellDamagePct ?? 0,
    airSpellDamagePct: stats.airSpellDamagePct ?? 0,
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

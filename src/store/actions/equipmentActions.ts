import { ITEMS } from '../../game/content/items/items'
import { pushNotification, recalculateDerivedStats } from '../../game/engine'
import type { EquipmentSlot, GameState, ItemId } from '../../game/types'

export const equipItemAction = (state: GameState, itemId: ItemId) => {
  const item = ITEMS[itemId]
  if (!item.equipmentSlot || (state.inventory[itemId] ?? 0) < 1) return
  state.equipment[item.equipmentSlot] = itemId
  recalculateDerivedStats(state)
  pushNotification(state, `${item.name} equipped`, 'success')
}

export const unequipItemAction = (state: GameState, slot: EquipmentSlot) => {
  const old = state.equipment[slot]
  state.equipment[slot] = null
  recalculateDerivedStats(state)
}

import { canReserveFocus as canReserveFocusNormal, selectFreeFocus, selectUsedFocus } from '../../game/engine'
import { FOCUS_IMPROVEMENT, getFocusImprovementLevelCost } from '../../game/content/focus/focusImprovement'
import { ITEMS } from '../../game/content/items/items'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import { getEquippedReservedQuantity } from '../../game/core/equipment/equipmentRules'
import { recalculateDerivedStats, pushNotification } from '../../game/engine'
import type { GameState } from '../../game/types'
import { clamp } from '../../game/utils'

export const canReserveFocusAction = (state: GameState, amount: number) => state.debug.allowFocusOverCap || canReserveFocusNormal(state, amount)
export const getFocusAllocation = (state: GameState) => ({ used: selectUsedFocus(state), free: selectFreeFocus(state), max: state.player.maxFocus })

const isProtected = (state: GameState, itemId: 'prismatic-fragment') => Boolean(state.protectedItems[itemId]) || getEquippedReservedQuantity(state, itemId) > 0

export const upgradeFocusCapacityAction = (state: GameState) => {
  const currentLevel = state.progress.focusImprovement.level
  if (currentLevel >= FOCUS_IMPROVEMENT.maxLevel) {
    pushNotification(state, 'Focus Capacity is already mastered', 'warning')
    return false
  }
  const cost = getFocusImprovementLevelCost(currentLevel + 1)
  if (!cost) return false
  const protectedItem = isProtected(state, 'prismatic-fragment') ? 'prismatic-fragment' : undefined
  if (protectedItem) {
    pushNotification(state, `Upgrade blocked. ${ITEMS[protectedItem].name} is protected.`, 'warning')
    return false
  }
  const missingItem = getConsumableQuantity(state, 'prismatic-fragment') < cost.primary ? 'prismatic-fragment' : undefined
  if (missingItem) {
    pushNotification(state, `Not enough ${ITEMS[missingItem].name}. Need ${cost.primary}.`, 'warning')
    return false
  }
  state.inventory['prismatic-fragment'] = Math.max(0, (state.inventory['prismatic-fragment'] ?? 0) - cost.primary)
  state.progress.focusImprovement.rank = 1
  state.progress.focusImprovement.level = currentLevel + 1
  recalculateDerivedStats(state)
  pushNotification(state, currentLevel + 1 === FOCUS_IMPROVEMENT.maxLevel ? 'Focus Capacity mastered Rank I' : `Focus Capacity reached Level ${currentLevel + 1}`, 'success')
  return true
}

export const setFocusImprovementLevelAction = (state: GameState, level: number) => {
  state.progress.focusImprovement.rank = 1
  state.progress.focusImprovement.level = clamp(Math.round(level), 0, FOCUS_IMPROVEMENT.maxLevel)
  recalculateDerivedStats(state)
}

import type { GameState, ItemId, MonsterId } from '../../types'

/** Records historical item discovery. Consumption and ownership changes never remove it. */
export function discoverItem(state: GameState, itemId: ItemId) {
  if (!state.progress.discoveredItems.includes(itemId)) state.progress.discoveredItems.push(itemId)
}

/** Records a creature when it is encountered, before the player has to defeat it. */
export function discoverMonster(state: GameState, monsterId: MonsterId) {
  if (!state.progress.discoveredMonsters.includes(monsterId)) state.progress.discoveredMonsters.push(monsterId)
}

import type { GameState, ItemId } from '../../types'
import { discoverItem } from '../collection/discovery'
import { isArtifactItem } from '../artifacts/artifactProgression'

/** The only gameplay primitive for adding a positive quantity of an item. */
export function grantItem(state: GameState, itemId: ItemId, quantity: number) {
  const amount = Number.isFinite(quantity) ? Math.floor(quantity) : 0
  if (amount <= 0) return 0
  state.inventory[itemId] = isArtifactItem(itemId) ? Math.min(1, state.inventory[itemId] ?? 0 + amount) : (state.inventory[itemId] ?? 0) + amount
  if (isArtifactItem(itemId) && !state.artifactProgress[itemId]) state.artifactProgress[itemId] = { level: 1, allocatedNodeIds: [], attunedNodeIds: [] }
  discoverItem(state, itemId)
  return amount
}

import type { GameState, ItemId } from '../../types'
import { discoverItem } from '../collection/discovery'
import { isArtifactItem } from '../artifacts/artifactProgression'
import { isPortalShardItemId } from '../../content/darkPortal/portalShards'

/** The only gameplay primitive for adding a positive quantity of an item. */
export function grantItem(state: GameState, itemId: ItemId, quantity: number) {
  if (isPortalShardItemId(itemId)) return 0
  const amount = Number.isFinite(quantity) ? Math.floor(quantity) : 0
  const current = Math.max(0, state.inventory[itemId] ?? 0)
  const artifact = isArtifactItem(itemId)
  if (artifact && current > 0 && !state.artifactProgress[itemId]) state.artifactProgress[itemId] = { level: 1, allocatedNodeIds: [], attunedNodeIds: [] }
  if (amount <= 0) return 0
  const next = artifact ? Math.min(1, current + amount) : current + amount
  const granted = next - current
  state.inventory[itemId] = next
  if (artifact && !state.artifactProgress[itemId]) state.artifactProgress[itemId] = { level: 1, allocatedNodeIds: [], attunedNodeIds: [] }
  if (granted > 0) discoverItem(state, itemId)
  return granted
}

import { getPortalShardDefinition, getPortalShardDefinitions, type PortalShardId } from '../../content/darkPortal/portalShards'
import { discoverItem } from '../collection/discovery'
import type { DarkPortalProgressState, GameState } from '../../types'

const portalShardIds = new Set<PortalShardId>(getPortalShardDefinitions().map((shard) => shard.id))

const isPortalShardId = (value: unknown): value is PortalShardId => typeof value === 'string' && portalShardIds.has(value as PortalShardId)

/** Normalizes permanent shard recovery and transfers the legacy inventory copy exactly once. */
export const normalizeDarkPortalProgress = (state: GameState): DarkPortalProgressState => {
  const current = state.darkPortal as Partial<DarkPortalProgressState> | undefined
  const recoveredIds = new Set<PortalShardId>(Array.isArray(current?.recoveredShards) ? current.recoveredShards.filter(isPortalShardId) : [])
  const legacyQuantity = state.inventory['black-portal-shard'] ?? 0
  const legacyRecovered = typeof legacyQuantity === 'number' && Number.isFinite(legacyQuantity) && legacyQuantity > 0
  if (legacyRecovered) recoveredIds.add('black-portal-shard')

  state.darkPortal = {
    recoveredShards: getPortalShardDefinitions().filter((shard) => recoveredIds.has(shard.id)).map((shard) => shard.id),
  }
  state.darkPortal.recoveredShards.forEach((shardId) => {
    const itemId = getPortalShardDefinition(shardId)?.itemId
    if (itemId) discoverItem(state, itemId)
  })

  delete state.inventory['black-portal-shard']
  delete state.protectedItems['black-portal-shard']
  return state.darkPortal
}

/** Recovers one permanent portal shard. Repeated recovery is a no-op. */
export const recoverPortalShard = (state: GameState, shardId: PortalShardId) => {
  if (!portalShardIds.has(shardId)) return false
  const definition = getPortalShardDefinition(shardId)
  const itemId = definition?.itemId
  if (itemId) {
    delete state.inventory[itemId]
    delete state.protectedItems[itemId]
  }
  if (!state.darkPortal || !Array.isArray(state.darkPortal.recoveredShards)) state.darkPortal = { recoveredShards: [] }
  if (state.darkPortal.recoveredShards.includes(shardId)) return false
  state.darkPortal.recoveredShards.push(shardId)
  if (itemId) discoverItem(state, itemId)
  return true
}

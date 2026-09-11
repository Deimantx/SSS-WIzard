import { getPortalShardDefinitions, PORTAL_SHARD_SLOT_COUNT, type PortalShardDefinition, type PortalShardId } from '../../content/darkPortal/portalShards'
import type { GameState } from '../../types'

export interface PortalShardViewModel extends PortalShardDefinition {
  owned: boolean
}

const recoveredShards = (state: Pick<GameState, 'darkPortal'>) => new Set(state.darkPortal?.recoveredShards ?? [])

export const isPortalShardOwned = (state: Pick<GameState, 'darkPortal'>, shardId: PortalShardId) => recoveredShards(state).has(shardId)

export const getOwnedPortalShardCount = (state: Pick<GameState, 'darkPortal'>) => {
  const recovered = recoveredShards(state)
  return getPortalShardDefinitions().filter((shard) => recovered.has(shard.id)).length
}

export const getPortalShardViewModels = (state: Pick<GameState, 'darkPortal'>): PortalShardViewModel[] => {
  const recovered = recoveredShards(state)
  return getPortalShardDefinitions().map((shard) => ({ ...shard, owned: recovered.has(shard.id) }))
}

export const getPortalShardSlotCount = () => PORTAL_SHARD_SLOT_COUNT

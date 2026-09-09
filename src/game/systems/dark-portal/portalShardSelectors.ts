import { getPortalShardDefinitions, PORTAL_SHARD_SLOT_COUNT, type PortalShardDefinition, type PortalShardId } from '../../content/darkPortal/portalShards'
import type { GameState } from '../../types'

export interface PortalShardViewModel extends PortalShardDefinition {
  owned: boolean
  quantity: number
}

export const isPortalShardOwned = (state: Pick<GameState, 'inventory'>, shardId: PortalShardId) => {
  const definition = getPortalShardDefinitions().find((shard) => shard.id === shardId)
  return Boolean(definition?.itemId && (state.inventory[definition.itemId] ?? 0) > 0)
}

export const getOwnedPortalShardCount = (state: Pick<GameState, 'inventory'>) => getPortalShardDefinitions().filter((shard) => shard.itemId && (state.inventory[shard.itemId] ?? 0) > 0).length

export const getPortalShardViewModels = (state: Pick<GameState, 'inventory'>): PortalShardViewModel[] => getPortalShardDefinitions().map((shard) => {
  const quantity = shard.itemId ? Math.min(1, Math.max(0, Math.floor(state.inventory[shard.itemId] ?? 0))) : 0
  return { ...shard, owned: quantity > 0, quantity }
})

export const getPortalShardSlotCount = () => PORTAL_SHARD_SLOT_COUNT

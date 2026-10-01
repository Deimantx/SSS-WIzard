import type { ItemId } from '../../types'

export type PortalShardId =
  | 'black-portal-shard'
  | 'future-shard-02'
  | 'future-shard-03'
  | 'future-shard-04'
  | 'future-shard-05'
  | 'future-shard-06'
  | 'future-shard-07'
  | 'future-shard-08'
  | 'future-shard-09'
  | 'future-shard-10'
  | 'future-shard-11'
  | 'future-shard-12'
  | 'future-shard-13'
  | 'future-shard-14'
  | 'future-shard-15'

export interface PortalShardDefinition {
  id: PortalShardId
  itemId: ItemId | null
  displayName: string
  shortLabel: string
  statusLabel?: string
  sourceText: string
  unlockText?: string
  order: number
}

export const PORTAL_SHARD_SLOT_COUNT = 15

const SHARD_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']

const futureShard = (order: number): PortalShardDefinition => ({
  id: `future-shard-${String(order).padStart(2, '0')}` as PortalShardId,
  itemId: null,
  displayName: 'Unknown Shard',
  shortLabel: `Shard ${SHARD_LABELS[order - 1]}`,
  statusLabel: 'Not Recovered',
  sourceText: 'A future major boss',
  unlockText: 'A missing fragment of the Dark Portal.',
  order,
})

export const PORTAL_SHARDS: readonly PortalShardDefinition[] = [
  {
    id: 'black-portal-shard',
    itemId: 'black-portal-shard',
    displayName: 'Black Portal Shard',
    shortLabel: 'Shard I',
    statusLabel: 'Recovered',
    sourceText: "Archmage Edrin's Shade · first defeat",
    unlockText: 'Awakened the Dark Portal chamber.',
    order: 1,
  },
  ...Array.from({ length: PORTAL_SHARD_SLOT_COUNT - 1 }, (_, index) => futureShard(index + 2)),
]

export const getPortalShardDefinitions = () => PORTAL_SHARDS
export const getPortalShardDefinition = (shardId: PortalShardId) => PORTAL_SHARDS.find((shard) => shard.id === shardId)

const PORTAL_SHARD_ITEM_IDS = new Set<ItemId>(PORTAL_SHARDS.flatMap((shard) => shard.itemId ? [shard.itemId] : []))
export const isPortalShardItemId = (itemId: ItemId) => PORTAL_SHARD_ITEM_IDS.has(itemId)

import type { ItemId } from '../../game/types'

export interface LootRevealItem {
  itemId: ItemId
  quantity: number
  isNewDiscovery: boolean
}

export interface LootRevealEvent {
  id: string
  sourceKind: 'combat'
  sourceKey: string
  sourceLabel: string
  sourceDetail: string
  items: LootRevealItem[]
  createdAt: number
  durationMs: number
}

export interface CombatLootRevealInput {
  sourceLabel: string
  sourceDetail: string
  items: LootRevealItem[]
  now?: number
}

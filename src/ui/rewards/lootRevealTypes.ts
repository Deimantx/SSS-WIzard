import type { ItemId } from '../../game/types'

export interface LootRevealItem {
  itemId: ItemId
  quantity: number
  isNewDiscovery: boolean
}

export interface LootRevealSigil {
  instanceId: string
  setId: string
  slot: number
  tier: number
  quality: string
  autoSalvaged: boolean
  dustGranted: number
}

export interface LootRevealEvent {
  id: string
  sourceKind: 'combat'
  sourceKey: string
  sourceLabel: string
  sourceDetail: string
  items: LootRevealItem[]
  sigils: LootRevealSigil[]
  createdAt: number
  durationMs: number
}

export interface CombatLootRevealInput {
  sourceLabel: string
  sourceDetail: string
  items: LootRevealItem[]
  sigils?: readonly LootRevealSigil[]
  now?: number
}

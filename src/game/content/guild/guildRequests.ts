import type { DungeonId, GuildRequestKind, ItemId, MonsterId } from '../../types'

export interface GuildRequestDefinition {
  id: string
  name: string
  description: string
  kind: GuildRequestKind
  target: number
  reputation: number
  guildPoints: number
  itemId?: ItemId
  dungeonId?: DungeonId
  monsterId?: MonsterId
  bossId?: MonsterId
}

export const GUILD_REQUESTS = {
  'field-supplies': { id: 'field-supplies', name: 'Field Supplies', description: 'Donate 25 Life Essence to stock the Verdant Circle.', kind: 'donation', itemId: 'life-essence', target: 25, reputation: 50, guildPoints: 1 },
  'thin-the-pack': { id: 'thin-the-pack', name: 'Thin the Pack', description: 'Defeat normal monsters in Howling Den.', kind: 'dungeon-kills', dungeonId: 'howling-den', target: 30, reputation: 50, guildPoints: 1 },
  'den-stalker': { id: 'den-stalker', name: 'The Den Stalker', description: 'Defeat Den Stalker three times.', kind: 'monster-kills', monsterId: 'den-stalker', target: 3, reputation: 75, guildPoints: 1 },
  'greatbear-contract': { id: 'greatbear-contract', name: 'Greatbear Contract', description: 'Defeat Corrupted Greatbear once.', kind: 'boss-kill', bossId: 'corrupted-greatbear', target: 1, reputation: 100, guildPoints: 1 },
} satisfies Record<string, GuildRequestDefinition>

export type GuildRequestId = keyof typeof GUILD_REQUESTS
export const GUILD_REQUEST_IDS = Object.keys(GUILD_REQUESTS) as GuildRequestId[]

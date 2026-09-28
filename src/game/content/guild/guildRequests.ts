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
  'field-supplies': { id: 'field-supplies', name: 'Materials for the Archive', description: 'Deliver 25 Life Essence to replenish the Guild archive wards.', kind: 'donation', itemId: 'life-essence', target: 25, reputation: 50, guildPoints: 1 },
} satisfies Record<string, GuildRequestDefinition>

export type GuildRequestId = keyof typeof GUILD_REQUESTS
export const GUILD_REQUEST_IDS = Object.keys(GUILD_REQUESTS) as GuildRequestId[]

/**
 * Compatibility-only requests from the pre-V2 Guild. They remain readable so
 * old saves can contribute promotion evidence, but never appear in the new
 * active contract board.
 */
export const LEGACY_GUILD_REQUESTS = {
  'arcane-supply': { id: 'arcane-supply', kind: 'donation' as const, itemId: 'fire-fragment' as const, target: 20, reputation: 50, guildPoints: 0 },
  'clear-the-woods': { id: 'clear-the-woods', kind: 'dungeon-kills' as const, target: 30, reputation: 50, guildPoints: 0 },
  'sentinel-breaker': { id: 'sentinel-breaker', kind: 'monster-kills' as const, target: 2, reputation: 75, guildPoints: 0 },
  'thin-the-pack': { id: 'thin-the-pack', kind: 'dungeon-kills' as const, target: 30, reputation: 50, guildPoints: 0 },
  'den-stalker': { id: 'den-stalker', kind: 'monster-kills' as const, target: 3, reputation: 75, guildPoints: 0 },
  'greatbear-contract': { id: 'greatbear-contract', kind: 'boss-kill' as const, target: 1, reputation: 100, guildPoints: 0 },
} as const


export interface GuildCommissionTemplate {
  id: string
  category: 'delivery' | 'production' | 'research' | 'transmutation' | 'mixed'
  itemId?: ItemId
  target: number
  baseReputation: number
  baseAdvancementPoints: number
  minimumProgressStage: 'guild' | 'research' | 'transmutation'
  weight?: number
  components?: readonly { category: 'production' | 'research' | 'transmutation'; itemId?: ItemId; target: number }[]
}

export const GUILD_COMMISSION_TEMPLATES: readonly GuildCommissionTemplate[] = [
  { id: 'deliver-life-essence-small', category: 'delivery', itemId: 'life-essence', target: 8, baseReputation: 45, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'deliver-life-essence-standard', category: 'delivery', itemId: 'life-essence', target: 18, baseReputation: 75, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'deliver-life-essence-large', category: 'delivery', itemId: 'life-essence', target: 30, baseReputation: 110, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'deliver-fire-fragments', category: 'delivery', itemId: 'fire-fragment', target: 6, baseReputation: 70, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation' },
  { id: 'deliver-water-fragments', category: 'delivery', itemId: 'water-fragment', target: 6, baseReputation: 70, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation' },
  { id: 'study-research-cycles', category: 'research', target: 3, baseReputation: 90, baseAdvancementPoints: 0, minimumProgressStage: 'research' },
  { id: 'transmute-materials', category: 'transmutation', target: 5, baseReputation: 100, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation' },
  { id: 'produce-fire-fragments', category: 'production', itemId: 'fire-fragment', target: 12, baseReputation: 115, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation', weight: 1.2 },
  { id: 'produce-water-fragments', category: 'production', itemId: 'water-fragment', target: 12, baseReputation: 115, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation', weight: 1.2 },
  { id: 'mixed-ember-study', category: 'mixed', target: 14, baseReputation: 160, baseAdvancementPoints: 0, minimumProgressStage: 'research', weight: 0.7, components: [{ category: 'production', itemId: 'fire-fragment', target: 8 }, { category: 'transmutation', target: 4 }, { category: 'research', target: 2 }] },
]

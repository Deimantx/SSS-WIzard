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
  category: 'supply' | 'channeling' | 'production' | 'research' | 'transmutation' | 'mixed'
  objectives: readonly import('../../types').GuildCommissionObjectiveDefinition[]
  baseReputation: number
  baseAdvancementPoints: number
  minimumProgressStage: 'guild' | 'channeling' | 'research' | 'transmutation'
  weight?: number
  complexity?: 'routine' | 'special' | 'prestigious'
}

export const GUILD_COMMISSION_TEMPLATES: readonly GuildCommissionTemplate[] = [
  { id: 'supply-life-essence', category: 'supply', objectives: [{ kind: 'item-supply', itemId: 'life-essence', target: 10 }], baseReputation: 60, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'supply-earth-resonance', category: 'supply', objectives: [{ kind: 'resonance-supply', resonanceType: 'earth', target: 100 }], baseReputation: 70, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'supply-air-resonance', category: 'supply', objectives: [{ kind: 'resonance-supply', resonanceType: 'air', target: 100 }], baseReputation: 70, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'supply-fire-resonance', category: 'supply', objectives: [{ kind: 'resonance-supply', resonanceType: 'fire', target: 100 }], baseReputation: 70, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'supply-water-resonance', category: 'supply', objectives: [{ kind: 'resonance-supply', resonanceType: 'water', target: 100 }], baseReputation: 70, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'channel-arcane-flux', category: 'channeling', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 250 }], baseReputation: 65, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'transmute-cycle', category: 'transmutation', objectives: [{ kind: 'transmutation', target: 3 }], baseReputation: 80, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'produce-fire-fragments', category: 'production', objectives: [{ kind: 'production', itemId: 'fire-fragment', target: 8 }], baseReputation: 85, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'produce-water-fragments', category: 'production', objectives: [{ kind: 'production', itemId: 'water-fragment', target: 8 }], baseReputation: 85, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'produce-earth-fragments', category: 'production', objectives: [{ kind: 'production', itemId: 'earth-fragment', target: 8 }], baseReputation: 85, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'produce-air-fragments', category: 'production', objectives: [{ kind: 'production', itemId: 'air-fragment', target: 8 }], baseReputation: 85, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'study-research-cycles', category: 'research', objectives: [{ kind: 'research', target: 2 }], baseReputation: 90, baseAdvancementPoints: 0, minimumProgressStage: 'research' },
  { id: 'special-ember-supply', category: 'mixed', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 160 }, { kind: 'production', itemId: 'fire-fragment', target: 6 }], baseReputation: 165, baseAdvancementPoints: 0, minimumProgressStage: 'guild', complexity: 'special' },
  { id: 'special-tidal-research', category: 'mixed', objectives: [{ kind: 'research', target: 2 }, { kind: 'production', itemId: 'water-fragment', target: 5 }], baseReputation: 175, baseAdvancementPoints: 0, minimumProgressStage: 'research', complexity: 'special' },
  { id: 'special-earth-reserves', category: 'mixed', objectives: [{ kind: 'resonance-supply', resonanceType: 'earth', target: 80 }, { kind: 'transmutation', target: 2 }], baseReputation: 170, baseAdvancementPoints: 0, minimumProgressStage: 'guild', complexity: 'special' },
  { id: 'special-water-conversion', category: 'mixed', objectives: [{ kind: 'transmutation', target: 3 }, { kind: 'production', itemId: 'water-fragment', target: 5 }], baseReputation: 180, baseAdvancementPoints: 0, minimumProgressStage: 'guild', complexity: 'special' },
  { id: 'prestige-ember-research', category: 'mixed', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 320 }, { kind: 'production', itemId: 'fire-fragment', target: 10 }, { kind: 'research', target: 3 }], baseReputation: 260, baseAdvancementPoints: 0, minimumProgressStage: 'research', complexity: 'prestigious' },
  { id: 'prestige-field-study', category: 'mixed', objectives: [{ kind: 'research', target: 3 }, { kind: 'production', itemId: 'water-fragment', target: 8 }, { kind: 'resonance-supply', resonanceType: 'water', target: 120 }], baseReputation: 275, baseAdvancementPoints: 0, minimumProgressStage: 'research', complexity: 'prestigious' },
  { id: 'prestige-leyline-practice', category: 'mixed', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 300 }, { kind: 'transmutation', target: 4 }, { kind: 'production', itemId: 'air-fragment', target: 8 }], baseReputation: 280, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation', complexity: 'prestigious' },
]

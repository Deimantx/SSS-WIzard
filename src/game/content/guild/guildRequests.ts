import type { CombatLocationId, GuildRequestKind, ItemId, MonsterId } from '../../types'
import type { GuildStandingId } from './guildStandings'

export interface GuildRequestDefinition {
  id: string
  name: string
  description: string
  kind: GuildRequestKind
  target: number
  reputation: number
  guildPoints: number
  itemId?: ItemId
  locationId?: CombatLocationId
  monsterId?: MonsterId
  bossId?: MonsterId
}

export const GUILD_REQUESTS = {
  'field-supplies': { id: 'field-supplies', name: 'Materials for the Archive', description: 'Deliver 25 Life Essence to replenish the Guild archive wards.', kind: 'donation', itemId: 'life-essence', target: 25, reputation: 50, guildPoints: 0 },
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
  minimumStandingId: GuildStandingId
  objectives: readonly import('../../types').GuildCommissionObjectiveDefinition[]
  baseReputation: number
  baseAdvancementPoints: number
  minimumProgressStage: 'guild' | 'channeling' | 'research' | 'transmutation'
  weight?: number
  complexity?: 'routine' | 'special' | 'prestigious'
}

const authoredGuildCommissionTemplates = [
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
  { id: 'prestige-ember-research', category: 'mixed', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 320 }, { kind: 'production', itemId: 'fire-fragment', target: 10 }, { kind: 'research', target: 3 }], baseReputation: 260, baseAdvancementPoints: 0, minimumProgressStage: 'research', complexity: 'prestigious' },
  { id: 'prestige-field-study', category: 'mixed', objectives: [{ kind: 'research', target: 3 }, { kind: 'production', itemId: 'water-fragment', target: 8 }, { kind: 'resonance-supply', resonanceType: 'water', target: 120 }], baseReputation: 275, baseAdvancementPoints: 0, minimumProgressStage: 'research', complexity: 'prestigious' },
  { id: 'prestige-leyline-practice', category: 'mixed', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 300 }, { kind: 'transmutation', target: 4 }, { kind: 'production', itemId: 'air-fragment', target: 8 }], baseReputation: 280, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation', complexity: 'prestigious' },
  { id: 'supply-prismatic-stock', category: 'supply', objectives: [{ kind: 'item-supply', itemId: 'prismatic-fragment', target: 3 }], baseReputation: 110, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation', complexity: 'special' },
  { id: 'channel-leyline-current', category: 'channeling', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 420 }], baseReputation: 105, baseAdvancementPoints: 0, minimumProgressStage: 'channeling' },
  { id: 'channel-echo-reserve', category: 'channeling', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 700 }], baseReputation: 155, baseAdvancementPoints: 0, minimumProgressStage: 'channeling', complexity: 'special' },
  { id: 'channel-grand-conduit', category: 'channeling', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 1200 }], baseReputation: 280, baseAdvancementPoints: 0, minimumProgressStage: 'channeling', complexity: 'prestigious' },
  { id: 'channel-resonant-watch', category: 'channeling', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 950 }], baseReputation: 230, baseAdvancementPoints: 0, minimumProgressStage: 'channeling', complexity: 'special' },
  { id: 'channel-tower-ledger', category: 'channeling', objectives: [{ kind: 'channeling', metric: 'arcane-flux', target: 1600 }], baseReputation: 340, baseAdvancementPoints: 0, minimumProgressStage: 'channeling', complexity: 'prestigious' },
  { id: 'transmute-elemental-ledger', category: 'transmutation', objectives: [{ kind: 'transmutation', recipeId: 'fire-fragment', target: 5 }], baseReputation: 120, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation' },
  { id: 'transmute-prismatic-cycles', category: 'transmutation', objectives: [{ kind: 'transmutation', recipeId: 'prismatic-fragment', target: 2 }], baseReputation: 240, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation', complexity: 'special' },
  { id: 'transmute-refined-series', category: 'transmutation', objectives: [{ kind: 'transmutation', recipeId: 'prismatic-fragment', target: 4 }], baseReputation: 265, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation', complexity: 'special' },
  { id: 'transmute-master-array', category: 'transmutation', objectives: [{ kind: 'transmutation', recipeId: 'prismatic-fragment', target: 5 }], baseReputation: 430, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation', complexity: 'prestigious' },
  { id: 'transmute-essence-cycle', category: 'transmutation', objectives: [{ kind: 'transmutation', recipeId: 'water-fragment', target: 6 }], baseReputation: 220, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation' },
  { id: 'produce-refined-fragments', category: 'production', objectives: [{ kind: 'production', itemId: 'prismatic-fragment', target: 3 }], baseReputation: 230, baseAdvancementPoints: 0, minimumProgressStage: 'transmutation', complexity: 'special' },
  { id: 'produce-field-catalysts', category: 'production', objectives: [{ kind: 'production', itemId: 'artifact-essence', target: 10 }], baseReputation: 140, baseAdvancementPoints: 0, minimumProgressStage: 'guild' },
  { id: 'research-elemental-record', category: 'research', objectives: [{ kind: 'research', schoolId: 'fire', target: 3 }], baseReputation: 145, baseAdvancementPoints: 0, minimumProgressStage: 'research' },
  { id: 'research-tidal-record', category: 'research', objectives: [{ kind: 'research', schoolId: 'water', target: 4 }], baseReputation: 165, baseAdvancementPoints: 0, minimumProgressStage: 'research' },
  { id: 'research-earthen-record', category: 'research', objectives: [{ kind: 'research', schoolId: 'earth', target: 5 }], baseReputation: 190, baseAdvancementPoints: 0, minimumProgressStage: 'research' },
  { id: 'research-aeric-record', category: 'research', objectives: [{ kind: 'research', schoolId: 'air', target: 6 }], baseReputation: 220, baseAdvancementPoints: 0, minimumProgressStage: 'research', complexity: 'special' },
  { id: 'research-grand-review', category: 'research', objectives: [{ kind: 'research', target: 12 }], baseReputation: 420, baseAdvancementPoints: 0, minimumProgressStage: 'research', complexity: 'prestigious' },
] as const

const commissionMinimumStandingById: Record<(typeof authoredGuildCommissionTemplates)[number]['id'], GuildStandingId> = {
  'supply-life-essence': 'initiate-1', 'supply-earth-resonance': 'initiate-1', 'supply-air-resonance': 'initiate-1', 'supply-fire-resonance': 'initiate-1',
  'supply-water-resonance': 'initiate-1', 'channel-arcane-flux': 'initiate-1', 'transmute-cycle': 'initiate-1', 'produce-fire-fragments': 'initiate-1',
  'produce-water-fragments': 'initiate-1',
  'produce-earth-fragments': 'initiate-1', 'produce-air-fragments': 'initiate-1', 'study-research-cycles': 'initiate-1', 'special-ember-supply': 'initiate-2',
  'special-tidal-research': 'initiate-3', 'special-earth-reserves': 'initiate-4', 'prestige-ember-research': 'initiate-5', 'prestige-field-study': 'apprentice-1',
  'prestige-leyline-practice': 'apprentice-2', 'supply-prismatic-stock': 'apprentice-3', 'channel-leyline-current': 'apprentice-4', 'channel-echo-reserve': 'apprentice-5',
  'channel-grand-conduit': 'adept-1', 'channel-resonant-watch': 'adept-2', 'channel-tower-ledger': 'adept-3', 'transmute-elemental-ledger': 'adept-4',
  'transmute-prismatic-cycles': 'adept-5', 'transmute-refined-series': 'magister-1', 'transmute-master-array': 'magister-2', 'transmute-essence-cycle': 'magister-3',
  'produce-refined-fragments': 'magister-4', 'produce-field-catalysts': 'magister-5', 'research-elemental-record': 'circle-master-1', 'research-tidal-record': 'circle-master-2',
  'research-earthen-record': 'circle-master-3', 'research-aeric-record': 'circle-master-4', 'research-grand-review': 'circle-master-5',
}
export const GUILD_COMMISSION_TEMPLATES: readonly GuildCommissionTemplate[] = authoredGuildCommissionTemplates.map((template) => ({
  ...template,
  minimumStandingId: commissionMinimumStandingById[template.id],
}))

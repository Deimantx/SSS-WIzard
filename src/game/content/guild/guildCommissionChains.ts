import type { GuildRankId, ItemId } from '../../types'
import type { GuildStandingId } from './guildStandings'
export interface GuildCommissionChainDefinition {
  id: string; name: string; description: string; minimumRank: GuildRankId; minimumStandingId: GuildStandingId
  stages: readonly ({ category: 'delivery' | 'production'; itemId: ItemId; target: number } | { category: 'research' | 'transmutation'; target: number })[]
  reputationReward: number; repeatReputationReward: number; advancementPointsReward: number
}
const defaultStudyStanding: Record<GuildRankId, GuildStandingId> = { outsider: 'initiate-1', initiate: 'initiate-3', apprentice: 'apprentice-2', adept: 'adept-2', magister: 'magister-2', 'circle-master': 'circle-master-1' }
const study = (id: string, name: string, description: string, minimumRank: GuildRankId, stages: GuildCommissionChainDefinition['stages'], reputationReward: number): GuildCommissionChainDefinition => ({ id, name, description, minimumRank, minimumStandingId: defaultStudyStanding[minimumRank], stages, reputationReward, repeatReputationReward: Math.round(reputationReward * .65), advancementPointsReward: 1 })

/** Persisted chain IDs are retained; these records are presented as Guild Studies. */
const authoredGuildStudies = [
  { ...study('study-ember-resonance', 'Study of Ember Resonance', 'A staged study linking elemental delivery, Transmutation, and Research.', 'initiate', [{ category: 'delivery', itemId: 'fire-fragment', target: 8 }, { category: 'transmutation', target: 3 }, { category: 'research', target: 2 }], 360), repeatReputationReward: 240 },
  { ...study('stable-leyline-survey', 'Stable Leyline Survey', 'Survey Air and Earth resonance through study, conversion, and careful contribution.', 'apprentice', [{ category: 'research', target: 3 }, { category: 'transmutation', target: 4 }, { category: 'delivery', itemId: 'earth-fragment', target: 10 }], 420), repeatReputationReward: 280 },
  { ...study('prismatic-synthesis', 'Prismatic Synthesis', 'A senior study combining advanced materials, productive arrays, and Research.', 'adept', [{ category: 'delivery', itemId: 'prismatic-fragment', target: 5 }, { category: 'production', itemId: 'water-fragment', target: 12 }, { category: 'transmutation', target: 6 }, { category: 'research', target: 4 }], 600), repeatReputationReward: 400 },
  study('study-fourfold-method', 'Tidal Resonance Calibration', 'Complete a focused cycle in every elemental discipline.', 'initiate', [{ category: 'research', target: 2 }, { category: 'delivery', itemId: 'air-fragment', target: 8 }, { category: 'transmutation', target: 3 }], 300),
  study('study-tidal-archive', 'Earthen Matrix Survey', 'Pair Water research with a supply contribution and production run.', 'initiate', [{ category: 'delivery', itemId: 'water-fragment', target: 10 }, { category: 'research', target: 3 }, { category: 'production', itemId: 'water-fragment', target: 8 }], 320),
  study('study-stone-and-ink', 'Aeric Harmonics', 'Record Earth materials through study and array work.', 'apprentice', [{ category: 'research', target: 4 }, { category: 'delivery', itemId: 'earth-fragment', target: 12 }, { category: 'transmutation', target: 4 }], 420),
  study('study-aeric-currents', 'Fourfold Resonance Study', 'Map the interaction between Air research and Transmutation.', 'apprentice', [{ category: 'transmutation', target: 5 }, { category: 'research', target: 4 }], 440),
  study('study-living-essence', 'Fragment Logistics Review', 'Compare field essence with tower-produced materials.', 'apprentice', [{ category: 'delivery', itemId: 'life-essence', target: 10 }, { category: 'production', itemId: 'fire-fragment', target: 10 }, { category: 'research', target: 4 }], 460),
  study('study-refined-catalysts', 'Research Throughput Audit', 'Review refined catalysts through research and repeatable array cycles.', 'adept', [{ category: 'delivery', itemId: 'artifact-essence', target: 12 }, { category: 'transmutation', target: 6 }, { category: 'research', target: 5 }], 580),
  study('study-prismatic-analysis', 'Transmutation Yield Study', 'A measured investigation of prismatic synthesis.', 'adept', [{ category: 'delivery', itemId: 'prismatic-fragment', target: 8 }, { category: 'research', target: 6 }, { category: 'transmutation', target: 6 }], 620),
  study('study-crystal-resonance', 'Leyline Stability Trial', 'Examine a cache through production and elemental conversion.', 'adept', [{ category: 'production', itemId: 'earth-fragment', target: 14 }, { category: 'transmutation', target: 7 }, { category: 'research', target: 5 }], 640),
  study('study-guardian-records', 'Cross-Discipline Methods', 'Connect field records to advanced tower study.', 'magister', [{ category: 'delivery', itemId: 'life-essence', target: 18 }, { category: 'research', target: 7 }, { category: 'transmutation', target: 8 }], 760),
  study('study-sealed-vectors', 'Prismatic Materials Thesis', 'Study a rare catalyst pattern and reproduce it in the arrays.', 'magister', [{ category: 'delivery', itemId: 'black-portal-shard', target: 5 }, { category: 'transmutation', target: 9 }, { category: 'research', target: 8 }], 820),
  study('study-grand-confluence', 'Senior Synthesis Practicum', 'A master-level synthesis of research, output, and field material.', 'circle-master', [{ category: 'research', target: 10 }, { category: 'production', itemId: 'prismatic-fragment', target: 10 }, { category: 'transmutation', target: 10 }], 1000),
  study('study-arcane-index', 'Grand Magister Capstone', 'Complete the Guild’s final cross-discipline review.', 'circle-master', [{ category: 'delivery', itemId: 'artifact-essence', target: 25 }, { category: 'research', target: 10 }, { category: 'transmutation', target: 12 }, { category: 'production', itemId: 'air-fragment', target: 20 }], 1100),
] as const

const studyStandingByIndex: readonly GuildStandingId[] = [
  'initiate-3', 'initiate-3', 'initiate-3',
  'apprentice-2', 'apprentice-2', 'apprentice-2',
  'adept-2', 'adept-2', 'adept-2', 'adept-2',
  'magister-2', 'magister-2', 'magister-2',
  'circle-master-1', 'circle-master-1',
]
export const GUILD_COMMISSION_CHAINS: readonly GuildCommissionChainDefinition[] = authoredGuildStudies.map((study, index) => ({
  ...study,
  minimumStandingId: studyStandingByIndex[index],
}))

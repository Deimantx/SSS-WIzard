import type { GuildRankId } from '../../types'

export interface GuildStandingDefinition {
  id: `${GuildRankId}-${1 | 2 | 3 | 4 | 5}`
  rankId: GuildRankId
  grade: 1 | 2 | 3 | 4 | 5
  name: string
  reputation: number
  unlock: string
}
export type GuildStandingId = GuildStandingDefinition['id']

const grades = [
  { rankId: 'initiate', name: 'Initiate', thresholds: [0, 250, 500, 750, 1000], unlocks: ['Guild entry and Routine commissions', 'Measured Inquiry program', 'Peer Review program', 'Structured Methodology program', 'Archive Cross-Reference program'] },
  { rankId: 'apprentice', name: 'Apprentice', thresholds: [1500, 2200, 2900, 3600, 4300], unlocks: ['Faculty Mentorship program', 'Scholarly Discipline program', 'Efficient Arrays program', 'Resonance Handling program', 'Stable Catalysis program'] },
  { rankId: 'adept', name: 'Adept', thresholds: [5200, 6500, 7800, 9100, 10400], unlocks: ['Production Discipline program', 'Conversion Discipline program', 'Precision Arrays program', 'Leyline Assistance program', 'Flux Reservoir Methods program'] },
  { rankId: 'magister', name: 'Arcanist', thresholds: [12000, 14500, 17000, 19500, 22000], unlocks: ['Channeling Rota program', 'Acolyte Coordination program', 'Tower Scheduling program', 'Channeling Faculty program', 'Faculty Letters program'] },
  { rankId: 'circle-master', name: 'Grand Magister', thresholds: [25000, 31000, 37000, 44000, 52000], unlocks: ['Efficient Delivery program', 'Registry Stewardship program', 'Project Logistics program', 'Study Coordination program', 'Commission Office Practice program'] },
] as const

export const GUILD_STANDINGS: readonly GuildStandingDefinition[] = grades.flatMap(({ rankId, name, thresholds, unlocks }) =>
  thresholds.map((reputation, index) => ({
    id: `${rankId}-${index + 1}` as GuildStandingDefinition['id'], rankId, grade: (index + 1) as GuildStandingDefinition['grade'],
    name: `${name} ${['I', 'II', 'III', 'IV', 'V'][index]}`, reputation, unlock: unlocks[index],
  })),
)

export const GUILD_STANDING_CAP = GUILD_STANDINGS[GUILD_STANDINGS.length - 1].reputation
export const getGuildStanding = (reputation: number) => {
  const amount = Math.max(0, Math.floor(Number.isFinite(reputation) ? reputation : 0))
  return [...GUILD_STANDINGS].reverse().find((standing) => amount >= standing.reputation) ?? GUILD_STANDINGS[0]
}
export const isGuildStandingAtLeast = (reputation: number, requiredStandingId: GuildStandingId) => {
  const required = GUILD_STANDINGS.find((standing) => standing.id === requiredStandingId)
  return Boolean(required && Math.max(0, Math.floor(Number.isFinite(reputation) ? reputation : 0)) >= required.reputation)
}

export const GUILD_MACRO_RANK_THRESHOLDS: Record<GuildRankId, number> = {
  outsider: 0, initiate: 0, apprentice: 1500, adept: 5200, magister: 12000, 'circle-master': 25000,
}

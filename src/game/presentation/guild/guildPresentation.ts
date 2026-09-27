import { GUILD_REQUESTS, GUILD_REQUEST_IDS, type GuildRequestId } from '../../content/guild/guildRequests'
import { GUILD_SKILL_NODES, type GuildSkillBranch } from '../../content/guild/guildSkills'
import { getGuildContractClaimCount, getGuildPointsSpent, getGuildRequestProgress, getGuildPromotionProgress, isGuildRequestComplete } from '../../systems/guild/guildSelectors'
import type { GameState, GuildRankId } from '../../types'

export const GUILD_REQUEST_KIND_LABELS = {
  donation: 'Supply',
  'dungeon-kills': 'Hunt',
  'monster-kills': 'Bounty',
  'boss-kill': 'Expedition',
} as const

export const GUILD_BRANCH_PRESENTATION: Record<GuildSkillBranch, { label: string; subtitle: string; accent: string }> = {
  hunter: { label: 'Hunter', subtitle: 'Field rewards and combat resonance', accent: 'violet' },
  quartermaster: { label: 'Quartermaster', subtitle: 'Essence and cache efficiency', accent: 'gold' },
  tower: { label: 'Tower', subtitle: 'Flux, crafting, and Acolyte capacity', accent: 'green' },
}

export const GUILD_RANK_LABELS: Record<GuildRankId, string> = {
  outsider: 'Outsider',
  initiate: 'Initiate',
  apprentice: 'Apprentice',
  adept: 'Adept',
  magister: 'Magister',
  'circle-master': 'Circle Master',
}

export const getGuildRequestPresentation = (state: Pick<GameState, 'progress'>, requestId: GuildRequestId) => {
  const request = GUILD_REQUESTS[requestId]
  const value = getGuildRequestProgress(state, requestId)
  const complete = isGuildRequestComplete(state, requestId)
  const claimed = Boolean(state.progress.requestClaims[requestId])
  return {
    request,
    value,
    complete,
    claimed,
    remaining: Math.max(0, request.target - value),
    percent: Math.min(100, value / Math.max(1, request.target) * 100),
  }
}

export const getGuildRecommendedRequestIds = (state: Pick<GameState, 'progress'>): GuildRequestId[] => {
  const incomplete = GUILD_REQUEST_IDS.filter((requestId) => !getGuildRequestPresentation(state, requestId).claimed)
  const pool = incomplete.length > 0 ? incomplete : GUILD_REQUEST_IDS
  return [...pool].sort((left, right) => {
    const a = getGuildRequestPresentation(state, left)
    const b = getGuildRequestPresentation(state, right)
    if (a.complete !== b.complete) return a.complete ? -1 : 1
    return b.percent - a.percent
  }).slice(0, 2)
}

export const getGuildRankProgressPresentation = (state: Pick<GameState, 'progress'>) => {
  const promotion = getGuildPromotionProgress(state)
  const requirementsComplete = promotion.requirements.filter((requirement) => requirement.complete).length
  return {
    promotion,
    status: promotion.nextRank ? promotion.eligible ? 'ready' as const : 'locked' as const : 'highest' as const,
    requirementsComplete,
    requirementCount: promotion.requirements.length,
    contractClaims: getGuildContractClaimCount(state),
    pointsSpent: getGuildPointsSpent(state),
  }
}

export const getGuildSkillNodePresentation = (state: Pick<GameState, 'progress'>, nodeId: keyof typeof GUILD_SKILL_NODES) => {
  const node = GUILD_SKILL_NODES[nodeId]
  const purchased = Boolean(state.progress.guildSkillNodeRanks[node.id])
  return { node, purchased }
}

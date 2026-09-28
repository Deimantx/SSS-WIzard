import { GUILD_REQUESTS, GUILD_REQUEST_IDS, type GuildRequestId } from '../../content/guild/guildRequests'
import { GUILD_SKILL_NODES, type GuildSkillBranch } from '../../content/guild/guildSkills'
import { ITEMS } from '../../content/items/items'
import { getGuildContractClaimCount, getGuildPointsSpent, getGuildRequestProgress, getGuildPromotionProgress, isGuildRequestComplete } from '../../systems/guild/guildSelectors'
import type { GameState, GuildRankId } from '../../types'
import type { GuildCommissionState } from '../../types'

export const formatGuildCommissionObjective = (commission: GuildCommissionState): string => {
  if (commission.category === 'mixed') return commission.components?.map((component) => {
    const item = component.itemId ? ` ${ITEMS[component.itemId]?.name ?? component.itemId}` : ''
    const verb = component.category === 'delivery' ? 'Deliver' : component.category === 'production' ? 'Produce' : component.category === 'research' ? 'Complete Research' : 'Complete Transmutations'
    return `${verb} ${component.target.toLocaleString()}${item}`
  }).join(' + ') || 'Complete a mixed Guild assignment'
  if ((commission.category === 'delivery' || commission.category === 'production') && commission.itemId) {
    const verb = commission.category === 'delivery' ? 'Deliver' : 'Produce'
    return `${verb} ${commission.target.toLocaleString()} ${ITEMS[commission.itemId]?.name ?? commission.itemId}`
  }
  if (commission.category === 'research') return `Complete ${commission.target.toLocaleString()} Research cycles`
  if (commission.category === 'transmutation') return `Complete ${commission.target.toLocaleString()} Transmutations`
  return 'Complete Guild work'
}

export const GUILD_REQUEST_KIND_LABELS = {
  donation: 'Supply',
  'dungeon-kills': 'Hunt',
  'monster-kills': 'Bounty',
  'boss-kill': 'Expedition',
} as const

export const GUILD_BRANCH_PRESENTATION: Record<GuildSkillBranch, { label: string; subtitle: string; accent: string }> = {
  hunter: { label: 'Research', subtitle: 'Study, insight, and Guild standing', accent: 'violet' },
  quartermaster: { label: 'Transmutation', subtitle: 'Resonance and magical production', accent: 'gold' },
  tower: { label: 'Guild Operations', subtitle: 'Flux, services, and Acolyte support', accent: 'green' },
  milestones: { label: 'Major Standing', subtitle: 'Unlock larger Guild privileges as investment grows', accent: 'gold' },
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

export const getGuildSkillBranchProgress = (state: Pick<GameState, 'progress'>, branch: GuildSkillBranch) => {
  const nodes = Object.values(GUILD_SKILL_NODES).filter((node) => node.branch === branch)
  return {
    purchased: nodes.filter((node) => Boolean(state.progress.guildSkillNodeRanks[node.id])).length,
    total: nodes.length,
  }
}

export const getGuildSkillNodePresentation = (state: Pick<GameState, 'progress'>, nodeId: keyof typeof GUILD_SKILL_NODES) => {
  const node = GUILD_SKILL_NODES[nodeId]
  const rank = Math.max(0, Math.min(node.maxRank, state.progress.guildSkillNodeRanks[node.id] ?? 0))
  return { node, rank, purchased: rank > 0, capped: rank >= node.maxRank }
}

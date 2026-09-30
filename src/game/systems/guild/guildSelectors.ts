import { GUILD_REQUESTS, LEGACY_GUILD_REQUESTS, type GuildRequestId } from '../../content/guild/guildRequests'
import { GUILD_RANKS, GUILD_RANK_BY_ID, type GuildRankDefinition } from '../../content/guild/guildRanks'
import { GUILD_SKILL_NODES, GUILD_REGULAR_PROGRAM_IDS, GUILD_MAJOR_PROGRAM_IDS, type GuildSkillNodeDefinition } from '../../content/guild/guildSkills'
import { GUILD_PROJECTS } from '../../content/guild/guildProjects'
import { ARCANE_REGISTRY_SETS } from '../../content/guild/registry/registrySets'
import { GUILD_COMMISSION_CHAINS } from '../../content/guild/guildCommissionChains'
import { GUILD_STANDINGS, GUILD_MACRO_RANK_THRESHOLDS, getGuildStanding } from '../../content/guild/guildStandings'
import { isGuildStandingAtLeast } from '../../content/guild/guildStandings'
import type { GameState, GuildRankId, GuildSkillNodeId } from '../../types'

const rankOrder: GuildRankId[] = ['outsider', 'initiate', 'apprentice', 'adept', 'magister', 'circle-master']
const rankAtLeast = (current: GuildRankId, required: GuildRankId) => rankOrder.indexOf(current) >= rankOrder.indexOf(required)
const nodePurchased = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId) => (state.progress.guildSkillNodeRanks[nodeId] ?? 0) > 0
const rankValue = (state: Pick<GameState, 'progress'>, id: GuildSkillNodeId) => Math.max(0, Math.min(GUILD_SKILL_NODES[id]?.maxRank ?? 0, Math.floor(state.progress.guildSkillNodeRanks[id] ?? 0)))
const hasMajor = (state: Pick<GameState, 'progress'>, id: GuildSkillNodeId) => rankValue(state, id) > 0

export interface GuildProgressionBonuses {
  combatArcanePointMultiplier: number; combatResonanceMultiplier: number; lifeEssenceMultiplier: number; artifactEssenceMultiplier: number; bossEssenceMultiplier: number; crystalCacheChanceMultiplier: number
  researchSpeedMultiplier: number; researchXpMultiplier: number; guildReputationMultiplier: number; transmutationOutputChance: number; arcaneFluxMultiplier: number; transmutationSpeedMultiplier: number
  bonusAcolytes: number; commissionChoiceBonus: number; deliveryQuantityMultiplier: number; specialCommissionAccess: boolean
  transmutationResonanceCostMultiplier: number; arcaneFluxCapacityMultiplier: number; channelingOutputMultiplier: number
  registryQuantityMultiplier: number; projectMaterialMultiplier: number; repeatStudyReputationMultiplier: number
  commissionReputationByCategory: Record<string, number>
}

export const getGuildProgressionBonuses = (state: Pick<GameState, 'progress'>): GuildProgressionBonuses => {
  const ranks = state.progress.guildSkillNodeRanks
  const majorEfficiency = hasMajor(state, 'major-arcane-efficiency') ? 0.02 : 0
  const coordination = hasMajor(state, 'major-coordination') ? 0.02 : 0
  const grandStanding = hasMajor(state, 'major-grand-standing') ? 0.03 : 0
  const projectBonus = (type: NonNullable<(typeof GUILD_PROJECTS)[number]['effect']>['type']) => GUILD_PROJECTS.reduce((sum, project) => state.progress.arcaneGuild.completedProjectIds.includes(project.id) && project.effect?.type === type ? sum + project.effect.amount : sum, 0)
  const researchSpeed = rankValue(state, 'scholarship-measured-inquiry') * .0075 + rankValue(state, 'scholarship-structured-methodology') * .005 + rankValue(state, 'scholarship-scholarly-discipline') * .005 + rankValue(state, 'tower-acolyte-coordination') * .005 + rankValue(state, 'tower-scheduling') * .005
  const transmutationSpeed = rankValue(state, 'transmutation-efficient-arrays') * .01 + rankValue(state, 'transmutation-precision-arrays') * .005 + rankValue(state, 'tower-acolyte-coordination') * .005 + rankValue(state, 'tower-scheduling') * .005
  const flux = rankValue(state, 'tower-leyline-assistance-v4') * .01 + rankValue(state, 'tower-scheduling') * .005
  const reputation = rankValue(state, 'service-faculty-letters') * .01 + grandStanding + projectBonus('guild-reputation')
  const oldResearch = rankValue(state, 'hunter-arcane-quarry') * .005 + rankValue(state, 'tower-efficient-arrays') * .005
  const oldXp = rankValue(state, 'hunter-resonant-pursuit') * .01 + rankValue(state, 'guild-peer-review') * .01
  const oldTransmutationSpeed = rankValue(state, 'quartermaster-relic-appraisal') * .01 + rankValue(state, 'quartermaster-cache-appraisal') * .01 + rankValue(state, 'guild-resonance-etching') * .01
  const oldFlux = rankValue(state, 'tower-leyline-assistance') * .01 + rankValue(state, 'guild-calibrated-rota') * .01
  return {
    combatArcanePointMultiplier: 1, combatResonanceMultiplier: 1, lifeEssenceMultiplier: 1, artifactEssenceMultiplier: 1, bossEssenceMultiplier: 1, crystalCacheChanceMultiplier: 1,
    researchSpeedMultiplier: 1 + researchSpeed + oldResearch + majorEfficiency + coordination + projectBonus('research-speed'),
    researchXpMultiplier: 1 + rankValue(state, 'scholarship-peer-review') * .015 + rankValue(state, 'scholarship-structured-methodology') * .005 + rankValue(state, 'scholarship-scholarly-discipline') * .01 + oldXp + projectBonus('research-xp'),
    guildReputationMultiplier: 1 + reputation + rankValue(state, 'hunter-trophy-hunter') * .01,
    transmutationOutputChance: Math.min(.25, rankValue(state, 'transmutation-resonance-handling') * .01 + rankValue(state, 'transmutation-precision-arrays') * .005 + rankValue(state, 'quartermaster-careful-harvest') * .01 + projectBonus('transmutation-output')),
    arcaneFluxMultiplier: 1 + flux + oldFlux + grandStanding + (hasMajor(state, 'major-coordination') ? .02 : 0),
    transmutationSpeedMultiplier: 1 + transmutationSpeed + oldTransmutationSpeed + majorEfficiency + coordination + projectBonus('transmutation-speed'),
    bonusAcolytes: rankValue(state, 'major-expanded-quarters') + rankValue(state, 'tower-expanded-quarters') + projectBonus('acolyte-capacity'),
    commissionChoiceBonus: Math.min(3, (hasMajor(state, 'major-favored-contractor') ? 1 : 0) + projectBonus('commission-choice')),
    deliveryQuantityMultiplier: Math.max(.8, 1 - rankValue(state, 'service-efficient-delivery') * .01 - (hasMajor(state, 'major-efficient-procurement') ? .05 : 0)),
    specialCommissionAccess: hasMajor(state, 'major-guild-connections'),
    transmutationResonanceCostMultiplier: Math.max(.5, 1 - rankValue(state, 'transmutation-stable-catalysis') * .01 - projectBonus('transmutation-cost')),
    arcaneFluxCapacityMultiplier: 1 + rankValue(state, 'tower-flux-reservoir-methods') * .02 + projectBonus('arcane-flux-capacity'),
    channelingOutputMultiplier: 1 + rankValue(state, 'tower-channeling-rota') * .01,
    registryQuantityMultiplier: Math.max(.2, 1 - rankValue(state, 'service-registry-stewardship') * .05 - projectBonus('registry-cost')),
    projectMaterialMultiplier: Math.max(.8, 1 - rankValue(state, 'service-project-logistics') * .02 - (hasMajor(state, 'major-project-stewardship') ? .05 : 0)),
    repeatStudyReputationMultiplier: 1 + rankValue(state, 'service-study-coordination') * .02,
    commissionReputationByCategory: {
      research: 1 + rankValue(state, 'scholarship-faculty-mentorship') * .01,
      production: 1 + rankValue(state, 'transmutation-production-discipline') * .01,
      transmutation: 1 + rankValue(state, 'transmutation-conversion-discipline') * .01,
      channeling: 1 + rankValue(state, 'tower-channeling-faculty') * .01,
      mixed: 1 + rankValue(state, 'service-commission-office-practice') * .01,
    },
  }
}

export const getGuildPointsSpent = (state: Pick<GameState, 'progress'>) => GUILD_SKILL_NODE_IDS.filter((id) => !GUILD_SKILL_NODES[id].legacy).reduce((sum, id) => sum + rankValue(state, id), 0)
import { GUILD_SKILL_NODE_IDS } from '../../content/guild/guildSkills'
export const getGuildPointsAvailable = (state: Pick<GameState, 'progress'>) => Math.max(0, Math.floor(state.progress.guildPointsEarned) - getGuildPointsSpent(state))
export const getGuildAdvancementPointEconomy = () => {
  const regularCost = GUILD_REGULAR_PROGRAM_IDS.reduce((sum, id) => sum + GUILD_SKILL_NODES[id].maxRank, 0)
  const majorCost = GUILD_MAJOR_PROGRAM_IDS.length
  const totalBoardPointCost = regularCost + majorCost
  const promotionPoints = GUILD_RANKS.reduce((sum, rank) => sum + (rank.promotionGuildPointReward ?? 0), 0)
  const registryPointsTotal = ARCANE_REGISTRY_SETS.reduce((sum, set) => sum + set.advancementPointsReward, 0)
  const projectPointsTotal = GUILD_PROJECTS.reduce((sum, project) => sum + project.advancementPointsReward, 0)
  const studyPointsTotal = GUILD_COMMISSION_CHAINS.reduce((sum, study) => sum + study.advancementPointsReward, 0)
  const pointsByRank = Object.fromEntries(GUILD_RANKS.map((rank) => {
    const rankPoints = GUILD_RANKS.filter((entry) => entry.order <= rank.order).reduce((sum, entry) => sum + (entry.promotionGuildPointReward ?? 0), 0)
    const setRankByIndex = (index: number): number => index < 5 ? 1 : index < 10 ? 2 : index < 15 ? 3 : 4
    const registryPoints = ARCANE_REGISTRY_SETS.reduce((sum, set, index) => sum + (setRankByIndex(index) <= rank.order ? set.advancementPointsReward : 0), 0)
    const projectPoints = GUILD_PROJECTS.filter((project) => rankOrder.indexOf(project.minimumGuildRank) <= rank.order).reduce((sum, project) => sum + project.advancementPointsReward, 0)
    const studyPoints = GUILD_COMMISSION_CHAINS.filter((study) => rankOrder.indexOf(study.minimumRank) <= rank.order).reduce((sum, study) => sum + study.advancementPointsReward, 0)
    return [rank.id, rankPoints + registryPoints + projectPoints + studyPoints]
  })) as Record<GuildRankId, number>
  const maxBoundedPoints = pointsByRank['circle-master']
  const majorThresholds = GUILD_MAJOR_PROGRAM_IDS.map((id) => GUILD_SKILL_NODES[id].requiredInvestedPoints!).sort((a, b) => a - b)
  const majorMilestones = majorThresholds.map((threshold) => ({ threshold, pointsRequired: threshold + 1, reachableAtRank: GUILD_RANKS.find((rank) => pointsByRank[rank.id] >= threshold + 1)?.id ?? null }))
  return { sources: { promotions: promotionPoints, registrySets: registryPointsTotal, projects: projectPointsTotal, studies: studyPointsTotal }, regularCost, majorCost, totalBoardPointCost, maxBoundedPoints, pointsByRank, majorThresholds, majorMilestones, fullyFunded: maxBoundedPoints === totalBoardPointCost }
}

export const getGuildRequestProgress = (state: Pick<GameState, 'progress'>, requestId: GuildRequestId) => Math.max(0, Math.floor(state.progress.requestProgress[requestId] ?? 0))
export const isGuildRequestComplete = (state: Pick<GameState, 'progress'>, requestId: GuildRequestId) => getGuildRequestProgress(state, requestId) >= GUILD_REQUESTS[requestId].target
export const getGuildRankOrder = () => [...rankOrder]
export const isGuildRankAtLeast = (current: GuildRankId, required: GuildRankId) => rankAtLeast(current, required)
export const getGuildStandingProgress = (state: Pick<GameState, 'progress'>) => {
  const current = getGuildStanding(state.progress.guildReputation)
  const index = GUILD_STANDINGS.findIndex((standing) => standing.id === current.id)
  const next = GUILD_STANDINGS[index + 1] ?? null
  return { current, next, reputation: Math.max(0, Math.floor(state.progress.guildReputation)), progress: next ? Math.min(1, (state.progress.guildReputation - current.reputation) / (next.reputation - current.reputation)) : 1 }
}
export const getGuildResearchSpeedMultiplier = (state: Pick<GameState, 'progress'>, itemId?: import('../../types').ItemId) => {
  const bonuses = getGuildProgressionBonuses(state)
  const crossReference = itemId && state.progress.arcaneRegistry.registeredEntries[itemId] ? rankValue(state, 'scholarship-archive-cross-reference') * .01 : 0
  return bonuses.researchSpeedMultiplier + crossReference
}

export const getGuildContractClaimCount = (state: Pick<GameState, 'progress'>) => Object.values(GUILD_REQUESTS).filter((request) => Boolean(state.progress.requestClaims[request.id])).length
export interface GuildPromotionRequirement { id: string; label: string; current: number; target: number; complete: boolean }
export interface GuildPromotionProgress { currentRank: GuildRankDefinition; nextRank: GuildRankDefinition | null; eligible: boolean; requirements: GuildPromotionRequirement[]; contractClaims: number }
export const getGuildPromotionProgress = (state: Pick<GameState, 'progress'>): GuildPromotionProgress => {
  const currentRank = GUILD_RANK_BY_ID[state.progress.guildRank] ?? GUILD_RANKS[0]
  const nextRank = GUILD_RANKS.find((rank) => rank.order === currentRank.order + 1) ?? null
  const promotion = nextRank?.promotion
  const contractClaims = getGuildContractClaimCount(state)
  const requirements: GuildPromotionRequirement[] = []
  if (promotion) {
    requirements.push({ id: 'reputation', label: 'Guild Reputation', current: Math.floor(state.progress.guildReputation), target: promotion.reputation, complete: state.progress.guildReputation >= promotion.reputation })
    if (promotion.requiredContractClaims) requirements.push({ id: 'contract-claims', label: 'Legacy Contract Claims', current: contractClaims, target: promotion.requiredContractClaims, complete: contractClaims >= promotion.requiredContractClaims })
    const milestones = [
      ['commissions', 'Commissions completed', state.progress.arcaneGuild.completedCommissions, promotion.requiredCommissions],
      ['registry-sets', 'Registry Sets completed', state.progress.arcaneRegistry.completedSetIds.length, promotion.requiredRegistrySets],
      ['studies', 'Studies completed', state.progress.arcaneGuild.completedChainIds.length, promotion.requiredStudies],
      ['projects', 'Projects completed', state.progress.arcaneGuild.completedProjectIds.length, promotion.requiredProjects],
    ] as const
    for (const [id, label, current, target] of milestones) if (target) requirements.push({ id, label, current, target, complete: current >= target })
    for (const objectiveId of promotion.requiredChronicleObjectiveIds ?? []) {
      const complete = state.progress.chronicle.completedObjectiveIds.includes(objectiveId)
      requirements.push({ id: `chronicle:${objectiveId}`, label: 'Chronicle milestone', current: complete ? 1 : 0, target: 1, complete })
    }
  }
  return { currentRank, nextRank, eligible: Boolean(nextRank && currentRank.id !== 'outsider' && requirements.every((requirement) => requirement.complete)), requirements, contractClaims }
}

export const canPurchaseGuildSkillNode = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId) => {
  const node = GUILD_SKILL_NODES[nodeId]
  const currentRank = state.progress.guildSkillNodeRanks[nodeId] ?? 0
  if (!node || node.legacy || getGuildPointsAvailable(state) < 1 || currentRank >= node.maxRank) return false
  if (node.minimumStandingId && !isGuildStandingAtLeast(state.progress.guildReputation, node.minimumStandingId)) return false
  if (node.requiredInvestedPoints !== undefined && getGuildPointsSpent(state) < node.requiredInvestedPoints) return false
  if (node.prerequisiteId && !nodePurchased(state, node.prerequisiteId)) return false
  if (node.requiredRank && !rankAtLeast(state.progress.guildRank, node.requiredRank)) return false
  return true
}

export const getGuildStandingForReputation = getGuildStanding
export const getGuildMacroRankThreshold = (rank: GuildRankId) => GUILD_MACRO_RANK_THRESHOLDS[rank]

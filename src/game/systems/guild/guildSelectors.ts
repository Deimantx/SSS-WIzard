import { GUILD_REQUESTS, LEGACY_GUILD_REQUESTS, type GuildRequestId } from '../../content/guild/guildRequests'
import { GUILD_RANKS, GUILD_RANK_BY_ID, type GuildRankDefinition } from '../../content/guild/guildRanks'
import { GUILD_SKILL_NODES, GUILD_REGULAR_PROGRAM_IDS, GUILD_MAJOR_PROGRAM_IDS, type GuildSkillNodeDefinition } from '../../content/guild/guildSkills'
import { GUILD_PROJECTS } from '../../content/guild/guildProjects'
import { ARCANE_REGISTRY_SETS } from '../../content/guild/registry/registrySets'
import { GUILD_COMMISSION_CHAINS } from '../../content/guild/guildCommissionChains'
import { GUILD_STANDINGS, GUILD_MACRO_RANK_THRESHOLDS, getGuildStanding } from '../../content/guild/guildStandings'
import { isGuildStandingAtLeast } from '../../content/guild/guildStandings'
import type { GameState, GuildRankId, GuildSkillNodeId } from '../../types'
import { BALANCE } from '../../core/balance/balance'

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
  const regularEffect = (stat: import('../../content/guild/guildSkills').GuildAdvancementEffectStat) => GUILD_REGULAR_PROGRAM_IDS.reduce((sum, id) => sum + (GUILD_SKILL_NODES[id].effectValues ?? []).reduce((value, entry) => value + (entry.stat === stat ? entry.amount * rankValue(state, id) : 0), 0), 0)
  const majorEffect = (stat: import('../../content/guild/guildSkills').GuildAdvancementEffectStat) => GUILD_MAJOR_PROGRAM_IDS.reduce((sum, id) => sum + (GUILD_SKILL_NODES[id].effectValues ?? []).reduce((value, entry) => value + (entry.stat === stat ? entry.amount * rankValue(state, id) : 0), 0), 0)
  const projectBonus = (type: NonNullable<(typeof GUILD_PROJECTS)[number]['effect']>['type']) => GUILD_PROJECTS.reduce((sum, project) => state.progress.arcaneGuild.completedProjectIds.includes(project.id) && project.effect?.type === type ? sum + project.effect.amount : sum, 0)
  const researchSpeed = regularEffect('research-speed') + majorEffect('research-speed')
  const researchXp = regularEffect('research-xp')
  const transmutationSpeed = regularEffect('transmutation-speed') + majorEffect('transmutation-speed')
  const flux = regularEffect('arcane-flux') + majorEffect('arcane-flux')
  const reputation = regularEffect('guild-reputation') + majorEffect('guild-reputation') + projectBonus('guild-reputation')
  const oldResearch = rankValue(state, 'hunter-arcane-quarry') * .005 + rankValue(state, 'tower-efficient-arrays') * .005
  const oldXp = rankValue(state, 'hunter-resonant-pursuit') * .01 + rankValue(state, 'guild-peer-review') * .01
  const oldTransmutationSpeed = rankValue(state, 'quartermaster-relic-appraisal') * .01 + rankValue(state, 'quartermaster-cache-appraisal') * .01 + rankValue(state, 'guild-resonance-etching') * .01
  const oldFlux = rankValue(state, 'tower-leyline-assistance') * .01 + rankValue(state, 'guild-calibrated-rota') * .01
  return {
    combatArcanePointMultiplier: 1, combatResonanceMultiplier: 1, lifeEssenceMultiplier: 1, artifactEssenceMultiplier: 1, bossEssenceMultiplier: 1, crystalCacheChanceMultiplier: 1,
    researchSpeedMultiplier: 1 + researchSpeed + oldResearch + projectBonus('research-speed'),
    researchXpMultiplier: 1 + researchXp + oldXp + projectBonus('research-xp'),
    guildReputationMultiplier: 1 + reputation + rankValue(state, 'hunter-trophy-hunter') * .01,
    transmutationOutputChance: Math.min(.25, regularEffect('transmutation-output') + projectBonus('transmutation-output') + rankValue(state, 'quartermaster-careful-harvest') * .01),
    arcaneFluxMultiplier: 1 + flux + oldFlux,
    transmutationSpeedMultiplier: 1 + transmutationSpeed + oldTransmutationSpeed + projectBonus('transmutation-speed'),
    bonusAcolytes: majorEffect('bonus-acolyte') + rankValue(state, 'tower-expanded-quarters') + projectBonus('acolyte-capacity'),
    commissionChoiceBonus: Math.min(3, majorEffect('commission-choice') + projectBonus('commission-choice')),
    deliveryQuantityMultiplier: Math.max(.8, 1 - regularEffect('delivery-reduction') - majorEffect('delivery-reduction')),
    specialCommissionAccess: hasMajor(state, 'major-guild-connections'),
    transmutationResonanceCostMultiplier: Math.max(.5, 1 - regularEffect('transmutation-cost-reduction') - projectBonus('transmutation-cost')),
    arcaneFluxCapacityMultiplier: 1 + regularEffect('arcane-flux-capacity') + projectBonus('arcane-flux-capacity'),
    channelingOutputMultiplier: 1 + regularEffect('channeling-output'),
    registryQuantityMultiplier: Math.max(.2, 1 - regularEffect('registry-reduction') - projectBonus('registry-cost')),
    projectMaterialMultiplier: Math.max(.8, 1 - regularEffect('project-reduction') - majorEffect('project-reduction')),
    repeatStudyReputationMultiplier: 1 + regularEffect('repeat-study-reputation'),
    commissionReputationByCategory: {
      research: 1 + regularEffect('research-commission-reputation'),
      production: 1 + regularEffect('production-commission-reputation'),
      transmutation: 1 + regularEffect('transmutation-commission-reputation'),
      channeling: 1 + regularEffect('channeling-commission-reputation'),
      mixed: 1 + regularEffect('mixed-commission-reputation'),
    },
  }
}

export const getGuildCommissionChoiceCount = (state: Pick<GameState, 'progress'>) => {
  const reputation = state.progress.guildReputation
  const apprenticeThreshold = GUILD_STANDINGS.find((standing) => standing.id === 'apprentice-3')!.reputation
  const arcanistThreshold = GUILD_STANDINGS.find((standing) => standing.id === 'magister-3')!.reputation
  const standingChoices = reputation >= arcanistThreshold ? 5 : reputation >= apprenticeThreshold ? 4 : BALANCE.arcaneGuild.baseCommissionChoices
  return Math.min(6, standingChoices + getGuildProgressionBonuses(state).commissionChoiceBonus)
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

import { GUILD_REQUESTS, LEGACY_GUILD_REQUESTS, type GuildRequestId } from '../../content/guild/guildRequests'
import { GUILD_SKILL_NODES } from '../../content/guild/guildSkills'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { pushNotification } from '../../engine'
import { canPurchaseGuildSkillNode, getGuildPromotionProgress } from './guildSelectors'
import { reconcileChronicleProgress } from '../chronicles/chronicleRuntime'
import { ensureGuildCommissionChoices } from './guildCommissions'
import type { DungeonId, GameState, GuildRankId, GuildSkillNodeId, MonsterId } from '../../types'

const safeAmount = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
type LegacyGuildRequestId = keyof typeof LEGACY_GUILD_REQUESTS
const getRequest = (requestId: string) => GUILD_REQUESTS[requestId as GuildRequestId] ?? LEGACY_GUILD_REQUESTS[requestId as LegacyGuildRequestId]

export const getGuildRequestRequiredCount = (state: GameState, requestId: string) => Math.max(0, (getRequest(requestId)?.target ?? 0) - (state.progress.requestProgress[requestId] ?? 0))

export const donateGuildRequest = (state: GameState, requestId: string, amount: number | 'max') => {
  const request = getRequest(requestId)
  if (!request || request.kind !== 'donation' || !state.progress.guildUnlocked || !request.itemId) return false
  const quantity = amount === 'max' ? getGuildRequestRequiredCount(state, requestId) : Math.min(getGuildRequestRequiredCount(state, requestId), safeAmount(amount))
  const available = getConsumableQuantity(state, request.itemId)
  if (quantity < 1 || available < quantity || state.protectedItems[request.itemId]) return false
  state.inventory[request.itemId] = Math.max(0, (state.inventory[request.itemId] ?? 0) - quantity)
  state.progress.requestProgress[requestId] = (state.progress.requestProgress[requestId] ?? 0) + quantity
  return true
}

/** @deprecated Monster-kill progression belongs to Hunter’s Order. */
export const recordGuildEnemyKill = (_state: GameState, _enemyId: MonsterId, _dungeonId: DungeonId, _boss: boolean) => undefined

export const claimGuildRequest = (state: GameState, requestId: string) => {
  const request = getRequest(requestId)
  if (!request || !state.progress.guildUnlocked || state.progress.requestClaims[requestId] || (state.progress.requestProgress[requestId] ?? 0) < request.target) return false
  state.progress.requestClaims[requestId] = true
  state.progress.guildReputation = safeAmount(state.progress.guildReputation) + request.reputation
  state.progress.guildPointsEarned = safeAmount(state.progress.guildPointsEarned) + request.guildPoints
  pushNotification(state, `${request.name} claimed · +${request.reputation} Reputation · +${request.guildPoints} Guild Point`, 'success')
  reconcileChronicleProgress(state)
  return true
}

export const canPromoteGuild = (state: GameState) => getGuildPromotionProgress(state).eligible

export const promoteGuild = (state: GameState) => {
  if (!canPromoteGuild(state)) return false
  const promotion = getGuildPromotionProgress(state)
  if (!promotion.nextRank) return false
  state.progress.guildRank = promotion.nextRank.id
  const reward = promotion.nextRank.promotionGuildPointReward ?? 0
  state.progress.guildPointsEarned = safeAmount(state.progress.guildPointsEarned) + reward
  const legacyPromotion = state.progress.requestClaims['arcane-supply'] || state.progress.requestClaims['clear-the-woods'] || state.progress.requestClaims['sentinel-breaker'] || Object.values(LEGACY_GUILD_REQUESTS).some((request) => (state.progress.requestProgress[request.id] ?? 0) >= request.target)
  if (promotion.nextRank.id === 'apprentice' && legacyPromotion) state.progress.permanentManaBonuses['guild-apprentice'] = Math.max(10, state.progress.permanentManaBonuses['guild-apprentice'] ?? 0)
  pushNotification(state, `Guild rank increased to ${promotion.nextRank.name}${reward ? ` · +${reward} Guild Point${reward === 1 ? '' : 's'}` : ''}`, 'success')
  reconcileChronicleProgress(state)
  return true
}

export const purchaseGuildSkillNode = (state: GameState, nodeId: GuildSkillNodeId, free = false) => {
  if (!GUILD_SKILL_NODES[nodeId] || (!free && !canPurchaseGuildSkillNode(state, nodeId))) return false
  const currentRank = state.progress.guildSkillNodeRanks[nodeId] ?? 0
  if (currentRank >= GUILD_SKILL_NODES[nodeId].maxRank) return false
  if (free) { state.progress.guildSkillNodeRanks[nodeId] = GUILD_SKILL_NODES[nodeId].maxRank; return true }
  state.progress.guildSkillNodeRanks[nodeId] = currentRank + 1
  return true
}

export const resetGuildSkillTree = (state: GameState) => {
  if (state.combat.active) return { ok: false as const, reason: 'Guild Skill Tree can only be reset outside Combat.' }
  const expanded = Boolean(state.progress.guildSkillNodeRanks['tower-expanded-quarters'])
  if (expanded) {
    const assigned = (state.activities.channeling.acolytesAssigned ?? 0) + Object.values(state.activities.research.slots).filter((job) => Boolean(job?.acolyteAssigned)).length + Object.values(state.activities.transmutation.jobs).filter((job) => Boolean(job?.acolyteAssigned)).length
    if (assigned > getGuildSkillTreeCapacityAfterReset(state)) return { ok: false as const, reason: 'Unassign an Acolyte before removing Expanded Quarters.' }
  }
  state.progress.guildSkillNodeRanks = {}
  return { ok: true as const }
}

const getGuildSkillTreeCapacityAfterReset = (state: GameState) => Math.max(0, Math.floor(state.tower.acolytes.base + Object.values(state.tower.acolytes.permanentBonuses).reduce((sum, value) => sum + Math.max(0, Math.floor(value)), 0)))

export const resetGuildRequests = (state: GameState) => { state.progress.requestProgress = {}; state.progress.requestClaims = {} }
export const setGuildRank = (state: GameState, rank: GuildRankId) => { state.progress.guildRank = rank }
export const grantGuildPoint = (state: GameState, amount: number) => { state.progress.guildPointsEarned = safeAmount(state.progress.guildPointsEarned) + safeAmount(amount) }

export const debugSetArcaneGuildUnlocked = (state: GameState, unlocked: boolean) => { state.progress.guildUnlocked = unlocked; if (unlocked && state.progress.guildRank === 'outsider') state.progress.guildRank = 'initiate'; ensureGuildCommissionChoices(state); reconcileChronicleProgress(state) }

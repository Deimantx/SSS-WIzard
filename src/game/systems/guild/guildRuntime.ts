import { GUILD_REQUESTS, type GuildRequestId } from '../../content/guild/guildRequests'
import { GUILD_SKILL_NODES } from '../../content/guild/guildSkills'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { pushNotification } from '../../engine'
import { canPurchaseGuildSkillNode } from './guildSelectors'
import { reconcileChronicleProgress } from '../chronicles/chronicleRuntime'
import type { DungeonId, GameState, GuildRankId, GuildSkillNodeId, MonsterId } from '../../types'

const safeAmount = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
const LEGACY_GUILD_REQUESTS = {
  'arcane-supply': { id: 'arcane-supply', kind: 'donation' as const, itemId: 'fire-fragment' as const, target: 20, reputation: 50, guildPoints: 0 },
  'clear-the-woods': { id: 'clear-the-woods', kind: 'dungeon-kills' as const, target: 30, reputation: 50, guildPoints: 0 },
  'sentinel-breaker': { id: 'sentinel-breaker', kind: 'monster-kills' as const, target: 2, reputation: 75, guildPoints: 0 },
}
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

export const recordGuildEnemyKill = (state: GameState, enemyId: MonsterId, dungeonId: DungeonId, boss: boolean) => {
  if (!state.progress.guildUnlocked) return
  const update = (requestId: GuildRequestId, amount = 1) => {
    if (state.progress.requestClaims[requestId]) return
    const request = GUILD_REQUESTS[requestId]
    state.progress.requestProgress[requestId] = Math.min(request.target, (state.progress.requestProgress[requestId] ?? 0) + amount)
  }
  if (!boss && dungeonId === 'howling-den') update('thin-the-pack')
  if (!boss && dungeonId === 'howling-den' && enemyId === 'den-stalker') update('den-stalker')
  if (boss && enemyId === 'corrupted-greatbear') update('greatbear-contract')
}

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

const promotionRequestCount = (state: GameState) => Object.values(GUILD_REQUESTS).filter((request) => state.progress.requestClaims[request.id]).length + Object.values(LEGACY_GUILD_REQUESTS).filter((request) => state.progress.requestClaims[request.id] || (state.progress.requestProgress[request.id] ?? 0) >= request.target).length
export const canPromoteGuild = (state: GameState) => state.progress.guildRank === 'initiate' && promotionRequestCount(state) >= 3 && safeAmount(state.progress.guildReputation) >= 175

export const promoteGuild = (state: GameState) => {
  if (!canPromoteGuild(state)) return false
  state.progress.guildRank = 'apprentice'
  state.progress.guildPointsEarned = safeAmount(state.progress.guildPointsEarned) + 1
  const legacyPromotion = state.progress.requestClaims['arcane-supply'] || state.progress.requestClaims['clear-the-woods'] || state.progress.requestClaims['sentinel-breaker'] || Object.values(LEGACY_GUILD_REQUESTS).some((request) => (state.progress.requestProgress[request.id] ?? 0) >= request.target)
  if (legacyPromotion) state.progress.permanentManaBonuses['guild-apprentice'] = Math.max(10, state.progress.permanentManaBonuses['guild-apprentice'] ?? 0)
  pushNotification(state, 'Guild rank increased to Apprentice · +1 Guild Point', 'success')
  reconcileChronicleProgress(state)
  return true
}

export const purchaseGuildSkillNode = (state: GameState, nodeId: GuildSkillNodeId, free = false) => {
  if (!GUILD_SKILL_NODES[nodeId] || (!free && !canPurchaseGuildSkillNode(state, nodeId))) return false
  if (free && state.progress.guildSkillNodeRanks[nodeId]) return false
  state.progress.guildSkillNodeRanks[nodeId] = 1
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

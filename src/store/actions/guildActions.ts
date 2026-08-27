import { GUILD_REQUESTS } from '../../game/content/guild/guildRequests'
import { BALANCE } from '../../game/core/balance/balance'
import { pushNotification, recalculateDerivedStats } from '../../game/engine'
import { isProtectedItem } from './inventoryActions'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import type { GameState } from '../../game/types'

export const donateGuildRequestAction = (state: GameState, requestId: string, amount: number | 'max') => {
  const request = GUILD_REQUESTS[requestId as keyof typeof GUILD_REQUESTS]
  if (!request || request.kind !== 'donation' || !state.progress.guildUnlocked) return
  const current = state.progress.requestProgress[requestId] ?? 0
  const remaining = request.target - current
  const available = getConsumableQuantity(state, request.itemId)
  const quantity = amount === 'max' ? Math.min(remaining, available) : Math.min(remaining, Math.min(amount, available))
  if (quantity <= 0 || isProtectedItem(state, request.itemId)) { pushNotification(state, 'Protected or missing Fire Fragments.', 'warning'); return }
  state.inventory[request.itemId] = (state.inventory[request.itemId] ?? 0) - quantity
  state.progress.requestProgress[requestId] = current + quantity
}

export const claimGuildRewardAction = (state: GameState, requestId: string) => {
  const request = GUILD_REQUESTS[requestId as keyof typeof GUILD_REQUESTS]
  if (!request || state.progress.requestClaims[requestId] || (state.progress.requestProgress[requestId] ?? 0) < request.target) return
  state.progress.requestClaims[requestId] = true
  state.progress.guildReputation += request.reputation
  pushNotification(state, `${request.name} reward claimed - +${request.reputation} Reputation`, 'success')
}

export const promoteGuildAction = (state: GameState) => {
  const complete = Object.values(GUILD_REQUESTS).every((request) => (state.progress.requestProgress[request.id] ?? 0) >= request.target)
  if (state.progress.guildRank === 'initiate' && complete && state.progress.guildReputation >= 175) {
    state.progress.guildRank = 'apprentice'
    if (!state.progress.permanentFocusBonuses['guild-apprentice']) state.progress.permanentFocusBonuses['guild-apprentice'] = BALANCE.focus.guildApprenticeBonus
    recalculateDerivedStats(state)
    pushNotification(state, 'Guild rank increased to Apprentice - +10 permanent Focus', 'success')
  }
}

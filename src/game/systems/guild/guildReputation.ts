import { GUILD_STANDING_CAP } from '../../content/guild/guildStandings'
import type { GameState } from '../../types'

export const grantGuildReputation = (state: GameState, amount: number) => {
  const safeAmount = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0))
  const previous = Math.max(0, Math.floor(Number.isFinite(state.progress.guildReputation) ? state.progress.guildReputation : 0))
  const next = Math.min(GUILD_STANDING_CAP, previous + safeAmount)
  state.progress.guildReputation = next
  return next - previous
}

export const setGuildReputation = (state: GameState, amount: number) => {
  state.progress.guildReputation = Math.max(0, Math.min(GUILD_STANDING_CAP, Math.floor(Number.isFinite(amount) ? amount : 0)))
  return state.progress.guildReputation
}

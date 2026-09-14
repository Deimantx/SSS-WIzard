import { GUARDIANS, SUMMONING_UNLOCK_BOSS_ID, type GuardianDefinition } from '../../content/guardians/guardians'
import type { GameState, GuardianId } from '../../types'

export const isSummoningUnlocked = (state: Pick<GameState, 'progress'>) => (state.progress.bossKillsByBoss[SUMMONING_UNLOCK_BOSS_ID] ?? 0) >= 1

export const getSelectedGuardianId = (state: Pick<GameState, 'guardians'>): GuardianId | null => state.guardians.selectedGuardianId

export const getSelectedGuardian = (state: Pick<GameState, 'guardians'>): GuardianDefinition | undefined => {
  const id = getSelectedGuardianId(state)
  return id ? GUARDIANS[id] : undefined
}

export const getActiveGuardianId = (state: Pick<GameState, 'combat'>): GuardianId | null => state.combat.guardian.activeGuardianId

export const getActiveGuardian = (state: Pick<GameState, 'combat'>): GuardianDefinition | undefined => {
  const id = getActiveGuardianId(state)
  return id ? GUARDIANS[id] : undefined
}

export const getGuardianManaUpkeep = (state: Pick<GameState, 'combat'>, guardianId?: GuardianId | null) => {
  const id = guardianId ?? getActiveGuardianId(state)
  return id ? GUARDIANS[id]?.manaPerSecond ?? 0 : 0
}

export const getGuardianPassiveProviders = (state: { combat: { guardian?: Pick<GameState['combat']['guardian'], 'activeGuardianId'> } }) => {
  const guardianId = state.combat.guardian?.activeGuardianId
  const guardian = guardianId ? GUARDIANS[guardianId] : undefined
  if (!guardian) return []
  return guardian.passive.modifiers.map((modifier) => ({ modifier, sourceId: guardian.id, sourceName: guardian.name }))
}

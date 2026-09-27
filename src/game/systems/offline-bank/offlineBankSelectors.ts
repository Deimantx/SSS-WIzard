import type { GameState } from '../../types'
import { getResearchAcolytesAssigned } from '../research/researchSelectors'
import { getTransmutationAcolytesAssigned } from '../transmutation/transmutationSelectors'
import { getActiveArtificingJob } from '../artificing/artificingSelectors'

export type OfflineBankSystem = 'combat' | 'research' | 'transmutation' | 'channeling' | 'artificing'

export const getOfflineBankActiveSystems = (state: GameState): OfflineBankSystem[] => {
  const systems: OfflineBankSystem[] = []
  const meaningfulCombat = state.combat.active && (Boolean(state.combat.enemyId) || state.player.health < state.player.maxHealth || state.combat.encounterTimerMs > 0)
  if (meaningfulCombat) systems.push('combat')
  if (getResearchAcolytesAssigned(state) > 0) systems.push('research')
  if (getTransmutationAcolytesAssigned(state) > 0) systems.push('transmutation')
  if (Math.max(0, Math.floor(state.activities.channeling.acolytesAssigned ?? 0)) > 0) systems.push('channeling')
  if (getActiveArtificingJob(state)) systems.push('artificing')
  return systems
}

export const canAdvanceOfflineBank = (state: GameState) => getOfflineBankActiveSystems(state).length > 0

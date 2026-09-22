import { getEliteZoneAffix, type EliteZoneAffixDefinition, type EliteZoneAffixId } from '../../content/elite-affixes'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import { getCombatLocationByDungeonId } from '../../content/world-navigation'
import type { GameState } from '../../types'

type ZoneAffixState = { combat: Pick<GameState['combat'], 'enemyId'> & Partial<Pick<GameState['combat'], 'dungeonId'>> }

export const getActiveEliteZoneAffixId = (state: ZoneAffixState): EliteZoneAffixId | null => {
  const { dungeonId, enemyId } = state.combat
  if (!dungeonId || !enemyId || !MONSTERS[enemyId] || isBossMonster(MONSTERS[enemyId])) return null
  const location = getCombatLocationByDungeonId(dungeonId)
  if (!location || location.type !== 'elite-zone' || !location.zoneAffixId) return null
  return getEliteZoneAffix(location.zoneAffixId) ? location.zoneAffixId : null
}

export const getActiveEliteZoneAffix = (state: ZoneAffixState): EliteZoneAffixDefinition | null => getEliteZoneAffix(getActiveEliteZoneAffixId(state))

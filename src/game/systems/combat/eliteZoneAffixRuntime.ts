import { getEliteZoneAffix, type EliteZoneAffixDefinition, type EliteZoneAffixId } from '../../content/elite-affixes'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import { getCombatLocationById } from '../../content/combat-locations'
import type { GameState } from '../../types'

type ZoneAffixState = { combat: Pick<GameState['combat'], 'enemyId'> & Partial<Pick<GameState['combat'], 'locationId'>> }

export const getActiveEliteZoneAffixId = (state: ZoneAffixState): EliteZoneAffixId | null => {
  const { locationId, enemyId } = state.combat
  if (!locationId || !enemyId || !MONSTERS[enemyId] || isBossMonster(MONSTERS[enemyId])) return null
  const location = getCombatLocationById(locationId)
  if (!location || location.type !== 'elite-zone' || !location.zoneAffixId) return null
  return getEliteZoneAffix(location.zoneAffixId) ? location.zoneAffixId : null
}

export const getActiveEliteZoneAffix = (state: ZoneAffixState): EliteZoneAffixDefinition | null => getEliteZoneAffix(getActiveEliteZoneAffixId(state))

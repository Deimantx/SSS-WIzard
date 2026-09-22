import { ELITE_MINOR_AFFIXES, type EliteMinorAffixDefinition, type EliteMinorAffixId } from '../../content/elite-affixes'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import { getCombatLocationByDungeonId } from '../../content/world-navigation'
import type { GameState, MonsterId } from '../../types'

type AffixState = { combat: Pick<GameState['combat'], 'enemyId'> & Partial<Pick<GameState['combat'], 'dungeonId' | 'targetEnemyId'>> }

export const getActiveEliteMinorAffixId = (state: AffixState): EliteMinorAffixId | null => {
  const { dungeonId, targetEnemyId, enemyId } = state.combat
  if (!dungeonId || !targetEnemyId || !enemyId || targetEnemyId !== enemyId) return null
  const location = getCombatLocationByDungeonId(dungeonId)
  if (!location || location.type !== 'elite-zone' || location.encounterMode !== 'targeted' || !MONSTERS[enemyId] || isBossMonster(MONSTERS[enemyId])) return null
  const metadata = location.targetMetadata?.[enemyId as MonsterId]
  return metadata?.minorAffixId ?? null
}

export const getActiveEliteMinorAffix = (state: AffixState): EliteMinorAffixDefinition | null => {
  const id = getActiveEliteMinorAffixId(state)
  return id ? ELITE_MINOR_AFFIXES[id] ?? null : null
}

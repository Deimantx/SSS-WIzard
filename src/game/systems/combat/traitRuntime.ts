import { getTraitDefinitions } from '../../content/traits'
import { MONSTERS, type MonsterDefinition } from '../../content/monsters'
import type { GameState, TraitDefinition } from '../../types'
import type { CombatActor } from './magnitude'
import { getActiveEliteMinorAffix } from './eliteMinorAffixRuntime'

/** The single ownership boundary for actor Traits. Equipment/passives can be added here later. */
export const getActorTraitIds = (state: { combat: Pick<GameState['combat'], 'enemyId'> }, actor: CombatActor) => {
  if (actor !== 'enemy' || !state.combat.enemyId) return []
  return MONSTERS[state.combat.enemyId]?.traitIds ?? []
}

export const getMonsterTraits = (monster: MonsterDefinition): TraitDefinition[] => {
  return getTraitDefinitions(monster.traitIds)
}

export const getActorTraits = (state: { combat: Pick<GameState['combat'], 'enemyId'> & Partial<Pick<GameState['combat'], 'dungeonId' | 'targetEnemyId'>> }, actor: CombatActor): TraitDefinition[] => {
  const traits = getTraitDefinitions(getActorTraitIds(state, actor))
  if (actor !== 'enemy') return traits
  const affix = getActiveEliteMinorAffix(state)
  return affix ? [...traits, { ...affix, id: `elite-affix:${affix.id}` }] : traits
}

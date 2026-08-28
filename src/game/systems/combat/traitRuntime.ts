import { getTraitDefinitions } from '../../content/traits'
import { MONSTERS, type MonsterDefinition } from '../../content/monsters/whisperingWoods'
import type { GameState, TraitDefinition } from '../../types'
import type { CombatActor } from './magnitude'

/** The single ownership boundary for actor Traits. Equipment/passives can be added here later. */
export const getActorTraitIds = (state: GameState, actor: CombatActor) => {
  if (actor !== 'enemy' || !state.combat.enemyId) return []
  return MONSTERS[state.combat.enemyId]?.traitIds ?? []
}

export const getMonsterTraits = (monster: MonsterDefinition): TraitDefinition[] => {
  return getTraitDefinitions(monster.traitIds)
}

export const getActorTraits = (state: GameState, actor: CombatActor) => {
  if (actor !== 'enemy' || !state.combat.enemyId) return []
  const monster = MONSTERS[state.combat.enemyId]
  return monster ? getMonsterTraits(monster) : []
}

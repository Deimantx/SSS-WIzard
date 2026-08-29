import { getTraitDefinitions } from '../../content/traits'
import { MONSTERS, type MonsterDefinition } from '../../content/monsters'
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
  return getTraitDefinitions(getActorTraitIds(state, actor))
}

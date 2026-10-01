import { MONSTERS, isBossMonster } from '../../content/monsters'
import { getMonsterDossierCombatStats } from '../combat/enemyCombatStatPresentation'
import { getMonsterDefeatCount, getMonsterLocationEntries } from '../../systems/bestiary/bestiarySelectors'
import { getMonsterHunterContractRelation, type HunterContractMonsterRelation } from '../huntersOrder/hunterContractCombatPresentation'
import { getHunterAuthorization } from '../../systems/hunters-order/huntersOrderRuntime'
import type { CombatLocationId, GameState, MonsterId } from '../../types'

export function getBestiaryEntryPresentation(state: Pick<GameState, 'progress'>, monsterId: MonsterId, locationId: CombatLocationId = 'hunters-ground') {
  const monster = MONSTERS[monsterId]
  if (!monster) return null
  const discovered = state.progress.discoveredMonsters.includes(monsterId)
  const locations = getMonsterLocationEntries(monsterId)
  const hunterRelation: HunterContractMonsterRelation = getMonsterHunterContractRelation(state, monsterId, locationId)
  const hunter = monster.hunter?.exclusive ? {
    family: monster.hunter.family,
    alignment: monster.hunter.alignment,
    tier: monster.hunter.contractTier,
    minimumRank: monster.hunter.minimumRank ?? null,
    relation: hunterRelation,
    authorization: getHunterAuthorization(state, monsterId, locationId),
    blocked: state.progress.huntersOrder.blockedTargets.includes(monsterId),
    contractKills: state.progress.huntersOrder.monsterHunterStats[monsterId]?.contractKills ?? 0,
    contractsCompleted: state.progress.huntersOrder.monsterHunterStats[monsterId]?.contractsCompleted ?? 0,
    marksEarned: state.progress.huntersOrder.monsterHunterStats[monsterId]?.marksEarned ?? 0,
  } : null
  return {
    id: monster.id,
    name: discovered ? monster.name : 'Unknown Quarry',
    subtitle: discovered ? monster.subtitle : 'Not yet encountered',
    discovered,
    category: monster.bestiaryCategory,
    locations: locations.map((location) => location.name),
    defeats: discovered ? getMonsterDefeatCount(state, monsterId) : null,
    combat: discovered ? getMonsterDossierCombatStats(monster) : null,
    roleTags: discovered ? monster.ui?.bestiary?.roleTags ?? [] : [],
    family: discovered ? monster.hunter?.family ?? null : null,
    alignment: discovered ? monster.hunter?.alignment ?? null : null,
    hunter,
    boss: isBossMonster(monster),
  }
}

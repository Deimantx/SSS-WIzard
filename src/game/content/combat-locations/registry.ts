import { MONSTERS } from '../monsters'
import { ELEMENT_IDS } from '../elements/elements'
import { getMonsterPrimaryAffinity } from '../monsters/monsterTypes'
import { COMBAT_LOCATION_IDS, type CombatLocationId } from './combatLocationIds'
import type { CombatLocationDefinition, CombatLocationRuntimeView } from './worldNavigationTypes'
import { firstFrontierLocations } from './first-frontier/locations'
import { elementalScarLocations } from './elemental-scar/locations'
import { shatteredMeridianLocations } from './shattered-meridian/locations'
import { blackSigilReachLocations } from './black-sigil-reach/locations'

const authoredLocations = {
  ...firstFrontierLocations,
  ...elementalScarLocations,
  ...shatteredMeridianLocations,
  ...blackSigilReachLocations,
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>

export const COMBAT_LOCATION_ORDER: readonly CombatLocationId[] = COMBAT_LOCATION_IDS

const toRuntimeView = (location: CombatLocationDefinition): CombatLocationRuntimeView => {
  const roster = [...location.monsterPool, ...(location.bossId ? [location.bossId] : [])]
  const elementsPresent = ELEMENT_IDS.filter((element) => roster.some((monsterId) => {
    const monster = MONSTERS[monsterId]
    return monster && getMonsterPrimaryAffinity(monster) === element
  }))
  return {
    ...location,
    boss: location.bossId,
    ...(location.sequence ? { encounterSequence: location.sequence } : {}),
    ...(location.description ? { ui: { description: location.description } } : {}),
    elementsPresent,
  }
}

export const COMBAT_LOCATIONS = Object.fromEntries(COMBAT_LOCATION_ORDER.map((id) => {
  const location = authoredLocations[id]
  if (!location) throw new Error(`Missing canonical Combat Location: ${id}`)
  return [id, toRuntimeView(location)]
})) as Record<CombatLocationId, CombatLocationRuntimeView>

export const getCombatLocationElements = (location: CombatLocationDefinition): readonly (typeof ELEMENT_IDS)[number][] => {
  const roster = [...location.monsterPool, ...(location.bossId ? [location.bossId] : [])]
  return ELEMENT_IDS.filter((element) => roster.some((monsterId) => {
    const monster = MONSTERS[monsterId]
    return monster && getMonsterPrimaryAffinity(monster) === element
  }))
}

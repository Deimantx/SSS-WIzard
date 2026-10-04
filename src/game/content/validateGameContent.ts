import { COMBAT_LOCATIONS } from './combat-locations/worldNavigation'
import { validateCombatWorldNavigation } from './combat-locations/worldNavigationValidation'
import { validateItemDefinitions } from './items/items'
import { validateRecipeDefinitions } from './recipes/recipes'
import { validateMonsterDefinitions, MONSTER_IDS, MONSTERS, isBossMonster } from './monsters'
import { validateSpellDefinitions } from './spells/spells'
import { validateStatusDefinitions } from './statuses/statuses'
import { validateTraitDefinitions } from './traits/traits'
import { validateEquipmentSetDefinitions } from './equipment/equipmentSets'
import { validateArtifactDefinitions } from './artifacts/artifacts'
import { ITEMS } from './items/items'
import { validateEliteZoneAffixes } from './elite-affixes'
import { validateUniversalLootTierDefinitions } from './loot/universalLootTiers'
import { COMBAT_LOCATION_ORDER } from './combat-locations'
import { ELEMENT_IDS } from './elements/elements'
import { getMonsterPrimaryAffinity } from './monsters/monsterTypes'

/**
 * Intentional development-time validation entry point for authored content.
 * Focused validators remain independently reusable, but content is validated
 * here once instead of as a side effect of whichever module imported first.
 */
export const validateGameContent = () => {
  const lootTierValidation = validateUniversalLootTierDefinitions()
  const errors = [
    ...validateSpellDefinitions(),
    ...validateStatusDefinitions(),
    ...validateTraitDefinitions(),
    ...validateMonsterDefinitions(),
    ...validateItemDefinitions(),
    ...validateCombatWorldNavigation({ locations: COMBAT_LOCATIONS }),
    ...validateRecipeDefinitions(),
    ...validateEquipmentSetDefinitions(),
    ...validateArtifactDefinitions(ITEMS),
    ...validateEliteZoneAffixes(),
    ...lootTierValidation.errors,
  ]
  const locationCounts = Object.values(COMBAT_LOCATIONS).reduce<Record<string, number>>((counts, location) => { const type = location.progression?.locationType ?? 'missing-progression'; counts[type] = (counts[type] ?? 0) + 1; return counts }, {})
  const expectedLocations = { total: 33, 'combat-zone': 20, 'hunting-ground': 5, dungeon: 5, special: 3 }
  if (COMBAT_LOCATION_ORDER.length !== expectedLocations.total) errors.push(`combat locations: expected ${expectedLocations.total}, received ${COMBAT_LOCATION_ORDER.length}`)
  Object.entries(expectedLocations).filter(([type]) => type !== 'total').forEach(([type, expected]) => { if ((locationCounts[type] ?? 0) !== expected) errors.push(`combat locations: expected ${expected} ${type}, received ${locationCounts[type] ?? 0}`) })
  const bossCount = MONSTER_IDS.filter((id) => isBossMonster(MONSTERS[id])).length
  if (MONSTER_IDS.length !== 220 || bossCount !== 30 || MONSTER_IDS.length - bossCount !== 190) errors.push(`combat monsters: expected 190 normal and 30 bosses; received ${MONSTER_IDS.length - bossCount} normal and ${bossCount} bosses`)
  const expectedAffinityTotals = { earth: 44, arcane: 44, air: 44, fire: 44, water: 44 }
  const affinityTotals = Object.fromEntries(ELEMENT_IDS.map((element) => [element, MONSTER_IDS.filter((id) => getMonsterPrimaryAffinity(MONSTERS[id]) === element).length])) as Record<string, number>
  Object.entries(expectedAffinityTotals).forEach(([element, expected]) => { if (affinityTotals[element] !== expected) errors.push(`combat monsters: expected ${expected} ${element} affinities, received ${affinityTotals[element] ?? 0}`) })
  if (lootTierValidation.warnings.length && import.meta.env.DEV) console.warn(`[game-content] ${lootTierValidation.warnings.join('; ')}`)
  if (errors.length && import.meta.env.DEV) console.error(`[game-content] ${errors.join('; ')}`)
  return errors
}

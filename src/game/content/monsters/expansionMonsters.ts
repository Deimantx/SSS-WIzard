import type { CombatLocationId, MonsterId } from '../../types'
import type { MonsterDefinition } from './monsterTypes'
import { BRINEVEIL_MARSH_NORMALS } from './combat-zones/brineveilMarsh'
import { CINDERWILD_EXPANSE_NORMALS } from './combat-zones/cinderwildExpanse'
import { SKYBREAK_CLIFFS_NORMALS } from './combat-zones/skybreakCliffs'
import { RUNEBLIGHT_EXPANSE_NORMALS } from './combat-zones/runeblightExpanse'
import { PYREHOLD_BASTION_NORMALS } from './elite-zones/pyreholdBastion'
import { ABYSSAL_RESERVOIR_NORMALS } from './elite-zones/abyssalReservoir'
import { SCALDING_RIFT_NORMALS } from './elite-zones/scaldingRift'
import { MISTCLAW_HIGHLANDS_NORMALS } from './hunting-grounds/mistclawHighlands'
import { CINDERHEX_BARRENS_NORMALS } from './hunting-grounds/cinderhexBarrens'
import { CINDER_SEPULCHER_NORMALS } from './dungeons/cinderSepulcher'
import { TEMPLE_OF_THE_SUNKEN_BELL_NORMALS } from './dungeons/templeOfTheSunkenBell'
import { STORMSPIRE_MONASTERY_NORMALS } from './dungeons/stormspireMonastery'
import { NULLSTONE_ARCHIVE_NORMALS } from './dungeons/nullstoneArchive'
import { EXPANSION_BOSSES } from './expansion/bosses'

export { EXPANSION_BOSSES } from './expansion/bosses'

export const EXPANSION_LOCATION_MONSTERS: Partial<Record<CombatLocationId, readonly MonsterDefinition[]>> = {
  'brineveil-marsh': BRINEVEIL_MARSH_NORMALS,
  'cinderwild-expanse': CINDERWILD_EXPANSE_NORMALS,
  'skybreak-cliffs': SKYBREAK_CLIFFS_NORMALS,
  'runeblight-expanse': RUNEBLIGHT_EXPANSE_NORMALS,
  'pyrehold-bastion': PYREHOLD_BASTION_NORMALS,
  'abyssal-reservoir': ABYSSAL_RESERVOIR_NORMALS,
  'scalding-rift': SCALDING_RIFT_NORMALS,
  'mistclaw-highlands': MISTCLAW_HIGHLANDS_NORMALS,
  'cinderhex-barrens': CINDERHEX_BARRENS_NORMALS,
  'cinder-sepulcher': CINDER_SEPULCHER_NORMALS,
  'temple-of-the-sunken-bell': TEMPLE_OF_THE_SUNKEN_BELL_NORMALS,
  'stormspire-monastery': STORMSPIRE_MONASTERY_NORMALS,
  'nullstone-archive': NULLSTONE_ARCHIVE_NORMALS,
}

export const EXPANSION_LOCATION_ROSTERS: Partial<Record<CombatLocationId, readonly MonsterId[]>> = Object.fromEntries(
  Object.entries(EXPANSION_LOCATION_MONSTERS).map(([locationId, monsters]) => [locationId, monsters!.map(({ id }) => id)]),
)

export const EXPANSION_BOSSES_BY_LOCATION: Partial<Record<CombatLocationId, MonsterId>> = {
  'brineveil-marsh': 'moonwake-leviathan',
  'cinderwild-expanse': 'furnace-maw',
  'skybreak-cliffs': 'tempest-sovereign',
  'runeblight-expanse': 'unmade-magister',
  'pyrehold-bastion': 'pyrehold-castellan',
  'abyssal-reservoir': 'drowned-regent',
  'scalding-rift': 'steam-tyrant',
  'stormspire-monastery': 'abbot-ninth-gale',
  'nullstone-archive': 'closed-index',
}

export const EXPANSION_MONSTERS = Object.fromEntries(
  [...Object.values(EXPANSION_LOCATION_MONSTERS).flat(), ...EXPANSION_BOSSES].map((monster) => [monster.id, monster]),
) as Record<MonsterId, MonsterDefinition>

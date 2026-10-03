import type { CombatLocationDefinition, CombatLocationId, CombatTargetDifficulty } from './worldNavigationTypes'
import type { MonsterId } from '../../types'
import { EXPANSION_BOSSES_BY_LOCATION, EXPANSION_LOCATION_ROSTERS } from '../monsters/expansionMonsters'

const targetMetadata = (ids: readonly MonsterId[]) => Object.fromEntries(ids.map((id, index) => [id, { difficulty: (index < 2 ? 'standard' : index < 5 ? 'hard' : 'apex') as CombatTargetDifficulty, order: index + 1 }]))
const targeted = (id: CombatLocationId, progressionOrder: number, name: string, type: 'combat-zone' | 'elite-zone' | 'hunting-ground', unlock: NonNullable<CombatLocationDefinition['unlock']>, zoneAffixId?: CombatLocationDefinition['zoneAffixId']): CombatLocationDefinition => {
  const monsterPool = EXPANSION_LOCATION_ROSTERS[id] ?? []
  const bossId = EXPANSION_BOSSES_BY_LOCATION[id] ?? null
  return { id, progressionOrder, name, description: `A new ${type.replace('-', ' ')} in the expanded Combat frontier.`, type, monsterPool, bossId, threatRequired: type === 'hunting-ground' ? null : 50000 + progressionOrder * 1000, encounterDelayMs: 5000, sequence: null, encounterMode: 'targeted', targetMetadata: targetMetadata(monsterPool), unlock, ...(zoneAffixId ? { zoneAffixId } : {}) }
}
const dungeon = (id: CombatLocationId, progressionOrder: number, name: string, unlock: NonNullable<CombatLocationDefinition['unlock']>): CombatLocationDefinition => {
  const monsterPool = EXPANSION_LOCATION_ROSTERS[id] ?? []
  const bossId = EXPANSION_BOSSES_BY_LOCATION[id] ?? null
  return { id, progressionOrder, name, description: `A fixed sequence through ${name}.`, type: 'dungeon', monsterPool, bossId, threatRequired: 0, encounterDelayMs: 5000, sequence: monsterPool, encounterMode: 'sequence', unlock }
}

export const expansionLocations = {
  'brineveil-marsh': targeted('brineveil-marsh', 21, 'Brineveil Marsh', 'combat-zone', { type: 'boss-kill', bossId: 'forest-heart' }),
  'cinderwild-expanse': targeted('cinderwild-expanse', 22, 'Cinderwild Expanse', 'combat-zone', { type: 'boss-kill', bossId: 'archmage-edrin-shade' }),
  'skybreak-cliffs': targeted('skybreak-cliffs', 23, 'Skybreak Cliffs', 'combat-zone', { type: 'boss-kill', bossId: 'corrupted-elemental-gatekeeper' }),
  'runeblight-expanse': targeted('runeblight-expanse', 24, 'Runeblight Expanse', 'combat-zone', { type: 'boss-kill', bossId: 'crossroads-keeper' }),
  'pyrehold-bastion': targeted('pyrehold-bastion', 25, 'Pyrehold Bastion', 'elite-zone', { type: 'boss-kill', bossId: 'furnace-maw' }, 'vicious'),
  'abyssal-reservoir': targeted('abyssal-reservoir', 26, 'Abyssal Reservoir', 'elite-zone', { type: 'boss-kill', bossId: 'moonwake-leviathan' }, 'regenerative'),
  'scalding-rift': targeted('scalding-rift', 27, 'Scalding Rift', 'elite-zone', { type: 'all-boss-kills', bossIds: ['pyrehold-castellan', 'drowned-regent'] }, 'frenzied'),
  'mistclaw-highlands': targeted('mistclaw-highlands', 28, 'Mistclaw Highlands', 'hunting-ground', { type: 'boss-kill', bossId: 'corrupted-greatbear' }),
  'cinderhex-barrens': targeted('cinderhex-barrens', 29, 'Cinderhex Barrens', 'hunting-ground', { type: 'boss-kill', bossId: 'unmade-magister' }),
  'cinder-sepulcher': dungeon('cinder-sepulcher', 30, 'Cinder Sepulcher', { type: 'boss-kill', bossId: 'pyrehold-castellan' }),
  'temple-of-the-sunken-bell': dungeon('temple-of-the-sunken-bell', 31, 'Temple of the Sunken Bell', { type: 'boss-kill', bossId: 'drowned-regent' }),
  'stormspire-monastery': dungeon('stormspire-monastery', 32, 'Stormspire Monastery', { type: 'boss-kill', bossId: 'tempest-sovereign' }),
  'nullstone-archive': dungeon('nullstone-archive', 33, 'Nullstone Archive', { type: 'all-boss-kills', bossIds: ['steam-tyrant', 'unmade-magister'] }),
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>

import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'
import { authorSequenceDungeon, authorTargetedLocation } from '../authoring'

export const expansionDungeonLocations = {
  'cinder-sepulcher': authorTargetedLocation('cinder-sepulcher', 30, 'Cinder Sepulcher', 'Mixed quarry patrols cross the open burial grounds beneath the undying funeral flames.', 'hunting-ground', null, { type: 'always' }),
  'temple-of-the-sunken-bell': authorTargetedLocation('temple-of-the-sunken-bell', 31, 'Sunken Bell Grounds', 'Mixed quarry roam through the submerged temple grounds, following the broken bell’s current.', 'hunting-ground', null, { type: 'always' }),
  'stormspire-monastery': authorSequenceDungeon('stormspire-monastery', 32, 'Stormspire Monastery', 'A mountain monastery of towers, chains and bells surrounded by permanent violent winds.', { type: 'boss-kill', bossId: 'tempest-sovereign' }),
  'nullstone-archive': authorSequenceDungeon('nullstone-archive', 33, 'Nullstone Archive', 'An underground archive built to imprison dangerous magical knowledge inside rune-carved stone.', { type: 'all-boss-kills', bossIds: ['steam-tyrant', 'unmade-magister'] }),
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>

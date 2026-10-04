import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'
import { authorSequenceDungeon } from '../authoring'

export const expansionDungeonLocations = {
  'cinder-sepulcher': authorSequenceDungeon('cinder-sepulcher', 30, 'Cinder Sepulcher', 'An ancient burial complex whose funerary flames never extinguished.', { type: 'boss-kill', bossId: 'pyrehold-castellan' }),
  'temple-of-the-sunken-bell': authorSequenceDungeon('temple-of-the-sunken-bell', 31, 'Temple of the Sunken Bell', 'A submerged temple built around an enormous ceremonial bell.', { type: 'boss-kill', bossId: 'drowned-regent' }),
  'stormspire-monastery': authorSequenceDungeon('stormspire-monastery', 32, 'Stormspire Monastery', 'A mountain monastery of towers, chains and bells surrounded by permanent violent winds.', { type: 'boss-kill', bossId: 'tempest-sovereign' }),
  'nullstone-archive': authorSequenceDungeon('nullstone-archive', 33, 'Nullstone Archive', 'An underground archive built to imprison dangerous magical knowledge inside rune-carved stone.', { type: 'all-boss-kills', bossIds: ['steam-tyrant', 'unmade-magister'] }),
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>

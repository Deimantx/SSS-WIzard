import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'
import { authorTargetedLocation } from '../authoring'

export const expansionEliteZoneLocations = {
  'pyrehold-bastion': authorTargetedLocation('pyrehold-bastion', 27, 'Pyrehold Bastion', 'An abandoned military fortress permanently heated by deep magma channels.', 'elite-zone', 30000, { type: 'boss-kill', bossId: 'furnace-maw' }, 'vicious'),
  'abyssal-reservoir': authorTargetedLocation('abyssal-reservoir', 28, 'Abyssal Reservoir', 'A colossal underground reservoir of flooded machinery under crushing magical pressure.', 'elite-zone', 32000, { type: 'boss-kill', bossId: 'moonwake-leviathan' }, 'regenerative'),
  'scalding-rift': authorTargetedLocation('scalding-rift', 29, 'Scalding Rift', 'A volcanic fault where underground Water channels collide with molten stone.', 'elite-zone', 34000, { type: 'all-boss-kills', bossIds: ['pyrehold-castellan', 'drowned-regent'] }, 'frenzied'),
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>

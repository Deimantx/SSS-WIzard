import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'
import { authorTargetedLocation } from '../authoring'

export const expansionCombatZoneLocations = {
  'brineveil-marsh': authorTargetedLocation('brineveil-marsh', 6, 'Brineveil Marsh', 'Flooded black-reed wilderness, brackish pools and salt-crusted ruins.', 'combat-zone', 20000, { type: 'boss-kill', bossId: 'forest-heart' }),
  'cinderwild-expanse': authorTargetedLocation('cinderwild-expanse', 11, 'Cinderwild Expanse', 'Scorched volcanic wilderness where ash-covered beasts roam between magma vents.', 'combat-zone', 22000, { type: 'boss-kill', bossId: 'archmage-edrin-shade' }),
  'skybreak-cliffs': authorTargetedLocation('skybreak-cliffs', 13, 'Skybreak Cliffs', 'High wind-cut cliffs, suspended paths and aerial predators.', 'combat-zone', 24000, { type: 'boss-kill', bossId: 'corrupted-elemental-gatekeeper' }),
  'runeblight-expanse': authorTargetedLocation('runeblight-expanse', 18, 'Runeblight Expanse', 'An open magical disaster zone warped by broken ley lines and unstable Arcane energy.', 'combat-zone', 26000, { type: 'boss-kill', bossId: 'crossroads-keeper' }),
} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>

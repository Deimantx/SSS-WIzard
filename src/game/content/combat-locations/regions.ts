import type { CombatRegionDefinition, CombatRegionId } from './worldNavigationTypes'
import { COMBAT_LOCATIONS, COMBAT_LOCATION_ORDER } from './registry'

const locationIdsForRegion = (regionId: CombatRegionId) => COMBAT_LOCATION_ORDER.filter((id) => COMBAT_LOCATIONS[id].regionId === regionId)

export const COMBAT_REGIONS: Record<CombatRegionId, CombatRegionDefinition> = {
  'first-frontier': {
    id: 'first-frontier', name: 'First Frontier',
    description: 'The first stretch of wild territory traced from the tower.',
    locationIds: locationIdsForRegion('first-frontier'), order: 1, unlock: { type: 'always' },
  },
  'elemental-scar': {
    id: 'elemental-scar', name: 'Elemental Scar',
    description: 'A wounded elemental corridor where the old frontier gives way to unstable crossings.',
    locationIds: locationIdsForRegion('elemental-scar'), order: 2,
    unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade', count: 1 },
  },
  'shattered-meridian': {
    id: 'shattered-meridian', name: 'Shattered Meridian',
    description: 'A fractured leyline where roads, ruins, and starlight pull against one another.',
    locationIds: locationIdsForRegion('shattered-meridian'), order: 3,
    unlock: { type: 'boss-kill', bossId: 'crossroads-keeper', count: 1 },
  },
  'black-sigil-reach': {
    id: 'black-sigil-reach', name: 'Black Sigil Reach',
    description: 'The sealed approach to the dark gate, marked by names and wards that should not endure.',
    locationIds: locationIdsForRegion('black-sigil-reach'), order: 4,
    unlock: { type: 'boss-kill', bossId: 'meridian-splitter', count: 1 },
  },
}

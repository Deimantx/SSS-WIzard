import type { CombatLocationId } from '../../types'
import type { SigilSetId } from './sigilSets'
import { SIGIL_SET_IDS } from './sigilSets'

const pool = (...sets: SigilSetId[]) => sets
export const SIGIL_REGION_SET_POOLS: Partial<Record<CombatLocationId, readonly SigilSetId[]>> = {
  'whispering-woods': pool('arcane', 'vital', 'ward', 'restoration', 'cinder', 'conduit'),
  'howling-den': pool('vital', 'precision', 'conduit', 'sage', 'tempest', 'predator'),
  'abandoned-catacombs': pool('arcane', 'ward', 'precision', 'sage', 'echo', 'dominion'),
  'fractured-approach': pool('arcane', 'precision', 'tempest', 'conduit', 'echo', 'vital'),
  'flooded-reliquary': pool('restoration', 'ward', 'conduit', 'dominion', 'vital', 'arcane'),
  'ashen-watch': pool('cinder', 'precision', 'predator', 'arcane', 'sage', 'vital'),
  'rootscar-hollow': pool('vital', 'ward', 'restoration', 'dominion', 'conduit', 'predator'),
  'crossroads-of-ruin': pool('arcane', 'precision', 'conduit', 'sage', 'tempest', 'echo'),
  'broken-meridian': pool('precision', 'tempest', 'echo', 'dominion', 'predator', 'arcane'),
  'graveglass-hollow': pool('dominion', 'echo', 'ward', 'sage', 'predator', 'conduit'),
  'hall-of-unbound-names': pool('arcane', 'dominion', 'echo', 'precision', 'sage', 'restoration'),
  'starfallen-observatory': pool('arcane', 'tempest', 'precision', 'echo', 'conduit', 'restoration'),
  'stormvault-gallery': pool('tempest', 'precision', 'conduit', 'arcane', 'predator', 'sage'),
  'vault-of-the-black-sigil': pool('echo', 'dominion', 'predator', 'ward', 'precision', 'cinder'),
  'black-gate': pool('predator', 'cinder', 'ward', 'vital', 'precision', 'arcane'),
}

export const getSigilRegionSetPool = (locationId: CombatLocationId): readonly SigilSetId[] => SIGIL_REGION_SET_POOLS[locationId] ?? SIGIL_SET_IDS

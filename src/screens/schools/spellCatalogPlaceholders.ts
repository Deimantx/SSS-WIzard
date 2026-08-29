import type { SchoolId } from '../../game/types'

export interface SpellCatalogPlaceholder {
  id: string
  school: SchoolId
  requiredLevel: number
}

/** UI-only future catalog slots. These IDs never enter authored spell data or saves. */
export const SPELL_CATALOG_PLACEHOLDERS: readonly SpellCatalogPlaceholder[] = (['fire', 'water', 'earth', 'air'] as const).flatMap((school) => [24, 32, 40].map((requiredLevel) => ({ id: `future-${school}-${requiredLevel}`, school, requiredLevel })))

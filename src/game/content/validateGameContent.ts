import { validateDungeonDefinitions } from './dungeons/dungeons'
import { validateItemDefinitions } from './items/items'
import { validateRecipeDefinitions } from './recipes/recipes'
import { validateMonsterDefinitions } from './monsters'
import { validateSpellDefinitions } from './spells/spells'
import { validateStatusDefinitions } from './statuses/statuses'
import { validateTraitDefinitions } from './traits/traits'
import { validateEquipmentSetDefinitions } from './equipment/equipmentSets'
import { validateArtifactDefinitions } from './artifacts/artifacts'
import { ITEMS } from './items/items'
import { MONSTERS } from './monsters'

/**
 * Intentional development-time validation entry point for authored content.
 * Focused validators remain independently reusable, but content is validated
 * here once instead of as a side effect of whichever module imported first.
 */
export const validateGameContent = () => {
  const errors = [
    ...validateSpellDefinitions(),
    ...validateStatusDefinitions(),
    ...validateTraitDefinitions(),
    ...validateMonsterDefinitions(),
    ...validateItemDefinitions(),
    ...validateDungeonDefinitions(),
    ...validateRecipeDefinitions(),
    ...validateEquipmentSetDefinitions(),
    ...validateArtifactDefinitions(ITEMS, MONSTERS),
  ]
  if (errors.length && import.meta.env.DEV) console.error(`[game-content] ${errors.join('; ')}`)
  return errors
}

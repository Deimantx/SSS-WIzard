import { validateDungeonDefinitions } from './dungeons/dungeons'
import { validateItemDefinitions } from './items/items'
import { validateMonsterDefinitions } from './monsters'
import { validateSpellDefinitions } from './spells/spells'
import { validateStatusDefinitions } from './statuses/statuses'
import { validateTraitDefinitions } from './traits/traits'

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
  ]
  if (errors.length && import.meta.env.DEV) console.error(`[game-content] ${errors.join('; ')}`)
  return errors
}

import type { ArtifactId, ItemId, ArtificingRecipeId, DungeonId, RecipeUnlockCondition } from '../../types'

export interface ArtificingRecipeDefinition {
  id: ArtificingRecipeId
  kind: 'artificing'
  name: string
  output: { itemId: ArtificingRecipeId; quantity: 1 }
  ingredients: { itemId: ItemId; quantity: number }[]
  unlock: RecipeUnlockCondition
  sourceDungeonId?: DungeonId
  description?: string
  baseDurationMs: number
}

const always: RecipeUnlockCondition = { type: 'always' }
interface ArtifactRecipeOptions {
  sourceDungeonId?: DungeonId
  unlock?: RecipeUnlockCondition
  artifactEssenceQuantity?: number
}
const artifactRecipe = (id: ArtifactId, name: string, fragment: ItemId, fragmentQuantity: number, description: string, options: ArtifactRecipeOptions = {}): ArtificingRecipeDefinition => ({
  id,
  kind: 'artificing',
  name,
  output: { itemId: id, quantity: 1 },
  ingredients: [{ itemId: fragment, quantity: fragmentQuantity }, { itemId: 'artifact-essence', quantity: options.artifactEssenceQuantity ?? 20 }],
  ...(options.sourceDungeonId ? { sourceDungeonId: options.sourceDungeonId } : {}),
  unlock: options.unlock ?? always,
  baseDurationMs: 5000,
  description,
})

export const ARTIFICING_RECIPES: Record<ArtificingRecipeId, ArtificingRecipeDefinition> = {
  'ember-staff': artifactRecipe('ember-staff', 'Ember Staff', 'fire-fragment', 20, 'A blackened staff veined with embers that never cool; each reforging wakes a deeper furnace sealed within its core.'),
  'tideglass-wand': artifactRecipe('tideglass-wand', 'Tideglass Wand', 'water-fragment', 20, 'Sea-blue glass beads with cold water even in dry air, bending every incantation into a steadier and more deliberate current.'),
  'stoneheart-scepter': artifactRecipe('stoneheart-scepter', 'Stoneheart Scepter', 'earth-fragment', 20, 'Carved around a living stone core, the scepter answers every spell with a deeper pulse, as though the earth itself were listening.'),
  'windthread-wand': artifactRecipe('windthread-wand', 'Windthread Wand', 'air-fragment', 20, 'Silverwood bound with threads of captive wind trembles before a spell is spoken, snapping released magic forward like a drawn bowstring.'),
  'wispweave-robe': artifactRecipe('wispweave-robe', 'Wispweave Robe', 'prismatic-fragment', 5, 'Pale spirit-thread tightens around incoming force as though unseen hands were pulling every stitch into place at the moment of impact.'),
  'wispveil-hood': artifactRecipe('wispveil-hood', 'Wispveil Hood', 'prismatic-fragment', 5, 'Violet mist clings to the inside of this hood; beneath its veil, wandering thoughts sharpen and hostile enchantments struggle to take hold.'),
  'galeshard-staff': artifactRecipe('galeshard-staff', 'Galeshard Staff', 'air-fragment', 40, 'A frontier staff cut from wind-scoured crystal, carrying the sharp rhythm of unstable Air.', { sourceDungeonId: 'fractured-approach', unlock: { type: 'boss-kill', bossId: 'corrupted-elemental-gatekeeper' }, artifactEssenceQuantity: 80 }),
}

export const ARTIFICING_RECIPE_ORDER: readonly ArtificingRecipeId[] = ['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'wispweave-robe', 'wispveil-hood', 'galeshard-staff']

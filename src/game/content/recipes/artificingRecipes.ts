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

const normalRecipe = (id: ArtificingRecipeDefinition['id'], name: string, dungeonId: DungeonId): ArtificingRecipeDefinition => ({
  id, kind: 'artificing', name, output: { itemId: id, quantity: 1 }, ingredients: [{ itemId: 'artifact-essence', quantity: 20 }, { itemId: 'life-essence', quantity: 30 }], unlock: { type: 'dungeon-unlocked', dungeonId }, sourceDungeonId: dungeonId, baseDurationMs: 5000, description: `Craft ${name} from materials recovered in ${dungeonId}.`,
})

const act1Recipes = (ids: readonly ArtificingRecipeDefinition['id'][], dungeonId: DungeonId): Record<string, ArtificingRecipeDefinition> => Object.fromEntries(ids.map((id) => [id, normalRecipe(id, id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '), dungeonId)]))
const ACT0_RECIPE_IDS: Array<ArtificingRecipeDefinition['id']> = ['windthread-charm', 'wispglass-earring', 'wispbound-ring', 'grovekeeper-mantle', 'heartseed-necklace', 'predator-hide-mantle', 'fangwire-earring', 'howling-signet', 'greatbear-heartstone', 'ossuary-mantle', 'mourning-glass-earring', 'soulglass-amulet', 'gravebinder-ring', 'edrins-signet', 'galeglass-earring', 'riftwind-ring', 'waystone-pendant', 'fractured-ward-mantle', 'gatekeeper-sigil']

const ACT1_RECIPE_IDS: ArtificingRecipeDefinition['id'][] = ['mistglass-earring', 'reliquary-ring', 'drowned-chain-pendant', 'keepers-tide-seal', 'cinderwire-earring', 'ashbrand-ring', 'emberwatch-mantle', 'revenant-emberstone', 'briar-earring', 'rootbound-ring', 'mossguard-mantle', 'ancient-heart-knot', 'wayfarer-earring', 'crossroads-signet', 'confluence-pendant', 'keepers-roadseal', 'graveglass-earring', 'shardbone-ring', 'mourner-veil-mantle', 'behemoth-heartshard', 'voltglass-earring', 'stormcoil-ring', 'gale-scribe-pendant', 'archivists-conductor', 'starfall-ring', 'lenskeeper-earring', 'astral-pendant', 'fallen-astromancer-lens', 'meridian-ring', 'linebreaker-earring', 'fractured-conduit-pendant', 'leyline-mantle', 'splitters-meridian-core', 'nameless-ring', 'whisper-earring', 'unbound-seal-pendant', 'prelates-unspoken-seal', 'black-sigil-ring', 'inkbound-earring', 'vaultseal-mantle', 'wardens-black-sigil', 'gatebound-ring', 'portal-echo-earring', 'blackgate-pendant', 'voidward-mantle', 'black-gatekeepers-seal']

export const ARTIFICING_RECIPES: Record<ArtificingRecipeId, ArtificingRecipeDefinition> = {
  'ember-staff': artifactRecipe('ember-staff', 'Ember Staff', 'fire-fragment', 20, 'A blackened staff veined with embers that never cool; each reforging wakes a deeper furnace sealed within its core.'),
  'tideglass-wand': artifactRecipe('tideglass-wand', 'Tideglass Wand', 'water-fragment', 20, 'Sea-blue glass beads with cold water even in dry air, bending every incantation into a steadier and more deliberate current.'),
  'stoneheart-scepter': artifactRecipe('stoneheart-scepter', 'Stoneheart Scepter', 'earth-fragment', 20, 'Carved around a living stone core, the scepter answers every spell with a deeper pulse, as though the earth itself were listening.'),
  'windthread-wand': artifactRecipe('windthread-wand', 'Windthread Wand', 'air-fragment', 20, 'Silverwood bound with threads of captive wind trembles before a spell is spoken, snapping released magic forward like a drawn bowstring.'),
  'wispweave-robe': artifactRecipe('wispweave-robe', 'Wispweave Robe', 'prismatic-fragment', 5, 'Pale spirit-thread tightens around incoming force as though unseen hands were pulling every stitch into place at the moment of impact.'),
  'wispveil-hood': artifactRecipe('wispveil-hood', 'Wispveil Hood', 'prismatic-fragment', 5, 'Violet mist clings to the inside of this hood; beneath its veil, wandering thoughts sharpen and hostile enchantments struggle to take hold.'),
  'galeshard-staff': artifactRecipe('galeshard-staff', 'Galeshard Staff', 'air-fragment', 40, 'A frontier staff cut from wind-scoured crystal, carrying the sharp rhythm of unstable Air.', { sourceDungeonId: 'fractured-approach', unlock: { type: 'boss-kill', bossId: 'corrupted-elemental-gatekeeper' }, artifactEssenceQuantity: 80 }),
  'reliquary-scepter': artifactRecipe('reliquary-scepter', 'Reliquary Scepter', 'water-fragment', 40, 'A drowned scepter that turns cold currents into deliberate spellcraft.', { sourceDungeonId: 'flooded-reliquary', unlock: { type: 'boss-kill', bossId: 'drowned-keeper' }, artifactEssenceQuantity: 80 }),
  'pyrebound-staff': artifactRecipe('pyrebound-staff', 'Pyrebound Staff', 'fire-fragment', 40, 'A staff that keeps a watchfire burning through every incantation.', { sourceDungeonId: 'ashen-watch', unlock: { type: 'boss-kill', bossId: 'flamebound-revenant' }, artifactEssenceQuantity: 80 }),
  'rootheart-scepter': artifactRecipe('rootheart-scepter', 'Rootheart Scepter', 'earth-fragment', 40, 'A living scepter that answers each spell with a patient pulse.', { sourceDungeonId: 'rootscar-hollow', unlock: { type: 'boss-kill', bossId: 'rootscar-ancient' }, artifactEssenceQuantity: 80 }),
  ...act1Recipes(ACT0_RECIPE_IDS.slice(0, 5), 'whispering-woods'),
  ...act1Recipes(ACT0_RECIPE_IDS.slice(5, 9), 'howling-den'),
  ...act1Recipes(ACT0_RECIPE_IDS.slice(9, 14), 'abandoned-catacombs'),
  ...act1Recipes(ACT0_RECIPE_IDS.slice(14, 19), 'fractured-approach'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(0, 4), 'flooded-reliquary'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(4, 8), 'ashen-watch'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(8, 12), 'rootscar-hollow'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(12, 16), 'crossroads-of-ruin'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(16, 20), 'graveglass-hollow'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(20, 24), 'stormvault-gallery'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(24, 28), 'starfallen-observatory'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(28, 33), 'broken-meridian'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(33, 37), 'hall-of-unbound-names'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(37, 41), 'vault-of-the-black-sigil'),
  ...act1Recipes(ACT1_RECIPE_IDS.slice(41, 46), 'black-gate'),
} as Record<ArtificingRecipeId, ArtificingRecipeDefinition>

export const ARTIFICING_RECIPE_ORDER: readonly ArtificingRecipeId[] = ['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'wispweave-robe', 'wispveil-hood', 'galeshard-staff', 'reliquary-scepter', 'pyrebound-staff', 'rootheart-scepter', ...ACT0_RECIPE_IDS, ...ACT1_RECIPE_IDS]

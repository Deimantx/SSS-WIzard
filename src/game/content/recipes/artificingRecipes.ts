import type { ItemId, ArtificingRecipeId, DungeonId, RecipeUnlockCondition } from '../../types'
export interface ArtificingRecipeDefinition {
 id: ArtificingRecipeId
 name: string
 output: { itemId: ArtificingRecipeId; quantity: 1 }
 ingredients: { itemId: ItemId; quantity: number }[]
 unlock: RecipeUnlockCondition
 sourceDungeonId: DungeonId
 description?: string
 baseDurationMs: number
}
const whisperingWoodsMonsterKill: RecipeUnlockCondition = { type: 'dungeon-monster-kills', dungeonId: 'whispering-woods', count: 1 }
const howlingDen: RecipeUnlockCondition = { type: 'dungeon-monster-kills', dungeonId: 'howling-den', count: 1 }
const abandonedCatacombs: RecipeUnlockCondition = { type: 'dungeon-monster-kills', dungeonId: 'abandoned-catacombs', count: 1 }

const equipmentRecipe = (id: ArtificingRecipeId, name: string, ingredients: { itemId: ItemId; quantity: number }[], sourceDungeonId: DungeonId, unlock: RecipeUnlockCondition, description: string): ArtificingRecipeDefinition => ({ id, name, output: { itemId: id, quantity: 1 }, ingredients, sourceDungeonId, unlock, baseDurationMs: 5000, description })
export const ARTIFICING_RECIPES: Record<ArtificingRecipeId, ArtificingRecipeDefinition> = {
  'ember-staff': equipmentRecipe('ember-staff', 'Ember Staff', [{ itemId: 'fire-fragment', quantity: 20 }, { itemId: 'wisp-essence', quantity: 20 }, { itemId: 'life-essence', quantity: 100 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A Tier 1 Fire Artifact that grows through its Artifact Path.'),
  'tideglass-wand': equipmentRecipe('tideglass-wand', 'Tideglass Wand', [{ itemId: 'water-fragment', quantity: 20 }, { itemId: 'wisp-essence', quantity: 20 }, { itemId: 'life-essence', quantity: 100 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A Tier 1 Water Artifact that grows through its Artifact Path.'),
  'stoneheart-scepter': equipmentRecipe('stoneheart-scepter', 'Stoneheart Scepter', [{ itemId: 'earth-fragment', quantity: 20 }, { itemId: 'wisp-essence', quantity: 20 }, { itemId: 'life-essence', quantity: 100 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A Tier 1 Earth Artifact that grows through its Artifact Path.'),
  'windthread-wand': equipmentRecipe('windthread-wand', 'Windthread Wand', [{ itemId: 'air-fragment', quantity: 20 }, { itemId: 'wisp-essence', quantity: 20 }, { itemId: 'life-essence', quantity: 100 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A Tier 1 Air Artifact that grows through its Artifact Path.'),
  'prismatic-focus': equipmentRecipe('prismatic-focus', 'Prismatic Focus', [{ itemId: 'prismatic-fragment', quantity: 30 }, { itemId: 'wisp-essence', quantity: 20 }, { itemId: 'life-essence', quantity: 100 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A Tier 1 Prismatic Artifact that grows through its Artifact Path.'),
  'wispweave-robe': equipmentRecipe('wispweave-robe', 'Wispweave Robe', [{ itemId: 'wisp-essence', quantity: 40 }, { itemId: 'grove-bark', quantity: 25 }, { itemId: 'life-essence', quantity: 100 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A Tier 1 Wisp Artifact that grows through its Artifact Path.'),
  'windthread-charm': equipmentRecipe('windthread-charm', 'Windthread Charm', [{ itemId: 'air-fragment', quantity: 48 }, { itemId: 'wisp-essence', quantity: 18 }, { itemId: 'grove-bark', quantity: 3 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A charm that leaves room for one more automation.'),
  'wispveil-hood': equipmentRecipe('wispveil-hood', 'Wispveil Hood', [{ itemId: 'wisp-essence', quantity: 30 }, { itemId: 'prismatic-fragment', quantity: 20 }, { itemId: 'life-essence', quantity: 100 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A Tier 1 Wispveil Artifact that grows through its Artifact Path.'),
  'grovekeeper-mantle': equipmentRecipe('grovekeeper-mantle', 'Grovekeeper Mantle', [{ itemId: 'earth-fragment', quantity: 36 }, { itemId: 'wisp-essence', quantity: 24 }, { itemId: 'grove-bark', quantity: 6 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A mantle of early survivability.'),
  'wispbound-ring': equipmentRecipe('wispbound-ring', 'Wispbound Ring', [{ itemId: 'water-fragment', quantity: 24 }, { itemId: 'air-fragment', quantity: 24 }, { itemId: 'wisp-essence', quantity: 18 }, { itemId: 'grove-bark', quantity: 3 }], 'whispering-woods', whisperingWoodsMonsterKill, 'A ring for Mana and utility.'),
  'heartseed-necklace': equipmentRecipe('heartseed-necklace', 'Heartseed Necklace', [{ itemId: 'heartseed', quantity: 8 }], 'whispering-woods', { type: 'boss-kill', bossId: 'forest-heart' }, 'A living boss material shaped into a protective amulet.'),
  'predator-hide-mantle': equipmentRecipe('predator-hide-mantle', 'Predator-Hide Mantle', [{ itemId: 'predator-hide', quantity: 28 }, { itemId: 'earth-fragment', quantity: 38 }], 'howling-den', howlingDen, 'Physical and status protection from the hunt.'),
  'howling-signet': equipmentRecipe('howling-signet', 'Howling Signet', [{ itemId: 'corrupted-beast-essence', quantity: 12 }, { itemId: 'predator-fang', quantity: 15 }, { itemId: 'water-fragment', quantity: 28 }, { itemId: 'air-fragment', quantity: 28 }], 'howling-den', howlingDen, 'A ring that sustains long combat runs.'),
  'greatbear-heartstone': equipmentRecipe('greatbear-heartstone', 'Greatbear Heartstone', [{ itemId: 'greatbear-core', quantity: 8 }], 'howling-den', { type: 'boss-kill', bossId: 'corrupted-greatbear' }, 'Greatbear cores fused into an unyielding heartstone.'),
  'ossuary-mantle': equipmentRecipe('ossuary-mantle', 'Ossuary Mantle', [{ itemId: 'ossuary-remnant', quantity: 28 }, { itemId: 'soul-residue', quantity: 12 }, { itemId: 'earth-fragment', quantity: 3 }, { itemId: 'prismatic-fragment', quantity: 16 }], 'abandoned-catacombs', abandonedCatacombs, 'General Catacombs defense.'),
  'soulglass-amulet': equipmentRecipe('soulglass-amulet', 'Soulglass Amulet', [{ itemId: 'graveglass-shard', quantity: 25 }, { itemId: 'soul-residue', quantity: 20 }, { itemId: 'fire-fragment', quantity: 124 }, { itemId: 'prismatic-fragment', quantity: 20 }], 'abandoned-catacombs', abandonedCatacombs, 'A Burning and future DoT build amulet.'),
  'gravebinder-ring': equipmentRecipe('gravebinder-ring', 'Gravebinder Ring', [{ itemId: 'graveglass-shard', quantity: 20 }, { itemId: 'soul-residue', quantity: 12 }, { itemId: 'prismatic-fragment', quantity: 16 }], 'abandoned-catacombs', abandonedCatacombs, 'A universal status-build ring.'),
  'edrins-signet': equipmentRecipe('edrins-signet', "Edrin's Signet", [{ itemId: 'edrin-remnant', quantity: 20 }], 'abandoned-catacombs', { type: 'boss-kill', bossId: 'archmage-edrin-shade' }, "Edrin remnants shaped into the Archmage's warding signet."),
}
export const ARTIFICING_RECIPE_ORDER: readonly ArtificingRecipeId[] = ["ember-staff","tideglass-wand","stoneheart-scepter","windthread-wand","prismatic-focus","wispweave-robe","wispveil-hood","windthread-charm","grovekeeper-mantle","wispbound-ring","heartseed-necklace","predator-hide-mantle","howling-signet","greatbear-heartstone","ossuary-mantle","soulglass-amulet","gravebinder-ring","edrins-signet"]

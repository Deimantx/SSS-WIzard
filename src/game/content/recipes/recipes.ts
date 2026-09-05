import { DUNGEONS } from '../dungeons/dungeons'
import { ITEMS } from '../items/items'
import { MONSTERS } from '../monsters'
import type { GameState, ItemId, RecipeCategory, RecipeId, RecipeUnlockCondition } from '../../types'

export interface RecipeDefinition {
  id: RecipeId
  name: string
  output: { itemId: ItemId; quantity: number }
  category: RecipeCategory
  baseDurationMs: number
  manaCost: number
  ingredients: { itemId: ItemId; quantity: number }[]
  unlock: RecipeUnlockCondition
  description?: string
}

const always: RecipeUnlockCondition = { type: 'always' }
const groveSentinel: RecipeUnlockCondition = { type: 'monster-kill', monsterId: 'grove-sentinel' }
const howlingDen: RecipeUnlockCondition = { type: 'dungeon-unlocked', dungeonId: 'howling-den' }
const abandonedCatacombs: RecipeUnlockCondition = { type: 'dungeon-unlocked', dungeonId: 'abandoned-catacombs' }
const equipmentRecipe = (id: RecipeId, name: string, ingredients: { itemId: ItemId; quantity: number }[], baseDurationMs: number, unlock: RecipeUnlockCondition, description: string): RecipeDefinition => ({ id, name, output: { itemId: id, quantity: 1 }, category: 'equipment', baseDurationMs, manaCost: 0, ingredients, unlock, description })

export const RECIPES: Record<RecipeId, RecipeDefinition> = {
  'fire-fragment': { id: 'fire-fragment', name: 'Fire Fragment', output: { itemId: 'fire-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, manaCost: 25, ingredients: [], unlock: always, description: 'Shape Mana into a stable Fire Fragment.' },
  'water-fragment': { id: 'water-fragment', name: 'Water Fragment', output: { itemId: 'water-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, manaCost: 25, ingredients: [], unlock: always, description: 'Shape Mana into a stable Water Fragment.' },
  'earth-fragment': { id: 'earth-fragment', name: 'Earth Fragment', output: { itemId: 'earth-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, manaCost: 25, ingredients: [], unlock: always, description: 'Shape Mana into a stable Earth Fragment.' },
  'air-fragment': { id: 'air-fragment', name: 'Air Fragment', output: { itemId: 'air-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 8000, manaCost: 25, ingredients: [], unlock: always, description: 'Shape Mana into a stable Air Fragment.' },
  'prismatic-fragment': { id: 'prismatic-fragment', name: 'Prismatic Fragment', output: { itemId: 'prismatic-fragment', quantity: 1 }, category: 'material', baseDurationMs: 24000, manaCost: 50, ingredients: [{ itemId: 'fire-fragment', quantity: 2 }, { itemId: 'water-fragment', quantity: 2 }, { itemId: 'earth-fragment', quantity: 2 }, { itemId: 'air-fragment', quantity: 2 }, { itemId: 'life-essence', quantity: 10 }], unlock: always, description: 'Harmonize all four elemental forces through Life Essence.' },

  'ember-staff': equipmentRecipe('ember-staff', 'Ember Staff', [{ itemId: 'fire-fragment', quantity: 48 }, { itemId: 'wisp-essence', quantity: 24 }, { itemId: 'grove-bark', quantity: 3 }], 30000, groveSentinel, 'A staff that makes every Fire spell burn brighter.'),
  'wispwood-wand': equipmentRecipe('wispwood-wand', 'Wispwood Wand', [{ itemId: 'fire-fragment', quantity: 24 }, { itemId: 'air-fragment', quantity: 24 }, { itemId: 'wisp-essence', quantity: 18 }, { itemId: 'grove-bark', quantity: 3 }], 30000, groveSentinel, 'A flexible one-handed caster weapon.'),
  'tide-focus': equipmentRecipe('tide-focus', 'Tide Focus', [{ itemId: 'water-fragment', quantity: 48 }, { itemId: 'wisp-essence', quantity: 18 }, { itemId: 'grove-bark', quantity: 3 }], 30000, groveSentinel, 'A fluid focus that deepens Water barriers.'),
  'stoneweave-robe': equipmentRecipe('stoneweave-robe', 'Stoneweave Robe', [{ itemId: 'earth-fragment', quantity: 48 }, { itemId: 'wisp-essence', quantity: 18 }, { itemId: 'grove-bark', quantity: 3 }], 30000, groveSentinel, 'A heavy robe that turns barriers into shelter.'),
  'windthread-charm': equipmentRecipe('windthread-charm', 'Windthread Charm', [{ itemId: 'air-fragment', quantity: 48 }, { itemId: 'wisp-essence', quantity: 18 }, { itemId: 'grove-bark', quantity: 3 }], 30000, groveSentinel, 'A charm that leaves room for one more automation.'),
  'wispveil-hood': equipmentRecipe('wispveil-hood', 'Wispveil Hood', [{ itemId: 'water-fragment', quantity: 24 }, { itemId: 'air-fragment', quantity: 24 }, { itemId: 'wisp-essence', quantity: 24 }, { itemId: 'grove-bark', quantity: 3 }], 30000, groveSentinel, 'A steady hood for the early caster.'),
  'grovekeeper-mantle': equipmentRecipe('grovekeeper-mantle', 'Grovekeeper Mantle', [{ itemId: 'earth-fragment', quantity: 36 }, { itemId: 'wisp-essence', quantity: 24 }, { itemId: 'grove-bark', quantity: 6 }], 30000, groveSentinel, 'A mantle of early survivability.'),
  'wispbound-ring': equipmentRecipe('wispbound-ring', 'Wispbound Ring', [{ itemId: 'water-fragment', quantity: 24 }, { itemId: 'air-fragment', quantity: 24 }, { itemId: 'wisp-essence', quantity: 18 }, { itemId: 'grove-bark', quantity: 3 }], 30000, groveSentinel, 'A ring for Mana and utility.'),
  'heartseed-necklace': equipmentRecipe('heartseed-necklace', 'Heartseed Necklace', [{ itemId: 'heartseed', quantity: 20 }], 30000, { type: 'boss-kill', bossId: 'forest-heart' }, 'A living boss material shaped into a protective amulet.'),

  'fangbound-dagger': equipmentRecipe('fangbound-dagger', 'Fangbound Dagger', [{ itemId: 'predator-fang', quantity: 30 }, { itemId: 'air-fragment', quantity: 2 }, { itemId: 'fire-fragment', quantity: 2 }], 30000, howlingDen, 'A quick blade for Basic Attack builds.'),
  'fangbound-buckler': equipmentRecipe('fangbound-buckler', 'Fangbound Buckler', [{ itemId: 'predator-hide', quantity: 24 }, { itemId: 'predator-fang', quantity: 10 }, { itemId: 'earth-fragment', quantity: 3 }], 30000, howlingDen, 'A defensive one-handed offhand.'),
  'corrupted-howlstaff': equipmentRecipe('corrupted-howlstaff', 'Corrupted Howlstaff', [{ itemId: 'greatbear-core', quantity: 3 }, { itemId: 'corrupted-beast-essence', quantity: 20 }, { itemId: 'air-fragment', quantity: 3 }, { itemId: 'prismatic-fragment', quantity: 2 }], 30000, howlingDen, 'A fast multi-school spellcaster staff.'),
  'razorclaw-circlet': equipmentRecipe('razorclaw-circlet', 'Razorclaw Circlet', [{ itemId: 'predator-fang', quantity: 20 }, { itemId: 'predator-hide', quantity: 8 }, { itemId: 'air-fragment', quantity: 2 }], 30000, howlingDen, 'A circlet for Crit and speed.'),
  'predator-hide-mantle': equipmentRecipe('predator-hide-mantle', 'Predator-Hide Mantle', [{ itemId: 'predator-hide', quantity: 28 }, { itemId: 'earth-fragment', quantity: 3 }], 30000, howlingDen, 'Physical and status protection from the hunt.'),
  'greatbear-vestment': equipmentRecipe('greatbear-vestment', 'Greatbear Vestment', [{ itemId: 'predator-hide', quantity: 40 }, { itemId: 'greatbear-core', quantity: 3 }, { itemId: 'earth-fragment', quantity: 4 }], 30000, howlingDen, 'A tank vestment built for endurance.'),
  'howling-signet': equipmentRecipe('howling-signet', 'Howling Signet', [{ itemId: 'corrupted-beast-essence', quantity: 12 }, { itemId: 'predator-fang', quantity: 15 }, { itemId: 'water-fragment', quantity: 2 }, { itemId: 'air-fragment', quantity: 2 }], 30000, howlingDen, 'A ring that sustains long combat runs.'),
  'greatbear-heartstone': equipmentRecipe('greatbear-heartstone', 'Greatbear Heartstone', [{ itemId: 'greatbear-core', quantity: 21 }], 30000, { type: 'boss-kill', bossId: 'corrupted-greatbear' }, 'Greatbear cores fused into an unyielding heartstone.'),

  'graveglass-wand': equipmentRecipe('graveglass-wand', 'Graveglass Wand', [{ itemId: 'graveglass-shard', quantity: 30 }, { itemId: 'soul-residue', quantity: 9 }, { itemId: 'prismatic-fragment', quantity: 2 }], 30000, abandonedCatacombs, 'A one-handed wand for efficient spellcasting.'),
  'edrins-remnant-staff': equipmentRecipe('edrins-remnant-staff', "Edrin's Remnant Staff", [{ itemId: 'edrin-remnant', quantity: 5 }, { itemId: 'graveglass-shard', quantity: 40 }, { itemId: 'soul-residue', quantity: 18 }, { itemId: 'prismatic-fragment', quantity: 4 }], 30000, { type: 'boss-kill', bossId: 'archmage-edrin-shade' }, 'A high-end staff for status builds.'),
  'soulward-focus': equipmentRecipe('soulward-focus', 'Soulward Focus', [{ itemId: 'soul-residue', quantity: 15 }, { itemId: 'graveglass-shard', quantity: 20 }, { itemId: 'water-fragment', quantity: 3 }, { itemId: 'prismatic-fragment', quantity: 2 }], 30000, abandonedCatacombs, 'A focus that turns broken Barriers into Mana.'),
  'soulward-shield': equipmentRecipe('soulward-shield', 'Soulward Shield', [{ itemId: 'ossuary-remnant', quantity: 24 }, { itemId: 'graveglass-shard', quantity: 20 }, { itemId: 'earth-fragment', quantity: 4 }, { itemId: 'prismatic-fragment', quantity: 2 }], 30000, abandonedCatacombs, 'A defensive caster shield.'),
  'acolyte-vestments': equipmentRecipe('acolyte-vestments', 'Acolyte Vestments', [{ itemId: 'soul-residue', quantity: 18 }, { itemId: 'ossuary-remnant', quantity: 16 }, { itemId: 'water-fragment', quantity: 3 }, { itemId: 'prismatic-fragment', quantity: 2 }], 30000, abandonedCatacombs, 'Elemental-resistant defensive caster wear.'),
  'wraithveil-hood': equipmentRecipe('wraithveil-hood', 'Wraithveil Hood', [{ itemId: 'soul-residue', quantity: 15 }, { itemId: 'graveglass-shard', quantity: 20 }, { itemId: 'air-fragment', quantity: 3 }, { itemId: 'prismatic-fragment', quantity: 2 }], 20000, abandonedCatacombs, 'A hood for status casters.'),
  'ossuary-mantle': equipmentRecipe('ossuary-mantle', 'Ossuary Mantle', [{ itemId: 'ossuary-remnant', quantity: 28 }, { itemId: 'soul-residue', quantity: 12 }, { itemId: 'earth-fragment', quantity: 3 }, { itemId: 'prismatic-fragment', quantity: 2 }], 30000, abandonedCatacombs, 'General Catacombs defense.'),
  'soulglass-amulet': equipmentRecipe('soulglass-amulet', 'Soulglass Amulet', [{ itemId: 'graveglass-shard', quantity: 25 }, { itemId: 'soul-residue', quantity: 15 }, { itemId: 'fire-fragment', quantity: 3 }, { itemId: 'prismatic-fragment', quantity: 2 }], 30000, abandonedCatacombs, 'A Burning and future DoT build amulet.'),
  'gravebinder-ring': equipmentRecipe('gravebinder-ring', 'Gravebinder Ring', [{ itemId: 'graveglass-shard', quantity: 20 }, { itemId: 'soul-residue', quantity: 12 }, { itemId: 'prismatic-fragment', quantity: 2 }], 30000, abandonedCatacombs, 'A universal status-build ring.'),
  'edrins-signet': equipmentRecipe('edrins-signet', "Edrin's Signet", [{ itemId: 'edrin-remnant', quantity: 35 }], 30000, { type: 'boss-kill', bossId: 'archmage-edrin-shade' }, "Edrin remnants shaped into the Archmage's warding signet."),
}

export const RECIPE_ORDER: readonly RecipeId[] = [
  'fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment', 'prismatic-fragment',
  'ember-staff', 'wispwood-wand', 'tide-focus', 'stoneweave-robe', 'windthread-charm', 'wispveil-hood', 'grovekeeper-mantle', 'wispbound-ring', 'heartseed-necklace',
  'fangbound-dagger', 'fangbound-buckler', 'corrupted-howlstaff', 'razorclaw-circlet', 'predator-hide-mantle', 'greatbear-vestment', 'howling-signet', 'greatbear-heartstone',
  'graveglass-wand', 'edrins-remnant-staff', 'soulward-focus', 'soulward-shield', 'acolyte-vestments', 'wraithveil-hood', 'ossuary-mantle', 'soulglass-amulet', 'gravebinder-ring', 'edrins-signet',
]

const hasProgress = (progress: GameState['progress'], monsterId: string, count: number) => Math.max(progress.lifetimeKillsByMonster[monsterId as keyof typeof progress.lifetimeKillsByMonster] ?? 0, progress.bossKillsByBoss[monsterId as keyof typeof progress.bossKillsByBoss] ?? 0) >= count

export const isRecipeUnlocked = (state: Pick<GameState, 'progress'>, recipe: RecipeDefinition) => {
  switch (recipe.unlock.type) {
    case 'always': return true
    case 'first-dungeon-boss-kill': return state.progress.firstBossKill
    case 'boss-kill': return Boolean(MONSTERS[recipe.unlock.bossId]) && hasProgress(state.progress, recipe.unlock.bossId, Math.max(1, recipe.unlock.count ?? 1))
    case 'monster-kill': return Boolean(MONSTERS[recipe.unlock.monsterId]) && hasProgress(state.progress, recipe.unlock.monsterId, Math.max(1, recipe.unlock.count ?? 1))
    case 'dungeon-unlocked': {
      const dungeon = DUNGEONS[recipe.unlock.dungeonId]
      return Boolean(dungeon) && (dungeon.unlock?.type !== 'boss-kill' || hasProgress(state.progress, dungeon.unlock.bossId, 1))
    }
  }
}

export const getRecipeUnlockRequirement = (recipe: RecipeDefinition): string | null => {
  switch (recipe.unlock.type) {
    case 'always': return null
    case 'first-dungeon-boss-kill': return 'Defeat the first dungeon boss to unlock this recipe.'
    case 'boss-kill': return `Defeat ${MONSTERS[recipe.unlock.bossId]?.name ?? recipe.unlock.bossId}${(recipe.unlock.count ?? 1) > 1 ? ` ${recipe.unlock.count} times` : ''} to unlock this recipe.`
    case 'monster-kill': return `Defeat ${MONSTERS[recipe.unlock.monsterId]?.name ?? recipe.unlock.monsterId}${(recipe.unlock.count ?? 1) > 1 ? ` ${recipe.unlock.count} times` : ''} to unlock this recipe.`
    case 'dungeon-unlocked': return `Unlock ${DUNGEONS[recipe.unlock.dungeonId]?.name ?? recipe.unlock.dungeonId} to access this recipe.`
  }
}

export const validateRecipeDefinitions = (recipes: Record<string, RecipeDefinition> = RECIPES, order: readonly string[] = RECIPE_ORDER) => {
  const errors: string[] = []
  const ids = Object.values(recipes).map((recipe) => recipe.id)
  if (new Set(ids).size !== ids.length) errors.push('duplicate recipe id')
  Object.entries(recipes).forEach(([key, recipe]) => {
    if (key !== recipe.id) errors.push(`${key}: key/id mismatch`)
    if (!ITEMS[recipe.output.itemId]) errors.push(`${recipe.id}: unknown output item ${recipe.output.itemId}`)
    if (!Number.isInteger(recipe.output.quantity) || recipe.output.quantity < 1) errors.push(`${recipe.id}: output quantity must be positive`)
    if (!Number.isFinite(recipe.baseDurationMs) || recipe.baseDurationMs <= 0 || !Number.isFinite(recipe.manaCost) || recipe.manaCost < 0) errors.push(`${recipe.id}: invalid duration or Mana cost`)
    recipe.ingredients.forEach((ingredient) => { if (!ITEMS[ingredient.itemId]) errors.push(`${recipe.id}: unknown ingredient ${ingredient.itemId}`); if (!Number.isInteger(ingredient.quantity) || ingredient.quantity <= 0) errors.push(`${recipe.id}: invalid ingredient quantity`) })
    if (recipe.category === 'equipment' && ITEMS[recipe.output.itemId]?.kind !== 'equipment') errors.push(`${recipe.id}: equipment recipe must output equipment`)
    if (ITEMS[recipe.output.itemId]?.kind === 'equipment' && recipe.category !== 'equipment') errors.push(`${recipe.id}: Equipment output must use category equipment`)
    if (ITEMS[recipe.output.itemId]?.kind === 'equipment' && recipe.output.quantity !== 1) errors.push(`${recipe.id}: Equipment recipe output quantity must be 1`)
    if (recipe.unlock.type === 'boss-kill' && !MONSTERS[recipe.unlock.bossId]) errors.push(`${recipe.id}: unlock boss must be a known monster`)
    if (recipe.unlock.type === 'monster-kill' && !MONSTERS[recipe.unlock.monsterId]) errors.push(`${recipe.id}: unlock monster must be known`)
    if (recipe.unlock.type === 'dungeon-unlocked' && !DUNGEONS[recipe.unlock.dungeonId]) errors.push(`${recipe.id}: unlock dungeon must be known`)
  })
  if (new Set(order).size !== order.length) errors.push('RECIPE_ORDER contains duplicates')
  if (order.length !== Object.keys(recipes).length || order.some((id) => !recipes[id as RecipeId])) errors.push('RECIPE_ORDER must contain every recipe exactly once')
  Object.entries(ITEMS).filter(([, item]) => item.kind === 'equipment').forEach(([itemId]) => {
    const outputRecipes = Object.values(recipes).filter((recipe) => recipe.output.itemId === itemId)
    if (outputRecipes.length !== 1) errors.push(`${itemId}: Equipment must have exactly one Transmutation recipe (found ${outputRecipes.length})`)
  })
  if (errors.length && import.meta.env.DEV) console.error(`[recipes] ${errors.join('; ')}`)
  return errors
}

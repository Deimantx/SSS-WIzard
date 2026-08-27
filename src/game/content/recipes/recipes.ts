import type { ItemId, RecipeCategory, RecipeId, RecipeUnlockCondition } from '../../types'

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

export const RECIPES: Record<RecipeId, RecipeDefinition> = {
  'fire-fragment': { id: 'fire-fragment', name: 'Fire Fragment', output: { itemId: 'fire-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 6000, manaCost: 15, ingredients: [], unlock: { type: 'always' }, description: 'Shape Mana into a stable Fire Fragment.' },
  'water-fragment': { id: 'water-fragment', name: 'Water Fragment', output: { itemId: 'water-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 6000, manaCost: 15, ingredients: [], unlock: { type: 'always' }, description: 'Shape Mana into a stable Water Fragment.' },
  'earth-fragment': { id: 'earth-fragment', name: 'Earth Fragment', output: { itemId: 'earth-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 6000, manaCost: 15, ingredients: [], unlock: { type: 'always' }, description: 'Shape Mana into a stable Earth Fragment.' },
  'air-fragment': { id: 'air-fragment', name: 'Air Fragment', output: { itemId: 'air-fragment', quantity: 1 }, category: 'elemental', baseDurationMs: 6000, manaCost: 15, ingredients: [], unlock: { type: 'always' }, description: 'Shape Mana into a stable Air Fragment.' },
  'prismatic-fragment': { id: 'prismatic-fragment', name: 'Prismatic Fragment', output: { itemId: 'prismatic-fragment', quantity: 1 }, category: 'material', baseDurationMs: 18000, manaCost: 0, ingredients: [{ itemId: 'fire-fragment', quantity: 2 }, { itemId: 'water-fragment', quantity: 2 }, { itemId: 'earth-fragment', quantity: 2 }, { itemId: 'air-fragment', quantity: 2 }, { itemId: 'life-essence', quantity: 10 }], unlock: { type: 'always' }, description: 'Harmonize all four elemental forces through Life Essence.' },
  'ember-staff': { id: 'ember-staff', name: 'Ember Staff', output: { itemId: 'ember-staff', quantity: 1 }, category: 'equipment', baseDurationMs: 8000, manaCost: 0, ingredients: [{ itemId: 'fire-fragment', quantity: 4 }, { itemId: 'wisp-essence', quantity: 4 }, { itemId: 'grove-bark', quantity: 1 }], unlock: { type: 'first-grove-sentinel-kill' }, description: 'A staff that makes every basic hit burn brighter.' },
  'tide-focus': { id: 'tide-focus', name: 'Tide Focus', output: { itemId: 'tide-focus', quantity: 1 }, category: 'equipment', baseDurationMs: 9000, manaCost: 0, ingredients: [{ itemId: 'water-fragment', quantity: 4 }, { itemId: 'wisp-essence', quantity: 3 }, { itemId: 'grove-bark', quantity: 1 }], unlock: { type: 'first-grove-sentinel-kill' }, description: 'A fluid focus that deepens Water barriers.' },
  'stoneweave-robe': { id: 'stoneweave-robe', name: 'Stoneweave Robe', output: { itemId: 'stoneweave-robe', quantity: 1 }, category: 'equipment', baseDurationMs: 9000, manaCost: 0, ingredients: [{ itemId: 'earth-fragment', quantity: 4 }, { itemId: 'wisp-essence', quantity: 3 }, { itemId: 'grove-bark', quantity: 1 }], unlock: { type: 'first-grove-sentinel-kill' }, description: 'A heavy robe that turns barriers into shelter.' },
  'windthread-charm': { id: 'windthread-charm', name: 'Windthread Charm', output: { itemId: 'windthread-charm', quantity: 1 }, category: 'equipment', baseDurationMs: 9000, manaCost: 0, ingredients: [{ itemId: 'air-fragment', quantity: 4 }, { itemId: 'wisp-essence', quantity: 3 }, { itemId: 'grove-bark', quantity: 1 }], unlock: { type: 'first-grove-sentinel-kill' }, description: 'A charm that leaves room for one more automation.' },
}

export const RECIPE_ORDER: readonly RecipeId[] = ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment', 'prismatic-fragment', 'ember-staff', 'tide-focus', 'stoneweave-robe', 'windthread-charm']

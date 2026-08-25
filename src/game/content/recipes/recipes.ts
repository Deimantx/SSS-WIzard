import type { EquipmentSlot, ItemId } from '../../types'

export interface RecipeDefinition {
  id: string
  output: ItemId
  name: string
  slot: EquipmentSlot
  durationMs: number
  focusCost: number
  ingredients: { itemId: ItemId; quantity: number }[]
}

export const RECIPES: Record<string, RecipeDefinition> = {
  'ember-staff': { id: 'ember-staff', output: 'ember-staff', name: 'Ember Staff', slot: 'weapon', durationMs: 8000, focusCost: 20, ingredients: [{ itemId: 'fire-fragment', quantity: 4 }, { itemId: 'wisp-essence', quantity: 4 }, { itemId: 'grove-bark', quantity: 1 }] },
  'tide-focus': { id: 'tide-focus', output: 'tide-focus', name: 'Tide Focus', slot: 'focus', durationMs: 9000, focusCost: 20, ingredients: [{ itemId: 'water-fragment', quantity: 4 }, { itemId: 'wisp-essence', quantity: 3 }, { itemId: 'grove-bark', quantity: 1 }] },
  'stoneweave-robe': { id: 'stoneweave-robe', output: 'stoneweave-robe', name: 'Stoneweave Robe', slot: 'robe', durationMs: 9000, focusCost: 20, ingredients: [{ itemId: 'earth-fragment', quantity: 4 }, { itemId: 'wisp-essence', quantity: 3 }, { itemId: 'grove-bark', quantity: 1 }] },
  'windthread-charm': { id: 'windthread-charm', output: 'windthread-charm', name: 'Windthread Charm', slot: 'charm', durationMs: 9000, focusCost: 20, ingredients: [{ itemId: 'air-fragment', quantity: 4 }, { itemId: 'wisp-essence', quantity: 3 }, { itemId: 'grove-bark', quantity: 1 }] },
}

import type { ItemId } from '../../../types'

export interface ArcaneRegistrySetDefinition {
  id: string
  name: string
  description: string
  entryIds: readonly ItemId[]
  reputationReward: number
  advancementPointsReward: number
}

export const ARCANE_REGISTRY_SETS: readonly ArcaneRegistrySetDefinition[] = [
  { id: 'ember-fundamentals', name: 'Ember Fundamentals', description: 'Materials and tools that establish a Fire practice.', entryIds: ['fire-fragment', 'ember-staff'], reputationReward: 35, advancementPointsReward: 1 },
  { id: 'fourfold-resonance', name: 'Fourfold Resonance', description: 'A record of each elemental resonance fragment.', entryIds: ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'], reputationReward: 75, advancementPointsReward: 1 },
  { id: 'artificer-primer', name: 'Artificer’s Primer', description: 'A first record of magical equipment and its making.', entryIds: ['artifact-essence', 'ember-staff'], reputationReward: 50, advancementPointsReward: 1 },
]

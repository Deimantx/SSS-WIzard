import type { ItemId } from '../../types'
export interface GuildProjectDefinition { id: string; name: string; description: string; requirements: readonly { itemId: ItemId; quantity: number }[]; reputationReward: number; advancementPointsReward: number }
export const GUILD_PROJECTS: readonly GuildProjectDefinition[] = [
  { id: 'restore-arcane-archive', name: 'Restore the Arcane Archive', description: 'Reinforce the Guild stacks with elemental records and stable resonance.', requirements: [{ itemId: 'fire-fragment', quantity: 12 }, { itemId: 'water-fragment', quantity: 12 }, { itemId: 'air-fragment', quantity: 12 }, { itemId: 'prismatic-fragment', quantity: 3 }], reputationReward: 220, advancementPointsReward: 1 },
  { id: 'expand-research-wing', name: 'Expand the Research Wing', description: 'Supply the annex with catalysts for longer-running school studies.', requirements: [{ itemId: 'artifact-essence', quantity: 20 }, { itemId: 'water-fragment', quantity: 8 }], reputationReward: 180, advancementPointsReward: 1 },
  { id: 'rebuild-transmutation-hall', name: 'Rebuild the Transmutation Hall', description: 'Restore the marked arrays used by the Guild?s materialists.', requirements: [{ itemId: 'fire-fragment', quantity: 10 }, { itemId: 'earth-fragment', quantity: 10 }, { itemId: 'air-fragment', quantity: 10 }], reputationReward: 180, advancementPointsReward: 1 },
]

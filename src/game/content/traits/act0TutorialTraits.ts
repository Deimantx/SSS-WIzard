import type { TraitDefinition } from '../../systems/combat/combatTypes'

export const ACT0_TUTORIAL_TRAITS: Record<string, TraitDefinition> = {
  'tutorial-living-stone': {
    id: 'tutorial-living-stone',
    name: 'Living Stone',
    description: 'At 60% Health, gains one Barrier equal to 25% of its maximum Health.',
    rules: [{ id: 'tutorial-living-stone-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 60 }, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.25 }, mode: 'replace-if-stronger', durationMs: null, tags: ['barrier'] }], oncePerEncounter: true }],
  },
  'tutorial-restorative-tide': {
    id: 'tutorial-restorative-tide',
    name: 'Restorative Tide',
    description: 'At 55% Health, restores 15% of its maximum Health once.',
    rules: [{ id: 'tutorial-restorative-tide-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 55 }, effects: [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.15 }, tags: ['heal'] }], oncePerEncounter: true }],
  },
}

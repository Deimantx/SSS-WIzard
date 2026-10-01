import type { TraitDefinition } from '../../systems/combat/combatTypes'

export const REGIONAL_TRAIT_DEFINITIONS: Record<string, TraitDefinition> = {
  'drowned-acolyte-devotion': {
    id: 'drowned-acolyte-devotion', name: 'Drowned Devotion', description: 'Receives 10% more Barrier.',
    modifiers: [{ key: 'barrier-received-percent', value: 0.1 }],
  },
  'remnant-marauder-pressure': {
    id: 'remnant-marauder-pressure', name: 'Ruin Pressure', description: 'Deals 15% more damage to Vulnerable targets.',
    modifiers: [{ key: 'damage-dealt-percent', value: 0.15, condition: { type: 'target-has-status', statusId: 'vulnerable' } }],
  },
  'silent-mourner-fade': {
    id: 'silent-mourner-fade', name: 'Last Mourning', description: 'At 35% health, gains Spectral Fade once.',
    rules: [{ id: 'silent-mourner-fade-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 35 }, effects: [{ type: 'apply-status', target: 'self', statusId: 'spectral-fade' }], oncePerEncounter: true }],
  },
  'flamebound-rekindle': {
    id: 'flamebound-rekindle', name: 'Rekindle', description: 'At 35% Health, restores 14% of its Max Health once.',
    rules: [{ id: 'flamebound-rekindle-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 35 }, effects: [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.14 }, tags: ['heal', 'direct'] }], oncePerEncounter: true }],
  },
  'rootscar-ancient-regrowth': {
    id: 'rootscar-ancient-regrowth', name: 'Ancient Regrowth', description: 'At 35% Health, restores 15% of its Max Health once.',
    rules: [{ id: 'rootscar-ancient-regrowth-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 35 }, effects: [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.15 }, tags: ['heal', 'direct'] }], oncePerEncounter: true }],
  },
  'meridian-splitter-severed-phase': {
    id: 'meridian-splitter-severed-phase', name: 'Severed Meridian', description: 'At 50% Health, gains Meridian Overload and changes to the Severed pattern once.',
    rules: [{ id: 'meridian-splitter-severed-phase-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 50 }, effects: [{ type: 'apply-status', target: 'self', statusId: 'meridian-overload' }, { type: 'set-action-pattern', target: 'self', patternId: 'severed' }], oncePerEncounter: true }],
  },
  'black-gatekeeper-unbound-phase': {
    id: 'black-gatekeeper-unbound-phase', name: 'Gate Unbound', description: 'At 50% Health, gains Gate Unbound and changes to the Unbound Gate pattern once.',
    rules: [{ id: 'black-gatekeeper-unbound-phase-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 50 }, effects: [{ type: 'apply-status', target: 'self', statusId: 'gate-unbound' }, { type: 'set-action-pattern', target: 'self', patternId: 'unbound' }], oncePerEncounter: true }],
  },
}

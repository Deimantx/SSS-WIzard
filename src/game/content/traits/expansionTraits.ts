import type { TraitDefinition, TraitId } from '../../systems/combat/combatTypes'

const phaseTrait = (id: string, name: string, phase: string, haste = false): TraitDefinition => ({
  id,
  name,
  description: `At 50% Health, enters the ${phase} phase once${haste ? ' and gains Haste' : ''}.`,
  rules: [{
    id: `${id.replace(/-phase$/, '')}-phase-threshold`,
    event: 'on-hp-threshold',
    condition: { type: 'self-hp-below-percent', percent: 50 },
    oncePerEncounter: true,
    effects: [
      { type: 'set-action-pattern', target: 'self', patternId: 'phase-two' },
      ...(haste ? [{ type: 'apply-status' as const, target: 'self' as const, statusId: 'haste' as const }] : []),
    ],
  }],
})

export const EXPANSION_PHASE_TRAITS: Partial<Record<TraitId, TraitDefinition>> = {
  'moonwake-leviathan-phase': phaseTrait('moonwake-leviathan-phase', 'Rising Tide', 'awakened'),
  'furnace-maw-phase': phaseTrait('furnace-maw-phase', 'Overheat', 'overheated', true),
  'tempest-sovereign-phase': phaseTrait('tempest-sovereign-phase', 'Crowned Tempest', 'sovereign storm', true),
  'unmade-magister-phase': phaseTrait('unmade-magister-phase', 'Unbound Formula', 'unbound'),
  'pyrehold-castellan-phase': phaseTrait('pyrehold-castellan-phase', 'Castellan’s Last Command', 'last command', true),
  'drowned-regent-phase': phaseTrait('drowned-regent-phase', 'Sovereign Depths', 'deep throne'),
  'steam-tyrant-phase': phaseTrait('steam-tyrant-phase', 'Critical Pressure', 'critical pressure', true),
  'sepulcher-flamekeeper-phase': phaseTrait('sepulcher-flamekeeper-phase', 'Eternal Flame', 'eternal flame'),
  'deep-bell-saint-phase': phaseTrait('deep-bell-saint-phase', 'Second Toll', 'second toll'),
  'abbot-ninth-gale-phase': phaseTrait('abbot-ninth-gale-phase', 'Ninth Wind', 'ninth wind', true),
  'closed-index-phase': phaseTrait('closed-index-phase', 'Open Index', 'open index'),
}

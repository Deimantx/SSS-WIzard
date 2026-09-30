import type { TraitDefinition, TraitId } from '../../systems/combat/combatTypes'

const ACT1_TRAIT_IDS: TraitId[] = [
  'drowned-acolyte-devotion', 'reliquary-slime-engulf', 'mist-wraith-fade', 'rune-leech-siphon', 'cinder-hound-flameblood', 'flamebound-rekindle', 'rootscar-ancient-regrowth', 'ash-cultist-fan', 'fire-elemental-emberheart', 'lava-eel-molten-hide', 'thorn-maw-venom', 'rootbound-stalker-ambush', 'briar-sprite-bloom', 'moss-carapace-regrowth', 'remnant-marauder-pressure', 'arcane-binder-binding', 'broken-construct-ward', 'rift-archer-precision', 'graveglass-shade-cursed', 'bone-shardling-brittle', 'silent-mourner-fade', 'crypt-guardian-ward', 'volt-wisp-static', 'static-armor-ward', 'gale-scribe-acceleration', 'charged-seeker-twin-arc', 'starbound-eye-gaze', 'astral-husk-weight', 'orbiting-fragment-ward', 'lenskeeper-disruption', 'meridian-warden-ward', 'fractured-channeler-split', 'arc-surge-vulnerability', 'linebreaker-disruption', 'name-eater-silence', 'bound-echo-repetition', 'hollow-liturgist-curse', 'whisper-archivist-erasure', 'sigil-guardian-ward', 'black-seal-parasite-corruption', 'vault-devourer-regrowth', 'inkbound-specter-curse', 'gatebound-remnant-cleave', 'black-rift-stalker-corruption', 'portalbound-acolyte-mute', 'sealbreaker-construct-ward', 'meridian-splitter-severed-phase',
]

const genericAct1Traits: Record<string, TraitDefinition> = Object.fromEntries(ACT1_TRAIT_IDS.map((id) => [id, {
  id, name: id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '), description: "A distinct Act 1 combat trait shaping this creature's behavior.",
}]))

export const ACT1_TRAIT_DEFINITIONS: Record<string, TraitDefinition> = {
  ...genericAct1Traits,
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
}

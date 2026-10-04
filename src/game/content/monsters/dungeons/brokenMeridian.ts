import type { MonsterId } from '../../../types'
import { action, basic, type MonsterDefinition } from '../monsterTypes'
import { makeCombatMonster, type CombatMonsterSpec } from '../combatMonsterAuthoring'

const specs: CombatMonsterSpec[] = [
  { locationId: 'broken-meridian', id: 'meridian-warden', combatV2: true, primaryAffinity: 'earth', basicAttackElement: 'earth', targetPower: 8000, name: 'Meridian Warden', subtitle: 'A guardian holding four broken currents apart', hp: 3625, damage: 112, defense: 70, time: 2300, specials: [{ id: 'meridian-ward', name: 'Meridian Ward', barrier: 0.09 }, { id: 'current-strike', name: 'Current Strike', description: 'The Warden strikes with Earth and Arcane force for 1.5× Basic damage in total.', damage: [{ type: 'earth', coefficient: 0.9 }, { type: 'arcane', coefficient: 0.6 }] }] },
  { locationId: 'broken-meridian', id: 'fractured-channeler', combatV2: true, primaryAffinity: 'water', basicAttackElement: 'water', targetPower: 8350, name: 'Fractured Channeler', subtitle: 'A caster split across incompatible elements', hp: 3250, damage: 118, defense: 48, time: 2300, specials: [{ id: 'split-channel', name: 'Split Channel', description: 'Fire and Water strikes hit together for 1.4× Basic damage in total.', damage: [{ type: 'fire', coefficient: 0.7 }, { type: 'water', coefficient: 0.7 }] }, { id: 'unstable-channel', name: 'Unstable Channel', status: { id: 'arcane-disruption' } }] },
  { locationId: 'broken-meridian', id: 'arc-surge-horror', combatV2: true, primaryAffinity: 'arcane', basicAttackElement: 'arcane', resonanceYield: { arcane: 10 }, targetPower: 8700, name: 'Arc Surge Horror', subtitle: 'A current given teeth by a failed meridian', hp: 5000, damage: 120, defense: 58, time: 2300, specials: [{ id: 'arc-surge', name: 'Arc Surge', damage: [{ type: 'arcane', coefficient: 1.5 }], status: { id: 'vulnerable' } }, { id: 'surge', name: 'Surge', status: { id: 'haste', target: 'self' } }] },
  { locationId: 'broken-meridian', id: 'linebreaker-shade', combatV2: true, primaryAffinity: 'air', basicAttackElement: 'air', targetPower: 9050, name: 'Linebreaker Shade', subtitle: 'A shadow that cuts the leyline wherever it passes', hp: 2500, damage: 115, defense: 46, time: 2300, icon: { portraitIcon: 'ghost' }, specials: [{ id: 'linebreak', name: 'Linebreak', damage: [{ type: 'air', coefficient: 1.25 }, { type: 'arcane', coefficient: 0.45 }], status: { id: 'arcane-disruption' } }, { id: 'shade-step', name: 'Shade Step', status: { id: 'spectral-fade', target: 'self' } }] },
  {
    locationId: 'broken-meridian', id: 'meridian-splitter', combatV2: true, primaryAffinity: 'arcane', basicAttackElement: 'arcane', targetPower: 11800,
    name: 'Meridian Splitter', subtitle: "The intelligence that made the frontier's fracture permanent", hp: 34000, damage: 135, defense: 85, time: 2600,
    resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 }, resonanceYield: { arcane: 125, fire: 100, water: 100, earth: 100, air: 100 }, boss: true,
    combatV2Traits: ['meridian-splitter-severed-phase'],
    specials: [
      { id: 'flame-line', name: 'Flame Line', damage: [{ type: 'fire', coefficient: 1.2 }] },
      { id: 'flood-line', name: 'Flood Line', damage: [{ type: 'water', coefficient: 1.2 }] },
      { id: 'stone-line', name: 'Stone Line', damage: [{ type: 'earth', coefficient: 1.2 }] },
      { id: 'gale-line', name: 'Gale Line', damage: [{ type: 'air', coefficient: 1.2 }] },
      { id: 'meridian-barrier', name: 'Meridian Barrier', barrier: 0.08 },
      { id: 'severed-meridian', name: 'Severed Meridian', actionTimeMs: 3400, description: 'The Splitter tears through the Arcane seam for 2.3× Basic damage after a long cast.', damage: [{ type: 'arcane', coefficient: 2.3 }] },
      { id: 'shatter-tide', name: 'Shatter Tide', description: 'Fire and Water currents strike together for 1.6× Basic damage.', damage: [{ type: 'fire', coefficient: 0.8 }, { type: 'water', coefficient: 0.8 }] },
      { id: 'crosswind-fracture', name: 'Crosswind Fracture', description: 'Earth and Air currents strike together for 1.6× Basic damage.', damage: [{ type: 'earth', coefficient: 0.8 }, { type: 'air', coefficient: 0.8 }] },
    ],
    actionPatterns: {
      bound: { id: 'bound', steps: [action('flame-line-step', 'flame-line'), basic('bound-basic-1'), action('flood-line-step', 'flood-line'), basic('bound-basic-2'), action('stone-line-step', 'stone-line'), basic('bound-basic-3'), action('gale-line-step', 'gale-line'), action('meridian-barrier-step', 'meridian-barrier'), basic('bound-basic-4')] },
      severed: { id: 'severed', steps: [action('severed-meridian-step', 'severed-meridian'), basic('severed-basic-1'), action('shatter-tide-step', 'shatter-tide'), basic('severed-basic-2'), action('crosswind-fracture-step', 'crosswind-fracture'), action('meridian-barrier-step', 'meridian-barrier'), basic('severed-basic-3')] },
    },
    defaultActionPatternId: 'bound',
  },
]

export const BROKEN_MERIDIAN_MONSTERS = Object.fromEntries(specs.map((spec) => [spec.id, makeCombatMonster(spec)])) as Record<MonsterId, MonsterDefinition>

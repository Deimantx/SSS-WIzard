import type { MonsterId } from '../../../types'
import { action, basic, type MonsterDefinition } from '../monsterTypes'
import { makeCombatMonster, type CombatMonsterSpec } from '../combatMonsterAuthoring'

const specs: CombatMonsterSpec[] = [
  {
    locationId: 'fractured-approach', id: 'warded-husk', combatV2: true, primaryAffinity: 'earth', basicAttackElement: 'earth', targetPower: 2900,
    name: 'Warded Husk', subtitle: 'A dead sentinel still carrying a broken frontier ward', hp: 1250, damage: 58, defense: 40, time: 2800,
    resistances: { arcane: 0.15 }, color: '#8c806f', icon: { portraitIcon: 'guardian' },
    specials: [
      { id: 'fractured-ward', name: 'Fractured Ward', actionTimeMs: 2200, description: 'The Husk gathers broken ward-light into a protective Barrier.', barrier: 0.12 },
      { id: 'ward-slam', name: 'Ward Slam', actionTimeMs: 2400, description: 'The Husk crashes its fractured ward into the target.', damage: [{ type: 'earth', coefficient: 1.55 }] },
    ],
    patternSteps: [basic('basic-1'), action('fractured-ward-step', 'fractured-ward'), basic('basic-2'), action('ward-slam-step', 'ward-slam'), basic('basic-3')],
  },
  {
    locationId: 'fractured-approach', id: 'rift-wolf', combatV2: true, primaryAffinity: 'air', basicAttackElement: 'air', targetPower: 2350,
    name: 'Rift Wolf', subtitle: 'A predator twisted by unstable air and fractured space', hp: 975, damage: 63, defense: 24, time: 2050,
    resistances: { air: 0.1, earth: -0.1 }, color: '#7da8bd', icon: { portraitIcon: 'wolf' },
    specials: [
      { id: 'rift-lunge', name: 'Rift Lunge', actionTimeMs: 1550, description: 'The Wolf tears through a short rift and lunges into the target.', damage: [{ type: 'air', coefficient: 1.45 }] },
      { id: 'arc-flash', name: 'Arc Flash', actionTimeMs: 1750, description: 'Unstable air flashes across the target in a cutting arc.', damage: [{ type: 'air', coefficient: 1.15 }] },
    ],
    patternSteps: [basic('basic-1'), action('rift-lunge-step', 'rift-lunge'), basic('basic-2'), action('arc-flash-step', 'arc-flash'), basic('basic-3')],
  },
  {
    locationId: 'fractured-approach', id: 'arcane-scavenger', combatV2: true, primaryAffinity: 'arcane', basicAttackElement: 'arcane', resonanceYield: { arcane: 10 }, targetPower: 2500,
    name: 'Arcane Scavenger', subtitle: 'A looter feeding on the residue of ruined wards', hp: 1050, damage: 61, defense: 26, time: 2350,
    color: '#a78bc4', icon: { portraitIcon: 'mage' },
    specials: [
      { id: 'salvaged-bolt', name: 'Salvaged Bolt', actionTimeMs: 1700, description: 'A scavenged shard of ward-magic tears into the target.', damage: [{ type: 'arcane', coefficient: 1.4 }] },
      { id: 'unstable-charge', name: 'Unstable Charge', actionTimeMs: 2400, description: 'The Scavenger detonates a volatile bundle of stolen magic.', damage: [{ type: 'arcane', coefficient: 1.8 }] },
    ],
    patternSteps: [action('salvaged-bolt-step', 'salvaged-bolt'), basic('basic-1'), basic('basic-2'), action('unstable-charge-step', 'unstable-charge'), basic('basic-3')],
  },
  {
    locationId: 'fractured-approach', id: 'withered-watcher', combatV2: true, primaryAffinity: 'arcane', basicAttackElement: 'arcane', resonanceYield: { arcane: 10 }, targetPower: 2700,
    name: 'Withered Watcher', subtitle: 'A failing construct that still obeys its last command', hp: 1150, damage: 60, defense: 34, time: 2550,
    resistances: { fire: 0.05, water: 0.05, earth: 0.05, air: 0.05 }, color: '#9a8c79', icon: { portraitIcon: 'guardian' },
    specials: [
      { id: 'elemental-pulse', name: 'Elemental Pulse', actionTimeMs: 2000, description: 'A broken ward emits a pulse of arcane force.', damage: [{ type: 'arcane', coefficient: 1.3 }] },
      { id: 'broken-aegis', name: 'Broken Aegis', actionTimeMs: 2300, description: 'The Watcher raises a failing Aegis around itself.', barrier: 0.09 },
      { id: 'watchers-lance', name: "Watcher's Lance", actionTimeMs: 2600, description: 'A lance of unstable wind strikes through the target.', damage: [{ type: 'air', coefficient: 1.65 }] },
    ],
    patternSteps: [basic('basic-1'), action('elemental-pulse-step', 'elemental-pulse'), action('broken-aegis-step', 'broken-aegis'), basic('basic-2'), action('watchers-lance-step', 'watchers-lance')],
  },
  {
    locationId: 'fractured-approach', id: 'corrupted-elemental-gatekeeper', combatV2: true, primaryAffinity: 'arcane', basicAttackElement: 'arcane', targetPower: 3700,
    name: 'Corrupted Elemental Gatekeeper', subtitle: "The shattered frontier's last ward, poisoned by elemental instability", hp: 10500, damage: 85, defense: 55,
    resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 }, resonanceYield: { arcane: 63, fire: 50, water: 50, earth: 50, air: 50 }, color: '#d276a3', icon: { portraitIcon: 'boss' }, boss: true,
    specials: [
      { id: 'flame-surge', name: 'Flame Surge', actionTimeMs: 1900, description: 'Corrupted fire surges through the target.', damage: [{ type: 'fire', coefficient: 1.25 }] },
      { id: 'tidal-break', name: 'Tidal Break', actionTimeMs: 2100, description: 'A violent wave of corrupted water breaks across the target.', damage: [{ type: 'water', coefficient: 1.2 }] },
      { id: 'stone-crush', name: 'Stone Crush', actionTimeMs: 2400, description: 'The Gatekeeper folds fractured earth into a crushing blow.', damage: [{ type: 'earth', coefficient: 1.45 }] },
      { id: 'gale-lance', name: 'Gale Lance', actionTimeMs: 1650, description: 'A compressed lance of unstable wind pierces the target.', damage: [{ type: 'air', coefficient: 1.15 }] },
      { id: 'fractured-aegis', name: 'Fractured Aegis', actionTimeMs: 2400, description: 'The Gatekeeper reconstructs a protective Barrier from broken elements.', barrier: 0.08 },
      { id: 'elemental-rupture', name: 'Elemental Rupture', actionTimeMs: 3400, description: 'The Gatekeeper telegraphs a devastating arcane rupture.', damage: [{ type: 'arcane', coefficient: 2.0 }] },
    ],
    patternSteps: [action('flame-surge-step', 'flame-surge'), basic('basic-1'), action('tidal-break-step', 'tidal-break'), action('fractured-aegis-step', 'fractured-aegis'), basic('basic-2'), action('stone-crush-step', 'stone-crush'), action('gale-lance-step', 'gale-lance'), basic('basic-3'), action('elemental-rupture-step', 'elemental-rupture')],
  },
]

export const FRACTURED_APPROACH_MONSTERS = Object.fromEntries(specs.map((spec) => [spec.id, makeCombatMonster(spec)])) as Record<MonsterId, MonsterDefinition>

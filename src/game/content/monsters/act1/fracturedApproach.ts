import type { MonsterId } from '../../../types'
import { action, basic, scaledBarrier, scaledDirectDamage, type MonsterDefinition } from '../monsterTypes'

export const FRACTURED_APPROACH_MONSTERS = {
  'warded-husk': {
    id: 'warded-husk', bestiaryCategory: 'monster', name: 'Warded Husk', subtitle: 'A dead sentinel still carrying a broken frontier ward',
    maxHealth: 1250, basicAttackDamage: 58, basicAttackTimeMs: 2800, defense: 40, resistances: { physical: 0.10, arcane: 0.15 }, color: '#8c806f', ui: { portraitIcon: 'guardian' }, traitIds: ['broken-construct-ward'],
    actions: {
      'fractured-ward': { id: 'fractured-ward', name: 'Fractured Ward', actionTimeMs: 2200, description: 'The Husk gathers broken ward-light into a protective Barrier.', effects: [scaledBarrier(0.12)], tags: ['special', 'barrier'] },
      'ward-slam': { id: 'ward-slam', name: 'Ward Slam', actionTimeMs: 2400, description: 'The Husk crashes its fractured ward into the target.', effects: [scaledDirectDamage('physical', 1.55)], tags: ['special', 'physical', 'melee', 'direct'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('fractured-ward-step', 'fractured-ward'), basic('basic-2'), action('ward-slam-step', 'ward-slam'), basic('basic-3')] } }, defaultActionPatternId: 'default',
    loot: [],
  },
  'rift-wolf': {
    id: 'rift-wolf', bestiaryCategory: 'monster', name: 'Rift Wolf', subtitle: 'A predator twisted by unstable air and fractured space',
    maxHealth: 975, basicAttackDamage: 63, basicAttackTimeMs: 2050, defense: 24, resistances: { air: 0.10, earth: -0.10 }, color: '#7da8bd', ui: { portraitIcon: 'wolf' }, traitIds: ['rift-archer-precision'],
    actions: {
      'rift-lunge': { id: 'rift-lunge', name: 'Rift Lunge', actionTimeMs: 1550, description: 'The Wolf tears through a short rift and lunges into the target.', effects: [scaledDirectDamage('physical', 1.45)], tags: ['special', 'physical', 'melee', 'direct'] },
      'arc-flash': { id: 'arc-flash', name: 'Arc Flash', actionTimeMs: 1750, description: 'Unstable air flashes across the target in a cutting arc.', effects: [scaledDirectDamage('air', 1.15)], tags: ['special', 'air', 'magic', 'direct'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('rift-lunge-step', 'rift-lunge'), basic('basic-2'), action('arc-flash-step', 'arc-flash'), basic('basic-3')] } }, defaultActionPatternId: 'default',
    loot: [],
  },
  'arcane-scavenger': {
    id: 'arcane-scavenger', bestiaryCategory: 'monster', name: 'Arcane Scavenger', subtitle: 'A looter feeding on the residue of ruined wards',
    maxHealth: 1050, basicAttackDamage: 61, basicAttackTimeMs: 2350, defense: 26, resistances: { arcane: 0.15, physical: -0.05 }, color: '#a78bc4', ui: { portraitIcon: 'mage' }, traitIds: ['linebreaker-disruption'],
    actions: {
      'salvaged-bolt': { id: 'salvaged-bolt', name: 'Salvaged Bolt', actionTimeMs: 1700, description: 'A scavenged shard of ward-magic tears into the target.', effects: [scaledDirectDamage('arcane', 1.40)], tags: ['special', 'arcane', 'magic', 'ranged', 'direct'] },
      'unstable-charge': { id: 'unstable-charge', name: 'Unstable Charge', actionTimeMs: 2400, description: 'The Scavenger detonates a volatile bundle of stolen magic.', effects: [scaledDirectDamage('arcane', 1.80)], tags: ['special', 'arcane', 'magic', 'ranged', 'direct'] },
    },
    actionPatterns: { default: { id: 'default', steps: [action('salvaged-bolt-step', 'salvaged-bolt'), basic('basic-1'), basic('basic-2'), action('unstable-charge-step', 'unstable-charge'), basic('basic-3')] } }, defaultActionPatternId: 'default',
    loot: [],
  },
  'withered-watcher': {
    id: 'withered-watcher', bestiaryCategory: 'monster', name: 'Withered Watcher', subtitle: 'A failing construct that still obeys its last command',
    maxHealth: 1150, basicAttackDamage: 60, basicAttackTimeMs: 2550, defense: 34, resistances: { fire: 0.05, water: 0.05, earth: 0.05, air: 0.05 }, color: '#9a8c79', ui: { portraitIcon: 'guardian' }, traitIds: ['meridian-warden-ward'],
    actions: {
      'elemental-pulse': { id: 'elemental-pulse', name: 'Elemental Pulse', actionTimeMs: 2000, description: 'A broken ward emits a pulse of arcane force.', effects: [scaledDirectDamage('arcane', 1.30)], tags: ['special', 'arcane', 'magic', 'direct'] },
      'broken-aegis': { id: 'broken-aegis', name: 'Broken Aegis', actionTimeMs: 2300, description: 'The Watcher raises a failing Aegis around itself.', effects: [scaledBarrier(0.09)], tags: ['special', 'barrier'] },
      'watchers-lance': { id: 'watchers-lance', name: "Watcher's Lance", actionTimeMs: 2600, description: 'A lance of unstable wind strikes through the target.', effects: [scaledDirectDamage('air', 1.65)], tags: ['special', 'air', 'magic', 'ranged', 'direct'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('elemental-pulse-step', 'elemental-pulse'), action('broken-aegis-step', 'broken-aegis'), basic('basic-2'), action('watchers-lance-step', 'watchers-lance')] } }, defaultActionPatternId: 'default',
    loot: [],
  },
  'corrupted-elemental-gatekeeper': {
    id: 'corrupted-elemental-gatekeeper', bestiaryCategory: 'boss', name: 'Corrupted Elemental Gatekeeper', subtitle: "The shattered frontier's last ward, poisoned by elemental instability",
    maxHealth: 10500, basicAttackDamage: 85, basicAttackTimeMs: 2450, defense: 55, resistances: { physical: 0.10, fire: 0.10, water: 0.10, earth: 0.10, air: 0.10 }, color: '#d276a3', ui: { portraitIcon: 'boss' }, traitIds: [], resonanceYield: { fire: 50, water: 50, earth: 50, air: 50 },
    actions: {
      'flame-surge': { id: 'flame-surge', name: 'Flame Surge', actionTimeMs: 1900, description: 'Corrupted fire surges through the target.', effects: [scaledDirectDamage('fire', 1.25)], tags: ['special', 'fire', 'magic', 'direct'] },
      'tidal-break': { id: 'tidal-break', name: 'Tidal Break', actionTimeMs: 2100, description: 'A violent wave of corrupted water breaks across the target.', effects: [scaledDirectDamage('water', 1.20)], tags: ['special', 'water', 'magic', 'direct'] },
      'stone-crush': { id: 'stone-crush', name: 'Stone Crush', actionTimeMs: 2400, description: 'The Gatekeeper folds fractured earth into a crushing blow.', effects: [scaledDirectDamage('earth', 1.45)], tags: ['special', 'earth', 'magic', 'direct'] },
      'gale-lance': { id: 'gale-lance', name: 'Gale Lance', actionTimeMs: 1650, description: 'A compressed lance of unstable wind pierces the target.', effects: [scaledDirectDamage('air', 1.15)], tags: ['special', 'air', 'magic', 'ranged', 'direct'] },
      'fractured-aegis': { id: 'fractured-aegis', name: 'Fractured Aegis', actionTimeMs: 2400, description: 'The Gatekeeper reconstructs a protective Barrier from broken elements.', effects: [scaledBarrier(0.08)], tags: ['special', 'barrier'] },
      'elemental-rupture': { id: 'elemental-rupture', name: 'Elemental Rupture', actionTimeMs: 3400, description: 'The Gatekeeper telegraphs a devastating arcane rupture.', effects: [scaledDirectDamage('arcane', 2.0)], tags: ['special', 'arcane', 'magic', 'direct'] },
    },
    actionPatterns: { default: { id: 'default', steps: [action('flame-surge-step', 'flame-surge'), basic('basic-1'), action('tidal-break-step', 'tidal-break'), action('fractured-aegis-step', 'fractured-aegis'), basic('basic-2'), action('stone-crush-step', 'stone-crush'), action('gale-lance-step', 'gale-lance'), basic('basic-3'), action('elemental-rupture-step', 'elemental-rupture')] } }, defaultActionPatternId: 'default',
    loot: [],
  },
} satisfies Partial<Record<MonsterId, MonsterDefinition>>

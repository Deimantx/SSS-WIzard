import type { MonsterId } from '../../types'
import { action, applyStatus, basic, directDamage, gainBarrier, heal, withLifeEssence, type MonsterDefinition } from './monsterTypes'

export const ABANDONED_CATACOMBS_MONSTERS = {
  'restless-skeleton': {
    id: 'restless-skeleton', bestiaryCategory: 'monster', name: 'Restless Skeleton', subtitle: 'Bones animated by the last command they heard',
    maxHealth: 180, basicAttackDamage: 15, actionIntervalMs: 2700, color: '#c9c3ae', traitIds: ['restless-skeleton-brittle-bones'], resistances: { physical: 0.25 },
    actions: { 'bone-cleaver': { id: 'bone-cleaver', name: 'Bone Cleaver', telegraphMs: 2200, description: 'Deals 28 Physical damage.', effects: [directDamage('physical', 28)], tags: ['special', 'physical', 'melee', 'direct'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('bone-cleaver-step', 'bone-cleaver')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([]),
  },
  'grave-wraith': {
    id: 'grave-wraith', bestiaryCategory: 'monster', name: 'Grave Wraith', subtitle: 'A cold memory refusing to fade',
    maxHealth: 160, basicAttackDamage: 14, actionIntervalMs: 2400, color: '#8d9dc9', traitIds: ['grave-wraith-ethereal-form'], resistances: { physical: 0.5, fire: -0.25, water: -0.25, earth: -0.25, air: -0.25 },
    actions: {
      'chilling-touch': { id: 'chilling-touch', name: 'Chilling Touch', telegraphMs: 1800, description: 'Deals 18 Water damage and applies Chilled.', effects: [directDamage('water', 18), applyStatus('chilled', 'opponent')], tags: ['special', 'water', 'magic', 'debuff'] },
      fade: { id: 'fade', name: 'Fade', telegraphMs: 1700, description: 'Applies Spectral Fade to self for 5 seconds.', effects: [applyStatus('spectral-fade', 'self', 5000)], tags: ['special', 'buff'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('chilling-touch-step', 'chilling-touch'), basic('basic-2'), basic('basic-3'), action('fade-step', 'fade')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([]),
  },
  'fallen-acolyte': {
    id: 'fallen-acolyte', bestiaryCategory: 'monster', name: 'Fallen Acolyte', subtitle: 'A ritualist still serving a forgotten master',
    maxHealth: 220, basicAttackDamage: 16, actionIntervalMs: 2600, color: '#9b7eaa', traitIds: ['fallen-acolyte-grave-channeling'],
    actions: {
      'grave-bolt': { id: 'grave-bolt', name: 'Grave Bolt', telegraphMs: 1500, description: 'Deals 24 Arcane damage.', effects: [directDamage('arcane', 24)], tags: ['special', 'arcane', 'magic', 'direct'] },
      'soul-drain': { id: 'soul-drain', name: 'Soul Drain', telegraphMs: 2200, description: 'Deals 18 Arcane damage and heals self for 20 HP.', effects: [directDamage('arcane', 18), heal(20)], tags: ['special', 'arcane', 'magic', 'heal', 'direct'] },
      'death-ward': { id: 'death-ward', name: 'Death Ward', telegraphMs: 2000, description: 'Gains 45 Barrier.', effects: [gainBarrier({ type: 'flat', value: 45 })], tags: ['special', 'barrier'] },
    },
    actionPatterns: { default: { id: 'default', steps: [action('grave-bolt-step', 'grave-bolt'), basic('basic-1'), action('soul-drain-step', 'soul-drain'), basic('basic-2'), basic('basic-3'), action('death-ward-step', 'death-ward'), basic('basic-4')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([]),
  },
  'archmage-edrin-shade': {
    id: 'archmage-edrin-shade', bestiaryCategory: 'boss', name: "Archmage Edrin's Shade", subtitle: 'The last spell of a wizard who would not rest',
    maxHealth: 1300, basicAttackDamage: 20, actionIntervalMs: 2500, color: '#70619b', traitIds: ['archmage-edrin-arcane-remnant', 'archmage-edrin-unbound-spirit'], resistances: { fire: 0.15, water: 0.15, earth: 0.15, air: 0.15 },
    actions: {
      gravefire: { id: 'gravefire', name: 'Gravefire', telegraphMs: 1800, description: 'Deals 28 Fire damage and applies Burning.', effects: [directDamage('fire', 28), applyStatus('burning', 'opponent')], tags: ['special', 'fire', 'magic', 'debuff'] },
      frostbind: { id: 'frostbind', name: 'Frostbind', telegraphMs: 2000, description: 'Deals 24 Water damage and applies Chilled.', effects: [directDamage('water', 24), applyStatus('chilled', 'opponent')], tags: ['special', 'water', 'magic', 'debuff'] },
      'arcane-ward': { id: 'arcane-ward', name: 'Arcane Ward', telegraphMs: 2200, description: 'Gains 70 Barrier.', effects: [gainBarrier({ type: 'flat', value: 70 })], tags: ['special', 'arcane', 'barrier'] },
      'soul-drain': { id: 'soul-drain', name: 'Soul Drain', telegraphMs: 2400, description: 'Deals 24 Arcane damage and heals self for 30 HP.', effects: [directDamage('arcane', 24), heal(30)], tags: ['special', 'arcane', 'magic', 'heal', 'direct'] },
      'final-incantation': { id: 'final-incantation', name: 'Final Incantation', telegraphMs: 4500, description: 'A devastating Arcane spell for 70 damage. Prepare defenses.', effects: [directDamage('arcane', 70)], tags: ['special', 'arcane', 'magic', 'direct'] },
    },
    actionPatterns: {
      default: { id: 'default', steps: [action('gravefire-step', 'gravefire'), basic('basic-1'), action('frostbind-step', 'frostbind'), action('arcane-ward-step', 'arcane-ward'), basic('basic-2'), action('soul-drain-step', 'soul-drain')] },
      unbound: { id: 'unbound', steps: [basic('basic-1'), action('gravefire-step', 'gravefire'), action('frostbind-step', 'frostbind'), action('soul-drain-step', 'soul-drain'), basic('basic-2'), action('final-incantation-step', 'final-incantation')] },
    }, defaultActionPatternId: 'default',
    loot: withLifeEssence([]),
  },
} satisfies Partial<Record<MonsterId, MonsterDefinition>>

import type { MonsterId } from '../../types'
import { action, basic, scaledBarrier, scaledDirectDamage, scaledDot, scaledHeal, withLifeEssence, applyStatus, type MonsterDefinition } from './monsterTypes'

export const ABANDONED_CATACOMBS_MONSTERS = {
  'restless-skeleton': {
    id: 'restless-skeleton', bestiaryCategory: 'monster', name: 'Restless Skeleton', subtitle: 'Bones animated by the last command they heard',
    maxHealth: 180, basicAttackDamage: 15, basicAttackTimeMs: 2700, color: '#c9c3ae', ui: { portraitIcon: 'skeleton' }, traitIds: ['restless-skeleton-brittle-bones'], resistances: { physical: 0.25 },
    actions: { 'bone-cleaver': { id: 'bone-cleaver', name: 'Bone Cleaver', actionTimeMs: 2200, description: 'A heavy cleaver blow splits through the target.', effects: [scaledDirectDamage('physical', 1.85)], tags: ['special', 'physical', 'melee', 'direct'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('bone-cleaver-step', 'bone-cleaver')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'ossuary-remnant', min: 1, max: 1, chance: 0.55 }, { itemId: 'graveglass-shard', min: 1, max: 1, chance: 0.15 }]),
  },
  'grave-wraith': {
    id: 'grave-wraith', bestiaryCategory: 'monster', name: 'Grave Wraith', subtitle: 'A cold memory refusing to fade',
    maxHealth: 160, basicAttackDamage: 14, basicAttackTimeMs: 2400, color: '#8d9dc9', ui: { portraitIcon: 'ghost' }, traitIds: ['grave-wraith-ethereal-form'], resistances: { physical: 0.5, fire: -0.25, water: -0.25, earth: -0.25, air: -0.25 },
    actions: {
      'chilling-touch': { id: 'chilling-touch', name: 'Chilling Touch', actionTimeMs: 1800, description: 'A cold touch damages the target and leaves it Chilled.', effects: [scaledDirectDamage('water', 1.3), applyStatus('chilled', 'opponent')], tags: ['special', 'water', 'magic', 'debuff'] },
      fade: { id: 'fade', name: 'Fade', actionTimeMs: 1700, description: 'The Grave Wraith slips into Spectral Fade.', effects: [applyStatus('spectral-fade', 'self', 5000)], tags: ['special', 'buff'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('chilling-touch-step', 'chilling-touch'), basic('basic-2'), basic('basic-3'), action('fade-step', 'fade')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'soul-residue', min: 1, max: 1, chance: 0.5 }, { itemId: 'graveglass-shard', min: 1, max: 1, chance: 0.3 }]),
  },
  'fallen-acolyte': {
    id: 'fallen-acolyte', bestiaryCategory: 'monster', name: 'Fallen Acolyte', subtitle: 'A ritualist still serving a forgotten master',
    maxHealth: 220, basicAttackDamage: 16, basicAttackTimeMs: 2600, color: '#9b7eaa', ui: { portraitIcon: 'mage' }, traitIds: ['fallen-acolyte-grave-channeling'],
    actions: {
      'grave-bolt': { id: 'grave-bolt', name: 'Grave Bolt', actionTimeMs: 1500, description: 'A focused Arcane bolt tears through the target.', effects: [scaledDirectDamage('arcane', 1.5)], tags: ['special', 'arcane', 'magic', 'direct'] },
      'soul-drain': { id: 'soul-drain', name: 'Soul Drain', actionTimeMs: 2200, description: 'Arcane force tears at the target and restores the caster\'s Health.', effects: [scaledDirectDamage('arcane', 1.125), scaledHeal(0.09)], tags: ['special', 'arcane', 'magic', 'heal', 'direct'] },
      'death-ward': { id: 'death-ward', name: 'Death Ward', actionTimeMs: 2000, description: 'A deathly ward gathers a protective Barrier around the caster.', effects: [scaledBarrier(0.205)], tags: ['special', 'barrier'] },
    },
    actionPatterns: { default: { id: 'default', steps: [action('grave-bolt-step', 'grave-bolt'), basic('basic-1'), action('soul-drain-step', 'soul-drain'), basic('basic-2'), basic('basic-3'), action('death-ward-step', 'death-ward'), basic('basic-4')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'graveglass-shard', min: 1, max: 1, chance: 0.35 }, { itemId: 'soul-residue', min: 1, max: 1, chance: 0.3 }, { itemId: 'ossuary-remnant', min: 1, max: 1, chance: 0.2 }]),
  },
  'archmage-edrin-shade': {
    id: 'archmage-edrin-shade', bestiaryCategory: 'boss', name: "Archmage Edrin's Shade", subtitle: 'The last spell of a wizard who would not rest',
    maxHealth: 1300, basicAttackDamage: 20, basicAttackTimeMs: 2500, color: '#70619b', ui: { portraitIcon: 'mage' }, traitIds: ['archmage-edrin-arcane-remnant', 'archmage-edrin-unbound-spirit'], resistances: { fire: 0.15, water: 0.15, earth: 0.15, air: 0.15 },
    actions: {
      gravefire: { id: 'gravefire', name: 'Gravefire', actionTimeMs: 1800, description: 'Flame erupts across the target and leaves it Burning.', effects: [scaledDirectDamage('fire', 1.4), scaledDot('burning', 'fire', 1.25, 5000)], tags: ['special', 'fire', 'magic', 'debuff'] },
      frostbind: { id: 'frostbind', name: 'Frostbind', actionTimeMs: 2000, description: 'A freezing surge damages the target and leaves it Chilled.', effects: [scaledDirectDamage('water', 1.2), applyStatus('chilled', 'opponent')], tags: ['special', 'water', 'magic', 'debuff'] },
      'arcane-ward': { id: 'arcane-ward', name: 'Arcane Ward', actionTimeMs: 2200, description: 'Edrin shapes an Arcane ward into a protective Barrier.', effects: [scaledBarrier(0.054)], tags: ['special', 'arcane', 'barrier'] },
      'soul-drain': { id: 'soul-drain', name: 'Soul Drain', actionTimeMs: 2400, description: 'Arcane force tears at the target and restores the caster\'s Health.', effects: [scaledDirectDamage('arcane', 1.2), scaledHeal(0.023)], tags: ['special', 'arcane', 'magic', 'heal', 'direct'] },
      'final-incantation': { id: 'final-incantation', name: 'Final Incantation', actionTimeMs: 4500, description: 'Edrin unleashes a devastating Arcane incantation.', effects: [scaledDirectDamage('arcane', 3.5)], tags: ['special', 'arcane', 'magic', 'direct'] },
    },
    actionPatterns: {
      default: { id: 'default', steps: [action('gravefire-step', 'gravefire'), basic('basic-1'), action('frostbind-step', 'frostbind'), action('arcane-ward-step', 'arcane-ward'), basic('basic-2'), action('soul-drain-step', 'soul-drain')] },
      unbound: { id: 'unbound', steps: [basic('basic-1'), action('gravefire-step', 'gravefire'), action('frostbind-step', 'frostbind'), action('soul-drain-step', 'soul-drain'), basic('basic-2'), action('final-incantation-step', 'final-incantation')] },
    }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'graveglass-shard', min: 2, max: 4, chance: 1 }, { itemId: 'soul-residue', min: 2, max: 3, chance: 1 }, { itemId: 'edrin-remnant', min: 1, max: 1, chance: 0.35 }, { itemId: 'edrins-signet', min: 1, max: 1, chance: 0.05 }]),
  },
} satisfies Partial<Record<MonsterId, MonsterDefinition>>

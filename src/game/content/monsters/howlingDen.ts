import type { MonsterId } from '../../types'
import { action, applyStatus, basic, delayBasicAttack, directDamage, withLifeEssence, type MonsterDefinition } from './monsterTypes'

export const HOWLING_DEN_MONSTERS = {
  'cavefang-wolf': {
    id: 'cavefang-wolf', bestiaryCategory: 'monster', name: 'Cavefang Wolf', subtitle: 'A patient predator that waits for weakness',
    maxHealth: 115, basicAttackDamage: 12, actionIntervalMs: 2200, color: '#b8a0a0', traitIds: ['cavefang-wolf-predator-instinct'],
    actions: { pounce: { id: 'pounce', name: 'Pounce', telegraphMs: 1400, description: 'Deals 18 Physical damage and delays the player Basic Attack by 500ms.', effects: [directDamage('physical', 18), delayBasicAttack(500)], tags: ['special', 'physical', 'melee', 'control'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('pounce-step', 'pounce')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([]),
  },
  'razorclaw-lynx': {
    id: 'razorclaw-lynx', bestiaryCategory: 'monster', name: 'Razorclaw Lynx', subtitle: 'A blur of claws and hungry momentum',
    maxHealth: 130, basicAttackDamage: 11, actionIntervalMs: 1900, color: '#c18b73', traitIds: ['razorclaw-lynx-relentless-hunter'],
    actions: { 'rending-claws': { id: 'rending-claws', name: 'Rending Claws', telegraphMs: 1300, description: 'Deals 14 Physical damage and applies Bleeding.', effects: [directDamage('physical', 14), applyStatus('bleeding', 'opponent')], tags: ['special', 'physical', 'melee', 'debuff'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('rending-claws-step', 'rending-claws'), basic('basic-2')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([]),
  },
  'corrupted-dire-wolf': {
    id: 'corrupted-dire-wolf', bestiaryCategory: 'monster', name: 'Corrupted Dire Wolf', subtitle: 'A beast split between fang and sorcery',
    maxHealth: 160, basicAttackDamage: 14, actionIntervalMs: 2300, color: '#7e6c9f', traitIds: ['corrupted-dire-wolf-arcane-corruption'], resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 },
    actions: {
      'arcane-bite': { id: 'arcane-bite', name: 'Arcane Bite', telegraphMs: 1600, description: 'Strikes for 10 Physical and 10 Arcane damage.', effects: [directDamage('physical', 10), directDamage('arcane', 10)], tags: ['special', 'physical', 'arcane', 'melee', 'direct'] },
      'corrupted-howl': { id: 'corrupted-howl', name: 'Corrupted Howl', telegraphMs: 1800, description: 'Applies Haste to self for 6 seconds.', effects: [applyStatus('haste', 'self', 6000)], tags: ['special', 'buff'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('arcane-bite-step', 'arcane-bite'), basic('basic-2'), basic('basic-3'), action('corrupted-howl-step', 'corrupted-howl')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([]),
  },
  'corrupted-greatbear': {
    id: 'corrupted-greatbear', bestiaryCategory: 'boss', name: 'Corrupted Greatbear', subtitle: 'A mountain of fur warped by hungry magic',
    maxHealth: 900, basicAttackDamage: 22, actionIntervalMs: 2800, color: '#806b69', traitIds: ['corrupted-greatbear-thick-hide', 'corrupted-greatbear-unstable-corruption'],
    actions: {
      'crushing-maul': { id: 'crushing-maul', name: 'Crushing Maul', telegraphMs: 1800, description: 'Deals 34 Physical damage.', effects: [directDamage('physical', 34)], tags: ['special', 'physical', 'melee', 'direct'] },
      groundbreaker: { id: 'groundbreaker', name: 'Groundbreaker', telegraphMs: 2500, description: 'Deals 26 Physical damage and delays the player Basic Attack by 1200ms.', effects: [directDamage('physical', 26), delayBasicAttack(1200)], tags: ['special', 'physical', 'control'] },
      'corrupted-roar': { id: 'corrupted-roar', name: 'Corrupted Roar', telegraphMs: 2200, description: 'Makes the target Vulnerable.', effects: [applyStatus('vulnerable', 'opponent')], tags: ['special', 'debuff'] },
      'arcane-rampage': { id: 'arcane-rampage', name: 'Arcane Rampage', telegraphMs: 3500, description: 'A heavy Arcane strike for 44 damage. Prepare defenses.', effects: [directDamage('arcane', 44)], tags: ['special', 'magic', 'arcane', 'direct'] },
    },
    actionPatterns: {
      default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('crushing-maul-step', 'crushing-maul'), basic('basic-3'), action('groundbreaker-step', 'groundbreaker')] },
      corrupted: { id: 'corrupted', steps: [basic('basic-1'), action('corrupted-roar-step', 'corrupted-roar'), action('crushing-maul-step', 'crushing-maul'), basic('basic-2'), basic('basic-3'), action('arcane-rampage-step', 'arcane-rampage')] },
    }, defaultActionPatternId: 'default',
    loot: withLifeEssence([]),
  },
} satisfies Partial<Record<MonsterId, MonsterDefinition>>

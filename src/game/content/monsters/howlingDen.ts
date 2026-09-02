import type { MonsterId } from '../../types'
import { action, basic, delayBasicAttack, scaledDirectDamage, scaledDot, withLifeEssence, applyStatus, type MonsterDefinition } from './monsterTypes'

export const HOWLING_DEN_MONSTERS = {
  'cavefang-wolf': {
    id: 'cavefang-wolf', bestiaryCategory: 'monster', name: 'Cavefang Wolf', subtitle: 'A patient predator that waits for weakness',
    maxHealth: 115, basicAttackDamage: 12, basicAttackTimeMs: 2200, color: '#b8a0a0', ui: { portraitIcon: 'wolf' }, traitIds: ['cavefang-wolf-predator-instinct'],
    actions: { pounce: { id: 'pounce', name: 'Pounce', actionTimeMs: 1400, description: "The predator lunges at the target and delays the Player's Basic Attack.", effects: [scaledDirectDamage('physical', 1.5), delayBasicAttack(500)], tags: ['special', 'physical', 'melee', 'control'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('pounce-step', 'pounce')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'predator-fang', min: 1, max: 1, chance: 0.55 }, { itemId: 'predator-hide', min: 1, max: 1, chance: 0.3 }]),
  },
  'razorclaw-lynx': {
    id: 'razorclaw-lynx', bestiaryCategory: 'monster', name: 'Razorclaw Lynx', subtitle: 'A blur of claws and hungry momentum',
    maxHealth: 130, basicAttackDamage: 11, basicAttackTimeMs: 1900, color: '#c18b73', ui: { portraitIcon: 'claw' }, traitIds: ['razorclaw-lynx-relentless-hunter'],
    actions: { 'rending-claws': { id: 'rending-claws', name: 'Rending Claws', actionTimeMs: 1300, description: 'Raking claws cut the target and leave a lingering Bleeding wound.', effects: [scaledDirectDamage('physical', 1.25), scaledDot('bleeding', 'physical', 1.45, 8000)], tags: ['special', 'physical', 'melee', 'debuff'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('rending-claws-step', 'rending-claws'), basic('basic-2')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'predator-fang', min: 1, max: 1, chance: 0.45 }, { itemId: 'predator-hide', min: 1, max: 1, chance: 0.45 }]),
  },
  'corrupted-dire-wolf': {
    id: 'corrupted-dire-wolf', bestiaryCategory: 'monster', name: 'Corrupted Dire Wolf', subtitle: 'A beast split between fang and sorcery',
    maxHealth: 160, basicAttackDamage: 14, basicAttackTimeMs: 2300, color: '#7e6c9f', ui: { portraitIcon: 'wolf' }, traitIds: ['corrupted-dire-wolf-arcane-corruption'], resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 },
    actions: {
      'arcane-bite': { id: 'arcane-bite', name: 'Arcane Bite', actionTimeMs: 1600, description: 'A corrupted bite tears through both body and warding.', effects: [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'source-basic-damage-percent', value: 0.7 } }, { damageType: 'arcane', magnitude: { type: 'source-basic-damage-percent', value: 0.7 } }], tags: ['direct'] }], tags: ['special', 'physical', 'arcane', 'melee', 'direct'] },
      'corrupted-howl': { id: 'corrupted-howl', name: 'Corrupted Howl', actionTimeMs: 1800, description: 'The howl fills the Corrupted Dire Wolf with Haste.', effects: [applyStatus('haste', 'self', 6000)], tags: ['special', 'buff'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), action('arcane-bite-step', 'arcane-bite'), basic('basic-2'), basic('basic-3'), action('corrupted-howl-step', 'corrupted-howl')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'corrupted-beast-essence', min: 1, max: 1, chance: 0.35 }, { itemId: 'predator-hide', min: 1, max: 1, chance: 0.3 }, { itemId: 'predator-fang', min: 1, max: 1, chance: 0.25 }]),
  },
  'corrupted-greatbear': {
    id: 'corrupted-greatbear', bestiaryCategory: 'boss', name: 'Corrupted Greatbear', subtitle: 'A mountain of fur warped by hungry magic',
    maxHealth: 900, basicAttackDamage: 22, basicAttackTimeMs: 2800, color: '#806b69', ui: { portraitIcon: 'bear' }, traitIds: ['corrupted-greatbear-thick-hide', 'corrupted-greatbear-unstable-corruption'],
    actions: {
      'crushing-maul': { id: 'crushing-maul', name: 'Crushing Maul', actionTimeMs: 1800, description: 'A brutal maul strike crashes into the target.', effects: [scaledDirectDamage('physical', 1.55)], tags: ['special', 'physical', 'melee', 'direct'] },
      groundbreaker: { id: 'groundbreaker', name: 'Groundbreaker', actionTimeMs: 2500, description: "The Greatbear shakes the ground and delays the Player's Basic Attack.", effects: [scaledDirectDamage('physical', 1.2), delayBasicAttack(1200)], tags: ['special', 'physical', 'control'] },
      'corrupted-roar': { id: 'corrupted-roar', name: 'Corrupted Roar', actionTimeMs: 2200, description: 'Makes the target Vulnerable.', effects: [applyStatus('vulnerable', 'opponent')], tags: ['special', 'debuff'] },
      'arcane-rampage': { id: 'arcane-rampage', name: 'Arcane Rampage', actionTimeMs: 3500, description: 'A heavy Arcane strike empowered by unstable corruption.', effects: [scaledDirectDamage('arcane', 2)], tags: ['special', 'magic', 'arcane', 'direct'] },
    },
    actionPatterns: {
      default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('crushing-maul-step', 'crushing-maul'), basic('basic-3'), action('groundbreaker-step', 'groundbreaker')] },
      corrupted: { id: 'corrupted', steps: [basic('basic-1'), action('corrupted-roar-step', 'corrupted-roar'), action('crushing-maul-step', 'crushing-maul'), basic('basic-2'), basic('basic-3'), action('arcane-rampage-step', 'arcane-rampage')] },
    }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'predator-hide', min: 2, max: 4, chance: 1 }, { itemId: 'corrupted-beast-essence', min: 1, max: 2, chance: 1 }, { itemId: 'greatbear-core', min: 1, max: 1, chance: 0.35 }, { itemId: 'greatbear-heartstone', min: 1, max: 1, chance: 0.05 }]),
  },
} satisfies Partial<Record<MonsterId, MonsterDefinition>>

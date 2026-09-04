import type { MonsterId } from '../../types'
import { action, applyStatus, basic, delayBasicAttack, scaledBarrier, scaledDirectDamage, scaledDot, scaledHeal, withLifeEssence, type MonsterDefinition } from './monsterTypes'

export const WHISPERING_WOODS_MONSTERS = {
  'forest-wisp': {
    id: 'forest-wisp', bestiaryCategory: 'monster', name: 'Forest Wisp', subtitle: 'A curious lantern of the undergrowth',
    maxHealth: 44, basicAttackDamage: 5, basicAttackTimeMs: 2800, color: '#aa9aff', ui: { portraitIcon: 'wisp' }, traitIds: ['forest-wisp-flicker'],
    actions: { 'arc-spark': { id: 'arc-spark', name: 'Arc Spark', actionTimeMs: 2000, description: 'A bright Arcane spark lashes the target.', effects: [scaledDirectDamage('arcane', 2.4)], tags: ['special', 'magic', 'arcane', 'direct'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('arc-spark-step', 'arc-spark')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'wisp-essence', min: 1, max: 2, chance: 0.2 }]),
  },
  thornling: {
    id: 'thornling', bestiaryCategory: 'monster', name: 'Thornling', subtitle: 'A knot of spite and briars',
    maxHealth: 64, basicAttackDamage: 8, basicAttackTimeMs: 2500, color: '#cb7899', ui: { portraitIcon: 'plant' }, traitIds: ['thornling-barkskin'],
    actions: { 'thorn-lash': { id: 'thorn-lash', name: 'Thorn Lash', actionTimeMs: 1800, description: 'A thorned lash cuts the target and leaves a lingering Thorn Wound.', effects: [scaledDirectDamage('physical', 1.25), scaledDot('thorn-wound', 'physical', 1.125, 6000)], tags: ['special', 'physical', 'debuff'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('thorn-lash-step', 'thorn-lash')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'wisp-essence', min: 1, max: 2, chance: 0.2 }]),
  },
  'stone-root': {
    id: 'stone-root', bestiaryCategory: 'monster', name: 'Stone Root', subtitle: 'The forest floor given a heartbeat',
    maxHealth: 92, basicAttackDamage: 11, basicAttackTimeMs: 3200, color: '#b28f79', ui: { portraitIcon: 'stone' }, traitIds: ['stone-rooted-shell'],
    actions: { 'root-slam': { id: 'root-slam', name: 'Root Slam', actionTimeMs: 2500, description: "A crushing root strike disrupts the Player's Basic Attack rhythm.", effects: [scaledDirectDamage('physical', 1.65), delayBasicAttack(700)], tags: ['special', 'physical', 'control'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), basic('basic-3'), action('root-slam-step', 'root-slam')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'wisp-essence', min: 1, max: 3, chance: 0.2 }], { chance: 0.2 }),
  },
  'grove-sentinel': {
    id: 'grove-sentinel', bestiaryCategory: 'monster', name: 'Grove Sentinel', subtitle: 'An ancient guardian of the inner grove',
    maxHealth: 360, basicAttackDamage: 15, basicAttackTimeMs: 2600, color: '#d39b59', ui: { portraitIcon: 'guardian' }, traitIds: ['grove-sentinel-ancient-growth'],
    actions: {
      'root-crush': { id: 'root-crush', name: 'Root Crush', actionTimeMs: 2000, description: 'The guardian brings its roots down with crushing force.', effects: [scaledDirectDamage('physical', 1.35)], tags: ['special', 'physical', 'direct'] },
      'verdant-guard': { id: 'verdant-guard', name: 'Verdant Guard', actionTimeMs: 2500, description: 'The guardian gathers living energy into a protective Barrier.', effects: [scaledBarrier(1 / 6)], tags: ['special', 'barrier'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('root-crush-step', 'root-crush'), basic('basic-3'), action('verdant-guard-step', 'verdant-guard')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'grove-bark', min: 1, max: 3, chance: 0.2 }, { itemId: 'wisp-essence', min: 2, max: 4, chance: 0.3 }], { min: 2, max: 5 }),
  },
  'forest-heart': {
    id: 'forest-heart', bestiaryCategory: 'boss', name: 'Forest Heart', subtitle: 'The pulse beneath the roots',
    maxHealth: 600, basicAttackDamage: 20, basicAttackTimeMs: 2400, color: '#e06c8b', ui: { portraitIcon: 'boss' }, traitIds: ['forest-heart-living-core'],
    actions: {
      'heart-pulse': { id: 'heart-pulse', name: 'Heart Pulse', actionTimeMs: 2000, description: 'The Forest Heart releases a crushing pulse through the roots.', effects: [scaledDirectDamage('physical', 1.2)], tags: ['special', 'physical', 'direct'] },
      'root-prison': { id: 'root-prison', name: 'Root Prison', actionTimeMs: 2000, description: "Roots crush the target and delay the Player's next Basic Attack.", effects: [scaledDirectDamage('physical', 0.8), delayBasicAttack(1000)], tags: ['special', 'physical', 'control'] },
      'rejuvenating-sap': { id: 'rejuvenating-sap', name: 'Rejuvenating Sap', actionTimeMs: 3000, description: 'The Heart draws restorative sap inward to recover Health.', effects: [scaledHeal(0.1)], tags: ['special', 'heal', 'direct'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('heart-pulse-step', 'heart-pulse'), basic('basic-3'), basic('basic-4'), action('root-prison-step', 'root-prison'), basic('basic-5'), basic('basic-6'), basic('basic-7'), action('sap-step', 'rejuvenating-sap')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'heartseed', min: 1, max: 1, chance: 1 }], { min: 10, max: 18 }),
  },
} satisfies Partial<Record<MonsterId, MonsterDefinition>>

export const WHISPERING_WOODS_MONSTER_IDS = ['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel', 'forest-heart'] as const satisfies readonly MonsterId[]

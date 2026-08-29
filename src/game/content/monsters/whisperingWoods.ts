import type { MonsterId } from '../../types'
import { action, applyStatus, basic, delayBasicAttack, directDamage, gainBarrier, heal, withLifeEssence, type MonsterDefinition } from './monsterTypes'

export const WHISPERING_WOODS_MONSTERS = {
  'forest-wisp': {
    id: 'forest-wisp', bestiaryCategory: 'monster', name: 'Forest Wisp', subtitle: 'A curious lantern of the undergrowth',
    maxHealth: 44, basicAttackDamage: 5, actionIntervalMs: 2800, color: '#aa9aff', traitIds: ['forest-wisp-flicker'],
    actions: { 'arc-spark': { id: 'arc-spark', name: 'Arc Spark', telegraphMs: 2000, description: 'A bright Arcane spark strikes for 12 damage.', effects: [directDamage('arcane', 12)], tags: ['special', 'magic', 'arcane', 'direct'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('arc-spark-step', 'arc-spark')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }]),
  },
  thornling: {
    id: 'thornling', bestiaryCategory: 'monster', name: 'Thornling', subtitle: 'A knot of spite and briars',
    maxHealth: 64, basicAttackDamage: 8, actionIntervalMs: 2500, color: '#cb7899', traitIds: ['thornling-barkskin'],
    actions: { 'thorn-lash': { id: 'thorn-lash', name: 'Thorn Lash', telegraphMs: 1800, description: 'Deals 10 Physical damage and applies Thorn Wound.', effects: [directDamage('physical', 10), applyStatus('thorn-wound', 'opponent')], tags: ['special', 'physical', 'debuff'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('thorn-lash-step', 'thorn-lash')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }]),
  },
  'stone-root': {
    id: 'stone-root', bestiaryCategory: 'monster', name: 'Stone Root', subtitle: 'The forest floor given a heartbeat',
    maxHealth: 92, basicAttackDamage: 11, actionIntervalMs: 3200, color: '#b28f79', traitIds: ['stone-rooted-shell'],
    actions: { 'root-slam': { id: 'root-slam', name: 'Root Slam', telegraphMs: 2500, description: 'Deals 18 Physical damage and delays the player Basic Attack by 700ms.', effects: [directDamage('physical', 18), delayBasicAttack(700)], tags: ['special', 'physical', 'control'] } },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), basic('basic-3'), action('root-slam-step', 'root-slam')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'wisp-essence', min: 1, max: 3, chance: 1 }]),
  },
  'grove-sentinel': {
    id: 'grove-sentinel', bestiaryCategory: 'monster', name: 'Grove Sentinel', subtitle: 'An ancient guardian of the inner grove',
    maxHealth: 360, basicAttackDamage: 15, actionIntervalMs: 2600, color: '#d39b59', traitIds: ['grove-sentinel-ancient-growth'],
    actions: {
      'root-crush': { id: 'root-crush', name: 'Root Crush', telegraphMs: 2000, description: 'Deals 20 Physical damage.', effects: [directDamage('physical', 20)], tags: ['special', 'physical', 'direct'] },
      'verdant-guard': { id: 'verdant-guard', name: 'Verdant Guard', telegraphMs: 2500, description: 'Gains 60 Barrier.', effects: [gainBarrier({ type: 'flat', value: 60 })], tags: ['special', 'barrier'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('root-crush-step', 'root-crush'), basic('basic-3'), action('verdant-guard-step', 'verdant-guard')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'grove-bark', min: 2, max: 3, chance: 1 }, { itemId: 'wisp-essence', min: 4, max: 6, chance: 1 }]),
  },
  'forest-heart': {
    id: 'forest-heart', bestiaryCategory: 'boss', name: 'Forest Heart', subtitle: 'The pulse beneath the roots',
    maxHealth: 600, basicAttackDamage: 20, actionIntervalMs: 2400, color: '#e06c8b', traitIds: ['forest-heart-living-core'],
    actions: {
      'heart-pulse': { id: 'heart-pulse', name: 'Heart Pulse', telegraphMs: 2000, description: 'Deals 24 Physical damage.', effects: [directDamage('physical', 24)], tags: ['special', 'physical', 'direct'] },
      'root-prison': { id: 'root-prison', name: 'Root Prison', telegraphMs: 2000, description: 'Deals 16 Physical damage and delays the player Basic Attack by 1000ms.', effects: [directDamage('physical', 16), delayBasicAttack(1000)], tags: ['special', 'physical', 'control'] },
      'rejuvenating-sap': { id: 'rejuvenating-sap', name: 'Rejuvenating Sap', telegraphMs: 3000, description: 'Heals 60 HP.', effects: [heal(60)], tags: ['special', 'heal', 'direct'] },
    },
    actionPatterns: { default: { id: 'default', steps: [basic('basic-1'), basic('basic-2'), action('heart-pulse-step', 'heart-pulse'), basic('basic-3'), basic('basic-4'), action('root-prison-step', 'root-prison'), basic('basic-5'), basic('basic-6'), basic('basic-7'), action('sap-step', 'rejuvenating-sap')] } }, defaultActionPatternId: 'default',
    loot: withLifeEssence([{ itemId: 'heartseed', min: 1, max: 1, chance: 1 }]),
  },
} satisfies Partial<Record<MonsterId, MonsterDefinition>>

export const WHISPERING_WOODS_MONSTER_IDS = ['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel', 'forest-heart'] as const satisfies readonly MonsterId[]

import type { ItemId, MonsterId } from '../types'

export interface MonsterDefinition {
  id: MonsterId
  name: string
  subtitle: string
  maxHealth: number
  attackDamage: number
  attackIntervalMs: number
  color: string
  traits: { name: string; description: string; effect: 'thorn' | 'barrier' | 'delay' | 'damage-reduction' }[]
  loot: { itemId: ItemId; min: number; max: number; chance: number }[]
  actionSequence: { id: string; name: string; kind: 'basic' | 'special'; specialAttackId?: string }[]
  specialAttacks: Record<string, { id: string; name: string; telegraphMs: number; description: string; effect: 'damage' | 'damage-thorn' | 'damage-delay' | 'barrier' | 'heal'; amount: number; delayMs?: number }>
  boss?: boolean
}

const basic = (id: string) => ({ id, name: 'Basic', kind: 'basic' as const })
const special = (id: string, specialAttackId: string, name: string) => ({ id, name, kind: 'special' as const, specialAttackId })

export const MONSTERS: Record<MonsterId, MonsterDefinition> = {
  'forest-wisp': { id: 'forest-wisp', name: 'Forest Wisp', subtitle: 'A curious lantern of the undergrowth', maxHealth: 44, attackDamage: 5, attackIntervalMs: 2800, color: '#aa9aff', traits: [{ name: 'Flicker', description: 'Arc Spark is telegraphed before it lands.', effect: 'delay' }], actionSequence: [basic('basic-1'), basic('basic-2'), special('arc-spark-step', 'arc-spark', 'Arc Spark')], specialAttacks: { 'arc-spark': { id: 'arc-spark', name: 'Arc Spark', telegraphMs: 2000, description: 'A bright spark for 12 damage.', effect: 'damage', amount: 12 } }, loot: [{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }] },
  thornling: { id: 'thornling', name: 'Thornling', subtitle: 'A knot of spite and briars', maxHealth: 64, attackDamage: 8, attackIntervalMs: 2500, color: '#cb7899', traits: [{ name: 'Barkskin', description: 'Basic Attack damage received is reduced by 15%.', effect: 'damage-reduction' }], actionSequence: [basic('basic-1'), basic('basic-2'), special('thorn-lash-step', 'thorn-lash', 'Thorn Lash')], specialAttacks: { 'thorn-lash': { id: 'thorn-lash', name: 'Thorn Lash', telegraphMs: 1800, description: '10 damage and a delayed Thorn Wound.', effect: 'damage-thorn', amount: 10 } }, loot: [{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }] },
  'stone-root': { id: 'stone-root', name: 'Stone Root', subtitle: 'The forest floor given a heartbeat', maxHealth: 92, attackDamage: 11, attackIntervalMs: 3200, color: '#b28f79', traits: [{ name: 'Rooted Shell', description: 'Starts with Barrier equal to 15% max HP.', effect: 'barrier' }], actionSequence: [basic('basic-1'), basic('basic-2'), basic('basic-3'), special('root-slam-step', 'root-slam', 'Root Slam')], specialAttacks: { 'root-slam': { id: 'root-slam', name: 'Root Slam', telegraphMs: 2500, description: '18 damage and 700ms Basic Attack delay.', effect: 'damage-delay', amount: 18, delayMs: 700 } }, loot: [{ itemId: 'wisp-essence', min: 1, max: 3, chance: 1 }] },
  'grove-sentinel': { id: 'grove-sentinel', name: 'Grove Sentinel', subtitle: 'Dungeon boss · guardian of the inner grove', maxHealth: 360, attackDamage: 15, attackIntervalMs: 2600, color: '#d39b59', traits: [{ name: 'Ancient Growth', description: 'At 40% HP, gains a large Barrier once.', effect: 'barrier' }], actionSequence: [basic('basic-1'), basic('basic-2'), special('root-crush-step', 'root-crush', 'Root Crush'), basic('basic-3'), special('verdant-guard-step', 'verdant-guard', 'Verdant Guard')], specialAttacks: { 'root-crush': { id: 'root-crush', name: 'Root Crush', telegraphMs: 2000, description: '20 damage.', effect: 'damage', amount: 20 }, 'verdant-guard': { id: 'verdant-guard', name: 'Verdant Guard', telegraphMs: 2500, description: 'Gain 60 Barrier.', effect: 'barrier', amount: 60 } }, loot: [{ itemId: 'grove-bark', min: 2, max: 3, chance: 1 }, { itemId: 'wisp-essence', min: 4, max: 6, chance: 1 }], boss: true },
  'forest-heart': { id: 'forest-heart', name: 'Forest Heart', subtitle: 'Main boss · the pulse beneath the roots', maxHealth: 600, attackDamage: 20, attackIntervalMs: 2400, color: '#e06c8b', traits: [{ name: 'Living Core', description: 'At 50% HP, gains 15% attack speed once.', effect: 'delay' }], actionSequence: [basic('basic-1'), special('heart-pulse-step', 'heart-pulse', 'Heart Pulse'), basic('basic-2'), basic('basic-3'), special('root-prison-step', 'root-prison', 'Root Prison'), basic('basic-4'), special('sap-step', 'rejuvenating-sap', 'Rejuvenating Sap')], specialAttacks: { 'heart-pulse': { id: 'heart-pulse', name: 'Heart Pulse', telegraphMs: 2000, description: '24 damage.', effect: 'damage', amount: 24 }, 'root-prison': { id: 'root-prison', name: 'Root Prison', telegraphMs: 2000, description: '16 damage and 1 second Basic Attack delay.', effect: 'damage-delay', amount: 16, delayMs: 1000 }, 'rejuvenating-sap': { id: 'rejuvenating-sap', name: 'Rejuvenating Sap', telegraphMs: 3000, description: 'Heal 60 HP.', effect: 'heal', amount: 60 } }, loot: [{ itemId: 'heartseed', min: 1, max: 1, chance: 1 }], boss: true },
}

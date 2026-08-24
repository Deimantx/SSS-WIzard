import type { ElementId, ItemDefinition, ItemId, MonsterId, SchoolId, SpellDefinition, SpellEffect, SpellId } from '../types'

export const SCHOOLS: Record<SchoolId, { id: SchoolId; name: string; glyph: string; color: string; fragment: ItemId; tagline: string }> = {
  fire: { id: 'fire', name: 'Fire', glyph: '✦', color: '#ff745d', fragment: 'fire-fragment', tagline: 'Momentum and direct damage' },
  water: { id: 'water', name: 'Water', glyph: '◌', color: '#64b7ff', fragment: 'water-fragment', tagline: 'Recovery and protection' },
  earth: { id: 'earth', name: 'Earth', glyph: '⬢', color: '#d5a36b', fragment: 'earth-fragment', tagline: 'Wards and endurance' },
  air: { id: 'air', name: 'Air', glyph: '≈', color: '#b9d8d0', fragment: 'air-fragment', tagline: 'Speed and disruption' },
}

const material = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, researchSchool?: SchoolId): ItemDefinition => ({ id, name, description, icon, color, kind: 'material', category, source, researchSchool, researchXp: 10 })

export const ITEMS: Record<ItemId, ItemDefinition> = {
  'fire-fragment': material('fire-fragment', 'Fire Fragment', 'A hot shard of condensed elemental force.', '◆', '#ff745d', 'elemental', 'Elemental Condensation', 'fire'),
  'water-fragment': material('water-fragment', 'Water Fragment', 'A cool fragment that remembers the tide.', '◇', '#64b7ff', 'elemental', 'Elemental Condensation', 'water'),
  'earth-fragment': material('earth-fragment', 'Earth Fragment', 'Dense mineral magic from the deep places.', '⬢', '#d5a36b', 'elemental', 'Elemental Condensation', 'earth'),
  'air-fragment': material('air-fragment', 'Air Fragment', 'A weightless mote humming with motion.', '≈', '#b9d8d0', 'elemental', 'Elemental Condensation', 'air'),
  'wisp-essence': material('wisp-essence', 'Wisp Essence', 'Loot from the lesser spirits of Whispering Woods.', '☼', '#c3a7ff', 'monster-loot', 'Whispering Woods normal monsters'),
  'grove-bark': material('grove-bark', 'Grove Bark', 'Resilient bark shed by the Sentinel.', '▥', '#9eaa75', 'monster-loot', 'Grove Sentinel'),
  heartseed: material('heartseed', 'Heartseed', 'A living seed left by the Forest Heart.', '✤', '#f4c46e', 'boss-loot', 'Forest Heart first and repeat kills'),
  'apprentice-wand': { id: 'apprentice-wand', name: 'Apprentice Wand', description: 'A dependable starter focus.', icon: '⌁', color: '#e8c98a', kind: 'equipment', category: 'equipment', source: 'Fresh save', equipmentSlot: 'weapon', stats: {} },
  'ember-staff': { id: 'ember-staff', name: 'Ember Staff', description: 'A staff that makes every basic hit burn brighter.', icon: '⚚', color: '#ff956f', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'weapon', stats: { basicDamage: 4, maxMana: 10, fireSpellDamagePct: 0.2 } },
  'tide-focus': { id: 'tide-focus', name: 'Tide Focus', description: 'A fluid focus that deepens Water barriers.', icon: '◈', color: '#64b7ff', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'focus', stats: { maxMana: 15, waterBarrierPct: 0.2 } },
  'stoneweave-robe': { id: 'stoneweave-robe', name: 'Stoneweave Robe', description: 'A heavy robe that turns barriers into shelter.', icon: '▤', color: '#d5a36b', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'robe', stats: { maxHealth: 20, barrierReceived: 10 } },
  'windthread-charm': { id: 'windthread-charm', name: 'Windthread Charm', description: 'A charm that leaves room for one more automation.', icon: '⌁', color: '#b9d8d0', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'charm', stats: { maxFocus: 10, airSpellDamagePct: 0.1 } },
}

const damage = (amount: number): SpellEffect => ({ type: 'damage', amount })
export const SPELLS: Record<SpellId, SpellDefinition> = {
  'fire-bolt': { id: 'fire-bolt', name: 'Fire Bolt', school: 'fire', description: 'A fast, reliable bolt of flame.', unlockLevel: 2, manaCost: 12, cooldownMs: 3500, autoCastFocus: 15, type: 'damage', effect: damage(28), damage: 28, autoCondition: { type: 'always' } },
  'water-ward': { id: 'water-ward', name: 'Water Ward', school: 'water', description: 'Wraps the wizard in a temporary barrier.', unlockLevel: 2, manaCost: 15, cooldownMs: 8000, autoCastFocus: 20, type: 'barrier', effect: { type: 'barrier', amount: 35 }, barrier: 35, autoCondition: { type: 'barrier-below', value: 10 } },
  'earth-spike': { id: 'earth-spike', name: 'Earth Spike', school: 'earth', description: 'A heavy spike that punishes rooted enemies.', unlockLevel: 2, manaCost: 18, cooldownMs: 5000, autoCastFocus: 20, type: 'damage', effect: damage(40), damage: 40, autoCondition: { type: 'always' } },
  'air-lance': { id: 'air-lance', name: 'Air Lance', school: 'air', description: 'A sharp gust that disrupts the next attack.', unlockLevel: 2, manaCost: 14, cooldownMs: 6000, autoCastFocus: 15, type: 'damage', effect: damage(24), damage: 24, autoCondition: { type: 'always' } },
  ignite: { id: 'ignite', name: 'Ignite', school: 'fire', description: 'A spark that burns after it lands.', unlockLevel: 4, manaCost: 18, cooldownMs: 9000, autoCastFocus: 20, type: 'dot', effect: { type: 'dot', statusId: 'burning', durationMs: 5000, damagePerTick: 5, tickMs: 1000 }, autoCondition: { type: 'always' } },
  'flow-mend': { id: 'flow-mend', name: 'Flow Mend', school: 'water', description: 'A restorative current for a wounded wizard.', unlockLevel: 4, manaCost: 18, cooldownMs: 10000, autoCastFocus: 25, type: 'heal', effect: { type: 'heal', amount: 30 }, autoCondition: { type: 'health-below', percent: 70 } },
  stoneguard: { id: 'stoneguard', name: 'Stoneguard', school: 'earth', description: 'A durable shell of living stone.', unlockLevel: 4, manaCost: 20, cooldownMs: 12000, autoCastFocus: 25, type: 'barrier', effect: { type: 'barrier', amount: 45 }, autoCondition: { type: 'barrier-below', value: 10 } },
  quickening: { id: 'quickening', name: 'Quickening', school: 'air', description: 'A gust that accelerates every Basic Attack.', unlockLevel: 4, manaCost: 16, cooldownMs: 12000, autoCastFocus: 20, type: 'buff', effect: { type: 'buff', statusId: 'quickening', durationMs: 6000, value: 0.25 }, autoCondition: { type: 'always' } },
}

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

export const FRAGMENT_ORDER: ElementId[] = ['fire', 'water', 'earth', 'air']
export const RESEARCH_ITEMS = FRAGMENT_ORDER.map((school) => ({ itemId: SCHOOLS[school].fragment, school, xp: 10, mana: 5, durationMs: 5000, label: `${SCHOOLS[school].name} Fragment` }))
export const getResearchXp = (itemId: ItemId, targetSchoolId: SchoolId) => ITEMS[itemId].researchSchool === targetSchoolId ? 12 : 8

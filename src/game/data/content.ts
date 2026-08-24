import type { ElementId, ItemId, MonsterId, SchoolId, SpellId } from '../types'

export const SCHOOLS: Record<SchoolId, { id: SchoolId; name: string; glyph: string; color: string; fragment: ItemId; tagline: string }> = {
  fire: { id: 'fire', name: 'Fire', glyph: '✦', color: '#ff745d', fragment: 'fire-fragment', tagline: 'Momentum and direct damage' },
  water: { id: 'water', name: 'Water', glyph: '◌', color: '#64b7ff', fragment: 'water-fragment', tagline: 'Recovery and protection' },
  earth: { id: 'earth', name: 'Earth', glyph: '⬢', color: '#d5a36b', fragment: 'earth-fragment', tagline: 'Wards and endurance' },
  air: { id: 'air', name: 'Air', glyph: '≈', color: '#b9d8d0', fragment: 'air-fragment', tagline: 'Speed and disruption' },
}

export const ITEMS: Record<ItemId, { id: ItemId; name: string; description: string; icon: string; color: string; kind: 'material' | 'equipment' }> = {
  'fire-fragment': { id: 'fire-fragment', name: 'Fire Fragment', description: 'A hot shard of condensed elemental force.', icon: '◆', color: '#ff745d', kind: 'material' },
  'water-fragment': { id: 'water-fragment', name: 'Water Fragment', description: 'A cool fragment that remembers the tide.', icon: '◇', color: '#64b7ff', kind: 'material' },
  'earth-fragment': { id: 'earth-fragment', name: 'Earth Fragment', description: 'Dense mineral magic from the deep places.', icon: '⬢', color: '#d5a36b', kind: 'material' },
  'air-fragment': { id: 'air-fragment', name: 'Air Fragment', description: 'A weightless mote humming with motion.', icon: '≈', color: '#b9d8d0', kind: 'material' },
  'wisp-essence': { id: 'wisp-essence', name: 'Wisp Essence', description: 'Loot from the lesser spirits of Whispering Woods.', icon: '☼', color: '#c3a7ff', kind: 'material' },
  'grove-bark': { id: 'grove-bark', name: 'Grove Bark', description: 'Resilient bark shed by the Sentinel.', icon: '▥', color: '#9eaa75', kind: 'material' },
  heartseed: { id: 'heartseed', name: 'Heartseed', description: 'A living seed left by the Forest Heart.', icon: '✤', color: '#f4c46e', kind: 'material' },
  'apprentice-wand': { id: 'apprentice-wand', name: 'Apprentice Wand', description: 'A dependable starter focus.', icon: '⌁', color: '#e8c98a', kind: 'equipment' },
  'ember-staff': { id: 'ember-staff', name: 'Ember Staff', description: 'A transmuted staff that makes every basic hit burn brighter.', icon: '⚚', color: '#ff956f', kind: 'equipment' },
}

export const SPELLS: Record<SpellId, { id: SpellId; name: string; school: SchoolId; description: string; manaCost: number; cooldownMs: number; damage?: number; barrier?: number }> = {
  'fire-bolt': { id: 'fire-bolt', name: 'Fire Bolt', school: 'fire', description: 'A fast, reliable bolt of flame.', manaCost: 12, cooldownMs: 3500, damage: 28 },
  'water-ward': { id: 'water-ward', name: 'Water Ward', school: 'water', description: 'Wraps the wizard in a temporary barrier.', manaCost: 15, cooldownMs: 8000, barrier: 35 },
  'earth-spike': { id: 'earth-spike', name: 'Earth Spike', school: 'earth', description: 'A heavy spike that punishes rooted enemies.', manaCost: 18, cooldownMs: 5000, damage: 40 },
  'air-lance': { id: 'air-lance', name: 'Air Lance', school: 'air', description: 'A sharp gust that disrupts the next attack.', manaCost: 14, cooldownMs: 6000, damage: 24 },
}

export interface MonsterDefinition {
  id: MonsterId
  name: string
  subtitle: string
  maxHealth: number
  attackDamage: number
  attackIntervalMs: number
  color: string
  traits: { name: string; description: string; effect: 'thorn' | 'barrier' | 'delay' }[]
  loot: { itemId: ItemId; min: number; max: number; chance: number }[]
  boss?: boolean
}

export const MONSTERS: Record<MonsterId, MonsterDefinition> = {
  'forest-wisp': { id: 'forest-wisp', name: 'Forest Wisp', subtitle: 'A curious lantern of the undergrowth', maxHealth: 44, attackDamage: 5, attackIntervalMs: 2800, color: '#aa9aff', traits: [{ name: 'Flicker', description: 'Keeps distance between attacks.', effect: 'delay' }], loot: [{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }] },
  thornling: { id: 'thornling', name: 'Thornling', subtitle: 'A knot of spite and briars', maxHealth: 64, attackDamage: 8, attackIntervalMs: 2500, color: '#cb7899', traits: [{ name: 'Thorn Wound', description: 'Hits leave a lingering wound.', effect: 'thorn' }], loot: [{ itemId: 'wisp-essence', min: 1, max: 2, chance: 1 }] },
  'stone-root': { id: 'stone-root', name: 'Stone Root', subtitle: 'The forest floor given a heartbeat', maxHealth: 92, attackDamage: 11, attackIntervalMs: 3200, color: '#b28f79', traits: [{ name: 'Rooted', description: 'Its bark absorbs the first impact.', effect: 'barrier' }], loot: [{ itemId: 'wisp-essence', min: 1, max: 3, chance: 1 }] },
  'grove-sentinel': { id: 'grove-sentinel', name: 'Grove Sentinel', subtitle: 'Dungeon boss · guardian of the inner grove', maxHealth: 360, attackDamage: 15, attackIntervalMs: 2600, color: '#d39b59', traits: [{ name: 'Living Bark', description: 'A heavy blow can leave a Thorn Wound.', effect: 'thorn' }, { name: 'Rooted', description: 'The first hit is softened by bark.', effect: 'barrier' }], loot: [{ itemId: 'grove-bark', min: 2, max: 3, chance: 1 }, { itemId: 'wisp-essence', min: 4, max: 6, chance: 1 }], boss: true },
  'forest-heart': { id: 'forest-heart', name: 'Forest Heart', subtitle: 'Main boss · the pulse beneath the roots', maxHealth: 600, attackDamage: 20, attackIntervalMs: 2400, color: '#e06c8b', traits: [{ name: 'Heartwood', description: 'The Heart protects itself with living bark.', effect: 'barrier' }, { name: 'Thorn Wound', description: 'Every hit risks a lingering wound.', effect: 'thorn' }], loot: [{ itemId: 'heartseed', min: 1, max: 1, chance: 1 }], boss: true },
}

export const FRAGMENT_ORDER: ElementId[] = ['fire', 'water', 'earth', 'air']
export const RESEARCH_ITEMS = FRAGMENT_ORDER.map((school) => ({ itemId: SCHOOLS[school].fragment, school, xp: 10, mana: 5, durationMs: 5000, label: `${SCHOOLS[school].name} Fragment` }))

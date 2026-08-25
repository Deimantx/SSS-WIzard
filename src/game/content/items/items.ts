import type { ItemDefinition, ItemId, SchoolId } from '../../types'

const material = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string, researchSchool?: SchoolId): ItemDefinition => ({ id, name, description, icon, color, kind: 'material', category, source, ...(researchSchool ? { researchSchool, researchXp: 10 } : {}) })
const universalMaterial = (id: ItemId, name: string, description: string, icon: string, color: string, category: ItemDefinition['category'], source: string): ItemDefinition => ({ id, name, description, icon, color, kind: 'material', category, source })

export const ITEMS: Record<ItemId, ItemDefinition> = {
  'life-essence': universalMaterial('life-essence', 'Life Essence', 'Vital residue released when living magic is defeated. A universal catalyst for permanent Tower upgrades.', '✧', '#8fe0c0', 'monster-loot', 'All monsters'),
  'fire-fragment': material('fire-fragment', 'Fire Fragment', 'A hot shard of condensed elemental force.', '◆', '#ff745d', 'elemental', 'Elemental Condensation', 'fire'),
  'water-fragment': material('water-fragment', 'Water Fragment', 'A cool fragment that remembers the tide.', '◇', '#64b7ff', 'elemental', 'Elemental Condensation', 'water'),
  'earth-fragment': material('earth-fragment', 'Earth Fragment', 'Dense mineral magic from the deep places.', '⬢', '#d5a36b', 'elemental', 'Elemental Condensation', 'earth'),
  'air-fragment': material('air-fragment', 'Air Fragment', 'A weightless mote humming with motion.', '≈', '#b9d8d0', 'elemental', 'Elemental Condensation', 'air'),
  'wisp-essence': material('wisp-essence', 'Wisp Essence', 'Loot from the lesser spirits of Whispering Woods.', '☼', '#c3a7ff', 'monster-loot', 'Whispering Woods normal monsters'),
  'grove-bark': material('grove-bark', 'Grove Bark', 'Resilient bark shed by the Sentinel.', '▥', '#9eaa75', 'monster-loot', 'Grove Sentinel'),
  heartseed: material('heartseed', 'Heartseed', 'A living seed left by the Forest Heart.', '✤', '#f4c46e', 'boss-loot', 'Forest Heart first and repeat kills'),
  'apprentice-wand': { id: 'apprentice-wand', name: 'Apprentice Wand', description: 'A dependable starter focus.', icon: '⌁', color: '#e8c98a', kind: 'equipment', category: 'equipment', source: 'Fresh save', equipmentSlot: 'weapon', stats: {} },
  'ember-staff': { id: 'ember-staff', name: 'Ember Staff', description: 'A staff that makes every basic hit burn brighter.', icon: '⚒', color: '#ff956f', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'weapon', stats: { basicDamage: 4, maxMana: 10, fireSpellDamagePct: 0.2 } },
  'tide-focus': { id: 'tide-focus', name: 'Tide Focus', description: 'A fluid focus that deepens Water barriers.', icon: '◈', color: '#64b7ff', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'focus', stats: { maxMana: 15, waterBarrierPct: 0.2 } },
  'stoneweave-robe': { id: 'stoneweave-robe', name: 'Stoneweave Robe', description: 'A heavy robe that turns barriers into shelter.', icon: '▤', color: '#d5a36b', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'robe', stats: { maxHealth: 20, barrierReceived: 10 } },
  'windthread-charm': { id: 'windthread-charm', name: 'Windthread Charm', description: 'A charm that leaves room for one more automation.', icon: '⌁', color: '#b9d8d0', kind: 'equipment', category: 'equipment', source: 'Transmutation', equipmentSlot: 'charm', stats: { maxFocus: 10, airSpellDamagePct: 0.1 } },
}

export const getResearchXp = (itemId: ItemId, targetSchoolId: SchoolId) => ITEMS[itemId].researchSchool === targetSchoolId ? 12 : 8

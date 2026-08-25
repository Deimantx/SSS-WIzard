import type { ElementId, ItemId, SchoolId } from '../../types'

export const SCHOOLS: Record<SchoolId, { id: SchoolId; name: string; glyph: string; color: string; fragment: ItemId; tagline: string }> = {
  fire: { id: 'fire', name: 'Fire', glyph: '✦', color: '#ff745d', fragment: 'fire-fragment', tagline: 'Momentum and direct damage' },
  water: { id: 'water', name: 'Water', glyph: '◌', color: '#64b7ff', fragment: 'water-fragment', tagline: 'Recovery and protection' },
  earth: { id: 'earth', name: 'Earth', glyph: '⬢', color: '#d5a36b', fragment: 'earth-fragment', tagline: 'Wards and endurance' },
  air: { id: 'air', name: 'Air', glyph: '≈', color: '#b9d8d0', fragment: 'air-fragment', tagline: 'Speed and disruption' },
}

export const FRAGMENT_ORDER: ElementId[] = ['fire', 'water', 'earth', 'air']
export const RESEARCH_ITEMS = FRAGMENT_ORDER.map((school) => ({ itemId: SCHOOLS[school].fragment, school, xp: 10, mana: 5, durationMs: 5000, label: `${SCHOOLS[school].name} Fragment` }))

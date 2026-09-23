import { useMemo, useRef } from 'react'
import { FilterBar, SearchInput } from '../../components/ui'
import type { SpellId, SchoolId } from '../../game/types'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { getSpellBrowserEntries, type SpellBrowserEntry, type SpellBrowserFilters } from './spellBrowserSelectors'
import type { SpellPresentationState } from './spellDetailPresentation'
import { SpellRow } from './SpellRow'

type LibraryCategory = 'All' | 'Damage' | 'Defense' | 'Control' | 'Utility'
const categories: readonly LibraryCategory[] = ['All', 'Damage', 'Defense', 'Control', 'Utility']
const categoryOptions = categories.map((value) => ({ value, label: value }))
const categoryMatches = (entry: SpellBrowserEntry, category: LibraryCategory) => {
  if (category === 'All' || entry.kind !== 'spell' || !entry.unlocked) return category === 'All'
  if (category === 'Defense') return entry.tags.some((tag) => tag === 'Healing' || tag === 'Barrier' || tag === 'Buff')
  if (category === 'Control') return entry.tags.includes('Control')
  if (category === 'Utility') return entry.tags.some((tag) => tag === 'DoT' || tag === 'Buff')
  return entry.tags.includes('Damage')
}

export function SpellLibrary({ state, school, filters, selectedEntryId, newSpells, equippedSpellIds, canEdit, onFiltersChange, onSelect, onEquip, onRemove }: { state: SpellPresentationState; school: SchoolId; filters: SpellBrowserFilters & { category: LibraryCategory }; selectedEntryId: string | null; newSpells: ReadonlySet<SpellId>; equippedSpellIds: ReadonlySet<SpellId>; canEdit: boolean; onFiltersChange: (next: SpellBrowserFilters & { category: LibraryCategory }) => void; onSelect: (id: SpellId | string) => void; onEquip: (spellId: SpellId) => void; onRemove: (spellId: SpellId) => void }) {
  const listRef = useRef<HTMLDivElement>(null)
  const entries = useMemo(() => getSpellBrowserEntries(state, { ...filters, school, showUnlockedOnly: false, type: 'All Types', sort: filters.sort }), [state, filters, school])
  const visibleEntries = useMemo(() => entries.filter((entry) => categoryMatches(entry, filters.category)), [entries, filters.category])
  useSmartScrollState(listRef, { dependencies: [visibleEntries.map((entry) => entry.id).join('|'), filters.search, filters.category, school] })
  const update = <K extends keyof (SpellBrowserFilters & { category: LibraryCategory })>(key: K, value: (SpellBrowserFilters & { category: LibraryCategory })[K]) => onFiltersChange({ ...filters, [key]: value })
  return <section className="schools-library-panel">
    <div className="section-heading"><div><div className="panel-kicker">ARCANE CATALOG</div><h2>Spell Library</h2><p>Choose a spell to inspect its mechanics or prepare it for combat.</p></div><span className="section-count">{visibleEntries.length} ENTRIES</span></div>
    <div className="library-toolbar"><SearchInput value={filters.search} onChange={(value) => update('search', value)} placeholder="Search spells..." ariaLabel="Search spells" /><FilterBar options={categoryOptions} value={filters.category} onChange={(value) => update('category', value)} ariaLabel="Spell category" /></div>
    <div ref={listRef} className="spell-library-list smart-scroll-region" aria-label="Spell library">
      {visibleEntries.map((entry) => <SpellRow key={entry.id} entry={entry} state={state} selected={entry.id === selectedEntryId} equipped={entry.kind === 'spell' && equippedSpellIds.has(entry.spellId)} newSpell={entry.kind === 'spell' && newSpells.has(entry.spellId)} canEdit={canEdit} onSelect={onSelect} onEquip={onEquip} onRemove={onRemove} />)}
      {!visibleEntries.length && <div className="library-empty-state"><strong>NO SPELLS IN THIS VIEW</strong><span>Try another category or search term.</span></div>}
    </div>
  </section>
}

import { FRAGMENT_ORDER, SCHOOLS } from '../../game/data/schools'
import { FilterBar, GameTooltip, SearchInput, SelectMenu } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { SpellId } from '../../game/types'
import { SpellBrowserTile } from './SpellBrowserTile'
import { getSpellBrowserEntries, type SpellBrowserEntry, type SpellBrowserFilters, type SpellBrowserSchoolFilter, type SpellBrowserSort, type SpellBrowserTypeFilter } from './spellBrowserSelectors'
import type { SpellPresentationState } from './spellDetailPresentation'

const schoolFilters: readonly { value: SpellBrowserSchoolFilter; label: React.ReactNode }[] = [{ value: 'all', label: 'All' }, ...FRAGMENT_ORDER.map((school) => ({ value: school, label: <><span className="schools-filter-glyph" aria-hidden="true">{SCHOOLS[school].glyph}</span>{SCHOOLS[school].name}</> }))]
const typeFilters: readonly SpellBrowserTypeFilter[] = ['All Types', 'Damage', 'Healing', 'Barrier', 'Buff', 'Control', 'DoT']
const sortOptions: readonly SpellBrowserSort[] = ['Unlock Level', 'Name', 'School']
const typeMenuOptions = typeFilters.map((type) => ({ value: type, label: type === 'All Types' ? 'All' : type }))
const sortMenuOptions = sortOptions.map((sort) => ({ value: sort, label: sort === 'Unlock Level' ? 'Unlock' : sort }))

export function SpellBrowser({ state, filters, onFiltersChange, selectedEntryId, onSelect }: {
  state: SpellPresentationState
  filters: SpellBrowserFilters
  onFiltersChange: (next: SpellBrowserFilters) => void
  selectedEntryId: string | null
  onSelect: (id: SpellId | string) => void
}) {
  const entries = getSpellBrowserEntries(state, filters)
  const hasKnownSpells = getSpellBrowserEntries(state, { ...filters, showUnlockedOnly: false }).some((entry) => entry.kind === 'spell' && entry.unlocked)
  const showKnownEmptyState = !entries.length && filters.showUnlockedOnly && !hasKnownSpells && !filters.search && filters.school === 'all' && filters.type === 'All Types'
  const update = <K extends keyof SpellBrowserFilters>(key: K, value: SpellBrowserFilters[K]) => onFiltersChange({ ...filters, [key]: value })
  return <div className="schools-browser-panel">
    <div className="panel-kicker">SPELLBOOK</div>
    <div className="schools-browser-heading"><div><h2>Spellbook</h2><p className="muted">Select a known Spell to inspect its mechanics.</p></div><span className="schools-entry-count">{entries.length} Spells</span></div>
    <div className="schools-school-filters"><FilterBar options={schoolFilters} value={filters.school} onChange={(value) => update('school', value)} ariaLabel="Spell school filter" /></div>
    <div className="schools-browser-controls">
      <SearchInput value={filters.search} onChange={(value) => update('search', value)} placeholder="Search Spells…" ariaLabel="Search Spells" />
      <GameTooltip content={<TooltipContent title="Show Unlocked Only" description="Hide locked authored spells and future catalog placeholders." />}><label className="schools-unlocked-toggle"><input type="checkbox" checked={filters.showUnlockedOnly} onChange={(event) => update('showUnlockedOnly', event.target.checked)} /><span>Unlocked Only</span></label></GameTooltip>
      <SelectMenu options={typeMenuOptions} value={filters.type} onChange={(value) => update('type', value)} ariaLabel="Spell type filter" prefix="Type: " />
      <SelectMenu options={sortMenuOptions} value={filters.sort} onChange={(value) => update('sort', value)} ariaLabel="Spell sort" prefix="Sort: " />
    </div>
    <div className="spell-browser-grid" aria-label="Spell catalog">
      {entries.map((entry: SpellBrowserEntry) => <SpellBrowserTile key={entry.id} entry={entry} state={state} selected={entry.id === selectedEntryId} onSelect={onSelect} />)}
      {!entries.length && <div className="schools-empty-state">{showKnownEmptyState ? <><h3>NO SPELLS LEARNED YET</h3><p>Reach School Level 2 through Research to reveal your first Spells.</p><small>Turn off Unlocked Only to preview locked slots.</small></> : <p>No visible Spells match these filters.</p>}</div>}
    </div>
  </div>
}

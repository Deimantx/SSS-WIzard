import { FRAGMENT_ORDER, SCHOOLS } from '../../game/data/schools'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import { FilterBar, GameTooltip, Progress, SearchInput } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { GameState, SchoolId, SpellId } from '../../game/types'
import { SpellBrowserTile } from './SpellBrowserTile'
import { getSpellBrowserEntries, type SpellBrowserEntry, type SpellBrowserFilters, type SpellBrowserSchoolFilter, type SpellBrowserSort, type SpellBrowserTypeFilter } from './spellBrowserSelectors'

const schoolFilters: readonly { value: SpellBrowserSchoolFilter; label: string }[] = [{ value: 'all', label: 'All' }, ...FRAGMENT_ORDER.map((school) => ({ value: school, label: SCHOOLS[school].name }))]
const typeFilters: readonly SpellBrowserTypeFilter[] = ['All Types', 'Damage', 'Healing', 'Barrier', 'Buff', 'Control', 'DoT']
const sortOptions: readonly SpellBrowserSort[] = ['Unlock Level', 'Name', 'School']

export function SpellBrowser({ state, filters, onFiltersChange, selectedEntryId, onSelect }: {
  state: Pick<GameState, 'schools' | 'progress'>
  filters: SpellBrowserFilters
  onFiltersChange: (next: SpellBrowserFilters) => void
  selectedEntryId: string | null
  onSelect: (id: SpellId | string) => void
}) {
  const entries = getSpellBrowserEntries(state, filters)
  const update = <K extends keyof SpellBrowserFilters>(key: K, value: SpellBrowserFilters[K]) => onFiltersChange({ ...filters, [key]: value })
  return <div className="schools-browser-panel">
    <div className="panel-kicker">SPELLBOOK</div>
    <div className="schools-browser-heading"><div><h2>Spell Browser</h2><p className="muted">Select an entry to inspect its authored mechanics.</p></div><span className="schools-entry-count">{entries.length} entries</span></div>
    <div className="schools-school-filters"><FilterBar options={schoolFilters} value={filters.school} onChange={(value) => update('school', value)} ariaLabel="Spell school filter" /></div>
    <div className="schools-browser-controls">
      <SearchInput value={filters.search} onChange={(value) => update('search', value)} placeholder="Search Spells…" ariaLabel="Search Spells" />
      <label className="schools-select-label"><span>Type</span><select aria-label="Spell type filter" value={filters.type} onChange={(event) => update('type', event.target.value as SpellBrowserTypeFilter)}>{typeFilters.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label className="schools-select-label"><span>Sort</span><select aria-label="Spell sort" value={filters.sort} onChange={(event) => update('sort', event.target.value as SpellBrowserSort)}>{sortOptions.map((sort) => <option key={sort}>{sort}</option>)}</select></label>
    </div>
    <div className="schools-browser-options">
      <GameTooltip content={<TooltipContent title="Show Unlocked Only" description="Hide locked authored spells and future catalog placeholders." />}>
        <label><input type="checkbox" checked={filters.showUnlockedOnly} onChange={(event) => update('showUnlockedOnly', event.target.checked)} /> Show Unlocked Only</label>
      </GameTooltip>
    </div>
    <div className="schools-progression-strip" aria-label="School progression">
      {FRAGMENT_ORDER.map((schoolId) => <SchoolProgression key={schoolId} schoolId={schoolId} state={state} />)}
    </div>
    <div className="spell-browser-grid" aria-label="Spell catalog">
      {entries.map((entry: SpellBrowserEntry) => <SpellBrowserTile key={entry.id} entry={entry} selected={entry.id === selectedEntryId} onSelect={onSelect} />)}
      {!entries.length && <div className="schools-empty-state">No visible spells match these filters.</div>}
    </div>
  </div>
}

function SchoolProgression({ schoolId, state }: { schoolId: SchoolId; state: Pick<GameState, 'schools' | 'progress'> }) {
  const school = SCHOOLS[schoolId]
  const info = getSchoolProgressInfo(state, schoolId)
  return <div className="school-progression-compact" style={{ '--school-color': school.color } as React.CSSProperties}>
    <div className="school-progression-head"><span className="school-progression-glyph">{school.glyph}</span><strong>{school.name}</strong><span>Lv {info.level}</span></div>
    <Progress value={info.progress * 100} tone={schoolId} right={<>{info.xp} XP</>} />
    <small>{info.atCap ? 'At cap' : `Next Lv ${info.nextLevelXp}`}</small>
  </div>
}

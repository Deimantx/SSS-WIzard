import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { SpellBrowser } from './SpellBrowser'
import { SpellInspector } from './SpellInspector'
import { SpellPresetDialog } from './SpellPresetDialog'
import { SpellPresetSummary } from './SpellPresetSummary'
import { getSpellBrowserEntries, type SpellBrowserFilters } from './spellBrowserSelectors'

const DEFAULT_FILTERS: SpellBrowserFilters = { school: 'all', search: '', showUnlockedOnly: true, type: 'All Types', sort: 'Unlock Level' }

export function MagicSchoolsScreenV2() {
  const schools = useGameStore((state) => state.schools)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const activities = useGameStore((state) => state.activities)
  const toggleAutoCast = useGameStore((state) => state.toggleAutoCast)
  const browserState = useMemo(() => ({ schools, progress }), [schools, progress])
  const inspectorState = useMemo(() => ({ schools, progress, equipment, activities }), [schools, progress, equipment, activities])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [rankPathOpen, setRankPathOpen] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)
  const visibleEntries = useMemo(() => getSpellBrowserEntries(browserState, filters), [browserState, filters])
  const selectedEntry = visibleEntries.find((entry) => entry.id === selectedEntryId) ?? null

  useEffect(() => {
    const nextId = selectedEntryId && visibleEntries.some((entry) => entry.id === selectedEntryId) ? selectedEntryId : visibleEntries[0]?.id ?? null
    if (nextId === selectedEntryId) return
    setSelectedEntryId(nextId)
    setRankPathOpen(false)
  }, [selectedEntryId, visibleEntries])

  return <div className="screen-content schools-screen">
    <div className="screen-header schools-screen-header"><div><div className="eyebrow">MAGIC SCHOOL ARCHIVE</div><h1>Magic Schools</h1><p>Browse your known Spells, inspect their effects and configure reusable Auto-Cast presets.</p></div></div>
    <EditableGrid screen="schools" panels={[
      { id: 'schools-browser', content: <SpellBrowser state={browserState} filters={filters} onFiltersChange={setFilters} selectedEntryId={selectedEntryId} onSelect={(id) => { setSelectedEntryId(id); setRankPathOpen(false) }} /> },
      { id: 'schools-inspector', content: <SpellInspector entry={selectedEntry} state={inspectorState} rankPathOpen={rankPathOpen} onToggleRankPath={() => setRankPathOpen((open) => !open)} onToggleAutoCast={toggleAutoCast} /> },
      { id: 'schools-presets', content: <SpellPresetSummary onManage={() => { setRankPathOpen(false); setPresetsOpen(true) }} /> },
    ]} />
    <SpellPresetDialog open={presetsOpen} onClose={() => setPresetsOpen(false)} />
  </div>
}

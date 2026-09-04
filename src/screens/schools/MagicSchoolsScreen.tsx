import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { SpellBrowser } from './SpellBrowser'
import { SpellInspector } from './SpellInspector'
import { SpellPresetDialog } from './SpellPresetDialog'
import { SpellPresetSummary } from './SpellPresetSummary'
import { getSpellBrowserEntries, type SpellBrowserFilters } from './spellBrowserSelectors'
import { getAdaptiveSchoolsLayout } from './schoolsLayout'
import { clearAttention, useProfileAttention } from '../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../profiles/profileSessionStore'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'

const DEFAULT_FILTERS: SpellBrowserFilters = { school: 'all', search: '', showUnlockedOnly: true, type: 'All Types', sort: 'Unlock Level' }

export function MagicSchoolsScreenV2() {
  const schools = useGameStore((state) => state.schools)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const activities = useGameStore((state) => state.activities)
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const allowFocusOverCap = useGameStore((state) => state.debug.allowFocusOverCap)
  const attention = useProfileAttention(getActiveProfileId())
  const toggleAutoCast = useGameStore((state) => state.toggleAutoCast)
  const browserState = useMemo(() => ({ schools, progress, equipment, activities }), [schools, progress, equipment, activities])
  const inspectorState = useMemo(() => ({ schools, progress, equipment, activities, player: { maxFocus }, debug: { allowFocusOverCap } }), [schools, progress, equipment, activities, maxFocus, allowFocusOverCap])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [inspectorContentHeight, setInspectorContentHeight] = useState(0)
  const [rankPathOpen, setRankPathOpen] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)
  const visibleEntries = useMemo(() => getSpellBrowserEntries(browserState, filters), [browserState, filters])
  const selectedEntry = visibleEntries.find((entry) => entry.id === selectedEntryId) ?? null
  const reportInspectorContentHeight = useCallback((height: number) => setInspectorContentHeight((current) => current === height ? current : height), [])
  const layoutTransform = useCallback((layout: Parameters<typeof getAdaptiveSchoolsLayout>[0]) => getAdaptiveSchoolsLayout(layout, inspectorContentHeight), [inspectorContentHeight])

  useEffect(() => {
    const nextId = selectedEntryId && visibleEntries.some((entry) => entry.id === selectedEntryId) ? selectedEntryId : visibleEntries[0]?.id ?? null
    if (nextId === selectedEntryId) return
    setSelectedEntryId(nextId)
    setRankPathOpen(false)
  }, [selectedEntryId, visibleEntries])

  return <div className="screen-content schools-screen">
    <div className="screen-header schools-screen-header"><div><div className="eyebrow">MAGIC SCHOOL ARCHIVE</div><h1>Magic Schools</h1><p>Browse your known Spells, inspect their effects and configure reusable Auto-Cast presets.</p></div></div>
    <EditableGrid screen="schools" layoutTransform={layoutTransform} panels={[
      { id: 'schools-browser', content: <SpellBrowser state={browserState} filters={filters} onFiltersChange={setFilters} selectedEntryId={selectedEntryId} newSpells={new Set(attention.unseenSpells)} onSelect={(id) => { dismissGameTooltips(); clearAttention(getActiveProfileId(), 'spell', id); setSelectedEntryId(id); setRankPathOpen(false) }} /> },
      { id: 'schools-inspector', content: <InspectorTransition identity={selectedEntry?.id}><SpellInspector entry={selectedEntry} state={inspectorState} onContentHeightChange={reportInspectorContentHeight} rankPathOpen={rankPathOpen} onToggleRankPath={() => { dismissGameTooltips(); setRankPathOpen((open) => !open) }} onToggleAutoCast={toggleAutoCast} /></InspectorTransition> },
      { id: 'schools-presets', content: <SpellPresetSummary onManage={() => { dismissGameTooltips(); setRankPathOpen(false); setPresetsOpen(true) }} /> },
    ]} />
    <SpellPresetDialog open={presetsOpen} onClose={() => setPresetsOpen(false)} />
  </div>
}

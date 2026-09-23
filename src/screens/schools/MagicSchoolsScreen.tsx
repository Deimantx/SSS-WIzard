import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { getActiveProfileId } from '../../profiles/profileSessionStore'
import { clearAttention, useProfileAttention } from '../../ui/attention/attentionStore'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { setNavigationIntent, useNavigationIntent } from '../../ui/navigation/navigationIntent'
import { useGameStore } from '../../store/gameStore'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import type { SchoolId, SpellId } from '../../game/types'
import { getSpellBrowserEntries, type SpellBrowserFilters } from './spellBrowserSelectors'
import { SpellInspector } from './SpellInspector'
import { MagicSchoolsHeader } from './MagicSchoolsHeader'
import { SchoolProgressOverview } from './SchoolProgressOverview'
import { SpellLibrary } from './SpellLibrary'
import { CombatSpellLoadout } from './CombatSpellLoadout'
import { SpellLoadoutDndProvider, type SpellDragPayload, type SpellDropTarget } from './SpellLoadoutDnd'

type LibraryCategory = 'All' | 'Damage' | 'Defense' | 'Control' | 'Utility'
type ScreenFilters = SpellBrowserFilters & { category: LibraryCategory }

const DEFAULT_FILTERS: ScreenFilters = { school: 'fire', search: '', showUnlockedOnly: false, type: 'All Types', sort: 'Unlock Level', category: 'All' }

export function MagicSchoolsScreenV2() {
  const schools = useGameStore((state) => state.schools)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const arcaneCore = useGameStore((state) => state.arcaneCore)
  const activities = useGameStore((state) => state.activities)
  const player = useGameStore((state) => state.player)
  const combat = useGameStore((state) => state.combat)
  const allowFocusOverCap = useGameStore((state) => state.debug.allowFocusOverCap)
  const addSpell = useGameStore((state) => state.addSpellToSelectedPreset)
  const addSpellAt = useGameStore((state) => state.addSpellToSelectedPresetAt)
  const swapSlots = useGameStore((state) => state.swapSelectedPresetSlots)
  const removeSpell = useGameStore((state) => state.removeSpellFromSelectedPreset)
  const navigationIntent = useNavigationIntent()
  const attention = useProfileAttention(getActiveProfileId())
  const [filters, setFilters] = useState<ScreenFilters>(() => ({ ...DEFAULT_FILTERS, school: navigationIntent.schoolId ?? DEFAULT_FILTERS.school }))
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(() => navigationIntent.schoolSpellId)
  const [rankPathOpen, setRankPathOpen] = useState(false)
  const browserState = useMemo(() => ({ schools, progress, equipment, artifactProgress, arcaneCore, activities, player, combat, debug: { allowFocusOverCap } }), [schools, progress, equipment, artifactProgress, arcaneCore, activities, player, combat, allowFocusOverCap])
  const selectedSchool = filters.school === 'all' ? 'fire' : filters.school
  const schoolEntries = useMemo(() => getSpellBrowserEntries(browserState, { ...filters, school: selectedSchool, showUnlockedOnly: false, type: 'All Types' }), [browserState, filters, selectedSchool])
  const selectedEntry = schoolEntries.find((entry) => entry.id === selectedEntryId) ?? null
  const selectedPreset = useGameStore((state) => state.spellPresets.presets.find((preset) => preset.id === state.spellPresets.selectedPresetId) ?? null)
  const activeLoadout = combat.active && combat.activeSpellLoadout ? combat.activeSpellLoadout.slots : selectedPreset?.slots ?? []
  const equippedSpellIds = useMemo(() => new Set(activeLoadout.map((slot) => slot.spellId)), [activeLoadout])
  const focusState = useMemo(() => ({ activities, progress, equipment, artifactProgress, arcaneCore, player: { maxFocus: player.maxFocus } }), [activities, progress, equipment, artifactProgress, arcaneCore, player.maxFocus])

  useEffect(() => {
    if (navigationIntent.schoolId && navigationIntent.schoolId !== filters.school) setFilters((current) => ({ ...current, school: navigationIntent.schoolId! }))
    if (navigationIntent.schoolSpellId) setSelectedEntryId(navigationIntent.schoolSpellId)
  }, [navigationIntent.schoolId, navigationIntent.schoolSpellId])

  useEffect(() => {
    if (selectedEntry && selectedEntry.school === selectedSchool) return
    setSelectedEntryId(schoolEntries[0]?.id ?? null)
  }, [selectedEntry, selectedSchool, schoolEntries])

  const selectSchool = (schoolId: SchoolId) => {
    dismissGameTooltips()
    setFilters((current) => ({ ...current, school: schoolId, search: '', category: 'All' }))
    setRankPathOpen(false)
    setNavigationIntent({ schoolId })
  }
  const selectSpell = (id: SpellId | string) => {
    dismissGameTooltips()
    clearAttention(getActiveProfileId(), 'spell', id)
    setSelectedEntryId(id)
    setRankPathOpen(false)
    setNavigationIntent({ schoolSpellId: id as SpellId, schoolId: selectedSchool })
  }
  const equipSpell = (spellId: SpellId) => {
    const result = addSpell(spellId)
    if (result.ok) setSelectedEntryId(spellId)
  }
  const selectLoadoutSpell = (spellId: SpellId) => {
    const spell = SPELLS[spellId]
    if (!spell) return
    dismissGameTooltips()
    clearAttention(getActiveProfileId(), 'spell', spellId)
    setFilters((current) => ({ ...current, school: spell.school, search: '', category: 'All' }))
    setSelectedEntryId(spellId)
    setRankPathOpen(false)
    setNavigationIntent({ schoolId: spell.school, schoolSpellId: spellId })
  }
  const commitSpellDrop = useCallback((payload: SpellDragPayload, target: SpellDropTarget) => {
    if (combat.active) return
    if (payload.source === 'loadout') {
      swapSlots(payload.fromIndex, target.index)
      return
    }
    addSpellAt(payload.spellId, Math.min(target.index, activeLoadout.length))
  }, [combat.active, activeLoadout.length, swapSlots, addSpellAt])

  return <div className="screen-content schools-screen">
    <MagicSchoolsHeader schools={schools} selectedSchool={selectedSchool} onSelect={selectSchool} />
    <SchoolProgressOverview state={{ schools, progress }} schoolId={selectedSchool} />
    <SpellLoadoutDndProvider onCommit={commitSpellDrop}><ScreenGrid screen="schools" panels={[
      { id: 'schools-library', content: <SpellLibrary state={browserState} school={selectedSchool} filters={filters} selectedEntryId={selectedEntryId} newSpells={new Set(attention.unseenSpells)} equippedSpellIds={equippedSpellIds} canEdit={!combat.active} onFiltersChange={setFilters} onSelect={selectSpell} onEquip={equipSpell} onRemove={removeSpell} /> },
      { id: 'schools-inspector', content: <InspectorTransition identity={selectedEntry?.id} accent={selectedEntry ? SCHOOLS[selectedEntry.school].color : undefined} fill><SpellInspector entry={selectedEntry} state={browserState} rankPathOpen={rankPathOpen} equippedSlotIndex={selectedEntry?.kind === 'spell' ? activeLoadout.findIndex((slot) => slot.spellId === selectedEntry.spellId) : null} canEdit={!combat.active} onEquip={equipSpell} onRemove={removeSpell} onToggleRankPath={() => { dismissGameTooltips(); setRankPathOpen((open) => !open) }} /></InspectorTransition> },
      { id: 'schools-loadout', content: <CombatSpellLoadout focusState={focusState} onSelectSpell={selectLoadoutSpell} /> },
    ]} /></SpellLoadoutDndProvider>
  </div>
}

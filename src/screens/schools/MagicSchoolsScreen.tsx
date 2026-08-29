import { useEffect, useMemo, useState } from 'react'
import { isTutorialCompleted } from '../../game/content/dungeons/dungeons'
import { BALANCE } from '../../game/core/balance/balance'
import { useGameStore } from '../../store/gameStore'
import { GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { SpellBrowser } from './SpellBrowser'
import { SpellInspector } from './SpellInspector'
import { SpellPresetDialog } from './SpellPresetDialog'
import { SpellPresetSummary } from './SpellPresetSummary'
import { getSpellBrowserEntries, type SpellBrowserFilters } from './spellBrowserSelectors'

const DEFAULT_FILTERS: SpellBrowserFilters = { school: 'all', search: '', showUnlockedOnly: false, type: 'All Types', sort: 'Unlock Level' }

export function MagicSchoolsScreenV2() {
  const schools = useGameStore((state) => state.schools)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const activities = useGameStore((state) => state.activities)
  const toggleAutoCast = useGameStore((state) => state.toggleAutoCast)
  const game = { schools, progress, equipment, activities }
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [rankPathOpen, setRankPathOpen] = useState(false)
  const [presetsOpen, setPresetsOpen] = useState(false)
  const visibleEntries = useMemo(() => getSpellBrowserEntries(game, filters), [game, filters])
  const selectedEntry = visibleEntries.find((entry) => entry.id === selectedEntryId) ?? null

  useEffect(() => {
    if (selectedEntry) return
    setSelectedEntryId(visibleEntries[0]?.id ?? null)
    setRankPathOpen(false)
  }, [selectedEntry, visibleEntries])

  const cap = game.progress.magicLevelCap
  const tutorialComplete = isTutorialCompleted(game.progress)
  return <div className="screen-content schools-screen">
    <div className="screen-header schools-screen-header"><div><div className="eyebrow">MAGIC SCHOOL ARCHIVE</div><h1>Magic Schools</h1><p>Browse your spellbook, inspect Spell mechanics and prepare Auto-Cast presets.</p></div><GameTooltip content={<TooltipContent title="Magic School level cap" description={cap >= BALANCE.schoolProgression.tutorialCompleteCap || tutorialComplete ? 'Tutorial complete. Schools can progress through Level 40.' : `Schools are capped at Level ${BALANCE.schoolProgression.startingCap} until Archmage Edrin's Shade is defeated.`} />}><Status tone={cap >= BALANCE.schoolProgression.tutorialCompleteCap || tutorialComplete ? 'success' : 'active'}>{cap >= BALANCE.schoolProgression.tutorialCompleteCap || tutorialComplete ? `CAP ${cap} · TUTORIAL COMPLETE` : `CAP ${cap} · EDRIN → 40`}</Status></GameTooltip></div>
    <EditableGrid screen="schools" panels={[
      { id: 'schools-browser', content: <SpellBrowser state={game} filters={filters} onFiltersChange={setFilters} selectedEntryId={selectedEntryId} onSelect={(id) => { setSelectedEntryId(id); setRankPathOpen(false) }} /> },
      { id: 'schools-inspector', content: <SpellInspector entry={selectedEntry} state={game} rankPathOpen={rankPathOpen} onToggleRankPath={() => setRankPathOpen((open) => !open)} onToggleAutoCast={toggleAutoCast} /> },
      { id: 'schools-presets', content: <SpellPresetSummary onManage={() => setPresetsOpen(true)} /> },
    ]} />
    <SpellPresetDialog open={presetsOpen} onClose={() => setPresetsOpen(false)} />
  </div>
}

import { ChevronLeft, ChevronRight, Gauge, Package, RotateCcw, Timer } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Card, GameTooltip, Progress } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemUsesDialog } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { getDungeonStatisticsPresentation } from '../../game/presentation/combat/dungeonStatisticsPresentation'
import { formatUiCount } from '../../game/presentation/numbers'
import { useDungeonStatisticsStore } from '../../game/telemetry/dungeon/dungeonStatisticsStore'
import { DUNGEON_STATISTICS_MODE_ORDER, type DungeonStatisticsMode } from '../../game/telemetry/dungeon/dungeonStatisticsTypes'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { buildItemContextSections } from '../../ui/context-menu/itemContextActions'
import { getItemDropSources, getItemSources } from '../../game/content/contentRelations'
import { getItemUses } from '../../game/content/items/inventoryMetadata'
import { isTransmutationRecipeId } from '../../game/content/recipes/recipes'
import { useGameStore } from '../../store/gameStore'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { useCombatPerformanceToggle } from './performance/combatPerformanceDiagnostics'

const modeLabels: Record<DungeonStatisticsMode, string> = { runs: 'RUNS', drops: 'DROPS', efficiency: 'EFFICIENCY' }

export function DungeonStatisticsPanel() {
  const statisticsEnabled = useCombatPerformanceToggle('dungeonStatistics')
  if (!statisticsEnabled) return null
  return <DungeonStatisticsPanelLive />
}

function DungeonStatisticsPanelLive() {
  const statisticsSignal = useDungeonStatisticsStore(useShallow((state) => {
    const session = state.session
    return {
      active: state.active,
      dungeonId: session?.dungeonId ?? null,
      elapsedBucket: Math.floor((session?.elapsedMs ?? 0) / 250),
      engagedBucket: Math.floor((session?.engagedMs ?? 0) / 250),
      currentRunBucket: Math.floor((session?.currentRunElapsedMs ?? 0) / 250),
      completedRuns: session?.completedRuns ?? 0,
      completedRunDurationTotalMs: session?.completedRunDurationTotalMs ?? 0,
      bestRunMs: session?.bestRunMs ?? null,
      normalEncounterCount: session?.normalEncounterCount ?? 0,
      normalEncounterDurationTotalMs: session?.normalEncounterDurationTotalMs ?? 0,
      fastestEncounterMs: session?.fastestEncounterMs ?? null,
      bossEncounterCount: session?.bossEncounterCount ?? 0,
      bossDurationTotalMs: session?.bossDurationTotalMs ?? 0,
      fastestBossMs: session?.fastestBossMs ?? null,
      totalLootQuantity: session?.totalLootQuantity ?? 0,
      lootByItemId: session?.lootByItemId,
      resonanceByType: session?.resonanceByType,
      reset: state.reset,
    }
  }))
  const session = useDungeonStatisticsStore.getState().session
  const active = statisticsSignal.active
  const mode = useUiPreferences().screenState.combat.dungeonStatisticsMode
  const presentation = getDungeonStatisticsPresentation(session)
  const previousBestRun = useRef(presentation.bestRunTime)
  const dropsListRef = useRef<HTMLDivElement>(null)
  useSmartScrollState(dropsListRef, { dependencies: [mode, presentation.dropRows.map((row) => row.itemId).join('|')] })
  const [bestRunFlash, setBestRunFlash] = useState(false)
  useEffect(() => {
    if (presentation.bestRunTime !== previousBestRun.current && presentation.bestRunTime !== '—') {
      setBestRunFlash(true)
      const timer = window.setTimeout(() => setBestRunFlash(false), 650)
      previousBestRun.current = presentation.bestRunTime
      return () => window.clearTimeout(timer)
    }
    previousBestRun.current = presentation.bestRunTime
  }, [presentation.bestRunTime])
  const moveMode = (direction: -1 | 1) => {
    const currentIndex = DUNGEON_STATISTICS_MODE_ORDER.indexOf(mode)
    const nextIndex = (currentIndex + direction + DUNGEON_STATISTICS_MODE_ORDER.length) % DUNGEON_STATISTICS_MODE_ORDER.length
    setUiPreferences({ screenState: { combat: { dungeonStatisticsMode: DUNGEON_STATISTICS_MODE_ORDER[nextIndex] } } })
  }

  return <Card className={`dungeon-statistics-panel dungeon-statistics-mode-${mode}${bestRunFlash ? ' is-best-run-flash' : ''}`}>
    <header className="dungeon-statistics-head"><span className="combat-subsection-label">COMBAT STATISTICS</span><div className="dungeon-statistics-mode-nav"><GameTooltip content={<TooltipContent title="Previous Combat Statistics mode" description="Show the previous farming metric." />}><button type="button" className="dungeon-statistics-mode-button" aria-label="Previous Combat Statistics mode" onClick={() => moveMode(-1)}><ChevronLeft size={15} aria-hidden="true" /></button></GameTooltip><strong className="dungeon-statistics-mode-title">{modeLabels[mode]}</strong><GameTooltip content={<TooltipContent title="Next Combat Statistics mode" description="Show the next farming metric." />}><button type="button" className="dungeon-statistics-mode-button" aria-label="Next Combat Statistics mode" onClick={() => moveMode(1)}><ChevronRight size={15} aria-hidden="true" /></button></GameTooltip><GameTooltip content={<TooltipContent title="Reset Combat Statistics" description="Clear combat statistics and begin a new measurement session. Combat continues." />}><button type="button" className="dungeon-statistics-reset-button" aria-label="Reset Combat Statistics" onClick={statisticsSignal.reset}><RotateCcw size={14} aria-hidden="true" /></button></GameTooltip></div></header>
    {!session ? <div className="dungeon-statistics-empty"><strong>NO COMBAT DATA</strong><span>Enter a Location to begin measuring.</span></div> : <div className="dungeon-statistics-body"><div className="dungeon-statistics-context"><span className={active ? 'is-active' : ''}>{active ? 'CURRENT SESSION' : 'LAST SESSION'}</span><strong>{presentation.dungeonName}</strong></div>{mode === 'runs' && <RunsMode presentation={presentation} />}{mode === 'drops' && <DropsMode presentation={presentation} dropsListRef={dropsListRef} />}{mode === 'efficiency' && <EfficiencyMode presentation={presentation} />}</div>}
  </Card>
}

function RunsMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content dungeon-statistics-runs-content"><div className="dungeon-statistics-feature-kpi"><span>SESSION</span><strong>{presentation.sessionTime}</strong></div><div className="dungeon-statistics-summary-grid dungeon-statistics-runs-grid"><Statistic label="FULL RUNS" value={formatUiCount(presentation.fullRuns)} /><Statistic label="RUNS / HOUR" value={presentation.runsPerHourLabel} /><Statistic label="AVERAGE RUN" value={presentation.averageRunTime} /><Statistic label="BEST RUN" value={presentation.bestRunTime} /></div><div className="dungeon-statistics-current-run"><span>CURRENT RUN</span><strong>{presentation.currentRunTime}</strong></div></div>
}

function DropsMode({ presentation, dropsListRef }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation>; dropsListRef: RefObject<HTMLDivElement | null> }) {
  const sessionDescription = `Session average measured over ${presentation.sessionTime}.`
  return <div className="dungeon-statistics-content dungeon-statistics-drops-content"><div className="dungeon-statistics-summary-grid dungeon-statistics-drops-summary"><Statistic label="ITEMS" value={presentation.totalDropsLabel} icon={<Package size={13} aria-hidden="true" />} tooltip={<TooltipContent title="Total item units" description={`Total quantity of item units dropped during this session: ${presentation.totalDropsLabel}. ${sessionDescription}`} />} /><Statistic label="ITEMS / HOUR" value={presentation.dropsPerHourLabel} icon={<Gauge size={13} aria-hidden="true" />} tooltip={<TooltipContent title="SESSION RATE" description={`${presentation.totalDropsLabel} items collected over ${presentation.sessionTime}. Projected session average: ${presentation.dropsPerHourLabel}.`} />} /></div><section className="dungeon-statistics-drop-section" aria-labelledby="dungeon-statistics-loot-heading"><div className="dungeon-statistics-section-head"><span id="dungeon-statistics-loot-heading">LOOT DROPS</span><small>{presentation.dropRows.length} TYPES</small></div>{presentation.dropRows.length ? <div ref={dropsListRef} className="dungeon-statistics-drops-grid smart-scroll-region">{presentation.dropRows.map((row) => <DropTile key={row.itemId} row={row} sessionTime={presentation.sessionTime} />)}</div> : <div className="dungeon-statistics-empty dungeon-statistics-empty-inline"><span>No loot acquired yet.</span></div>}</section><section className="dungeon-statistics-resonance-section" aria-labelledby="dungeon-statistics-resonance-heading"><div className="dungeon-statistics-section-head"><span id="dungeon-statistics-resonance-heading">RESONANCE GAINS</span><small>COMBAT REWARDS</small></div>{presentation.resonanceRows.length ? <div className="dungeon-statistics-resonance-list">{presentation.resonanceRows.map((row) => <ResonanceRow key={row.type} row={row} sessionTime={presentation.sessionTime} />)}</div> : <div className="dungeon-statistics-empty dungeon-statistics-empty-inline"><span>No resonance gained yet.</span></div>}</section></div>
}

function DropTile({ row, sessionTime }: { row: ReturnType<typeof getDungeonStatisticsPresentation>['dropRows'][number]; sessionTime: string }) {
  const { openContextMenu } = useGameContextMenu()
  const preferences = useUiPreferences()
  const [isNew, setIsNew] = useState(true)
  const [usesOpen, setUsesOpen] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setIsNew(false), 180)
    return () => window.clearTimeout(timer)
  }, [])
  const quantityLabel = formatUiCount(row.quantity)
  const item = ITEMS[row.itemId]
  const output = getItemSources(row.itemId).find((relation) => relation.kind === 'recipe' && relation.detail.endsWith('output'))
  const uses = getItemUses(row.itemId)
  const firstDrop = getItemDropSources(row.itemId)[0]
  const openItem = () => { setNavigationIntent({ inventoryItemId: row.itemId }); useGameStore.getState().setScreen('inventory') }
  const openRecipe = () => { if (!output) return; if (output.detail === 'Artificing output') setUiPreferences({ screenState: { artificing: { selectedRecipeId: output.id as never } } }); else setUiPreferences({ screenState: { transmutation: { selectedRecipeId: output.id as never } } }); useGameStore.getState().setScreen(output.detail === 'Artificing output' ? 'tower-artificing' : 'tower-transmutation') }
  return <><GameTooltip block content={<TooltipContent title={item.name.toUpperCase()} description={`${item.description} ${quantityLabel} collected over ${sessionTime}.`}><div className="tooltip-row"><span>GAINED</span><b className="semantic-positive">+{quantityLabel}</b></div><div className="tooltip-row"><span>LOOT / HOUR</span><b className="semantic-rate">{row.perHourLabel}</b></div></TooltipContent>}><div className={`dungeon-statistics-drop-tile${isNew ? ' is-new' : ''}`} tabIndex={0} aria-label={`${row.name}, gained ${quantityLabel}, ${row.perHourLabel}`} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: item.name, meta: `LOCATION DROP · ${quantityLabel}` }, sections: [{ id: 'item', actions: [{ id: 'inventory', label: 'Open in Inventory', onSelect: openItem }, { id: 'collection', label: 'Open Collection', onSelect: () => { setNavigationIntent({ inventoryItemId: row.itemId }); useGameStore.getState().setScreen('collection') } }, ...(uses.length > 0 ? [{ id: 'uses', label: 'Used In...', onSelect: () => setUsesOpen(true) }] : []), ...(output ? [{ id: 'output', label: 'Open Output Recipe', onSelect: openRecipe }] : []), ...(firstDrop ? [{ id: 'source', label: 'Where to Get', onSelect: () => { setNavigationIntent({ combatDungeonId: firstDrop.dungeonId, combatMonsterId: firstDrop.monsterId }); useGameStore.getState().setScreen('combat') } }] : []), { id: 'track', label: preferences.trackedItemId === row.itemId ? 'Untrack Item' : 'Track Item', onSelect: () => setUiPreferences({ trackedItemId: preferences.trackedItemId === row.itemId ? null : row.itemId }) }] }] }) }}><span className="dungeon-statistics-drop-icon"><ItemIcon itemId={row.itemId} size="tile" /></span><strong className="dungeon-statistics-drop-name">{row.name}</strong><span className="dungeon-statistics-drop-quantity">+{quantityLabel}</span><span className="dungeon-statistics-drop-rate">{row.perHourLabel}</span></div></GameTooltip><ItemUsesDialog itemId={row.itemId} uses={uses} open={usesOpen} onClose={() => setUsesOpen(false)} onSelectRecipe={(recipeId) => { setUsesOpen(false); if (isTransmutationRecipeId(recipeId)) { setNavigationIntent({ transmutationRecipeId: recipeId }); useGameStore.getState().setScreen('tower-transmutation') } else { setNavigationIntent({ artificingRecipeId: recipeId as never }); useGameStore.getState().setScreen('tower-artificing') } }} /></>
}

function ResonanceRow({ row, sessionTime }: { row: ReturnType<typeof getDungeonStatisticsPresentation>['resonanceRows'][number]; sessionTime: string }) {
  return <GameTooltip block content={<TooltipContent title={row.label.toUpperCase()} description={`Combat reward resonance gained over ${sessionTime}.`}><div className="tooltip-row"><span>GAINED</span><b className="semantic-positive">+{formatUiCount(row.amount)}</b></div><div className="tooltip-row"><span>RESONANCE / HOUR</span><b className="semantic-rate">{row.perHourLabel}</b></div></TooltipContent>}><div className={`dungeon-statistics-resonance-row resonance-${row.type}`} tabIndex={0} aria-label={`${row.label}, gained ${formatUiCount(row.amount)}, ${row.perHourLabel}`}><span className="dungeon-statistics-resonance-name"><span className="dungeon-statistics-resonance-mark" aria-hidden="true" />{row.label}</span><strong>+{formatUiCount(row.amount)}</strong><span>{row.perHourLabel}</span></div></GameTooltip>
}

function EfficiencyMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content dungeon-statistics-efficiency-content"><div className="dungeon-statistics-uptime"><div><span>COMBAT UPTIME</span><strong>{presentation.uptimeLabel}</strong></div><Progress value={presentation.uptime} tone="success" label="Combat uptime" /></div><div className="dungeon-statistics-summary-grid dungeon-statistics-efficiency-grid"><Statistic label="DOWNTIME" value={presentation.downtimeLabel} icon={<Timer size={13} aria-hidden="true" />} /><Statistic label="AVG ENCOUNTER" value={presentation.averageEncounter} /><Statistic label="FASTEST ENCOUNTER" value={presentation.fastestEncounter} /><Statistic label="AVG BOSS FIGHT" value={presentation.averageBoss} /><Statistic label="FASTEST BOSS" value={presentation.fastestBoss} /></div></div>
}

function Statistic({ label, value, icon, tooltip }: { label: string; value: string; icon?: ReactNode; tooltip?: ReactNode }) {
  const stat = <div className="dungeon-statistics-stat"><span>{icon}{label}</span><strong>{value}</strong></div>
  return tooltip ? <GameTooltip block content={tooltip}>{stat}</GameTooltip> : stat
}

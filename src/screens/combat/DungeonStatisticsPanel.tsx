import { ChevronLeft, ChevronRight, Gauge, Package, RotateCcw, Timer } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Card, GameTooltip, Progress } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemUsesDialog } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { getDungeonDropRateLabel, getDungeonStatisticsAggregatePresentation, getDungeonStatisticsClockPresentation, type DungeonStatisticsAggregatePresentation } from '../../game/presentation/combat/dungeonStatisticsPresentation'
import { formatUiCount } from '../../game/presentation/numbers'
import { useDungeonStatisticsStore } from '../../game/telemetry/dungeon/dungeonStatisticsStore'
import { DUNGEON_STATISTICS_MODE_ORDER, type DungeonStatisticsMode, type DungeonStatisticsSession } from '../../game/telemetry/dungeon/dungeonStatisticsTypes'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { getItemDropSources, getItemSources } from '../../game/content/contentRelations'
import { getItemUses } from '../../game/content/items/inventoryMetadata'
import { isTransmutationRecipeId } from '../../game/content/recipes/recipes'
import { useGameStore } from '../../store/gameStore'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { useShallow } from 'zustand/react/shallow'

const modeLabels: Record<DungeonStatisticsMode, string> = { runs: 'RUNS', drops: 'DROPS', efficiency: 'EFFICIENCY' }

export function DungeonStatisticsPanel() {
  const sessionStructure = useDungeonStatisticsStore(useShallow((state) => {
    const session = state.session
    return {
      active: state.active,
      dungeonId: session?.dungeonId ?? null,
      startedAtMs: session?.startedAtMs ?? 0,
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
      lootByItemId: session?.lootByItemId ?? null,
    }
  }))
  const reset = useDungeonStatisticsStore((state) => state.reset)
  const mode = useUiPreferences().screenState.combat.dungeonStatisticsMode
  const session = useMemo<DungeonStatisticsSession | null>(() => sessionStructure.dungeonId ? {
    dungeonId: sessionStructure.dungeonId,
    startedAtMs: sessionStructure.startedAtMs,
    elapsedMs: 0,
    engagedMs: 0,
    completedRuns: sessionStructure.completedRuns,
    currentRunElapsedMs: 0,
    completedRunDurationTotalMs: sessionStructure.completedRunDurationTotalMs,
    bestRunMs: sessionStructure.bestRunMs,
    normalEncounterCount: sessionStructure.normalEncounterCount,
    normalEncounterDurationTotalMs: sessionStructure.normalEncounterDurationTotalMs,
    fastestEncounterMs: sessionStructure.fastestEncounterMs,
    bossEncounterCount: sessionStructure.bossEncounterCount,
    bossDurationTotalMs: sessionStructure.bossDurationTotalMs,
    fastestBossMs: sessionStructure.fastestBossMs,
    totalLootQuantity: sessionStructure.totalLootQuantity,
    lootByItemId: sessionStructure.lootByItemId ?? {},
  } : null, [sessionStructure])
  const presentation = useMemo(() => getDungeonStatisticsAggregatePresentation(session), [session])
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
    <header className="dungeon-statistics-head"><span className="combat-subsection-label">DUNGEON STATISTICS</span><div className="dungeon-statistics-mode-nav"><GameTooltip content={<TooltipContent title="Previous Dungeon Statistics mode" description="Show the previous farming metric." />}><button type="button" className="dungeon-statistics-mode-button" aria-label="Previous Dungeon Statistics mode" onClick={() => moveMode(-1)}><ChevronLeft size={15} aria-hidden="true" /></button></GameTooltip><strong className="dungeon-statistics-mode-title">{modeLabels[mode]}</strong><GameTooltip content={<TooltipContent title="Next Dungeon Statistics mode" description="Show the next farming metric." />}><button type="button" className="dungeon-statistics-mode-button" aria-label="Next Dungeon Statistics mode" onClick={() => moveMode(1)}><ChevronRight size={15} aria-hidden="true" /></button></GameTooltip><GameTooltip content={<TooltipContent title="Reset Dungeon Statistics" description="Clear farming statistics and begin a new measurement session. Combat continues." />}><button type="button" className="dungeon-statistics-reset-button" aria-label="Reset Dungeon Statistics" onClick={reset}><RotateCcw size={14} aria-hidden="true" /></button></GameTooltip></div></header>
    {!session ? <div className="dungeon-statistics-empty"><strong>NO DUNGEON DATA</strong><span>Enter a Dungeon to begin measuring.</span></div> : <div className="dungeon-statistics-body"><div className="dungeon-statistics-context"><span className={sessionStructure.active ? 'is-active' : ''}>{sessionStructure.active ? 'CURRENT SESSION' : 'LAST SESSION'}</span><strong>{presentation.dungeonName}</strong></div>{mode === 'runs' && <RunsMode presentation={presentation} />}{mode === 'drops' && <DropsMode presentation={presentation} dropsListRef={dropsListRef} />}{mode === 'efficiency' && <EfficiencyMode presentation={presentation} />}</div>}
  </Card>
}

function useDungeonStatisticsClock() {
  const readClock = () => {
    const session = useDungeonStatisticsStore.getState().session
    return {
      elapsedMs: session?.elapsedMs ?? 0,
      engagedMs: session?.engagedMs ?? 0,
      completedRuns: session?.completedRuns ?? 0,
      currentRunElapsedMs: session?.currentRunElapsedMs ?? 0,
      totalLootQuantity: session?.totalLootQuantity ?? 0,
    }
  }
  const [clock, setClock] = useState(readClock)
  useEffect(() => {
    const update = () => setClock(readClock())
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [])
  return clock
}

function RunsMode({ presentation }: { presentation: DungeonStatisticsAggregatePresentation }) {
  const clock = useDungeonStatisticsClock()
  const live = useMemo(() => getDungeonStatisticsClockPresentation(clock), [clock])
  return <div className="dungeon-statistics-content dungeon-statistics-runs-content"><div className="dungeon-statistics-feature-kpi"><span>SESSION</span><strong>{live.sessionTime}</strong></div><div className="dungeon-statistics-summary-grid dungeon-statistics-runs-grid"><Statistic label="FULL RUNS" value={formatUiCount(presentation.fullRuns)} /><Statistic label="RUNS / HOUR" value={live.runsPerHourLabel} /><Statistic label="AVERAGE RUN" value={presentation.averageRunTime} /><Statistic label="BEST RUN" value={presentation.bestRunTime} /></div><div className="dungeon-statistics-current-run"><span>CURRENT RUN</span><strong>{live.currentRunTime}</strong></div></div>
}

function DropsMode({ presentation, dropsListRef }: { presentation: DungeonStatisticsAggregatePresentation; dropsListRef: RefObject<HTMLDivElement | null> }) {
  const clock = useDungeonStatisticsClock()
  const live = useMemo(() => getDungeonStatisticsClockPresentation(clock), [clock])
  const sessionDescription = `Session average measured over ${live.sessionTime}.`
  return <div className="dungeon-statistics-content dungeon-statistics-drops-content"><div className="dungeon-statistics-summary-grid dungeon-statistics-drops-summary"><Statistic label="ITEMS" value={presentation.totalDropsLabel} icon={<Package size={13} aria-hidden="true" />} tooltip={<TooltipContent title="Total item units" description={`Total quantity of item units dropped during this session: ${presentation.totalDropsLabel}. ${sessionDescription}`} />} /><Statistic label="ITEMS / HOUR" value={live.dropsPerHourLabel} icon={<Gauge size={13} aria-hidden="true" />} tooltip={<TooltipContent title="SESSION RATE" description={`${presentation.totalDropsLabel} items collected over ${live.sessionTime}. Projected session average: ${live.dropsPerHourLabel}.`} />} /></div><div className="dungeon-statistics-list-label">DROPS</div>{presentation.dropRows.length ? <div ref={dropsListRef} className="dungeon-statistics-drops-list smart-scroll-region">{presentation.dropRows.map((row) => <DropRow key={row.itemId} row={row} elapsedMs={clock.elapsedMs} sessionTime={live.sessionTime} />)}</div> : <div className="dungeon-statistics-empty dungeon-statistics-empty-inline"><span>No drops recorded yet.</span></div>}</div>
}

function DropRow({ row, elapsedMs, sessionTime }: { row: DungeonStatisticsAggregatePresentation['dropRows'][number]; elapsedMs: number; sessionTime: string }) {
  const setScreen = useGameStore((state) => state.setScreen)
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
  const perHourLabel = getDungeonDropRateLabel(row.quantity, elapsedMs)
  const openItem = () => { setNavigationIntent({ inventoryItemId: row.itemId }); setScreen('inventory') }
  const openRecipe = () => { if (!output) return; if (output.detail === 'Artificing output') setUiPreferences({ screenState: { artificing: { selectedRecipeId: output.id as never } } }); else setUiPreferences({ screenState: { transmutation: { selectedRecipeId: output.id as never } } }); setScreen(output.detail === 'Artificing output' ? 'tower-artificing' : 'tower-transmutation') }
  return <><GameTooltip block content={<TooltipContent title={item.name.toUpperCase()} description={`${item.description} ${quantityLabel} collected over ${sessionTime}.`}><div className="tooltip-row"><span>EXACT QUANTITY</span><b>{quantityLabel}</b></div><div className="tooltip-row"><span>RATE</span><b>{perHourLabel}</b></div></TooltipContent>}><div className={`dungeon-statistics-drop-row${isNew ? ' is-new' : ''}`} tabIndex={0} aria-label={`${row.name}, ${perHourLabel}`} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: item.name, meta: `DUNGEON DROP · ${quantityLabel}` }, sections: [{ id: 'item', actions: [{ id: 'inventory', label: 'Open in Inventory', onSelect: openItem }, { id: 'collection', label: 'Open Collection', onSelect: () => { setNavigationIntent({ inventoryItemId: row.itemId }); setScreen('collection') } }, ...(uses.length > 0 ? [{ id: 'uses', label: 'Used In...', onSelect: () => setUsesOpen(true) }] : []), ...(output ? [{ id: 'output', label: 'Open Output Recipe', onSelect: openRecipe }] : []), ...(firstDrop ? [{ id: 'source', label: 'Where to Get', onSelect: () => { setNavigationIntent({ combatDungeonId: firstDrop.dungeonId, combatMonsterId: firstDrop.monsterId }); setScreen('combat') } }] : []), { id: 'track', label: preferences.trackedItemId === row.itemId ? 'Untrack Item' : 'Track Item', onSelect: () => setUiPreferences({ trackedItemId: preferences.trackedItemId === row.itemId ? null : row.itemId }) }] }] }) }}><span className="dungeon-statistics-drop-icon"><ItemIcon itemId={row.itemId} size="tiny" /></span><strong>{row.name}</strong><span className="dungeon-statistics-drop-rate">{perHourLabel}</span></div></GameTooltip><ItemUsesDialog itemId={row.itemId} uses={uses} open={usesOpen} onClose={() => setUsesOpen(false)} onSelectRecipe={(recipeId) => { setUsesOpen(false); if (isTransmutationRecipeId(recipeId)) { setNavigationIntent({ transmutationRecipeId: recipeId }); setScreen('tower-transmutation') } else { setNavigationIntent({ artificingRecipeId: recipeId as never }); setScreen('tower-artificing') } }} /></>
}

function EfficiencyMode({ presentation }: { presentation: DungeonStatisticsAggregatePresentation }) {
  const clock = useDungeonStatisticsClock()
  const live = useMemo(() => getDungeonStatisticsClockPresentation(clock), [clock])
  return <div className="dungeon-statistics-content dungeon-statistics-efficiency-content"><div className="dungeon-statistics-uptime"><div><span>COMBAT UPTIME</span><strong>{live.uptimeLabel}</strong></div><Progress value={live.uptime} tone="success" label="Combat uptime" /></div><div className="dungeon-statistics-summary-grid dungeon-statistics-efficiency-grid"><Statistic label="DOWNTIME" value={live.downtimeLabel} icon={<Timer size={13} aria-hidden="true" />} /><Statistic label="AVG ENCOUNTER" value={presentation.averageEncounter} /><Statistic label="FASTEST ENCOUNTER" value={presentation.fastestEncounter} /><Statistic label="AVG BOSS FIGHT" value={presentation.averageBoss} /><Statistic label="FASTEST BOSS" value={presentation.fastestBoss} /></div></div>
}

function Statistic({ label, value, icon, tooltip }: { label: string; value: string; icon?: ReactNode; tooltip?: ReactNode }) {
  const stat = <div className="dungeon-statistics-stat"><span>{icon}{label}</span><strong>{value}</strong></div>
  return tooltip ? <GameTooltip block content={tooltip}>{stat}</GameTooltip> : stat
}

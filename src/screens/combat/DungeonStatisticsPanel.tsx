import { ChevronLeft, ChevronRight, Gauge, Package, RotateCcw, Timer } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
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

const modeLabels: Record<DungeonStatisticsMode, string> = { runs: 'RUNS', drops: 'DROPS', efficiency: 'EFFICIENCY' }

export function DungeonStatisticsPanel() {
  const session = useDungeonStatisticsStore((state) => state.session)
  const active = useDungeonStatisticsStore((state) => state.active)
  const reset = useDungeonStatisticsStore((state) => state.reset)
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
    <header className="dungeon-statistics-head"><span className="combat-subsection-label">DUNGEON STATISTICS</span><div className="dungeon-statistics-mode-nav"><GameTooltip content={<TooltipContent title="Previous Dungeon Statistics mode" description="Show the previous farming metric." />}><button type="button" className="dungeon-statistics-mode-button" aria-label="Previous Dungeon Statistics mode" onClick={() => moveMode(-1)}><ChevronLeft size={15} aria-hidden="true" /></button></GameTooltip><strong className="dungeon-statistics-mode-title">{modeLabels[mode]}</strong><GameTooltip content={<TooltipContent title="Next Dungeon Statistics mode" description="Show the next farming metric." />}><button type="button" className="dungeon-statistics-mode-button" aria-label="Next Dungeon Statistics mode" onClick={() => moveMode(1)}><ChevronRight size={15} aria-hidden="true" /></button></GameTooltip><GameTooltip content={<TooltipContent title="Reset Dungeon Statistics" description="Clear farming statistics and begin a new measurement session. Combat continues." />}><button type="button" className="dungeon-statistics-reset-button" aria-label="Reset Dungeon Statistics" onClick={reset}><RotateCcw size={14} aria-hidden="true" /></button></GameTooltip></div></header>
    {!session ? <div className="dungeon-statistics-empty"><strong>NO DUNGEON DATA</strong><span>Enter a Dungeon to begin measuring.</span></div> : <div className="dungeon-statistics-body"><div className="dungeon-statistics-context"><span className={active ? 'is-active' : ''}>{active ? 'CURRENT SESSION' : 'LAST SESSION'}</span><strong>{presentation.dungeonName}</strong></div>{mode === 'runs' && <RunsMode presentation={presentation} />}{mode === 'drops' && <DropsMode presentation={presentation} dropsListRef={dropsListRef} />}{mode === 'efficiency' && <EfficiencyMode presentation={presentation} />}</div>}
  </Card>
}

function RunsMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content dungeon-statistics-runs-content"><div className="dungeon-statistics-feature-kpi"><span>SESSION</span><strong>{presentation.sessionTime}</strong></div><div className="dungeon-statistics-summary-grid dungeon-statistics-runs-grid"><Statistic label="FULL RUNS" value={formatUiCount(presentation.fullRuns)} /><Statistic label="RUNS / HOUR" value={presentation.runsPerHourLabel} /><Statistic label="AVERAGE RUN" value={presentation.averageRunTime} /><Statistic label="BEST RUN" value={presentation.bestRunTime} /></div><div className="dungeon-statistics-current-run"><span>CURRENT RUN</span><strong>{presentation.currentRunTime}</strong></div></div>
}

function DropsMode({ presentation, dropsListRef }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation>; dropsListRef: RefObject<HTMLDivElement | null> }) {
  const sessionDescription = `Session average measured over ${presentation.sessionTime}.`
  return <div className="dungeon-statistics-content dungeon-statistics-drops-content"><div className="dungeon-statistics-summary-grid dungeon-statistics-drops-summary"><Statistic label="ITEMS" value={presentation.totalDropsLabel} icon={<Package size={13} aria-hidden="true" />} tooltip={<TooltipContent title="Total item units" description={`Total quantity of item units dropped during this session: ${presentation.totalDropsLabel}. ${sessionDescription}`} />} /><Statistic label="ITEMS / HOUR" value={presentation.dropsPerHourLabel} icon={<Gauge size={13} aria-hidden="true" />} tooltip={<TooltipContent title="SESSION RATE" description={`${presentation.totalDropsLabel} items collected over ${presentation.sessionTime}. Projected session average: ${presentation.dropsPerHourLabel}.`} />} /></div><div className="dungeon-statistics-list-label">DROPS</div>{presentation.dropRows.length ? <div ref={dropsListRef} className="dungeon-statistics-drops-list smart-scroll-region">{presentation.dropRows.map((row) => <DropRow key={row.itemId} row={row} sessionTime={presentation.sessionTime} />)}</div> : <div className="dungeon-statistics-empty dungeon-statistics-empty-inline"><span>No drops recorded yet.</span></div>}</div>
}

function DropRow({ row, sessionTime }: { row: ReturnType<typeof getDungeonStatisticsPresentation>['dropRows'][number]; sessionTime: string }) {
  const state = useGameStore()
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
  const openItem = () => { setNavigationIntent({ inventoryItemId: row.itemId }); state.setScreen('inventory') }
  const openRecipe = () => { if (!output) return; if (output.detail === 'Artificing output') setUiPreferences({ screenState: { artificing: { selectedRecipeId: output.id as never } } }); else setUiPreferences({ screenState: { transmutation: { selectedRecipeId: output.id as never } } }); state.setScreen(output.detail === 'Artificing output' ? 'tower-artificing' : 'tower-transmutation') }
  return <><GameTooltip block content={<TooltipContent title={item.name.toUpperCase()} description={`${item.description} ${quantityLabel} collected over ${sessionTime}.`}><div className="tooltip-row"><span>EXACT QUANTITY</span><b>{quantityLabel}</b></div><div className="tooltip-row"><span>RATE</span><b>{row.perHourLabel}</b></div></TooltipContent>}><div className={`dungeon-statistics-drop-row${isNew ? ' is-new' : ''}`} tabIndex={0} aria-label={`${row.name}, ${row.perHourLabel}`} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: item.name, meta: `DUNGEON DROP · ${quantityLabel}` }, sections: [{ id: 'item', actions: [{ id: 'inventory', label: 'OPEN IN INVENTORY', onSelect: openItem }, { id: 'collection', label: 'OPEN COLLECTION', onSelect: () => { setNavigationIntent({ inventoryItemId: row.itemId }); state.setScreen('collection') } }, ...(uses.length > 0 ? [{ id: 'uses', label: 'USED IN...', onSelect: () => setUsesOpen(true) }] : []), ...(output ? [{ id: 'output', label: 'OPEN OUTPUT RECIPE', onSelect: openRecipe }] : []), ...(firstDrop ? [{ id: 'source', label: 'WHERE TO GET', onSelect: () => { setNavigationIntent({ combatDungeonId: firstDrop.dungeonId, combatMonsterId: firstDrop.monsterId }); state.setScreen('combat') } }] : []), { id: 'track', label: preferences.trackedItemId === row.itemId ? 'UNTRACK ITEM' : 'TRACK ITEM', onSelect: () => setUiPreferences({ trackedItemId: preferences.trackedItemId === row.itemId ? null : row.itemId }) }] }] }) }}><span className="dungeon-statistics-drop-icon"><ItemIcon itemId={row.itemId} size="tiny" /></span><strong>{row.name}</strong><span className="dungeon-statistics-drop-rate">{row.perHourLabel}</span></div></GameTooltip><ItemUsesDialog itemId={row.itemId} uses={uses} open={usesOpen} onClose={() => setUsesOpen(false)} onSelectRecipe={(recipeId) => { setUsesOpen(false); if (isTransmutationRecipeId(recipeId)) { setNavigationIntent({ transmutationRecipeId: recipeId }); state.setScreen('tower-transmutation') } else { setNavigationIntent({ artificingRecipeId: recipeId as never }); state.setScreen('tower-artificing') } }} /></>
}

function EfficiencyMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content dungeon-statistics-efficiency-content"><div className="dungeon-statistics-uptime"><div><span>COMBAT UPTIME</span><strong>{presentation.uptimeLabel}</strong></div><Progress value={presentation.uptime} tone="success" label="Combat uptime" /></div><div className="dungeon-statistics-summary-grid dungeon-statistics-efficiency-grid"><Statistic label="DOWNTIME" value={presentation.downtimeLabel} icon={<Timer size={13} aria-hidden="true" />} /><Statistic label="AVG ENCOUNTER" value={presentation.averageEncounter} /><Statistic label="FASTEST ENCOUNTER" value={presentation.fastestEncounter} /><Statistic label="AVG BOSS FIGHT" value={presentation.averageBoss} /><Statistic label="FASTEST BOSS" value={presentation.fastestBoss} /></div></div>
}

function Statistic({ label, value, icon, tooltip }: { label: string; value: string; icon?: ReactNode; tooltip?: ReactNode }) {
  const stat = <div className="dungeon-statistics-stat"><span>{icon}{label}</span><strong>{value}</strong></div>
  return tooltip ? <GameTooltip block content={tooltip}>{stat}</GameTooltip> : stat
}

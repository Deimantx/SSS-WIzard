import { ChevronLeft, ChevronRight, Gauge, Package, RotateCcw, Timer } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Card, GameTooltip, Progress } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../components/ui/item/ItemIcon'
import { ITEMS } from '../../game/content/items/items'
import { getDungeonStatisticsPresentation, formatStatisticsRate } from '../../game/presentation/combat/dungeonStatisticsPresentation'
import { useDungeonStatisticsStore } from '../../game/telemetry/dungeon/dungeonStatisticsStore'
import { DUNGEON_STATISTICS_MODE_ORDER, type DungeonStatisticsMode } from '../../game/telemetry/dungeon/dungeonStatisticsTypes'
import { formatNumber } from '../../game/utils'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'

const modeLabels: Record<DungeonStatisticsMode, string> = { runs: 'RUNS', drops: 'DROPS', efficiency: 'EFFICIENCY' }

export function DungeonStatisticsPanel() {
  const session = useDungeonStatisticsStore((state) => state.session)
  const active = useDungeonStatisticsStore((state) => state.active)
  const reset = useDungeonStatisticsStore((state) => state.reset)
  const mode = useUiPreferences().screenState.combat.dungeonStatisticsMode
  const presentation = getDungeonStatisticsPresentation(session)
  const previousBestRun = useRef(presentation.bestRunTime)
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
    {!session ? <div className="dungeon-statistics-empty"><strong>NO DUNGEON DATA</strong><span>Enter a Dungeon to begin measuring.</span></div> : <div className="dungeon-statistics-body"><div className="dungeon-statistics-context"><span className={active ? 'is-active' : ''}>{active ? 'CURRENT SESSION' : 'LAST SESSION'}</span><strong>{presentation.dungeonName}</strong></div>{mode === 'runs' && <RunsMode presentation={presentation} />}{mode === 'drops' && <DropsMode presentation={presentation} />}{mode === 'efficiency' && <EfficiencyMode presentation={presentation} />}</div>}
  </Card>
}

function RunsMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content dungeon-statistics-runs-content"><div className="dungeon-statistics-feature-kpi"><span>SESSION</span><strong>{presentation.sessionTime}</strong></div><div className="dungeon-statistics-summary-grid dungeon-statistics-runs-grid"><Statistic label="FULL RUNS" value={formatNumber(presentation.fullRuns)} /><Statistic label="RUNS / HOUR" value={presentation.runsPerHour === null ? '—' : formatStatisticsRate(presentation.runsPerHour)} /><Statistic label="AVERAGE RUN" value={presentation.averageRunTime} /><Statistic label="BEST RUN" value={presentation.bestRunTime} /></div><div className="dungeon-statistics-current-run"><span>CURRENT RUN</span><strong>{presentation.currentRunTime}</strong></div></div>
}

function DropsMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content dungeon-statistics-drops-content"><div className="dungeon-statistics-summary-grid dungeon-statistics-drops-summary"><Statistic label="ITEMS" value={presentation.totalDropsLabel} icon={<Package size={13} aria-hidden="true" />} /><Statistic label="ITEMS / HOUR" value={formatStatisticsRate(presentation.dropsPerHour)} icon={<Gauge size={13} aria-hidden="true" />} /></div><div className="dungeon-statistics-list-label">DROPS</div>{presentation.dropRows.length ? <div className="dungeon-statistics-drops-list">{presentation.dropRows.map((row) => <DropRow key={row.itemId} row={row} />)}</div> : <div className="dungeon-statistics-empty dungeon-statistics-empty-inline"><span>No drops recorded yet.</span></div>}</div>
}

function DropRow({ row }: { row: ReturnType<typeof getDungeonStatisticsPresentation>['dropRows'][number] }) {
  const [isNew, setIsNew] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setIsNew(false), 180)
    return () => window.clearTimeout(timer)
  }, [])
  return <GameTooltip block content={<TooltipContent title={ITEMS[row.itemId].name.toUpperCase()} description={ITEMS[row.itemId].description}><div className="tooltip-row"><span>EXACT QUANTITY</span><b>{row.quantity.toLocaleString()}</b></div><div className="tooltip-row"><span>RATE</span><b>{formatStatisticsRate(row.perHour)}</b></div></TooltipContent>}><div className={`dungeon-statistics-drop-row${isNew ? ' is-new' : ''}`} tabIndex={0} aria-label={`${row.name}, ${row.quantity.toLocaleString()} dropped, ${formatStatisticsRate(row.perHour)}`}><span className="dungeon-statistics-drop-icon"><ItemIcon itemId={row.itemId} size="tiny" /></span><strong>{row.name}</strong><AnimatedMetric value={formatNumber(row.quantity)} /><AnimatedMetric value={formatStatisticsRate(row.perHour)} className="dungeon-statistics-drop-rate" /></div></GameTooltip>
}

function EfficiencyMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content dungeon-statistics-efficiency-content"><div className="dungeon-statistics-uptime"><div><span>COMBAT UPTIME</span><strong>{presentation.uptime.toFixed(1)}%</strong></div><Progress value={presentation.uptime} tone="success" label="Combat uptime" /></div><div className="dungeon-statistics-summary-grid dungeon-statistics-efficiency-grid"><Statistic label="DOWNTIME" value={`${presentation.downtime.toFixed(1)}%`} icon={<Timer size={13} aria-hidden="true" />} /><Statistic label="AVG ENCOUNTER" value={presentation.averageEncounter} /><Statistic label="FASTEST ENCOUNTER" value={presentation.fastestEncounter} /><Statistic label="AVG BOSS FIGHT" value={presentation.averageBoss} /><Statistic label="FASTEST BOSS" value={presentation.fastestBoss} /></div></div>
}

function Statistic({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="dungeon-statistics-stat"><span>{icon}{label}</span><strong><AnimatedMetric value={value} /></strong></div>
}

function AnimatedMetric({ value, className = '' }: { value: string; className?: string }) {
  const previous = useRef(value)
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    if (previous.current === value) return
    previous.current = value
    setPulse(true)
    const timer = window.setTimeout(() => setPulse(false), 180)
    return () => window.clearTimeout(timer)
  }, [value])
  return <span className={`dungeon-statistics-animated-metric${pulse ? ' is-updated' : ''}${className ? ` ${className}` : ''}`}>{value}</span>
}

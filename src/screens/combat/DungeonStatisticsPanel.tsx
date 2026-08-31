import { ChevronLeft, ChevronRight, Gauge, Package, RotateCcw, Timer } from 'lucide-react'
import { Card, GameTooltip, Progress } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ITEMS } from '../../game/content/items/items'
import { getDungeonStatisticsPresentation, formatStatisticsRate } from '../../game/presentation/combat/dungeonStatisticsPresentation'
import { useDungeonStatisticsStore } from '../../game/telemetry/dungeon/dungeonStatisticsStore'
import { DUNGEON_STATISTICS_MODE_ORDER, type DungeonStatisticsMode } from '../../game/telemetry/dungeon/dungeonStatisticsTypes'
import { formatNumber } from '../../game/utils'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { ItemIcon } from '../../components/ui/item/ItemIcon'
import type { ReactNode } from 'react'

const modeLabels: Record<DungeonStatisticsMode, string> = { runs: 'RUNS', loot: 'LOOT', efficiency: 'EFFICIENCY' }

export function DungeonStatisticsPanel() {
  const session = useDungeonStatisticsStore((state) => state.session)
  const active = useDungeonStatisticsStore((state) => state.active)
  const reset = useDungeonStatisticsStore((state) => state.reset)
  const mode = useUiPreferences().screenState.combat.dungeonStatisticsMode
  const presentation = getDungeonStatisticsPresentation(session)
  const moveMode = (direction: -1 | 1) => {
    const currentIndex = DUNGEON_STATISTICS_MODE_ORDER.indexOf(mode)
    const nextIndex = (currentIndex + direction + DUNGEON_STATISTICS_MODE_ORDER.length) % DUNGEON_STATISTICS_MODE_ORDER.length
    setUiPreferences({ screenState: { combat: { dungeonStatisticsMode: DUNGEON_STATISTICS_MODE_ORDER[nextIndex] } } })
  }

  return <Card className={`dungeon-statistics-panel dungeon-statistics-mode-${mode}`}>
    <header className="dungeon-statistics-head"><span className="combat-subsection-label">DUNGEON STATISTICS</span><div className="dungeon-statistics-mode-nav"><GameTooltip content={<TooltipContent title="Previous Dungeon Statistics mode" description="Show the previous farming metric." />}><button type="button" className="dungeon-statistics-mode-button" aria-label="Previous Dungeon Statistics mode" onClick={() => moveMode(-1)}><ChevronLeft size={15} aria-hidden="true" /></button></GameTooltip><strong className="dungeon-statistics-mode-title">{modeLabels[mode]}</strong><GameTooltip content={<TooltipContent title="Next Dungeon Statistics mode" description="Show the next farming metric." />}><button type="button" className="dungeon-statistics-mode-button" aria-label="Next Dungeon Statistics mode" onClick={() => moveMode(1)}><ChevronRight size={15} aria-hidden="true" /></button></GameTooltip><GameTooltip content={<TooltipContent title="Reset Dungeon Statistics" description="Clear farming statistics and begin a new measurement session. Combat continues." />}><button type="button" className="dungeon-statistics-reset-button" aria-label="Reset Dungeon Statistics" onClick={reset}><RotateCcw size={14} aria-hidden="true" /></button></GameTooltip></div></header>
    {!session ? <div className="dungeon-statistics-empty"><strong>NO DUNGEON DATA</strong><span>Enter a Dungeon to begin measuring.</span></div> : <div className="dungeon-statistics-body"><div className="dungeon-statistics-context"><span className={active ? 'is-active' : ''}>{active ? 'CURRENT SESSION' : 'LAST SESSION'}</span><strong>{presentation.dungeonName}</strong></div>{mode === 'runs' && <RunsMode presentation={presentation} />}{mode === 'loot' && <LootMode presentation={presentation} />}{mode === 'efficiency' && <EfficiencyMode presentation={presentation} />}</div>}
  </Card>
}

function RunsMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content"><div className="dungeon-statistics-summary-grid"><Statistic label="SESSION TIME" value={presentation.sessionTime} /><Statistic label="FULL RUNS" value={formatNumber(presentation.fullRuns)} /><Statistic label="RUNS / HOUR" value={presentation.runsPerHour === null ? '—' : formatStatisticsRate(presentation.runsPerHour)} /><Statistic label="CURRENT RUN" value={presentation.currentRunTime} /><Statistic label="AVERAGE RUN" value={presentation.averageRunTime} /><Statistic label="BEST RUN" value={presentation.bestRunTime} /></div></div>
}

function LootMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content"><div className="dungeon-statistics-summary-grid dungeon-statistics-loot-summary"><Statistic label="ITEMS LOOTED" value={presentation.totalLootLabel} icon={<Package size={13} aria-hidden="true" />} /><Statistic label="ITEMS / HOUR" value={formatStatisticsRate(presentation.lootPerHour)} icon={<Gauge size={13} aria-hidden="true" />} /></div><div className="dungeon-statistics-list-label">TOP DROPS</div>{presentation.lootRows.length ? <div className="dungeon-statistics-loot-list">{presentation.lootRows.map((row) => <GameTooltip block key={row.itemId} content={<TooltipContent title={row.name.toUpperCase()} description={ITEMS[row.itemId].description}><div className="tooltip-row"><span>EXACT QUANTITY</span><b>{row.quantity.toLocaleString()}</b></div><div className="tooltip-row"><span>RATE</span><b>{formatStatisticsRate(row.perHour)}</b></div></TooltipContent>}><div className="dungeon-statistics-loot-row" tabIndex={0} aria-label={`${row.name}, ${row.quantity.toLocaleString()} looted, ${formatStatisticsRate(row.perHour)}`}><span className="dungeon-statistics-loot-icon"><ItemIcon itemId={row.itemId} size="tiny" /></span><strong>{row.name}</strong><span>{formatNumber(row.quantity)}</span><small>{formatStatisticsRate(row.perHour)}</small></div></GameTooltip>)}</div> : <div className="dungeon-statistics-empty dungeon-statistics-empty-inline"><span>No loot recorded yet.</span></div>}</div>
}

function EfficiencyMode({ presentation }: { presentation: ReturnType<typeof getDungeonStatisticsPresentation> }) {
  return <div className="dungeon-statistics-content"><div className="dungeon-statistics-uptime"><div><span>COMBAT UPTIME</span><strong>{presentation.uptime.toFixed(1)}%</strong></div><Progress value={presentation.uptime} tone="success" label="Combat uptime" /></div><div className="dungeon-statistics-summary-grid"><Statistic label="DOWNTIME" value={`${presentation.downtime.toFixed(1)}%`} icon={<Timer size={13} aria-hidden="true" />} /><Statistic label="AVG ENCOUNTER" value={presentation.averageEncounter} /><Statistic label="AVG BOSS FIGHT" value={presentation.averageBoss} /><Statistic label="FASTEST ENCOUNTER" value={presentation.fastestEncounter} /><Statistic label="FASTEST BOSS" value={presentation.fastestBoss} /></div></div>
}

function Statistic({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="dungeon-statistics-stat"><span>{icon}{label}</span><strong>{value}</strong></div>
}

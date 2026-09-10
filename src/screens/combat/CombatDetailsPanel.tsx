import { Activity, ChevronLeft, ChevronRight, Flame, HeartPulse, List, RotateCcw, Shield, Sparkles, Swords } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { SPELLS } from '../../game/content/spells/spells'
import { cycleCombatDetailsMode, getCombatDetailsPresentation, type CombatDetailsMode, type CombatDetailsRowPresentation } from '../../game/presentation/combat'
import { formatUiCombatRate, formatUiDuration } from '../../game/presentation/numbers'
import { getCombatMetricRate } from '../../game/telemetry/combat/combatTelemetryAggregator'
import { useCombatTelemetryStore } from '../../game/telemetry/combat/combatTelemetryStore'
import { Card, GameTooltip } from '../../components/ui'
import { dismissGameTooltips, TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { SpellIcon } from '../../components/spells/SpellIcon'
import { CombatDetailsTooltip } from './CombatDetailsTooltip'
import { FullCombatLogDrawer } from './FullCombatLogDrawer'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { useShallow } from 'zustand/react/shallow'

export function CombatDetailsPanel() {
  const aggregateState = useCombatTelemetryStore(useShallow((state) => {
    const scope = state.run ?? state.lastRun
    return {
      scopeId: scope?.scopeId ?? null,
      aggregateRevision: scope?.aggregateRevision ?? 0,
      player: scope?.player ?? null,
    }
  }))
  const resetMeasurement = useCombatTelemetryStore((state) => state.resetMeasurement)
  const preferences = useUiPreferences().screenState.combat
  const mode = preferences.combatDetailsMode
  const [fullLogOpen, setFullLogOpen] = useState(false)
  const presentationScope = useMemo(() => aggregateState.player ? { engagedMs: 0, elapsedMs: 0, player: aggregateState.player } : null, [aggregateState.aggregateRevision, aggregateState.player])
  const presentation = useMemo(() => getCombatDetailsPresentation(presentationScope, mode), [mode, presentationScope])
  const detailsRowsRef = useRef<HTMLDivElement>(null)
  useSmartScrollState(detailsRowsRef, { dependencies: [mode, presentation.rows.map((row) => row.key).join('|')] })
  const moveMode = (direction: -1 | 1) => setUiPreferences({ screenState: { combat: { combatDetailsMode: cycleCombatDetailsMode(mode, direction) } } })

  return <Card className={`combat-details-panel combat-details-mode-${mode}`} style={{ '--details-mode-color': `var(${presentation.config.colorToken})` } as CSSProperties}>
    <header className="combat-details-head"><span className="combat-subsection-label">COMBAT DETAILS</span><div className="combat-details-mode-nav"><GameTooltip content={<TooltipContent title="View Full Combat Log" description="Open the complete transient combat event history without leaving the fight." />}><button type="button" className="combat-details-log-button" aria-label="View Full Combat Log" onClick={() => { dismissGameTooltips(); setFullLogOpen(true) }}><List size={14} aria-hidden="true" /></button></GameTooltip><GameTooltip content={<TooltipContent title="Previous Combat Details metric" description="Show the previous combat metric." />}><button type="button" className="combat-details-mode-button" aria-label="Previous Combat Details metric" onClick={() => moveMode(-1)}><ChevronLeft size={15} aria-hidden="true" /></button></GameTooltip><strong className="combat-details-mode-title">{presentation.config.label}</strong><GameTooltip content={<TooltipContent title="Next Combat Details metric" description="Show the next combat metric." />}><button type="button" className="combat-details-mode-button" aria-label="Next Combat Details metric" onClick={() => moveMode(1)}><ChevronRight size={15} aria-hidden="true" /></button></GameTooltip><GameTooltip content={<TooltipContent title="RESET COMBAT DETAILS" description="Clear the current Combat Details statistics and start measuring again from zero." />}><button type="button" className="combat-details-reset-button" aria-label="RESET COMBAT DETAILS" onClick={resetMeasurement}><RotateCcw size={14} aria-hidden="true" /></button></GameTooltip></div></header>
    {!aggregateState.scopeId ? <div className="combat-details-empty"><strong>NO COMBAT DATA</strong><span>Enter a Dungeon to begin tracking.</span></div> : <><CombatDetailsLive presentation={presentation} mode={mode} rowsRef={detailsRowsRef} /></>}
    {fullLogOpen && <FullCombatLogDrawer onClose={() => setFullLogOpen(false)} />}
  </Card>
}

function useCombatEngagedDisplayClock() {
  const [engagedMs, setEngagedMs] = useState(() => (useCombatTelemetryStore.getState().run ?? useCombatTelemetryStore.getState().lastRun)?.engagedMs ?? 0)
  useEffect(() => {
    const update = () => setEngagedMs((useCombatTelemetryStore.getState().run ?? useCombatTelemetryStore.getState().lastRun)?.engagedMs ?? 0)
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [])
  return engagedMs
}

function CombatDetailsLive({ presentation, mode, rowsRef }: { presentation: ReturnType<typeof getCombatDetailsPresentation>; mode: CombatDetailsMode; rowsRef: RefObject<HTMLDivElement | null> }) {
  const engagedMs = useCombatEngagedDisplayClock()
  return <><CombatDetailsSummary presentation={presentation} engagedMs={engagedMs} />{presentation.rows.length > 0 ? <div ref={rowsRef} className="combat-details-rows smart-scroll-region"><CombatDetailsRows mode={mode} rows={presentation.rows} engagedMs={engagedMs} /></div> : <div className="combat-details-empty combat-details-empty-scope"><strong>NO {presentation.config.label} YET</strong><span>Combat sources will appear here.</span></div>}</>
}

function CombatDetailsSummary({ presentation, engagedMs }: { presentation: ReturnType<typeof getCombatDetailsPresentation>; engagedMs: number }) {
  const rate = getCombatMetricRate(presentation.total, engagedMs)
  const rateLabel = formatUiCombatRate(rate)
  const engagedLabel = formatUiDuration(engagedMs / 1000)
  return <div className="combat-details-summary"><div className="combat-details-summary-stat combat-details-summary-total"><span>{presentation.config.totalLabel}</span><strong>{presentation.totalLabel}</strong></div><GameTooltip content={<TooltipContent title={`${presentation.config.rateLabel} /s`} description="Rate is calculated over engaged combat time."><div className="tooltip-row"><span>EXACT {presentation.config.totalLabel}</span><b>{presentation.totalLabel}</b></div></TooltipContent>}><div className="combat-details-summary-stat combat-details-summary-rate" tabIndex={0}><span>{presentation.config.rateLabel}</span><strong>{rateLabel}<small>/s</small></strong></div></GameTooltip><GameTooltip content={<TooltipContent title="ENGAGED TIME" description="Time spent actively fighting an enemy."><div className="tooltip-row"><span>ENGAGED TIME</span><b>{engagedLabel}</b></div></TooltipContent>}><div className="combat-details-summary-stat combat-details-summary-engaged" tabIndex={0}><span>ENGAGED</span><strong>{engagedLabel}</strong></div></GameTooltip></div>
}

function CombatDetailsRows({ mode, rows, engagedMs }: { mode: CombatDetailsMode; rows: CombatDetailsRowPresentation[]; engagedMs: number }) {
  return <>{rows.map((row) => <CombatDetailsRow key={row.key} mode={mode} row={row} engagedMs={engagedMs} />)}</>
}

const CombatDetailsRow = memo(function CombatDetailsRow({ mode, row, engagedMs }: { mode: CombatDetailsMode; row: CombatDetailsRowPresentation; engagedMs: number }) {
  const liveRow = useMemo(() => {
    const rate = getCombatMetricRate(row.total, engagedMs)
    return { ...row, rate, rateLabel: formatUiCombatRate(rate) }
  }, [engagedMs, row])
  const icon = <SourceIcon row={liveRow} />
  return <GameTooltip block wide content={<CombatDetailsTooltip mode={mode} row={liveRow} />}><div className={`combat-details-row metric-source-accent-${liveRow.source.accent}`} tabIndex={0} style={{ '--details-row-percent': `${Math.max(liveRow.total > 0 ? 2 : 0, liveRow.percent)}%` } as CSSProperties} aria-label={`${liveRow.rank}. ${liveRow.source.name}, ${liveRow.percentLabel}, ${liveRow.totalLabel}`}><span className="combat-details-rank">{liveRow.rank}.</span><span className="combat-details-source-icon">{icon}</span><span className="combat-details-source"><strong>{liveRow.source.name}</strong>{liveRow.source.subtitle && <small>{liveRow.source.subtitle}</small>}</span><span className="combat-details-bar" aria-hidden="true" /><span className="combat-details-row-total">{liveRow.totalLabel}</span><span className="combat-details-row-percent">{liveRow.percentLabel}</span></div></GameTooltip>
})

function SourceIcon({ row }: { row: CombatDetailsRowPresentation }): ReactNode {
  if (row.contribution.spellId && SPELLS[row.contribution.spellId]) return <SpellIcon school={SPELLS[row.contribution.spellId].school} size="small" />
  if (row.source.icon === 'swords') return <Swords size={14} aria-hidden="true" />
  if (row.source.icon === 'flame') return <Flame size={14} aria-hidden="true" />
  if (row.source.icon === 'heart') return <HeartPulse size={14} aria-hidden="true" />
  if (row.source.icon === 'shield') return <Shield size={14} aria-hidden="true" />
  if (row.source.icon === 'sparkles') return <Sparkles size={14} aria-hidden="true" />
  return <Activity size={14} aria-hidden="true" />
}

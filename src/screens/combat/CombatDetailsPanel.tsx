import { Activity, ChevronLeft, ChevronRight, Flame, HeartPulse, Shield, Sparkles, Swords } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { SPELLS } from '../../game/content/spells/spells'
import { formatTime } from '../../game/utils'
import { cycleCombatDetailsMode, getCombatDetailsPresentation, type CombatDetailsMode, type CombatDetailsRowPresentation } from '../../game/presentation/combat'
import { useCombatTelemetryStore } from '../../game/telemetry/combat/combatTelemetryStore'
import { Card, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { SpellIcon } from '../../components/spells/SpellIcon'
import { CombatDetailsTooltip } from './CombatDetailsTooltip'

const exact = (value: number) => Math.round(Math.max(0, value)).toLocaleString()
const percent = (value: number) => value > 0 && value < 0.1 ? '<0.1%' : `${value.toFixed(1)}%`

export function CombatDetailsPanel() {
  const telemetry = useCombatTelemetryStore((state) => state)
  const preferences = useUiPreferences().screenState.combat
  const scope = telemetry.run ?? telemetry.lastRun
  const mode = preferences.combatDetailsMode
  const presentation = getCombatDetailsPresentation(scope, mode)
  const moveMode = (direction: -1 | 1) => setUiPreferences({ screenState: { combat: { combatDetailsMode: cycleCombatDetailsMode(mode, direction) } } })

  return <Card className={`combat-details-panel combat-details-mode-${mode}`} style={{ '--details-mode-color': `var(${presentation.config.colorToken})` } as CSSProperties}>
    <header className="combat-details-head"><div><span className="combat-subsection-label">COMBAT DETAILS</span><div className="combat-details-scope">{presentation.scopeLabel}</div></div><div className="combat-details-mode-nav"><GameTooltip content={<TooltipContent title="Previous Combat Details metric" description="Show the previous combat metric." />}><button type="button" className="combat-details-mode-button" aria-label="Previous Combat Details metric" onClick={() => moveMode(-1)}><ChevronLeft size={15} aria-hidden="true" /></button></GameTooltip><strong className="combat-details-mode-title">{presentation.config.label}</strong><GameTooltip content={<TooltipContent title="Next Combat Details metric" description="Show the next combat metric." />}><button type="button" className="combat-details-mode-button" aria-label="Next Combat Details metric" onClick={() => moveMode(1)}><ChevronRight size={15} aria-hidden="true" /></button></GameTooltip></div></header>
    {!scope ? <div className="combat-details-empty"><strong>NO COMBAT DATA</strong><span>Enter a Dungeon to begin tracking.</span></div> : <><div className="combat-details-summary"><div className="combat-details-summary-total"><span>{presentation.config.totalLabel}</span><strong>{presentation.compactTotal}</strong></div><GameTooltip content={<TooltipContent title={`${presentation.config.rateLabel} /s · ${presentation.scopeLabel}`} description="Rate is calculated over engaged combat time."><div className="tooltip-row"><span>EXACT TOTAL</span><b>{exact(presentation.total)}</b></div><div className="tooltip-row"><span>ENGAGED TIME</span><b>{formatTime(presentation.engagedMs)}</b></div></TooltipContent>}><div className="combat-details-summary-rate" tabIndex={0}><span>{presentation.config.rateLabel}</span><strong>{exact(presentation.rate)}<small>/s</small></strong><em>ENGAGED {formatTime(presentation.engagedMs)}</em></div></GameTooltip>{presentation.secondaryStats.length > 0 && <div className="combat-details-secondary">{presentation.secondaryStats.map((stat) => <GameTooltip key={stat.label} content={<TooltipContent title={stat.label} description={`${stat.label} recorded during ${presentation.scopeLabel.toLowerCase()}.`}><div className="tooltip-row"><span>EXACT VALUE</span><b>{exact(stat.value)}</b></div></TooltipContent>}><span tabIndex={0}><small>{stat.label}</small><strong>{stat.compactValue}</strong></span></GameTooltip>)}</div>}</div>{presentation.rows.length > 0 ? <div className="combat-details-rows">{presentation.rows.map((row) => <CombatDetailsRow key={row.key} mode={mode} row={row} scopeLabel={presentation.scopeLabel} engagedMs={presentation.engagedMs} />)}</div> : <div className="combat-details-empty combat-details-empty-scope"><strong>NO {presentation.config.label} YET</strong><span>Combat sources will appear here.</span></div>}</>}
  </Card>
}

function CombatDetailsRow({ mode, row, scopeLabel, engagedMs }: { mode: CombatDetailsMode; row: CombatDetailsRowPresentation; scopeLabel: string; engagedMs: number }) {
  const icon = <SourceIcon row={row} />
  return <GameTooltip block wide content={<CombatDetailsTooltip mode={mode} row={row} scopeLabel={scopeLabel} engagedMs={engagedMs} />}><div className={`combat-details-row metric-source-accent-${row.source.accent}`} tabIndex={0} style={{ '--details-row-percent': `${Math.max(row.total > 0 ? 2 : 0, row.percent)}%` } as CSSProperties} aria-label={`${row.rank}. ${row.source.name}, ${percent(row.percent)}, ${exact(row.total)}`}><span className="combat-details-rank">{row.rank}.</span><span className="combat-details-source-icon">{icon}</span><span className="combat-details-source"><strong>{row.source.name}</strong><small>{row.source.subtitle}</small></span><span className="combat-details-bar" aria-hidden="true" /><span className="combat-details-row-total">{row.compactTotal}</span><span className="combat-details-row-percent">{percent(row.percent)}</span></div></GameTooltip>
}

function SourceIcon({ row }: { row: CombatDetailsRowPresentation }): ReactNode {
  if (row.contribution.spellId && SPELLS[row.contribution.spellId]) return <SpellIcon school={SPELLS[row.contribution.spellId].school} size="small" />
  if (row.source.icon === 'swords') return <Swords size={14} aria-hidden="true" />
  if (row.source.icon === 'flame') return <Flame size={14} aria-hidden="true" />
  if (row.source.icon === 'heart') return <HeartPulse size={14} aria-hidden="true" />
  if (row.source.icon === 'shield') return <Shield size={14} aria-hidden="true" />
  if (row.source.icon === 'sparkles') return <Sparkles size={14} aria-hidden="true" />
  return <Activity size={14} aria-hidden="true" />
}

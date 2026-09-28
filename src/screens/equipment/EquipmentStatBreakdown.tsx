import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Layers3 } from 'lucide-react'
import { Button, GameTooltip, GameValue, ModalPortal } from '../../components/ui'
import { TooltipContent, useTooltipDetailMode } from '../../components/ui/tooltip/Tooltip'
import { getEquipmentStatDescription, getEquipmentStatLabel, formatEquipmentStat } from '../../game/presentation/equipment/equipmentStatPresentation'
import { getPlayerStatBreakdown, type PlayerBreakdownStatKey, type StatContribution, type StatContributionSourceType } from '../../game/presentation/stats/statContributionLedger'
import type { GameState } from '../../game/types'
import '../../styles/screens/equipment-stat-breakdown.css'

const SOURCE_LABELS: Record<StatContributionSourceType, string> = {
  base: 'Base', equipment: 'Equipment', artifact: 'Artifacts', 'arcane-core': 'Arcane Core', crystal: 'Crystals', sigil: 'Sigils', 'sigil-set': 'Sigil Sets', guild: 'Guild', progression: 'Progression', trait: 'Traits', status: 'Statuses', 'combat-condition': 'Combat conditions', debug: 'Developer overrides', other: 'Other sources',
}

function contributionValue(statKey: PlayerBreakdownStatKey, source: StatContribution) {
  if (source.operation === 'multiplier') return `${source.value.toFixed(2)}x`
  if (source.operation === 'derived') return formatEquipmentStat(statKey, source.value, false)
  if (source.operation === 'add-percent') return (source.value * 100).toFixed(1) + '%'
  return formatEquipmentStat(statKey, source.value, true)
}

function BreakdownContent({ state, statKey, pinned = false }: { state: GameState; statKey: PlayerBreakdownStatKey; pinned?: boolean }) {
  const mode = state.combat.active ? 'live' : 'sheet'
  const breakdown = getPlayerStatBreakdown(state, statKey, mode)
  const grouped = new Map<StatContributionSourceType, StatContribution[]>()
  for (const contribution of [...breakdown.permanent, ...breakdown.temporary]) {
    const group = grouped.get(contribution.sourceType) ?? []
    group.push(contribution)
    grouped.set(contribution.sourceType, group)
  }
  return <div className={pinned ? 'equipment-stat-breakdown-content is-pinned' : 'equipment-stat-breakdown-content'}>
    {!pinned && <TooltipContent title={breakdown.label} description={getEquipmentStatDescription(statKey)} />}
    <div className="equipment-stat-breakdown-total"><span>{mode === 'live' ? 'LIVE TOTAL' : 'FINAL TOTAL'}</span><strong>{formatEquipmentStat(statKey, breakdown.finalValue, false)}</strong></div>
    {(grouped.size ? [...grouped.entries()] : []).map(([sourceType, rows]) => <section className="equipment-stat-breakdown-group" key={sourceType}><h4>{SOURCE_LABELS[sourceType]}</h4>{rows.map((source) => <div className={`equipment-stat-breakdown-row${source.temporary ? ' is-temporary' : ''}`} key={source.id}><span><strong>{source.sourceLabel}</strong>{source.description && <small>{source.description}</small>}</span><b>{contributionValue(statKey, source)}</b></div>)}</section>)}
    {breakdown.beforeCaps !== undefined && <div className="equipment-stat-breakdown-cap"><span>BEFORE CAP</span><strong>{formatEquipmentStat(statKey, breakdown.beforeCaps, false)}</strong>{breakdown.cap?.max !== undefined && <small>CAP {formatEquipmentStat(statKey, breakdown.cap.max, false)}</small>}</div>}
    {breakdown.formulaLabel && <p className="equipment-stat-breakdown-formula">{breakdown.formulaLabel}</p>}
    {!pinned && <small className="equipment-stat-breakdown-hint">Hold ALT to inspect sources. Select this stat to keep the breakdown open.</small>}
  </div>
}

export function PlayerStatBreakdown({ state, statKey, value, children }: { state: GameState; statKey: string; value: number; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const detailMode = useTooltipDetailMode()
  const key = statKey as PlayerBreakdownStatKey
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setOpen(true)
  }
  return <>
    <GameTooltip block wide delay={500} content={detailMode.advanced ? <BreakdownContent state={state} statKey={key} /> : <TooltipContent title={getEquipmentStatLabel(statKey)} description={<>{getEquipmentStatDescription(statKey)}<br /><br />Hold ALT to inspect the contribution sources. Select this stat to keep its breakdown open.</>} />}>
      <div role="button" tabIndex={0} aria-label={`${getEquipmentStatLabel(statKey)} breakdown`} aria-haspopup="dialog" className="equipment-stat-breakdown-trigger" onClick={() => setOpen(true)} onKeyDown={onKeyDown}>{children}</div>
    </GameTooltip>
    <ModalPortal open={open} onClose={() => setOpen(false)} backdropClassName="equipment-stat-breakdown-backdrop" surfaceClassName="equipment-stat-breakdown-modal" ariaLabel={`${getEquipmentStatLabel(statKey)} stat breakdown`}>
      <header className="equipment-stat-breakdown-header"><div><span className="eyebrow"><Layers3 size={14} /> WIZARD STATS</span><h2>{getEquipmentStatLabel(statKey)}</h2><p>{getEquipmentStatDescription(statKey)}</p></div><Button variant="ghost" ariaLabel="Close stat breakdown" onClick={() => setOpen(false)}>Ã—</Button></header>
      <div className="equipment-stat-breakdown-scroll"><BreakdownContent state={state} statKey={key} pinned /></div>
      <footer className="equipment-stat-breakdown-footer"><span>Current sheet value</span><GameValue value={value} formatted={formatEquipmentStat(statKey, value, false)} /><Button variant="secondary" onClick={() => setOpen(false)}>CLOSE</Button></footer>
    </ModalPortal>
  </>
}

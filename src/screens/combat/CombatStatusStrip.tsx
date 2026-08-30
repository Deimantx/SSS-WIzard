import { Flame, HeartPulse, Shield, Snowflake, Sparkles, Zap } from 'lucide-react'
import type { ActiveStatus } from '../../game/types'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { SPELLS } from '../../game/content/spells/spells'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'

export function CombatStatusStrip({ statuses, label }: { statuses: ActiveStatus[]; label: string }) {
  return <section className={`combat-status-strip${statuses.length ? ' is-active' : ' is-empty'}`} aria-label={label}><div className="combat-subsection-label">{label}</div>{statuses.length ? <div className="combat-status-list">{statuses.map((status) => <CombatStatusChip key={status.statusId} status={status} />)}</div> : <span className="combat-status-empty">None active</span>}</section>
}

export function CombatStatusChip({ status }: { status: ActiveStatus }) {
  const definition = STATUS_DEFINITIONS[status.statusId]
  if (!definition) return null
  const categoryKey = definition.tags.includes('dot') ? 'dot' : definition.tags.includes('control') ? 'control' : definition.classification === 'buff' ? 'buff' : definition.classification === 'debuff' ? 'debuff' : 'neutral'
  const category = categoryKey === 'dot' ? 'Damage over time' : categoryKey === 'control' ? 'Control' : categoryKey === 'buff' ? 'Buff' : categoryKey === 'debuff' ? 'Debuff' : 'Status'
  const source = status.source.kind === 'spell' && status.source.sourceId && SPELLS[status.source.sourceId as keyof typeof SPELLS] ? SPELLS[status.source.sourceId as keyof typeof SPELLS].name : null
  const accent = definition.tags.includes('dot') ? 'danger' : definition.tags.includes('control') ? 'mana' : definition.classification === 'buff' ? 'elemental' : definition.classification === 'debuff' ? 'warning' : 'neutral'
  const duration = status.remainingMs === null ? '∞' : formatTime(status.remainingMs)
  return <GameTooltip block accent={accent} content={<TooltipContent title={definition.name} description={definition.description}><div className="tooltip-section"><small>TYPE</small><p>{category}</p></div><div className="tooltip-section"><small>REMAINING</small><p>{duration}</p></div><div className="tooltip-section"><small>STACKS</small><p>{status.stacks}</p></div>{source && <div className="tooltip-section"><small>SOURCE</small><p>{source}</p></div>}</TooltipContent>}><span className={`combat-status-chip status-category-${categoryKey}`} tabIndex={0} aria-label={`${definition.name}, ${category}, ${status.stacks} stack${status.stacks === 1 ? '' : 's'}, ${duration} remaining`}><span className="combat-status-icon"><StatusIcon status={status} /></span><strong>{definition.name}</strong>{status.stacks > 1 && <b>×{status.stacks}</b>}<small>{duration}</small></span></GameTooltip>
}

function StatusIcon({ status }: { status: ActiveStatus }) {
  const definition = STATUS_DEFINITIONS[status.statusId]
  if (definition.tags.includes('dot')) return <Flame size={13} aria-hidden="true" />
  if (definition.tags.includes('control')) return <Snowflake size={13} aria-hidden="true" />
  if (definition.tags.includes('barrier')) return <Shield size={13} aria-hidden="true" />
  if (definition.classification === 'buff') return <Sparkles size={13} aria-hidden="true" />
  if (definition.classification === 'debuff') return <Zap size={13} aria-hidden="true" />
  return <HeartPulse size={13} aria-hidden="true" />
}

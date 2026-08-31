import { Activity, Heart, Package, Shield, Skull, Sparkles, Swords, Zap } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellIcon } from '../../components/spells/SpellIcon'
import { SPELLS } from '../../game/content/spells/spells'
import { presentCombatLogEntry } from '../../game/presentation/combat'
import type { CombatLogEntry } from '../../game/systems/combat/combatTypes'
import { CombatLogSourceIcon } from './CombatLogSourceIcon'

export function CombatLogRow({ entry, newestTimestampMs, latest = false }: { entry: CombatLogEntry; newestTimestampMs: number; latest?: boolean }) {
  const presentation = presentCombatLogEntry(entry, newestTimestampMs)
  const actionIcon = <LogActionIcon entry={entry} />
  const identityClass = `combat-log-action-identity ${presentation.actionClass}`
  const identity = presentation.tooltip ? <GameTooltip content={<TooltipContent title={presentation.tooltip.title} description={presentation.tooltip.description} />}><span tabIndex={0} className={identityClass}>{actionIcon}<strong>{presentation.actionLabel}</strong></span></GameTooltip> : <span tabIndex={0} className={identityClass}>{actionIcon}<strong>{presentation.actionLabel}</strong></span>
  return <div className={`combat-log-row ${presentation.semanticClass} ${presentation.actionClass} ${latest ? 'is-latest' : ''}`} aria-label={presentation.accessibilityText}><time>{presentation.timeLabel}</time><span className="combat-log-source" aria-label={presentation.sourceLabel}><CombatLogSourceIcon entry={entry} /><small>{entry.source.kind === 'system' ? 'SYS' : entry.source.kind === 'player' ? 'P' : 'E'}</small></span>{identity}<div className="combat-log-message"><strong>{presentation.message}</strong></div>{presentation.result && <span className={`combat-log-result ${presentation.semanticClass}`}>{presentation.result}</span>}</div>
}

export function LegacyCombatLogRow({ message, latest = false }: { message: string; latest?: boolean }) {
  return <div className={`combat-log-row log-system ${latest ? 'is-latest' : ''}`} aria-label={message}><time>—</time><span className="combat-log-source" aria-label="System"><span className="combat-log-source-system"><Sparkles size={15} aria-hidden="true" /></span><small>SYS</small></span><span className="combat-log-action-identity"><Activity size={14} aria-hidden="true" /><strong>LEGACY</strong></span><div className="combat-log-message"><strong>{message}</strong></div></div>
}

function LogActionIcon({ entry }: { entry: CombatLogEntry }) {
  if (entry.category === 'spell' && entry.spellId && SPELLS[entry.spellId]) return <SpellIcon school={SPELLS[entry.spellId].school} size="small" />
  const { category } = entry
  if (category === 'basic-attack' || category === 'enemy-action' || entry.actionPhase === 'telegraph') return <Swords size={14} aria-hidden="true" />
  if (category === 'heal') return <Heart size={14} aria-hidden="true" />
  if (category === 'barrier') return <Shield size={14} aria-hidden="true" />
  if (category === 'death') return <Skull size={14} aria-hidden="true" />
  if (category === 'loot') return <Package size={14} aria-hidden="true" />
  if (category === 'pattern') return <Zap size={14} aria-hidden="true" />
  return <Sparkles size={14} aria-hidden="true" />
}

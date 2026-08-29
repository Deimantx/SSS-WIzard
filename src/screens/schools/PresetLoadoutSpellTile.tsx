import { ArrowDown, ArrowUp, X } from 'lucide-react'
import { Button, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { SpellDefinition, SpellId } from '../../game/types'
import { formatSpellRank, type SpellRank } from '../../game/systems/spells'
import { SpellIcon } from './SpellIcon'

export function PresetLoadoutSpellTile({ spell, spellId, rank, focusCost, index, total, onMove, onRemove }: { spell: SpellDefinition | null; spellId: SpellId; rank: number | null; focusCost: number | null; index: number; total: number; onMove: (index: number, direction: -1 | 1) => void; onRemove: (spellId: SpellId) => void }) {
  const available = Boolean(spell)
  const name = spell?.name ?? '???'
  const school = spell?.school ?? 'fire'
  return <article className={`spell-preset-loadout-tile${available ? '' : ' is-unavailable'}`}>
    <span className="spell-preset-slot-number">{String(index + 1).padStart(2, '0')}</span>
    <SpellIcon school={school} locked={!available} size="medium" />
    <strong>{name}</strong>
    <small>{spell && rank ? `${formatSpellRank(rank as SpellRank)} · ${focusCost ?? rank * 10} Focus` : 'Unavailable · saved slot retained'}</small>
    <div className="spell-preset-tile-actions">
      <GameTooltip content={<TooltipContent title="Move earlier" description="Move this Spell one slot toward the front of the loadout." />}><Button icon variant="ghost" ariaLabel={`Move ${name} up`} disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={13} aria-hidden="true" /></Button></GameTooltip>
      <GameTooltip content={<TooltipContent title="Move later" description="Move this Spell one slot toward the end of the loadout." />}><Button icon variant="ghost" ariaLabel={`Move ${name} down`} disabled={index === total - 1} onClick={() => onMove(index, 1)}><ArrowDown size={13} aria-hidden="true" /></Button></GameTooltip>
      <GameTooltip accent="warning" content={<TooltipContent title="Remove Spell" description="Remove this Spell from the draft loadout." />}><Button icon variant="ghost" ariaLabel={`Remove ${name}`} onClick={() => onRemove(spellId)}><X size={14} aria-hidden="true" /></Button></GameTooltip>
    </div>
  </article>
}

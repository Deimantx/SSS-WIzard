import { ArrowDown, ArrowUp, CircleDot, X } from 'lucide-react'
import { Button, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { SpellDefinition, SpellPresetSlot } from '../../game/types'
import { formatSpellRank, type SpellRank } from '../../game/systems/spells'
import { SpellIcon } from './SpellIcon'

export function PresetLoadoutSpellTile({ spell, slot, rank, focusCost, index, total, onMove, onRemove, onToggleAutoCast }: { spell: SpellDefinition | null; slot: SpellPresetSlot; rank: number | null; focusCost: number | null; index: number; total: number; onMove: (index: number, direction: -1 | 1) => void; onRemove: (spellId: SpellPresetSlot['spellId']) => void; onToggleAutoCast: (spellId: SpellPresetSlot['spellId'], autoCast: boolean) => void }) {
  const available = Boolean(spell)
  const name = spell?.name ?? 'Unavailable Spell'
  const school = spell?.school ?? 'fire'
  return <article className={`spell-preset-loadout-tile${available ? '' : ' is-unavailable'}`}>
    <span className="spell-preset-slot-number">{String(index + 1).padStart(2, '0')}</span>
    <SpellIcon school={school} spellId={available ? slot.spellId : undefined} locked={!available} size="medium" />
    <strong>{name}</strong>
    {spell && rank ? <small>{formatSpellRank(rank as SpellRank)}</small> : <small>Unavailable · saved slot retained</small>}
    <GameTooltip accent="focus" content={<TooltipContent title={slot.autoCast ? 'AUTO-CAST ENABLED' : 'MANUAL SLOT'} description={slot.autoCast ? `${focusCost ?? 0} Focus reserved. This slot participates in Auto-Cast priority.` : 'Manual-only slot. It reserves 0 Auto-Cast Focus.'} />}><Button className={`spell-preset-auto-toggle${slot.autoCast ? ' is-active' : ''}`} variant="ghost" ariaLabel={`${slot.autoCast ? 'Disable' : 'Enable'} Auto-Cast for ${name}`} ariaPressed={slot.autoCast} disabled={!available} onClick={() => onToggleAutoCast(slot.spellId, !slot.autoCast)}><CircleDot size={12} aria-hidden="true" /> {slot.autoCast ? 'AUTO' : 'MANUAL'}</Button></GameTooltip>
    {slot.autoCast && focusCost !== null && <span className="spell-preset-tile-focus"><CircleDot size={12} aria-hidden="true" />{focusCost} Focus</span>}
    <div className="spell-preset-tile-actions">
      <GameTooltip content={<TooltipContent title="Move earlier" description="Move this Spell one slot toward the front of the loadout." />}><Button icon variant="ghost" ariaLabel={`Move ${name} up`} disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={13} aria-hidden="true" /></Button></GameTooltip>
      <GameTooltip content={<TooltipContent title="Move later" description="Move this Spell one slot toward the end of the loadout." />}><Button icon variant="ghost" ariaLabel={`Move ${name} down`} disabled={index === total - 1} onClick={() => onMove(index, 1)}><ArrowDown size={13} aria-hidden="true" /></Button></GameTooltip>
      <GameTooltip accent="warning" content={<TooltipContent title="Remove Spell" description="Remove this Spell from the draft loadout." />}><Button icon variant="ghost" ariaLabel={`Remove ${name}`} onClick={() => onRemove(slot.spellId)}><X size={14} aria-hidden="true" /></Button></GameTooltip>
    </div>
  </article>
}

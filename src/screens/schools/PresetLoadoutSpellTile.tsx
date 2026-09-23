import { ArrowDown, ArrowUp, CircleDot, X } from 'lucide-react'
import { Button, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { SpellDefinition, SpellPresetSlot } from '../../game/types'
import { formatSpellRank, type SpellRank } from '../../game/systems/spells'
import { SpellIcon } from './SpellIcon'

export function PresetLoadoutSpellTile({ spell, slot, rank, focusCost, index, total, dragging = false, dropTarget = false, onMove, onRemove, onToggleAutoCast, onDragStart, onDragEnd, onDragOver, onDrop }: { spell: SpellDefinition | null; slot: SpellPresetSlot | null; rank: number | null; focusCost: number | null; index: number; total: number; dragging?: boolean; dropTarget?: boolean; onMove: (index: number, direction: -1 | 1) => void; onRemove: (spellId: SpellPresetSlot['spellId']) => void; onToggleAutoCast: (spellId: SpellPresetSlot['spellId'], autoCast: boolean) => void; onDragStart?: (event: React.DragEvent<HTMLElement>, spellId: SpellPresetSlot['spellId'], index: number) => void; onDragEnd?: () => void; onDragOver?: (event: React.DragEvent<HTMLElement>, index: number) => void; onDrop?: (event: React.DragEvent<HTMLElement>, index: number) => void }) {
  const available = Boolean(spell && slot)
  const name = spell?.name ?? 'Unavailable Spell'
  const school = spell?.school ?? 'fire'
  const handleDragStart = (event: React.DragEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) { event.preventDefault(); return }
    if (slot) onDragStart?.(event, slot.spellId, index)
  }
  return <article className={`spell-preset-loadout-tile spell-ui-static${slot ? (available ? '' : ' is-unavailable') : ' is-empty'}${dragging ? ' is-dragging' : ''}${dropTarget ? ' is-drop-target' : ''}`} draggable={Boolean(slot)} onDragStart={handleDragStart} onDragEnd={onDragEnd} onDragOver={(event) => onDragOver?.(event, index)} onDrop={(event) => onDrop?.(event, index)}>
    <div className="spell-preset-loadout-head"><span className="spell-preset-slot-number">{String(index + 1).padStart(2, '0')}</span></div>
    <SpellIcon school={school} spellId={available ? slot?.spellId : undefined} locked={!available} size="large" />
    <strong>{slot ? name : 'ADD SPELLS'}</strong>
    {spell && rank ? <small>{formatSpellRank(rank as SpellRank)}</small> : <small>{slot ? 'Unavailable · saved slot retained' : 'NO SPELLS IN THIS PRESET · DROP A SPELL HERE'}</small>}
    {slot && <GameTooltip accent="focus" content={<TooltipContent title={slot.autoCast ? 'AUTO-CAST ENABLED' : 'MANUAL SLOT'} description={slot.autoCast ? `${focusCost ?? 0} Focus reserved. This slot participates in Auto-Cast priority.` : 'Manual-only slot. It reserves 0 Auto-Cast Focus.'} />}><Button className={`spell-preset-auto-toggle${slot.autoCast ? ' is-active' : ''}`} variant="ghost" ariaLabel={`${slot.autoCast ? 'Disable' : 'Enable'} Auto-Cast for ${name}`} ariaPressed={slot.autoCast} disabled={!available} onClick={() => onToggleAutoCast(slot.spellId, !slot.autoCast)}><CircleDot size={12} aria-hidden="true" /> {slot.autoCast ? 'AUTO' : 'MANUAL'}</Button></GameTooltip>}
    {slot?.autoCast && focusCost !== null && <span className="spell-preset-tile-focus"><CircleDot size={12} aria-hidden="true" />{focusCost} Focus</span>}
    {slot && <div className="spell-preset-tile-actions">
      <GameTooltip content={<TooltipContent title="Move earlier" description="Move this Spell one slot toward the front of the loadout." />}><Button icon variant="ghost" ariaLabel={`Move ${name} up`} disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={13} aria-hidden="true" /></Button></GameTooltip>
      <GameTooltip content={<TooltipContent title="Move later" description="Move this Spell one slot toward the end of the loadout." />}><Button icon variant="ghost" ariaLabel={`Move ${name} down`} disabled={index === total - 1} onClick={() => onMove(index, 1)}><ArrowDown size={13} aria-hidden="true" /></Button></GameTooltip>
      <GameTooltip accent="warning" content={<TooltipContent title="Remove Spell" description="Remove this Spell from the draft loadout." />}><Button icon variant="ghost" ariaLabel={`Remove ${name}`} onClick={() => onRemove(slot.spellId)}><X size={14} aria-hidden="true" /></Button></GameTooltip>
    </div>}
  </article>
}

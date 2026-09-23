import { Check, CircleDot, Plus } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { CanonicalSpellId, SpellDefinition } from '../../game/types'
import { formatSpellRank, type SpellRank } from '../../game/systems/spells'
import { SpellIcon } from './SpellIcon'

export function PresetAvailableSpellTile({ spell, rank, focusCost, added, disabled = false, onAdd, dragging = false, onDragStart, onDragEnd }: { spell: SpellDefinition; rank: number; focusCost: number; added: boolean; disabled?: boolean; onAdd: (spellId: CanonicalSpellId) => void; dragging?: boolean; onDragStart?: (event: React.DragEvent<HTMLButtonElement>, spellId: CanonicalSpellId) => void; onDragEnd?: () => void }) {
  const unavailable = added || disabled
  return <GameTooltip block accent={added ? 'neutral' : 'elemental'} content={<TooltipContent title={spell.name} description={added ? 'Already in this preset.' : 'Add this Spell to the loadout.'} />}>
    <button type="button" draggable={!unavailable} disabled={unavailable} aria-label={added ? `${spell.name}, already added` : disabled ? 'Preset has eight slots' : `Add ${spell.name} to preset`} className={`spell-preset-available-tile spell-ui-static${added ? ' is-added' : ''}${disabled ? ' is-full' : ''}${dragging ? ' is-dragging' : ''}`} style={{ '--spell-school-color': SCHOOLS[spell.school].color } as React.CSSProperties} onClick={() => onAdd(spell.id)} onDragStart={(event) => onDragStart?.(event, spell.id)} onDragEnd={onDragEnd}>
      <span className="spell-preset-tile-top"><SpellIcon school={spell.school} spellId={spell.id} size="medium" /> <span className="spell-preset-add-mark">{added ? <Check size={15} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}</span></span>
      <strong>{spell.name}</strong>
      <small>{SCHOOLS[spell.school].name.toUpperCase()} · {formatSpellRank(rank as SpellRank).toUpperCase()}</small>
      <span className="spell-preset-tile-focus"><CircleDot size={12} aria-hidden="true" />{focusCost} Focus</span>
      <span className="spell-preset-tile-state">{added ? 'ADDED' : disabled ? '8 SLOTS FULL' : 'ADD SPELL'}</span>
    </button>
  </GameTooltip>
}

import { Check, CircleDot, Plus } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { SpellDefinition, SpellId } from '../../game/types'
import { formatSpellRank, type SpellRank } from '../../game/systems/spells'
import { SpellIcon } from './SpellIcon'

export function PresetAvailableSpellTile({ spell, rank, focusCost, added, onAdd }: { spell: SpellDefinition; rank: number; focusCost: number; added: boolean; onAdd: (spellId: SpellId) => void }) {
  return <GameTooltip block accent={added ? 'neutral' : 'elemental'} content={<TooltipContent title={spell.name} description={added ? 'Already in this preset.' : 'Add this Spell to the loadout.'} />}>
    <button type="button" disabled={added} aria-label={added ? `${spell.name}, already added` : `Add ${spell.name} to preset`} className={`spell-preset-available-tile${added ? ' is-added' : ''}`} style={{ '--spell-school-color': SCHOOLS[spell.school].color } as React.CSSProperties} onClick={() => onAdd(spell.id)}>
      <span className="spell-preset-tile-top"><SpellIcon school={spell.school} size="medium" /> <span className="spell-preset-add-mark">{added ? <Check size={15} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}</span></span>
      <strong>{spell.name}</strong>
      <small>{formatSpellRank(rank as SpellRank)}</small>
      <span className="spell-preset-tile-focus"><CircleDot size={12} aria-hidden="true" />{focusCost} Focus</span>
      <span className="spell-preset-tile-state">{added ? 'ADDED' : 'ADD SPELL'}</span>
    </button>
  </GameTooltip>
}

import { Check, Clock3, Droplet, Plus } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { CanonicalSpellId, SpellDefinition } from '../../game/types'
import { formatSpellRank, type SpellRank } from '../../game/systems/spells'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'
import { formatTime } from '../../game/utils'
import { getSpellCatalogTags, type SpellCatalogTag } from './spellBrowserSelectors'
import { SpellIcon } from './SpellIcon'

export function PresetAvailableSpellTile({ spell, rank, focusCost, added, disabled = false, onAdd, dragging = false, onDragStart, onDragEnd }: { spell: SpellDefinition; rank: number; focusCost: number; added: boolean; disabled?: boolean; onAdd: (spellId: CanonicalSpellId) => void; dragging?: boolean; onDragStart?: (event: React.DragEvent<HTMLButtonElement>, spellId: CanonicalSpellId) => void; onDragEnd?: () => void }) {
  const unavailable = added || disabled
  const tags = getSpellCatalogTags(spell).slice(0, 2)
  return <GameTooltip block accent={added ? 'neutral' : 'elemental'} content={<TooltipContent title={spell.name} description={added ? 'Already in this preset.' : disabled ? 'The loadout already has eight Spells.' : `Add this Spell to the loadout. Auto-Cast reserves ${focusCost} Focus.`} />}>
    <button type="button" draggable={!unavailable} disabled={unavailable} aria-label={added ? `${spell.name}, already added` : disabled ? 'Preset has eight slots' : `Add ${spell.name} to preset`} className={`spell-preset-available-tile spell-ui-static${added ? ' is-added' : ''}${disabled ? ' is-full' : ''}${dragging ? ' is-dragging' : ''}`} style={{ '--spell-school-color': SCHOOLS[spell.school].color } as React.CSSProperties} onClick={() => onAdd(spell.id)} onDragStart={(event) => onDragStart?.(event, spell.id)} onDragEnd={onDragEnd}>
      <span className="spell-preset-available-top"><SpellIcon school={spell.school} spellId={spell.id} size="large" /><span className={`spell-preset-state-mark${added ? ' is-added' : ''}`}>{added ? <Check size={16} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}</span></span>
      <strong>{spell.name}</strong>
      <small>{SCHOOLS[spell.school].name.toUpperCase()} · {formatSpellRank(rank as SpellRank).toUpperCase()}</small>
      <span className="spell-preset-tile-tags" aria-label={tags.length ? `Effect types: ${tags.map(formatPresetTag).join(', ')}` : undefined}>{tags.map((tag) => <GameTooltip key={tag} content={<TooltipContent title={formatPresetTag(tag)} description={`${formatPresetTag(tag)} effect.`} />}><span className={`spell-preset-tile-tag effect-micro-${tag.toLocaleLowerCase()}`}>{formatPresetTag(tag)}</span></GameTooltip>)}</span>
      <span className="spell-preset-card-metrics"><span className="ui-mana"><Droplet size={11} aria-hidden="true" />{formatResourceAmount(spell.manaCost)}</span><span className="ui-cast-time"><Clock3 size={11} aria-hidden="true" />{formatTime(spell.castTimeMs)}</span><span className="ui-cooldown"><Clock3 size={11} aria-hidden="true" />{formatTime(spell.cooldownMs)}</span></span>
    </button>
  </GameTooltip>
}

function formatPresetTag(tag: SpellCatalogTag) {
  return tag === 'Healing' ? 'HEAL' : tag.toUpperCase()
}

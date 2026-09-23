import { Check, Clock3, CircleDot, Droplet, Eye, LockKeyhole, Plus, Settings2, Trash2 } from 'lucide-react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { formatSpellRank, getSpellAutoCastFocusCost } from '../../game/systems/spells'
import type { SpellId } from '../../game/types'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'
import { formatTime } from '../../game/utils'
import { SpellIcon } from './SpellIcon'
import { getSpellCatalogTags, type SpellBrowserEntry } from './spellBrowserSelectors'
import { buildSpellDetailPresentation, type SpellPresentationState } from './spellDetailPresentation'
import { SpellSemanticIcons } from './SpellSemanticIcons'
import { useSpellLoadoutDnd } from './SpellLoadoutDnd'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'

export function SpellRow({ entry, state, selected, equipped, newSpell, canEdit, onSelect, onEquip, onRemove, onConfigureAutomation }: { entry: SpellBrowserEntry; state: SpellPresentationState; selected: boolean; equipped: boolean; newSpell: boolean; canEdit: boolean; onSelect: (id: SpellId | string) => void; onEquip: (spellId: SpellId) => void; onRemove: (spellId: SpellId) => void; onConfigureAutomation: (spellId: SpellId) => void }) {
  const { beginDrag } = useSpellLoadoutDnd()
  const { openContextMenu } = useGameContextMenu()
  const school = SCHOOLS[entry.school]
  const spell = entry.kind === 'spell' ? SPELLS[entry.spellId] : null
  const unlocked = entry.kind === 'spell' && entry.unlocked
  const detail = unlocked ? buildSpellDetailPresentation(state, entry.spellId, entry.rank ?? 1) : null
  const tags = spell ? getSpellCatalogTags(spell) : []
  const label = unlocked ? `${spell?.name}, ${school.name} School, ${formatSpellRank(entry.rank ?? 1)}` : `Locked ${spell?.name ?? 'spell'}, requires ${school.name} School Level ${entry.unlockLevel}`
  const openSpellContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const inspect = { id: 'inspect', label: 'Inspect Spell', icon: Eye, onSelect: () => onSelect(entry.id) }
    const actions = !unlocked || entry.kind !== 'spell'
      ? [inspect]
      : equipped
        ? [inspect, { id: 'automation', label: 'Configure Automation', icon: Settings2, disabled: !canEdit, disabledReason: !canEdit ? 'Automation is locked during an active battle.' : undefined, onSelect: () => onConfigureAutomation(entry.spellId) }, { id: 'remove', label: 'Remove from Combat Loadout', icon: Trash2, tone: 'warning' as const, disabled: !canEdit, disabledReason: !canEdit ? 'Loadout editing is locked during an active battle.' : undefined, onSelect: () => onRemove(entry.spellId) }]
        : [inspect, { id: 'add', label: 'Add to Combat Loadout', icon: Plus, disabled: !canEdit, disabledReason: !canEdit ? 'Loadout editing is locked during an active battle.' : undefined, onSelect: () => onEquip(entry.spellId) }]
    openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: spell?.name ?? 'Undiscovered Spell', meta: `${school.name.toUpperCase()} · ${unlocked ? formatSpellRank(entry.rank ?? 1).toUpperCase() : 'LOCKED'}`, icon: <SpellIcon school={entry.school} spellId={unlocked && entry.kind === 'spell' ? entry.spellId : undefined} locked={!unlocked} size="small" /> }, sections: [{ id: 'spell', actions }] })
  }
  return <article className={`spell-row${selected ? ' is-selected' : ''}${!unlocked ? ' is-locked' : ''}`} style={{ '--school-accent': school.color } as React.CSSProperties} onContextMenu={openSpellContextMenu}>
    <button type="button" className="spell-row-main" aria-label={label} aria-pressed={selected} onPointerDown={event => { if (unlocked && entry.kind === 'spell') beginDrag({ source: 'library', spellId: entry.spellId }, event) }} onClick={() => onSelect(entry.id)}>
      <span className="spell-row-icon"><SpellIcon school={entry.school} spellId={unlocked ? entry.spellId : undefined} locked={!unlocked} size="medium" /></span>
      <span className="spell-row-identity"><strong>{spell?.name ?? 'Undiscovered spell'}</strong><span>{school.name.toUpperCase()} · {unlocked ? formatSpellRank(entry.rank ?? 1).toUpperCase() : `REQUIRES LEVEL ${entry.unlockLevel}`}</span>{newSpell && <em>NEW</em>}</span>
      <span className="spell-row-category">{unlocked ? <SpellSemanticIcons tags={tags} /> : <span className="spell-row-locked-label">LOCKED</span>}</span>
      {detail && entry.kind === 'spell' ? <span className="spell-row-stats"><CompactStat semantic="mana" icon={<Droplet size={13} />} label="Mana Cost" value={formatResourceAmount(detail.manaCost)} /><CompactStat semantic="focus" icon={<CircleDot size={13} />} label="Auto-Cast Focus" value={`${getSpellAutoCastFocusCost(state, entry.spellId) ?? 0}`} /><CompactStat semantic="cast-time" icon={<Clock3 size={13} />} label="Cast Time" value={formatTime(detail.castTimeMs)} /><CompactStat semantic="cooldown" icon={<Clock3 size={13} />} label="Cooldown" value={detail.cooldownLabel} /></span> : <span className="spell-row-locked-copy"><LockKeyhole size={13} aria-hidden="true" />Requires {school.name} Level {entry.unlockLevel}</span>}
    </button>
    {unlocked && entry.kind === 'spell' && canEdit && <GameTooltip content={<TooltipContent title={equipped ? 'Remove from Combat Loadout' : 'Equip spell'} description={equipped ? 'Unequip this Spell from the selected combat loadout.' : 'Add this Spell to the selected combat loadout as a manual slot.'} />}><button type="button" data-no-drag="true" className={`spell-row-equip${equipped ? ' is-equipped' : ''}`} aria-label={equipped ? `Remove ${spell?.name} from Combat Loadout` : `Equip ${spell?.name}`} onClick={(event) => { event.stopPropagation(); equipped ? onRemove(entry.spellId) : onEquip(entry.spellId) }}>{equipped ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}<span>{equipped ? 'EQUIPPED' : 'EQUIP'}</span></button></GameTooltip>}
  </article>
}

function CompactStat({ semantic, icon, label, value }: { semantic: string; icon: React.ReactNode; label: string; value: string }) {
  return <GameTooltip delay={200} content={<TooltipContent title={label} description={label} />}><span className={`spell-row-compact-stat ui-${semantic}`} aria-label={`${label}: ${value}`}><span aria-hidden="true">{icon}</span>{value}</span></GameTooltip>
}

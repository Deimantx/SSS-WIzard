import { Check, Clock3, CircleDot, Droplet, LockKeyhole, Plus } from 'lucide-react'
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

export function SpellRow({ entry, state, selected, equipped, newSpell, onSelect, onEquip }: { entry: SpellBrowserEntry; state: SpellPresentationState; selected: boolean; equipped: boolean; newSpell: boolean; onSelect: (id: SpellId | string) => void; onEquip: (spellId: SpellId) => void }) {
  const { beginDrag } = useSpellLoadoutDnd()
  const school = SCHOOLS[entry.school]
  const spell = entry.kind === 'spell' ? SPELLS[entry.spellId] : null
  const unlocked = entry.kind === 'spell' && entry.unlocked
  const detail = unlocked ? buildSpellDetailPresentation(state, entry.spellId, entry.rank ?? 1) : null
  const tags = spell ? getSpellCatalogTags(spell) : []
  const label = unlocked ? `${spell?.name}, ${school.name} School, ${formatSpellRank(entry.rank ?? 1)}` : `Locked ${spell?.name ?? 'spell'}, requires ${school.name} School Level ${entry.unlockLevel}`
  return <article className={`spell-row${selected ? ' is-selected' : ''}${!unlocked ? ' is-locked' : ''}`} style={{ '--school-accent': school.color } as React.CSSProperties}>
    <button type="button" className="spell-row-main" aria-label={label} aria-pressed={selected} onPointerDown={event => { if (unlocked && entry.kind === 'spell') beginDrag({ source: 'library', spellId: entry.spellId }, event) }} onClick={() => onSelect(entry.id)}>
      <span className="spell-row-icon"><SpellIcon school={entry.school} spellId={unlocked ? entry.spellId : undefined} locked={!unlocked} size="medium" /></span>
      <span className="spell-row-identity"><strong>{spell?.name ?? 'Undiscovered spell'}</strong><span>{school.name.toUpperCase()} · {unlocked ? formatSpellRank(entry.rank ?? 1).toUpperCase() : `REQUIRES LEVEL ${entry.unlockLevel}`}</span>{newSpell && <em>NEW</em>}</span>
      <span className="spell-row-category">{unlocked ? <SpellSemanticIcons tags={tags} /> : <span className="spell-row-locked-label">LOCKED</span>}</span>
      {detail && entry.kind === 'spell' ? <span className="spell-row-stats"><CompactStat semantic="mana" icon={<Droplet size={13} />} label="Mana Cost" value={formatResourceAmount(detail.manaCost)} /><CompactStat semantic="focus" icon={<CircleDot size={13} />} label="Auto-Cast Focus" value={`${getSpellAutoCastFocusCost(state, entry.spellId) ?? 0}`} /><CompactStat semantic="cast-time" icon={<Clock3 size={13} />} label="Cast Time" value={formatTime(detail.castTimeMs)} /><CompactStat semantic="cooldown" icon={<Clock3 size={13} />} label="Cooldown" value={detail.cooldownLabel} /></span> : <span className="spell-row-locked-copy"><LockKeyhole size={13} aria-hidden="true" />Requires {school.name} Level {entry.unlockLevel}</span>}
    </button>
    {unlocked && entry.kind === 'spell' && <GameTooltip content={<TooltipContent title={equipped ? 'Already prepared' : 'Equip spell'} description={equipped ? 'This Spell is already in the selected combat loadout.' : 'Add this Spell to the selected combat loadout as a manual slot.'} />}><button type="button" className={`spell-row-equip${equipped ? ' is-equipped' : ''}`} aria-label={equipped ? `${spell?.name} already equipped` : `Equip ${spell?.name}`} disabled={equipped} onClick={(event) => { event.stopPropagation(); onEquip(entry.spellId) }}>{equipped ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}<span>{equipped ? 'EQUIPPED' : 'EQUIP'}</span></button></GameTooltip>}
  </article>
}

function CompactStat({ semantic, icon, label, value }: { semantic: string; icon: React.ReactNode; label: string; value: string }) {
  return <GameTooltip delay={200} content={<TooltipContent title={label} description={label} />}><span className={`spell-row-compact-stat ui-${semantic}`} aria-label={`${label}: ${value}`}><span aria-hidden="true">{icon}</span>{value}</span></GameTooltip>
}

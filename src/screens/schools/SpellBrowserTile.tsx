import { CircleDot, Clock3, Droplet, Flame, HeartPulse, Shield, Snowflake, Sparkles, Zap } from 'lucide-react'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { formatSpellRank } from '../../game/systems/spells'
import type { SpellId } from '../../game/types'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellIcon } from './SpellIcon'
import type { SpellBrowserEntry, SpellCatalogTag } from './spellBrowserSelectors'
import { SpellCardTooltip } from './SpellCardTooltip'
import { buildSpellDetailPresentation, type SpellPresentationState } from './spellDetailPresentation'

export function SpellBrowserTile({ entry, state, selected, onSelect }: { entry: SpellBrowserEntry; state: SpellPresentationState; selected: boolean; onSelect: (id: SpellId | string) => void }) {
  const school = SCHOOLS[entry.school]
  const unlocked = entry.kind === 'spell' && entry.unlocked
  const presentation = unlocked && entry.kind === 'spell' ? buildSpellDetailPresentation(state, entry.spellId, entry.rank ?? 1) : null
  const autoCast = presentation?.autoCastActive ?? false
  const effectTags = unlocked && entry.kind === 'spell' ? getEffectMicroTags(entry.tags, entry.spellId) : []
  const visibleLabel = entry.kind === 'placeholder'
    ? `Undiscovered ${school.name} spell, requires ${school.name} School Level ${entry.unlockLevel}`
    : entry.unlocked ? `${SPELLS[entry.spellId].name}, ${school.name} School, ${formatSpellRank(entry.rank ?? 1)}${autoCast ? ', Auto-Cast active' : ''}` : `Locked ${school.name} spell, requires ${school.name} School Level ${entry.unlockLevel}`
  const content = presentation
    ? <SpellCardTooltip presentation={presentation} />
    : <TooltipContent title={entry.kind === 'placeholder' ? 'Undiscovered spell' : 'Locked spell'} description={`${school.name} School Level ${entry.unlockLevel} is required. Continue researching to reveal this entry.`} />
  return <span className="spell-browser-tile-shell">
    <button type="button" style={{ '--spell-school-color': school.color } as React.CSSProperties} className={`spell-browser-tile${selected ? ' is-selected' : ''}${unlocked ? ' is-unlocked' : ' is-locked'}`} aria-label={visibleLabel} aria-pressed={selected} onClick={() => onSelect(entry.id)}>
      <div className="spell-browser-tile-top"><GameTooltip className="spell-browser-icon-tooltip" wide={Boolean(presentation)} delay={presentation ? 120 : 500} placement={presentation ? 'right' : 'top'} accent={unlocked ? 'elemental' : 'warning'} content={content}><span className="spell-browser-icon-frame" tabIndex={0} aria-label={`View ${visibleLabel}`}><SpellIcon school={entry.school} locked={!unlocked} size="large" /></span></GameTooltip>{unlocked && autoCast && <span className="spell-tile-status" aria-label="Auto-Cast active"><CircleDot size={16} aria-hidden="true" /></span>}</div>
      <span className="spell-browser-tile-main">
        {unlocked && entry.kind === 'spell' ? <><strong className="spell-browser-name">{SPELLS[entry.spellId].name}</strong><span className="spell-browser-rank">{school.name.toUpperCase()} Â· {formatSpellRank(entry.rank ?? 1).toUpperCase()}</span></> : <><strong className="spell-browser-name">???</strong><span className="spell-browser-rank">{school.name.toUpperCase()} Â· {entry.kind === 'placeholder' ? 'UNDISCOVERED' : 'LOCKED'}</span></>}
      </span>
      <span className="spell-browser-effect-slot" aria-hidden="true" />
      {unlocked && entry.kind === 'spell' ? <span className="spell-browser-footer"><span className="ui-mana" aria-label="Mana cost"><Droplet size={12} aria-hidden="true" />{SPELLS[entry.spellId].manaCost}</span><span className="ui-time" aria-label="Cooldown"><Clock3 size={12} aria-hidden="true" />{formatTime(SPELLS[entry.spellId].cooldownMs)}</span></span> : <span className="spell-browser-footer"><CircleDot size={11} aria-hidden="true" />Requires Lv {entry.unlockLevel}</span>}
    </button>
    <span className="spell-browser-effect-icons" aria-label={effectTags.length ? `Effect types: ${effectTags.map(effectTagLabel).join(', ')}` : undefined} aria-hidden={!effectTags.length}>{effectTags.map((tag) => <GameTooltip key={tag} content={<TooltipContent title={effectTagLabel(tag)} description={`${effectTagLabel(tag)} effect.`} />}><span className={`spell-browser-effect-icon effect-micro-${tag.toLocaleLowerCase()}`} aria-label={effectTagLabel(tag)}><EffectMicroIcon tag={tag} /></span></GameTooltip>)}</span>
  </span>
}

type SpellEffectMicroTag = SpellCatalogTag | 'Debuff'

function effectTagLabel(tag: SpellEffectMicroTag) {
  return tag === 'Healing' ? 'Heal' : tag
}

function getEffectMicroTags(tags: readonly SpellCatalogTag[], spellId: SpellId): SpellEffectMicroTag[] {
  const next = [...tags] as SpellEffectMicroTag[]
  const hasDebuff = SPELLS[spellId].effects.some((effect) => effect.type === 'apply-status' && STATUS_DEFINITIONS[effect.statusId]?.classification === 'debuff')
  if (hasDebuff && !next.includes('Debuff')) next.push('Debuff')
  return next.slice(0, 2)
}

function EffectMicroIcon({ tag }: { tag: SpellEffectMicroTag }) {
  if (tag === 'Damage') return <Flame size={12} aria-hidden="true" />
  if (tag === 'Healing') return <HeartPulse size={12} aria-hidden="true" />
  if (tag === 'Barrier') return <Shield size={12} aria-hidden="true" />
  if (tag === 'Buff') return <Sparkles size={12} aria-hidden="true" />
  if (tag === 'Control') return <Snowflake size={12} aria-hidden="true" />
  if (tag === 'DoT') return <Flame size={12} aria-hidden="true" />
  return <Zap size={12} aria-hidden="true" />
}

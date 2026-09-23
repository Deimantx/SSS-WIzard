import { CircleDot, Clock3, Droplet, Flame, HeartPulse, Settings2, Shield, Snowflake, Sparkles, Zap } from 'lucide-react'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { formatSpellRank } from '../../game/systems/spells'
import type { SpellId } from '../../game/types'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellIcon } from './SpellIcon'
import type { SpellBrowserEntry, SpellCatalogTag } from './spellBrowserSelectors'
import { SpellCardTooltip } from './SpellCardTooltip'
import { buildSpellDetailPresentation, type SpellPresentationState } from './spellDetailPresentation'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'

export function SpellBrowserTile({ entry, state, selected, newSpell = false, onSelect, onToggleAutoCast, onOpenPresetManager }: { entry: SpellBrowserEntry; state: SpellPresentationState; selected: boolean; newSpell?: boolean; onSelect: (id: SpellId | string) => void; onToggleAutoCast: (spellId: SpellId) => void; onOpenPresetManager: () => void }) {
  const { openContextMenu } = useGameContextMenu()
  const school = SCHOOLS[entry.school]
  const unlocked = entry.kind === 'spell' && entry.unlocked
  const presentation = unlocked && entry.kind === 'spell' ? buildSpellDetailPresentation(state, entry.spellId, entry.rank ?? 1) : null
  const autoCast = presentation?.autoCastActive ?? false
  const effectTags = unlocked && entry.kind === 'spell' ? entry.tags.slice(0, 2) : []
  const visibleLabel = entry.kind === 'placeholder'
    ? `Undiscovered ${school.name} spell, requires ${school.name} School Level ${entry.unlockLevel}`
    : entry.unlocked ? `${SPELLS[entry.spellId].name}, ${school.name} School, ${formatSpellRank(entry.rank ?? 1)}${newSpell ? ', New spell' : ''}${autoCast ? ', Auto-Cast active' : ''}` : `Locked ${school.name} spell, requires ${school.name} School Level ${entry.unlockLevel}`
  const tooltipContent = presentation
    ? <SpellCardTooltip presentation={presentation} />
    : <TooltipContent title={entry.kind === 'placeholder' ? 'Undiscovered spell' : 'Locked spell'} description={`${school.name} School Level ${entry.unlockLevel} is required. Continue researching to reveal this entry.`} />
  const openSpellMenu = (x: number, y: number, anchor?: HTMLElement) => {
    if (!presentation || entry.kind !== 'spell') return
    openContextMenu({ x, y, anchor, header: { title: SPELLS[entry.spellId].name, meta: `${school.name} · ${formatSpellRank(entry.rank ?? 1)}` }, sections: [{ id: 'spell', actions: [{ id: 'autocast', label: autoCast ? 'Disable Auto-Cast' : 'Enable Auto-Cast', icon: CircleDot, onSelect: () => onToggleAutoCast(entry.spellId) }, { id: 'manager', label: 'Preset Manager', icon: Settings2, onSelect: onOpenPresetManager } ] }] })
  }
  return <span className="spell-browser-tile-shell">
    <GameTooltip block className="spell-browser-card-tooltip" wide={Boolean(presentation)} delay={presentation ? 120 : 500} placement={presentation ? 'right' : 'top'} accent={unlocked ? 'elemental' : 'warning'} content={tooltipContent}>
      <button type="button" data-static-motion="true" data-spell-id={entry.kind === 'spell' ? entry.spellId : undefined} style={{ '--spell-school-color': school.color } as React.CSSProperties} className={`spell-browser-tile${selected ? ' is-selected' : ''}${unlocked ? ' is-unlocked' : ' is-locked'}`} aria-label={visibleLabel} aria-pressed={selected} onClick={() => onSelect(entry.id)} onContextMenu={(event) => { if (!unlocked) return; event.preventDefault(); event.stopPropagation(); openSpellMenu(event.clientX, event.clientY, event.currentTarget) }}>
        <div className="spell-browser-state-badges" aria-hidden="true">{newSpell && <span className="spell-browser-new-badge">NEW</span>}{unlocked && autoCast && <span className="spell-browser-autocast-mark spell-tile-status"><CircleDot size={15} /></span>}</div>
        <div className="spell-browser-icon-row"><span className="spell-browser-icon-frame"><SpellIcon school={entry.school} spellId={unlocked && entry.kind === 'spell' ? entry.spellId : undefined} locked={!unlocked} size="large" /></span></div>
        <div className="spell-browser-title-block"><strong className="spell-browser-name">{unlocked && entry.kind === 'spell' ? SPELLS[entry.spellId].name : '???'}</strong></div>
        <div className="spell-browser-rank-row"><span className="spell-browser-rank">{school.name.toUpperCase()} · {unlocked && entry.rank ? formatSpellRank(entry.rank).toUpperCase() : entry.kind === 'placeholder' ? 'UNDISCOVERED' : 'LOCKED'}</span></div>
        <div className="spell-browser-tags" aria-label={effectTags.length ? `Effect types: ${effectTags.map(effectTagLabel).join(', ')}` : undefined}>{effectTags.map((tag) => <GameTooltip key={tag} content={<TooltipContent title={effectTagLabel(tag)} description={`${effectTagLabel(tag)} effect.`} />}><span className={`spell-browser-effect-icon effect-micro-${tag.toLocaleLowerCase()}`} aria-label={effectTagLabel(tag)}><EffectMicroIcon tag={tag} /></span></GameTooltip>)}</div>
        {unlocked && entry.kind === 'spell' && presentation ? <span className="spell-browser-footer"><span className="ui-mana" aria-label={`Mana cost ${formatResourceAmount(presentation.manaCost)}`}><Droplet size={12} aria-hidden="true" />{formatResourceAmount(presentation.manaCost)}</span><span className="ui-cast-time" aria-label={`Cast time ${presentation.castTimeLabel}`}><Clock3 size={12} aria-hidden="true" />{presentation.castTimeLabel}</span><span className="ui-cooldown" aria-label={`Cooldown ${presentation.cooldownLabel}`}><Clock3 size={12} aria-hidden="true" />{presentation.cooldownLabel}</span></span> : <span className="spell-browser-footer"><CircleDot size={11} aria-hidden="true" />Requires Lv {entry.unlockLevel}</span>}
      </button>
    </GameTooltip>
  </span>
}

function effectTagLabel(tag: SpellCatalogTag) {
  return tag === 'Healing' ? 'Heal' : tag
}

function EffectMicroIcon({ tag }: { tag: SpellCatalogTag }) {
  const iconProps = { size: 12, strokeWidth: 2.2, 'aria-hidden': true as const }
  if (tag === 'Damage' || tag === 'DoT') return <Flame {...iconProps} />
  if (tag === 'Healing') return <HeartPulse {...iconProps} />
  if (tag === 'Barrier') return <Shield {...iconProps} />
  if (tag === 'Buff') return <Sparkles {...iconProps} />
  if (tag === 'Control') return <Snowflake {...iconProps} />
  return <Zap {...iconProps} />
}

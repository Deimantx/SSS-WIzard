import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { formatSpellRank } from '../../game/systems/spells'
import type { SpellId } from '../../game/types'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellIcon } from './SpellIcon'
import type { SpellBrowserEntry } from './spellBrowserSelectors'

export function SpellBrowserTile({ entry, selected, onSelect }: { entry: SpellBrowserEntry; selected: boolean; onSelect: (id: SpellId | string) => void }) {
  const school = SCHOOLS[entry.school]
  const unlocked = entry.kind === 'spell' && entry.unlocked
  const visibleLabel = entry.kind === 'placeholder'
    ? `Undiscovered ${school.name} spell, requires ${school.name} School Level ${entry.unlockLevel}`
    : entry.unlocked ? `${SPELLS[entry.spellId].name}, ${school.name} School, ${formatSpellRank(entry.rank ?? 1)}` : `Locked ${school.name} spell, requires ${school.name} School Level ${entry.unlockLevel}`
  const content = unlocked
    ? <TooltipContent title="Spell" description="Select to inspect casting details, effects, and Auto-Cast settings." />
    : <TooltipContent title={entry.kind === 'placeholder' ? 'Undiscovered spell' : 'Locked spell'} description={`${school.name} School Level ${entry.unlockLevel} is required. Continue researching to reveal this entry.`} />
  return <GameTooltip block accent={unlocked ? 'elemental' : 'warning'} content={content}>
    <button type="button" style={{ '--spell-school-color': school.color } as React.CSSProperties} className={`spell-browser-tile${selected ? ' is-selected' : ''}${unlocked ? ' is-unlocked' : ' is-locked'}`} aria-label={visibleLabel} aria-pressed={selected} onClick={() => onSelect(entry.id)}>
      <div className="spell-browser-tile-top"><SpellIcon school={entry.school} locked={!unlocked} size="large" />{entry.kind === 'placeholder' && <span className="spell-browser-undiscovered">UNDISCOVERED</span>}</div>
      <span className="spell-browser-tile-main">
        {unlocked && entry.kind === 'spell' ? <><strong className="spell-browser-name">{SPELLS[entry.spellId].name}</strong><span className="spell-browser-rank">{school.name.toUpperCase()} · {formatSpellRank(entry.rank ?? 1).toUpperCase()}</span></> : <><strong className="spell-browser-name">???</strong><span className="spell-browser-rank">{school.name.toUpperCase()} · {entry.kind === 'placeholder' ? 'UNDISCOVERED' : 'LOCKED'}</span></>}
      </span>
      {unlocked && entry.kind === 'spell' ? <span className="spell-browser-footer">{SPELLS[entry.spellId].manaCost} Mana · {formatTime(SPELLS[entry.spellId].cooldownMs)}</span> : <span className="spell-browser-footer">Requires Lv {entry.unlockLevel}</span>}
    </button>
  </GameTooltip>
}

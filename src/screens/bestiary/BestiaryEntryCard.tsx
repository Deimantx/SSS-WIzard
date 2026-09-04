import type { CSSProperties } from 'react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { BESTIARY_ENTRY_CATEGORY_LABELS, formatDefeats, getMonsterDefeatCount } from '../../game/systems/bestiary/bestiarySelectors'
import { isBossMonster, type MonsterDefinition } from '../../game/content/monsters'
import type { GameState } from '../../game/types'

export function BestiaryEntryCard({ monster, progress, selected, newEntry = false, onSelect }: { monster: MonsterDefinition; progress: GameState['progress']; selected: boolean; newEntry?: boolean; onSelect: () => void }) {
  const discovered = progress.discoveredMonsters.includes(monster.id)
  const category = BESTIARY_ENTRY_CATEGORY_LABELS[monster.bestiaryCategory]
  const defeats = getMonsterDefeatCount({ progress }, monster.id)
  const card = <button type="button" className={`archive-entry-card bestiary-entry-card ${discovered ? 'discovered' : 'undiscovered'} ${selected ? 'selected' : ''}`} onClick={onSelect} aria-label={discovered ? `${monster.name}, ${category}, ${formatDefeats(defeats)}` : 'Undiscovered creature'} aria-pressed={selected}>
    <span className="archive-entry-art bestiary-entry-art" style={{ '--bestiary-color': discovered ? monster.color : 'var(--ui-text-muted)' } as CSSProperties}>{discovered ? monster.image ? <img src={monster.image} alt="" /> : <span>{isBossMonster(monster) ? '♛' : '◈'}</span> : '?'}</span>
    <span className="bestiary-entry-copy"><strong>{discovered ? monster.name : 'Undiscovered'}</strong><small>{category}</small>{discovered && <small>{formatDefeats(defeats)}</small>}</span>
    {discovered && newEntry && <span className="archive-new-badge">NEW</span>}
  </button>
  return <GameTooltip block content={<TooltipContent title={discovered ? monster.name : 'Undiscovered Creature'} description={discovered ? `${category} · ${formatDefeats(defeats)}` : 'Encounter it to reveal this Bestiary entry.'} />}>{card}</GameTooltip>
}

import type { CSSProperties } from 'react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { BESTIARY_CATEGORY_LABELS, getMonsterDefeatCount } from '../../game/systems/bestiary/bestiarySelectors'
import { isBossMonster, type MonsterDefinition } from '../../game/content/monsters/whisperingWoods'
import type { GameState } from '../../game/types'

export function BestiaryEntryCard({ monster, progress, selected, onSelect }: { monster: MonsterDefinition; progress: GameState['progress']; selected: boolean; onSelect: () => void }) {
  const discovered = progress.discoveredMonsters.includes(monster.id)
  const category = BESTIARY_CATEGORY_LABELS[monster.bestiaryCategory]
  const card = <button type="button" className={`archive-entry-card bestiary-entry-card ${discovered ? 'discovered' : 'undiscovered'} ${selected ? 'selected' : ''}`} onClick={onSelect} aria-label={discovered ? `${monster.name}, ${category}, ${getMonsterDefeatCount({ progress }, monster.id)} defeats` : 'Undiscovered creature'} aria-pressed={selected}>
    <span className="archive-entry-art bestiary-entry-art" style={{ '--bestiary-color': discovered ? monster.color : 'var(--ui-text-muted)' } as CSSProperties}>{discovered ? monster.image ? <img src={monster.image} alt="" /> : <span>{isBossMonster(monster) ? 'â™›' : 'â—ˆ'}</span> : '?'}</span>
    <span className="bestiary-entry-copy"><strong>{discovered ? monster.name : 'Undiscovered'}</strong><small>{category}</small>{discovered && <small>{getMonsterDefeatCount({ progress }, monster.id).toLocaleString()} defeated</small>}</span>
  </button>
  return <GameTooltip block content={<TooltipContent title={discovered ? monster.name : 'Undiscovered Creature'} description={discovered ? `${category} Â· ${getMonsterDefeatCount({ progress }, monster.id)} defeats` : 'Encounter it to reveal this Bestiary entry.'} />}>{card}</GameTooltip>
}

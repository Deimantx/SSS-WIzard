import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { CSSProperties } from 'react'
import { getMonsterDefeatCount } from '../../game/systems/bestiary/bestiarySelectors'
import { isBossMonster, type MonsterDefinition } from '../../game/content/monsters/whisperingWoods'
import type { GameState } from '../../game/types'

const labels = { monster: 'Monster', boss: 'Boss', 'special-boss': 'Special Boss' } as const

export function BestiaryEntryCard({ monster, progress, selected, onSelect }: { monster: MonsterDefinition; progress: GameState['progress']; selected: boolean; onSelect: () => void }) {
  const discovered = progress.discoveredMonsters.includes(monster.id)
  const card = <button type="button" className={`bestiary-entry-card ${discovered ? 'discovered' : 'undiscovered'} ${selected ? 'selected' : ''}`} onClick={onSelect} aria-label={discovered ? `${monster.name}, ${labels[monster.bestiaryCategory]}, ${getMonsterDefeatCount({ progress }, monster.id)} defeats` : 'Undiscovered creature'} aria-pressed={selected}><span className="bestiary-entry-art" style={{ '--bestiary-color': monster.color } as CSSProperties}>{discovered ? monster.image ? <img src={monster.image} alt="" /> : <span>{isBossMonster(monster) ? '♛' : '◈'}</span> : '?'}</span><span className="bestiary-entry-copy"><strong>{discovered ? monster.name : 'Undiscovered'}</strong><small>{labels[monster.bestiaryCategory]}</small>{discovered && <small>{getMonsterDefeatCount({ progress }, monster.id).toLocaleString()} defeated</small>}</span></button>
  return <GameTooltip block content={<TooltipContent title={discovered ? monster.name : 'Undiscovered Creature'} description={discovered ? `${labels[monster.bestiaryCategory]} · ${getMonsterDefeatCount({ progress }, monster.id)} defeats` : 'Encounter it to reveal this Bestiary entry.'} />}>{card}</GameTooltip>
}

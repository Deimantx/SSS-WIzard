import { MapPin, PackageOpen } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Card, Status } from '../../components/ui'
import { BESTIARY_ENTRY_CATEGORY_LABELS, getMonsterDefeatCount, getMonsterLocations } from '../../game/systems/bestiary/bestiarySelectors'
import { isBossMonster, MONSTERS, type MonsterDefinition } from '../../game/content/monsters'
import type { GameState, MonsterId } from '../../game/types'
import { BestiaryAbilities } from './BestiaryAbilities'
import { BestiaryLootTable } from './BestiaryLootTable'
import { BestiarySequence } from './BestiarySequence'
import { BestiaryStats } from './BestiaryStats'
import { BestiaryTraits } from './BestiaryTraits'

export function BestiaryInspector({ monsterId, progress }: { monsterId: MonsterId | null; progress: GameState['progress'] }) {
  if (!monsterId) return <Card title="CREATURE DOSSIER" className="bestiary-inspector"><div className="bestiary-inspector-empty"><PackageOpen size={30} aria-hidden="true" /><strong>SELECT A DISCOVERED CREATURE</strong><span>Encounter one in combat to begin its permanent dossier.</span></div></Card>
  const monster = MONSTERS[monsterId]
  if (!progress.discoveredMonsters.includes(monsterId)) return <Card title="CREATURE DOSSIER" className="bestiary-inspector"><div className="bestiary-inspector-empty"><span className="bestiary-unknown-mark">?</span><strong>UNDISCOVERED CREATURE</strong><span>Encounter it to reveal this Bestiary entry.</span></div></Card>
  if (!monster) return <Card title="CREATURE DOSSIER" className="bestiary-inspector"><div className="bestiary-inspector-empty"><strong>CREATURE DATA UNAVAILABLE</strong></div></Card>
  return <Dossier monster={monster} progress={progress} />
}

function Dossier({ monster, progress }: { monster: MonsterDefinition; progress: GameState['progress'] }) {
  const locations = getMonsterLocations(monster.id)
  const boss = isBossMonster(monster)
  return <Card title="CREATURE DOSSIER" className="bestiary-inspector"><div className="bestiary-inspector-scroll" style={{ '--bestiary-color': monster.color } as CSSProperties}><div className="bestiary-dossier-hero"><div className={`bestiary-portrait ${boss ? 'boss' : ''}`}>{monster.image ? <img src={monster.image} alt="" /> : <span>{boss ? '♛' : '◈'}</span>}</div><div><span className="bestiary-dossier-category">{BESTIARY_ENTRY_CATEGORY_LABELS[monster.bestiaryCategory]}</span><h2>{monster.name}</h2><p>{monster.subtitle}</p><Status tone="success">DISCOVERED</Status></div></div><div className="bestiary-dossier-meta"><span>DEFEATED <strong>{getMonsterDefeatCount({ progress }, monster.id).toLocaleString()}</strong></span><span><MapPin size={13} /> {locations.length ? locations.join(' · ') : 'Unknown location'}</span></div><BestiaryStats monster={monster} /><BestiaryTraits monster={monster} /><BestiaryAbilities monster={monster} /><BestiarySequence monster={monster} /><BestiaryLootTable monster={monster} progress={progress} /></div></Card>
}

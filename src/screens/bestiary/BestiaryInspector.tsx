import { MapPin, PackageOpen } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Card, GameTooltip, Status } from '../../components/ui'
import { BESTIARY_ENTRY_CATEGORY_LABELS, getMonsterDefeatCount, getMonsterLocations } from '../../game/systems/bestiary/bestiarySelectors'
import { isBossMonster, MONSTERS, type MonsterDefinition } from '../../game/content/monsters'
import type { GameState, MonsterId } from '../../game/types'
import { BestiaryAbilities } from './BestiaryAbilities'
import { BestiaryLootTable } from './BestiaryLootTable'
import { BestiarySequence } from './BestiarySequence'
import { BestiaryStats } from './BestiaryStats'
import { BestiaryTraits } from './BestiaryTraits'
import { BestiaryBossSummary } from './BestiaryBossSummary'
import { BestiaryBossMechanics } from './BestiaryBossMechanics'
import { BestiaryBossPhases } from './BestiaryBossPhases'
import { BestiaryResonanceYield } from './BestiaryResonanceYield'
import { useRef } from 'react'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { useGameStore } from '../../store/gameStore'
import { BestiarySigilDrops } from './BestiarySigilDrops'

export function BestiaryInspector({ monsterId, progress }: { monsterId: MonsterId | null; progress: GameState['progress'] }) {
  const currentWorldTier = useGameStore((state) => state.worldTier.current)
  if (!monsterId) return <Card title="CREATURE DOSSIER" className="bestiary-inspector"><div className="bestiary-inspector-empty"><PackageOpen size={30} aria-hidden="true" /><strong>SELECT A DISCOVERED CREATURE</strong><span>Encounter one in combat to begin its permanent dossier.</span></div></Card>
  const monster = MONSTERS[monsterId]
  if (!progress.discoveredMonsters.includes(monsterId)) return <Card title="CREATURE DOSSIER" className="bestiary-inspector"><div className="bestiary-inspector-empty"><span className="bestiary-unknown-mark">?</span><strong>UNDISCOVERED CREATURE</strong><span>Encounter it to reveal this Bestiary entry.</span></div></Card>
  if (!monster) return <Card title="CREATURE DOSSIER" className="bestiary-inspector"><div className="bestiary-inspector-empty"><strong>CREATURE DATA UNAVAILABLE</strong></div></Card>
  return <Dossier monster={monster} progress={progress} worldTier={currentWorldTier} />
}

function Dossier({ monster, progress, worldTier }: { monster: MonsterDefinition; progress: GameState['progress']; worldTier: GameState['worldTier']['current'] }) {
  const dossierScrollRef = useRef<HTMLDivElement>(null)
  useSmartScrollState(dossierScrollRef, { resetKey: monster.id })
  const locations = getMonsterLocations(monster.id)
  const boss = isBossMonster(monster)
  return <Card title="CREATURE DOSSIER" className="bestiary-inspector"><div ref={dossierScrollRef} className="bestiary-inspector-scroll smart-scroll-region" style={{ '--bestiary-color': monster.color } as CSSProperties}><div className="bestiary-dossier-hero"><div className={`bestiary-portrait ${boss ? 'boss' : ''}`}>{monster.image ? <img src={monster.image} alt="" /> : <span>{boss ? '♛' : '◈'}</span>}</div><div><span className="bestiary-dossier-category">{BESTIARY_ENTRY_CATEGORY_LABELS[monster.bestiaryCategory]}</span><h2>{monster.name}</h2><p>{monster.subtitle}</p><Status tone="success">DISCOVERED</Status>{boss && <BestiaryBossSummary monster={monster} />}</div></div><div className="bestiary-dossier-meta"><span>DEFEATED <strong>{getMonsterDefeatCount({ progress }, monster.id).toLocaleString()}</strong></span><span><MapPin size={13} /> {locations.length ? locations.join(' · ') : 'Unknown location'}</span></div><BestiaryStats monster={monster} />{monster.hunter && <HunterDossierData monster={monster} progress={progress} />}{boss ? <><BestiaryBossMechanics monster={monster} /><BestiaryBossPhases monster={monster} /></> : <BestiaryTraits monster={monster} />}<BestiaryAbilities monster={monster} />{!boss && <BestiarySequence monster={monster} />}<BestiaryResonanceYield monster={monster} worldTier={worldTier} /><BestiaryLootTable monster={monster} progress={progress} worldTier={worldTier} /><BestiarySigilDrops monster={monster} worldTier={worldTier} /></div></Card>
}

function HunterDossierData({ monster, progress }: { monster: MonsterDefinition; progress: GameState['progress'] }) {
  const metadata = monster.hunter!
  const stats = progress.huntersOrder.monsterHunterStats[monster.id]
  const blocked = progress.huntersOrder.blockedTargets.includes(monster.id)
  return <section className="bestiary-hunter-data" aria-label="Hunter classification"><GameTooltip content="Classification identifies this creature’s Hunter Order tier. Family and alignment describe its lineage and nature. Contract counts include only tracked kills and completed assignments; blocked targets cannot appear on future boards."><h3>HUNTER RECORD</h3></GameTooltip><dl><div><dt>Classification</dt><dd>{metadata.contractTier}</dd></div><div><dt>Family</dt><dd>{metadata.family}</dd></div><div><dt>Alignment</dt><dd>{metadata.alignment}</dd></div><div><dt>Hunter-exclusive</dt><dd>{metadata.exclusive ? 'Yes' : 'No'}</dd></div><div><dt>Contract required</dt><dd>{metadata.contractRequired ? 'Yes' : 'No'}</dd></div><div><dt>Contracts completed</dt><dd>{stats?.contractsCompleted ?? 0}</dd></div><div><dt>Kills under contract</dt><dd>{stats?.contractKills ?? 0}</dd></div><div><dt>Hunter Marks earned</dt><dd>{stats?.marksEarned ?? 0}</dd></div><div><dt>Target state</dt><dd>{blocked ? 'Blocked' : 'Available'}</dd></div></dl></section>
}

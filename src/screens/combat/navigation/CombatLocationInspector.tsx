import { BookOpen, Crown, Gem, LockKeyhole, Package, Swords } from 'lucide-react'
import { Button, GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { MONSTERS, type MonsterDefinition } from '../../../game/content/monsters'
import { getMonsterDossierCombatStats } from '../../../game/presentation/combat'
import type { CombatEncounterViewModel, CombatLocationViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { formatNumber, formatTime } from '../../../game/utils'
import { MonsterPortrait } from '../MonsterPortrait'

export function CombatLocationInspector({ location, activeLocationId, combatActive, onLoot, onBestiary, onEnter }: { location: CombatLocationViewModel | null; activeLocationId: string | null; combatActive: boolean; onLoot: () => void; onBestiary: () => void; onEnter: () => void }) {
  if (!location) return <aside className="combat-location-inspector" aria-label="Location details"><div className="combat-location-inspector-empty"><span aria-hidden="true">◇</span><strong>SELECT A LOCATION</strong><p>Choose a location to inspect its status, encounters, loot, and entry action.</p></div></aside>

  const isActive = Boolean(combatActive && activeLocationId === location.id)
  const locked = location.state === 'locked'
  const prototype = location.state === 'prototype'
  const entryLabel = prototype ? 'CONTENT NOT AUTHORED' : isActive ? 'RETURN TO COMBAT' : locked ? 'LOCATION LOCKED' : `${location.type === 'combat-zone' ? 'ENTER ZONE' : location.type === 'dungeon' ? 'ENTER DUNGEON' : 'ENTER LOCATION'}`
  const entryTooltip = prototype
    ? <TooltipContent title="Content not authored" description="This location is reserved for a future content type." />
    : locked
      ? <TooltipContent title="Location locked" description={location.unlockText ?? 'This location is not available yet.'} />
      : undefined

  return <aside className={`combat-location-inspector is-${location.state}`} aria-label="Location details">
    <div className="combat-location-inspector-scroll">
      <div className="combat-location-inspector-hero"><div className="combat-location-inspector-glyph" aria-hidden="true"><span>{location.type === 'dungeon' ? '◆' : location.type === 'combat-zone' ? '✧' : '◇'}</span><i /></div><div className="combat-location-inspector-heading"><span className="combat-subsection-label">LOCATION DETAILS</span><h3>{location.name}</h3><div className="combat-location-inspector-badges"><Status tone={location.state === 'locked' ? 'locked' : location.state === 'completed' ? 'success' : location.state === 'boss-ready' ? 'warning' : 'active'}>{location.statusLabel}</Status><span className="combat-location-type-badge">{location.typeLabel}</span></div></div></div>
      <p className="combat-location-description">{location.description}</p>
      <section className="combat-location-section"><span className="combat-location-section-label">LOCATION TYPE</span><div className="combat-location-type-note"><strong>{location.typeLabel}</strong><span>{location.type === 'combat-zone' ? 'Repeatable combat content. Encounter tiles are preview-only in Phase 3A.' : location.type === 'dungeon' ? 'Structured encounter and boss content.' : 'Future content type.'}</span></div></section>
      {location.threatRequired !== null && <section className="combat-location-section"><span className="combat-location-section-label">LOCATION STATUS</span><div className="combat-location-metrics"><span><small>THREAT</small><strong>{location.threatCleared} / {location.threatRequired}</strong></span><span><small>NORMAL KILLS</small><strong>{location.normalKills.toLocaleString()}</strong></span><span><small>BOSS CLEARS</small><strong>{location.bossClears.toLocaleString()}</strong></span></div></section>}
      <section className="combat-location-section"><div className="combat-location-section-head"><span className="combat-location-section-label">ENCOUNTERS</span><small>DISCOVERY STATUS</small></div><div className="combat-location-encounter-grid">{location.encounters.map((encounter) => <EncounterTile key={encounter.id} encounter={encounter} />)}{location.boss && <EncounterTile encounter={location.boss} />}</div></section>
      {locked && <div className="combat-location-lock-note"><LockKeyhole size={14} aria-hidden="true" /><span>{location.unlockText ?? 'This location is not available yet.'}</span></div>}
      {prototype && <div className="combat-location-lock-note is-prototype"><Gem size={14} aria-hidden="true" /><span>This location is presentation-only until gameplay content is authored.</span></div>}
      <div className="combat-location-actions"><div className="combat-location-secondary-actions"><Button variant="secondary" onClick={onLoot}><Package size={14} aria-hidden="true" /> LOOT</Button><Button variant="secondary" disabled={prototype} tooltip={prototype ? <TooltipContent title="Bestiary unavailable" description="Prototype content has not been authored." /> : undefined} onClick={onBestiary}><BookOpen size={14} aria-hidden="true" /> BESTIARY</Button></div><Button variant={isActive ? 'primary' : 'success'} disabled={locked || prototype} tooltip={entryTooltip} onClick={onEnter}><Swords size={14} aria-hidden="true" /> {entryLabel}</Button></div>
    </div>
  </aside>
}

function EncounterTile({ encounter }: { encounter: CombatEncounterViewModel }) {
  const monster = encounter.monsterId ? MONSTERS[encounter.monsterId] : null
  const isBoss = encounter.role === 'boss'
  const knownMonster = encounter.known && monster ? monster : null
  const tooltip = knownMonster ? <EncounterMonsterTooltip monster={knownMonster} /> : <TooltipContent title={isBoss ? 'UNKNOWN BOSS' : 'UNKNOWN CREATURE'} description="Encounter this creature in combat to reveal its Bestiary information." />
  return <GameTooltip block accent={knownMonster ? isBoss ? 'warning' : 'mana' : 'neutral'} content={tooltip}><div className={`combat-location-encounter-tile${isBoss ? ' is-boss' : ''}${encounter.known ? ' is-known' : ' is-unknown'}`}>{knownMonster ? <MonsterPortrait monster={knownMonster} boss={isBoss} /> : <span className="combat-location-unknown-glyph">?</span>}<strong>{encounter.name}</strong><small>{encounter.known ? isBoss ? 'BOSS DISCOVERED' : 'DISCOVERED' : isBoss ? 'UNKNOWN BOSS' : 'UNSEEN'}</small></div></GameTooltip>
}

function EncounterMonsterTooltip({ monster }: { monster: MonsterDefinition }) {
  const stats = getMonsterDossierCombatStats(monster)
  return <TooltipContent title={monster.name} description={monster.subtitle}><div className="tooltip-section"><small>COMBAT STATS</small><span className="tooltip-row"><span>HP</span><b>{formatNumber(stats.maxHealth)}</b></span><span className="tooltip-row"><span>BASIC DAMAGE</span><b>{formatNumber(stats.basicAttackDamage)}</b></span><span className="tooltip-row"><span>ATTACK TIME</span><b>{formatTime(stats.basicAttackIntervalMs)}</b></span><span className="tooltip-row"><span>DEFENSE</span><b>{formatNumber(stats.defense)}</b></span></div></TooltipContent>
}


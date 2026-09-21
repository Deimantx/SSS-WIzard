import { BookOpen, Gem, LockKeyhole, Package, Swords } from 'lucide-react'
import { Button, GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { MONSTERS, type MonsterDefinition } from '../../../game/content/monsters'
import { getNonZeroResonanceEntries } from '../../../game/presentation/resonance/resonancePresentation'
import type { CombatEncounterViewModel, CombatLocationViewModel, CombatTargetViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { getMonsterDossierCombatStats } from '../../../game/presentation/combat'
import { formatNumber, formatTime } from '../../../game/utils'
import type { MonsterId } from '../../../game/types'
import { MonsterPortrait } from '../MonsterPortrait'

export function CombatLocationInspector({ location, activeLocationId, combatActive, selectedTargetEnemyId, onSelectTarget, onLoot, onBestiary, onEnter }: { location: CombatLocationViewModel | null; activeLocationId: string | null; combatActive: boolean; selectedTargetEnemyId: MonsterId | null; onSelectTarget: (enemyId: MonsterId) => void; onLoot: () => void; onBestiary: () => void; onEnter: () => void }) {
  if (!location) return <aside className="combat-location-inspector" aria-label="Location details"><div className="combat-location-inspector-empty"><span aria-hidden="true">◇</span><strong>SELECT A LOCATION</strong><p>Choose a location to inspect its interaction and entry action.</p></div></aside>

  const isActive = Boolean(combatActive && activeLocationId === location.id)
  const locked = location.state === 'locked'
  const prototype = location.state === 'prototype'
  const selectedTarget = location.targeting?.targets.find((target) => target.monsterId === selectedTargetEnemyId) ?? null
  const activeTarget = location.targeting?.activeTargetEnemyId ?? null
  const primaryLabel = prototype
    ? 'CONTENT NOT AUTHORED'
    : locked
      ? 'LOCATION LOCKED'
      : location.targeting
        ? 'HUNT TARGET'
        : isActive ? 'RETURN TO COMBAT' : location.type === 'dungeon' ? 'ENTER DUNGEON' : 'ENTER LOCATION'
  const primaryDisabled = locked || prototype || Boolean(location.targeting && !selectedTarget)
  const primaryTooltip = prototype
    ? <TooltipContent title="Content not authored" description="This location is reserved for a future content type." />
    : locked
      ? <TooltipContent title="Location locked" description={location.unlockText ?? 'This location is not available yet.'} />
      : location.targeting && !selectedTarget
        ? <TooltipContent title="Select a target first" description="Choose a normal encounter before hunting it." />
        : undefined
  const tone = location.state === 'locked' ? 'locked' : location.state === 'completed' ? 'success' : location.state === 'boss-ready' ? 'warning' : 'active'

  return <aside className={`combat-location-inspector is-${location.state}`} aria-label="Location details">
    <div className="combat-location-inspector-scroll">
      <div className="combat-location-inspector-hero"><div className="combat-location-inspector-glyph" aria-hidden="true"><span>{location.type === 'dungeon' ? '◈' : location.type === 'combat-zone' ? '✧' : '◇'}</span><i /></div><div className="combat-location-inspector-heading"><span className="combat-subsection-label">LOCATION DETAILS</span><h3>{location.name}</h3><div className="combat-location-inspector-badges"><Status tone={tone}>{location.statusLabel}</Status><span className="combat-location-type-badge">{location.typeLabel}</span></div></div></div>
      <p className="combat-location-description">{location.description}</p>
      {location.targeting ? <CombatZoneBody targeting={location.targeting} selectedTargetEnemyId={selectedTargetEnemyId} activeTargetEnemyId={activeTarget} onSelectTarget={onSelectTarget} boss={location.boss} /> : <DungeonBody encounters={location.encounters} boss={location.boss} />}
      {locked && <div className="combat-location-lock-note"><LockKeyhole size={14} aria-hidden="true" /><span>{location.unlockText ?? 'This location is not available yet.'}</span></div>}
      {prototype && <div className="combat-location-lock-note is-prototype"><Gem size={14} aria-hidden="true" /><span>This location is presentation-only until gameplay content is authored.</span></div>}
      <div className="combat-location-actions"><div className="combat-location-secondary-actions"><Button variant="secondary" onClick={onLoot}><Package size={14} aria-hidden="true" /> LOOT</Button><Button variant="secondary" disabled={prototype} tooltip={prototype ? <TooltipContent title="Bestiary unavailable" description="Prototype content has not been authored." /> : undefined} onClick={onBestiary}><BookOpen size={14} aria-hidden="true" /> BESTIARY</Button></div><Button variant={primaryDisabled ? 'secondary' : isActive ? 'primary' : 'success'} disabled={primaryDisabled} tooltip={primaryTooltip} onClick={onEnter}><Swords size={14} aria-hidden="true" /> {primaryLabel}</Button></div>
    </div>
  </aside>
}

function CombatZoneBody({ targeting, selectedTargetEnemyId, activeTargetEnemyId, onSelectTarget, boss }: { targeting: NonNullable<CombatLocationViewModel['targeting']>; selectedTargetEnemyId: MonsterId | null; activeTargetEnemyId: MonsterId | null; onSelectTarget: (enemyId: MonsterId) => void; boss: CombatEncounterViewModel | null }) {
  return <>
    <section className="combat-location-section"><div className="combat-location-section-head"><span className="combat-location-section-label">SELECT TARGET</span><small>RESONANCE / KILL</small></div><div className="combat-target-grid">{targeting.targets.map((target) => <TargetCard key={target.monsterId} target={target} selected={target.monsterId === selectedTargetEnemyId} hunting={target.monsterId === activeTargetEnemyId} onSelect={() => onSelectTarget(target.monsterId)} />)}</div></section>
    {boss && <section className="combat-location-section combat-location-zone-boss"><span className="combat-location-section-label">ZONE BOSS</span><EncounterTile encounter={boss} /></section>}
  </>
}

function DungeonBody({ encounters, boss }: { encounters: CombatEncounterViewModel[]; boss: CombatEncounterViewModel | null }) {
  return <section className="combat-location-section"><div className="combat-location-section-head"><span className="combat-location-section-label">ENCOUNTERS</span><small>DISCOVERY STATUS</small></div><div className="combat-location-encounter-grid">{encounters.map((encounter) => <EncounterTile key={encounter.id} encounter={encounter} />)}{boss && <EncounterTile encounter={boss} />}</div></section>
}

function TargetCard({ target, selected, hunting, onSelect }: { target: CombatTargetViewModel; selected: boolean; hunting: boolean; onSelect: () => void }) {
  const monster = MONSTERS[target.monsterId]
  const tooltip = target.known && monster ? <EncounterMonsterTooltip monster={monster} /> : <TooltipContent title={target.name} description="Discover this creature in combat to reveal its full Bestiary dossier." />
  const reward = getNonZeroResonanceEntries(target.resonanceYield)
  const marker = hunting ? 'HUNTING' : selected ? 'SELECTED' : null
  return <GameTooltip block accent={hunting ? 'warning' : selected ? 'elemental' : 'mana'} content={tooltip}><button type="button" className={`combat-target-card${selected ? ' is-selected' : ''}${hunting ? ' is-hunting' : ''}`} aria-pressed={selected} onClick={onSelect}><span className="combat-target-card-portrait">{target.known && monster ? <MonsterPortrait monster={monster} /> : <span aria-hidden="true">?</span>}</span><span className="combat-target-card-copy"><strong>{target.name}</strong><small>{target.difficulty.toUpperCase()}</small><span>{reward.map((entry) => `+${entry.amount} ${entry.label}`).join(' · ')}</span></span>{marker && <b className="combat-target-card-marker">{marker}</b>}</button></GameTooltip>
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

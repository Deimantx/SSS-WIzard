import { BookOpen, Crown, Gem, LockKeyhole, Package, Shield, Swords } from 'lucide-react'
import { Button, GameTooltip, Progress, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { MONSTERS, type MonsterDefinition } from '../../../game/content/monsters'
import { COMBAT_LOCATION_TYPE_METADATA } from '../../../game/content/world-navigation'
import type { CombatBossHuntPresentation } from '../../../game/presentation/combat/combatBossHuntPresentation'
import type { CombatEncounterViewModel, CombatLocationViewModel, CombatTargetViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { getMonsterDossierCombatStats } from '../../../game/presentation/combat'
import { resolveWorldTierEnemyProfile } from '../../../game/systems/world-tier/worldTierRuntime'
import { formatNumber, formatTime } from '../../../game/utils'
import type { MonsterId } from '../../../game/types'
import { MonsterPortrait } from '../MonsterPortrait'
import { useGameStore } from '../../../store/gameStore'

export function CombatLocationInspector({ location, activeLocationId, combatActive, selectedTargetEnemyId, onSelectTarget, onLoot, onBestiary, onEnter }: { location: CombatLocationViewModel | null; activeLocationId: string | null; combatActive: boolean; selectedTargetEnemyId: MonsterId | null; onSelectTarget: (enemyId: MonsterId) => void; onLoot: () => void; onBestiary: () => void; onEnter: () => void }) {
  if (!location) return <aside className="combat-location-inspector" aria-label="Location details"><div className="combat-location-inspector-empty"><span aria-hidden="true">◇</span><strong>SELECT A LOCATION</strong><p>Choose a location to inspect its interaction and entry action.</p></div></aside>

  const isActive = Boolean(combatActive && activeLocationId === location.id)
  const toggleAutoHunt = useGameStore((state) => state.toggleAutoHunt)
  const locked = location.state === 'locked'
  const prototype = location.state === 'prototype'
  const selectedTarget = location.targeting?.targets.find((target) => target.monsterId === selectedTargetEnemyId) ?? null
  const activeTarget = location.targeting?.activeTargetEnemyId ?? null
  const LocationIcon = location.type === 'elite-zone' ? Shield : location.type === 'dungeon' ? Crown : Swords
  const primaryLabel = prototype
    ? 'CONTENT NOT AUTHORED'
      : locked
      ? 'LOCATION LOCKED'
      : location.targeting
        ? 'HUNT TARGET'
        : isActive ? 'RETURN TO COMBAT' : COMBAT_LOCATION_TYPE_METADATA[location.type].actionLabel
  const primaryDisabled = locked || prototype || Boolean(location.targeting && !selectedTarget)
  const primaryTooltip = prototype
    ? <TooltipContent title="Content not authored" description="This location is reserved for a future content type." />
    : locked
      ? <TooltipContent title="Location locked" description={location.unlockText ?? 'This location is not available yet.'} />
      : location.targeting && !selectedTarget
        ? <TooltipContent title="Select a target first" description="Choose a normal encounter before hunting it." />
        : undefined
  const lootDisabled = Boolean(location.targeting && !selectedTarget)
  const lootTooltip = lootDisabled ? <TooltipContent title="Select a target" description="Select a target to inspect its loot." /> : undefined
  const tone = location.state === 'locked' ? 'locked' : location.state === 'completed' ? 'success' : location.state === 'boss-ready' ? 'warning' : 'active'

  return <aside className={`combat-location-inspector is-${location.state}`} aria-label="Location details">
    <div className="combat-location-inspector-scroll">
      <div className="combat-location-inspector-hero"><div className="combat-location-inspector-glyph" aria-hidden="true"><LocationIcon size={20} /><i /></div><div className="combat-location-inspector-heading"><span className="combat-subsection-label">LOCATION DETAILS</span><h3>{location.name}</h3><div className="combat-location-inspector-badges"><Status tone={tone}>{location.statusLabel}</Status><span className="combat-location-type-badge">{location.typeLabel}</span></div></div></div>
      <p className="combat-location-description">{location.description}</p>
      {location.targeting ? <CombatZoneBody type={location.type} targeting={location.targeting} selectedTargetEnemyId={selectedTargetEnemyId} activeTargetEnemyId={activeTarget} onSelectTarget={onSelectTarget} boss={location.boss} zoneAffix={location.zoneAffix} bossHunt={location.bossHunt} autoHuntDisabled={locked || prototype} onToggleAutoHunt={() => { if (location.dungeonId) toggleAutoHunt(location.dungeonId) }} /> : location.sequence ? <SequenceDungeonBody sequence={location.sequence} firstClearUnlockPreview={location.firstClearUnlockPreview} firstClearCompleted={location.firstClearCompleted} /> : <DungeonBody encounters={location.encounters} boss={location.boss} />}
      {locked && <div className="combat-location-lock-note"><LockKeyhole size={14} aria-hidden="true" /><span>{location.unlockText ?? 'This location is not available yet.'}</span></div>}
      {prototype && <div className="combat-location-lock-note is-prototype"><Gem size={14} aria-hidden="true" /><span>This location is presentation-only until gameplay content is authored.</span></div>}
      <div className="combat-location-actions"><div className="combat-location-secondary-actions"><Button variant="secondary" disabled={lootDisabled} tooltip={lootTooltip} onClick={onLoot}><Package size={14} aria-hidden="true" /> LOOT</Button><Button variant="secondary" disabled={prototype} tooltip={prototype ? <TooltipContent title="Bestiary unavailable" description="Prototype content has not been authored." /> : undefined} onClick={onBestiary}><BookOpen size={14} aria-hidden="true" /> BESTIARY</Button></div><Button variant={primaryDisabled ? 'secondary' : isActive ? 'primary' : 'success'} disabled={primaryDisabled} tooltip={primaryTooltip} onClick={onEnter}><Swords size={14} aria-hidden="true" /> {primaryLabel}</Button></div>
    </div>
  </aside>
}

function CombatZoneBody({ type, targeting, selectedTargetEnemyId, activeTargetEnemyId, onSelectTarget, boss, zoneAffix, bossHunt, autoHuntDisabled, onToggleAutoHunt }: { type: CombatLocationViewModel['type']; targeting: NonNullable<CombatLocationViewModel['targeting']>; selectedTargetEnemyId: MonsterId | null; activeTargetEnemyId: MonsterId | null; onSelectTarget: (enemyId: MonsterId) => void; boss: CombatEncounterViewModel | null; zoneAffix: CombatLocationViewModel['zoneAffix']; bossHunt: CombatBossHuntPresentation | null; autoHuntDisabled: boolean; onToggleAutoHunt: () => void }) {
  return <>
    {zoneAffix && <section className="combat-location-section combat-location-zone-affix"><div className="combat-location-section-head"><span className="combat-location-section-label">ZONE AFFIX</span><small>ALL NORMAL ENCOUNTERS</small></div><GameTooltip block accent="warning" content={<TooltipContent title={`Zone Affix · ${zoneAffix.name}`} description={zoneAffix.description} />}><div className="combat-location-zone-affix-card" tabIndex={0}><strong>{zoneAffix.name}</strong><span>{zoneAffix.description}</span></div></GameTooltip></section>}
    <section className="combat-location-section"><div className="combat-location-section-head"><span className="combat-location-section-label">SELECT TARGET</span><small>CHOOSE A MONSTER TO HUNT</small></div><div className="combat-target-grid">{targeting.targets.map((target) => <TargetCard key={target.monsterId} target={target} selected={target.monsterId === selectedTargetEnemyId} hunting={target.monsterId === activeTargetEnemyId} onSelect={() => onSelectTarget(target.monsterId)} />)}</div></section>
    {boss && <section className="combat-location-section combat-location-zone-boss"><div className="combat-location-section-head"><span className="combat-location-section-label">{type === 'elite-zone' ? 'ELITE BOSS' : 'ZONE BOSS'}</span>{bossHunt && <span className="combat-location-boss-state">{bossHunt.state === 'fighting' ? 'FIGHTING' : bossHunt.state === 'queued' ? 'QUEUED' : bossHunt.state === 'ready' ? 'READY' : 'BUILDING'}</span>}</div><EncounterTile encounter={boss} /><BossRequirement bossHunt={bossHunt} autoHuntDisabled={autoHuntDisabled} onToggleAutoHunt={onToggleAutoHunt} /></section>}
  </>
}

function DungeonBody({ encounters, boss }: { encounters: CombatEncounterViewModel[]; boss: CombatEncounterViewModel | null }) {
  return <section className="combat-location-section"><div className="combat-location-section-head"><span className="combat-location-section-label">ENCOUNTERS</span><small>DISCOVERY STATUS</small></div><div className="combat-location-encounter-grid">{encounters.map((encounter) => <EncounterTile key={encounter.id} encounter={encounter} />)}{boss && <EncounterTile encounter={boss} />}</div></section>
}

function SequenceDungeonBody({ sequence, firstClearUnlockPreview, firstClearCompleted }: { sequence: NonNullable<CombatLocationViewModel['sequence']>; firstClearUnlockPreview: CombatLocationViewModel['firstClearUnlockPreview']; firstClearCompleted: boolean }) {
  return <>
    <section className="combat-location-section combat-dungeon-sequence"><div className="combat-location-section-head"><span className="combat-location-section-label">DUNGEON RUN</span><small>{sequence.totalSteps} FIXED STEPS</small></div><div className="combat-dungeon-sequence-list">{sequence.steps.map((step) => <div className={`combat-dungeon-sequence-step is-${step.state}`} key={step.monsterId}><span className="combat-dungeon-sequence-order">{step.order}</span><div><strong>{step.name}</strong><small>{step.role === 'boss' ? 'BOSS' : step.known ? 'DISCOVERED' : 'UPCOMING'}</small></div><div className="combat-dungeon-sequence-meta">{step.powerRating !== null && <span>POWER {formatNumber(step.powerRating)}</span>}<Status tone={step.state === 'completed' ? 'success' : step.state === 'current' ? 'warning' : 'neutral'}>{step.state.toUpperCase()}</Status></div></div>)}</div></section>
    {firstClearUnlockPreview.length > 0 && <section className="combat-location-section combat-first-clear-preview"><div className="combat-location-section-head"><span className="combat-location-section-label">{firstClearCompleted ? 'UNLOCKED' : 'FIRST CLEAR UNLOCKS'}</span><small>{firstClearCompleted ? 'PROGRESSION SECURED' : 'COMPLETION PREVIEW'}</small></div><div className="combat-first-clear-list">{firstClearUnlockPreview.map((entry) => <div key={entry.id}><span aria-hidden="true">{firstClearCompleted ? '✓' : '◇'}</span><strong>{entry.label}</strong></div>)}</div></section>}
  </>
}

function TargetCard({ target, selected, hunting, onSelect }: { target: CombatTargetViewModel; selected: boolean; hunting: boolean; onSelect: () => void }) {
  const monster = MONSTERS[target.monsterId]
  const tooltip = target.known && monster ? <EncounterMonsterTooltip monster={monster} worldTier={target.worldTier} powerRating={target.powerRating} /> : <TooltipContent title={target.name} description="Discover this creature in combat to reveal its full Bestiary dossier." />
  const marker = hunting ? 'HUNTING' : selected ? 'SELECTED' : null
  return <GameTooltip block accent={hunting ? 'warning' : selected ? 'elemental' : 'mana'} content={tooltip}><button type="button" className={`combat-target-card${selected ? ' is-selected' : ''}${hunting ? ' is-hunting' : ''}`} aria-pressed={selected} onClick={onSelect}><span className="combat-target-card-portrait">{target.known && monster ? <MonsterPortrait monster={monster} /> : <span aria-hidden="true">?</span>}</span><span className="combat-target-card-copy"><strong>{target.name}</strong><small>{target.difficulty.toUpperCase()} · POWER {formatNumber(target.powerRating)}</small></span>{marker && <b className="combat-target-card-marker">{marker}</b>}</button></GameTooltip>
}

function EncounterTile({ encounter }: { encounter: CombatEncounterViewModel }) {
  const monster = encounter.monsterId ? MONSTERS[encounter.monsterId] : null
  const isBoss = encounter.role === 'boss'
  const knownMonster = encounter.known && monster ? monster : null
  const tooltip = knownMonster ? <EncounterMonsterTooltip monster={knownMonster} /> : <TooltipContent title={isBoss ? 'UNKNOWN BOSS' : 'UNKNOWN CREATURE'} description="Encounter this creature in combat to reveal its Bestiary information." />
  return <GameTooltip block accent={knownMonster ? isBoss ? 'warning' : 'mana' : 'neutral'} content={tooltip}><div className={`combat-location-encounter-tile${isBoss ? ' is-boss' : ''}${encounter.known ? ' is-known' : ' is-unknown'}`}>{knownMonster ? <MonsterPortrait monster={knownMonster} boss={isBoss} /> : <span className="combat-location-unknown-glyph">?</span>}<strong>{encounter.name}</strong><small>{encounter.known ? isBoss ? 'BOSS DISCOVERED' : 'DISCOVERED' : isBoss ? 'UNKNOWN BOSS' : 'UNSEEN'}</small>{encounter.powerRating !== null && <small className="combat-location-encounter-power">POWER {formatNumber(encounter.powerRating)}</small>}</div></GameTooltip>
}

function EncounterMonsterTooltip({ monster, worldTier, powerRating }: { monster: MonsterDefinition; worldTier?: import('../../../game/types').WorldTierId; powerRating?: number }) {
  const stats = getMonsterDossierCombatStats(monster)
  const profile = worldTier ? resolveWorldTierEnemyProfile(monster.id, worldTier) : null
  return <TooltipContent title={monster.name} description={monster.subtitle}><div className="tooltip-section"><small>{worldTier ? `COMBAT STATS · WT${worldTier}` : 'COMBAT STATS'}</small>{powerRating !== undefined && <><span className="tooltip-row"><span>POWER</span><b>{formatNumber(powerRating)}</b></span><span className="tooltip-row"><span>THREAT / KILL</span><b>{formatNumber(powerRating)}</b></span></>}<span className="tooltip-row"><span>HP</span><b>{formatNumber(profile?.maxHealth ?? stats.maxHealth)}</b></span><span className="tooltip-row"><span>BASIC DAMAGE</span><b>{formatNumber(profile?.basicAttackDamage ?? stats.basicAttackDamage)}</b></span><span className="tooltip-row"><span>ATTACK TIME</span><b>{formatTime(stats.basicAttackIntervalMs)}</b></span><span className="tooltip-row"><span>DEFENSE</span><b>{formatNumber(profile?.defense ?? stats.defense)}</b></span></div></TooltipContent>
}

function BossRequirement({ bossHunt, autoHuntDisabled, onToggleAutoHunt }: { bossHunt: CombatBossHuntPresentation | null; autoHuntDisabled: boolean; onToggleAutoHunt: () => void }) {
  if (!bossHunt) return null
  const progress = bossHunt.active && bossHunt.state !== 'fighting' ? `THREAT ${formatNumber(bossHunt.threatCurrent)} / ${formatNumber(bossHunt.threatRequired)}` : !bossHunt.active ? `REQUIRES ${formatNumber(bossHunt.threatRequired)} THREAT` : 'BOSS FIGHT'
  const detail = !bossHunt.active ? null : bossHunt.state === 'building' ? `${formatNumber(bossHunt.remainingThreat)} THREAT TO BOSS` : bossHunt.state === 'ready' ? 'READY' : bossHunt.state === 'queued' ? 'AUTO HUNT QUEUED' : 'FIGHTING'
  const autoHuntDescription = !bossHunt.autoHuntUnlocked ? 'Auto Hunt unlocks after the first dungeon boss clear.' : autoHuntDisabled ? 'This Location is locked. Unlock it before enabling Auto Hunt.' : bossHunt.active && bossHunt.state === 'fighting' ? 'Auto Hunt is a persistent preference and does not affect the active Boss encounter.' : `When enabled, ${bossHunt.bossName} is queued after ${formatNumber(bossHunt.threatRequired)} Threat.`
  const autoHuntState = autoHuntDisabled ? 'LOCKED' : bossHunt.autoHuntEnabled ? 'ON' : 'OFF'
  return <div className={`combat-location-boss-requirement is-${bossHunt.state}`}><div className="combat-location-boss-requirement-copy"><strong>{progress}</strong>{detail && <span>{detail}</span>}</div>{bossHunt.active && bossHunt.state !== 'fighting' && <Progress value={bossHunt.progressPercent} tone="warning" />}<GameTooltip content={<TooltipContent title="Auto Hunt" description={autoHuntDescription} />}><button type="button" aria-label={`AUTO HUNT ${autoHuntState}`} className={`combat-toggle combat-location-auto-hunt${bossHunt.autoHuntEnabled ? ' is-on' : ''}`} disabled={autoHuntDisabled} onClick={onToggleAutoHunt}><span>AUTO HUNT</span><strong>{autoHuntState}</strong></button></GameTooltip></div>
}

import { BookOpen, Droplets, Flame, Gem, LockKeyhole, Mountain, Package, Sparkles, Swords, Wind } from 'lucide-react'
import { Button, GameTooltip, Progress, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { MONSTERS, type MonsterDefinition } from '../../../game/content/monsters'
import { getMonsterPrimaryAffinity, getMonsterDamageProfile } from '../../../game/content/monsters/monsterTypes'
import { getElementCounter, getElementResistance, type ElementId } from '../../../game/content/elements/elements'
import { COMBAT_LOCATION_TYPE_METADATA } from '../../../game/content/combat-locations'
import type { CombatBossHuntPresentation } from '../../../game/presentation/combat/combatBossHuntPresentation'
import type { CombatEncounterViewModel, CombatLocationViewModel, CombatTargetViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { getMonsterDossierCombatStats } from '../../../game/presentation/combat'
import { formatNumber, formatTime } from '../../../game/utils'
import type { MonsterId } from '../../../game/types'
import { MonsterPortrait } from '../MonsterPortrait'
import { useGameStore } from '../../../store/gameStore'
import { CombatLocationIcon } from './CombatLocationIcon'
import { CombatLocationSigilDrops } from './CombatLocationSigilDrops'
import { getHunterAuthorization, getHunterRankProgress } from '../../../game/systems/hunters-order/huntersOrderRuntime'
import { HUNTER_RANKS } from '../../../game/content/hunters-order/hunterRanks'
import { getHunterContractCombatPresentation, type HunterContractMonsterRelation } from '../../../game/presentation/huntersOrder/hunterContractCombatPresentation'

export function CombatLocationInspector({ location, activeLocationId, combatActive, selectedTargetEnemyId, onSelectTarget, onLoot, onBestiary, onEnter }: { location: CombatLocationViewModel | null; activeLocationId: string | null; combatActive: boolean; selectedTargetEnemyId: MonsterId | null; onSelectTarget: (enemyId: MonsterId) => void; onLoot: () => void; onBestiary: () => void; onEnter: () => void }) {
  if (!location) return <aside className="combat-location-inspector" aria-label="Location details"><div className="combat-location-inspector-empty"><span aria-hidden="true">◇</span><strong>SELECT A LOCATION</strong><p>Choose a location to inspect its interaction and entry action.</p></div></aside>

  const isActive = Boolean(combatActive && activeLocationId === location.id)
  const toggleAutoHunt = useGameStore((state) => state.toggleAutoHunt)
  const engageBoss = useGameStore((state) => state.engageBoss)
  const progress = useGameStore((state) => state.progress)
  const locked = location.state === 'locked'
  const prototype = location.state === 'prototype'
  const selectedTarget = location.targeting?.targets.find((target) => target.monsterId === selectedTargetEnemyId) ?? null
  const selectedAuthorization = selectedTarget && location.locationId ? getHunterAuthorization({ progress }, selectedTarget.monsterId, location.locationId) : { authorized: true as const }
  const bossAuthorization = location.boss?.monsterId && location.locationId ? getHunterAuthorization({ progress }, location.boss.monsterId, location.locationId) : { authorized: true as const }
  const selectedAuthorizationMessage = selectedAuthorization.authorized ? null : hunterAuthorizationMessage(selectedAuthorization.reason, false)
  const activeTarget = location.targeting?.activeTargetEnemyId ?? null
  const primaryLabel = prototype
    ? 'CONTENT NOT AUTHORED'
      : locked
      ? 'LOCATION LOCKED'
      : location.targeting
        ? 'HUNT TARGET'
        : isActive ? 'RETURN TO COMBAT' : COMBAT_LOCATION_TYPE_METADATA[location.type].actionLabel
  const primaryDisabled = locked || prototype || Boolean(location.targeting && (!selectedTarget || (location.type === 'hunting-ground' && !selectedAuthorization.authorized)))
  const primaryTooltip = prototype
    ? <TooltipContent title="Content not authored" description="This location is reserved for a future content type." />
    : locked
      ? <TooltipContent title="Location locked" description={location.unlockText ?? 'This location is not available yet.'} />
      : location.targeting && !selectedTarget
        ? <TooltipContent title="Select a target first" description="Choose a normal encounter before hunting it." />
        : location.type === 'hunting-ground' && !selectedAuthorization.authorized
          ? <TooltipContent title={selectedAuthorizationMessage ?? 'Hunt unavailable'} description={selectedAuthorizationMessage ?? 'This target is not authorized by your current Hunt Contract.'} />
        : undefined
  const lootDisabled = Boolean(location.targeting && !selectedTarget)
  const lootTooltip = lootDisabled ? <TooltipContent title="Select a target" description="Select a target to inspect its loot." /> : undefined
  const tone = location.state === 'locked' ? 'locked' : location.state === 'completed' ? 'success' : location.state === 'boss-ready' ? 'warning' : 'active'

  return <aside className={`combat-location-inspector is-${location.state}`} aria-label="Location details">
    <div className="combat-location-inspector-scroll">
      <div className="combat-location-inspector-hero"><div className="combat-location-inspector-glyph" aria-hidden="true"><CombatLocationIcon type={location.type} size={20} /><i /></div><div className="combat-location-inspector-heading"><span className="combat-subsection-label">LOCATION DETAILS</span><h3>{location.name}</h3><div className="combat-location-inspector-badges"><Status tone={tone}>{location.statusLabel}</Status><span className="combat-location-type-badge">{location.typeLabel}</span></div></div></div>
      <p className="combat-location-description">{location.description}</p>
      {location.locationId && <CombatLocationSigilDrops locationId={location.locationId} />}
      {location.targeting ? <CombatZoneBody type={location.type} targeting={location.targeting} selectedTargetEnemyId={selectedTargetEnemyId} activeTargetEnemyId={activeTarget} onSelectTarget={onSelectTarget} boss={location.boss} bossAuthorization={bossAuthorization} zoneAffix={location.zoneAffix} bossHunt={location.bossHunt} autoHuntDisabled={locked || prototype || !location.bossHunt?.autoHuntUnlocked} onToggleAutoHunt={() => { if (location.locationId) toggleAutoHunt(location.locationId) }} onEngageBoss={() => { if (location.bossHunt) engageBoss(location.bossHunt.bossId) }} /> : location.sequence ? <SequenceDungeonBody sequence={location.sequence} firstClearUnlockPreview={location.firstClearUnlockPreview} firstClearCompleted={location.firstClearCompleted} /> : <DungeonBody encounters={location.encounters} boss={location.boss} />}
      {location.type === 'hunting-ground' && selectedTarget && selectedAuthorizationMessage && <div className="combat-location-lock-note"><LockKeyhole size={14} aria-hidden="true" /><span>{selectedAuthorizationMessage}</span></div>}
      {locked && <div className="combat-location-lock-note"><LockKeyhole size={14} aria-hidden="true" /><span>{location.unlockText ?? 'This location is not available yet.'}</span></div>}
      {prototype && <div className="combat-location-lock-note is-prototype"><Gem size={14} aria-hidden="true" /><span>This location is presentation-only until gameplay content is authored.</span></div>}
      <div className="combat-location-actions"><div className="combat-location-secondary-actions"><Button variant="secondary" disabled={lootDisabled} tooltip={lootTooltip} onClick={onLoot}><Package size={14} aria-hidden="true" /> LOOT</Button><Button variant="secondary" disabled={prototype || Boolean(location.targeting && !selectedTarget)} tooltip={prototype ? <TooltipContent title="Bestiary unavailable" description="Prototype content has not been authored." /> : location.targeting && !selectedTarget ? <TooltipContent title="Select a target first" description="Select a target to open its Bestiary entry." /> : undefined} onClick={onBestiary}><BookOpen size={14} aria-hidden="true" /> BESTIARY</Button></div><Button variant={primaryDisabled ? 'secondary' : isActive ? 'primary' : 'success'} disabled={primaryDisabled} tooltip={primaryTooltip} onClick={onEnter}><Swords size={14} aria-hidden="true" /> {primaryLabel}</Button></div>
    </div>
  </aside>
}

function hunterAuthorizationMessage(reason: 'order-locked' | 'contract-required' | 'contract-target-mismatch' | 'contract-tier-locked' | 'target-not-authorized', _boss: boolean) {
  if (reason === 'contract-required') return 'HUNT CONTRACT REQUIRED'
  if (reason === 'contract-target-mismatch') return 'ACTIVE CONTRACT DOES NOT MATCH THIS TARGET'
  if (reason === 'contract-tier-locked') return `${HUNTER_RANKS[HUNTER_RANKS.length - 1].name.toUpperCase()} RANK REQUIRED FOR THIS QUARRY`
  if (reason === 'order-locked') return 'HUNTER’S ORDER UNLOCKS AFTER THE CORRUPTED GREATBEAR'
  return 'THIS QUARRY IS NOT AUTHORIZED'
}

function CombatZoneBody({ type, targeting, selectedTargetEnemyId, activeTargetEnemyId, onSelectTarget, boss, bossAuthorization, zoneAffix, bossHunt, autoHuntDisabled, onToggleAutoHunt, onEngageBoss }: { type: CombatLocationViewModel['type']; targeting: NonNullable<CombatLocationViewModel['targeting']>; selectedTargetEnemyId: MonsterId | null; activeTargetEnemyId: MonsterId | null; onSelectTarget: (enemyId: MonsterId) => void; boss: CombatEncounterViewModel | null; bossAuthorization: ReturnType<typeof getHunterAuthorization>; zoneAffix: CombatLocationViewModel['zoneAffix']; bossHunt: CombatBossHuntPresentation | null; autoHuntDisabled: boolean; onToggleAutoHunt: () => void; onEngageBoss: () => void }) {
  const progress = useGameStore((state) => state.progress)
  const combat = useGameStore((state) => state.combat)
  const navigationUi = useGameStore((state) => state.ui)
  const setScreen = useGameStore((state) => state.setScreen)
  const hunterContract = type === 'hunting-ground' ? getHunterContractCombatPresentation({ progress, combat, ui: navigationUi }) : null
  return <>
    {zoneAffix && <section className="combat-location-section combat-location-zone-affix"><div className="combat-location-section-head"><span className="combat-location-section-label">ZONE AFFIX</span><small>ALL NORMAL ENCOUNTERS</small></div><GameTooltip block accent="warning" content={<TooltipContent title={`Zone Affix · ${zoneAffix.name}`} description={zoneAffix.description} />}><div className="combat-location-zone-affix-card" tabIndex={0}><strong>{zoneAffix.name}</strong><span>{zoneAffix.description}</span></div></GameTooltip></section>}
    {hunterContract && <HunterContractCombatStrip presentation={hunterContract} onOpenContracts={() => setScreen('hunters-order')} />}
    <section className="combat-location-section"><div className="combat-location-section-head"><span className="combat-location-section-label">SELECT TARGET</span><small>{hunterContract?.active ? !hunterContract.groundAuthorized ? `CONTRACT SCOPED TO ${hunterContract.huntingGroundName?.toUpperCase()}` : hunterContract.contract?.targetSpec.type === 'monster' ? `ACTIVE CONTRACT · ${hunterContract.remaining} KILLS REMAINING` : `${hunterContract.matchingMonsterIds.length} TARGETS COUNT FOR ACTIVE CONTRACT` : 'CHOOSE A MONSTER TO HUNT'}</small></div><div className="combat-target-grid">{targeting.targets.map((target) => <TargetCard key={target.monsterId} target={target} selected={target.monsterId === selectedTargetEnemyId} hunting={target.monsterId === activeTargetEnemyId} contractRelation={hunterContract?.relationFor(target.monsterId, combat.locationId ?? 'hunters-ground')} onSelect={() => onSelectTarget(target.monsterId)} />)}</div></section>
    {boss && <section className="combat-location-section combat-location-zone-boss"><div className="combat-location-section-head"><span className="combat-location-section-label">{bossHunt?.bossLabel ?? (type === 'elite-zone' ? 'ELITE BOSS' : 'ZONE BOSS')}</span>{bossHunt && <span className="combat-location-boss-state">{bossHunt.state === 'fighting' ? 'FIGHTING' : bossHunt.state === 'queued' ? 'QUEUED' : bossHunt.state === 'ready' ? 'READY' : 'BUILDING'}</span>}</div><EncounterTile encounter={boss} /><BossRequirement bossHunt={bossHunt} bossAuthorization={bossAuthorization} autoHuntDisabled={autoHuntDisabled} onToggleAutoHunt={onToggleAutoHunt} onEngageBoss={onEngageBoss} /></section>}
  </>
}

function HunterContractCombatStrip({ presentation, onOpenContracts }: { presentation: ReturnType<typeof getHunterContractCombatPresentation>; onOpenContracts: () => void }) {
  if (!presentation.active) return <section className="combat-location-section combat-hunter-contract is-empty"><div><span className="combat-location-section-label">NO ACTIVE HUNT CONTRACT</span><p>Hunter quarry requires authorization from the Hunter’s Order.</p></div><Button variant="secondary" onClick={onOpenContracts}>OPEN HUNTER’S ORDER</Button></section>
  const percent = presentation.target > 0 ? presentation.progress / presentation.target * 100 : 0
  if (!presentation.groundAuthorized) return <section className="combat-location-section combat-hunter-contract is-locked"><div className="combat-location-section-head"><span className="combat-location-section-label">ACTIVE CONTRACT · {presentation.huntingGroundName?.toUpperCase()}</span></div><strong className="combat-hunter-contract-title">This contract does not authorize the current Hunting Ground.</strong><Button variant="secondary" onClick={onOpenContracts}>VIEW CONTRACT</Button></section>
  return <section className="combat-location-section combat-hunter-contract"><div className="combat-location-section-head"><span className="combat-location-section-label">ACTIVE HUNTER CONTRACT · {presentation.huntingGroundName?.toUpperCase()}</span><small>{presentation.archetypeLabel}</small></div><strong className="combat-hunter-contract-title">{presentation.label}</strong><div className="combat-hunter-contract-progress"><span>{presentation.progress.toLocaleString()} / {presentation.target.toLocaleString()} defeated</span><strong>{presentation.remaining.toLocaleString()} remaining</strong></div><Progress value={percent} tone="mana" /><div className="combat-hunter-contract-reward">{presentation.contract?.targetSpec.type === 'ground' ? `All authorized ${presentation.huntingGroundName} quarry count` : `${presentation.matchingMonsterIds.length} quarry ${presentation.matchingMonsterIds.length === 1 ? 'type counts' : 'types count'}`}<strong>+{presentation.rewardReputation.toLocaleString()} Reputation · +{presentation.rewardMarks} Marks</strong></div></section>
}

function DungeonBody({ encounters, boss }: { encounters: CombatEncounterViewModel[]; boss: CombatEncounterViewModel | null }) {
  return <section className="combat-location-section"><div className="combat-location-section-head"><span className="combat-location-section-label">ENCOUNTERS</span><small>AUTHORED COMBAT ROSTER</small></div><div className="combat-location-encounter-grid">{encounters.map((encounter) => <EncounterTile key={encounter.id} encounter={encounter} />)}{boss && <EncounterTile encounter={boss} />}</div></section>
}

function SequenceDungeonBody({ sequence, firstClearUnlockPreview, firstClearCompleted }: { sequence: NonNullable<CombatLocationViewModel['sequence']>; firstClearUnlockPreview: CombatLocationViewModel['firstClearUnlockPreview']; firstClearCompleted: boolean }) {
  return <>
    <section className="combat-location-section combat-dungeon-sequence"><div className="combat-location-section-head"><span className="combat-location-section-label">DUNGEON RUN</span><small>{sequence.totalSteps} FIXED STEPS</small></div><div className="combat-dungeon-sequence-list">{sequence.steps.map((step) => <div className={`combat-dungeon-sequence-step is-${step.state}`} key={step.monsterId}><span className="combat-dungeon-sequence-order">{step.order}</span><div><strong>{step.name}</strong><small>{step.role === 'boss' ? 'BOSS' : 'NORMAL'}</small></div><div className="combat-dungeon-sequence-meta">{step.powerRating !== null && <span>POWER {formatNumber(step.powerRating)}</span>}<Status tone={step.state === 'completed' ? 'success' : step.state === 'current' ? 'warning' : 'neutral'}>{step.state.toUpperCase()}</Status></div></div>)}</div></section>
    {firstClearUnlockPreview.length > 0 && <section className="combat-location-section combat-first-clear-preview"><div className="combat-location-section-head"><span className="combat-location-section-label">{firstClearCompleted ? 'UNLOCKED' : 'FIRST CLEAR UNLOCKS'}</span><small>{firstClearCompleted ? 'PROGRESSION SECURED' : 'COMPLETION PREVIEW'}</small></div><div className="combat-first-clear-list">{firstClearUnlockPreview.map((entry) => <div key={entry.id}><span aria-hidden="true">{firstClearCompleted ? '✓' : '◇'}</span><strong>{entry.label}</strong></div>)}</div></section>}
  </>
}

function TargetCard({ target, selected, hunting, contractRelation, onSelect }: { target: CombatTargetViewModel; selected: boolean; hunting: boolean; contractRelation?: HunterContractMonsterRelation; onSelect: () => void }) {
  const monster = MONSTERS[target.monsterId]
  const tooltip = monster ? <EncounterMonsterTooltip monster={monster} powerRating={target.powerRating} difficulty={target.difficulty} detailed={target.known} /> : <TooltipContent title={target.name} description="This authored combat target is available in the unlocked location." />
  const marker = hunting ? 'HUNTING' : selected ? 'SELECTED' : null
  const relationLabel = contractRelation === 'exact-target' ? 'CONTRACT TARGET' : contractRelation === 'eligible' ? 'COUNTS FOR CONTRACT' : contractRelation === 'matching-but-locked' ? 'LOCKED QUARRY' : contractRelation === 'not-eligible' || contractRelation === 'no-contract' ? 'NOT AUTHORIZED' : null
  return <GameTooltip block accent={hunting ? 'warning' : selected ? 'elemental' : 'mana'} content={tooltip}><button type="button" className={`combat-target-card${selected ? ' is-selected' : ''}${hunting ? ' is-hunting' : ''}${relationLabel && contractRelation !== 'not-eligible' ? ' is-contract-target' : ''}`} aria-pressed={selected} onClick={onSelect}><span className="combat-target-card-portrait">{monster ? <MonsterPortrait monster={monster} /> : <span aria-hidden="true">?</span>}</span><span className="combat-target-card-copy"><strong>{target.name}</strong><small>{target.difficulty.toUpperCase()} · POWER {formatNumber(target.powerRating)}</small>{monster && <AffinityBadge monster={monster} />}</span><span className="combat-target-card-state">{marker && <b className="combat-target-card-marker">{marker}</b>}{relationLabel && <small className={`combat-contract-relation is-${contractRelation}`}>{relationLabel}</small>}</span></button></GameTooltip>
}

function EncounterTile({ encounter }: { encounter: CombatEncounterViewModel }) {
  const monster = encounter.monsterId ? MONSTERS[encounter.monsterId] : null
  const isBoss = encounter.role === 'boss'
  const tooltip = monster ? <EncounterMonsterTooltip monster={monster} powerRating={encounter.powerRating ?? undefined} detailed={encounter.known} /> : <TooltipContent title={encounter.name} description="This authored combat encounter is available in the unlocked location." />
  return <GameTooltip block accent={isBoss ? 'warning' : 'mana'} content={tooltip}><div className={`combat-location-encounter-tile${isBoss ? ' is-boss' : ''}`}>{monster ? <MonsterPortrait monster={monster} boss={isBoss} /> : <span aria-hidden="true">?</span>}<strong>{encounter.name}</strong><small>{isBoss ? 'BOSS' : 'NORMAL'}</small>{encounter.powerRating !== null && <small className="combat-location-encounter-power">POWER {formatNumber(encounter.powerRating)}</small>}{monster && <AffinityBadge monster={monster} />}</div></GameTooltip>
}

function EncounterMonsterTooltip({ monster, powerRating, difficulty, detailed = true }: { monster: MonsterDefinition; powerRating?: number; difficulty?: string; detailed?: boolean }) {
  const stats = getMonsterDossierCombatStats(monster)
  const affinity = getMonsterPrimaryAffinity(monster)
  const damageProfile = getMonsterDamageProfile(monster).map((element) => element.toUpperCase()).join(' · ')
  const weakTo = getElementCounter(affinity)
  const resists = getElementResistance(affinity)
  return <TooltipContent title={monster.name} description={monster.subtitle}><div className="tooltip-section"><small>{detailed ? 'CANONICAL COMBAT STATS' : 'TARGET PROFILE'}</small><span className="tooltip-row"><span>PRIMARY AFFINITY</span><b>{affinity.toUpperCase()}</b></span><span className="tooltip-row"><span>WEAK TO</span><b>{weakTo?.toUpperCase() ?? 'NONE'}</b></span><span className="tooltip-row"><span>RESISTS</span><b>{resists?.toUpperCase() ?? 'NONE'}</b></span><span className="tooltip-row"><span>DAMAGE PROFILE</span><b>{damageProfile}</b></span>{difficulty && <span className="tooltip-row"><span>DIFFICULTY</span><b>{difficulty.toUpperCase()}</b></span>}{powerRating !== undefined && <><span className="tooltip-row"><span>POWER</span><b>{formatNumber(powerRating)}</b></span>{detailed && <><span className="tooltip-row"><span>THREAT / KILL</span><b>{formatNumber(powerRating)}</b></span><small>Baseline stats only; mechanics, Traits, resistances, and Zone Affixes can make an encounter more dangerous.</small></>}</>}{detailed && <><span className="tooltip-row"><span>HP</span><b>{formatNumber(stats.maxHealth)}</b></span><span className="tooltip-row"><span>BASIC DAMAGE</span><b>{formatNumber(stats.basicAttackDamage)}</b></span><span className="tooltip-row"><span>ATTACK TIME</span><b>{formatTime(stats.basicAttackIntervalMs)}</b></span><span className="tooltip-row"><span>DEFENSE</span><b>{formatNumber(stats.defense)}</b></span></>}</div></TooltipContent>
}

const affinityIcons: Record<ElementId, typeof Flame> = { fire: Flame, water: Droplets, air: Wind, earth: Mountain, arcane: Sparkles }
function AffinityBadge({ monster }: { monster: MonsterDefinition }) {
  const affinity = getMonsterPrimaryAffinity(monster)
  const Icon = affinityIcons[affinity]
  const weakness = getElementCounter(affinity)
  const resistance = getElementResistance(affinity)
  return <span className="combat-element-affinity" style={{ color: `var(--semantic-damage-${affinity})` }} aria-label={`${affinity} affinity; weak to ${weakness ?? 'none'}; resists ${resistance ?? 'none'}`}><Icon size={12} aria-hidden="true" /><span>{affinity}</span></span>
}

function BossRequirement({ bossHunt, bossAuthorization, autoHuntDisabled, onToggleAutoHunt, onEngageBoss }: { bossHunt: CombatBossHuntPresentation | null; bossAuthorization: ReturnType<typeof getHunterAuthorization>; autoHuntDisabled: boolean; onToggleAutoHunt: () => void; onEngageBoss: () => void }) {
  if (!bossHunt) return null
  const progress = bossHunt.active && bossHunt.state !== 'fighting' ? `THREAT ${formatNumber(bossHunt.threatCurrent)} / ${formatNumber(bossHunt.threatRequired)}` : !bossHunt.active ? `REQUIRES ${formatNumber(bossHunt.threatRequired)} THREAT` : 'BOSS FIGHT'
  const detail = !bossHunt.active ? null : bossHunt.state === 'building' ? `${formatNumber(bossHunt.remainingThreat)} THREAT TO BOSS` : bossHunt.state === 'ready' ? 'READY' : bossHunt.state === 'queued' ? 'AUTO HUNT QUEUED' : 'FIGHTING'
  const autoHuntDescription = !bossHunt.autoHuntUnlocked ? 'Auto Hunt unlocks after the first Boss clear.' : autoHuntDisabled ? 'This Location is locked. Unlock it before enabling Auto Hunt.' : bossHunt.active && bossHunt.state === 'fighting' ? 'Auto Hunt is a persistent preference and does not affect the active Boss encounter.' : `When enabled, ${bossHunt.bossName} is queued after ${formatNumber(bossHunt.threatRequired)} Threat.`
  const autoHuntState = autoHuntDisabled ? 'LOCKED' : bossHunt.autoHuntEnabled ? 'ON' : 'OFF'
  const authorized = bossAuthorization.authorized
  const denial = authorized ? null : hunterAuthorizationMessage(bossAuthorization.reason, true)
  const engageTooltip = authorized ? <TooltipContent title="Engage Boss" description={`Start ${bossHunt.bossName} immediately. The current normal encounter will not grant rewards.`} /> : <TooltipContent title={denial ?? 'Boss encounter unavailable'} description={denial ?? 'Meet the required rank and contract requirements before engaging.'} />
  return <div className={`combat-location-boss-requirement is-${bossHunt.state}`}><div className="combat-location-boss-requirement-copy"><strong>{progress}</strong>{detail && <span>{detail}</span>}{denial && <span>{denial}</span>}</div>{bossHunt.active && bossHunt.state !== 'fighting' && <Progress value={bossHunt.progressPercent} tone="warning" />}{bossHunt.state === 'ready' && bossHunt.canEngage && authorized && <Button variant="success" className="combat-location-engage-boss" tooltip={engageTooltip} ariaLabel="ENGAGE BOSS" onClick={onEngageBoss}><Swords size={13} aria-hidden="true" /> ENGAGE BOSS</Button>}{bossHunt.state === 'ready' && !authorized && <GameTooltip content={engageTooltip}><span className="combat-location-boss-denied">BOSS ENCOUNTER LOCKED</span></GameTooltip>}<GameTooltip content={<TooltipContent title="Auto Hunt" description={autoHuntDescription} />}><button type="button" aria-label={`AUTO HUNT ${autoHuntState}`} className={`combat-toggle combat-location-auto-hunt${bossHunt.autoHuntEnabled ? ' is-on' : ''}`} disabled={autoHuntDisabled} onClick={onToggleAutoHunt}><span>AUTO HUNT</span><strong>{autoHuntState}</strong></button></GameTooltip></div>
}

import { BookOpen, Crown, Gem, LockKeyhole, Package, Swords } from 'lucide-react'
import { Button, GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { MonsterPortrait } from '../MonsterPortrait'
import { MONSTERS, type MonsterDefinition } from '../../../game/content/monsters'
import { getMonsterDossierCombatStats } from '../../../game/presentation/combat'
import { formatNumber, formatTime } from '../../../game/utils'
import type { CombatActNodeViewModel } from './combatActNavigationTypes'

const getAreaGlyph = (node: CombatActNodeViewModel) => node.state === 'prototype' ? '✦' : node.kind === 'final' ? '♛' : node.dungeonId === 'whispering-woods' ? '✧' : node.dungeonId === 'howling-den' ? '◖' : '◇'

export function CombatAreaInspector({ node, combatActive, activeDungeonId, onLoot, onBestiary, onEnter }: { node: CombatActNodeViewModel; combatActive: boolean; activeDungeonId: string | null; onLoot: () => void; onBestiary: () => void; onEnter: () => void }) {
  const isActive = Boolean(node.dungeonId && combatActive && activeDungeonId === node.dungeonId)
  const otherRunActive = combatActive && !isActive
  const locked = node.state === 'locked'
  const isPrototype = node.state === 'prototype'
  const displayTierLabel = node.tierLabel.split(' · ')[0] ?? node.tierLabel
  const enterLabel = isPrototype ? 'CONTENT NOT AUTHORED' : isActive ? 'RETURN TO COMBAT' : otherRunActive ? 'LEAVE CURRENT RUN FIRST' : locked ? 'ROUTE LOCKED' : 'ENTER COMBAT'
  const enterTooltip = isPrototype ? <TooltipContent title="Prototype area" description="This navigation node has no authored combat content yet." /> : locked ? <TooltipContent title="Route locked" description={node.unlockText ?? 'This route is not available yet.'} /> : otherRunActive ? <TooltipContent title="Current run active" description="Leave the current dungeon before entering another route." /> : undefined
  return <aside className={`combat-area-inspector${isPrototype ? ' is-prototype' : ''}`} aria-label="Area information"><div className="combat-area-inspector-scroll"><div className="combat-area-inspector-hero"><div className="combat-area-glyph" aria-hidden="true"><span>{getAreaGlyph(node)}</span><i /></div><div className="combat-area-inspector-heading"><span className="combat-subsection-label">AREA INFORMATION</span><h3>{node.name}</h3><div className="combat-area-inspector-badges"><Status tone={node.state === 'completed' ? 'success' : node.state === 'locked' ? 'locked' : node.state === 'boss-ready' ? 'warning' : node.state === 'prototype' ? 'active' : 'active'}>{node.statusLabel}</Status>{node.kind === 'final' && <span className="combat-area-final-badge"><Crown size={11} aria-hidden="true" /> FINAL</span>}</div></div></div><p className="combat-area-description">{node.description}</p><section className="combat-area-section"><span className="combat-area-section-label">TIER / PROGRESSION</span><div className="combat-area-tier"><strong>{displayTierLabel}</strong>{node.recommendedLevel ? <span>RECOMMENDED LEVEL {node.recommendedLevel}</span> : <span>{isPrototype ? 'FUTURE CONTENT' : 'COMBAT LEVEL FOLLOWS CURRENT DUNGEON RULES'}</span>}</div></section>{node.threatRequired !== null && <section className="combat-area-section combat-area-route-state"><span className="combat-area-section-label">ROUTE STATUS</span><div className="combat-area-route-metrics"><span><small>THREAT</small><strong>{node.threatCleared} / {node.threatRequired}</strong></span><span><small>NORMAL KILLS</small><strong>{node.normalKills.toLocaleString()}</strong></span><span><small>BOSS CLEARS</small><strong>{node.bossClears.toLocaleString()}</strong></span></div></section>}<section className="combat-area-section"><div className="combat-area-section-head"><span className="combat-area-section-label">ENCOUNTERS</span><small>{isPrototype ? 'BLUEPRINT ROSTER' : 'DISCOVERY STATUS'}</small></div><div className="combat-area-encounter-grid">{node.encounters.map((encounter) => <EncounterTile key={encounter.id} encounter={encounter} />)}{node.boss && <EncounterTile encounter={node.boss} />}</div></section>{isPrototype && <div className="combat-area-content-note"><Gem size={14} aria-hidden="true" /><span>Content not yet authored. This prototype is presentation-only and cannot start combat.</span></div>}{locked && <div className="combat-area-lock-note"><LockKeyhole size={14} aria-hidden="true" /><span>{node.unlockText ?? 'This route is not available yet.'}</span></div>}<div className="combat-area-actions"><div className="combat-area-secondary-actions"><Button variant="secondary" onClick={onLoot}><Package size={14} aria-hidden="true" /> LOOT</Button><Button variant="secondary" disabled={isPrototype} tooltip={isPrototype ? <TooltipContent title="Bestiary unavailable" description="Prototype area content has not been authored." /> : undefined} onClick={onBestiary}><BookOpen size={14} aria-hidden="true" /> BESTIARY</Button></div><Button variant={isActive ? 'primary' : 'success'} disabled={locked || isPrototype || otherRunActive} tooltip={enterTooltip} onClick={onEnter}><Swords size={14} aria-hidden="true" /> {enterLabel}</Button></div></div></aside>
}

function EncounterTile({ encounter }: { encounter: CombatActNodeViewModel['encounters'][number] | NonNullable<CombatActNodeViewModel['boss']> }) {
  const monster = encounter.monsterId ? MONSTERS[encounter.monsterId] : null
  const isBoss = encounter.role === 'boss'
  const knownMonster = encounter.known && monster ? monster : null
  const tooltip = knownMonster
    ? <EncounterMonsterTooltip monster={knownMonster} />
    : <TooltipContent title={isBoss ? 'UNKNOWN BOSS' : 'UNKNOWN CREATURE'} description="Encounter this creature in combat to reveal its Bestiary information." />
  return <GameTooltip block accent={knownMonster ? isBoss ? 'warning' : 'mana' : 'neutral'} content={tooltip}><div className={`combat-area-encounter-tile${isBoss ? ' is-boss' : ''}${encounter.known ? ' is-known' : ' is-unknown'}`}>{knownMonster ? <MonsterPortrait monster={knownMonster} boss={isBoss} /> : <span className="combat-area-unknown-glyph">?</span>}<strong>{encounter.name}</strong><small>{encounter.known ? isBoss ? 'BOSS DISCOVERED' : 'DISCOVERED' : isBoss ? 'UNKNOWN BOSS' : 'UNSEEN'}</small></div></GameTooltip>
}

function EncounterMonsterTooltip({ monster }: { monster: MonsterDefinition }) {
  const stats = getMonsterDossierCombatStats(monster)
  return <TooltipContent title={monster.name} description={monster.subtitle}>
    <div className="tooltip-section">
      <small>COMBAT STATS</small>
      <span className="tooltip-row"><span>HP</span><b>{formatNumber(stats.maxHealth)}</b></span>
      <span className="tooltip-row"><span>BASIC DAMAGE</span><b>{formatNumber(stats.basicAttackDamage)}</b></span>
      <span className="tooltip-row"><span>ATTACK TIME</span><b>{formatTime(stats.basicAttackIntervalMs)}</b></span>
      <span className="tooltip-row"><span>DEFENSE</span><b>{formatNumber(stats.defense)}</b></span>
    </div>
  </TooltipContent>
}

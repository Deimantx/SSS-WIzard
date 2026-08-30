import { Clock3, Crown, Shield, ShieldAlert, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { isBossMonster, MONSTERS } from '../../game/content/monsters'
import { getTraitDefinitions } from '../../game/content/traits'
import { buildCombatActionPresentation } from '../../game/presentation/combat'
import type { DungeonId, MonsterId } from '../../game/types'
import { formatNumber, formatTime } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { Card, GameTooltip, Status, Tabs } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../components/ui/item/ItemIcon'
import { MonsterPortrait } from './MonsterPortrait'

type IntelTab = 'ENEMY INTEL' | 'LOOT' | 'COMBAT LOG'
const intelTabs: IntelTab[] = ['ENEMY INTEL', 'LOOT', 'COMBAT LOG']

export function CombatIntelPanel({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const [tab, setTab] = useState<IntelTab>('ENEMY INTEL')
  return <Card title="COMBAT INTEL" className="combat-intel-panel"><Tabs items={intelTabs} active={tab} onChange={setTab} />{tab === 'ENEMY INTEL' && <EnemyIntelTab selectedDungeonId={selectedDungeonId} />}{tab === 'LOOT' && <LootIntelTab selectedDungeonId={selectedDungeonId} />}{tab === 'COMBAT LOG' && <CombatLogTab />}</Card>
}

function EnemyIntelTab({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const dungeon = DUNGEONS[combat.dungeonId ?? selectedDungeonId]
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  return <div className="combat-intel-scroll">{enemy ? <><div className="intel-identity-row"><MonsterPortrait monster={enemy} boss={isBossMonster(enemy)} /><div><span className="combat-subsection-label">{isBossMonster(enemy) ? 'BOSS DOSSIER' : 'CURRENT ENEMY'}</span><h3>{enemy.name}</h3><p>{enemy.subtitle}</p><small>Defeated {formatNumber(isBossMonster(enemy) ? progress.bossKillsByBoss[enemy.id] ?? 0 : progress.lifetimeKillsByMonster[enemy.id] ?? 0)} times</small></div></div><IntelTraits monsterId={enemy.id} /><ResistanceIntel monsterId={enemy.id} /><ActionIntel monsterId={enemy.id} /></> : <div className="intel-fallback"><span className="combat-subsection-label">{combat.active ? 'NEXT ENCOUNTER' : 'SELECTED DUNGEON'}</span><h3>{dungeon.name} ROSTER</h3><p>{combat.active ? 'The next enemy is being selected from this hunting ground.' : 'Review the threats and boss before entering.'}</p><div className="intel-roster-columns"><div><span className="combat-subsection-label">NORMAL ENEMIES</span>{dungeon.monsterPool.map((id) => <RosterLine key={id} monsterId={id} />)}</div><div><span className="combat-subsection-label">BOSS</span><RosterLine monsterId={dungeon.boss} boss /></div></div></div>}</div>
}

function IntelTraits({ monsterId }: { monsterId: MonsterId }) { const traits = getTraitDefinitions(MONSTERS[monsterId].traitIds); return <section className="intel-section"><div className="combat-subsection-label">TRAITS</div>{traits.length ? <div className="intel-trait-grid">{traits.map((trait) => <GameTooltip key={trait.id} block content={<TooltipContent title={trait.name} description={trait.description} />} accent="warning"><div className="intel-trait-card"><Sparkles size={14} aria-hidden="true" /><div><strong>{trait.name}</strong><p>{trait.ui?.shortDescription ?? trait.description}</p></div></div></GameTooltip>)}</div> : <p className="muted">No authored traits.</p>}</section> }

function ResistanceIntel({ monsterId }: { monsterId: MonsterId }) {
  const monster = MONSTERS[monsterId]
  const resistances = Object.entries(monster.resistances ?? {}).filter(([, value]) => value !== undefined && value !== 0)
  const immunities = monster.damageImmunities ?? []
  const statusImmunities = monster.statusImmunities ?? []
  const statusTagImmunities = monster.statusTagImmunities ?? []
  const hasAny = resistances.length || immunities.length || statusImmunities.length || statusTagImmunities.length
  return <section className="intel-section"><div className="combat-subsection-label">RESISTANCES &amp; IMMUNITIES</div>{hasAny ? <div className="intel-resistance-grid">{resistances.map(([type, value]) => <div key={type} className={`intel-resistance-row ${value as number < 0 ? 'is-weakness' : 'is-resistance'}`}><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>{Math.round(Math.abs(value as number) * 100)}% {value as number > 0 ? 'Resistance' : 'Weakness opportunity'}</strong></div>)}{immunities.map((type) => <div key={`immune-${type}`} className="intel-resistance-row is-immunity"><span className={`damage-type damage-${type}`}>{pretty(type)}</span><strong>IMMUNE</strong></div>)}{statusImmunities.length > 0 && <div className="intel-resistance-row is-immunity"><span>Status effects</span><strong>{statusImmunities.map(pretty).join(', ')} immune</strong></div>}{statusTagImmunities.length > 0 && <div className="intel-resistance-row is-immunity"><span>Status categories</span><strong>{statusTagImmunities.map(pretty).join(', ')} immune</strong></div>}</div> : <p className="muted">No explicit resistances, weaknesses, or immunities.</p>}</section>
}

function ActionIntel({ monsterId }: { monsterId: MonsterId }) {
  const activePattern = useGameStore((state) => state.combat.enemyActionPatternId)
  const monster = MONSTERS[monsterId]
  return <section className="intel-section"><div className="combat-subsection-label">ENEMY ACTIONS</div><div className="intel-action-grid">{Object.values(monster.actions).map((action) => { const presentation = buildCombatActionPresentation(action); const previewEffects = presentation.effects.slice(0, 2); return <GameTooltip key={action.id} block wide content={<TooltipContent title={presentation.name} description={presentation.description}><div className="tooltip-section"><small>TELEGRAPH</small><p>{formatTime(presentation.telegraphMs)}</p></div>{presentation.recoveryMs !== undefined && <div className="tooltip-section"><small>RECOVERY</small><p>{formatTime(presentation.recoveryMs)}</p></div>}{presentation.effects.map((effect, index) => <p key={`${effect.label}-${index}`}>{effect.label}{effect.value ? `: ${effect.value}` : ''}{effect.detail ? ` · ${effect.detail}` : ''}</p>)}</TooltipContent>}><div className="intel-action-card"><div><strong>{presentation.name}</strong><span><Clock3 size={12} aria-hidden="true" /> {formatTime(presentation.telegraphMs)} telegraph</span></div><p>{presentation.description}</p><div className="intel-action-effects">{previewEffects.map((effect, index) => <span key={`${effect.label}-${index}`}>{effect.label}{effect.value ? `: ${effect.value}` : ''}</span>)}{presentation.effects.length > 2 && <span>+{presentation.effects.length - 2} more</span>}</div></div></GameTooltip>})}</div><div className="intel-pattern-detail"><div className="combat-subsection-label">ACTION SEQUENCE {activePattern ? '· ACTIVE' : ''}</div>{Object.values(monster.actionPatterns).map((pattern, index) => <div className={`intel-pattern-line${pattern.id === activePattern ? ' is-active' : ''}`} key={pattern.id}><span>{pattern.id === activePattern ? 'CURRENT' : index === 0 ? 'STANDARD' : 'ALTERNATE'}</span><strong>{pattern.steps.map((step) => step.type === 'basic' ? 'Basic Attack' : monster.actions[step.actionId]?.name ?? 'Action').join(' → ')}</strong></div>)}</div><div className="intel-basic-attack"><span>BASE BASIC ATTACK</span><strong>{formatNumber(monster.basicAttackDamage)} Physical Damage</strong><small>{formatTime(monster.actionIntervalMs)} action interval</small></div></section>
}

function LootIntelTab({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const combat = useGameStore((state) => state.combat)
  const dungeon = DUNGEONS[combat.dungeonId ?? selectedDungeonId]
  const current = combat.enemyId ? MONSTERS[combat.enemyId] : null
  return <div className="combat-intel-scroll loot-intel"><div className="intel-loot-group"><div className="combat-subsection-label">{current ? 'CURRENT ENEMY DROPS' : 'DUNGEON LOOT · NORMAL ENEMIES'}</div>{current ? <LootRows monster={current} /> : dungeon.monsterPool.map((id) => <div className="loot-monster-group" key={id}><span>{MONSTERS[id].name}</span><LootRows monster={MONSTERS[id]} /></div>)}</div><div className="intel-loot-group"><div className="combat-subsection-label">DUNGEON BOSS DROPS · {MONSTERS[dungeon.boss].name.toUpperCase()}</div><LootRows monster={MONSTERS[dungeon.boss]} /></div></div>
}

function LootRows({ monster }: { monster: typeof MONSTERS[MonsterId] }) { return <div className="intel-loot-grid">{monster.loot.map((drop) => { const item = ITEMS[drop.itemId]; return <GameTooltip key={drop.itemId} block content={<TooltipContent title={item.name} description={item.description}><div className="tooltip-section"><small>SOURCE</small><p>{monster.name}</p></div></TooltipContent>}><div className="intel-loot-row"><ItemIcon itemId={drop.itemId} size="tiny" /><div><strong>{item.name}</strong><small>Quantity {drop.min}–{drop.max}</small></div><Status tone={drop.chance === 1 ? 'success' : 'neutral'}>{drop.chance === 1 ? 'GUARANTEED' : `${Math.round(drop.chance * 100)}%`}</Status></div></GameTooltip>})}</div> }

function CombatLogTab() { const log = useGameStore((state) => state.combat.log); return <div className="combat-intel-scroll combat-log-tab"><div className="combat-log">{log.length ? log.map((line, index) => <div key={`${line}-${index}`} className={index === 0 ? 'latest' : ''}><span>{String(index + 1).padStart(2, '0')}</span><p>{line}</p></div>) : <div className="empty-state">Combat events will appear here.</div>}</div></div> }
function RosterLine({ monsterId, boss = false }: { monsterId: MonsterId; boss?: boolean }) { const monster = MONSTERS[monsterId]; return <div className="intel-roster-line"><MonsterPortrait monster={monster} boss={boss} /><span><strong>{monster.name}</strong><small>{monster.subtitle}</small></span></div> }
function pretty(value: string) { return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }

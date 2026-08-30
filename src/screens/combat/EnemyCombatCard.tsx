import { Shield } from 'lucide-react'
import { isBossMonster, MONSTERS } from '../../game/content/monsters'
import { getMonsterTraits } from '../../game/systems/combat/traitRuntime'
import { formatNumber, formatTime } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { GameTooltip, Progress, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { CombatStatusStrip } from './CombatStatusStrip'
import { MonsterPortrait } from './MonsterPortrait'

export function EnemyCombatCard() {
  const combat = useGameStore((state) => state.combat)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const boss = Boolean(enemy && isBossMonster(enemy))
  const traits = enemy ? getMonsterTraits(enemy) : []
  if (!enemy) return <section className="combat-actor-card combat-enemy-card combat-enemy-empty"><header className="combat-actor-head"><div className="combat-actor-mark"><Shield size={20} aria-hidden="true" /></div><div><span className="combat-subsection-label">ENEMY</span><h2>{combat.active ? 'SEARCHING' : 'AT THE TOWER'}</h2></div><Status tone="neutral">{combat.active ? 'Encounter delay' : 'Inactive'}</Status></header><div className="combat-empty-actor"><Shield size={34} aria-hidden="true" /><strong>{combat.active ? 'The Dungeon is searching for another threat.' : 'Choose a Dungeon to begin.'}</strong></div></section>
  return <section className={`combat-actor-card combat-enemy-card${boss ? ' is-boss' : ''}`} style={{ '--enemy-accent': enemy.color } as React.CSSProperties}><header className="combat-actor-head"><div><span className="combat-subsection-label">{boss ? 'BOSS' : 'ENEMY'}</span><h2>{enemy.name}</h2><p>{enemy.subtitle}</p></div><Status tone={boss ? 'warning' : 'active'}>{boss ? 'Boss fight' : 'Engaged'}</Status></header><MonsterPortrait monster={enemy} boss={boss} /><div className="combat-enemy-identity"><strong>{enemy.name}</strong><span>{enemy.subtitle}</span></div><Progress value={combat.enemyHp / Math.max(1, combat.enemyMaxHp) * 100} tone="health" label="HP" right={`${formatNumber(combat.enemyHp)} / ${formatNumber(combat.enemyMaxHp)}`} /><GameTooltip block accent="success" content={<TooltipContent title="Enemy Barrier" description="Barrier absorbs incoming damage before enemy Health." />}><div className={`combat-barrier-readout${combat.enemyBarrier > 0 ? '' : ' is-empty'}`}><span><Shield size={13} aria-hidden="true" />BARRIER</span><strong>{combat.enemyBarrier > 0 ? formatNumber(combat.enemyBarrier) : '—'}</strong>{combat.enemyBarrier > 0 && combat.enemyBarrierRemainingMs !== null && <small className="ui-time">{formatTime(combat.enemyBarrierRemainingMs)}</small>}</div></GameTooltip>{traits.length > 0 && <div className="combat-trait-strip" aria-label="Enemy traits">{traits.map((trait) => <GameTooltip key={trait.id} content={<TooltipContent title={trait.name} description={trait.description} />} accent={boss ? 'warning' : 'elemental'}><span tabIndex={0}>{trait.name}</span></GameTooltip>)}</div>}<CombatStatusStrip statuses={combat.enemyStatuses} label="ACTIVE STATUSES" /></section>
}

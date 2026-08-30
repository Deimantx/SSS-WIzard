import { Shield } from 'lucide-react'
import { useMemo } from 'react'
import type { DungeonId } from '../../game/types'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { isBossMonster, MONSTERS } from '../../game/content/monsters'
import { getMonsterTraits } from '../../game/systems/combat/traitRuntime'
import { formatNumber, formatTime } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { GameTooltip, Progress, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { CombatStatusStrip } from './CombatStatusStrip'
import { MonsterPortrait } from './MonsterPortrait'
import { CombatResource } from './CombatResource'

export function EnemyCombatCard({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const combatActive = useGameStore((state) => state.combat.active)
  const enemyId = useGameStore((state) => state.combat.enemyId)
  const enemyHp = useGameStore((state) => state.combat.enemyHp)
  const enemyMaxHp = useGameStore((state) => state.combat.enemyMaxHp)
  const enemyBarrier = useGameStore((state) => state.combat.enemyBarrier)
  const enemyBarrierRemainingMs = useGameStore((state) => state.combat.enemyBarrierRemainingMs)
  const enemyStatuses = useGameStore((state) => state.combat.enemyStatuses)
  const enemy = enemyId ? MONSTERS[enemyId] : null
  const boss = Boolean(enemy && isBossMonster(enemy))
  const traits = useMemo(() => enemy ? getMonsterTraits(enemy) : [], [enemy])
  if (!enemy) {
    const dungeon = DUNGEONS[selectedDungeonId]
    const bossPreview = MONSTERS[dungeon.boss]
    return <section className="combat-actor-card combat-enemy-card combat-enemy-empty"><header className="combat-actor-head"><div className="combat-actor-mark"><Shield size={20} aria-hidden="true" /></div><div className="combat-actor-head-copy"><span className="combat-subsection-label">ENEMY PREVIEW</span><h2>{combatActive ? 'NEXT THREAT' : 'SELECTED ROUTE'}</h2></div><Status tone="neutral">{combatActive ? 'Searching' : 'Standby'}</Status></header>{combatActive ? <div className="combat-empty-actor"><Shield size={27} aria-hidden="true" /><span className="combat-subsection-label">NEXT THREAT</span><strong>Searching…</strong></div> : <div className="combat-route-preview"><MonsterPortrait monster={bossPreview} boss /><div><span className="combat-subsection-label">BOSS PREVIEW</span><strong>{bossPreview.name}</strong><small>{dungeon.monsterPool.length} normal threats · {dungeon.threatRequired} Threat</small></div></div>}</section>
  }
  return <section className={`combat-actor-card combat-enemy-card${boss ? ' is-boss' : ''}`} style={{ '--enemy-accent': enemy.color } as React.CSSProperties}><header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">{boss ? 'BOSS' : 'ENEMY'}</span></div><Status tone={boss ? 'warning' : 'active'}>{boss ? 'Boss fight' : 'Engaged'}</Status></header><MonsterPortrait monster={enemy} boss={boss} /><div className="combat-enemy-identity"><strong>{enemy.name}</strong><span>{enemy.subtitle}</span></div><Progress value={enemyHp / Math.max(1, enemyMaxHp) * 100} tone="health" label="HP" right={`${formatNumber(enemyHp)} / ${formatNumber(enemyMaxHp)}`} /><CombatResource icon={<Shield size={13} />} label="BARRIER" value={`${formatNumber(enemyBarrier)}${enemyBarrierRemainingMs === null ? '' : ` · ${formatTime(enemyBarrierRemainingMs)}`}`} percent={enemyBarrier / Math.max(1, enemyMaxHp) * 100} tone="barrier" />{traits.length > 0 && <div className="combat-trait-strip" aria-label="Enemy traits">{traits.map((trait) => <GameTooltip key={trait.id} content={<TooltipContent title={trait.name} description={trait.description} />} accent={boss ? 'warning' : 'elemental'}><span tabIndex={0}>{trait.name}</span></GameTooltip>)}</div>}<CombatStatusStrip statuses={enemyStatuses} label="ACTIVE STATUSES" /></section>
}

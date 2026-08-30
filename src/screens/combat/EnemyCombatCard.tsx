import { BookOpen, Heart, Package, Shield } from 'lucide-react'
import { useMemo, type Ref } from 'react'
import type { DungeonId } from '../../game/types'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { isBossMonster, MONSTERS } from '../../game/content/monsters'
import { getMonsterTraits } from '../../game/systems/combat/traitRuntime'
import { formatNumber, formatTime } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { CombatStatusStrip } from './CombatStatusStrip'
import { MonsterPortrait } from './MonsterPortrait'
import { CombatResource } from './CombatResource'
import type { EnemyContextMode } from './EnemyContextWindow'
import { CombatPerformanceMeters } from './CombatPerformanceMeters'

export function EnemyCombatCard({ selectedDungeonId, cardRef, onOpenContext }: { selectedDungeonId: DungeonId; cardRef?: Ref<HTMLElement>; onOpenContext?: (mode: EnemyContextMode, trigger: HTMLButtonElement) => void }) {
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
    return <section ref={cardRef} className="combat-actor-card combat-enemy-card combat-enemy-empty"><header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">ENEMY PREVIEW</span><h2>{combatActive ? 'NEXT THREAT' : 'SELECTED ROUTE'}</h2></div><Status tone="neutral">{combatActive ? 'Searching' : 'Standby'}</Status></header>{combatActive ? <div className="combat-empty-actor"><Shield size={27} aria-hidden="true" /><span className="combat-subsection-label">NEXT THREAT</span><strong>Searching…</strong></div> : <div className="combat-route-preview"><MonsterPortrait monster={bossPreview} boss /><div><span className="combat-subsection-label">BOSS PREVIEW</span><strong>{bossPreview.name}</strong><small>{dungeon.monsterPool.length} normal threats · {dungeon.threatRequired} Threat</small></div></div>}</section>
  }

  return <section ref={cardRef} className={`combat-actor-card combat-enemy-card${boss ? ' is-boss' : ''}`} style={{ '--enemy-accent': enemy.color } as React.CSSProperties}><header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">{boss ? 'BOSS' : 'ENEMY'}</span><h2>{enemy.name}</h2></div><Status tone={boss ? 'warning' : 'active'}>{boss ? 'Boss fight' : 'Engaged'}</Status></header><MonsterPortrait monster={enemy} boss={boss} /><div className="combat-enemy-subtitle">{enemy.subtitle}</div><div className="combat-resource-stack"><CombatResource icon={<Heart size={13} />} label="HP" value={`${formatNumber(enemyHp)} / ${formatNumber(enemyMaxHp)}`} percent={enemyHp / Math.max(1, enemyMaxHp) * 100} tone="health" /><CombatResource icon={<Shield size={13} />} label="BARRIER" value={`${formatNumber(enemyBarrier)}${enemyBarrierRemainingMs === null ? '' : ` · ${formatTime(enemyBarrierRemainingMs)}`}`} percent={enemyBarrier / Math.max(1, enemyMaxHp) * 100} tone="barrier" /></div>{traits.length > 0 && <div className="combat-trait-strip" aria-label="Enemy traits">{traits.map((trait) => <GameTooltip key={trait.id} content={<TooltipContent title={trait.name} description={trait.description} />} accent={boss ? 'warning' : 'elemental'}><span tabIndex={0}>{trait.name}</span></GameTooltip>)}</div>}<CombatStatusStrip statuses={enemyStatuses} label="ACTIVE STATUSES" /><CombatPerformanceMeters actor="enemy" scope="encounter" /><EnemyUtilityFooter onOpenContext={onOpenContext} /></section>
}

function EnemyUtilityFooter({ onOpenContext }: { onOpenContext?: (mode: EnemyContextMode, trigger: HTMLButtonElement) => void }) {
  return <div className="enemy-utility-footer"><button type="button" className="enemy-utility-button" aria-label="Open Enemy Intel" onClick={(event) => onOpenContext?.('intel', event.currentTarget)}><BookOpen size={13} aria-hidden="true" /> ENEMY INTEL</button><button type="button" className="enemy-utility-button" aria-label="Open Enemy Loot" onClick={(event) => onOpenContext?.('loot', event.currentTarget)}><Package size={13} aria-hidden="true" /> LOOT</button></div>
}

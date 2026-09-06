import { BookOpen, Crosshair, Heart, Package, Shield } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent, type Ref } from 'react'
import type { DungeonId, MonsterId } from '../../game/types'
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
import { CombatFloatingFeedback } from './CombatFloatingFeedback'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { getMonsterDungeon } from '../../game/content/contentRelations'
type EnemyTransitionState = 'steady' | 'entering' | 'exiting'

export function EnemyCombatCard({ selectedDungeonId, selectedMonsterId, cardRef, onOpenContext, contextOpen = false }: { selectedDungeonId: DungeonId; selectedMonsterId?: MonsterId | null; cardRef?: Ref<HTMLElement>; onOpenContext?: (trigger: HTMLElement, mode?: 'intel' | 'loot') => void; contextOpen?: boolean }) {
  const combatActive = useGameStore((state) => state.combat.active)
  const enemyId = useGameStore((state) => state.combat.enemyId)
  const enemyHp = useGameStore((state) => state.combat.enemyHp)
  const enemyMaxHp = useGameStore((state) => state.combat.enemyMaxHp)
  const enemyBarrier = useGameStore((state) => state.combat.enemyBarrier)
  const enemyBarrierRemainingMs = useGameStore((state) => state.combat.enemyBarrierRemainingMs)
  const enemyStatuses = useGameStore((state) => state.combat.enemyStatuses)
  const [renderedEnemyId, setRenderedEnemyId] = useState<MonsterId | null>(() => enemyId)
  const [transitionState, setTransitionState] = useState<EnemyTransitionState>('steady')
  const { openContextMenu } = useGameContextMenu()

  useEffect(() => {
    if (enemyId === renderedEnemyId) return
    if (renderedEnemyId && !enemyId) {
      setTransitionState('exiting')
      const timer = window.setTimeout(() => { setRenderedEnemyId(null); setTransitionState('steady') }, 120)
      return () => window.clearTimeout(timer)
    }
    setRenderedEnemyId(enemyId)
    setTransitionState('entering')
    const timer = window.setTimeout(() => setTransitionState('steady'), 180)
    return () => window.clearTimeout(timer)
  }, [enemyId, renderedEnemyId])

  const enemy = (renderedEnemyId ? MONSTERS[renderedEnemyId] : null) ?? (enemyId ? MONSTERS[enemyId] : null)
  const boss = Boolean(enemy && isBossMonster(enemy))
  const traits = useMemo(() => enemy ? getMonsterTraits(enemy) : [], [enemy])

  if (!enemy) {
    const dungeon = DUNGEONS[selectedDungeonId]
    const selectedPreview = selectedMonsterId && (dungeon.monsterPool.includes(selectedMonsterId) || dungeon.boss === selectedMonsterId) ? MONSTERS[selectedMonsterId] : null
    const bossPreview = MONSTERS[dungeon.boss]
    return <section ref={cardRef} className="combat-actor-card combat-enemy-card combat-enemy-empty combat-enemy-transition-enter"><header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">ENEMY PREVIEW</span><h2>{combatActive ? 'NEXT THREAT' : selectedPreview ? 'SELECTED TARGET' : 'SELECTED ROUTE'}</h2></div><Status tone="neutral">{combatActive ? 'Searching' : 'Standby'}</Status></header>{combatActive ? <div className="combat-empty-actor"><Shield size={27} aria-hidden="true" /><span className="combat-subsection-label">NEXT THREAT</span><strong>Searching...</strong></div> : <div className="combat-route-preview"><MonsterPortrait monster={selectedPreview ?? bossPreview} boss={!selectedPreview && selectedPreview !== bossPreview} /><div><span className="combat-subsection-label">{selectedPreview ? 'TARGET' : 'BOSS PREVIEW'}</span><strong>{(selectedPreview ?? bossPreview).name}</strong><small>{selectedPreview ? selectedPreview.subtitle : `${dungeon.monsterPool.length} normal threats · ${dungeon.threatRequired} Threat`}</small></div></div>}</section>
  }

  const monsterDungeon = getMonsterDungeon(enemy.id)
  const openEnemyMenu = (event: MouseEvent<HTMLElement>) => {
    if (!monsterDungeon) return
    event.preventDefault(); event.stopPropagation()
    openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: enemy.name, meta: `${boss ? 'BOSS' : 'ENEMY'} · ${DUNGEONS[monsterDungeon.dungeonId].name}` }, sections: [{ id: 'enemy', actions: [{ id: 'bestiary', label: 'OPEN BESTIARY', icon: BookOpen, onSelect: () => { setNavigationIntent({ combatMonsterId: enemy.id, combatDungeonId: monsterDungeon.dungeonId }); useGameStore.getState().setScreen('bestiary') } }, { id: 'drops', label: 'VIEW DROP TABLE', icon: Package, onSelect: () => onOpenContext?.(event.currentTarget, 'loot') }, { id: 'dungeon', label: 'OPEN DUNGEON', icon: Crosshair, onSelect: () => { setNavigationIntent({ combatDungeonId: monsterDungeon.dungeonId, combatMonsterId: null }); useGameStore.getState().setScreen('combat') } }] }] })
  }
  return <section ref={cardRef} className={`combat-actor-card combat-enemy-card${boss ? ' is-boss' : ''}${transitionState === 'exiting' ? ' combat-enemy-transition-exit' : transitionState === 'entering' ? ' combat-enemy-transition-enter' : ''}`} style={{ '--enemy-accent': enemy.color } as CSSProperties} onContextMenu={openEnemyMenu}><header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">{boss ? 'BOSS' : 'ENEMY'}</span><h2>{enemy.name}</h2></div><Status tone={boss ? 'warning' : 'active'}>{boss ? 'Boss fight' : 'Engaged'}</Status></header><MonsterPortrait monster={enemy} boss={boss} /><div className="combat-enemy-subtitle">{enemy.subtitle}</div><CombatFloatingFeedback actor="enemy" health={enemyHp} barrier={enemyBarrier} resetKey={enemy.id} /><div className="combat-resource-stack"><CombatResource icon={<Heart size={13} />} label="HP" value={`${formatNumber(enemyHp)} / ${formatNumber(enemyMaxHp)}`} currentValue={enemyHp} maxValue={enemyMaxHp} percent={enemyHp / Math.max(1, enemyMaxHp) * 100} tone="health" /><CombatResource icon={<Shield size={13} />} label="BARRIER" value={`${formatNumber(enemyBarrier)}${enemyBarrierRemainingMs === null ? '' : ` · ${formatTime(enemyBarrierRemainingMs)}`} `} currentValue={enemyBarrier} maxValue={enemyMaxHp} percent={enemyBarrier / Math.max(1, enemyMaxHp) * 100} tone="barrier" /></div>{traits.length > 0 && <div className="combat-trait-strip" aria-label="Enemy traits">{traits.map((trait) => <GameTooltip key={trait.id} content={<TooltipContent title={trait.name} description={trait.description} />} accent={boss ? 'warning' : 'elemental'}><span tabIndex={0}>{trait.name}</span></GameTooltip>)}</div>}<CombatStatusStrip statuses={enemyStatuses} label="ACTIVE STATUSES" /><EnemyUtilityFooter onOpenContext={onOpenContext} contextOpen={contextOpen} /></section>
}

function EnemyUtilityFooter({ onOpenContext, contextOpen }: { onOpenContext?: (trigger: HTMLElement, mode?: 'intel' | 'loot') => void; contextOpen: boolean }) {
  return <div className="enemy-utility-footer"><button type="button" className="enemy-utility-button" aria-label="Open Enemy Intel" aria-haspopup="dialog" aria-expanded={contextOpen} onClick={(event) => onOpenContext?.(event.currentTarget)}><BookOpen size={13} aria-hidden="true" /> ENEMY INTEL</button></div>
}

import { BookOpen, Crosshair, Heart, Package, Shield } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent, type Ref } from 'react'
import type { CombatLocationId, MonsterId } from '../../game/types'
import { COMBAT_LOCATIONS, hasBossEncounter } from '../../game/content/combat-locations/worldNavigation'
import { isBossMonster, MONSTERS } from '../../game/content/monsters'
import { getCombatEncounterMode, getCombatLocationById } from '../../game/content/combat-locations'
import { getMonsterTraits } from '../../game/systems/combat/traitRuntime'
import { getActiveEliteZoneAffix } from '../../game/systems/combat/eliteZoneAffixRuntime'
import { resolveBossThreatRequirement } from '../../game/systems/combat/combatThreat'
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
import { getMonsterCombatLocation } from '../../game/content/contentRelations'

type EnemyTransitionState = 'steady' | 'entering' | 'exiting'

export const resolveEnemyPreviewCombatLocationId = ({ combatActive, combatLocationId, selectedCombatLocationId }: { combatActive: boolean; combatLocationId: CombatLocationId | null; selectedCombatLocationId: CombatLocationId }) => combatActive ? combatLocationId ?? selectedCombatLocationId : selectedCombatLocationId

export function EnemyCombatCard({ selectedCombatLocationId, selectedMonsterId, cardRef, onOpenContext, contextOpen = false }: { selectedCombatLocationId: CombatLocationId; selectedMonsterId?: MonsterId | null; cardRef?: Ref<HTMLElement>; onOpenContext?: (trigger: HTMLElement, mode?: 'intel' | 'loot') => void; contextOpen?: boolean }) {
  const combatActive = useGameStore((state) => state.combat.active)
  const combatLocationId = useGameStore((state) => state.combat.locationId)
  const enemyId = useGameStore((state) => state.combat.enemyId)
  const enemyHp = useGameStore((state) => state.combat.enemyHp)
  const enemyMaxHp = useGameStore((state) => state.combat.enemyMaxHp)
  const enemyBarrier = useGameStore((state) => state.combat.enemyBarrier)
  const enemyBarrierRemainingMs = useGameStore((state) => state.combat.enemyBarrierRemainingMs)
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
  const activeZoneAffix = useGameStore((state) => getActiveEliteZoneAffix(state))

  if (!enemy) {
    const dungeon = COMBAT_LOCATIONS[resolveEnemyPreviewCombatLocationId({ combatActive, combatLocationId, selectedCombatLocationId })]
    const threatRequired = resolveBossThreatRequirement(dungeon.id)
    const sequence = getCombatEncounterMode(getCombatLocationById(dungeon.id)) === 'sequence' ? dungeon.encounterSequence : null
    const selectedPreview = selectedMonsterId && (dungeon.monsterPool.includes(selectedMonsterId) || (hasBossEncounter(dungeon) && dungeon.boss === selectedMonsterId)) ? MONSTERS[selectedMonsterId] : null
    const bossPreview = hasBossEncounter(dungeon) ? MONSTERS[dungeon.boss] : null
    const routeSummary = sequence ? `FIXED RUN · ${sequence.length + 1} ENCOUNTERS` : hasBossEncounter(dungeon) ? `${dungeon.monsterPool.length} normal threats · ${formatNumber(threatRequired)} Threat` : `${dungeon.monsterPool.length} authorized quarry · Hunt Contract required`
    const previewMonster = selectedPreview ?? bossPreview ?? MONSTERS[dungeon.monsterPool[0]]
    return <section ref={cardRef} className="combat-actor-card combat-enemy-card combat-enemy-empty combat-enemy-transition-enter"><header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">ENEMY PREVIEW</span><h2>{combatActive ? 'NEXT THREAT' : selectedPreview ? 'SELECTED TARGET' : 'SELECTED ROUTE'}</h2></div><Status tone="neutral">{combatActive ? 'Searching' : 'Standby'}</Status></header>{combatActive ? <div className="combat-empty-actor"><Shield size={27} aria-hidden="true" /><span className="combat-subsection-label">ACTIVE RUN · {dungeon.name}</span><strong>Searching...</strong></div> : <div className="combat-route-preview"><MonsterPortrait monster={previewMonster} boss={Boolean(!selectedPreview && bossPreview)} /><div><span className="combat-subsection-label">{selectedPreview ? 'TARGET' : bossPreview ? 'BOSS PREVIEW' : 'LOCATION PREVIEW'}</span><strong>{previewMonster.name}</strong><small>{selectedPreview ? selectedPreview.subtitle : routeSummary}</small></div></div>}</section>
  }

  const monsterDungeon = getMonsterCombatLocation(enemy.id)
  const openEnemyMenu = (event: MouseEvent<HTMLElement>) => {
    if (!monsterDungeon) return
    event.preventDefault(); event.stopPropagation()
    openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: enemy.name, meta: `${boss ? 'BOSS' : 'ENEMY'} · ${COMBAT_LOCATIONS[monsterDungeon.locationId].name}` }, sections: [{ id: 'enemy', actions: [{ id: 'bestiary', label: 'Open Bestiary', icon: BookOpen, onSelect: () => { setNavigationIntent({ combatMonsterId: enemy.id, combatLocationId: monsterDungeon.locationId }); useGameStore.getState().setScreen('hunters-order') } }, { id: 'drops', label: 'View Drops', icon: Package, onSelect: () => onOpenContext?.(event.currentTarget, 'loot') }, { id: 'location', label: 'Open Location', icon: Crosshair, onSelect: () => { setNavigationIntent({ combatLocationId: monsterDungeon.locationId, combatMonsterId: null }); useGameStore.getState().setScreen('combat') } }] }] })
  }
  return <section ref={cardRef} className={`combat-actor-card combat-enemy-card${boss ? ' is-boss' : ''}${transitionState === 'exiting' ? ' combat-enemy-transition-exit' : transitionState === 'entering' ? ' combat-enemy-transition-enter' : ''}`} style={{ '--enemy-accent': enemy.color } as CSSProperties} onContextMenu={openEnemyMenu}>
    <header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">{boss ? 'BOSS' : 'ENEMY'}</span><h2>{enemy.name}</h2></div><div className="combat-actor-head-status">{activeZoneAffix && !boss && <GameTooltip content={<TooltipContent title={`Zone Affix · ${activeZoneAffix.name}`} description={activeZoneAffix.description} />}><span className="combat-enemy-zone-affix-badge" tabIndex={0}>ZONE AFFIX · {activeZoneAffix.name.toUpperCase()}</span></GameTooltip>}<Status tone={boss ? 'warning' : 'active'}>{boss ? 'Boss fight' : 'Engaged'}</Status></div></header>
    <MonsterPortrait monster={enemy} boss={boss} />
    <div className="combat-enemy-subtitle">{enemy.subtitle}</div>
    <CombatFloatingFeedback actor="enemy" health={enemyHp} barrier={enemyBarrier} resetKey={enemy.id} />
    <div className="combat-resource-stack"><CombatResource icon={<Heart size={13} />} label="HP" value={`${formatNumber(enemyHp)} / ${formatNumber(enemyMaxHp)}`} currentValue={enemyHp} maxValue={enemyMaxHp} percent={enemyHp / Math.max(1, enemyMaxHp) * 100} tone="health" /><CombatResource icon={<Shield size={13} />} label="BARRIER" value={`${formatNumber(enemyBarrier)}${enemyBarrierRemainingMs === null ? '' : ` · ${formatTime(enemyBarrierRemainingMs)}`} `} currentValue={enemyBarrier} maxValue={enemyMaxHp} percent={enemyBarrier / Math.max(1, enemyMaxHp) * 100} tone="barrier" /></div>
    {traits.length > 0 && <div className="combat-trait-strip" aria-label="Enemy traits">{traits.map((trait) => <GameTooltip key={trait.id} content={<TooltipContent title={trait.name} description={trait.description} />} accent={boss ? 'warning' : 'elemental'}><span tabIndex={0}>{trait.name}</span></GameTooltip>)}</div>}
    <CombatStatusStrip actor="enemy" label="ACTIVE STATUSES" />
    <EnemyUtilityFooter onOpenContext={onOpenContext} contextOpen={contextOpen} />
  </section>
}

function EnemyUtilityFooter({ onOpenContext, contextOpen }: { onOpenContext?: (trigger: HTMLElement, mode?: 'intel' | 'loot') => void; contextOpen: boolean }) {
  return <div className="enemy-utility-footer"><button type="button" className="enemy-utility-button" aria-label="Open Enemy Intel" aria-haspopup="dialog" aria-expanded={contextOpen} onClick={(event) => onOpenContext?.(event.currentTarget)}><BookOpen size={13} aria-hidden="true" /> ENEMY INTEL</button></div>
}

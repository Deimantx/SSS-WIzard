import { useCallback, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import type { DungeonId } from '../../game/types'
import { MONSTERS } from '../../game/content/monsters'
import { useGameStore } from '../../store/gameStore'
import { CombatRunBar } from './CombatRunBar'
import { CombatSpellDeck } from './CombatSpellDeck'
import { CombatStage } from './CombatStage'
import { CombatAnalyticsPanel } from './CombatAnalyticsPanel'
import { EnemyContextWindow, type EnemyContextMode } from './EnemyContextWindow'
import { useCombatDefeatStore } from '../../game/ui/combatDefeatStore'
import { CombatAmbientBackdrop } from './CombatAmbientBackdrop'
import { setNavigationIntent, useNavigationIntent } from '../../ui/navigation/navigationIntent'
import { CombatWorldNavigation } from './navigation/CombatWorldNavigation'
import { COMBAT_LOCATIONS } from '../../game/content/world-navigation'
import { getInitialCombatLocationId } from '../../game/presentation/combat/combatWorldNavigationReadModel'
import type { CombatLocationViewModel } from '../../game/presentation/combat/combatWorldNavigationTypes'
import type { MonsterId } from '../../game/types'

export function CombatScreenV2() {
  const combat = useGameStore(useShallow((state) => ({
    active: state.combat.active,
    dungeonId: state.combat.dungeonId,
    enemyId: state.combat.enemyId,
    inBossFight: state.combat.inBossFight,
  })))
  const bossKillsByBoss = useGameStore((state) => state.progress.bossKillsByBoss)
  const lastEnteredDungeonId = useGameStore((state) => state.ui.lastEnteredCombatDungeonId)
  const [selectedDungeonId, setSelectedDungeonId] = useState<DungeonId>(() => {
    const locationId = getInitialCombatLocationId({ combat, lastEnteredDungeonId, progress: { bossKillsByBoss } })
    return COMBAT_LOCATIONS[locationId]?.dungeonId ?? 'whispering-woods'
  })
  const navigationIntent = useNavigationIntent()
  const [enemyContextMode, setEnemyContextMode] = useState<EnemyContextMode | null>(null)
  const enemyCardRef = useRef<HTMLElement>(null)
  const enemyContextTriggerRef = useRef<HTMLElement>(null)
  const defeatSnapshot = useCombatDefeatStore((state) => state.snapshot)
  useEffect(() => { if (!combat.active && navigationIntent.combatDungeonId) setSelectedDungeonId(navigationIntent.combatDungeonId) }, [combat.active, navigationIntent.combatDungeonId])
  const closeEnemyContext = useCallback(() => setEnemyContextMode(null), [])
  const openEnemyContext = useCallback((trigger: HTMLElement, mode: EnemyContextMode = 'intel') => {
    dismissGameTooltips()
    const currentCombat = useGameStore.getState().combat
    if (!currentCombat.active || !currentCombat.enemyId || !MONSTERS[currentCombat.enemyId]) return
    if (enemyContextMode && enemyContextTriggerRef.current === trigger) { setEnemyContextMode(null); return }
    enemyContextTriggerRef.current = trigger
    setEnemyContextMode(mode)
  }, [enemyContextMode])
  const openEnemyLootContext = useCallback(() => { if (combat.active && combat.enemyId) setEnemyContextMode('loot') }, [combat.active, combat.enemyId])
  useEffect(() => { if (!combat.active) setEnemyContextMode(null) }, [combat.active])
  const previousEnemyId = useRef(combat.enemyId)
  useEffect(() => {
    if (enemyContextMode && combat.enemyId !== previousEnemyId.current) setEnemyContextMode(combat.active && combat.enemyId ? 'intel' : null)
    previousEnemyId.current = combat.enemyId
  }, [combat.active, combat.enemyId, enemyContextMode])
  const requestLeave = useCallback(() => { dismissGameTooltips(); useGameStore.getState().leaveDungeon() }, [])
  useEffect(() => { if (defeatSnapshot) setEnemyContextMode(null) }, [defeatSnapshot])
  const selectLocation = useCallback((locationId: string) => { const dungeonId = COMBAT_LOCATIONS[locationId]?.dungeonId; if (dungeonId) setSelectedDungeonId(dungeonId) }, [])
  const enterLocation = useCallback((locationId: string, targetEnemyId?: MonsterId) => { const dungeonId = COMBAT_LOCATIONS[locationId]?.dungeonId; if (!dungeonId) return; setSelectedDungeonId(dungeonId); dismissGameTooltips(); if (targetEnemyId) useGameStore.getState().enterTargetedCombat(dungeonId, targetEnemyId); else useGameStore.getState().enterDungeon(dungeonId) }, [])
  const setCombatTarget = useCallback((enemyId: MonsterId) => useGameStore.getState().setCombatTarget(enemyId), [])
  const openLocationBestiary = useCallback((location: CombatLocationViewModel) => { if (!location.dungeonId) return; const knownMonster = location.encounters.find((encounter) => encounter.known && encounter.monsterId)?.monsterId ?? location.boss?.monsterId ?? null; setNavigationIntent({ combatDungeonId: location.dungeonId, combatMonsterId: knownMonster }); useGameStore.getState().setScreen('bestiary') }, [])
  const returnToCombat = useCallback(() => { const stage = document.querySelector('.combat-stage-panel'); if (stage instanceof HTMLElement && typeof stage.scrollIntoView === 'function') stage.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  const bossActive = Boolean(combat.active && combat.inBossFight)
  return <div className={`screen-content combat-screen combat-ambient-screen${bossActive ? ' is-boss-active' : ''}`}><CombatAmbientBackdrop combatActive={combat.active} bossActive={bossActive} /><div className="screen-header"><div><div className="eyebrow">ARCANE COMBAT</div><h1>Combat</h1><p>Read enemy intent, manage Mana, and control your Spell automation.</p></div></div><CombatRunBar selectedDungeonId={selectedDungeonId} onRequestLeave={requestLeave} /><CombatWorldNavigation onSelectLocation={selectLocation} onEnterLocation={enterLocation} onSetCombatTarget={setCombatTarget} onBestiary={openLocationBestiary} onReturnToCombat={returnToCombat} /><ScreenGrid screen="combat" panels={[{ id: 'combat-stage', content: <CombatStage selectedDungeonId={selectedDungeonId} bossActive={bossActive} enemyCardRef={enemyCardRef} onOpenEnemyContext={openEnemyContext} /> }, { id: 'combat-spell-deck', content: <CombatSpellDeck /> }, { id: 'combat-analytics', content: <CombatAnalyticsPanel /> }]} />{enemyContextMode && <EnemyContextWindow mode={enemyContextMode} anchorRef={enemyCardRef} triggerRef={enemyContextTriggerRef} selectedDungeonId={selectedDungeonId} onModeChange={setEnemyContextMode} onClose={closeEnemyContext} />}</div>
}

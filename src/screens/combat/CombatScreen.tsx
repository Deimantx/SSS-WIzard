import { useCallback, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import type { CombatLocationId, MonsterId } from '../../game/types'
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
import { COMBAT_LOCATIONS, isCombatLocationId } from '../../game/content/combat-locations'
import { getInitialCombatLocationId } from '../../game/presentation/combat/combatWorldNavigationReadModel'
import type { CombatLocationViewModel } from '../../game/presentation/combat/combatWorldNavigationTypes'

export function CombatScreenV2() {
  const combat = useGameStore(useShallow((state) => ({
    active: state.combat.active,
    locationId: state.combat.locationId,
    enemyId: state.combat.enemyId,
    inBossFight: state.combat.inBossFight,
  })))
  const bossKillsByBoss = useGameStore((state) => state.progress.bossKillsByBoss)
  const lastEnteredCombatLocationId = useGameStore((state) => state.ui.lastEnteredCombatLocationId)
  const [selectedCombatLocationId, setSelectedCombatLocationId] = useState<CombatLocationId>(() => {
    const locationId = getInitialCombatLocationId({ combat, lastEnteredCombatLocationId, progress: { bossKillsByBoss } })
    return COMBAT_LOCATIONS[locationId]?.id ?? 'whispering-woods'
  })
  const navigationIntent = useNavigationIntent()
  const [enemyContextMode, setEnemyContextMode] = useState<EnemyContextMode | null>(null)
  const enemyCardRef = useRef<HTMLElement>(null)
  const enemyContextTriggerRef = useRef<HTMLElement>(null)
  const defeatSnapshot = useCombatDefeatStore((state) => state.snapshot)
  useEffect(() => { if (!combat.active && navigationIntent.combatLocationId) setSelectedCombatLocationId(navigationIntent.combatLocationId) }, [combat.active, navigationIntent.combatLocationId])
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
  const selectLocation = useCallback((locationId: string) => { if (isCombatLocationId(locationId)) setSelectedCombatLocationId(locationId) }, [])
  const enterLocation = useCallback((locationId: string) => { if (!isCombatLocationId(locationId)) return; setSelectedCombatLocationId(locationId); dismissGameTooltips(); useGameStore.getState().enterDungeon(locationId) }, [])
  const huntTarget = useCallback((locationId: string, targetEnemyId: MonsterId) => { if (!isCombatLocationId(locationId)) return false; setSelectedCombatLocationId(locationId); dismissGameTooltips(); return useGameStore.getState().huntCombatTarget(locationId, targetEnemyId) }, [])
  const openLocationBestiary = useCallback((location: CombatLocationViewModel, monsterId: MonsterId | null = null) => { if (!location.id) return; setNavigationIntent({ combatLocationId: location.id, combatMonsterId: monsterId }); useGameStore.getState().setScreen('hunters-order') }, [])
  const returnToCombat = useCallback(() => { const stage = document.querySelector('.combat-stage-panel'); if (stage instanceof HTMLElement && typeof stage.scrollIntoView === 'function') stage.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  const bossActive = Boolean(combat.active && combat.inBossFight)
  return <div className={`screen-content combat-screen combat-ambient-screen${bossActive ? ' is-boss-active' : ''}`}><CombatAmbientBackdrop combatActive={combat.active} bossActive={bossActive} /><div className="screen-header"><div><div className="eyebrow">ARCANE COMBAT</div><h1>Combat</h1><p>Read enemy intent, manage Mana, and control your Spell automation independently of Tower staffing.</p></div></div><CombatRunBar selectedCombatLocationId={selectedCombatLocationId} onRequestLeave={requestLeave} /><CombatWorldNavigation onSelectLocation={selectLocation} onEnterLocation={enterLocation} onHuntTarget={huntTarget} onBestiary={openLocationBestiary} onReturnToCombat={returnToCombat} /><ScreenGrid screen="combat" panels={[{ id: 'combat-stage', content: <CombatStage selectedCombatLocationId={selectedCombatLocationId} bossActive={bossActive} enemyCardRef={enemyCardRef} onOpenEnemyContext={openEnemyContext} /> }, { id: 'combat-spell-deck', content: <CombatSpellDeck /> }, { id: 'combat-analytics', content: <CombatAnalyticsPanel /> }]} />{enemyContextMode && <EnemyContextWindow mode={enemyContextMode} anchorRef={enemyCardRef} triggerRef={enemyContextTriggerRef} selectedCombatLocationId={selectedCombatLocationId} onModeChange={setEnemyContextMode} onClose={closeEnemyContext} />}</div>
}

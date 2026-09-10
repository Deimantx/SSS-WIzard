import { useCallback, useEffect, useRef, useState } from 'react'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import type { DungeonId } from '../../game/types'
import { MONSTERS } from '../../game/content/monsters'
import { useGameStore } from '../../store/gameStore'
import { CombatActNavigationDialog } from './navigation/CombatActNavigationDialog'
import { dungeonHasMeaningfulProgress, getFirstUnlockedDungeon } from './navigation/combatActNavigationReadModel'
import { CombatRunBar } from './CombatRunBar'
import { CombatSpellDeck } from './CombatSpellDeck'
import { CombatStage } from './CombatStage'
import { CombatAnalyticsPanel } from './CombatAnalyticsPanel'
import { EnemyContextWindow, type EnemyContextMode } from './EnemyContextWindow'
import { LeaveDungeonDialog } from './LeaveDungeonDialog'
import { getAdaptiveCombatLayout } from './combatLayout'
import { useCombatDefeatStore } from '../../game/ui/combatDefeatStore'
import { isBossMonster } from '../../game/content/monsters'
import { CombatAmbientBackdrop } from './CombatAmbientBackdrop'
import { useNavigationIntent } from '../../ui/navigation/navigationIntent'

export function CombatScreenV2() {
  const combatDungeonId = useGameStore((state) => state.combat.dungeonId)
  const combatActive = useGameStore((state) => state.combat.active)
  const combatEnemyId = useGameStore((state) => state.combat.enemyId)
  const firstUnlockedDungeon = useGameStore((state) => getFirstUnlockedDungeon(state.progress))
  const [selectedDungeonId, setSelectedDungeonId] = useState<DungeonId>(() => combatDungeonId ?? firstUnlockedDungeon)
  const navigationIntent = useNavigationIntent()
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [enemyContextMode, setEnemyContextMode] = useState<EnemyContextMode | null>(null)
  const enemyCardRef = useRef<HTMLElement>(null)
  const enemyContextTriggerRef = useRef<HTMLElement>(null)
  const [deckRequiredRows, setDeckRequiredRows] = useState(0)
  const defeatSnapshot = useCombatDefeatStore((state) => state.snapshot)
  const previousDungeonId = useRef<DungeonId | null>(combatDungeonId)
  useEffect(() => { if (combatDungeonId) setSelectedDungeonId(combatDungeonId) }, [combatDungeonId])
  useEffect(() => { if (!combatActive && navigationIntent.combatDungeonId) setSelectedDungeonId(navigationIntent.combatDungeonId) }, [combatActive, navigationIntent.combatDungeonId])
  const openCampaign = useCallback(() => { dismissGameTooltips(); setCampaignOpen(true) }, [])
  const closeCampaign = useCallback(() => setCampaignOpen(false), [])
  const closeLeave = useCallback(() => setLeaveOpen(false), [])
  const closeEnemyContext = useCallback(() => setEnemyContextMode(null), [])
  const openEnemyContext = useCallback((trigger: HTMLElement, mode: EnemyContextMode = 'intel') => {
    dismissGameTooltips()
    const currentCombat = useGameStore.getState().combat
    if (!currentCombat.active || !currentCombat.enemyId || !MONSTERS[currentCombat.enemyId]) return
    if (enemyContextMode && enemyContextTriggerRef.current === trigger) { setEnemyContextMode(null); return }
    enemyContextTriggerRef.current = trigger
    setEnemyContextMode(mode)
  }, [enemyContextMode])
  useEffect(() => { if (!combatActive) setEnemyContextMode(null) }, [combatActive])
  const previousEnemyId = useRef(combatEnemyId)
  useEffect(() => {
    if (enemyContextMode && combatEnemyId !== previousEnemyId.current) setEnemyContextMode(combatActive && combatEnemyId ? 'intel' : null)
    previousEnemyId.current = combatEnemyId
  }, [combatActive, combatEnemyId, enemyContextMode])
  useEffect(() => {
    const dungeonChanged = previousDungeonId.current !== combatDungeonId
    if (!combatActive || dungeonChanged) {
      setDeckRequiredRows(0)
    }
    previousDungeonId.current = combatDungeonId
  }, [combatActive, combatDungeonId])
  const requestLeave = useCallback(() => {
    dismissGameTooltips()
    const currentCombat = useGameStore.getState().combat
    if (dungeonHasMeaningfulProgress(currentCombat)) setLeaveOpen(true)
    else useGameStore.getState().leaveDungeon()
  }, [])
  const reportDeckRequiredRows = useCallback((rows: number) => setDeckRequiredRows((current) => current === rows ? current : rows), [])
  const layoutTransform = useCallback((layout: Parameters<typeof getAdaptiveCombatLayout>[0]) => getAdaptiveCombatLayout(layout, { requiredDeckRows: deckRequiredRows }), [deckRequiredRows])
  useEffect(() => { if (defeatSnapshot) { setEnemyContextMode(null); setCampaignOpen(false); setLeaveOpen(false) } }, [defeatSnapshot])
  const bossActive = Boolean(combatActive && combatEnemyId && isBossMonster(MONSTERS[combatEnemyId]))
  return <div className={`screen-content combat-screen combat-ambient-screen${bossActive ? ' is-boss-active' : ''}`}><CombatAmbientBackdrop combatActive={combatActive} bossActive={bossActive} /><div className="screen-header"><div><div className="eyebrow">ARCANE COMBAT</div><h1>Combat</h1><p>Read enemy intent, manage Mana, and control your Spell automation.</p></div></div><CombatRunBar selectedDungeonId={selectedDungeonId} onOpenCampaign={openCampaign} onRequestLeave={requestLeave} /><EditableGrid screen="combat" layoutTransform={layoutTransform} panels={[{ id: 'combat-stage', content: <CombatStage selectedDungeonId={selectedDungeonId} enemyCardRef={enemyCardRef} onOpenEnemyContext={openEnemyContext} /> }, { id: 'combat-spell-deck', content: <CombatSpellDeck onRequiredRowsChange={reportDeckRequiredRows} /> }, { id: 'combat-analytics', content: <CombatAnalyticsPanel /> }]} />{enemyContextMode && <EnemyContextWindow mode={enemyContextMode} anchorRef={enemyCardRef} triggerRef={enemyContextTriggerRef} selectedDungeonId={selectedDungeonId} onModeChange={setEnemyContextMode} onClose={closeEnemyContext} />}{campaignOpen && <CombatActNavigationDialog selectedDungeonId={selectedDungeonId} onSelect={setSelectedDungeonId} onClose={closeCampaign} />}{leaveOpen && <LeaveDungeonDialog onClose={closeLeave} />}</div>
}

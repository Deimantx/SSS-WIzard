import { useCallback, useEffect, useRef, useState } from 'react'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import type { DungeonId } from '../../game/types'
import { MONSTERS } from '../../game/content/monsters'
import { useGameStore } from '../../store/gameStore'
import { DungeonAtlasDialog, dungeonHasMeaningfulProgress, getFirstUnlockedDungeon } from './DungeonAtlasDialog'
import { CombatRunBar } from './CombatRunBar'
import { CombatSpellDeck } from './CombatSpellDeck'
import { CombatStage } from './CombatStage'
import { CombatDetailsPanel } from './CombatDetailsPanel'
import { EnemyContextWindow, type EnemyContextMode } from './EnemyContextWindow'
import { LeaveDungeonDialog } from './LeaveDungeonDialog'
import { getAdaptiveCombatLayout } from './combatLayout'

export function CombatScreenV2() {
  const combatDungeonId = useGameStore((state) => state.combat.dungeonId)
  const progress = useGameStore((state) => state.progress)
  const combat = useGameStore((state) => state.combat)
  const [selectedDungeonId, setSelectedDungeonId] = useState<DungeonId>(() => combatDungeonId ?? getFirstUnlockedDungeon(progress))
  const [atlasOpen, setAtlasOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [enemyContextMode, setEnemyContextMode] = useState<EnemyContextMode | null>(null)
  const enemyCardRef = useRef<HTMLElement>(null)
  const enemyContextTriggerRef = useRef<HTMLButtonElement>(null)
  const [stageContentHeight, setStageContentHeight] = useState(0)
  const [deckContentHeight, setDeckContentHeight] = useState(0)
  useEffect(() => { if (combatDungeonId) setSelectedDungeonId(combatDungeonId) }, [combatDungeonId])
  const openAtlas = useCallback(() => { dismissGameTooltips(); setAtlasOpen(true) }, [])
  const closeAtlas = useCallback(() => setAtlasOpen(false), [])
  const closeLeave = useCallback(() => setLeaveOpen(false), [])
  const closeEnemyContext = useCallback(() => setEnemyContextMode(null), [])
  const openEnemyContext = useCallback((mode: EnemyContextMode, trigger: HTMLButtonElement) => {
    dismissGameTooltips()
    const currentCombat = useGameStore.getState().combat
    if (!currentCombat.active || !currentCombat.enemyId || !MONSTERS[currentCombat.enemyId]) return
    if (enemyContextMode === mode && enemyContextTriggerRef.current === trigger) { setEnemyContextMode(null); return }
    enemyContextTriggerRef.current = trigger
    setEnemyContextMode(mode)
  }, [enemyContextMode])
  useEffect(() => { if (!combat.active) setEnemyContextMode(null) }, [combat.active])
  const requestLeave = useCallback(() => { dismissGameTooltips(); if (dungeonHasMeaningfulProgress(combat)) setLeaveOpen(true); else useGameStore.getState().leaveDungeon() }, [combat])
  const reportStageContentHeight = useCallback((height: number) => setStageContentHeight((current) => current === height ? current : height), [])
  const reportDeckContentHeight = useCallback((height: number) => setDeckContentHeight((current) => current === height ? current : height), [])
  const layoutTransform = useCallback((layout: Parameters<typeof getAdaptiveCombatLayout>[0]) => getAdaptiveCombatLayout(layout, { requiredStageContentHeight: stageContentHeight, requiredDeckContentHeight: deckContentHeight }), [deckContentHeight, stageContentHeight])
  return <div className="screen-content combat-screen"><div className="screen-header"><div><div className="eyebrow">ARCANE COMBAT</div><h1>Combat</h1><p>Read enemy intent, manage Mana, and control your Spell automation.</p></div></div><CombatRunBar selectedDungeonId={selectedDungeonId} onOpenAtlas={openAtlas} onRequestLeave={requestLeave} /><EditableGrid screen="combat" layoutTransform={layoutTransform} panels={[{ id: 'combat-stage', content: <CombatStage selectedDungeonId={selectedDungeonId} onContentHeightChange={reportStageContentHeight} enemyCardRef={enemyCardRef} onOpenEnemyContext={openEnemyContext} /> }, { id: 'combat-spell-deck', content: <CombatSpellDeck onRequiredHeightChange={reportDeckContentHeight} /> }, { id: 'combat-details', content: <CombatDetailsPanel /> }]} />{enemyContextMode && <EnemyContextWindow mode={enemyContextMode} anchorRef={enemyCardRef} triggerRef={enemyContextTriggerRef} selectedDungeonId={selectedDungeonId} onModeChange={setEnemyContextMode} onClose={closeEnemyContext} />}{atlasOpen && <DungeonAtlasDialog selectedDungeonId={selectedDungeonId} onSelect={setSelectedDungeonId} onClose={closeAtlas} />}{leaveOpen && <LeaveDungeonDialog onClose={closeLeave} />}</div>
}

import { useCallback, useEffect, useState } from 'react'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import type { DungeonId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DungeonAtlasDialog, dungeonHasMeaningfulProgress, getFirstUnlockedDungeon } from './DungeonAtlasDialog'
import { CombatIntelPanel } from './CombatIntelPanel'
import { CombatRunBar } from './CombatRunBar'
import { CombatSpellDeck } from './CombatSpellDeck'
import { CombatStage } from './CombatStage'
import { LeaveDungeonDialog } from './LeaveDungeonDialog'
import { getAdaptiveCombatLayout } from './combatLayout'

export function CombatScreenV2() {
  const combatDungeonId = useGameStore((state) => state.combat.dungeonId)
  const progress = useGameStore((state) => state.progress)
  const combat = useGameStore((state) => state.combat)
  const [selectedDungeonId, setSelectedDungeonId] = useState<DungeonId>(() => combatDungeonId ?? getFirstUnlockedDungeon(progress))
  const [atlasOpen, setAtlasOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [stageContentHeight, setStageContentHeight] = useState(0)
  useEffect(() => { if (combatDungeonId) setSelectedDungeonId(combatDungeonId) }, [combatDungeonId])
  const openAtlas = useCallback(() => { dismissGameTooltips(); setAtlasOpen(true) }, [])
  const closeAtlas = useCallback(() => setAtlasOpen(false), [])
  const closeLeave = useCallback(() => setLeaveOpen(false), [])
  const requestLeave = useCallback(() => { dismissGameTooltips(); if (dungeonHasMeaningfulProgress(combat)) setLeaveOpen(true); else useGameStore.getState().leaveDungeon() }, [combat])
  const reportStageContentHeight = useCallback((height: number) => setStageContentHeight((current) => current === height ? current : height), [])
  const layoutTransform = useCallback((layout: Parameters<typeof getAdaptiveCombatLayout>[0]) => getAdaptiveCombatLayout(layout, stageContentHeight), [stageContentHeight])
  return <div className="screen-content combat-screen"><div className="screen-header"><div><div className="eyebrow">ARCANE COMBAT</div><h1>Combat</h1><p>Read enemy intent, manage Mana, and control your Spell automation.</p></div></div><CombatRunBar selectedDungeonId={selectedDungeonId} onOpenAtlas={openAtlas} onRequestLeave={requestLeave} /><EditableGrid screen="combat" layoutTransform={layoutTransform} panels={[{ id: 'combat-stage', content: <CombatStage selectedDungeonId={selectedDungeonId} onContentHeightChange={reportStageContentHeight} /> }, { id: 'combat-spell-deck', content: <CombatSpellDeck /> }, { id: 'combat-intel', content: <CombatIntelPanel selectedDungeonId={selectedDungeonId} /> }]} />{atlasOpen && <DungeonAtlasDialog selectedDungeonId={selectedDungeonId} onSelect={setSelectedDungeonId} onClose={closeAtlas} />}{leaveOpen && <LeaveDungeonDialog onClose={closeLeave} />}</div>
}

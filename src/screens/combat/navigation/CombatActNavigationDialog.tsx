import { Route, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, ModalPortal, Status } from '../../../components/ui'
import { dismissGameTooltips } from '../../../components/ui/tooltip/Tooltip'
import { emitGameFeelEvent } from '../../../ui/game-feel/gameFeelStore'
import { setNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { useGameStore } from '../../../store/gameStore'
import { CombatActSelector } from './CombatActSelector'
import { CombatActTree } from './CombatActTree'
import { CombatAreaInspector } from './CombatAreaInspector'
import { CombatAreaLootModal } from './CombatAreaLootModal'
import { buildCombatActNavigationViewModel, getDefaultCombatActId, getDefaultCombatActNodeId } from './combatActNavigationReadModel'
import type { CombatActId } from './combatActNavigationTypes'
import type { DungeonId } from '../../../game/types'

export function CombatActNavigationDialog({ selectedDungeonId, onSelect, onClose }: { selectedDungeonId: DungeonId; onSelect: (id: DungeonId) => void; onClose: () => void }) {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const enter = useGameStore((state) => state.enterDungeon)
  const setScreen = useGameStore((state) => state.setScreen)
  const defaultActId = getDefaultCombatActId(progress, combat)
  const [selectedActId, setSelectedActId] = useState<CombatActId>(defaultActId)
  const [selectedNodeId, setSelectedNodeId] = useState(() => getDefaultCombatActNodeId(defaultActId, progress, combat, selectedDungeonId))
  const [lootNodeId, setLootNodeId] = useState<string | null>(null)
  const viewModel = useMemo(() => buildCombatActNavigationViewModel({ progress, combat, selectedDungeonId, selectedActId, selectedNodeId }), [combat, progress, selectedActId, selectedDungeonId, selectedNodeId])
  const selectedNode = viewModel.selectedNode
  const lootNode = lootNodeId ? viewModel.selectedAct.nodes.find((node) => node.id === lootNodeId) ?? null : null

  useEffect(() => {
    if (!viewModel.acts.some((act) => act.id === selectedActId)) {
      const nextAct = getDefaultCombatActId(progress, combat)
      setSelectedActId(nextAct)
      setSelectedNodeId(getDefaultCombatActNodeId(nextAct, progress, combat, selectedDungeonId))
    }
  }, [combat, progress, selectedActId, selectedDungeonId, viewModel.acts])

  const selectAct = (actId: CombatActId) => {
    if (actId === selectedActId) return
    setSelectedActId(actId)
    setSelectedNodeId(getDefaultCombatActNodeId(actId, progress, combat, selectedDungeonId))
    setLootNodeId(null)
  }
  const emitNavigationFeedback = (type: 'error' | 'success', color: string) => emitGameFeelEvent({ type, x: typeof window === 'undefined' ? 0 : window.innerWidth * 0.76, y: typeof window === 'undefined' ? 0 : window.innerHeight * 0.64, color, intensity: type === 'success' ? 1 : 0.76 })
  const handleEnter = (nodeId: string): boolean => {
    const node = viewModel.selectedAct.nodes.find((entry) => entry.id === nodeId)
    if (!node || node.dungeonId === null || node.state === 'prototype' || node.state === 'locked') {
      emitNavigationFeedback('error', 'var(--ui-warning)')
      return false
    }
    if (combat.active) {
      if (combat.dungeonId === node.dungeonId) {
        emitNavigationFeedback('success', 'var(--ui-accent)')
        onClose()
        return true
      }
      emitNavigationFeedback('error', 'var(--ui-warning)')
      return false
    }
    onSelect(node.dungeonId)
    enter(node.dungeonId)
    emitNavigationFeedback('success', 'var(--ui-accent)')
    onClose()
    return true
  }
  const handleBestiary = () => {
    if (!selectedNode.dungeonId) return
    const knownMonster = selectedNode.encounters.find((encounter) => encounter.known && encounter.monsterId)?.monsterId ?? selectedNode.boss?.monsterId ?? null
    setNavigationIntent({ combatDungeonId: selectedNode.dungeonId, combatMonsterId: knownMonster })
    onClose()
    setScreen('bestiary')
  }
  return <ModalPortal open onClose={onClose} backdropClassName="combat-modal-backdrop" surfaceClassName="combat-act-navigation-dialog" ariaLabelledBy="combat-act-navigation-title"><header className="combat-act-navigation-header"><div><span className="combat-subsection-label">CAMPAIGN NAVIGATION</span><h2 id="combat-act-navigation-title">Follow the tower's frontier.</h2><p>Choose an Act, inspect its route, and step into the next encounter.</p></div><Button icon variant="ghost" ariaLabel="Close campaign navigation" onClick={onClose}><X size={17} aria-hidden="true" /></Button></header><CombatActSelector acts={viewModel.acts} selectedActId={viewModel.selectedAct.id} onSelect={selectAct} /><div className="combat-act-navigation-body"><section className="combat-act-tree-panel"><div className="combat-act-tree-head"><div><span className="combat-subsection-label">ACT PROGRESSION</span><h3>{viewModel.selectedAct.title}</h3><p>{viewModel.selectedAct.definition.description}</p></div><Status tone={viewModel.selectedAct.status === 'completed' ? 'success' : 'active'}>{viewModel.selectedAct.statusLabel}</Status></div><CombatActTree act={viewModel.selectedAct} selectedNodeId={selectedNode.id} onSelect={setSelectedNodeId} onEnter={handleEnter} /><div className="combat-act-tree-hint"><Route size={13} aria-hidden="true" /><span>Drag the empty field to pan · select a node to inspect · double-click a playable route to enter</span></div></section><CombatAreaInspector node={selectedNode} combatActive={combat.active} activeDungeonId={combat.dungeonId} onLoot={() => setLootNodeId(selectedNode.id)} onBestiary={handleBestiary} onEnter={() => handleEnter(selectedNode.id)} /></div><footer className="combat-act-navigation-footer"><span>{combat.active ? 'The current run remains active while you browse the campaign.' : 'Act progress is derived from your existing dungeon and boss records.'}</span><Button variant="ghost" onClick={onClose}>CLOSE CAMPAIGN</Button></footer>{lootNode && <CombatAreaLootModal node={lootNode} onClose={() => setLootNodeId(null)} />}</ModalPortal>
}

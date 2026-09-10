import { Card } from '../../components/ui'
import { useEffect, useRef, type Ref } from 'react'
import type { DungeonId } from '../../game/types'
import { pixelsToGridRows } from '../../ui/layout-editor/runtimePanelLayout'
import { useNavigationIntent } from '../../ui/navigation/navigationIntent'
import { CombatFlowPanel } from './CombatFlowPanel'
import { EnemyCombatCard } from './EnemyCombatCard'
import { PlayerCombatCard } from './PlayerCombatCard'

export function CombatStage({ selectedDungeonId, onRequiredRowsChange, enemyCardRef, onOpenEnemyContext, enemyContextOpen = false }: { selectedDungeonId: DungeonId; onRequiredRowsChange?: (rows: number) => void; enemyCardRef?: Ref<HTMLElement>; onOpenEnemyContext?: (trigger: HTMLElement, mode?: 'intel' | 'loot') => void; enemyContextOpen?: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const navigationIntent = useNavigationIntent()
  useEffect(() => {
    if (!onRequiredRowsChange) return
    const node = stageRef.current
    if (!node) return
    let previousRows: number | null = null
    const report = (height: number) => {
      const rows = pixelsToGridRows(Math.ceil(height))
      if (rows === previousRows) return
      previousRows = rows
      onRequiredRowsChange(rows)
    }
    report(node.getBoundingClientRect().height)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => report(entry.contentRect.height))
    observer.observe(node)
    return () => observer.disconnect()
  }, [onRequiredRowsChange, selectedDungeonId])
  return <Card className="combat-stage-panel"><div ref={stageRef} className="combat-stage-grid"><PlayerCombatCard /><CombatFlowPanel selectedDungeonId={selectedDungeonId} /><EnemyCombatCard selectedDungeonId={selectedDungeonId} selectedMonsterId={navigationIntent.combatMonsterId} cardRef={enemyCardRef} onOpenContext={onOpenEnemyContext} contextOpen={enemyContextOpen} /></div></Card>
}

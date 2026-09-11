import { Card } from '../../components/ui'
import { useEffect, useRef, type Ref } from 'react'
import type { DungeonId } from '../../game/types'
import { useNavigationIntent } from '../../ui/navigation/navigationIntent'
import { CombatFlowPanel } from './CombatFlowPanel'
import { EnemyCombatCard } from './EnemyCombatCard'
import { PlayerCombatCard } from './PlayerCombatCard'

export function CombatStage({ selectedDungeonId, onContentHeightChange, enemyCardRef, onOpenEnemyContext, enemyContextOpen = false }: { selectedDungeonId: DungeonId; onContentHeightChange?: (height: number) => void; enemyCardRef?: Ref<HTMLElement>; onOpenEnemyContext?: (trigger: HTMLElement, mode?: 'intel' | 'loot') => void; enemyContextOpen?: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const navigationIntent = useNavigationIntent()
  useEffect(() => {
    if (!onContentHeightChange) return
    const node = stageRef.current
    if (!node) return
    const measure = () => onContentHeightChange(Math.ceil(node.scrollHeight))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [onContentHeightChange, selectedDungeonId])
  return <Card className="combat-stage-panel"><div ref={stageRef} className="combat-stage-grid"><PlayerCombatCard /><CombatFlowPanel selectedDungeonId={selectedDungeonId} /><EnemyCombatCard selectedDungeonId={selectedDungeonId} selectedMonsterId={navigationIntent.combatMonsterId} cardRef={enemyCardRef} onOpenContext={onOpenEnemyContext} contextOpen={enemyContextOpen} /></div></Card>
}

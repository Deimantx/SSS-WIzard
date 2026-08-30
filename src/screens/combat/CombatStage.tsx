import { Card } from '../../components/ui'
import { useEffect, useRef, type Ref } from 'react'
import type { DungeonId } from '../../game/types'
import { CombatIntentPanel } from './CombatIntentPanel'
import { EnemyCombatCard } from './EnemyCombatCard'
import { PlayerCombatCard } from './PlayerCombatCard'
import type { EnemyContextMode } from './EnemyContextWindow'

export function CombatStage({ selectedDungeonId, onContentHeightChange, enemyCardRef, onOpenEnemyContext }: { selectedDungeonId: DungeonId; onContentHeightChange?: (height: number) => void; enemyCardRef?: Ref<HTMLElement>; onOpenEnemyContext?: (mode: EnemyContextMode, trigger: HTMLButtonElement) => void }) {
  const stageRef = useRef<HTMLDivElement>(null)
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
  return <Card className="combat-stage-panel"><div ref={stageRef} className="combat-stage-grid"><PlayerCombatCard /><CombatIntentPanel selectedDungeonId={selectedDungeonId} /><EnemyCombatCard selectedDungeonId={selectedDungeonId} cardRef={enemyCardRef} onOpenContext={onOpenEnemyContext} /></div></Card>
}

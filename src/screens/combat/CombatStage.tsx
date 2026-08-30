import { Card } from '../../components/ui'
import { useEffect, useRef } from 'react'
import type { DungeonId } from '../../game/types'
import { CombatIntentPanel } from './CombatIntentPanel'
import { EnemyCombatCard } from './EnemyCombatCard'
import { PlayerCombatCard } from './PlayerCombatCard'

export function CombatStage({ selectedDungeonId, onContentHeightChange }: { selectedDungeonId: DungeonId; onContentHeightChange?: (height: number) => void }) {
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
  return <Card className="combat-stage-panel"><div ref={stageRef} className="combat-stage-grid"><PlayerCombatCard /><CombatIntentPanel selectedDungeonId={selectedDungeonId} /><EnemyCombatCard selectedDungeonId={selectedDungeonId} /></div></Card>
}

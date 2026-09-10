import { Card } from '../../components/ui'
import type { Ref } from 'react'
import type { DungeonId } from '../../game/types'
import { useNavigationIntent } from '../../ui/navigation/navigationIntent'
import { CombatFlowPanel } from './CombatFlowPanel'
import { EnemyCombatCard } from './EnemyCombatCard'
import { PlayerCombatCard } from './PlayerCombatCard'

export function CombatStage({ selectedDungeonId, enemyCardRef, onOpenEnemyContext, enemyContextOpen = false }: { selectedDungeonId: DungeonId; enemyCardRef?: Ref<HTMLElement>; onOpenEnemyContext?: (trigger: HTMLElement, mode?: 'intel' | 'loot') => void; enemyContextOpen?: boolean }) {
  const navigationIntent = useNavigationIntent()
  return <Card className="combat-stage-panel"><div className="combat-stage-grid"><PlayerCombatCard /><CombatFlowPanel selectedDungeonId={selectedDungeonId} /><EnemyCombatCard selectedDungeonId={selectedDungeonId} selectedMonsterId={navigationIntent.combatMonsterId} cardRef={enemyCardRef} onOpenContext={onOpenEnemyContext} contextOpen={enemyContextOpen} /></div></Card>
}

import { Card } from '../../components/ui'
import { CombatIntentPanel } from './CombatIntentPanel'
import { EnemyCombatCard } from './EnemyCombatCard'
import { PlayerCombatCard } from './PlayerCombatCard'

export function CombatStage() { return <Card title="COMBAT STAGE" className="combat-stage-panel"><div className="combat-stage-grid"><PlayerCombatCard /><CombatIntentPanel /><EnemyCombatCard /></div></Card> }

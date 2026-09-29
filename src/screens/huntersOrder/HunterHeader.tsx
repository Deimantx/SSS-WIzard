import { Compass, Shield, Target } from 'lucide-react'
import { Card } from '../../components/ui'
import { getHunterHeaderPresentation } from '../../game/presentation/huntersOrder/hunterPresentation'
import type { GameState } from '../../game/types'

export function HunterHeader({ state }: { state: GameState }) {
  const data = getHunterHeaderPresentation(state)
  return <Card className="hunter-command-header"><div className="hunter-command-identity"><div className="hunter-command-crest"><Shield size={25} /><Target size={12} /></div><div><span className="hunter-card-kicker"><Compass size={13} /> FIELD ORDER · GLOAMRIDGE DIVISION</span><h1>Hunter’s Order</h1><p>Mark the quarry. Fulfill the contract. Earn your standing.</p><div className="hunter-current-rank"><span>CURRENT RANK</span><strong>{data.currentRank.name}</strong>{data.nextRank && <><i aria-hidden="true">›</i><span>NEXT {data.nextRank.name}</span></>}</div></div></div>
    <div className="hunter-command-metrics"><div><span>REPUTATION</span><strong>{data.reputation.toLocaleString()}<small>{data.nextRank ? ` / ${data.nextRank.reputation.toLocaleString()}` : ' · MASTERED'}</small></strong></div><div><span>HUNTER MARKS</span><strong>{data.marks.toLocaleString()}</strong></div><div><span>CONTRACTS</span><strong>{data.contractsCompleted.toLocaleString()}<small> completed</small></strong></div><div className="hunter-header-progress"><span>RANK PROGRESS <b>{data.progressPercent}%</b></span><div className="hunter-progress-track"><span style={{ width: `${data.progressPercent}%` }} /></div></div></div>
  </Card>
}

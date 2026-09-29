import { Compass, Crown, Eye, Footprints, Medal, Shield, Target } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { getHunterHeaderPresentation } from '../../game/presentation/huntersOrder/hunterPresentation'
import { getHunterContractTargetLabel } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import type { GameState } from '../../game/types'
import type { HuntersOrderScreenTab } from '../../ui/preferences/uiPreferencesTypes'

const rankIcons = { tracker: Footprints, scout: Compass, stalker: Eye, warden: Shield, veteran: Medal, 'master-hunter': Crown } as const

export function HunterHeader({ state, onNavigate }: { state: GameState; onNavigate: (tab: HuntersOrderScreenTab) => void }) {
  const data = getHunterHeaderPresentation(state)
  const RankIcon = rankIcons[data.currentRank.id as keyof typeof rankIcons] ?? Target
  const active = data.activeContract
  return <Card className="hunter-command-header">
    <div className="hunter-command-identity"><div className="hunter-command-crest"><Shield size={25} /><Target size={12} /></div><div><span className="hunter-card-kicker"><Compass size={13} /> FIELD ORDER · GLOAMRIDGE DIVISION</span><h1>Hunter’s Order</h1><p>Mark the quarry. Fulfill the contract. Earn your standing.</p><div className="hunter-current-rank"><span className="hunter-rank-emblem"><RankIcon size={15} /></span><span>CURRENT RANK</span><strong>{data.currentRank.name}</strong>{data.nextRank && <><i aria-hidden="true">›</i><span>NEXT {data.nextRank.name}</span></>}</div></div></div>
    <div className="hunter-command-metrics"><div><span>REPUTATION</span><strong>{data.reputation.toLocaleString()}<small>{data.nextRank ? ` / ${data.nextRank.reputation.toLocaleString()}` : ' · MASTERED'}</small></strong></div><div><span>HUNTER MARKS</span><strong>{data.marks.toLocaleString()}</strong></div><div><span>CONTRACTS</span><strong>{data.contractsCompleted.toLocaleString()}<small> completed</small></strong></div><div><span>HUNTER KILLS</span><strong>{data.totalHunterKills.toLocaleString()}</strong></div><div className="hunter-header-progress"><span>RANK PROGRESS <b>{data.progressPercent}%</b></span><div className="hunter-progress-track"><span style={{ width: `${data.progressPercent}%` }} /></div></div>
      {active && <GameTooltip content="Open the active assignment details on the Contract board."><Button className="hunter-active-micro" variant="ghost" onClick={() => onNavigate('contracts')}><span><b>ACTIVE HUNT</b><strong>{getHunterContractTargetLabel(active)}</strong></span><span>{active.progress.toLocaleString()} / {active.target.toLocaleString()}</span></Button></GameTooltip>}
    </div>
  </Card>
}

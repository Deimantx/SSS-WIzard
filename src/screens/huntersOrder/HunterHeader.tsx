import { Compass, Crown, Eye, Footprints, Map, Medal, Shield, Target } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { getHunterHeaderPresentation } from '../../game/presentation/huntersOrder/hunterPresentation'
import { getHunterContractTargetLabel } from '../../game/systems/hunters-order/huntersOrderRuntime'
import { DUNGEONS } from '../../game/content/combat-locations/dungeons/dungeons'
import { useGameStore } from '../../store/gameStore'
import { openHunterContractInCombat } from '../../ui/navigation/hunterContractNavigation'
import type { GameState } from '../../game/types'
import type { HuntersOrderScreenTab } from '../../ui/preferences/uiPreferencesTypes'

const rankIcons = { tracker: Footprints, scout: Compass, stalker: Eye, warden: Shield, veteran: Medal, 'master-hunter': Crown } as const

export function HunterHeader({ state, onNavigate }: { state: GameState; onNavigate: (tab: HuntersOrderScreenTab) => void }) {
  const data = getHunterHeaderPresentation(state)
  const RankIcon = rankIcons[data.currentRank.id as keyof typeof rankIcons] ?? Target
  const active = data.activeContract
  const groundName = active ? DUNGEONS[active.huntingGroundId ?? 'hunters-ground']?.name ?? 'Hunting Ground' : ''
  const setScreen = useGameStore.getState().setScreen
  return <Card className="hunter-command-header hunter-command-header-v3">
    <div className="hunter-header-v3-main">
      <div className="hunter-command-identity"><div className="hunter-command-crest"><Shield size={25}/><Target size={12}/></div><div><span className="hunter-card-kicker"><Compass size={13}/> HUNTER’S ORDER</span><h1>Hunter’s Order</h1><p>Mark quarry · Fulfill contracts · Earn standing</p></div></div>
      <div className="hunter-header-standing"><div><span className="hunter-rank-emblem"><RankIcon size={15}/></span><small>CURRENT STANDING</small><strong>{data.currentStanding.name}</strong></div><div><small>NEXT STANDING</small><strong>{data.nextStanding?.name ?? 'ORDER CAP'}</strong></div><div className="hunter-standing-progress"><span>{data.progressPercent}%</span><div className="hunter-progress-track"><span style={{ width: `${data.progressPercent}%` }}/></div><small>{data.remaining.toLocaleString()} REP TO NEXT</small></div></div>
      <div className="hunter-command-metrics"><div><span>REPUTATION</span><strong>{data.reputation.toLocaleString()}<small>{data.nextStanding ? ` / ${data.nextStanding.reputation.toLocaleString()}` : ' · MAX'}</small></strong></div><div><span>HUNTER MARKS</span><strong>{data.marks.toLocaleString()}</strong></div><div><span>CONTRACTS COMPLETED</span><strong>{data.contractsCompleted.toLocaleString()}</strong></div><div><span>HUNTER KILLS</span><strong>{data.totalHunterKills.toLocaleString()}</strong></div></div>
    </div>
    {active && <div className="hunter-active-micro-v3"><div><span>ACTIVE HUNT · {groundName.toUpperCase()}</span><strong>{getHunterContractTargetLabel(active)}</strong></div><span className="hunter-active-micro-progress">{active.progress.toLocaleString()} / {active.target.toLocaleString()} <small>· {Math.max(0, active.target - active.progress).toLocaleString()} remaining</small></span><GameTooltip content="Open the active Contract Board details."><Button variant="ghost" onClick={() => onNavigate('contracts')}>OPEN CONTRACT</Button></GameTooltip><GameTooltip content={`Open Combat at ${groundName}; Hunt Target remains a separate action.`}><Button variant="primary" onClick={() => openHunterContractInCombat(state, setScreen)}><Map size={14}/> OPEN GROUND</Button></GameTooltip></div>}
  </Card>
}

import { Button, Card, GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { getPreparedResearchCount, getResearchEchoCapacity, getResearchEchoesAssigned, getResearchFocusReserved, getResearchJob } from '../../../game/systems/research/researchSelectors'
import { RESEARCH_SLOT_ORDER } from '../../../game/systems/research/researchReservations'
import { formatNumber } from '../../../game/utils'
import { BALANCE } from '../../../game/core/balance/balance'
import { useGameStore } from '../../../store/gameStore'
import { PreparedResearchRow } from './PreparedResearchRow'
import { useRef } from 'react'
import { useSmartScrollState } from '../../../ui/game-feel/useSmartScrollState'

export function PreparedResearch() {
  const state = useGameStore()
  const count = getPreparedResearchCount(state)
  const echoes = getResearchEchoesAssigned(state)
  const capacity = getResearchEchoCapacity(state)
  const clearEchoes = state.clearResearchEchoes
  const clearPrepared = state.clearPreparedResearch
  const preparedListRef = useRef<HTMLDivElement>(null)
  useSmartScrollState(preparedListRef, { dependencies: [count, RESEARCH_SLOT_ORDER.map((slotId) => getResearchJob(state, slotId)?.itemId ?? '').join('|')] })
  return <Card className="research-prepared" title="PREPARED RESEARCH" action={<span className="research-prepared-summary">ITEM SLOTS {count} / {BALANCE.research.maxPreparedSlots} &middot; ECHOES {echoes} / {capacity} &middot; FOCUS {formatNumber(getResearchFocusReserved(state))}</span>}>
    <div className="research-prepared-header"><div><span className="eyebrow">RESEARCH ECHO POOL</span><strong>{echoes} / {capacity} assigned</strong></div><GameTooltip content={<TooltipContent title="Research Echo pool" description={`${BALANCE.research.echoFocusCost} Focus per assigned Echo. Echoes can be distributed across all prepared batches.`} />} accent="focus"><div className="research-echo-pips" aria-label={`${echoes} of ${capacity} Research Echoes assigned`}>{Array.from({ length: Math.min(BALANCE.research.maxEchoes, capacity), }, (_, index) => <i className={index < echoes ? 'filled' : ''} key={index} />)}</div></GameTooltip><div className="research-prepared-actions">{echoes > 0 && <GameTooltip content={<TooltipContent title="Clear Research Echoes" description="Release all Research Echoes. Prepared items and progress are preserved." />}><Button variant="ghost" onClick={clearEchoes}>CLEAR ECHOES</Button></GameTooltip>}{count > 0 && <GameTooltip content={<TooltipContent title="Clear prepared Research" description="Remove all prepared batches. Unconsumed items become available again; partial progress is lost." />}><Button variant="ghost" onClick={clearPrepared}>CLEAR</Button></GameTooltip>}</div></div>
    {count === 0 ? <div className="empty-state small"><strong>NO RESEARCH PREPARED</strong><span>Choose an item above, select a target school and quantity, then press Prepare.</span></div> : <div ref={preparedListRef} className="prepared-research-list smart-scroll-region">{RESEARCH_SLOT_ORDER.map((slotId) => getResearchJob(state, slotId) ? <PreparedResearchRow key={slotId} slotId={slotId} /> : null)}</div>}
  </Card>
}

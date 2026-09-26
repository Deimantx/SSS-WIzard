import { Button, Card, GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { getPreparedResearchCount, getResearchAssignOneEachState, getResearchAcolyteCapacity, getResearchAcolytesAssigned, getResearchJob } from '../../../game/systems/research/researchSelectors'
import { RESEARCH_SLOT_ORDER } from '../../../game/systems/research/researchReservations'
import { formatNumber } from '../../../game/utils'
import { BALANCE } from '../../../game/core/balance/balance'
import { useGameStore } from '../../../store/gameStore'
import { PreparedResearchRow } from './PreparedResearchRow'
import { useEffect, useRef, useState } from 'react'
import { useSmartScrollState } from '../../../ui/game-feel/useSmartScrollState'
import type { ResearchSlotId } from '../../../game/types'

export function PreparedResearch() {
  const state = useGameStore()
  const count = getPreparedResearchCount(state)
  const acolytes = getResearchAcolytesAssigned(state)
  const capacity = getResearchAcolyteCapacity(state)
  const clearAcolytes = state.clearResearchAcolytes
  const clearPrepared = state.clearPreparedResearch
  const assignOneEach = state.assignOneResearchAcolyteEach
  const bulkAssignment = getResearchAssignOneEachState(state)
  const [expandedSlotId, setExpandedSlotId] = useState<ResearchSlotId | null>(null)
  const bulkTooltip = bulkAssignment.blockedReason === 'no-targets'
    ? 'No prepared Research batch can currently accept an Acolyte.'
    : bulkAssignment.blockedReason === 'acolyte-capacity'
      ? `Not enough Acolytes for every batch. Need ${bulkAssignment.targetCount} workers; ${bulkAssignment.freeAcolyteSlots} are available.`
      : `Assign one Research Acolyte to each of ${bulkAssignment.targetCount} eligible prepared batches.`
  const preparedListRef = useRef<HTMLDivElement>(null)
  useSmartScrollState(preparedListRef, { dependencies: [count, RESEARCH_SLOT_ORDER.map((slotId) => getResearchJob(state, slotId)?.itemId ?? '').join('|')] })
  useEffect(() => {
    if (expandedSlotId && !getResearchJob(state, expandedSlotId)) setExpandedSlotId(null)
  }, [expandedSlotId, state])
  return <Card className="research-prepared" title="PREPARED RESEARCH">
    <div className="research-prepared-header"><div className="research-prepared-overview"><div className="research-prepared-batch-summary"><span className="eyebrow">BATCHES</span><strong>{count} / {BALANCE.research.maxPreparedSlots}</strong></div><GameTooltip content={<TooltipContent title="Research Acolytes" description="Acolytes are shared across Research, Transmutation, and Channeling." />} accent="focus"><div className="research-acolyte-summary"><div className="research-acolyte-pips" aria-label={`${acolytes} Research Acolytes assigned`}>{Array.from({ length: Math.min(BALANCE.research.maxPreparedSlots, capacity), }, (_, index) => <i className={index < acolytes ? 'filled' : ''} key={index} />)}</div><strong>{acolytes} ACOLYTES</strong></div></GameTooltip></div><div className="research-prepared-actions">{count > 0 && <GameTooltip content={<TooltipContent title="Assign one Acolyte each" description={bulkTooltip} />} accent={bulkAssignment.canAssign ? 'focus' : 'warning'}><Button variant="ghost" onClick={assignOneEach} disabled={!bulkAssignment.canAssign}>ASSIGN 1 EACH</Button></GameTooltip>}{acolytes > 0 && <GameTooltip content={<TooltipContent title="Clear Research Acolytes" description="Release all Research Acolytes. Prepared items and progress are preserved." />}><Button variant="ghost" onClick={clearAcolytes}>CLEAR ACOLYTES</Button></GameTooltip>}{count > 0 && <GameTooltip content={<TooltipContent title="Clear prepared Research" description="Remove all prepared batches. Unconsumed items become available again; partial progress is lost." />}><Button variant="ghost" onClick={clearPrepared}>CLEAR</Button></GameTooltip>}</div></div>
    {count === 0 ? <div className="empty-state small"><strong>NO RESEARCH PREPARED</strong><span>Choose an item above, select a target school and quantity, then press Prepare.</span></div> : <div ref={preparedListRef} className="prepared-research-list smart-scroll-region">{RESEARCH_SLOT_ORDER.map((slotId) => getResearchJob(state, slotId) ? <PreparedResearchRow key={slotId} slotId={slotId} expanded={expandedSlotId === slotId} onToggleExpanded={() => setExpandedSlotId((current) => current === slotId ? null : slotId)} /> : null)}</div>}
  </Card>
}

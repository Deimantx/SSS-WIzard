import { Minus, Plus, X } from 'lucide-react'
import { Button, GameTooltip, Progress, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { SCHOOLS } from '../../../game/content/schools/schools'
import { ITEMS } from '../../../game/content/items/items'
import { BALANCE } from '../../../game/core/balance/balance'
import { getResearchBatchEtaMs, getResearchEchoCapacity, getResearchEchoesAssigned, getResearchEchoFocusCost, getResearchItemsPerHour, getResearchJobProgressPercent, getResearchJobStatus, getResearchManaPerSecond, getResearchXpPerHour, getResearchJobXpPerItem } from '../../../game/systems/research/researchSelectors'
import type { ResearchJobStatus, ResearchSlotId } from '../../../game/types'
import { formatCompactDuration, formatNumber, formatSignedRate } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'

const statusHelp: Record<ResearchJobStatus, string> = {
  prepared: 'Prepared and waiting for a Research Echo.',
  running: 'Research is progressing at the assigned Echo speed.',
  'waiting-mana': 'A completed cycle is ready, but this batch needs more Mana.',
  'level-cap': 'The target Magic School is at its current cap. Progress and items are preserved.',
  protected: 'The item is protected. Unprotect it before assigning Echoes.',
  'missing-item': 'The reserved item is no longer available in inventory.',
}

export function PreparedResearchRow({ slotId }: { slotId: ResearchSlotId }) {
  const state = useGameStore()
  const job = state.activities.research.slots[slotId]
  const removeEcho = state.removeResearchEcho
  const addEcho = state.assignResearchEcho
  const removeJob = state.removePreparedResearch
  if (!job) return null
  const status = getResearchJobStatus(state, slotId)
  const echoes = Math.max(0, Math.floor(job.echoesAssigned))
  const capacity = getResearchEchoCapacity(state)
  const totalEchoes = getResearchEchoesAssigned(state)
  const canAdd = status !== 'level-cap' && status !== 'protected' && status !== 'missing-item' && totalEchoes < capacity
  const statusLabel = status.replace('-', ' ').toUpperCase()
  const eta = status === 'waiting-mana' || status === 'level-cap' || status === 'protected' || status === 'missing-item' ? null : getResearchBatchEtaMs(job)
  const canRemove = <TooltipContent title="Remove prepared batch" description="Unconsumed items become available again. Partial Research progress is lost." />
  const echoHelp = canAdd ? `Each Research Echo reserves ${getResearchEchoFocusCost()} Focus and adds another 1x base speed.` : status === 'level-cap' ? 'Increase the target school cap before assigning Echoes.' : totalEchoes >= capacity ? `Research Echo pool is full: ${capacity} / ${capacity}.` : 'This batch is blocked until its item is available.'
  const statusDescription = status === 'empty' ? 'This prepared batch has no remaining items.' : statusHelp[status]
  return <div className={`prepared-research-row status-${status}`}>
    <div className="prepared-research-main"><ItemIcon itemId={job.itemId} size="tiny" /><div className="prepared-research-copy"><strong>{ITEMS[job.itemId]?.name ?? job.itemId} &rarr; {SCHOOLS[job.targetSchoolId]?.name ?? job.targetSchoolId}</strong><GameTooltip content={<TooltipContent title={statusLabel} description={statusDescription} />} accent={status === 'running' || status === 'prepared' ? 'neutral' : 'warning'}><Status tone={status === 'running' ? 'active' : status === 'waiting-mana' || status === 'level-cap' || status === 'protected' || status === 'missing-item' ? 'warning' : 'neutral'}>{statusLabel}</Status></GameTooltip></div><div className="prepared-research-echo-control"><GameTooltip content="Remove one Research Echo. Progress is preserved." accent="focus"><Button variant="ghost" ariaLabel={`Remove Research Echo from ${ITEMS[job.itemId]?.name ?? job.itemId}`} onClick={() => removeEcho(slotId)} disabled={echoes <= 0}><Minus size={12} /></Button></GameTooltip><strong>{echoes}</strong><GameTooltip content={<TooltipContent title="Assign Research Echo" description={echoHelp} />} accent={canAdd ? 'focus' : 'warning'}><Button variant="secondary" ariaLabel={`Assign Research Echo to ${ITEMS[job.itemId]?.name ?? job.itemId}`} onClick={() => addEcho(slotId)} disabled={!canAdd}><Plus size={12} /></Button></GameTooltip></div><GameTooltip content={canRemove} accent="warning"><Button variant="ghost" className="prepared-research-remove" ariaLabel="Remove prepared Research batch" onClick={() => removeJob(slotId)}><X size={13} /></Button></GameTooltip></div>
    <div className="prepared-research-context"><span>{formatNumber(job.remainingQuantity)} remaining</span><span>{eta === null ? 'ETA —' : `ETA ${formatCompactDuration(eta)}`}</span><GameTooltip content={<TooltipContent title="Research Focus" description={`${getResearchEchoFocusCost()} Focus is reserved for each assigned Research Echo.`} />} accent="focus"><span>Focus {formatNumber(echoes * getResearchEchoFocusCost())}</span></GameTooltip></div>
    <Progress value={getResearchJobProgressPercent(state, slotId)} tone="violet" label={`${Math.round(Math.min(100, Math.max(0, job.progressMs / BALANCE.research.durationPerItemMs * 100)))}% current cycle`} right={status === 'running' ? `${formatNumber(getResearchXpPerHour(job))} XP/h` : statusLabel} />
    <div className="prepared-research-metrics"><span>Items/h <strong>{formatNumber(getResearchItemsPerHour(job))}</strong></span><span>Mana <strong>{formatSignedRate(-getResearchManaPerSecond(job))}</strong></span><span>XP remaining <strong>{formatNumber(job.remainingQuantity * getResearchJobXpPerItem(job))}</strong></span></div>
  </div>
}

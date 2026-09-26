import { BookOpen, ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Button, GameTooltip, Progress, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { SCHOOLS } from '../../../game/content/schools/schools'
import { ITEMS } from '../../../game/content/items/items'
import { getResearchBatchEtaMs, getResearchFluxPerSecond, getResearchItemsPerHour, getResearchJob, getResearchJobProgressPercent, getResearchJobStatus, getResearchNextLevelEtaMs, getResearchXpPerHour } from '../../../game/systems/research/researchSelectors'
import { selectFreeAcolytes, selectTotalAcolytes } from '../../../game/systems/acolytes'
import { getSchoolProgressInfo } from '../../../game/systems/schools'
import type { ResearchJobStatus, ResearchSlotId } from '../../../game/types'
import { formatCompactDuration, formatNumber } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'
import { useGameContextMenu } from '../../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { formatResourceRate } from '../../../game/presentation/resources/resourcePresentation'
import { PreparedResearchRowDetails } from './PreparedResearchRowDetails'

const statusHelp: Record<ResearchJobStatus, string> = {
  prepared: 'Prepared and waiting for a Research Acolyte.',
  running: 'Research is progressing with its assigned Acolyte.',
  'flux-limited': 'Arcane Flux supply is limiting Research speed; funded work continues.',
  'waiting-flux': 'Waiting for Arcane Flux to fund Research work.',
  'mana-limited': 'Legacy status; Arcane Flux is now the Research funding resource.',
  'waiting-mana': 'Legacy status; waiting for Arcane Flux to fund Research work.',
  'level-cap': 'The target Magic School is at its current cap. Progress and items are preserved.',
  protected: 'The item is protected. Unprotect it before assigning an Acolyte.',
  'missing-item': 'The reserved item is no longer available in inventory.',
}

export function PreparedResearchRow({ slotId, expanded, onToggleExpanded }: { slotId: ResearchSlotId; expanded: boolean; onToggleExpanded: () => void }) {
  const state = useGameStore()
  const job = getResearchJob(state, slotId)
  const { openContextMenu } = useGameContextMenu()
  if (!job) return null
  const status = getResearchJobStatus(state, slotId)
  const acolytes = job.acolyteAssigned ? 1 : 0
  const freeAcolytes = selectFreeAcolytes(state)
  const totalAcolytes = selectTotalAcolytes(state)
  const canAdd = status !== 'level-cap' && status !== 'protected' && status !== 'missing-item' && freeAcolytes > 0
  const statusLabel = status.replace('-', ' ').toUpperCase()
  const eta = status === 'flux-limited' || status === 'waiting-flux' || status === 'mana-limited' || status === 'waiting-mana' || status === 'level-cap' || status === 'protected' || status === 'missing-item' ? null : getResearchBatchEtaMs(job)
  const schoolProgress = getSchoolProgressInfo(state, job.targetSchoolId)
  const nextLevelEta = getResearchNextLevelEtaMs(state, slotId)
  const nextLevelText = schoolProgress.atCap ? 'CAP' : nextLevelEta.beyondBatch ? 'BEYOND BATCH' : nextLevelEta.etaMs === null ? '—' : formatCompactDuration(nextLevelEta.etaMs)
  const itemProgress = getResearchJobProgressPercent(state, slotId)
  const schoolProgressPercent = Math.round(Math.min(100, Math.max(0, schoolProgress.progress * 100)))
  const schoolProgressLabel = schoolProgress.atCap ? 'CAP' : `${schoolProgressPercent}%`
  const statusDescription = status === 'empty' ? 'This prepared batch has no remaining items.' : statusHelp[status]
  const itemName = ITEMS[job.itemId]?.name ?? job.itemId
  const schoolName = SCHOOLS[job.targetSchoolId]?.name ?? job.targetSchoolId
  const assignmentHelp = canAdd ? 'Assign one Acolyte to this Research batch. Acolytes are shared across Tower work.' : freeAcolytes <= 0 ? `No free Acolytes. Staffing: ${formatNumber(totalAcolytes - freeAcolytes)} / ${formatNumber(totalAcolytes)}.` : status === 'level-cap' ? 'Increase the target school cap before assigning an Acolyte.' : 'This batch is blocked until its item is available.'
  const removeJob = state.removePreparedResearch
  const openResearchMenu = (x: number, y: number, anchor?: HTMLElement) => openContextMenu({ x, y, anchor, header: { title: itemName, meta: `RESEARCH · ${statusLabel}` }, sections: [{ id: 'acolytes', actions: [{ id: 'assign', label: 'Assign Acolyte', disabled: !canAdd, disabledReason: assignmentHelp, onSelect: () => state.assignResearchAcolyte(slotId) }, { id: 'remove', label: 'Remove Acolyte', disabled: acolytes <= 0, onSelect: () => state.removeResearchAcolyte(slotId) }, { id: 'pause', label: 'Pause Research', disabled: acolytes <= 0, onSelect: () => state.pauseResearch(slotId) }] }, { id: 'links', actions: [{ id: 'school', label: 'Open School', icon: BookOpen, onSelect: () => { setUiPreferences({ screenState: { research: { selectedItemId: job.itemId, targetSchoolId: job.targetSchoolId } } }); setNavigationIntent({ schoolId: job.targetSchoolId }); state.setScreen('schools') } }, { id: 'inventory', label: 'Open in Inventory', icon: ShoppingBag, onSelect: () => { setNavigationIntent({ inventoryItemId: job.itemId }); state.setScreen('inventory') } }] }, { id: 'remove-job', actions: [{ id: 'remove-research', label: 'Remove Research', tone: 'warning', onSelect: () => removeJob(slotId) }] }] })
  return <article className={`prepared-research-row status-${status} ${expanded ? 'is-expanded' : ''}`} tabIndex={0} aria-label={`${itemName} research batch for ${schoolName}, ${statusLabel}`} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openResearchMenu(event.clientX, event.clientY) }} onKeyDown={(event) => { if (event.shiftKey && event.key === 'F10') { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); openResearchMenu(rect.left, rect.bottom, event.currentTarget) } }}>
    <div className="prepared-research-row-top"><div className="prepared-research-identity"><ItemIcon itemId={job.itemId} size="tiny" /><div className="prepared-research-copy"><strong>{itemName} <span aria-hidden="true">→</span> {schoolName}</strong><GameTooltip content={<TooltipContent title={statusLabel} description={statusDescription} />} accent={status === 'running' || status === 'prepared' ? 'neutral' : 'warning'}><Status tone={status === 'running' ? 'active' : status === 'flux-limited' || status === 'waiting-flux' || status === 'level-cap' || status === 'protected' || status === 'missing-item' ? 'warning' : 'neutral'}>{statusLabel}</Status></GameTooltip></div></div><span className="prepared-research-context">{formatNumber(job.remainingQuantity)} left · ETA {eta === null ? '—' : formatCompactDuration(eta)}</span><div className="prepared-research-acolyte-control"><GameTooltip content="Remove the Research Acolyte. Progress is preserved." accent="focus"><Button variant="ghost" ariaLabel={`Remove Research Acolyte from ${itemName}`} onClick={() => state.removeResearchAcolyte(slotId)} disabled={acolytes <= 0}><Minus size={12} /></Button></GameTooltip><strong>{acolytes}</strong><GameTooltip content={<TooltipContent title="Assign Research Acolyte" description={assignmentHelp} />} accent={canAdd ? 'focus' : 'warning'}><Button variant="secondary" ariaLabel={`Assign Research Acolyte to ${itemName}`} onClick={() => state.assignResearchAcolyte(slotId)} disabled={!canAdd}><Plus size={12} /></Button></GameTooltip></div><GameTooltip content={<TooltipContent title="Remove prepared batch" description="Unconsumed items become available again. Partial Research progress is lost." />} accent="warning"><Button variant="ghost" className="prepared-research-remove" ariaLabel={`Remove prepared Research batch for ${itemName}`} onClick={() => removeJob(slotId)}><X size={13} /></Button></GameTooltip></div>
    <div className="prepared-research-row-progress"><div className="prepared-research-compact-progress" role="group" aria-label={`Current Research item progress: ${Math.round(itemProgress)}%`}><div><span>CURRENT ITEM</span><strong>{Math.round(itemProgress)}%</strong></div><Progress value={itemProgress} tone="violet" /></div><div className="prepared-research-compact-progress" role="group" aria-label={`${schoolName} school level progress: ${schoolProgressLabel}`} style={{ '--school-color': SCHOOLS[job.targetSchoolId]?.color } as CSSProperties}><div><span>{schoolName} <b>LV {schoolProgress.level} / {schoolProgress.cap}</b></span><strong>{schoolProgressLabel}</strong></div><Progress value={schoolProgressPercent} tone={job.targetSchoolId} /></div><div className="prepared-research-rates" aria-label={`${formatNumber(getResearchItemsPerHour(job))} items per hour, minus ${formatResourceRate(getResearchFluxPerSecond(job))} Arcane Flux per second, ${formatNumber(getResearchXpPerHour(job))} XP per hour`}><span>{formatNumber(getResearchItemsPerHour(job))}/h</span><span>−{formatResourceRate(getResearchFluxPerSecond(job))} Flux/s</span><span>{formatNumber(getResearchXpPerHour(job))} XP/h</span></div><GameTooltip content={<TooltipContent title={expanded ? 'Hide Research batch details' : 'Show Research batch details'} description="View exact school XP, next-level estimate, XP remaining and assigned Acolyte." />}><Button variant="ghost" icon className="prepared-research-expand" ariaLabel={expanded ? 'Hide Research batch details' : 'Show Research batch details'} ariaPressed={expanded} onClick={onToggleExpanded}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</Button></GameTooltip></div>
    {expanded && <PreparedResearchRowDetails slotId={slotId} job={job} schoolProgress={schoolProgress} nextLevelText={nextLevelText} />}
  </article>
}

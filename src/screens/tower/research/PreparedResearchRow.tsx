import { BookOpen, ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Button, GameTooltip, Progress, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { SCHOOLS } from '../../../game/content/schools/schools'
import { ITEMS } from '../../../game/content/items/items'
import { getResearchBatchEtaMs, getResearchEchoCapacity, getResearchEchoesAssigned, getResearchEchoFocusCost, getResearchItemsPerHour, getResearchJob, getResearchJobProgressPercent, getResearchJobStatus, getResearchManaPerSecond, getResearchNextLevelEtaMs, getResearchXpPerHour } from '../../../game/systems/research/researchSelectors'
import { getSchoolProgressInfo } from '../../../game/systems/schools'
import type { ResearchJobStatus, ResearchSlotId } from '../../../game/types'
import { formatCompactDuration, formatNumber } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'
import { selectFreeFocus } from '../../../store/selectors'
import { useGameContextMenu } from '../../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { setUiPreferences } from '../../../ui/preferences/uiPreferencesStore'
import { formatResourceRate } from '../../../game/presentation/resources/resourcePresentation'
import { PreparedResearchRowDetails } from './PreparedResearchRowDetails'

const statusHelp: Record<ResearchJobStatus, string> = {
  prepared: 'Prepared and waiting for a Research Echo.',
  running: 'Research is progressing at the assigned Echo speed.',
  'mana-limited': 'Mana supply is limiting Research speed; funded work continues.',
  'waiting-mana': 'Waiting for Mana to fund Research work.',
  'level-cap': 'The target Magic School is at its current cap. Progress and items are preserved.',
  protected: 'The item is protected. Unprotect it before assigning Echoes.',
  'missing-item': 'The reserved item is no longer available in inventory.',
}

export function PreparedResearchRow({ slotId, expanded, onToggleExpanded }: { slotId: ResearchSlotId; expanded: boolean; onToggleExpanded: () => void }) {
  const state = useGameStore()
  const job = getResearchJob(state, slotId)
  const removeEcho = state.removeResearchEcho
  const addEcho = state.assignResearchEcho
  const removeJob = state.removePreparedResearch
  const { openContextMenu } = useGameContextMenu()
  if (!job) return null
  const status = getResearchJobStatus(state, slotId)
  const echoes = Math.max(0, Math.floor(job.echoesAssigned))
  const capacity = getResearchEchoCapacity(state)
  const totalEchoes = getResearchEchoesAssigned(state)
  const freeFocus = selectFreeFocus(state)
  const canAdd = status !== 'level-cap' && status !== 'protected' && status !== 'missing-item' && totalEchoes < capacity && freeFocus >= getResearchEchoFocusCost()
  const statusLabel = status.replace('-', ' ').toUpperCase()
  const eta = status === 'mana-limited' || status === 'waiting-mana' || status === 'level-cap' || status === 'protected' || status === 'missing-item' ? null : getResearchBatchEtaMs(job)
  const schoolProgress = getSchoolProgressInfo(state, job.targetSchoolId)
  const nextLevelEta = getResearchNextLevelEtaMs(state, slotId)
  const nextLevelText = schoolProgress.atCap ? 'CAP' : nextLevelEta.beyondBatch ? 'BEYOND BATCH' : nextLevelEta.etaMs === null ? '—' : formatCompactDuration(nextLevelEta.etaMs)
  const itemProgress = getResearchJobProgressPercent(state, slotId)
  const schoolProgressPercent = Math.round(Math.min(100, Math.max(0, schoolProgress.progress * 100)))
  const schoolProgressLabel = schoolProgress.atCap ? 'CAP' : `${schoolProgressPercent}%`
  const statusDescription = status === 'empty' ? 'This prepared batch has no remaining items.' : statusHelp[status]
  const canRemove = <TooltipContent title="Remove prepared batch" description="Unconsumed items become available again. Partial Research progress is lost." />
  const echoHelp = canAdd ? `Each Research Echo reserves ${getResearchEchoFocusCost()} Focus and adds another 1x base speed.` : freeFocus < getResearchEchoFocusCost() ? `Not enough free Focus. Each Research Echo reserves ${getResearchEchoFocusCost()} Focus. Free Focus: ${formatNumber(freeFocus)}.` : status === 'level-cap' ? 'Increase the target school cap before assigning Echoes.' : totalEchoes >= capacity ? `Research Echo pool is full: ${capacity} / ${capacity}.` : 'This batch is blocked until its item is available.'
  const itemName = ITEMS[job.itemId]?.name ?? job.itemId
  const schoolName = SCHOOLS[job.targetSchoolId]?.name ?? job.targetSchoolId
  const openResearchMenu = (x: number, y: number, anchor?: HTMLElement) => openContextMenu({ x, y, anchor, header: { title: itemName, meta: `RESEARCH · ${statusLabel}` }, sections: [{ id: 'echoes', actions: [{ id: 'assign', label: 'Assign +1 Echo', disabled: !canAdd, disabledReason: echoHelp, onSelect: () => addEcho(slotId) }, { id: 'assign-max', label: 'Assign Max Echoes', disabled: !canAdd, disabledReason: echoHelp, onSelect: () => state.assignMaxResearchEchoes(slotId) }, { id: 'remove-echo', label: 'Remove 1 Echo', disabled: echoes <= 0, onSelect: () => removeEcho(slotId) }, { id: 'pause', label: 'Pause Research', disabled: echoes <= 0, onSelect: () => state.pauseResearch(slotId) }] }, { id: 'links', actions: [{ id: 'school', label: 'Open School', icon: BookOpen, onSelect: () => { setUiPreferences({ screenState: { research: { selectedItemId: job.itemId, targetSchoolId: job.targetSchoolId } } }); setNavigationIntent({ schoolId: job.targetSchoolId }); state.setScreen('schools') } }, { id: 'inventory', label: 'Open in Inventory', icon: ShoppingBag, onSelect: () => { setNavigationIntent({ inventoryItemId: job.itemId }); state.setScreen('inventory') } }] }, { id: 'remove', actions: [{ id: 'remove-research', label: 'Remove Research', tone: 'warning', onSelect: () => removeJob(slotId) }] }] })
  return <article className={`prepared-research-row status-${status} ${expanded ? 'is-expanded' : ''}`} tabIndex={0} aria-label={`${itemName} research batch for ${schoolName}, ${statusLabel}`} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openResearchMenu(event.clientX, event.clientY) }} onKeyDown={(event) => { if (event.shiftKey && event.key === 'F10') { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); openResearchMenu(rect.left, rect.bottom, event.currentTarget) } }}>
    <div className="prepared-research-row-top"><div className="prepared-research-identity"><ItemIcon itemId={job.itemId} size="tiny" /><div className="prepared-research-copy"><strong>{itemName} <span aria-hidden="true">→</span> {schoolName}</strong><GameTooltip content={<TooltipContent title={statusLabel} description={statusDescription} />} accent={status === 'running' || status === 'prepared' ? 'neutral' : 'warning'}><Status tone={status === 'running' ? 'active' : status === 'mana-limited' || status === 'waiting-mana' || status === 'level-cap' || status === 'protected' || status === 'missing-item' ? 'warning' : 'neutral'}>{statusLabel}</Status></GameTooltip></div></div><span className="prepared-research-context">{formatNumber(job.remainingQuantity)} left · ETA {eta === null ? '—' : formatCompactDuration(eta)}</span><div className="prepared-research-echo-control"><GameTooltip content="Remove one Research Echo. Progress is preserved." accent="focus"><Button variant="ghost" ariaLabel={`Remove Research Echo from ${itemName}`} onClick={() => removeEcho(slotId)} disabled={echoes <= 0}><Minus size={12} /></Button></GameTooltip><strong>{echoes}</strong><GameTooltip content={<TooltipContent title="Assign Research Echo" description={echoHelp} />} accent={canAdd ? 'focus' : 'warning'}><Button variant="secondary" ariaLabel={`Assign Research Echo to ${itemName}`} onClick={() => addEcho(slotId)} disabled={!canAdd}><Plus size={12} /></Button></GameTooltip></div><GameTooltip content={canRemove} accent="warning"><Button variant="ghost" className="prepared-research-remove" ariaLabel={`Remove prepared Research batch for ${itemName}`} onClick={() => removeJob(slotId)}><X size={13} /></Button></GameTooltip></div>
    <div className="prepared-research-row-progress"><div className="prepared-research-compact-progress" role="group" aria-label={`Current Research item progress: ${Math.round(itemProgress)}%`}><div><span>CURRENT ITEM</span><strong>{Math.round(itemProgress)}%</strong></div><Progress value={itemProgress} tone="violet" /></div><div className="prepared-research-compact-progress" role="group" aria-label={`${schoolName} school level progress: ${schoolProgressLabel}`} style={{ '--school-color': SCHOOLS[job.targetSchoolId]?.color } as CSSProperties}><div><span>{schoolName} <b>LV {schoolProgress.level} / {schoolProgress.cap}</b></span><strong>{schoolProgressLabel}</strong></div><Progress value={schoolProgressPercent} tone={job.targetSchoolId} /></div><div className="prepared-research-rates" aria-label={`${formatNumber(getResearchItemsPerHour(job))} items per hour, minus ${formatResourceRate(getResearchManaPerSecond(job))} Mana per second, ${formatNumber(getResearchXpPerHour(job))} XP per hour`}><span>{formatNumber(getResearchItemsPerHour(job))}/h</span><span>−{formatResourceRate(getResearchManaPerSecond(job))} Mana/s</span><span>{formatNumber(getResearchXpPerHour(job))} XP/h</span></div><GameTooltip content={<TooltipContent title={expanded ? 'Hide Research batch details' : 'Show Research batch details'} description="View exact school XP, next-level estimate, XP remaining and reserved Focus." />}><Button variant="ghost" icon className="prepared-research-expand" ariaLabel={expanded ? 'Hide Research batch details' : 'Show Research batch details'} ariaPressed={expanded} onClick={onToggleExpanded}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</Button></GameTooltip></div>
    {expanded && <PreparedResearchRowDetails slotId={slotId} job={job} schoolProgress={schoolProgress} nextLevelText={nextLevelText} />}
  </article>
}

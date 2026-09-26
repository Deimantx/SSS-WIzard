import { GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { getResearchJobXpPerItem, getResearchNextLevelEtaMs } from '../../../game/systems/research/researchSelectors'
import { getSchoolProgressInfo } from '../../../game/systems/schools'
import { formatNumber } from '../../../game/utils'
import type { ResearchJobState, ResearchSlotId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'

export function PreparedResearchRowDetails({ slotId, job, schoolProgress, nextLevelText }: { slotId: ResearchSlotId; job: ResearchJobState; schoolProgress: ReturnType<typeof getSchoolProgressInfo>; nextLevelText: string }) {
  const state = useGameStore()
  const nextLevelEta = getResearchNextLevelEtaMs(state, slotId)
  const exactSchoolXp = schoolProgress.atCap ? 'CAP' : `${formatNumber(schoolProgress.xpIntoLevel)} / ${formatNumber(schoolProgress.xpRequiredForLevel ?? 0)} XP`
  const xpRemaining = job.remainingQuantity * getResearchJobXpPerItem(job)
  const nextLevelDescription = nextLevelEta.beyondBatch
    ? 'This Research batch does not contain enough remaining items to reach the next school level.'
    : 'Estimate from this Research batch only. Other batches may reach the next level sooner.'
  return <div className="prepared-research-row-details"><div><span>SCHOOL XP</span><strong>{exactSchoolXp}</strong></div><div><GameTooltip content={<TooltipContent title="Estimated next school level" description={nextLevelDescription} />} accent="elemental"><span>EST. NEXT LEVEL</span></GameTooltip><strong>{nextLevelText}</strong></div><div><span>XP REMAINING</span><strong>{formatNumber(xpRemaining)}</strong></div><div><GameTooltip content={<TooltipContent title="Assigned worker" description="One Acolyte staffs this Research batch when assigned." />} accent="focus"><span>ACOLYTE</span></GameTooltip><strong>{job.acolyteAssigned ? 'ASSIGNED' : 'UNASSIGNED'}</strong></div></div>
}

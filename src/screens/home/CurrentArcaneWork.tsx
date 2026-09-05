import { ChevronRight } from 'lucide-react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { manaRegenPerSecond } from '../../game/engine'
import { isRecipeUnlocked } from '../../game/content/recipes/recipeUnlocks'
import { TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER, TRANSMUTATION_RECIPES as RECIPES } from '../../game/content/recipes/transmutationRecipes'
import { getPreparedResearchJobs, getResearchEchoesAssigned, getResearchXpPerHour } from '../../game/systems/research/researchSelectors'
import { getTransmutationEchoesAssigned, getTransmutationFocusReserved } from '../../game/systems/transmutation/transmutationSelectors'
import type { ScreenId } from '../../game/types'
import { formatNumber } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'

interface WorkRowProps {
  label: string
  status: string
  statusTone: 'neutral' | 'active' | 'warning'
  detail: string
  screen: ScreenId
  onNavigate: (screen: ScreenId) => void
}

function WorkRow({ label, status, statusTone, detail, screen, onNavigate }: WorkRowProps) {
  return <div className="arcane-work-row"><div className="arcane-work-copy"><div className="arcane-work-label"><strong>{label}</strong><GameTooltip content={<TooltipContent title={status} description={detail} />} accent={statusTone === 'warning' ? 'warning' : 'neutral'}><Status tone={statusTone}>{status}</Status></GameTooltip></div><p>{detail}</p></div><Button variant="ghost" tooltip={<TooltipContent title={`Open ${label}`} description={`Navigate to the ${label} screen.`} />} onClick={() => onNavigate(screen)}>OPEN <ChevronRight size={14} /></Button></div>
}

export function CurrentArcaneWork() {
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const debug = useGameStore((state) => state.debug)
  const setScreen = useGameStore((state) => state.setScreen)
  const researchJobs = getPreparedResearchJobs({ activities })
  const researchEchoes = getResearchEchoesAssigned({ activities })
  const researchXpPerHour = researchJobs.reduce((total, job) => total + getResearchXpPerHour(job), 0)
  const transmutationJobs = RECIPE_ORDER.filter((recipeId) => {
    const recipe = RECIPES[recipeId]
    const job = activities.transmutation.jobs[recipeId]
    return Boolean(job && job.echoesAssigned > 0 && isRecipeUnlocked({ progress }, recipe))
  })
  const transmutationEchoes = getTransmutationEchoesAssigned({ activities })
  const channelingEchoes = Math.max(0, Math.floor(activities.channeling.echoesAssigned))
  const channelingRate = manaRegenPerSecond({ activities, progress, equipment, debug })

  return <Card className="current-arcane-work" title="CURRENT ARCANE WORK" action={<span className="current-arcane-work-summary">{Number(channelingEchoes > 0) + Number(researchEchoes > 0) + Number(transmutationEchoes > 0)} SYSTEMS ACTIVE</span>}><div className="arcane-work-list"><WorkRow label="Channeling" status={channelingEchoes > 0 ? 'ACTIVE' : 'IDLE'} statusTone={channelingEchoes > 0 ? 'active' : 'neutral'} detail={channelingEchoes > 0 ? `${channelingEchoes} Echoes · +${formatNumber(channelingRate)} Mana/s total.` : 'No Echoes assigned'} screen="tower-channeling" onNavigate={setScreen} /><WorkRow label="Research" status={researchEchoes > 0 ? 'ACTIVE' : researchJobs.length > 0 ? 'PREPARED' : 'IDLE'} statusTone={researchEchoes > 0 ? 'active' : researchJobs.length > 0 ? 'neutral' : 'neutral'} detail={researchEchoes > 0 ? `${researchJobs.length} prepared ${researchJobs.length === 1 ? 'batch' : 'batches'} · ${researchEchoes} Echoes · ${formatNumber(researchXpPerHour)} XP/h.` : researchJobs.length > 0 ? `${researchJobs.length} ${researchJobs.length === 1 ? 'batch' : 'batches'} prepared` : 'No Echoes assigned'} screen="tower-research" onNavigate={setScreen} /><WorkRow label="Transmutation" status={transmutationEchoes > 0 ? 'ACTIVE' : 'IDLE'} statusTone={transmutationEchoes > 0 ? 'active' : 'neutral'} detail={transmutationEchoes > 0 ? `${transmutationJobs.length} active ${transmutationJobs.length === 1 ? 'recipe' : 'recipes'} · ${transmutationEchoes} Echoes · Focus ${formatNumber(getTransmutationFocusReserved(transmutationEchoes))}.` : 'No active recipes'} screen="tower-transmutation" onNavigate={setScreen} /></div></Card>
}

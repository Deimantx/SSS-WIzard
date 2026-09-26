import { ChevronRight } from 'lucide-react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { getArcaneFluxProductionPerSecond } from '../../game/systems/channeling/channelingRuntime'
import { isRecipeUnlocked } from '../../game/content/recipes/recipeUnlocks'
import { TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER, TRANSMUTATION_RECIPES as RECIPES } from '../../game/content/recipes/transmutationRecipes'
import { getPreparedResearchJobs, getResearchAcolytesAssigned, getResearchXpPerHour } from '../../game/systems/research/researchSelectors'
import { getTransmutationAcolytesAssigned } from '../../game/systems/transmutation/transmutationSelectors'
import type { ScreenId } from '../../game/types'
import { formatNumber } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'

function WorkRow({ label, status, statusTone, detail, screen, onNavigate }: { label: string; status: string; statusTone: 'neutral' | 'active' | 'warning'; detail: string; screen: ScreenId; onNavigate: (screen: ScreenId) => void }) { return <div className="arcane-work-row"><div className="arcane-work-copy"><div className="arcane-work-label"><strong>{label}</strong><GameTooltip content={<TooltipContent title={status} description={detail} />} accent={statusTone === 'warning' ? 'warning' : 'neutral'}><Status tone={statusTone}>{status}</Status></GameTooltip></div><p>{detail}</p></div><Button variant="ghost" tooltip={<TooltipContent title={`Open ${label}`} description={`Navigate to the ${label} screen.`} />} onClick={() => onNavigate(screen)}>OPEN <ChevronRight size={14} /></Button></div> }

export function CurrentArcaneWork() {
  const state = useGameStore()
  const setScreen = state.setScreen
  const researchJobs = getPreparedResearchJobs(state)
  const researchAcolytes = getResearchAcolytesAssigned(state)
  const transmutationJobs = RECIPE_ORDER.filter((recipeId) => { const recipe = RECIPES[recipeId]; const job = state.activities.transmutation.jobs[recipeId]; return Boolean(job?.acolyteAssigned && isRecipeUnlocked({ progress: state.progress }, recipe)) })
  const transmutationAcolytes = getTransmutationAcolytesAssigned(state)
  const channelingAcolytes = Math.max(0, Math.floor(state.activities.channeling.acolytesAssigned ?? 0))
  const fluxRate = getArcaneFluxProductionPerSecond(state).total
  const activeSystems = Number(channelingAcolytes > 0) + Number(researchAcolytes > 0) + Number(transmutationAcolytes > 0)
  return <Card className="current-arcane-work" title="CURRENT TOWER WORK" action={<span className="current-arcane-work-summary">{activeSystems} SYSTEMS ACTIVE</span>}><div className="arcane-work-list"><WorkRow label="Channeling" status={channelingAcolytes > 0 ? 'ACTIVE' : 'IDLE'} statusTone={channelingAcolytes > 0 ? 'active' : 'neutral'} detail={channelingAcolytes > 0 ? `${channelingAcolytes} Acolytes · +${formatNumber(fluxRate)} Flux/s total.` : 'No Acolytes assigned'} screen="tower-channeling" onNavigate={setScreen} /><WorkRow label="Research" status={researchAcolytes > 0 ? 'ACTIVE' : researchJobs.length > 0 ? 'PREPARED' : 'IDLE'} statusTone={researchAcolytes > 0 ? 'active' : 'neutral'} detail={researchAcolytes > 0 ? `${researchJobs.length} prepared ${researchJobs.length === 1 ? 'batch' : 'batches'} · ${researchAcolytes} Acolytes · ${formatNumber(researchJobs.reduce((total, job) => total + getResearchXpPerHour(job), 0))} XP/h.` : researchJobs.length > 0 ? `${researchJobs.length} batches prepared` : 'No Acolytes assigned'} screen="tower-research" onNavigate={setScreen} /><WorkRow label="Transmutation" status={transmutationAcolytes > 0 ? 'ACTIVE' : 'IDLE'} statusTone={transmutationAcolytes > 0 ? 'active' : 'neutral'} detail={transmutationAcolytes > 0 ? `${transmutationJobs.length} active ${transmutationJobs.length === 1 ? 'recipe' : 'recipes'} · ${transmutationAcolytes} Acolytes · Flux funded.` : 'No active recipes'} screen="tower-transmutation" onNavigate={setScreen} /></div></Card>
}

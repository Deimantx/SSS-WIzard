import { DUNGEONS } from '../../content/dungeons/dungeons'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { isRecipeUnlocked, TRANSMUTATION_RECIPES as RECIPES, TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../../content/recipes/recipes'
import { SCHOOLS } from '../../content/schools/schools'
import { getCombatEncounterMode, getCombatLocationByDungeonId } from '../../content/world-navigation'
import { getCurrentEnemyActionStep, getEnemyAction, getNextEnemyActionStep } from '../combat/actionRuntime'
import { resolveBossThreatRequirement } from '../combat/combatThreat'
import { getRecipeOutputPerHour, getRecipeCurrentRemainingDuration, getRecipeFluxDemandPerSecond, getRecipeStatus } from '../transmutation/transmutationSelectors'
import { getPreparedResearchJobs, getResearchBatchEtaMs, getResearchFluxPerSecond, getResearchItemsPerHour, getResearchJobProgressPercent, getResearchJobStatus, getResearchXpPerHour } from '../research/researchSelectors'
import type { ActivityMetric, ActivityTelemetry, GameState } from '../../types'
import { clamp, formatCompactDuration, formatNumber, formatRatePerHour, formatSignedRate } from '../../utils'

const metric = (label: string, value: string, tone?: ActivityMetric['tone']): ActivityMetric => ({ label, value, tone })
const percent = (value: number, max: number) => Math.round(clamp(value / Math.max(1, max) * 100, 0, 100))
const hasAcolyte = (job: { acolyteAssigned?: boolean; echoesAssigned?: number } | undefined) => Boolean(job?.acolyteAssigned ?? (job?.echoesAssigned ?? 0) > 0)

export const getActivityTelemetry = (state: GameState): ActivityTelemetry[] => {
  const activities: ActivityTelemetry[] = []
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
  const location = getCombatLocationByDungeonId(state.combat.dungeonId)
  const encounterMode = getCombatEncounterMode(location)
  const sequence = encounterMode === 'sequence'
  const sequenceTotal = sequence ? (dungeon.encounterSequence?.length ?? 0) + 1 : 0
  const sequenceStep = sequence ? Math.min(sequenceTotal, Math.max(1, (state.combat.dungeonSequenceIndex ?? 0) + 1)) : 0
  const sequenceRunLabel = sequence ? `Step ${sequenceStep} / ${sequenceTotal}` : null
  const threatRequired = resolveBossThreatRequirement(dungeon.id, state.worldTier.current)

  if (state.combat.active) {
    const playerPercent = percent(state.player.health, state.player.maxHealth)
    if (state.combat.enemyId) {
      const enemy = MONSTERS[state.combat.enemyId]
      const enemyPercent = percent(state.combat.enemyHp, state.combat.enemyMaxHp)
      const currentStep = getCurrentEnemyActionStep(state)
      const currentAction = state.combat.enemyCurrentActionId ? getEnemyAction(state, state.combat.enemyCurrentActionId) : undefined
      const nextStep = getNextEnemyActionStep(state)
      const nextAction = nextStep?.type === 'action' ? getEnemyAction(state, nextStep.actionId) : undefined
      const nextLabel = currentAction?.name ?? (currentStep?.type === 'basic' ? 'Basic Attack' : nextAction?.name ?? 'Basic Attack')
      const nextTime = state.combat.enemyActionTimerMs > 0 ? state.combat.enemyActionTimerMs : state.combat.enemyActionDurationMs
      const boss = state.combat.inBossFight
      const enemyLabel = boss ? 'Boss HP' : 'Enemy HP'
      activities.push({
        id: 'combat', label: 'COMBAT', subtitle: boss ? enemy.name : dungeon.name, screen: 'combat', status: 'combat', progressPercent: enemyPercent,
        bars: [
          { label: 'Player HP', value: `${formatNumber(state.player.health)} / ${formatNumber(state.player.maxHealth)} (${playerPercent}%)`, percent: playerPercent, tone: playerPercent < 35 ? 'warning' : 'positive' },
          { label: enemyLabel, value: `${formatNumber(state.combat.enemyHp)} / ${formatNumber(state.combat.enemyMaxHp)} (${enemyPercent}%)`, percent: enemyPercent, tone: 'negative' },
        ],
        collapsedSummary: sequence ? `${dungeon.name} | ${sequenceRunLabel} | P${playerPercent}% / E${enemyPercent}%` : boss ? `Boss ${enemy.name} | P${playerPercent}% / B${enemyPercent}%` : `Combat P${playerPercent}% / E${enemyPercent}% | Threat ${formatNumber(state.combat.threatCleared)} / ${formatNumber(threatRequired)}`,
        metrics: [
          metric(boss ? 'Boss Action' : 'Enemy Action', `${nextLabel} | ${formatCompactDuration(nextTime)}`),
          ...(sequence ? [metric('Dungeon Run', sequenceRunLabel!)] : [metric('Threat', `${formatNumber(state.combat.threatCleared)} / ${formatNumber(threatRequired)}`)]),
          ...(boss ? [metric('Boss Encounter', enemy.name)] : []),
        ],
        accent: 'red',
      })
    } else {
      activities.push({
        id: 'combat', label: 'COMBAT', subtitle: dungeon.name, screen: 'combat', status: 'paused', remainingMs: state.combat.encounterTimerMs,
        bars: [{ label: 'Player HP', value: `${formatNumber(state.player.health)} / ${formatNumber(state.player.maxHealth)} (${playerPercent}%)`, percent: playerPercent, tone: playerPercent < 35 ? 'warning' : 'positive' }],
        collapsedSummary: sequence ? `${dungeon.name} | NEXT ENCOUNTER ${formatCompactDuration(state.combat.encounterTimerMs)}` : `Combat | NEXT ENCOUNTER ${formatCompactDuration(state.combat.encounterTimerMs)}`,
        metrics: [metric('Next Encounter', formatCompactDuration(state.combat.encounterTimerMs)), ...(sequence ? [metric('Dungeon Run', sequenceRunLabel!)] : [metric('Threat', `${formatNumber(state.combat.threatCleared)} / ${formatNumber(threatRequired)}`)])],
        accent: 'red',
      })
    }
  }

  const researchJobs = getPreparedResearchJobs(state).filter((job) => {
    if (!hasAcolyte(job)) return false
    const status = getResearchJobStatus(state, job.slotId)
    return status === 'running' || status === 'flux-limited' || status === 'waiting-flux'
  })
  if (researchJobs.length > 0) {
    const totalAcolytes = researchJobs.length
    const totalXpPerHour = researchJobs.reduce((sum, job) => sum + getResearchXpPerHour(job), 0)
    const totalItemsPerHour = researchJobs.reduce((sum, job) => sum + getResearchItemsPerHour(job), 0)
    const fluxDemand = researchJobs.reduce((sum, job) => sum + getResearchFluxPerSecond(job), 0)
    const researchStatuses = researchJobs.map((job) => getResearchJobStatus(state, job.slotId))
    const waiting = researchStatuses.filter((status) => status === 'waiting-flux').length
    const limited = researchStatuses.filter((status) => status === 'flux-limited').length
    const etaCandidates = limited === 0 && waiting === 0 ? researchJobs.map((job) => getResearchBatchEtaMs(job)).filter((eta): eta is number => eta !== null) : []
    const remainingMs = etaCandidates.length ? Math.min(...etaCandidates) : undefined
    const first = researchJobs[0]
    const firstItem = ITEMS[first.itemId]
    const schoolName = SCHOOLS[first.targetSchoolId].name
    activities.push({ id: 'research', label: 'RESEARCH', subtitle: `${researchJobs.length} batches | ${totalAcolytes} Acolytes`, screen: 'tower-research', status: waiting === researchJobs.length ? 'waiting-flux' : 'running', progressPercent: Math.round(researchJobs.reduce((sum, job) => sum + getResearchJobProgressPercent(state, job.slotId), 0) / researchJobs.length), remainingMs, collapsedSummary: waiting === researchJobs.length ? `Research | ${researchJobs.length} batches | WAITING FLUX` : `Research | ${researchJobs.length} batches | ${formatRatePerHour(totalXpPerHour)} XP/h`, metrics: [metric('Batches', `${researchJobs.length}`), metric('Target', `${firstItem.name} -> ${schoolName}`), metric('XP/h', formatRatePerHour(totalXpPerHour)), metric('Items/h', formatRatePerHour(totalItemsPerHour)), metric('Flux demand', formatSignedRate(-fluxDemand), 'negative'), metric('Acolytes', `${totalAcolytes}`), ...(waiting > 0 ? [metric('Waiting', `${waiting}`, 'warning')] : [])], accent: 'violet' })
  }
  const researchCard = activities.find((activity) => activity.id === 'research')
  if (researchCard) {
    const activeResearch = getPreparedResearchJobs(state).filter((job) => hasAcolyte(job))
    const statuses = activeResearch.map((job) => getResearchJobStatus(state, job.slotId))
    const limited = statuses.filter((status) => status === 'flux-limited').length
    const waiting = statuses.filter((status) => status === 'waiting-flux').length
    if (limited > 0 && waiting < statuses.length) {
      researchCard.status = 'flux-limited'
      researchCard.collapsedSummary = `Research | ${activeResearch.length} batches | FLUX LIMITED`
    }
  }

  const jobs = RECIPE_ORDER.map((recipeId) => {
    const recipe = RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    const acolytes = hasAcolyte(job) ? 1 : 0
    return job && acolytes > 0 && isRecipeUnlocked(state, recipe) ? { recipe, job, acolytes, status: getRecipeStatus(state, recipe) } : null
  }).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  if (jobs.length > 0) {
    const totalAcolytes = jobs.reduce((sum, entry) => sum + entry.acolytes, 0)
    const totalOutput = jobs.reduce((sum, entry) => sum + getRecipeOutputPerHour(entry.recipe, entry.acolytes, state), 0)
    const fluxDemand = jobs.reduce((sum, entry) => sum + getRecipeFluxDemandPerSecond(entry.recipe, entry.acolytes, state), 0)
    const waitingFlux = jobs.filter((entry) => entry.status === 'waiting-flux').length
    const fluxLimited = jobs.filter((entry) => entry.status === 'flux-limited').length
    const waitingMaterials = jobs.filter((entry) => entry.status === 'waiting-materials').length
    const remainingMs = fluxLimited === 0 && waitingFlux === 0 && waitingMaterials === 0
      ? Math.min(...jobs.map((entry) => getRecipeCurrentRemainingDuration(entry.recipe, entry.job.progressMs ?? 0, entry.acolytes, state) ?? 0))
      : undefined
    const status = waitingMaterials === jobs.length ? 'waiting-materials' : waitingFlux === jobs.length ? 'waiting-flux' : fluxLimited > 0 ? 'flux-limited' : 'running'
    activities.push({ id: 'transmutation', label: 'TRANSMUTATION', subtitle: `${jobs.length} recipe${jobs.length === 1 ? '' : 's'} | ${totalAcolytes} Acolytes`, screen: 'tower-transmutation', status, progressPercent: Math.round(jobs.reduce((sum, entry) => sum + (entry.job.progressMs ?? 0) / entry.recipe.baseDurationMs, 0) / jobs.length * 100), remainingMs, collapsedSummary: `Transmutation | ${jobs.length} recipe${jobs.length === 1 ? '' : 's'} | ${totalAcolytes} Acolytes`, metrics: [metric('Output', formatRatePerHour(totalOutput)), metric('Flux demand', `${formatSignedRate(-fluxDemand)} /s`, 'negative'), metric('Acolytes', `${totalAcolytes}`), ...(waitingFlux + waitingMaterials > 0 ? [metric('Waiting', `${waitingFlux + waitingMaterials}`, 'warning')] : [])], accent: 'gold' })
  }

  const transmutationCard = activities.find((activity) => activity.id === 'transmutation')
  if (transmutationCard?.status === 'flux-limited') {
    const outputMetric = transmutationCard.metrics.find((entry) => entry.label === 'Output')
    if (outputMetric) outputMetric.label = 'Potential'
  }
  return activities
}

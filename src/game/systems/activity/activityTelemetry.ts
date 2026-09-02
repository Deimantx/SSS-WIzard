import { DUNGEONS } from '../../content/dungeons/dungeons'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { isRecipeUnlocked, RECIPES, RECIPE_ORDER } from '../../content/recipes/recipes'
import { SCHOOLS } from '../../content/schools/schools'
import { BALANCE } from '../../core/balance/balance'
import { getCurrentEnemyActionStep, getEnemyAction, getNextEnemyActionStep } from '../combat/actionRuntime'
import { getRecipeCraftsPerHour, getRecipeCurrentRemainingDuration, getRecipeManaDemandPerSecond, getRecipeStatus } from '../transmutation/transmutationSelectors'
import { getPreparedResearchJobs, getResearchBatchEtaMs, getResearchFocusReserved, getResearchItemsPerHour, getResearchJobProgressPercent, getResearchJobStatus, getResearchManaPerSecond, getResearchXpPerHour } from '../research/researchSelectors'
import type { ActivityMetric, ActivityTelemetry, GameState } from '../../types'
import { clamp, formatCompactDuration, formatNumber, formatRatePerHour, formatSignedRate } from '../../utils'

const metric = (label: string, value: string, tone?: ActivityMetric['tone']): ActivityMetric => ({ label, value, tone })
const percent = (value: number, max: number) => Math.round(clamp(value / Math.max(1, max) * 100, 0, 100))
const attackLabel = (timerMs: number) => `Basic Attack · ${timerMs <= 0 ? 'READY' : formatCompactDuration(timerMs)}`

export const getActivityTelemetry = (state: GameState): ActivityTelemetry[] => {
  const activities: ActivityTelemetry[] = []
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']

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
        id: 'combat',
        label: 'COMBAT',
        subtitle: boss ? enemy.name : dungeon.name,
        screen: 'combat',
        status: 'combat',
        progressPercent: enemyPercent,
        bars: [
          { label: 'Player HP', value: `${formatNumber(state.player.health)} / ${formatNumber(state.player.maxHealth)} (${playerPercent}%)`, percent: playerPercent, tone: playerPercent < 35 ? 'warning' : 'positive' },
          { label: enemyLabel, value: `${formatNumber(state.combat.enemyHp)} / ${formatNumber(state.combat.enemyMaxHp)} (${enemyPercent}%)`, percent: enemyPercent, tone: 'negative' },
        ],
        collapsedSummary: boss ? `Boss ${enemy.name} · P${playerPercent}% / B${enemyPercent}%` : `Combat P${playerPercent}% / E${enemyPercent}% · Threat ${formatNumber(state.combat.threatCleared)} / ${formatNumber(dungeon.threatRequired)}`,
        metrics: [
          metric('Threat Cleared', `${formatNumber(state.combat.threatCleared)} / ${formatNumber(dungeon.threatRequired)}`),
          metric('Player Attack', attackLabel(state.combat.playerAttackTimerMs)),
          metric(boss ? 'Boss Action' : 'Enemy Action', `${nextLabel} · ${formatCompactDuration(nextTime)}`),
          ...(boss ? [metric('Boss Encounter', enemy.name)] : []),
        ],
        accent: 'red',
      })
    } else {
      activities.push({
        id: 'combat',
        label: 'COMBAT',
        subtitle: dungeon.name,
        screen: 'combat',
        status: 'paused',
        remainingMs: state.combat.encounterTimerMs,
        bars: [
          { label: 'Player HP', value: `${formatNumber(state.player.health)} / ${formatNumber(state.player.maxHealth)} (${playerPercent}%)`, percent: playerPercent, tone: playerPercent < 35 ? 'warning' : 'positive' },
        ],
        collapsedSummary: `Combat · NEXT ENCOUNTER ${formatCompactDuration(state.combat.encounterTimerMs)}`,
        metrics: [
          metric('Threat Cleared', `${formatNumber(state.combat.threatCleared)} / ${formatNumber(dungeon.threatRequired)}`),
          metric('Next Encounter', formatCompactDuration(state.combat.encounterTimerMs)),
        ],
        accent: 'red',
      })
    }
  }

  const researchJobs = getPreparedResearchJobs(state).filter((job) => {
    if (job.echoesAssigned <= 0) return false
    const status = getResearchJobStatus(state, job.slotId)
    return status === 'running' || status === 'mana-limited' || status === 'waiting-mana'
  })
  if (researchJobs.length > 0) {
    const totalEchoes = researchJobs.reduce((sum, job) => sum + job.echoesAssigned, 0)
    const totalXpPerHour = researchJobs.reduce((sum, job) => sum + getResearchXpPerHour(job), 0)
    const totalItemsPerHour = researchJobs.reduce((sum, job) => sum + getResearchItemsPerHour(job), 0)
    const manaDemand = researchJobs.reduce((sum, job) => sum + getResearchManaPerSecond(job), 0)
    const researchStatuses = researchJobs.map((job) => getResearchJobStatus(state, job.slotId))
    const waiting = researchStatuses.filter((status) => status === 'waiting-mana').length
    const limited = researchStatuses.filter((status) => status === 'mana-limited').length
    const etaCandidates = limited === 0 && waiting === 0 ? researchJobs.map((job) => getResearchBatchEtaMs(job)).filter((eta): eta is number => eta !== null) : []
    const remainingMs = etaCandidates.length ? Math.min(...etaCandidates) : undefined
    const first = researchJobs[0]
    const firstItem = ITEMS[first.itemId]
    const schoolName = SCHOOLS[first.targetSchoolId].name
    activities.push({ id: 'research', label: 'RESEARCH', subtitle: `${researchJobs.length} batches · ${totalEchoes} Echoes`, screen: 'tower-research', status: waiting === researchJobs.length ? 'waiting-mana' : 'running', progressPercent: Math.round(researchJobs.reduce((sum, job) => sum + getResearchJobProgressPercent(state, job.slotId), 0) / researchJobs.length), remainingMs, collapsedSummary: waiting === researchJobs.length ? `Research · ${researchJobs.length} batches · WAITING MANA` : `Research · ${researchJobs.length} batches · ${formatRatePerHour(totalXpPerHour)} XP/h`, metrics: [metric('Batches', `${researchJobs.length}`), metric('Target', `${firstItem.name} → ${schoolName}`), metric('XP/h', formatRatePerHour(totalXpPerHour)), metric('Items/h', formatRatePerHour(totalItemsPerHour)), metric('Mana', formatSignedRate(-manaDemand), 'negative'), metric('Focus', `${getResearchFocusReserved(state)}`), ...(waiting > 0 ? [metric('Waiting', `${waiting}`, 'warning')] : [])], accent: 'violet' })
  }
  const researchCard = activities.find((activity) => activity.id === 'research')
  if (researchCard) {
    const activeResearch = getPreparedResearchJobs(state).filter((job) => job.echoesAssigned > 0)
    const statuses = activeResearch.map((job) => getResearchJobStatus(state, job.slotId))
    const limited = statuses.filter((status) => status === 'mana-limited').length
    const waiting = statuses.filter((status) => status === 'waiting-mana').length
    if (limited > 0 && waiting < statuses.length) {
      researchCard.status = 'mana-limited'
      researchCard.collapsedSummary = `Research · ${activeResearch.length} batches · MANA LIMITED`
    }
  }

  const jobs = RECIPE_ORDER.map((recipeId) => {
    const recipe = RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
    return job && echoes > 0 && isRecipeUnlocked(state, recipe) ? { recipe, job, echoes, status: getRecipeStatus(state, recipe) } : null
  }).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  if (jobs.length > 0) {
    const totalEchoes = jobs.reduce((sum, entry) => sum + entry.echoes, 0)
    const totalFocus = totalEchoes * BALANCE.transmutation.echoFocusCost
    const totalOutput = jobs.reduce((sum, entry) => sum + getRecipeCraftsPerHour(entry.recipe, entry.echoes) * entry.recipe.output.quantity, 0)
    const manaDemand = jobs.reduce((sum, entry) => sum + getRecipeManaDemandPerSecond(entry.recipe, entry.echoes), 0)
    const waitingMana = jobs.filter((entry) => entry.status === 'waiting-mana').length
    const manaLimited = jobs.filter((entry) => entry.status === 'mana-limited').length
    const waitingMaterials = jobs.filter((entry) => entry.status === 'waiting-materials').length
    const remainingMs = manaLimited === 0 && waitingMana === 0 && waitingMaterials === 0
      ? Math.min(...jobs.map((entry) => getRecipeCurrentRemainingDuration(entry.recipe, entry.job.progressMs ?? 0, entry.echoes) ?? 0))
      : undefined
    const status = waitingMaterials === jobs.length ? 'waiting-materials' : waitingMana === jobs.length ? 'waiting-mana' : manaLimited > 0 ? 'mana-limited' : 'running'
    activities.push({ id: 'transmutation', label: 'TRANSMUTATION', subtitle: `${jobs.length} recipe${jobs.length === 1 ? '' : 's'} · ${totalEchoes} Echoes`, screen: 'tower-transmutation', status, progressPercent: Math.round(jobs.reduce((sum, entry) => sum + (entry.job.progressMs ?? 0) / entry.recipe.baseDurationMs, 0) / jobs.length * 100), remainingMs, collapsedSummary: `Transmutation · ${jobs.length} recipe${jobs.length === 1 ? '' : 's'} · ${totalEchoes} Echoes`, metrics: [metric('Output', formatRatePerHour(totalOutput)), metric('Mana', `${formatSignedRate(-manaDemand)} /s`, 'negative'), metric('Focus', `${totalFocus}`), ...(waitingMana + waitingMaterials > 0 ? [metric('Waiting', `${waitingMana + waitingMaterials}`,'warning')] : [])], accent: 'gold' })
  }

  const transmutationCard = activities.find((activity) => activity.id === 'transmutation')
  if (transmutationCard?.status === 'mana-limited') {
    const outputMetric = transmutationCard.metrics.find((entry) => entry.label === 'Output')
    if (outputMetric) outputMetric.label = 'Potential'
  }
  activities.forEach((activity) => {
    const manaMetric = activity.metrics.find((entry) => entry.label === 'Mana')
    if (manaMetric) manaMetric.label = 'Mana demand'
  })
  return activities
}

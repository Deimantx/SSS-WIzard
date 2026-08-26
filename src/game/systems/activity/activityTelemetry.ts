import { DUNGEONS } from '../../content/dungeons/dungeons'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { RECIPES, RECIPE_ORDER } from '../../content/recipes/recipes'
import { SCHOOLS } from '../../content/schools/schools'
import { BALANCE } from '../../core/balance/balance'
import { getRecipeCraftsPerHour, getRecipeManaDemandPerSecond, getRecipeStatus } from '../transmutation/transmutationSelectors'
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
      const nextAction = enemy.actionSequence[state.combat.enemyActionIndex % enemy.actionSequence.length]
      const nextSpecial = nextAction.specialAttackId ? enemy.specialAttacks[nextAction.specialAttackId] : undefined
      const nextLabel = state.combat.enemyTelegraphActionId
        ? enemy.specialAttacks[state.combat.enemyTelegraphActionId]?.name ?? 'Telegraph'
        : nextSpecial?.name ?? 'Basic Attack'
      const nextTime = state.combat.enemyTelegraphMs > 0 ? state.combat.enemyTelegraphMs : state.combat.enemyActionTimerMs
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
        status: 'recovery',
        remainingMs: state.combat.encounterTimerMs,
        bars: [
          { label: 'Player HP', value: `${formatNumber(state.player.health)} / ${formatNumber(state.player.maxHealth)} (${playerPercent}%)`, percent: playerPercent, tone: playerPercent < 35 ? 'warning' : 'positive' },
        ],
        collapsedSummary: `Combat · RECOVERY ${formatCompactDuration(state.combat.encounterTimerMs)}`,
        metrics: [
          metric('Threat Cleared', `${formatNumber(state.combat.threatCleared)} / ${formatNumber(dungeon.threatRequired)}`),
          metric('Next Encounter', formatCompactDuration(state.combat.encounterTimerMs)),
        ],
        accent: 'red',
      })
    }
  }

  const research = state.activities.research
  if (research.running && research.itemId && research.targetSchoolId && research.remainingQuantity > 0) {
    const duration = Math.max(1, research.durationPerItemMs)
    const remainingMs = Math.max(0, duration - research.progressMs)
    const waitingMana = research.status === 'waiting-mana' || (research.progressMs >= duration && state.player.mana < research.manaPerItem)
    const item = ITEMS[research.itemId]
    const schoolName = SCHOOLS[research.targetSchoolId].name
    activities.push({ id: 'research', label: 'RESEARCH', subtitle: `${item?.researchSchool ? SCHOOLS[item.researchSchool].name : 'Material'} → ${schoolName}`, screen: 'tower-research', status: waitingMana ? 'waiting-mana' : research.status === 'paused' ? 'paused' : 'running', progressPercent: clamp(research.progressMs / duration * 100, 0, 100), remainingMs, collapsedSummary: waitingMana ? `${schoolName} Research · WAITING MANA` : `${schoolName} Research · ${formatCompactDuration(remainingMs)}`, metrics: [metric('Remaining', `${formatNumber(research.remainingQuantity)} items`), metric('Cycle', formatCompactDuration(remainingMs)), metric('XP/h', formatRatePerHour(research.xpPerItem * 3_600_000 / duration)), metric('Items/h', formatRatePerHour(3_600_000 / duration)), metric('Mana', formatSignedRate(-(research.manaPerItem / (duration / 1000))), 'negative'), metric('Focus', `${research.focusCost}`)], accent: 'violet' })
  }

  const jobs = RECIPE_ORDER.map((recipeId) => {
    const recipe = RECIPES[recipeId]
    const job = state.activities.transmutation.jobs[recipeId]
    const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? 0))
    return job && echoes > 0 && (recipe.unlock.type === 'always' || state.progress.firstBossKill) ? { recipe, job, echoes, status: getRecipeStatus(state, recipe) } : null
  }).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  if (jobs.length > 0) {
    const totalEchoes = jobs.reduce((sum, entry) => sum + entry.echoes, 0)
    const totalFocus = totalEchoes * BALANCE.transmutation.echoFocusCost
    const totalOutput = jobs.reduce((sum, entry) => sum + getRecipeCraftsPerHour(entry.recipe, entry.echoes) * entry.recipe.output.quantity, 0)
    const manaDemand = jobs.reduce((sum, entry) => sum + getRecipeManaDemandPerSecond(entry.recipe, entry.echoes), 0)
    const waitingMana = jobs.filter((entry) => entry.status === 'waiting-mana').length
    const waitingMaterials = jobs.filter((entry) => entry.status === 'waiting-materials').length
    const remainingMs = Math.min(...jobs.map((entry) => Math.max(0, entry.recipe.baseDurationMs - (entry.job.progressMs ?? 0))))
    const status = waitingMaterials === jobs.length ? 'waiting-materials' : waitingMana === jobs.length ? 'waiting-mana' : 'running'
    activities.push({ id: 'transmutation', label: 'TRANSMUTATION', subtitle: `${jobs.length} recipe${jobs.length === 1 ? '' : 's'} · ${totalEchoes} Echoes`, screen: 'tower-transmutation', status, progressPercent: Math.round(jobs.reduce((sum, entry) => sum + (entry.job.progressMs ?? 0) / entry.recipe.baseDurationMs, 0) / jobs.length * 100), remainingMs, collapsedSummary: `Transmutation · ${jobs.length} recipe${jobs.length === 1 ? '' : 's'} · ${totalEchoes} Echoes`, metrics: [metric('Output', formatRatePerHour(totalOutput)), metric('Mana', `${formatSignedRate(-manaDemand)} /s`, 'negative'), metric('Focus', `${totalFocus}`), ...(waitingMana + waitingMaterials > 0 ? [metric('Waiting', `${waitingMana + waitingMaterials}`,'warning')] : [])], accent: 'gold' })
  }

  return activities
}

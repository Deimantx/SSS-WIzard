import { BALANCE } from '../../core/balance/balance'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { RECIPES } from '../../content/recipes/recipes'
import { SCHOOLS } from '../../content/schools/schools'
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

  const condense = state.activities.condense
  if (condense.running) {
    const duration = BALANCE.condense.durationMs
    const remainingMs = Math.max(0, duration - condense.progressMs)
    const waitingMana = condense.progressMs >= duration && state.player.mana < BALANCE.condense.manaCost
    activities.push({ id: 'condensation', label: 'CONDENSATION', subtitle: `${SCHOOLS[condense.element].name} Fragment`, screen: 'tower-condensation', status: waitingMana ? 'waiting-mana' : 'running', progressPercent: clamp(condense.progressMs / duration * 100, 0, 100), remainingMs, collapsedSummary: waitingMana ? `${SCHOOLS[condense.element].name} Condense · WAITING MANA` : `${SCHOOLS[condense.element].name} Condense · ${formatCompactDuration(remainingMs)}`, metrics: [metric('Potential', formatRatePerHour(3_600_000 / duration)), metric('Mana', `${formatSignedRate(-(BALANCE.condense.manaCost / (duration / 1000)))} avg`, 'negative'), metric('Focus', `${BALANCE.condense.focusCost}`)], accent: 'orange' })
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

  const transmutation = state.activities.transmutation
  if (transmutation.running && transmutation.recipeId) {
    const recipe = RECIPES[transmutation.recipeId]
    if (recipe) {
      const remainingMs = Math.max(0, recipe.durationMs - transmutation.progressMs)
      activities.push({ id: 'transmutation', label: 'TRANSMUTATION', subtitle: `${recipe.name} → ${ITEMS[recipe.output]?.name ?? recipe.output}`, screen: 'tower-transmutation', status: 'running', progressPercent: clamp(transmutation.progressMs / recipe.durationMs * 100, 0, 100), remainingMs, collapsedSummary: `${recipe.name} · ${formatCompactDuration(remainingMs)}`, metrics: [metric('Potential', formatRatePerHour(3_600_000 / recipe.durationMs)), metric('Cycle', formatCompactDuration(remainingMs)), metric('Focus', `${recipe.focusCost}`)], accent: 'gold' })
    }
  }

  return activities
}

import { BALANCE } from '../../core/balance/balance'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { RECIPES } from '../../content/recipes/recipes'
import { SCHOOLS } from '../../content/schools/schools'
import type { ActivityMetric, ActivityTelemetry, GameState } from '../../types'
import { clamp, formatCompactDuration, formatNumber, formatRatePerHour, formatSignedRate } from '../../utils'

const metric = (label: string, value: string, tone?: ActivityMetric['tone']): ActivityMetric => ({ label, value, tone })

export const getActivityTelemetry = (state: GameState): ActivityTelemetry[] => {
  const activities: ActivityTelemetry[] = []

  if (state.combat.active) {
    if (state.combat.enemyId) {
      const enemy = MONSTERS[state.combat.enemyId]
      const nextAction = enemy.actionSequence[state.combat.enemyActionIndex % enemy.actionSequence.length]
      const nextSpecial = nextAction.specialAttackId ? enemy.specialAttacks[nextAction.specialAttackId] : undefined
      const nextLabel = state.combat.enemyTelegraphActionId
        ? enemy.specialAttacks[state.combat.enemyTelegraphActionId]?.name ?? 'Telegraph'
        : nextSpecial?.name ?? 'Basic Attack'
      const nextTime = state.combat.enemyTelegraphMs > 0 ? state.combat.enemyTelegraphMs : state.combat.enemyActionTimerMs
      activities.push({
        id: 'combat',
        label: 'COMBAT',
        subtitle: DUNGEONS[state.combat.dungeonId ?? 'whispering-woods'].name,
        screen: 'combat',
        status: 'combat',
        progressPercent: clamp(state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) * 100, 0, 100),
        metrics: [
          metric(enemy.name, `Enemy HP ${Math.round(state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) * 100)}%`),
          metric('Threat', `${formatNumber(state.combat.threatCleared)} / ${formatNumber(DUNGEONS[state.combat.dungeonId ?? 'whispering-woods'].threatRequired)}`),
          metric('Next', `${nextLabel} · ${formatCompactDuration(nextTime)}`),
        ],
        accent: 'red',
      })
    } else {
      activities.push({
        id: 'combat',
        label: 'COMBAT',
        subtitle: DUNGEONS[state.combat.dungeonId ?? 'whispering-woods'].name,
        screen: 'combat',
        status: 'recovery',
        remainingMs: state.combat.encounterTimerMs,
        metrics: [
          metric('NEXT ENCOUNTER', formatCompactDuration(state.combat.encounterTimerMs)),
          metric('Threat', `${formatNumber(state.combat.threatCleared)} / ${formatNumber(DUNGEONS[state.combat.dungeonId ?? 'whispering-woods'].threatRequired)}`),
        ],
        accent: 'red',
      })
    }
  }

  const condense = state.activities.condense
  if (condense.running) {
    const duration = BALANCE.condense.durationMs
    const waitingMana = condense.progressMs >= duration && state.player.mana < BALANCE.condense.manaCost
    activities.push({
      id: 'condensation',
      label: 'CONDENSATION',
      subtitle: `${SCHOOLS[condense.element].name} Fragment`,
      screen: 'tower-condensation',
      status: waitingMana ? 'waiting-mana' : 'running',
      progressPercent: clamp(condense.progressMs / duration * 100, 0, 100),
      remainingMs: Math.max(0, duration - condense.progressMs),
      metrics: [
        metric('Potential', formatRatePerHour(3_600_000 / duration)),
        metric('Mana', `${formatSignedRate(-(BALANCE.condense.manaCost / (duration / 1000)))} avg`, 'negative'),
        metric('Focus', `${BALANCE.condense.focusCost}`),
      ],
      accent: 'orange',
    })
  }

  const research = state.activities.research
  if (research.running && research.itemId && research.targetSchoolId && research.remainingQuantity > 0) {
    const duration = Math.max(1, research.durationPerItemMs)
    const waitingMana = research.status === 'waiting-mana' || (research.progressMs >= duration && state.player.mana < research.manaPerItem)
    const item = ITEMS[research.itemId]
    activities.push({
      id: 'research',
      label: 'RESEARCH',
      subtitle: `${item?.researchSchool ? SCHOOLS[item.researchSchool].name : 'Material'} → ${SCHOOLS[research.targetSchoolId].name}`,
      screen: 'tower-research',
      status: waitingMana ? 'waiting-mana' : research.status === 'paused' ? 'paused' : 'running',
      progressPercent: clamp(research.progressMs / duration * 100, 0, 100),
      remainingMs: Math.max(0, duration - research.progressMs),
      metrics: [
        metric('Remaining', `${formatNumber(research.remainingQuantity)} items`),
        metric('Cycle', formatCompactDuration(Math.max(0, duration - research.progressMs))),
        metric('XP/h', formatRatePerHour(research.xpPerItem * 3_600_000 / duration)),
        metric('Items/h', formatRatePerHour(3_600_000 / duration)),
        metric('Mana', formatSignedRate(-(research.manaPerItem / (duration / 1000))), 'negative'),
        metric('Focus', `${research.focusCost}`),
      ],
      accent: 'violet',
    })
  }

  const transmutation = state.activities.transmutation
  if (transmutation.running && transmutation.recipeId) {
    const recipe = RECIPES[transmutation.recipeId]
    if (recipe) {
      activities.push({
        id: 'transmutation',
        label: 'TRANSMUTATION',
        subtitle: `${recipe.name} → ${ITEMS[recipe.output]?.name ?? recipe.output}`,
        screen: 'tower-transmutation',
        status: 'running',
        progressPercent: clamp(transmutation.progressMs / recipe.durationMs * 100, 0, 100),
        remainingMs: Math.max(0, recipe.durationMs - transmutation.progressMs),
        metrics: [
          metric('Potential', formatRatePerHour(3_600_000 / recipe.durationMs)),
          metric('Cycle', formatCompactDuration(Math.max(0, recipe.durationMs - transmutation.progressMs))),
          metric('Focus', `${recipe.focusCost}`),
        ],
        accent: 'gold',
      })
    }
  }

  return activities
}

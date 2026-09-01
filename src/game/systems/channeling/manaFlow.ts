import { SPELLS } from '../../content/spells/spells'
import { RECIPES, RECIPE_ORDER } from '../../content/recipes/recipes'
import { BALANCE } from '../../core/balance/balance'
import { getManaRegenBreakdown } from '../../engine/channelingEngine'
import { getRecipeManaDemandPerSecond, getRecipeStatus } from '../transmutation/transmutationSelectors'
import { getResearchManaPerSecond, getPreparedResearchJobs, getResearchJobStatus } from '../research/researchSelectors'
import { getEffectiveManaCost } from '../combat/combatStats'
import type { GameState, ManaDemandSource, ManaFlowBreakdown } from '../../types'
import { isSpellUnlocked } from '../spells'

const FLOW_EPSILON = 0.05

export const getManaDemandBreakdown = (state: GameState): ManaDemandSource[] => {
  const sources: ManaDemandSource[] = []
  RECIPE_ORDER.forEach((recipeId) => {
    const recipe = RECIPES[recipeId]
    const echoes = Math.max(0, Math.floor(state.activities.transmutation.jobs[recipeId]?.echoesAssigned ?? 0))
    const status = getRecipeStatus(state, recipe)
    if (!echoes || recipe.manaCost <= 0 || status === 'locked' || status === 'paused' || status === 'waiting-materials') return
    sources.push({ id: `transmutation-${recipeId}`, label: `Transmutation · ${recipe.name}`, manaPerSecond: getRecipeManaDemandPerSecond(recipe, echoes) })
  })

  const researchJobs = getPreparedResearchJobs(state).filter((job) => {
    if (job.echoesAssigned <= 0) return false
    const status = getResearchJobStatus(state, job.slotId)
    return status === 'running' || status === 'mana-limited' || status === 'waiting-mana'
  })
  if (researchJobs.length > 0) {
    researchJobs.forEach((job) => sources.push({ id: `research-${job.slotId}`, label: `Research · ${job.itemId}`, manaPerSecond: getResearchManaPerSecond(job) }))
  }

  if (state.combat.active) {
    Object.entries(state.activities.autoCast).forEach(([id, enabled]) => {
      if (!enabled) return
      const spell = SPELLS[id as keyof typeof SPELLS]
      if (!spell || !isSpellUnlocked(state, spell.id) || spell.cooldownMs <= 0) return
      sources.push({
        id: `autocast-${spell.id}`,
        label: `Auto-Cast · ${spell.name}`,
        manaPerSecond: getEffectiveManaCost(state, spell.manaCost) / (spell.cooldownMs / 1000),
        estimated: true,
      })
    })
  }

  return sources
}

export const getManaFlowBreakdown = (state: GameState): ManaFlowBreakdown => {
  const production = getManaRegenBreakdown(state).total
  const demandSources = getManaDemandBreakdown(state)
  const demand = demandSources.reduce((total, source) => total + source.manaPerSecond, 0)
  const net = production - demand
  const stateName = net > FLOW_EPSILON ? 'surplus' : net < -FLOW_EPSILON ? 'deficit' : 'balanced'
  let etaMs: number | null = null
  let etaKind: ManaFlowBreakdown['etaKind'] = null

  if (stateName === 'surplus') {
    if (state.player.mana > state.player.maxMana) etaKind = null
    else if (state.player.mana >= state.player.maxMana) etaKind = 'full'
    else if (state.player.maxMana > state.player.mana) {
      etaMs = ((state.player.maxMana - state.player.mana) / net) * 1000
      etaKind = 'full'
    }
  } else if (stateName === 'deficit') {
    if (state.player.mana <= 0) etaKind = 'starved'
    else {
      etaMs = (state.player.mana / Math.abs(net)) * 1000
      etaKind = 'empty'
    }
  }

  return { production, demand, net, state: stateName, demandSources, etaMs, etaKind }
}

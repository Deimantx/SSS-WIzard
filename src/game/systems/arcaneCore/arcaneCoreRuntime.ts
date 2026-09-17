import type { ArcaneCoreState, GameState } from '../../types'
import { getArcaneCoreSpecialEffects } from './arcaneCoreProgression'
import { selectFreeFocus, selectUsedFocus } from '../focus/focusReservations'

const special = (state: Pick<ArcaneCoreState, 'nodes'>, type: import('../../types').ArcaneCoreSpecialEffect['type']) => getArcaneCoreSpecialEffects(state).filter((effect) => effect.type === type)

export const isArcaneCoreSpellFree = (state: Pick<GameState, 'arcaneCore' | 'combat'>) => {
  const nextCast = state.combat.arcaneCoreRuntime.spellCastCount + 1
  return special(state.arcaneCore, 'nth-spell-free').some((effect) => effect.type === 'nth-spell-free' && nextCast % effect.every === 0)
}

export const getArcaneCoreDynamicSpellPower = (state: Pick<GameState, 'arcaneCore' | 'activities' | 'progress' | 'equipment' | 'artifactProgress' | 'player'>) => {
  const perReservedFocus = special(state.arcaneCore, 'reserved-focus-spell-power').reduce((sum, effect) => effect.type === 'reserved-focus-spell-power' ? sum + effect.spellPowerPerReservedFocus : sum, 0)
  return selectUsedFocus(state) * perReservedFocus
}

export const getArcaneCoreDynamicManaRegen = (state: Pick<GameState, 'arcaneCore' | 'activities' | 'progress' | 'equipment' | 'artifactProgress' | 'player'>) => {
  const perFreeFocus = special(state.arcaneCore, 'free-focus-mana-regen').reduce((sum, effect) => effect.type === 'free-focus-mana-regen' ? sum + effect.manaRegenPerFreeFocus : sum, 0)
  return selectFreeFocus(state) * perFreeFocus
}

export const beginArcaneCoreSpellCast = (state: GameState, damaging: boolean) => {
  const runtime = state.combat.arcaneCoreRuntime
  runtime.spellCastCount += 1
  if (damaging) runtime.damagingSpellCount += 1
  const free = special(state.arcaneCore, 'nth-spell-free').some((effect) => effect.type === 'nth-spell-free' && runtime.spellCastCount % effect.every === 0)
  const damageMultiplier = special(state.arcaneCore, 'nth-damaging-spell-bonus').reduce((multiplier, effect) => effect.type === 'nth-damaging-spell-bonus' && runtime.damagingSpellCount % effect.every === 0 ? multiplier * effect.damageMultiplier : multiplier, 1)
  const cooldownPulse = special(state.arcaneCore, 'nth-spell-cooldown-pulse').some((effect) => effect.type === 'nth-spell-cooldown-pulse' && runtime.spellCastCount % effect.every === 0)
  if (cooldownPulse) runtime.cooldownPulseSpellCount += 1
  return { free, damageMultiplier, cooldownPulse }
}

export const getArcaneCoreCooldownPulseReduction = (state: Pick<GameState, 'arcaneCore' | 'combat'>) => {
  const count = state.combat.arcaneCoreRuntime.spellCastCount
  return special(state.arcaneCore, 'nth-spell-cooldown-pulse').reduce((reduction, effect) => effect.type === 'nth-spell-cooldown-pulse' && count % effect.every === 0 ? Math.max(reduction, effect.cooldownReductionMs) : reduction, 0)
}

export const tryConsumeArcaneCoreSurvival = (state: GameState) => {
  const effect = special(state.arcaneCore, 'lethal-survival')[0]
  if (!effect || effect.type !== 'lethal-survival' || !effect.oncePerDungeonRun || state.combat.arcaneCoreRuntime.survivalInstinctUsed) return false
  state.combat.arcaneCoreRuntime.survivalInstinctUsed = true
  return true
}

export const resetArcaneCoreCombatRuntime = (state: GameState) => {
  state.combat.arcaneCoreRuntime = { damagingSpellCount: 0, spellCastCount: 0, cooldownPulseSpellCount: 0, survivalInstinctUsed: false }
}

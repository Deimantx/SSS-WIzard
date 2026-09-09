import { TRANSMUTATION_ARRAYS, TRANSMUTATION_ARRAY_IDS } from '../../content/transmutation/transmutationArrays'
import type { GameState, TransmutationArrayId } from '../../types'
import type { RecipeDefinition } from '../../content/recipes/recipes'

export interface TransmutationArrayBonuses {
  craftSpeedPct: number
  craftSpeedMultiplier: number
  preservationChance: number
  replicationChance: number
  manaCostReductionPct: number
  echoCapacityBonus: number
}

const finiteLevel = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(10, Math.floor(value))) : 0

export const getTransmutationArrayEffectValue = (arrayId: TransmutationArrayId, level: number) => {
  const definition = TRANSMUTATION_ARRAYS[arrayId]
  const safeLevel = finiteLevel(level)
  if (!definition) return 0
  return definition.effect === 'echo-capacity' ? Math.floor(safeLevel / 5) : safeLevel * definition.valuePerLevel
}

export const getTransmutationArrayLevel = (state: Pick<GameState, 'progress'>, arrayId: TransmutationArrayId) => finiteLevel(state.progress.transmutation?.arrays?.[arrayId]?.level)

export const getTransmutationArrayBonuses = (state: Pick<GameState, 'progress'>): TransmutationArrayBonuses => {
  const levels = TRANSMUTATION_ARRAY_IDS.reduce((result, id) => {
    result[id] = getTransmutationArrayLevel(state, id)
    return result
  }, {} as Record<TransmutationArrayId, number>)
  return {
    craftSpeedPct: getTransmutationArrayEffectValue('temporal-array', levels['temporal-array']),
    craftSpeedMultiplier: 1 + getTransmutationArrayEffectValue('temporal-array', levels['temporal-array']),
    preservationChance: getTransmutationArrayEffectValue('conservation-array', levels['conservation-array']),
    replicationChance: getTransmutationArrayEffectValue('replication-array', levels['replication-array']),
    manaCostReductionPct: getTransmutationArrayEffectValue('mana-refinement-array', levels['mana-refinement-array']),
    echoCapacityBonus: getTransmutationArrayEffectValue('echo-stabilization-array', levels['echo-stabilization-array']),
  }
}

export const getEffectiveTransmutationManaCost = (state: Pick<GameState, 'progress'>, recipe: RecipeDefinition) => Math.max(0, recipe.manaCost * (1 - getTransmutationArrayBonuses(state).manaCostReductionPct))

export const getEffectiveTransmutationWorkMultiplier = (state: Pick<GameState, 'progress'>, echoesAssigned: number) => Math.max(0, Number.isFinite(echoesAssigned) ? Math.floor(echoesAssigned) : 0) * getTransmutationArrayBonuses(state).craftSpeedMultiplier

export const getEffectiveTransmutationDuration = (state: Pick<GameState, 'progress'>, recipe: RecipeDefinition, echoesAssigned: number) => {
  const multiplier = getEffectiveTransmutationWorkMultiplier(state, echoesAssigned)
  return multiplier > 0 ? recipe.baseDurationMs / multiplier : null
}

export const getEffectiveTransmutationCraftsPerHour = (state: Pick<GameState, 'progress'>, recipe: RecipeDefinition, echoesAssigned: number) => getEffectiveTransmutationWorkMultiplier(state, echoesAssigned) * 3_600_000 / Math.max(1, recipe.baseDurationMs)

export const getEffectiveTransmutationOutputPerHour = (state: Pick<GameState, 'progress'>, recipe: RecipeDefinition, echoesAssigned: number) => getEffectiveTransmutationCraftsPerHour(state, recipe, echoesAssigned) * recipe.output.quantity * (1 + getTransmutationArrayBonuses(state).replicationChance)

export const getExpectedTransmutationIngredientConsumptionPerHour = (
  state: Pick<GameState, 'progress'>,
  recipe: RecipeDefinition,
  echoesAssigned: number,
  ingredientQuantity: number,
) => getEffectiveTransmutationCraftsPerHour(state, recipe, echoesAssigned)
  * Math.max(0, ingredientQuantity)
  * (1 - getTransmutationArrayBonuses(state).preservationChance)

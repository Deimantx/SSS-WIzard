import { ITEMS } from '../../content/items/items'
import { TRANSMUTATION_RECIPES } from '../../content/recipes/transmutationRecipes'
import { SCHOOLS } from '../../content/schools/schools'
import { getArcaneFluxProductionPerSecond } from '../../systems/channeling/channelingRuntime'
import { getAcolyteAssignments, type AcolyteAssignmentSource } from '../../systems/acolytes/acolyteAssignments'
import { getResearchItemsPerHour } from '../../systems/research/researchSelectors'
import { getRecipeOutputPerHour } from '../../systems/transmutation/transmutationSelectors'
import type { GameState, ResearchSlotId, TransmutationRecipeId } from '../../types'

export interface AcolyteAssignmentGroup {
  key: string
  sourceType: AcolyteAssignmentSource
  sourceId: string
  label: string
  count: number
  status?: string
  outputValue?: number
  outputUnit?: 'FLUX/S' | 'ITEMS/H' | 'OUTPUT/H'
}

/** Groups identical Tower work for the staffing overview without changing runtime assignment state. */
export const getAcolyteAssignmentGroups = (state: GameState): AcolyteAssignmentGroup[] => {
  const assignments = getAcolyteAssignments(state)
  const grouped = new Map<string, AcolyteAssignmentGroup>()

  assignments.forEach((assignment) => {
    let key = `${assignment.sourceType}:${assignment.sourceId}`
    let label = assignment.label
    let outputValue: number | undefined
    let outputUnit: AcolyteAssignmentGroup['outputUnit']

    if (assignment.sourceType === 'channeling') {
      key = 'channeling'
      label = 'Leyline Channeling'
      outputValue = getArcaneFluxProductionPerSecond(state).total
      outputUnit = 'FLUX/S'
    } else if (assignment.sourceType === 'research') {
      const slot = state.activities.research.slots[assignment.sourceId as ResearchSlotId]
      if (slot) {
        key = `research:${slot.itemId}:${slot.targetSchoolId}`
        label = `${ITEMS[slot.itemId]?.name ?? slot.itemId} → ${SCHOOLS[slot.targetSchoolId]?.name ?? slot.targetSchoolId}`
        outputValue = getResearchItemsPerHour(slot)
        outputUnit = 'ITEMS/H'
      }
    } else {
      const recipeId = assignment.sourceId as TransmutationRecipeId
      key = `transmutation:${recipeId}`
      label = ITEMS[recipeId]?.name ?? TRANSMUTATION_RECIPES[recipeId]?.name ?? recipeId
      outputValue = getRecipeOutputPerHour(TRANSMUTATION_RECIPES[recipeId], 1, state)
      outputUnit = 'OUTPUT/H'
    }

    const existing = grouped.get(key)
    if (existing) {
      existing.count += 1
      if (existing.sourceType === 'research') existing.outputValue = getResearchItemsPerHour(state.activities.research.slots[existing.sourceId as ResearchSlotId]!) * existing.count
      if (existing.sourceType === 'transmutation') existing.outputValue = getRecipeOutputPerHour(TRANSMUTATION_RECIPES[existing.sourceId as TransmutationRecipeId], existing.count, state)
      return
    }

    grouped.set(key, { key, sourceType: assignment.sourceType, sourceId: assignment.sourceId, label, count: 1, status: assignment.status, outputValue, outputUnit })
  })

  return [...grouped.values()]
}

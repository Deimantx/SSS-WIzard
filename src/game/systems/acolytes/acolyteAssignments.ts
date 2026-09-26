import { ITEMS } from '../../content/items/items'
import { SCHOOLS } from '../../content/schools/schools'
import type { GameState, ResearchSlotId, TransmutationRecipeId } from '../../types'
import { selectTotalAcolytes } from './acolyteCapacity'

export type AcolyteAssignmentSource = 'channeling' | 'research' | 'transmutation'
export interface AcolyteAssignment { id: string; sourceType: AcolyteAssignmentSource; sourceId: string; label: string; status?: string }

const channelingCount = (state: Pick<GameState, 'activities'>) => Math.max(0, Math.floor(state.activities.channeling.acolytesAssigned ?? state.activities.channeling.echoesAssigned ?? 0))

export const getAcolyteAssignments = (state: Pick<GameState, 'activities'>): AcolyteAssignment[] => {
  const assignments: AcolyteAssignment[] = []
  for (let index = 0; index < channelingCount(state); index += 1) assignments.push({ id: `channeling-${index + 1}`, sourceType: 'channeling', sourceId: 'channeling', label: 'Channeling', status: 'assigned' })
  for (const slotId of ['research-1', 'research-2', 'research-3', 'research-4'] as ResearchSlotId[]) {
    const job = state.activities.research.slots[slotId]
    if (!job || !(job.acolyteAssigned || (job.acolyteAssigned === undefined && job.echoesAssigned > 0))) continue
    assignments.push({ id: slotId, sourceType: 'research', sourceId: slotId, label: `${ITEMS[job.itemId]?.name ?? job.itemId} → ${SCHOOLS[job.targetSchoolId]?.name ?? job.targetSchoolId}`, status: job.status })
  }
  Object.entries(state.activities.transmutation.jobs).forEach(([recipeId, job]) => {
    if (!job || !(job.acolyteAssigned || (job.acolyteAssigned === undefined && job.echoesAssigned > 0))) return
    assignments.push({ id: `transmutation-${recipeId}`, sourceType: 'transmutation', sourceId: recipeId, label: ITEMS[recipeId as TransmutationRecipeId]?.name ?? recipeId, status: 'assigned' })
  })
  return assignments
}

export const selectUsedAcolytes = (state: Pick<GameState, 'activities'>) => getAcolyteAssignments(state).length
export const selectFreeAcolytes = (state: Pick<GameState, 'tower' | 'activities'> & Partial<Pick<GameState, 'debug'>>) => Math.max(0, selectTotalAcolytes(state) - selectUsedAcolytes(state))
export const canAssignAcolyte = (state: Pick<GameState, 'tower' | 'activities'> & Partial<Pick<GameState, 'debug'>>) => Boolean(state.debug?.ignoreAcolyteLimit) || selectFreeAcolytes(state) > 0

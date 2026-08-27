import type { GameState, ItemId, ResearchActivity, ResearchJobState, ResearchSlotId } from '../../types'

export const RESEARCH_SLOT_ORDER: readonly ResearchSlotId[] = ['research-1', 'research-2', 'research-3', 'research-4']

const finiteQuantity = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
const getResearchActivity = (state: Pick<GameState, 'activities'>) => state.activities?.research as ResearchActivity | undefined

/** Derived reservation count. Prepared items remain in inventory until a cycle completes. */
export const getResearchReservedQuantity = (state: Pick<GameState, 'activities'>, itemId: ItemId) => {
  const research = getResearchActivity(state)
  const slots = research?.slots
  if (slots) {
    return RESEARCH_SLOT_ORDER.reduce((total, slotId) => {
      const job = slots[slotId]
      return total + (job?.itemId === itemId ? finiteQuantity(job.remainingQuantity) : 0)
    }, 0)
  }
  // Compatibility for callers that construct a V8-shaped activity in memory.
  return research?.running && research.itemId === itemId ? finiteQuantity(research.remainingQuantity) : 0
}

export const getResearchSlot = (state: Pick<GameState, 'activities'>, slotId: ResearchSlotId): ResearchJobState | null => state.activities.research?.slots?.[slotId] ?? null

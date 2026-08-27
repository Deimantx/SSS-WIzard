import { describe, expect, it } from 'vitest'
import type { ResearchSlotId } from '../../types'
import { BALANCE, SCHOOL_LEVEL_XP } from '../../core/balance/balance'
import { createInitialState } from '../../../store/initialState'
import { deriveFocusReservations } from '../../engine'
import { prepareResearchAction, assignResearchEchoAction, removeResearchEchoAction, removePreparedResearchAction } from '../../../store/actions/researchActions'
import { advanceResearch } from './researchEngine'
import { getResearchAvailableQuantity, getResearchEchoesAssigned, getResearchFocusReserved } from './researchSelectors'
import { getResearchReservedQuantity } from './researchReservations'

const prepared = (inventory = 100) => {
  const state = createInitialState()
  state.inventory['fire-fragment'] = inventory
  state.inventory['water-fragment'] = inventory
  state.inventory['earth-fragment'] = inventory
  state.inventory['air-fragment'] = inventory
  return state
}

describe('Arcane Crucible V2', () => {
  it('reserves rather than consumes prepared quantity and merges the same target', () => {
    const state = prepared()
    expect(prepareResearchAction(state, 'fire-fragment', 'fire', 10)).toBe(true)
    const job = state.activities.research.slots['research-1']!
    job.progressMs = 1200
    job.echoesAssigned = 2
    expect(prepareResearchAction(state, 'fire-fragment', 'fire', 15)).toBe(true)
    expect(state.activities.research.slots['research-1']).toMatchObject({ requestedQuantity: 25, remainingQuantity: 25, progressMs: 1200, echoesAssigned: 2 })
    expect(state.inventory['fire-fragment']).toBe(100)
    expect(getResearchReservedQuantity(state, 'fire-fragment')).toBe(25)
    expect(getResearchAvailableQuantity(state, 'fire-fragment')).toBe(75)
  })

  it('supports four unique batches and caps a fifth', () => {
    const state = prepared()
    ;(['fire', 'water', 'earth', 'air'] as const).forEach((school) => expect(prepareResearchAction(state, `${school}-fragment` as never, school, 5)).toBe(true))
    expect(prepareResearchAction(state, 'fire-fragment', 'water', 1)).toBe(false)
    expect(Object.values(state.activities.research.slots).filter(Boolean)).toHaveLength(4)
  })

  it('runs four jobs simultaneously and uses stable Echo/Focus accounting', () => {
    const state = prepared()
    ;(['fire', 'water', 'earth', 'air'] as const).forEach((school, index) => {
      prepareResearchAction(state, `${school}-fragment` as never, school, 10)
      for (let echo = 0; echo < (index === 0 ? 2 : 1); echo += 1) assignResearchEchoAction(state, `research-${index + 1}` as ResearchSlotId)
    })
    state.player.mana = 100
    advanceResearch(state, BALANCE.research.durationPerItemMs)
    expect(state.schools.fire.xp).toBe(24)
    expect(state.schools.water.xp).toBe(12)
    expect(state.schools.earth.xp).toBe(12)
    expect(state.schools.air.xp).toBe(12)
    expect(getResearchEchoesAssigned(state)).toBe(5)
    expect(getResearchFocusReserved(state)).toBe(50)
    expect(deriveFocusReservations(state).filter((entry) => entry.sourceType === 'research')).toHaveLength(4)
  })

  it('is chunk invariant for equivalent elapsed time', () => {
    const run = (chunks: number[]) => {
      const state = prepared()
      prepareResearchAction(state, 'fire-fragment', 'fire', 20)
      assignResearchEchoAction(state, 'research-1')
      state.player.mana = 100
      chunks.forEach((delta) => advanceResearch(state, delta))
      return { inventory: state.inventory['fire-fragment'], xp: state.schools.fire.xp, job: state.activities.research.slots['research-1'] }
    }
    expect(run([1000, 1000, 1000, 1000, 1000])).toEqual(run([250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250]))
  })

  it('holds progress and releases Echoes at a cap or protection block', () => {
    const state = prepared()
    prepareResearchAction(state, 'fire-fragment', 'fire', 3)
    assignResearchEchoAction(state, 'research-1')
    advanceResearch(state, 1000)
    const progress = state.activities.research.slots['research-1']!.progressMs
    state.schools.fire.level = state.progress.magicLevelCap
    state.schools.fire.xp = SCHOOL_LEVEL_XP(state.progress.magicLevelCap)
    advanceResearch(state, 1000)
    expect(state.activities.research.slots['research-1']).toMatchObject({ remainingQuantity: 3, progressMs: progress, echoesAssigned: 0, status: 'level-cap' })
    state.schools.fire.level = 1
    state.schools.fire.xp = 0
    state.protectedItems['fire-fragment'] = true
    expect(assignResearchEchoAction(state, 'research-1')).toBe(false)
    expect(removeResearchEchoAction(state, 'research-1')).toBe(true)
    expect(removePreparedResearchAction(state, 'research-1')).toBe(true)
  })
})

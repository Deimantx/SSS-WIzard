import { describe, expect, it } from 'vitest'
import { getSchoolLevelStartXp } from '../../game/systems/schools'
import { grantSchoolXp } from '../../game/engine'
import { createInitialState } from '../initialState'
import { setSchoolDebugAction, unlockAllSpellsAction } from './progressionActions'

describe('school progression debug controls', () => {
  it('uses canonical School Level start XP thresholds for quick sets', () => {
    expect([2, 8, 16, 20, 40].map(getSchoolLevelStartXp)).toEqual([20, 140, 300, 380, 780])
    const state = createInitialState()
    setSchoolDebugAction(state, 'fire', getSchoolLevelStartXp(8), 8)
    expect(state.schools.fire).toEqual({ xp: 140, level: 8 })
    unlockAllSpellsAction(state)
    expect(state.schools.fire.xp).toBe(300)
  })

  it('does not jump a level from a small Research XP gain', () => {
    const state = createInitialState()
    grantSchoolXp(state, 'fire', 1)
    expect(state.schools.fire).toEqual({ xp: 1, level: 1 })
    grantSchoolXp(state, 'fire', 19)
    expect(state.schools.fire).toEqual({ xp: 20, level: 2 })
  })
})

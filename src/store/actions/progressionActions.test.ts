import { describe, expect, it } from 'vitest'
import { getSchoolLevelStartXp } from '../../game/systems/schools'
import { grantSchoolXp } from '../../game/engine'
import { createInitialState } from '../initialState'
import { setSchoolLevelDebugAction, setSchoolXpDebugAction, unlockAllSpellsAction } from './progressionActions'

describe('school progression debug controls', () => {
  it('uses canonical School Level start XP thresholds for quick sets', () => {
    expect([2, 8, 16, 20, 40].map(getSchoolLevelStartXp)).toEqual([100, 2070, 15120, 29870, 252310])
    const state = createInitialState()
    setSchoolLevelDebugAction(state, 'fire', 8)
    expect(state.schools.fire).toEqual({ xp: 2070, level: 8 })
    unlockAllSpellsAction(state)
    expect(state.schools.fire.xp).toBe(15120)
  })

  it('does not jump a level from a small Research XP gain', () => {
    const state = createInitialState()
    grantSchoolXp(state, 'fire', 1)
    expect(state.schools.fire).toEqual({ xp: 1, level: 1 })
    grantSchoolXp(state, 'fire', 99)
    expect(state.schools.fire).toEqual({ xp: 100, level: 2 })
  })

  it('derives a level from an explicit total XP edit', () => {
    const state = createInitialState()
    setSchoolXpDebugAction(state, 'fire', 240)
    expect(state.schools.fire).toEqual({ xp: 240, level: 3 })
  })

  it('places large grants at the current cap with no hidden XP', () => {
    const state = createInitialState()
    state.schools.fire = { xp: 29000, level: 19 }
    grantSchoolXp(state, 'fire', 50000)
    expect(state.schools.fire).toEqual({ xp: 29870, level: 20 })
    state.progress.magicLevelCap = 40
    grantSchoolXp(state, 'fire', 1)
    expect(state.schools.fire).toEqual({ xp: 29871, level: 20 })
  })

  it('supports multi-level grants and preserves spell unlock boundaries', () => {
    const state = createInitialState()
    state.progress.magicLevelCap = 40
    grantSchoolXp(state, 'fire', 2100)
    expect(state.schools.fire).toEqual({ xp: 2100, level: 8 })
    expect(state.progress.spellRanks).toMatchObject({ 'fire-bolt': 1, ignite: 1 })
    expect(state.progress.spellRanks.fireball).toBeUndefined()

    grantSchoolXp(state, 'fire', 15120 - 2100 - 1)
    expect(state.schools.fire.level).toBe(15)
    expect(state.progress.spellRanks.fireball).toBeUndefined()
    grantSchoolXp(state, 'fire', 1)
    expect(state.schools.fire).toMatchObject({ xp: 15120, level: 16 })
    expect(state.progress.spellRanks.fireball).toBe(1)
  })
})

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getSchoolLevelStartXp, getSchoolMasterySummary, getSchoolNextLevelXp, getSchoolProgressInfo, projectSchoolProgress } from './schoolProgression'

describe('school progression selectors', () => {
  it('uses zero as the Level 1 start threshold', () => {
    const state = createInitialState()
    expect(getSchoolProgressInfo(state, 'fire')).toMatchObject({ level: 1, xp: 0, progress: 0 })
    state.schools.fire.xp = 10
    expect(getSchoolLevelStartXp(1)).toBe(0)
    expect(getSchoolNextLevelXp(1, 10)).toBe(20)
    expect(getSchoolProgressInfo(state, 'fire')).toMatchObject({ levelStartXp: 0, xpIntoLevel: 10, xpRequiredForLevel: 20, progress: 0.5 })
  })

  it('resets progress at a normal level threshold and calculates a midpoint', () => {
    const state = createInitialState()
    state.schools.fire.level = 2
    state.schools.fire.xp = 30
    expect(getSchoolProgressInfo(state, 'fire')).toMatchObject({ levelStartXp: 20, nextLevelXp: 40, xpIntoLevel: 10, xpRequiredForLevel: 20, progress: 0.5 })
    state.schools.fire.xp = 20
    expect(getSchoolProgressInfo(state, 'fire').progress).toBe(0)
  })

  it('returns cap semantics without inventing a next level', () => {
    const state = createInitialState()
    state.schools.fire.level = state.progress.magicLevelCap
    state.schools.fire.xp = state.progress.magicLevelCap * 20
    expect(getSchoolProgressInfo(state, 'fire')).toMatchObject({ atCap: true, progress: 1, nextLevelXp: null, xpRequiredForLevel: null })
    expect(projectSchoolProgress(state, 'fire', 500)).toMatchObject({ addedXp: 0, levelsGained: 0, cappedByCurrentCeiling: false })
  })

  it('projects levels without mutating the state and clamps at the cap', () => {
    const state = createInitialState()
    state.schools.fire.xp = 10
    const result = projectSchoolProgress(state, 'fire', 500)
    expect(result.projected).toMatchObject({ level: state.progress.magicLevelCap, progress: 1 })
    expect(result.levelsGained).toBe(state.progress.magicLevelCap - 1)
    expect(result.addedXp).toBe(390)
    expect(result.cappedByCurrentCeiling).toBe(true)
    expect(state.schools.fire).toEqual({ xp: 10, level: 1 })
  })

  it('projects a same-level result using the real thresholds', () => {
    const state = createInitialState()
    state.schools.water.level = 4
    state.schools.water.xp = 70
    const result = projectSchoolProgress(state, 'water', 5)
    expect(result.projected).toMatchObject({ level: 4, xp: 75, progress: 0.75 })
    expect(result.levelsGained).toBe(0)
  })

  it('builds mastery from the dynamic school record', () => {
    const state = createInitialState()
    state.schools.fire.level = 2
    state.schools.fire.xp = 20
    const summary = getSchoolMasterySummary(state)
    expect(summary.schoolCount).toBe(4)
    expect(summary.totalLevels).toBe(5)
    expect(summary.maximumLevels).toBe(80)
    expect(summary.cappedSchools).toBe(0)
    state.progress.magicLevelCap = 20
    expect(getSchoolMasterySummary(state).maximumLevels).toBe(80)
  })
})

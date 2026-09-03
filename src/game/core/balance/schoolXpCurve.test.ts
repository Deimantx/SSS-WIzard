import { describe, expect, it } from 'vitest'
import { getSchoolLevelFromXp, getSchoolTotalXpForLevel, getSchoolXpToNext, SCHOOL_MAX_LEVEL, SCHOOL_XP_TO_NEXT } from './schoolXpCurve'

describe('Magic School XP curve', () => {
  it('matches the authored incremental curve and cap', () => {
    expect(getSchoolXpToNext(1)).toBe(100)
    expect(getSchoolXpToNext(2)).toBe(140)
    expect(getSchoolXpToNext(8)).toBe(770)
    expect(getSchoolXpToNext(16)).toBe(3060)
    expect(getSchoolXpToNext(20)).toBe(4820)
    expect(getSchoolXpToNext(39)).toBe(18900)
    expect(getSchoolXpToNext(40)).toBeNull()
    expect(Object.keys(SCHOOL_XP_TO_NEXT)).toHaveLength(SCHOOL_MAX_LEVEL - 1)
  })

  it('matches the authored cumulative level thresholds', () => {
    expect(getSchoolTotalXpForLevel(1)).toBe(0)
    expect(getSchoolTotalXpForLevel(2)).toBe(100)
    expect(getSchoolTotalXpForLevel(8)).toBe(2070)
    expect(getSchoolTotalXpForLevel(16)).toBe(15120)
    expect(getSchoolTotalXpForLevel(20)).toBe(29870)
    expect(getSchoolTotalXpForLevel(40)).toBe(252310)
  })

  it('derives exact threshold boundaries without exceeding the current cap', () => {
    expect(getSchoolLevelFromXp(0, 40)).toBe(1)
    expect(getSchoolLevelFromXp(99, 40)).toBe(1)
    expect(getSchoolLevelFromXp(100, 40)).toBe(2)
    expect(getSchoolLevelFromXp(2069, 40)).toBe(7)
    expect(getSchoolLevelFromXp(2070, 40)).toBe(8)
    expect(getSchoolLevelFromXp(15119, 40)).toBe(15)
    expect(getSchoolLevelFromXp(15120, 40)).toBe(16)
    expect(getSchoolLevelFromXp(29869, 40)).toBe(19)
    expect(getSchoolLevelFromXp(29870, 40)).toBe(20)
    expect(getSchoolLevelFromXp(999999, 20)).toBe(20)
  })

  it('sanitizes levels at the authored boundaries', () => {
    expect(getSchoolTotalXpForLevel(0)).toBe(0)
    expect(getSchoolTotalXpForLevel(999)).toBe(252310)
    expect(getSchoolXpToNext(999)).toBeNull()
  })
})

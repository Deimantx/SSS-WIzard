import { SCHOOLS } from '../../content/schools/schools'
import { SCHOOL_MAX_LEVEL, getSchoolLevelFromXp, getSchoolTotalXpForLevel } from '../../core/balance/schoolXpCurve'
import type { GameState, SchoolId } from '../../types'
import { clamp } from '../../utils'

export interface SchoolProgressInfo {
  schoolId: SchoolId
  level: number
  cap: number
  xp: number
  atCap: boolean
  levelStartXp: number
  nextLevelXp: number | null
  xpIntoLevel: number
  xpRequiredForLevel: number | null
  progress: number
}

export interface SchoolProgressProjection {
  current: SchoolProgressInfo
  projected: SchoolProgressInfo
  addedXp: number
  levelsGained: number
  cappedByCurrentCeiling: boolean
}

const finiteNonNegative = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
const schoolIds = (state: Pick<GameState, 'schools'>) => Object.keys(state.schools) as SchoolId[]
const normalizeSchoolCap = (cap: number) => Math.min(SCHOOL_MAX_LEVEL, Math.max(1, Number.isFinite(cap) ? Math.floor(cap) : 1))
const normalizeSchoolLevel = (level: number, cap: number) => Math.min(cap, Math.max(1, Number.isFinite(level) ? Math.floor(level) : 1))

/** Absolute cumulative XP threshold at the start of a School level. */
export const getSchoolLevelStartXp = getSchoolTotalXpForLevel

/** Absolute XP threshold for the next level, or null when the school is capped. */
export const getSchoolNextLevelXp = (level: number, cap: number) => {
  const safeCap = normalizeSchoolCap(cap)
  const safeLevel = normalizeSchoolLevel(level, safeCap)
  return safeLevel >= safeCap ? null : getSchoolTotalXpForLevel(safeLevel + 1)
}

export const getSchoolLevel = getSchoolLevelFromXp

const buildProgressInfo = (schoolId: SchoolId, level: number, cap: number, xp: number): SchoolProgressInfo => {
  const safeCap = normalizeSchoolCap(cap)
  const safeLevel = normalizeSchoolLevel(level, safeCap)
  const safeXp = Math.min(getSchoolTotalXpForLevel(safeCap), finiteNonNegative(xp))
  const atCap = safeLevel >= safeCap
  const levelStartXp = getSchoolLevelStartXp(safeLevel)
  const nextLevelXp = getSchoolNextLevelXp(safeLevel, safeCap)
  const xpRequiredForLevel = nextLevelXp === null ? null : nextLevelXp - levelStartXp
  return {
    schoolId,
    level: safeLevel,
    cap: safeCap,
    xp: safeXp,
    atCap,
    levelStartXp,
    nextLevelXp,
    xpIntoLevel: Math.max(0, safeXp - levelStartXp),
    xpRequiredForLevel,
    progress: nextLevelXp === null ? 1 : clamp((safeXp - levelStartXp) / xpRequiredForLevel!, 0, 1),
  }
}

export const getSchoolProgressInfo = (state: Pick<GameState, 'schools' | 'progress'>, schoolId: SchoolId): SchoolProgressInfo => {
  const school = state.schools[schoolId]
  const cap = normalizeSchoolCap(state.progress.magicLevelCap)
  return buildProgressInfo(schoolId, school?.level ?? 1, cap, school?.xp ?? 0)
}

export const projectSchoolProgress = (state: Pick<GameState, 'schools' | 'progress'>, schoolId: SchoolId, additionalXp: number): SchoolProgressProjection => {
  const current = getSchoolProgressInfo(state, schoolId)
  const requestedXp = finiteNonNegative(additionalXp)
  if (current.atCap) return { current, projected: current, addedXp: 0, levelsGained: 0, cappedByCurrentCeiling: false }
  const projectedXp = Math.min(getSchoolTotalXpForLevel(current.cap), current.xp + requestedXp)
  const projectedLevel = getSchoolLevel(projectedXp, current.cap)
  const projected = buildProgressInfo(schoolId, projectedLevel, current.cap, projectedXp)
  return {
    current,
    projected,
    addedXp: Math.max(0, projectedXp - current.xp),
    levelsGained: Math.max(0, projected.level - current.level),
    cappedByCurrentCeiling: requestedXp > 0 && projectedXp >= getSchoolTotalXpForLevel(current.cap) && current.xp < getSchoolTotalXpForLevel(current.cap),
  }
}

export interface SchoolMasterySummary {
  totalLevels: number
  maximumLevels: number
  ratio: number
  cappedSchools: number
  schoolCount: number
  schools: SchoolProgressInfo[]
}

export const getSchoolMasterySummary = (state: Pick<GameState, 'schools' | 'progress'>): SchoolMasterySummary => {
  const schools = schoolIds(state).filter((schoolId) => Boolean(SCHOOLS[schoolId])).map((schoolId) => getSchoolProgressInfo(state, schoolId))
  const maximumLevels = schools.reduce((total, school) => total + school.cap, 0)
  const totalLevels = schools.reduce((total, school) => total + school.level, 0)
  return {
    totalLevels,
    maximumLevels,
    ratio: maximumLevels > 0 ? clamp(totalLevels / maximumLevels, 0, 1) : 0,
    cappedSchools: schools.filter((school) => school.atCap).length,
    schoolCount: schools.length,
    schools,
  }
}

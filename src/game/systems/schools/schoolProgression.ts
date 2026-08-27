import { SCHOOLS } from '../../content/schools/schools'
import { SCHOOL_LEVEL_XP } from '../../core/balance/balance'
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

/** XP required to enter a school level. Level 1 begins at zero XP. */
export const getSchoolLevelStartXp = (level: number) => Math.max(1, Math.floor(level)) <= 1 ? 0 : SCHOOL_LEVEL_XP(Math.max(1, Math.floor(level)) - 1)

/** Absolute XP threshold for the next level, or null when the school is capped. */
export const getSchoolNextLevelXp = (level: number, cap: number) => {
  const safeLevel = Math.max(1, Math.floor(level))
  const safeCap = Math.max(1, Math.floor(cap))
  return safeLevel >= safeCap ? null : SCHOOL_LEVEL_XP(safeLevel)
}

export const getSchoolLevel = (xp: number, cap: number) => {
  const safeCap = Math.max(1, Math.floor(cap))
  const safeXp = finiteNonNegative(xp)
  let level = 1
  for (let next = 2; next <= safeCap; next += 1) {
    if (safeXp >= SCHOOL_LEVEL_XP(next - 1)) level = next
    else break
  }
  return level
}

const buildProgressInfo = (schoolId: SchoolId, level: number, cap: number, xp: number): SchoolProgressInfo => {
  const safeCap = Math.max(1, Math.floor(cap))
  const safeLevel = Math.min(safeCap, Math.max(1, Math.floor(level)))
  const safeXp = Math.min(SCHOOL_LEVEL_XP(safeCap), finiteNonNegative(xp))
  const atCap = safeLevel >= safeCap
  const levelStartXp = getSchoolLevelStartXp(safeLevel)
  const nextLevelXp = getSchoolNextLevelXp(safeLevel, safeCap)
  const xpRequiredForLevel = nextLevelXp === null ? null : Math.max(1, nextLevelXp - levelStartXp)
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
    progress: nextLevelXp === null ? 1 : clamp((safeXp - levelStartXp) / Math.max(1, nextLevelXp - levelStartXp), 0, 1),
  }
}

export const getSchoolProgressInfo = (state: Pick<GameState, 'schools' | 'progress'>, schoolId: SchoolId): SchoolProgressInfo => {
  const school = state.schools[schoolId]
  const cap = Math.max(1, Math.floor(state.progress.magicLevelCap))
  return buildProgressInfo(schoolId, school?.level ?? 1, cap, school?.xp ?? 0)
}

export const projectSchoolProgress = (state: Pick<GameState, 'schools' | 'progress'>, schoolId: SchoolId, additionalXp: number): SchoolProgressProjection => {
  const current = getSchoolProgressInfo(state, schoolId)
  const requestedXp = finiteNonNegative(additionalXp)
  if (current.atCap) return { current, projected: current, addedXp: 0, levelsGained: 0, cappedByCurrentCeiling: false }
  const projectedXp = Math.min(SCHOOL_LEVEL_XP(current.cap), current.xp + requestedXp)
  const projectedLevel = getSchoolLevel(projectedXp, current.cap)
  const projected = buildProgressInfo(schoolId, projectedLevel, current.cap, projectedXp)
  return {
    current,
    projected,
    addedXp: Math.max(0, projectedXp - current.xp),
    levelsGained: Math.max(0, projected.level - current.level),
    cappedByCurrentCeiling: requestedXp > 0 && projectedXp >= SCHOOL_LEVEL_XP(current.cap) && current.xp < SCHOOL_LEVEL_XP(current.cap),
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

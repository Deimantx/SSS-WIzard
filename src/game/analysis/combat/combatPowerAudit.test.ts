import { describe, expect, it } from 'vitest'
import { buildBossPowerRatioAudit, buildDifficultyInversionAudit, buildMonsterPowerAudit, buildSequencePowerAudit, buildThreatKillsToBossAudit, getPowerAuditWorldTiers } from './combatPowerAudit'
import { COMBAT_LOCATIONS } from '../../content/combat-locations/worldNavigation'

describe('combat Power audit reports', () => {
  it('emits deterministic finite rows for targeted and sequence content', () => {
    const first = buildMonsterPowerAudit(1)
    const second = buildMonsterPowerAudit(1)
    expect(first).toEqual(second)
    expect(first.length).toBeGreaterThan(50)
    expect(first.every((row) => Number.isFinite(row.power) && row.power > 0)).toBe(true)
    expect(first.some((row) => row.encounterMode === 'targeted' && row.difficulty === 'apex')).toBe(true)
    expect(first.some((row) => row.encounterMode === 'sequence' && row.role === 'boss')).toBe(true)
  })

  it('reports smooth authored Power progression through the Broken Meridian sequence', () => {
    const report = buildSequencePowerAudit(1).filter((row) => row.locationId === 'broken-meridian')
    expect(report.map((row) => row.monsterId)).toEqual([...COMBAT_LOCATIONS['broken-meridian'].encounterSequence!, COMBAT_LOCATIONS['broken-meridian'].boss!])
    expect(report.every((row, index) => index === 0 || row.power > report[index - 1].power)).toBe(true)
    expect(report.every((row) => !row.largeNegativeDelta)).toBe(true)
  })

  it('exposes diagnostic Boss ratios and difficulty inversions without hard-failing them', () => {
    const ratios = buildBossPowerRatioAudit(1)
    expect(ratios).toHaveLength(Object.values(COMBAT_LOCATIONS).filter((location) => location.encounterMode === 'sequence').length)
    expect(ratios.every((row) => Number.isFinite(row.bossToLastNormalRatio) && row.bossToLastNormalRatio > 1)).toBe(true)
    expect(buildDifficultyInversionAudit(1).some((row) => row.locationId === 'rootscar-hollow')).toBe(false)
    expect(getPowerAuditWorldTiers()).toEqual([1, 2, 3, 4, 5])
  })

  it('reports deterministic kills-to-boss pacing for targeted boss zones across WT1-WT5', () => {
    const first = buildThreatKillsToBossAudit()
    expect(first).toEqual(buildThreatKillsToBossAudit())
    expect(first.length).toBeGreaterThanOrEqual(25)
    expect(first.every((row) => row.threatRequired > 0 && row.weakestThreatPerKill > 0 && row.killsUsingWeakest >= row.killsUsingMedian && row.killsUsingMedian >= row.killsUsingStrongest)).toBe(true)
    expect(new Set(first.map((row) => row.worldTier))).toEqual(new Set([1, 2, 3, 4, 5]))
    expect(first.some((row) => row.locationId === 'whispering-woods' && row.worldTier === 1)).toBe(true)
  })
})

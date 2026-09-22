import { describe, expect, it } from 'vitest'
import { buildBossPowerRatioAudit, buildDifficultyInversionAudit, buildMonsterPowerAudit, buildSequencePowerAudit, getPowerAuditWorldTiers } from './combatPowerAudit'

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

  it('reports the Broken Meridian late-step Power drop without failing content validation', () => {
    const report = buildSequencePowerAudit(1).filter((row) => row.locationId === 'broken-meridian')
    expect(report.map((row) => row.monsterId)).toEqual(['meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade', 'meridian-splitter'])
    expect(report.find((row) => row.monsterId === 'linebreaker-shade')?.largeNegativeDelta).toBe(true)
    expect(report.find((row) => row.monsterId === 'linebreaker-shade')?.negativeDeltaPercent).toBeGreaterThan(15)
  })

  it('exposes diagnostic Boss ratios and difficulty inversions without hard-failing them', () => {
    const ratios = buildBossPowerRatioAudit(1)
    expect(ratios).toHaveLength(5)
    expect(ratios.every((row) => Number.isFinite(row.bossToLastNormalRatio) && row.bossToLastNormalRatio > 1)).toBe(true)
    expect(buildDifficultyInversionAudit(1).some((row) => row.locationId === 'rootscar-hollow')).toBe(true)
    expect(getPowerAuditWorldTiers()).toEqual([1, 2, 3, 4, 5])
  })
})

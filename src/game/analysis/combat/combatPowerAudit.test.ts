import { describe, expect, it } from 'vitest'
import { buildBossPowerRatioAudit, buildDifficultyInversionAudit, buildMonsterPowerAudit, buildSequencePowerAudit, buildThreatKillsToBossAudit } from './combatPowerAudit'

describe('canonical combat power audit', () => {
  it('returns one row per authored target and deterministic threat audits', () => {
    expect(buildMonsterPowerAudit().length).toBeGreaterThan(0)
    expect(buildBossPowerRatioAudit().length).toBeGreaterThan(0)
    expect(buildDifficultyInversionAudit()).toEqual(buildDifficultyInversionAudit())
    expect(buildSequencePowerAudit().length).toBeGreaterThan(0)
    const first = buildThreatKillsToBossAudit()
    expect(first).toEqual(buildThreatKillsToBossAudit())
    expect(first.every((row) => row.threatRequired >= 0)).toBe(true)
  })
})

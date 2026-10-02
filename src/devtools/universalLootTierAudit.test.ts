import { describe, expect, it } from 'vitest'
import { auditLootTierCoverage } from './universalLootTierAudit'

describe('Universal Loot tier coverage audit', () => {
  it('warns when a World Tier has at least three consecutive empty reachable tiers', () => {
    expect(auditLootTierCoverage([{ worldTier: 1, tiers: { 1: ['a'], 5: ['b'] } }])).toEqual([{ worldTier: 1, missingTiers: [2, 3, 4], longestConsecutiveGap: 3, warn: true }])
  })

  it('does not warn on short gaps or empty tiers outside the reachable range', () => {
    expect(auditLootTierCoverage([{ worldTier: 2, tiers: { 1: ['a'], 3: ['b'] } }])[0].warn).toBe(false)
  })
})

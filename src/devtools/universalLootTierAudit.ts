export interface LootTierCoverageWarning {
  worldTier: number
  missingTiers: number[]
  longestConsecutiveGap: number
  warn: boolean
}

export const auditLootTierCoverage = (coverageByWorldTier: readonly { worldTier: number; tiers: Record<number, readonly unknown[]> }[], warningGap = 3): LootTierCoverageWarning[] => coverageByWorldTier.map(({ worldTier, tiers }) => {
  const reachable = Object.keys(tiers).map(Number).filter((tier) => (tiers[tier]?.length ?? 0) > 0).sort((a, b) => a - b)
  const missingTiers: number[] = []
  let currentGap = 0
  let longestConsecutiveGap = 0
  for (let tier = reachable[0] ?? 1; tier <= (reachable[reachable.length - 1] ?? 0); tier += 1) {
    if (reachable.includes(tier)) currentGap = 0
    else { missingTiers.push(tier); currentGap += 1; longestConsecutiveGap = Math.max(longestConsecutiveGap, currentGap) }
  }
  return { worldTier, missingTiers, longestConsecutiveGap, warn: longestConsecutiveGap >= warningGap }
})

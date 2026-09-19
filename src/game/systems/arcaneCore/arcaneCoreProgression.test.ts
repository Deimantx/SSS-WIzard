import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_MAJOR_COST_BY_RING, ARCANE_CORE_STANDARD_RANK_COST_BY_RING, ARCANE_CORE_TOTAL_TREE_COST } from '../../content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_MAJOR_GATES, ARCANE_CORE_RING_GATES } from '../../content/arcaneCore/arcaneCoreRings'
import { createInitialArcaneCoreState, getArcaneCoreAvailablePoints, getArcaneCoreBranchResetPreview, getArcaneCoreNodeRank, getArcaneCorePointsSpent, getArcaneCoreRingStandardRanksInvested, getArcaneCoreStaticStats, getArcaneCoreWalletInfo, grantArcanePoints, isArcaneCoreMajorUnlocked, isArcaneCoreRingUnlocked, purchaseAllArcaneCoreNodes, purchaseArcaneCoreNode, refundArcaneCoreNode, resetArcaneCore, setArcaneCoreNodeRank } from './arcaneCoreProgression'

const power = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'power')!
const standards = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => power.nodes.filter((node) => node.ring === ring && node.nodeType !== 'major')
const major = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => power.nodes.find((node) => node.ring === ring && node.nodeType === 'major')!
const setRank = (state: ReturnType<typeof createInitialArcaneCoreState>, nodeId: string, rank: number) => {
  const result = setArcaneCoreNodeRank(state, nodeId, rank)
  if (!result.ok) throw new Error(result.reason)
  return result.state
}
const withPoints = (amount: number) => grantArcanePoints(createInitialArcaneCoreState(), amount).state

describe('Arcane Core V6 progression', () => {
  it('starts with a direct lifetime Arcane Points wallet', () => {
    expect(getArcaneCoreWalletInfo(createInitialArcaneCoreState())).toEqual({ totalPointsEarned: 0, pointsSpent: 0, pointsAvailable: 0, treeCost: ARCANE_CORE_TOTAL_TREE_COST })
  })

  it('floors grants, ignores negative values, and caps at the exact tree cost', () => {
    const state = createInitialArcaneCoreState()
    expect(grantArcanePoints(state, 4.9)).toMatchObject({ requested: 4, granted: 4, pointsAfter: 4, reachedCap: false })
    const capped = grantArcanePoints(grantArcanePoints(state, ARCANE_CORE_TOTAL_TREE_COST - 1).state, 99)
    expect(capped).toMatchObject({ granted: 1, pointsAfter: ARCANE_CORE_TOTAL_TREE_COST, reachedCap: true })
    expect(grantArcanePoints(state, -10)).toMatchObject({ requested: 0, granted: 0, pointsAfter: 0 })
  })

  it('assigns depth-based standard and Major costs', () => {
    for (const ring of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      expect(standards(ring)[0]!.rankCost).toBe(ARCANE_CORE_STANDARD_RANK_COST_BY_RING[ring])
      expect(major(ring).rankCost).toBe(ARCANE_CORE_MAJOR_COST_BY_RING[ring])
    }
  })

  it('opens Rings and Majors by standard rank counts', () => {
    let state = withPoints(1000)
    for (const node of standards(1).slice(0, 4)) state = setRank(state, node.id, 5)
    expect(getArcaneCoreRingStandardRanksInvested(state, 'power', 1)).toBe(20)
    expect(isArcaneCoreRingUnlocked(state, 'power', 2)).toBe(true)
    expect(isArcaneCoreRingUnlocked({ nodes: Object.fromEntries(standards(1).slice(0, 3).map((node) => [node.id, { rank: 5 }])) }, 'power', 2)).toBe(false)

    let ringFour = withPoints(1000)
    for (const node of standards(4)) ringFour = setRank(ringFour, node.id, 5)
    expect(getArcaneCoreRingStandardRanksInvested(ringFour, 'power', 4)).toBe(40)
    expect(isArcaneCoreMajorUnlocked(ringFour, major(4))).toBe(true)
    expect(isArcaneCoreMajorUnlocked(setRank(ringFour, standards(4)[0]!.id, 4), major(4))).toBe(false)
    expect(ARCANE_CORE_RING_GATES[8]).toBe(38)
    expect(ARCANE_CORE_MAJOR_GATES[8]).toBe(40)
  })

  it('purchases variable-cost ranks, refunds their exact cost, and preserves earned points on reset', () => {
    let state = withPoints(100)
    const node = standards(8)[0]!
    const purchased = purchaseArcaneCoreNode(state, node.id)
    expect(purchased.ok).toBe(false) // Ring VIII remains gated until preceding standard ranks are invested.
    for (const ring of [1, 2, 3, 4, 5, 6, 7] as const) for (const standard of standards(ring)) state = setRank(state, standard.id, 5)
    state = setRank(state, node.id, 1)
    expect(getArcaneCoreNodeRank(state, node.id)).toBe(1)
    expect(getArcaneCorePointsSpent(state)).toBeGreaterThanOrEqual(10)
    const refunded = refundArcaneCoreNode(state, node.id)
    expect(refunded.ok).toBe(true)
    expect(getArcaneCoreAvailablePoints(state)).toBe(0)
    const reset = resetArcaneCore(state)
    expect(reset).toEqual({ ok: true, state: { totalPointsEarned: 100, nodes: {} } })
  })

  it('cascades nodes when a refund relocks a dependent Ring', () => {
    let state = withPoints(100)
    for (const node of standards(1).slice(0, 4)) state = setRank(state, node.id, 5)
    state = setRank(state, standards(2)[0]!.id, 1)
    const refunded = refundArcaneCoreNode(state, standards(1)[0]!.id)
    expect(refunded.ok).toBe(true)
    if (refunded.ok) expect(refunded.state.nodes[standards(2)[0]!.id]).toBeUndefined()
    const branchPreview = getArcaneCoreBranchResetPreview(state, 'power')
    expect(branchPreview).toMatchObject({ ok: true, ranksAffected: 21 })
  })

  it('completes the exact 288-node tree and exposes percentage stat inputs', () => {
    const completed = purchaseAllArcaneCoreNodes(withPoints(ARCANE_CORE_TOTAL_TREE_COST))
    expect(Object.keys(completed.nodes)).toHaveLength(288)
    expect(getArcaneCorePointsSpent(completed)).toBe(ARCANE_CORE_TOTAL_TREE_COST)
    const vitality = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'vitality')!.nodes.find((node) => node.ring === 1 && node.nodeType !== 'major')!
    const focus = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'focus')!.nodes.find((node) => node.ring === 1 && node.nodeType !== 'major')!
    const stats = getArcaneCoreStaticStats({ nodes: { [vitality.id]: { rank: 5 }, [focus.id]: { rank: 5 } } })
    expect(stats).toMatchObject({ maxHealthPct: 0.025, maxManaPct: 0.025 })
  })
})

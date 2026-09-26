import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_FULL_RING_COST_BY_RING, ARCANE_CORE_MAJOR_COST_BY_RING, ARCANE_CORE_STANDARD_RANK_COST_BY_RING, ARCANE_CORE_TOTAL_COST_PER_CORE, ARCANE_CORE_TOTAL_TREE_COST } from '../../content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_MAJOR_GATES, ARCANE_CORE_RING_GATES } from '../../content/arcaneCore/arcaneCoreRings'
import { createInitialArcaneCoreState, getArcaneCoreAvailablePoints, getArcaneCoreNodeRank, getArcaneCorePointsSpent, getArcaneCoreRingStandardRanksInvested, getArcaneCoreStaticStats, getArcaneCoreWalletInfo, grantArcanePoints, isArcaneCoreMajorUnlocked, isArcaneCoreRingUnlocked, purchaseArcaneCoreNode, resetArcaneCore, setArcaneCoreNodeRank } from './arcaneCoreProgression'

const branch = ARCANE_CORE_BRANCHES.find((candidate) => candidate.id === 'power')!
const nodeAt = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, major = false) => branch.nodes.find((node) => node.ring === ring && (node.nodeType === 'major') === major)!
const standardNodes = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => branch.nodes.filter((node) => node.ring === ring && node.nodeType !== 'major')
const setRank = (state: ReturnType<typeof createInitialArcaneCoreState>, nodeId: string, rank: number) => {
  const result = setArcaneCoreNodeRank(state, nodeId, rank)
  if (!result.ok) throw new Error(result.reason)
  return result.state
}

describe('Arcane Core V6 Arcane Points economy', () => {
  it('starts with an empty lifetime wallet', () => {
    expect(getArcaneCoreWalletInfo(createInitialArcaneCoreState())).toEqual({ totalPointsEarned: 0, pointsSpent: 0, pointsAvailable: 0, treeCost: ARCANE_CORE_TOTAL_TREE_COST })
  })

  it('floors positive grants, ignores negative grants, and caps at the full tree cost', () => {
    const initial = createInitialArcaneCoreState()
    expect(grantArcanePoints(initial, 4.9)).toMatchObject({ requested: 4, granted: 4, pointsBefore: 0, pointsAfter: 4, reachedCap: false })
    const capped = grantArcanePoints(grantArcanePoints(initial, ARCANE_CORE_TOTAL_TREE_COST - 1).state, 99)
    expect(capped).toMatchObject({ granted: 1, pointsAfter: ARCANE_CORE_TOTAL_TREE_COST, reachedCap: true })
    expect(grantArcanePoints(initial, -10)).toMatchObject({ requested: 0, granted: 0, pointsAfter: 0 })
  })

  it('assigns standard and Major costs from Ring depth', () => {
    for (const ring of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      expect(nodeAt(ring).rankCost).toBe(ARCANE_CORE_STANDARD_RANK_COST_BY_RING[ring])
      expect(nodeAt(ring, true).rankCost).toBe(ARCANE_CORE_MAJOR_COST_BY_RING[ring])
    }
  })

  it('keeps the exact V6 rebalance table and wallet caps authoritative', () => {
    expect(ARCANE_CORE_STANDARD_RANK_COST_BY_RING).toEqual({ 1: 5, 2: 30, 3: 45, 4: 60, 5: 75, 6: 90, 7: 120, 8: 150 })
    expect(ARCANE_CORE_MAJOR_COST_BY_RING).toEqual({ 1: 12, 2: 144, 3: 216, 4: 288, 5: 360, 6: 432, 7: 576, 8: 720 })
    expect(ARCANE_CORE_FULL_RING_COST_BY_RING).toEqual({ 1: 212, 2: 1344, 3: 2016, 4: 2688, 5: 3360, 6: 4032, 7: 5376, 8: 6720 })
    expect(ARCANE_CORE_TOTAL_COST_PER_CORE).toBe(25_748)
    expect(ARCANE_CORE_TOTAL_TREE_COST).toBe(102_992)
  })

  it('unlocks Rings and Majors by standard ranks rather than weighted points', () => {
    let state = createInitialArcaneCoreState()
    for (const node of standardNodes(1).slice(0, 4)) state = setRank(state, node.id, 5)
    expect(getArcaneCoreRingStandardRanksInvested(state, 'power', 1)).toBe(20)
    expect(isArcaneCoreRingUnlocked(state, 'power', 2)).toBe(true)
    expect(isArcaneCoreRingUnlocked({ nodes: { [standardNodes(1)[0].id]: { rank: 5 }, [standardNodes(1)[1].id]: { rank: 5 }, [standardNodes(1)[2].id]: { rank: 5 } } }, 'power', 2)).toBe(false)

    let ringFour = createInitialArcaneCoreState()
    for (const node of standardNodes(4)) ringFour = setRank(ringFour, node.id, 5)
    expect(getArcaneCoreRingStandardRanksInvested(ringFour, 'power', 4)).toBe(40)
    expect(isArcaneCoreMajorUnlocked(ringFour, nodeAt(4, true))).toBe(true)
    const oneLess = setRank(ringFour, standardNodes(4)[0].id, 4)
    expect(isArcaneCoreMajorUnlocked(oneLess, nodeAt(4, true))).toBe(false)
    expect(ARCANE_CORE_RING_GATES[2]).toBe(20)
    expect(ARCANE_CORE_MAJOR_GATES[4]).toBe(40)
  })

  it('returns the exact variable rank cost on refunds and preserves earned points on reset', () => {
    let state = grantArcanePoints(createInitialArcaneCoreState(), 100).state
    const node = nodeAt(8)
    state = setRank(state, node.id, 1)
    expect(getArcaneCoreNodeRank(state, node.id)).toBe(1)
    expect(getArcaneCorePointsSpent(state)).toBe(150)
    expect(getArcaneCoreAvailablePoints(state)).toBe(0)
    const reset = resetArcaneCore(state)
    expect(reset).toEqual({ ok: true, state: { arcaneCoreVersion: 8, totalPointsEarned: 100, nodes: {} } })
  })

  it('keeps a fresh Vitality Ring I rank at one point after Power investment', () => {
    let state = grantArcanePoints(createInitialArcaneCoreState(), 1000).state
    state = setRank(state, nodeAt(1).id, 5)
    const vitality = ARCANE_CORE_BRANCHES.find((candidate) => candidate.id === 'vitality')!.nodes.find((node) => node.ring === 1 && node.nodeType !== 'major')!
    const result = purchaseArcaneCoreNode(state, vitality.id)
    expect(result.ok).toBe(true)
    if (result.ok) expect(getArcaneCorePointsSpent(result.state) - getArcaneCorePointsSpent(state)).toBe(5)
  })

  it('exposes V6 percentage stats as scalable derived-stat inputs', () => {
    const vitality = ARCANE_CORE_BRANCHES.find((candidate) => candidate.id === 'vitality')!.nodes.find((node) => node.ring === 1 && node.nodeType !== 'major')!
    const mana = ARCANE_CORE_BRANCHES.find((candidate) => candidate.id === 'mana')!.nodes.find((node) => node.ring === 1 && node.nodeType !== 'major')!
    const state = setRank(setRank(createInitialArcaneCoreState(), vitality.id, 5), mana.id, 5)
    expect(getArcaneCoreStaticStats(state)).toMatchObject({ maxHealthPct: 0.03, maxManaPct: 0.025 })
  })
})

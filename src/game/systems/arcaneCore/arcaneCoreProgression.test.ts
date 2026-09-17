import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_MAX_LEVEL, ARCANE_CORE_MAX_TOTAL_XP, ARCANE_CORE_TOTAL_POINTS, getArcaneCoreTotalXpForLevel } from '../../content/arcaneCore/arcaneCoreBalance'
import { createInitialArcaneCoreState, getArcaneCoreAvailablePoints, getArcaneCoreBranchResetPreview, getArcaneCoreLevelInfo, getArcaneCoreNodeProgress, getArcaneCorePointsSpent, getArcaneCoreStaticStats, getArcaneCoreRingPointsSpent, getArcaneCoreRefundPreview, grantArcaneCoreXp, isArcaneCoreNodeReachable, purchaseAllArcaneCoreNodes, purchaseArcaneCoreNode, refundArcaneCoreNode, resetArcaneCore, setArcaneCoreLevel } from './arcaneCoreProgression'
import type { ArcaneCoreState } from '../../types'

const stateAtLevel = (level: number, nodes: ArcaneCoreState['nodes'] = {}): ArcaneCoreState => ({ totalXp: getArcaneCoreTotalXpForLevel(level), nodes })
const buy = (state: ArcaneCoreState, nodeId: string, count: number) => { let next = state; for (let i = 0; i < count; i += 1) { const result = purchaseArcaneCoreNode(next, nodeId); expect(result.ok).toBe(true); if (!result.ok) return next; next = result.state } return next }

describe('Arcane Core V3 progression', () => {
  it('starts empty and derives level, XP, and points', () => {
    const initial = createInitialArcaneCoreState()
    expect(getArcaneCoreLevelInfo(initial)).toMatchObject({ level: 1, totalXp: 0, pointsEarned: 0, pointsSpent: 0, pointsAvailable: 0 })
    const granted = grantArcaneCoreXp(initial, 100)
    expect(granted).toMatchObject({ levelAfter: 2, levelsGained: 1 })
    expect(getArcaneCoreAvailablePoints(granted.state)).toBe(1)
  })

  it('derives the V3 688 point capacity and max level', () => {
    expect(ARCANE_CORE_TOTAL_POINTS).toBe(688)
    expect(ARCANE_CORE_MAX_LEVEL).toBe(689)
    expect(grantArcaneCoreXp(createInitialArcaneCoreState(), ARCANE_CORE_MAX_TOTAL_XP + 1).state.totalXp).toBe(ARCANE_CORE_MAX_TOTAL_XP)
  })

  it('purchases five ranks on standard nodes and three points on Majors', () => {
    let state = buy(stateAtLevel(6), 'power-r1-arcane-force', 5)
    expect(getArcaneCoreNodeProgress(state, 'power-r1-arcane-force')).toEqual({ rank: 5 })
    expect(getArcaneCorePointsSpent(state)).toBe(5)
    expect(purchaseArcaneCoreNode(state, 'power-r1-arcane-force')).toEqual({ ok: false, reason: 'already-max-rank' })
    state = buy(stateAtLevel(34), 'power-r1-arcane-force', 5)
    state = buy(state, 'power-r1-forceful-strikes', 5)
    state = buy(state, 'power-r1-critical-insight', 5)
    state = buy(state, 'power-r1-critical-force', 5)
    state = buy(state, 'power-r1-spell-impact', 5)
    state = buy(state, 'power-r1-battle-rhythm', 5)
    expect(getArcaneCoreRingPointsSpent(state, 'power', 1)).toBe(30)
    const major = purchaseArcaneCoreNode(state, 'power-r1-overwhelming-force')
    expect(major.ok).toBe(true)
    if (major.ok) expect(getArcaneCorePointsSpent(major.state)).toBe(33)
  })

  it('unlocks outer Rings by investment, not node chains', () => {
    const state = purchaseAllArcaneCoreNodes(stateAtLevel(21), 'power')
    expect(getArcaneCoreRingPointsSpent(state, 'power', 1)).toBe(20)
    expect(isArcaneCoreNodeReachable(state, 'power-r2-opening-blast')).toBe(true)
    expect(isArcaneCoreNodeReachable(state, 'power-r3-arcane-momentum')).toBe(false)
  })

  it('refunds one rank and cascades allocations that lose a Ring gate', () => {
    let state = stateAtLevel(22)
    state = buy(state, 'power-r1-arcane-force', 5)
    state = buy(state, 'power-r1-forceful-strikes', 5)
    state = buy(state, 'power-r1-critical-insight', 5)
    state = buy(state, 'power-r1-critical-force', 5)
    state = buy(state, 'power-r2-opening-blast', 1)
    const preview = getArcaneCoreBranchResetPreview(state, 'power')
    expect(preview).toMatchObject({ ok: true, corePointsReturned: 21 })
    const refunded = refundArcaneCoreNode(state, 'power-r1-arcane-force')
    expect(refunded).toMatchObject({ ok: true })
    if (refunded.ok) expect(refunded.state.nodes['power-r2-opening-blast']).toBeUndefined()
  })

  it('counts a Major refund as one rank and three returned Core Points', () => {
    const state = stateAtLevel(35, { 'power-r1-overwhelming-force': { rank: 1 } })
    const preview = getArcaneCoreRefundPreview(state, 'power-r1-overwhelming-force')
    expect(preview).toMatchObject({ ok: true, ranksAffected: 1, corePointsReturned: 3, majorsAffected: 1, nodesAffected: 1, nodeIds: ['power-r1-overwhelming-force'] })
  })

  it('counts branch reset ranks separately from weighted Core Points', () => {
    const state = stateAtLevel(35, {
      'power-r1-arcane-force': { rank: 5 },
      'power-r1-overwhelming-force': { rank: 1 },
    })
    const preview = getArcaneCoreBranchResetPreview(state, 'power')
    expect(preview).toMatchObject({ ok: true, ranksAffected: 6, corePointsReturned: 8, majorsAffected: 1, nodesAffected: 2 })
  })

  it('supports full developer completion and shared stat aggregation', () => {
    const completed = purchaseAllArcaneCoreNodes(setArcaneCoreLevel(createInitialArcaneCoreState(), ARCANE_CORE_MAX_LEVEL))
    expect(Object.keys(completed.nodes)).toHaveLength(144)
    expect(getArcaneCorePointsSpent(completed)).toBe(688)
    const stats = getArcaneCoreStaticStats({ nodes: { 'vitality-r1-vitality': { rank: 1 }, 'focus-r1-focus-capacity': { rank: 1 } } })
    expect(stats).toMatchObject({ maxHealth: 10, maxFocus: 1 })
  })

  it('resets allocations while preserving earned XP', () => {
    const state = stateAtLevel(2, { 'power-r1-arcane-force': { rank: 1 } })
    expect(resetArcaneCore(state)).toEqual({ ok: true, state: { totalXp: state.totalXp, nodes: {} } })
  })
})

import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_MAX_LEVEL, ARCANE_CORE_MAX_TOTAL_XP, getArcaneCoreTotalXpForLevel, getArcaneCoreXpForLevel } from '../../content/arcaneCore/arcaneCoreBalance'
import {
  createInitialArcaneCoreState,
  getArcaneCoreAvailablePoints,
  getArcaneCoreBranchResetPreview,
  getArcaneCoreLevel,
  getArcaneCoreLevelInfo,
  getArcaneCoreNodeProgress,
  getArcaneCorePointsSpent,
  getArcaneCoreStaticStats,
  grantArcaneCoreXp,
  isArcaneCoreNodeReachable,
  purchaseAllArcaneCoreNodes,
  purchaseArcaneCoreNode,
  refundArcaneCoreNode,
  resetArcaneCore,
  setArcaneCoreLevel,
} from './arcaneCoreProgression'
import type { ArcaneCoreState } from '../../types'

const stateAtLevel = (level: number, nodes: ArcaneCoreState['nodes'] = {}): ArcaneCoreState => ({ totalXp: getArcaneCoreTotalXpForLevel(level), nodes })
const purchased = (id: string): ArcaneCoreState['nodes'] => ({ [id]: { purchased: true } })

describe('Arcane Core V2 progression', () => {
  it('starts empty and derives level, XP, and points', () => {
    const initial = createInitialArcaneCoreState()
    expect(initial).toEqual({ totalXp: 0, nodes: {} })
    expect(getArcaneCoreLevelInfo(initial)).toMatchObject({ level: 1, totalXp: 0, pointsEarned: 0, pointsSpent: 0, pointsAvailable: 0 })

    const granted = grantArcaneCoreXp(initial, getArcaneCoreXpForLevel(1))
    expect(granted).toMatchObject({ granted: 100, levelBefore: 1, levelAfter: 2, levelsGained: 1 })
    expect(getArcaneCoreLevel(granted.state)).toBe(2)
    expect(getArcaneCoreAvailablePoints(granted.state)).toBe(1)
  })

  it('clamps XP at the derived level cap', () => {
    const granted = grantArcaneCoreXp(createInitialArcaneCoreState(), ARCANE_CORE_MAX_TOTAL_XP + 999)
    expect(granted.state.totalXp).toBe(ARCANE_CORE_MAX_TOTAL_XP)
    expect(getArcaneCoreLevel(granted.state)).toBe(ARCANE_CORE_MAX_LEVEL)
    expect(granted.levelsGained).toBe(ARCANE_CORE_MAX_LEVEL - 1)
  })

  it('requires a lane predecessor and purchases one point per node', () => {
    const levelTwo = stateAtLevel(2)
    expect(isArcaneCoreNodeReachable(levelTwo, 'power-a2')).toBe(false)
    expect(purchaseArcaneCoreNode(levelTwo, 'power-a2')).toEqual({ ok: false, reason: 'not-reachable' })

    const first = purchaseArcaneCoreNode(levelTwo, 'power-a1')
    expect(first).toMatchObject({ ok: true })
    if (!first.ok) return
    expect(getArcaneCoreNodeProgress(first.state, 'power-a1')).toEqual({ purchased: true })
    expect(getArcaneCorePointsSpent(first.state)).toBe(1)
    expect(getArcaneCoreAvailablePoints(first.state)).toBe(0)
    expect(purchaseArcaneCoreNode(first.state, 'power-a1')).toEqual({ ok: false, reason: 'already-purchased' })
  })

  it('refunds a node and all dependent nodes atomically', () => {
    let state = stateAtLevel(4)
    for (const nodeId of ['power-a1', 'power-a2', 'power-a3']) {
      const result = purchaseArcaneCoreNode(state, nodeId)
      expect(result).toMatchObject({ ok: true })
      if (!result.ok) return
      state = result.state
    }

    const preview = getArcaneCoreBranchResetPreview(state, 'power')
    expect(preview).toMatchObject({ ok: true, nodesAffected: 3, corePointsReturned: 3 })
    const refunded = refundArcaneCoreNode(state, 'power-a1')
    expect(refunded).toMatchObject({ ok: true })
    if (!refunded.ok) return
    expect(refunded.state.nodes).toEqual({})
    expect(getArcaneCorePointsSpent(refunded.state)).toBe(0)
    expect(getArcaneCoreAvailablePoints(refunded.state)).toBe(3)
  })

  it('resets only the selected branch and keeps XP', () => {
    let state = stateAtLevel(4)
    for (const nodeId of ['power-a1', 'power-a2']) {
      const result = purchaseArcaneCoreNode(state, nodeId)
      expect(result).toMatchObject({ ok: true })
      if (!result.ok) return
      state = result.state
    }
    const vitality = purchaseArcaneCoreNode(state, 'vitality-a1')
    expect(vitality).toMatchObject({ ok: true })
    if (!vitality.ok) return

    const reset = getArcaneCoreBranchResetPreview(vitality.state, 'power')
    expect(reset).toMatchObject({ ok: true, nodesAffected: 2, corePointsReturned: 2 })
    if (!reset.ok) return
    expect(reset.state.totalXp).toBe(vitality.state.totalXp)
    expect(reset.state.nodes).toEqual(purchased('vitality-a1'))
  })

  it('supports developer completion without changing the node cost model', () => {
    const maxed = setArcaneCoreLevel(createInitialArcaneCoreState(), ARCANE_CORE_MAX_LEVEL)
    const completed = purchaseAllArcaneCoreNodes(maxed)
    expect(Object.keys(completed.nodes)).toHaveLength(160)
    expect(getArcaneCorePointsSpent(completed)).toBe(160)
    expect(getArcaneCoreAvailablePoints(completed)).toBe(0)
  })

  it('feeds purchased V2 node stats into the shared Equipment model', () => {
    const stats = getArcaneCoreStaticStats({ nodes: { 'vitality-a1': { purchased: true }, 'focus-d1': { purchased: true } } })
    expect(stats).toMatchObject({ maxHealth: 10, maxFocus: 1 })
  })

  it('resets allocations while preserving earned XP', () => {
    const state = stateAtLevel(2, purchased('power-a1'))
    expect(resetArcaneCore(state)).toEqual({ ok: true, state: { totalXp: state.totalXp, nodes: {} } })
  })
})

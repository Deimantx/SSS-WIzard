import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_RANK_COSTS } from '../../content/arcaneCore/arcaneCoreBalance'
import { createInitialArcaneCoreState, getArcaneCoreBranchResetPreview, getArcaneCoreNodeProgress, getArcaneCoreModifierTotals, getArcaneCoreRefundPreview, isArcaneCoreNodeReachable, rankUpArcaneCoreNode, refundArcaneCoreNode, resetArcaneCore, unlockArcaneCoreNode } from './arcaneCoreProgression'

describe('Arcane Core progression', () => {
  it('starts empty and keeps unlock cost separate from rank costs', () => {
    const initial = createInitialArcaneCoreState()
    expect(initial).toEqual({ corePoints: 0, arcaneEssence: 0, nodes: {} })

    const unlocked = unlockArcaneCoreNode({ ...initial, corePoints: 1 }, 'power-01')
    expect(unlocked).toMatchObject({ ok: true })
    if (!unlocked.ok) return
    expect(unlocked.state.corePoints).toBe(0)
    expect(getArcaneCoreNodeProgress(unlocked.state, 'power-01')).toMatchObject({ unlocked: true, rank: 0, coreSpent: 1, essenceSpent: 0 })
    expect(rankUpArcaneCoreNode(unlocked.state, 'power-01')).toEqual({ ok: false, reason: 'not-enough-essence' })

    const ranked = rankUpArcaneCoreNode({ ...unlocked.state, arcaneEssence: ARCANE_CORE_RANK_COSTS[0] }, 'power-01')
    expect(ranked).toMatchObject({ ok: true })
    if (ranked.ok) expect(getArcaneCoreNodeProgress(ranked.state, 'power-01')).toMatchObject({ rank: 1, essenceSpent: 25 })
  })

  it('requires completed prerequisites and supports any/all fork rules', () => {
    const starter = { ...createInitialArcaneCoreState(), corePoints: 1 }
    expect(unlockArcaneCoreNode(starter, 'power-09')).toEqual({ ok: false, reason: 'not-reachable' })
    expect(isArcaneCoreNodeReachable({ nodes: { 'power-01': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 } } }, 'power-09')).toBe(false)

    const allReady = {
      ...starter,
      corePoints: 1,
      nodes: {
        'power-01': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 },
        'power-02': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 },
      },
    }
    expect(isArcaneCoreNodeReachable(allReady, 'power-09')).toBe(true)
    expect(unlockArcaneCoreNode(allReady, 'power-09')).toMatchObject({ ok: true })

    const anyReady = { ...allReady, nodes: { 'power-04': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 } } }
    expect(isArcaneCoreNodeReachable(anyReady, 'power-12')).toBe(true)
  })

  it('refunds a node and all dependent nodes atomically', () => {
    const state = {
      corePoints: 2,
      arcaneEssence: 0,
      nodes: {
        'power-01': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 },
        'power-02': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 },
        'power-09': { unlocked: true, rank: 1, coreSpent: 1, essenceSpent: 25 },
      },
    }
    const refunded = refundArcaneCoreNode(state, 'power-01')
    expect(refunded).toMatchObject({ ok: true })
    if (!refunded.ok) return
    expect(refunded.state.nodes['power-01']).toBeUndefined()
    expect(refunded.state.nodes['power-09']).toBeUndefined()
    expect(refunded.state.nodes['power-02']).toBeDefined()
    expect(refunded.state.corePoints).toBe(4)
    expect(refunded.state.arcaneEssence).toBe(305)
  })

  it('preserves an any-prerequisite child when another completed route remains', () => {
    const state = {
      corePoints: 0,
      arcaneEssence: 0,
      nodes: {
        'power-04': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 },
        'power-05': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 },
        'power-12': { unlocked: true, rank: 1, coreSpent: 1, essenceSpent: 25 },
      },
    }
    const preview = getArcaneCoreRefundPreview(state, 'power-04')
    expect(preview).toMatchObject({ ok: true, nodesAffected: 1, ranksAffected: 5, corePointsRefunded: 1, essenceRefunded: 280 })
    if (!preview.ok) return
    expect(preview.state.nodes['power-05']).toBeDefined()
    expect(preview.state.nodes['power-12']).toBeDefined()
  })

  it('cascades an all-prerequisite child and deeper descendants only when invalid', () => {
    const state = {
      corePoints: 0,
      arcaneEssence: 0,
      nodes: {
        'power-01': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 },
        'power-02': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 },
        'power-09': { unlocked: true, rank: 1, coreSpent: 1, essenceSpent: 25 },
        'power-10': { unlocked: true, rank: 5, coreSpent: 1, essenceSpent: 280 },
        'power-17': { unlocked: true, rank: 1, coreSpent: 1, essenceSpent: 25 },
      },
    }
    const preview = getArcaneCoreRefundPreview(state, 'power-01')
    expect(preview).toMatchObject({ ok: true, nodesAffected: 3, ranksAffected: 7, corePointsRefunded: 3, essenceRefunded: 330 })
    if (!preview.ok) return
    expect(preview.state.nodes['power-01']).toBeUndefined()
    expect(preview.state.nodes['power-09']).toBeUndefined()
    expect(preview.state.nodes['power-17']).toBeUndefined()
    expect(preview.state.nodes['power-02']).toBeDefined()
  })

  it('does not refund fake currency for developer-free allocations', () => {
    const state = { corePoints: 3, arcaneEssence: 4, nodes: { 'power-01': { unlocked: true, rank: 2, coreSpent: 0, essenceSpent: 0 } } }
    const preview = getArcaneCoreRefundPreview(state, 'power-01')
    expect(preview).toMatchObject({ ok: true, nodesAffected: 1, ranksAffected: 2, corePointsRefunded: 0, essenceRefunded: 0 })
    if (!preview.ok) return
    expect(preview.state).toMatchObject({ corePoints: 3, arcaneEssence: 4, nodes: {} })
  })

  it('previews branch resets with exact paid totals', () => {
    const state = { corePoints: 2, arcaneEssence: 3, nodes: { 'focus-01': { unlocked: true, rank: 1, coreSpent: 1, essenceSpent: 25 } } }
    const preview = getArcaneCoreBranchResetPreview(state, 'focus')
    expect(preview).toMatchObject({ ok: true, branchId: 'focus', nodesAffected: 1, ranksAffected: 1, corePointsRefunded: 1, essenceRefunded: 25 })
    if (!preview.ok) return
    expect(preview.state).toEqual({ corePoints: 3, arcaneEssence: 28, nodes: {} })
  })

  it('feeds unlocked ranks into the existing equipment stat model', () => {
    const totals = getArcaneCoreModifierTotals({ nodes: { 'vitality-01': { unlocked: true, rank: 3, coreSpent: 1, essenceSpent: 110 } } })
    expect(totals.maxHealth).toBe(6)
  })

  it('resets all allocations and refunds recorded costs', () => {
    const state = { corePoints: 0, arcaneEssence: 10, nodes: { 'focus-01': { unlocked: true, rank: 1, coreSpent: 1, essenceSpent: 25 } } }
    expect(resetArcaneCore(state)).toEqual({ ok: true, state: { corePoints: 1, arcaneEssence: 35, nodes: {} } })
  })
})

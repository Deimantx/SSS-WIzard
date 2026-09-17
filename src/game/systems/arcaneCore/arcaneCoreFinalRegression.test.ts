import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { getArcaneCoreTotalXpForLevel, ARCANE_CORE_MAX_LEVEL } from '../../content/arcaneCore/arcaneCoreBalance'
import { createInitialState } from '../../../store/initialState'
import type { ArcaneCoreState, GameState } from '../../types'
import { getArcaneCoreDynamicManaRegen, getArcaneCoreDynamicSpellPower } from './arcaneCoreRuntime'
import { getArcaneCoreRefundPreview, getArcaneCoreRingStandardPointsSpent, isArcaneCoreMajorUnlocked, refundArcaneCoreNode, resetArcaneCoreNode } from './arcaneCoreProgression'
import { validateArcaneCorePreset } from './arcaneCorePresets'
import { getCombatModifiers } from '../combat/modifiers'
import { getActionRate } from '../combat/actionRuntime'

const focusState = (): GameState => {
  const state = createInitialState()
  state.activities.channeling.echoesAssigned = 1
  return state
}

const withoutNode = (state: GameState, nodeId: string) => {
  const result = resetArcaneCoreNode(state.arcaneCore, nodeId)
  expect(result.ok).toBe(true)
  return result.ok ? { ...state, arcaneCore: result.state } : state
}

const powerBranch = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'power')!
const ringEightStandardNodes = powerBranch.nodes.filter((node) => node.ring === 8 && node.nodeType !== 'major')
const ringEightMajor = powerBranch.nodes.find((node) => node.ring === 8 && node.nodeType === 'major')!

const ringEightState = (standardPoints: number, withMajor = false): ArcaneCoreState => {
  const nodes: ArcaneCoreState['nodes'] = {}
  for (const ring of [1, 2, 3, 4, 5, 6, 7] as const) {
    powerBranch.nodes.filter((node) => node.ring === ring && node.nodeType !== 'major').forEach((node) => { nodes[node.id] = { rank: node.maxRank } })
  }
  let remaining = standardPoints
  for (const node of ringEightStandardNodes) {
    const rank = Math.min(node.maxRank, Math.max(0, remaining))
    if (rank > 0) nodes[node.id] = { rank }
    remaining -= rank * node.rankCost
  }
  if (withMajor) nodes[ringEightMajor.id] = { rank: 1 }
  return { totalXp: getArcaneCoreTotalXpForLevel(ARCANE_CORE_MAX_LEVEL), nodes }
}

describe('Arcane Core V4 final regressions', () => {
  it('stacks Focus dynamic specials and removes each contribution cleanly', () => {
    const spellPowerFirst = focusState()
    spellPowerFirst.arcaneCore.nodes['focus-r2-focused-power'] = { rank: 5 }
    expect(getArcaneCoreDynamicSpellPower(spellPowerFirst)).toBeCloseTo(2.5)

    const spellPowerSecond = focusState()
    spellPowerSecond.arcaneCore.nodes['focus-r7-focused-mind'] = { rank: 5 }
    expect(getArcaneCoreDynamicSpellPower(spellPowerSecond)).toBeCloseTo(5)

    const spellPowerBoth = focusState()
    spellPowerBoth.arcaneCore.nodes['focus-r2-focused-power'] = { rank: 5 }
    spellPowerBoth.arcaneCore.nodes['focus-r7-focused-mind'] = { rank: 5 }
    expect(getArcaneCoreDynamicSpellPower(spellPowerBoth)).toBeCloseTo(7.5)
    expect(getArcaneCoreDynamicSpellPower(withoutNode(spellPowerBoth, 'focus-r2-focused-power'))).toBeCloseTo(5)
    expect(getArcaneCoreDynamicSpellPower(withoutNode(spellPowerBoth, 'focus-r7-focused-mind'))).toBeCloseTo(2.5)

    const manaFirst = focusState()
    manaFirst.arcaneCore.nodes['focus-r2-clear-mind'] = { rank: 5 }
    expect(getArcaneCoreDynamicManaRegen(manaFirst)).toBeCloseTo(4.5)

    const manaSecond = focusState()
    manaSecond.arcaneCore.nodes['focus-r7-open-mind'] = { rank: 5 }
    expect(getArcaneCoreDynamicManaRegen(manaSecond)).toBeCloseTo(9)

    const manaBoth = focusState()
    manaBoth.arcaneCore.nodes['focus-r2-clear-mind'] = { rank: 5 }
    manaBoth.arcaneCore.nodes['focus-r7-open-mind'] = { rank: 5 }
    expect(getArcaneCoreDynamicManaRegen(manaBoth)).toBeCloseTo(13.5)
    expect(getArcaneCoreDynamicManaRegen(withoutNode(manaBoth, 'focus-r2-clear-mind'))).toBeCloseTo(9)
    expect(getArcaneCoreDynamicManaRegen(withoutNode(manaBoth, 'focus-r7-open-mind'))).toBeCloseTo(4.5)
  })

  it('requires standard Ring investment for Major gates and cascades invalid Majors on refund', () => {
    const at39 = ringEightState(39)
    const at40 = ringEightState(40)
    expect(getArcaneCoreRingStandardPointsSpent(at39, 'power', 8)).toBe(39)
    expect(isArcaneCoreMajorUnlocked(at39, ringEightMajor)).toBe(false)
    expect(isArcaneCoreMajorUnlocked(at40, ringEightMajor)).toBe(true)

    const purchasedMajor = ringEightState(40, true)
    expect(isArcaneCoreMajorUnlocked(purchasedMajor, ringEightMajor)).toBe(true)
    const standardToRefund = ringEightStandardNodes[ringEightStandardNodes.length - 1]!
    const preview = getArcaneCoreRefundPreview(purchasedMajor, standardToRefund.id)
    expect(preview).toMatchObject({ ok: true, corePointsReturned: 4, majorsAffected: 1 })
    const refunded = refundArcaneCoreNode(purchasedMajor, standardToRefund.id)
    if (refunded.ok) {
      expect(getArcaneCoreRingStandardPointsSpent(refunded.state, 'power', 8)).toBe(39)
      expect(refunded.state.nodes[ringEightMajor.id]).toBeUndefined()
    }

    const invalidSelfCountingState = ringEightState(37, true)
    expect(isArcaneCoreMajorUnlocked(invalidSelfCountingState, ringEightMajor)).toBe(false)
    expect(validateArcaneCorePreset(invalidSelfCountingState)).toBe(false)
  })

  it('represents Precision Timing as general Action Speed', () => {
    const state = createInitialState()
    state.arcaneCore.nodes['control-r2-precision-timing'] = { rank: 5 }
    expect(getCombatModifiers(state, 'player', 'action-speed-percent', { sourceTags: ['special'] })).toBeCloseTo(0.025)
    expect(getCombatModifiers(state, 'player', 'basic-attack-speed-percent')).toBe(0)
    expect(getActionRate(state, 'player', 'action')).toBeCloseTo(1.025)
  })

  it('keeps both Living Fortress effects behind the Barrier condition', () => {
    const state = createInitialState()
    state.arcaneCore.nodes['vitality-r5-living-fortress'] = { rank: 1 }
    expect(getCombatModifiers(state, 'player', 'damage-taken-percent')).toBe(0)
    expect(getCombatModifiers(state, 'player', 'defense-flat')).toBe(0)

    state.combat.playerBarrier = 100
    expect(getCombatModifiers(state, 'player', 'damage-taken-percent')).toBeCloseTo(-0.08)
    expect(getCombatModifiers(state, 'player', 'defense-flat')).toBe(5)

    state.combat.playerBarrier = 0
    expect(getCombatModifiers(state, 'player', 'damage-taken-percent')).toBe(0)
    expect(getCombatModifiers(state, 'player', 'defense-flat')).toBe(0)
  })

  it('keeps authored node order while assigning symmetric angles', () => {
    expect(powerBranch.nodes[0]?.id).toBe('power-r1-arcane-force')
    expect(powerBranch.nodes.find((node) => node.ring === 1 && node.nodeType === 'major')?.angleDeg).toBe(0)
  })
})

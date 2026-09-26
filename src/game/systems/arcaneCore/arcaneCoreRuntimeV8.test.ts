import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { createInitialState } from '../../../store/initialState'
import { commitArcaneCoreSpellCast, getArcaneCoreCastModifiers, type ArcaneCoreSpellCastContext } from './arcaneCoreMechanicRuntime'
import { processArtifactSpecialCombatEvent } from '../artifacts/artifactProgression'
import { executeCombatEffects } from '../combat/effectResolver'
import { getSpellCombatSource } from '../spells/spellSource'

const node = (branch: 'power' | 'mana', name: string) => ARCANE_CORE_BRANCHES.find((entry) => entry.id === branch)!.nodes.find((entry) => entry.name === name)!
const enable = (state: ReturnType<typeof createInitialState>, branch: 'power' | 'mana', name: string, rank = 1) => { state.arcaneCore.nodes[node(branch, name).id] = { rank } }
const cast = (overrides: Partial<ArcaneCoreSpellCastContext> = {}): ArcaneCoreSpellCastContext => ({
  origin: 'auto', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, nominalManaCost: 20,
  paidMana: 20, manaBeforeCost: 100, manaAfterCost: 80, maxMana: 100, playerMana: 100, enemyHealthPercent: 100,
  ...overrides,
})

describe('Arcane Core V8 runtime semantics', () => {
  it('treats free casts as zero Mana spend for rolling windows and crossings', () => {
    const state = createInitialState()
    enable(state, 'mana', 'Reservoir Cycle')
    enable(state, 'mana', 'Overchannel')
    enable(state, 'mana', 'Deep Breathing')
    enable(state, 'mana', 'Low Tide')
    enable(state, 'mana', 'Mana Collapse')
    enable(state, 'mana', 'Arcane Singularity')
    enable(state, 'mana', 'Emergency Conversion')

    const result = commitArcaneCoreSpellCast(state, cast({ paidMana: 0, manaBeforeCost: 30, manaAfterCost: 30 }))
    const runtime = state.combat.arcaneCoreRuntime
    expect(result.manaRestoreFlat).toBe(0)
    expect(runtime.recentManaSpend).toEqual([])
    expect(runtime.reservoirCycleReady).toBe(false)
    expect(runtime.overchannelUntilMs).toBeUndefined()
    expect(runtime.manaCollapseReady).toBe(false)
    expect(runtime.emergencyConversionReady).toBe(false)
    expect(runtime.singularityUsed).toBe(false)
  })

  it('does not invent a preceding AUTO cast and groups both manual origins as MANUAL', () => {
    const state = createInitialState()
    enable(state, 'mana', 'Alternating Mind')
    const firstManual = commitArcaneCoreSpellCast(state, cast({ origin: 'manual-direct', paidMana: 0 }))
    const queuedManual = commitArcaneCoreSpellCast(state, cast({ origin: 'manual-queued', paidMana: 0 }))
    const auto = commitArcaneCoreSpellCast(state, cast({ origin: 'auto', paidMana: 0 }))
    const manualAfterAuto = commitArcaneCoreSpellCast(state, cast({ origin: 'manual-direct', paidMana: 0 }))
    expect(firstManual.actionSpeedMultiplier).toBe(1)
    expect(queuedManual.actionSpeedMultiplier).toBe(1)
    expect(auto.actionSpeedMultiplier).toBeCloseTo(1.01)
    expect(manualAfterAuto.actionSpeedMultiplier).toBeCloseTo(1.01)
  })

  it('prepares Dual Mind for the opposite mode after every successful cast', () => {
    const state = createInitialState()
    enable(state, 'mana', 'Dual Mind')
    commitArcaneCoreSpellCast(state, cast({ origin: 'auto', paidMana: 0 }))
    commitArcaneCoreSpellCast(state, cast({ origin: 'auto', paidMana: 0 }))
    const manual = commitArcaneCoreSpellCast(state, cast({ origin: 'manual-direct', paidMana: 0 }))
    expect(manual.manaCostMultiplier).toBeCloseTo(0.92)
    expect(manual.actionSpeedMultiplier).toBeCloseTo(1.05)
  })

  it('requires true unique spell and slot sequences', () => {
    const state = createInitialState()
    enable(state, 'mana', 'Spell Cycle')
    enable(state, 'mana', 'Astral Rotation')
    const commit = (spellId: ArcaneCoreSpellCastContext['spellId'], slot: number) => commitArcaneCoreSpellCast(state, cast({ spellId, loadoutSlotIndex: slot, paidMana: 0 }))

    commit('fire-bolt', 0)
    commit('water-bolt', 1)
    const repeated = commit('fire-bolt', 0)
    expect(repeated.manaRestoreFlat).toBe(0)
    expect(repeated.manaRefundPercent).toBe(0)
    expect(repeated.actionSpeedMultiplier).toBe(1)

    const powerState = createInitialState()
    enable(powerState, 'power', 'Aggressive Rotation')
    const powerCommit = (spellId: ArcaneCoreSpellCastContext['spellId']) => commitArcaneCoreSpellCast(powerState, cast({ spellId, paidMana: 0 }))
    powerCommit('fire-bolt')
    powerCommit('water-bolt')
    powerCommit('fire-bolt')
    const fourth = powerCommit('wind-blade')
    expect(fourth.actionSpeedMultiplier).toBe(1)
    powerState.combat.arcaneCoreRuntime.recentSpellSequence = ['fire-bolt', 'water-bolt', 'stone-shard']
    const uniqueFourth = powerCommit('wind-blade')
    expect(uniqueFourth.actionSpeedMultiplier).toBeCloseTo(1.02)

    commit('water-bolt', 1)
    commit('stone-shard', 2)
    commit('wind-blade', 3)
  })

  it('consumes one rolling spend credit and does not refresh Overchannel while active', () => {
    const state = createInitialState()
    enable(state, 'mana', 'Reservoir Cycle')
    enable(state, 'mana', 'Overchannel')
    const first = commitArcaneCoreSpellCast(state, cast({ paidMana: 25, manaBeforeCost: 100, manaAfterCost: 75 }))
    expect(state.combat.arcaneCoreRuntime.reservoirCycleReady).toBe(true)
    expect(state.combat.arcaneCoreRuntime.overchannelUntilMs).toBe(5_000)
    expect(first.manaRestoreFlat).toBe(0)

    state.combat.arcaneCoreRuntime.elapsedMs = 1_000
    commitArcaneCoreSpellCast(state, cast({ paidMana: 25, manaBeforeCost: 75, manaAfterCost: 50 }))
    expect(state.combat.arcaneCoreRuntime.overchannelUntilMs).toBe(5_000)
    state.combat.arcaneCoreRuntime.elapsedMs = 6_000
    commitArcaneCoreSpellCast(state, cast({ paidMana: 0, manaBeforeCost: 50, manaAfterCost: 50 }))
    expect(state.combat.arcaneCoreRuntime.overchannelUntilMs).toBe(5_000)
    expect(state.combat.arcaneCoreRuntime.reservoirCycleReady).toBe(false)

    commitArcaneCoreSpellCast(state, cast({ paidMana: 25, manaBeforeCost: 50, manaAfterCost: 25 }))
    expect(state.combat.arcaneCoreRuntime.overchannelUntilMs).toBe(11_000)
    expect(state.combat.arcaneCoreRuntime.reservoirCycleReady).toBe(true)
  })

  it('uses the explicit full-Mana start snapshot for Event Horizon', () => {
    const state = createInitialState()
    enable(state, 'mana', 'Event Horizon')
    commitArcaneCoreSpellCast(state, cast({ paidMana: 20, manaBeforeCost: 100, manaAfterCost: 80, manaWasFullAtStart: true }))
    expect(state.combat.arcaneCoreRuntime.overflowCharges).toBe(1)
    state.combat.arcaneCoreRuntime.overflowCharges = 0
    commitArcaneCoreSpellCast(state, cast({ paidMana: 20, manaBeforeCost: 100, manaAfterCost: 80, manaWasFullAtStart: false }))
    expect(state.combat.arcaneCoreRuntime.overflowCharges).toBe(0)
  })

  it('keeps Mana Shift preview pure and applies its prepared bonus after a real crossing', async () => {
    const { consumeArtifactPreCastManaShift, getArtifactPreCastManaMultiplier, recordArtifactManaPayment } = await import('../artifacts/artifactProgression')
    const state = createInitialState()
    state.equipment.head = 'waystone-circlet'
    state.artifactProgress['waystone-circlet'] = { minorRanks: { 'waystone-intellect': 10, 'meridian-reservoir': 10, 'mana-anchor': 10, 'waystep-tempo': 10, 'stabilized-incantation': 10, 'waystone-precision': 10 } }
    state.combat.arcaneCoreRuntime.elapsedMs = 5_000
    recordArtifactManaPayment(state, 60, 45, 15)
    expect(getArtifactPreCastManaMultiplier(state)).toBeCloseTo(0.9375)
    expect(getArtifactPreCastManaMultiplier(state)).toBeCloseTo(0.9375)
    consumeArtifactPreCastManaShift(state)
    expect(getArtifactPreCastManaMultiplier(state)).toBe(1)
    state.combat.arcaneCoreRuntime.elapsedMs = 6_000
    recordArtifactManaPayment(state, 60, 45, 15)
    expect(state.combat.arcaneCoreRuntime.artifactManaShiftReady).toBe(false)
  })

  it('refunds Perfect Waystone from actual paid Mana, including zero for free casts', () => {
    const state = createInitialState()
    state.equipment.head = 'waystone-circlet'
    state.artifactProgress['waystone-circlet'] = { minorRanks: { 'waystone-intellect': 10, 'meridian-reservoir': 10, 'mana-anchor': 10, 'waystep-tempo': 10, 'stabilized-incantation': 10, 'waystone-precision': 10 } }
    state.player.mana = 50
    state.combat.arcaneCoreRuntime.artifactSpellCount = 9
    const context = { source: getSpellCombatSource('fire-bolt'), eventTarget: 'enemy' as const, sourceTags: ['spell' as const, 'magic' as const], amount: 40 }
    processArtifactSpecialCombatEvent(state, 'player', 'on-spell-cast', context, executeCombatEffects, 0)
    expect(state.player.mana).toBe(56)

    state.player.mana = 50
    state.combat.arcaneCoreRuntime.artifactSpellCount = 9
    processArtifactSpecialCombatEvent(state, 'player', 'on-spell-cast', { ...context, amount: 0 }, executeCombatEffects, 0)
    expect(state.player.mana).toBe(50)
  })
})

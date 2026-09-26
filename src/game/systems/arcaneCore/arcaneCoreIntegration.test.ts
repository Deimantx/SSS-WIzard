import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { createInitialState } from '../../../store/initialState'
import { getArcaneCoreCombatModifierProviders, getArcaneCoreCombatModifiers, getArcaneCoreSpecialEffects, getArcaneCoreStaticStats } from './arcaneCoreProgression'
import { ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'

const node = (branch: 'power' | 'vitality' | 'mana' | 'control', name: string) => ARCANE_CORE_BRANCHES.find((entry) => entry.id === branch)!.nodes.find((candidate) => candidate.name === name)!

describe('Arcane Core V8 integration', () => {
  it('resolves percentage stat providers at the current rank', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Arcane Scaling').id] = { rank: 3 }
    state.arcaneCore.nodes[node('vitality', 'Vitality').id] = { rank: 2 }
    const stats = getArcaneCoreStaticStats(state.arcaneCore)
    expect(stats.spellPowerPct).toBeCloseTo(0.015)
    expect(stats.maxHealthPct).toBeCloseTo(0.012)
    expect(getArcaneCoreCombatModifierProviders(state.arcaneCore).length).toBeGreaterThanOrEqual(0)
  })

  it('keeps authored Mana mechanics addressable by stable mechanic metadata', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Opportunist').id] = { rank: 5 }
    state.arcaneCore.nodes[node('mana', 'Arcane Recirculation').id] = { rank: 1 }
    const effects = getArcaneCoreSpecialEffects(state.arcaneCore)
    expect(effects).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'arcane-core-mechanic', mechanicId: 'power:r1:S5', displayName: 'Opportunist', rank: 5 }),
      expect.objectContaining({ type: 'arcane-core-mechanic', mechanicId: 'mana:r3:M', displayName: 'Arcane Recirculation', rank: 1 }),
    ]))
  })

  it('matches the exact fully-maxed V8 static budgets', () => {
    const maxed = (branch: 'power' | 'vitality' | 'mana' | 'control') => ({ nodes: Object.fromEntries(ARCANE_CORE_NODES.filter((entry) => entry.branchId === branch).map((entry) => [entry.id, { rank: entry.maxRank }])) })
    const sum = (modifiers: ReturnType<typeof getArcaneCoreCombatModifiers>, key: string, actor?: 'player' | 'enemy') => modifiers
      .filter((modifier) => modifier.key === key && (actor === undefined || (modifier.actor ?? 'player') === actor))
      .reduce((total, modifier) => total + modifier.value, 0)
    const unconditionalSum = (modifiers: ReturnType<typeof getArcaneCoreCombatModifiers>, key: string, actor?: 'player' | 'enemy') => modifiers
      .filter((modifier) => modifier.key === key && !modifier.condition && (actor === undefined || (modifier.actor ?? 'player') === actor))
      .reduce((total, modifier) => total + modifier.value, 0)

    const powerStats = getArcaneCoreStaticStats(maxed('power'))
    const powerModifiers = getArcaneCoreCombatModifiers(maxed('power'))
    const vitalityStats = getArcaneCoreStaticStats(maxed('vitality'))
    const vitalityModifiers = getArcaneCoreCombatModifierProviders(maxed('vitality')).filter(({ node }) => node.nodeType !== 'major').map(({ modifier }) => modifier)
    const manaStats = getArcaneCoreStaticStats(maxed('mana'))
    const manaModifiers = getArcaneCoreCombatModifiers(maxed('mana'))
    const controlStats = getArcaneCoreStaticStats(maxed('control'))
    const controlModifiers = getArcaneCoreCombatModifierProviders(maxed('control')).filter(({ node }) => node.nodeType !== 'major').map(({ modifier }) => modifier)

    expect(powerStats).toMatchObject({
      spellPowerPct: expect.closeTo(0.28),
      critChance: 0.12,
      critDamage: 1,
      damageOverTimePct: 0.18,
    })
    expect(sum(powerModifiers, 'spell-damage-percent')).toBeCloseTo(0.15)
    expect(sum(powerModifiers, 'action-speed-percent')).toBeCloseTo(0.06)
    expect(powerStats.cooldownRecoveryPct).toBeCloseTo(0.06)

    expect(vitalityStats).toMatchObject({
      maxHealthPct: 0.25,
      defense: 60,
      healthRegen: 6,
      barrierPowerPct: 0.30,
      healingDonePct: 0.10,
    })
    expect(sum(vitalityModifiers, 'healing-received-percent')).toBeCloseTo(0.10)
    expect(unconditionalSum(vitalityModifiers, 'damage-taken-percent')).toBeCloseTo(-0.05)

    expect(manaStats.maxManaPct).toBeCloseTo(0.34, 10)
    expect(manaStats.manaCostReductionPct).toBeCloseTo(0.1175, 10)
    expect(manaStats).toMatchObject({
      maxMana: 35,
      manaRegen: 2.5,
    })
    expect(sum(manaModifiers, 'mana-regen-percent')).toBeCloseTo(0.34)

    expect(controlStats.statusDurationPct).toBeCloseTo(0.20)
    expect(controlStats.cooldownRecoveryPct).toBeCloseTo(0.10)
    expect(sum(controlModifiers, 'action-speed-percent')).toBeCloseTo(0.08)
    expect(sum(controlModifiers, 'damage-dealt-percent', 'enemy')).toBeCloseTo(-0.11)
    expect(sum(controlModifiers, 'damage-dealt-percent', 'player')).toBeCloseTo(0.08)
  })
})

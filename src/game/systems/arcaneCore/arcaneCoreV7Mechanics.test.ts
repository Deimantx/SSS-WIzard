import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { createInitialState } from '../../../store/initialState'
import { getArcaneCoreV6CastModifiers, recordArcaneCoreV6CriticalResult } from './arcaneCoreV6Runtime'

describe('Arcane Core V7 mechanic safety', () => {
  it('keeps R1-R2 free-cast, lethal-save, hard-stasis, and guaranteed-crit effects out of authored resolvers', () => {
    const earlyNodes = ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes.filter((node) => node.ring <= 2))
    const specialTypes = earlyNodes.flatMap((node) => node.resolveEffects(node.maxRank).special ?? []).map((effect) => effect.type)
    expect(specialTypes).not.toContain('nth-spell-free')
    expect(specialTypes).not.toContain('lethal-survival')
    expect(earlyNodes.some((node) => node.name === 'Perfect Precision' && /not guaranteed to Crit/i.test(node.description))).toBe(true)
    expect(earlyNodes.some((node) => node.name === 'Deep Breathing')).toBe(true)
  })

  it('turns Perfect Precision into a bounded Crit Chance bonus, never a guaranteed Crit', () => {
    const state = createInitialState()
    const node = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'power')!.nodes.find((entry) => entry.name === 'Perfect Precision')!
    state.arcaneCore.nodes[node.id] = { rank: 1 }
    state.combat.arcaneCoreRuntime.failedCritStreak = 2
    const modifiers = getArcaneCoreV6CastModifiers(state, { origin: 'auto', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, manaCost: 20, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }, true)
    expect(modifiers.critChanceBonus).toBeCloseTo(0.15)
    expect(modifiers.guaranteedCrit).toBe(false)
    recordArcaneCoreV6CriticalResult(state, false)
    expect(state.combat.arcaneCoreRuntime.failedCritStreak).toBe(0)
  })
})

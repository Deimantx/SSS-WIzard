import { describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { getCombatModifiers, getResistance } from '../game/systems/combat/modifiers'
import { getEffectiveManaCost, getPlayerCombatStats } from '../game/systems/combat/combatStats'
import { recalculateDerivedStats } from '../game/engine'
import { getDeveloperPlayerStatLab } from './playerStatLabReadModel'
import { resolveStatusDuration } from '../game/systems/combat/statusRuntime'

describe('Player Stat Lab runtime read model', () => {
  it('starts at zero, separates the authored build from debug bonuses, and resets derived resources', () => {
    const state = createInitialState()
    const clean = getDeveloperPlayerStatLab(state)
    expect(clean.rawModifiers).toEqual([])
    state.debug.playerStats.maxHealthFlat = 500
    state.debug.playerStats.maxManaFlat = 200
    state.debug.playerStats.spellPowerFlat = 500
    recalculateDerivedStats(state)
    const lab = getDeveloperPlayerStatLab(state)
    expect(lab.resolved.maxHealth - lab.build.maxHealth).toBe(500)
    expect(lab.resolved.maxMana - lab.build.maxMana).toBe(200)
    expect(lab.resolved.spellPower - lab.build.spellPower).toBe(500)
    expect(lab.rawModifiers).toEqual([])
  })

  it('injects modifiers for the player only and scopes elemental damage and resistance by type', () => {
    const state = createInitialState()
    state.debug.playerStats.modifiers['damage-dealt-percent'] = 0.2
    state.debug.playerStats.spellDamageByType.fire = 0.3
    state.debug.playerStats.resistanceByType.air = 0.25
    expect(getCombatModifiers(state, 'player', 'damage-dealt-percent')).toBeCloseTo(0.2)
    expect(getCombatModifiers(state, 'enemy', 'damage-dealt-percent')).toBe(0)
    expect(getCombatModifiers(state, 'player', 'spell-damage-percent', { damageType: 'fire' })).toBeCloseTo(0.3)
    expect(getCombatModifiers(state, 'player', 'spell-damage-percent', { damageType: 'water' })).toBe(0)
    expect(getResistance(state, 'player', 'air')).toBeCloseTo(0.25)
    expect(getResistance(state, 'player', 'fire')).toBe(0)
  })

  it('uses the canonical mana cost resolver and runtime mana regeneration modifier', () => {
    const state = createInitialState()
    expect(getEffectiveManaCost(state, 100)).toBe(100)
    state.debug.playerStats.manaCostReductionPercent = 0.25
    state.debug.playerStats.manaRegenPercent = 0.5
    expect(getEffectiveManaCost(state, 100)).toBe(75)
    expect(getPlayerCombatStats(state).manaRegen).toBeGreaterThan(0)
    expect(getCombatModifiers(state, 'player', 'mana-regen-percent')).toBeCloseTo(0.5)
  })

  it('resolves dealt, received, and control status timing through runtime modifier context', () => {
    const state = createInitialState()
    const spell = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'lab-test', tags: ['spell' as const] }
    state.debug.playerStats.modifiers['status-duration-dealt-percent'] = 1
    state.debug.playerStats.modifiers['status-duration-received-percent'] = -0.25
    state.debug.playerStats.modifiers['control-duration-received-percent'] = -0.25
    expect(resolveStatusDuration(state, 'enemy', 'burning', 4_000, spell)).toBe(8_000)
    expect(resolveStatusDuration(state, 'player', 'stunned', 4_000, { ...spell, actor: 'enemy', kind: 'action' })).toBe(2_000)
  })
})

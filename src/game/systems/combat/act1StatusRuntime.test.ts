import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getSpellCastFailure } from '../../engine/spellEngine'
import { getManaRegenBreakdown } from '../../engine/channelingEngine'
import { calculateCombatDamage, executeCombatEffects } from './effectResolver'
import { getCombatModifiers } from './modifiers'
import { getActionRate } from './actionRuntime'
import { getCooldownRecoveryMultiplier, getDefense } from './combatStats'
import { actorCannotAct, actorCannotCastSpells, applyStatus, tickStatuses } from './statusRuntime'
import { spawnEnemy } from './combatRuntime'
import type { CombatSource } from './combatTypes'

const playerSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test-spell', school: 'fire', tags: ['spell', 'magic', 'fire'] }
const enemySource: CombatSource = { actor: 'enemy', kind: 'action', sourceId: 'test-action', sourceMonsterId: 'forest-wisp', tags: ['special'] }

const combatState = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  spawnEnemy(state, 'forest-wisp')
  state.combat.enemyMaxHp = 10_000
  state.combat.enemyHp = 5_000
  state.player.mana = 100
  return state
}

describe('Act 1 status runtime', () => {
  it('slows both enemy action lanes with Entangled', () => {
    const state = combatState()
    applyStatus(state, 'enemy', 'entangled', playerSource)

    expect(getActionRate(state, 'enemy', 'basic-attack')).toBeCloseTo(0.8)
    expect(getActionRate(state, 'enemy', 'action')).toBeCloseTo(0.8)
  })

  it('ticks Poisoned through the periodic status runtime', () => {
    const state = combatState()
    applyStatus(state, 'enemy', 'poisoned', playerSource)
    tickStatuses(state, 2_000, executeCombatEffects)

    expect(state.combat.enemyHp).toBeLessThan(5_000)
    expect(state.combat.enemyStatuses[0]).toMatchObject({ statusId: 'poisoned', remainingMs: 6_000 })
  })

  it('applies Cursed healing and damage modifiers and removes them with the status', () => {
    const state = combatState()
    applyStatus(state, 'enemy', 'cursed', playerSource)
    expect(getCombatModifiers(state, 'enemy', 'damage-dealt-percent')).toBeCloseTo(-0.1)
    expect(getCombatModifiers(state, 'enemy', 'healing-received-percent')).toBeCloseTo(-0.15)

    executeCombatEffects(state, [{ type: 'heal', target: 'opponent', magnitude: { type: 'flat', value: 100 } }], playerSource)
    expect(state.combat.enemyHp).toBeCloseTo(5_085)
  })

  it('reduces Defense and increases damage received with Fragile', () => {
    const state = combatState()
    applyStatus(state, 'enemy', 'fragile', playerSource)
    expect(getDefense(state, 'enemy')).toBe(0)
    expect(calculateCombatDamage(state, 100, 'physical', playerSource, 'enemy').resolvedBeforeBarrier).toBeCloseTo(108)
  })

  it('blocks manual and Auto-Cast spell eligibility without blocking Basic Attacks', () => {
    const state = combatState()
    state.progress.spellRanks['fire-bolt'] = 1
    applyStatus(state, 'player', 'silenced', enemySource)

    expect(getSpellCastFailure(state, 'fire-bolt')).toBe('silenced')
    expect(actorCannotCastSpells(state, 'player')).toBe(true)
    expect(actorCannotAct(state, 'player')).toBe(false)
    expect(getActionRate(state, 'player', 'basic-attack')).toBeGreaterThan(0)
  })

  it('caps Corruption at five stacks', () => {
    const state = combatState()
    for (let index = 0; index < 6; index += 1) applyStatus(state, 'enemy', 'corruption', playerSource)

    expect(state.combat.enemyStatuses).toHaveLength(1)
    expect(state.combat.enemyStatuses[0].stacks).toBe(5)
    expect(getCombatModifiers(state, 'enemy', 'damage-taken-percent')).toBeCloseTo(0.15)
  })

  it('reduces Mana regeneration and cooldown recovery with Arcane Disruption', () => {
    const state = combatState()
    const manaBefore = getManaRegenBreakdown(state).total
    const cooldownBefore = getCooldownRecoveryMultiplier(state, 'player')
    applyStatus(state, 'player', 'arcane-disruption', enemySource)

    expect(getManaRegenBreakdown(state).total).toBeCloseTo(manaBefore * 0.8)
    expect(getCooldownRecoveryMultiplier(state, 'player')).toBeCloseTo(cooldownBefore - 0.15)
  })
})

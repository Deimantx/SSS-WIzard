import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { calculateCombatDamage } from './effectResolver'
import { getDefense, getEnemyCombatStats } from './combatStats'
import { resolveMagnitude } from './magnitude'

const activeState = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.enemyId = 'forest-wisp'
  state.combat.enemyHp = MONSTERS['forest-wisp'].maxHealth
  state.combat.enemyMaxHp = MONSTERS['forest-wisp'].maxHealth
  state.player.health = state.player.maxHealth
  return state
}

describe('World Tier combat scaling', () => {
  it('scales health at spawn-facing profile and defense before the normal curve', () => {
    const state = activeState()
    const forestWisp = MONSTERS['forest-wisp']!
    state.worldTier = { current: 2, highestUnlocked: 2 }
    state.combat.enemyWorldTier = 2
    expect(getEnemyCombatStats(state).maxHealth).toBe(forestWisp.maxHealth)
    expect(getDefense(state, 'enemy')).toBe((forestWisp.defense ?? 0) * 1.25)
    expect(getEnemyCombatStats(state).basicAttackDamage).toBe(forestWisp.basicAttackDamage * 1.4)
  })

  it('applies WT2 enemy outgoing damage exactly once in the shared pipeline', () => {
    const state = activeState()
    const source = { actor: 'enemy' as const, kind: 'action' as const, sourceId: 'test', sourceMonsterId: 'forest-wisp' as const }
    const base = calculateCombatDamage(state, 10, 'physical', source, 'player', ['dot'])
    state.worldTier = { current: 2, highestUnlocked: 2 }
    state.combat.enemyWorldTier = 2
    const scaled = calculateCombatDamage(state, 10, 'physical', source, 'player', ['dot'])
    expect(base.raw).toBe(10)
    expect(scaled.raw).toBe(14)
    expect(scaled.raw / base.raw).toBe(1.4)

    const playerSource = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'fire-bolt' }
    expect(calculateCombatDamage(state, 10, 'physical', playerSource, 'enemy', ['dot']).raw).toBe(10)
  })

  it('keeps source-basic authored magnitude unscaled until the shared damage pipeline', () => {
    const state = activeState()
    state.worldTier = { current: 2, highestUnlocked: 2 }
    state.combat.enemyWorldTier = 2
    const source = { actor: 'enemy' as const, kind: 'action' as const, sourceId: 'test', sourceMonsterId: 'forest-wisp' as const }
    const authored = resolveMagnitude(state, { type: 'source-basic-damage-percent', value: 1 }, source, 'player')
    expect(authored).toBe(MONSTERS['forest-wisp'].basicAttackDamage)
    expect(calculateCombatDamage(state, authored, 'physical', source, 'player', ['dot']).raw).toBe(MONSTERS['forest-wisp'].basicAttackDamage * 1.4)
  })
})

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { getDefense, getEnemyCombatStats } from './combatStats'
import { resolveEnemyPowerBreakdown } from './enemyPower'

describe('canonical authored enemy profiles', () => {
  it('uses authored HP, Basic Damage, and Defense without a global scaling state', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = MONSTERS['forest-wisp'].maxHealth
    state.combat.enemyMaxHp = MONSTERS['forest-wisp'].maxHealth
    const monster = MONSTERS['forest-wisp']
    expect(getEnemyCombatStats(state)).toMatchObject({ maxHealth: monster.maxHealth, basicAttackDamage: monster.basicAttackDamage })
    expect(getDefense(state, 'enemy')).toBe(monster.defense ?? 0)
    expect(resolveEnemyPowerBreakdown('forest-wisp').power).toBeGreaterThan(0)
    expect('worldTier' in state).toBe(false)
    expect('enemyWorldTier' in state.combat).toBe(false)
  })
})

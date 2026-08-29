import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { castSpellAction } from '../../../store/actions/combatActions'
import { spawnEnemy } from '../combat/combatRuntime'
import { calculateCombatDamage } from '../combat/effectResolver'
import type { CombatSource } from '../../types'

const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test', school: 'fire', tags: ['spell', 'magic'] }
const spellState = (spellId: 'fireball' | 'frostbite' | 'fortify' | 'shock-spark', school: 'fire' | 'water' | 'earth' | 'air') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.schools[school].level = 16
  state.progress.spellRanks[spellId] = 1
  spawnEnemy(state, 'forest-wisp')
  state.combat.enemyMaxHp = 1000
  state.combat.enemyHp = 1000
  state.player.mana = 100
  return state
}

describe('Rank-I spell mechanics', () => {
  it('casts Fireball with school scaling and no Rank-I Burning proc', () => {
    const state = spellState('fireball', 'fire')
    expect(castSpellAction(state, 'fireball')).toBe(true)
    expect(state.combat.enemyHp).toBe(908)
    expect(state.player.mana).toBe(72)
    expect(state.combat.spellCooldowns.fireball).toBe(10000)
    expect(state.combat.enemyStatuses).toEqual([])
  })

  it('casts Frostbite and applies the existing Chilled status', () => {
    const state = spellState('frostbite', 'water')
    expect(castSpellAction(state, 'frostbite')).toBe(true)
    expect(state.combat.enemyHp).toBe(942)
    expect(state.combat.enemyStatuses[0]).toMatchObject({ statusId: 'chilled', stacks: 1 })
  })

  it('casts Fortify and uses the existing 15 percent damage reduction', () => {
    const state = spellState('fortify', 'earth')
    expect(castSpellAction(state, 'fortify')).toBe(true)
    expect(state.combat.playerStatuses[0].statusId).toBe('fortified')
    const before = state.player.health
    const source = { ...playerSpell, actor: 'enemy' as const, kind: 'basic-attack' as const }
    const breakdown = calculateCombatDamage(state, 10, 'physical', source, 'player')
    expect(breakdown.resolvedBeforeBarrier).toBe(9)
    expect(state.player.health).toBe(before)
  })

  it('casts Shock Spark and applies one existing Shock stack', () => {
    const state = spellState('shock-spark', 'air')
    expect(castSpellAction(state, 'shock-spark')).toBe(true)
    expect(state.combat.enemyHp).toBe(950)
    expect(state.combat.enemyStatuses[0]).toMatchObject({ statusId: 'shock', stacks: 1 })
  })
})

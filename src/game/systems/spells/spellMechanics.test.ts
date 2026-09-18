import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { castSpellAction } from '../../../store/actions/combatActions'
import { resolvePlayerSpellCast } from '../../engine/spellEngine'
import { spawnEnemy } from '../combat/combatRuntime'
import { calculateCombatDamage } from '../combat/effectResolver'
import type { CombatSource } from '../../types'
import { BALANCE } from '../../core/balance/balance'
import { getDefenseReductionFromRating } from '../combat/combatStats'

const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test', school: 'fire', tags: ['spell', 'magic'] }
const spellState = (spellId: 'searing-touch' | 'frost-touch' | 'harden' | 'static-charge', school: 'fire' | 'water' | 'earth' | 'air') => {
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
  it('casts Fireball from Spell Power and applies its Burning proc', () => {
    const state = spellState('searing-touch', 'fire')
    expect(castSpellAction(state, 'searing-touch')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(state.combat.enemyHp).toBeCloseTo(1000 - BALANCE.player.baseSpellPower * 0.25 * 1.5 * (1 - getDefenseReductionFromRating(8)))
    expect(state.player.mana).toBe(55)
    expect(state.combat.spellCooldowns['searing-touch']).toBe(10000)
    expect(state.combat.enemyStatuses).toMatchObject([{ statusId: 'burning', instanceKey: 'player:spell:searing-touch', remainingMs: 6000 }])
  })

  it('casts Frostbite and applies the existing Chilled status', () => {
    const state = spellState('frost-touch', 'water')
    expect(castSpellAction(state, 'frost-touch')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(state.combat.enemyHp).toBeCloseTo(1000 - BALANCE.player.baseSpellPower * 0.7 * 1.5 * (1 - getDefenseReductionFromRating(8)))
    expect(state.combat.enemyStatuses[0]).toMatchObject({ statusId: 'chilled', stacks: 1 })
  })

  it('casts Fortify and uses the existing 15 percent damage reduction', () => {
    const state = spellState('harden', 'earth')
    expect(castSpellAction(state, 'harden')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(state.combat.playerStatuses[0].statusId).toBe('hardened')
    const before = state.player.health
    const source = { ...playerSpell, actor: 'enemy' as const, kind: 'basic-attack' as const }
    const breakdown = calculateCombatDamage(state, 10, 'physical', source, 'player')
    expect(breakdown.resolvedBeforeBarrier).toBe(7.5)
    expect(state.player.health).toBe(before)
  })

  it('casts Shock Spark and applies one existing Shock stack', () => {
    const state = spellState('static-charge', 'air')
    expect(castSpellAction(state, 'static-charge')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(state.combat.enemyHp).toBeCloseTo(1000 - BALANCE.player.baseSpellPower * 0.5 * 1.5 * (1 - getDefenseReductionFromRating(8)))
    expect(state.combat.playerStatuses[0]).toMatchObject({ statusId: 'static' })
  })
})

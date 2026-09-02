import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { BALANCE } from '../../core/balance/balance'
import { calculateCombatDamage, damageEnemy } from './effectResolver'
import { getBlockChance, getCritChance, getCritDamageMultiplier, getDefense, getDefenseReduction, getEnemyCombatStats, getPlayerCombatStats } from './combatStats'
import { getResistance } from './modifiers'
import { nextCombatRandom } from './combatRng'
import type { CombatSource } from './combatTypes'
import { ITEMS } from '../../content/items/items'
import type { ItemDefinition, ItemId } from '../../types'

const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'stats-test', school: 'fire', tags: ['spell', 'direct', 'fire'] }

describe('universal combat stats foundation', () => {
  it('uses the canonical Defense curve for direct hits and ignores it for DoT', () => {
    const state = createInitialState()
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyMaxHp = 1_000

    expect(getDefense(state, 'player')).toBe(10)
    expect(getDefenseReduction(state, 'player')).toBeCloseTo(10 / 110)
    const direct = calculateCombatDamage(state, 100, 'physical', { actor: 'enemy', kind: 'basic-attack', sourceId: 'test', tags: ['basic-attack', 'direct'] }, 'player')
    const dot = calculateCombatDamage(state, 100, 'physical', { actor: 'enemy', kind: 'status', sourceId: 'test-dot', tags: ['status', 'dot'] }, 'player')
    expect(direct.defenseReduction).toBeCloseTo(10 / 110)
    expect(direct.resolvedBeforeBarrier).toBeCloseTo(100 * (1 - 10 / 110))
    expect(dot.defenseReduction).toBe(0)
    expect(dot.resolvedBeforeBarrier).toBe(100)
  })

  it('exposes the locked default player and enemy stat sheet', () => {
    const state = createInitialState()
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyMaxHp = 1_000
    const player = getPlayerCombatStats(state)
    const enemy = getEnemyCombatStats(state)
    expect(player).toMatchObject({ spellPower: BALANCE.player.baseSpellPower, critChance: 0.05, critDamageMultiplier: 1.5, defense: 10, blockChance: 0 })
    expect(enemy).toMatchObject({ maxHealth: 1_000, defense: 10, critChance: 0.05, critDamageMultiplier: 1.5, blockChance: 0 })
    expect(getCritChance(state, 'player', playerSpell)).toBe(0.05)
    expect(getCritDamageMultiplier(state, 'player', playerSpell)).toBe(1.5)
    expect(getBlockChance(state, 'player', playerSpell)).toBe(0)
  })

  it('consumes two RNG draws for a direct hit and none for a periodic hit', () => {
    const directState = createInitialState()
    directState.combat.enemyId = 'forest-wisp'
    directState.combat.enemyMaxHp = 1_000
    directState.combat.enemyHp = 1_000
    const before = directState.combat.combatRngState
    damageEnemy(directState, 1, 'spell')
    const afterDirect = directState.combat.combatRngState

    const oneDraw = { combatRngState: before }
    nextCombatRandom(oneDraw)
    const twoDraws = oneDraw.combatRngState
    nextCombatRandom(oneDraw)
    expect(afterDirect).toBe(oneDraw.combatRngState)
    expect(twoDraws).not.toBe(afterDirect)

    const dotState = createInitialState()
    dotState.combat.enemyId = 'forest-wisp'
    dotState.combat.enemyMaxHp = 1_000
    dotState.combat.enemyHp = 1_000
    const dotBefore = dotState.combat.combatRngState
    damageEnemy(dotState, 1, 'status')
    expect(dotState.combat.combatRngState).toBe(dotBefore)
  })

  it('keeps enemy resistance independent from player equipment and caps ordinary resistance at 75%', () => {
    const itemId = 'stats-resistance-test' as ItemId
    const item: ItemDefinition = { ...ITEMS['apprentice-wand'], id: itemId, stats: { resistances: { fire: 0.5 } } }
    ITEMS[itemId] = item
    const secondItemId = 'stats-resistance-test-2' as ItemId
    ITEMS[secondItemId] = { ...ITEMS['apprentice-wand'], id: secondItemId, stats: { resistances: { fire: 0.4 } } }
    try {
      const state = createInitialState()
      state.equipment.weapon = itemId
      state.equipment.offhand = secondItemId
      expect(getResistance(state, 'player', 'fire')).toBe(0.75)
      state.combat.enemyId = 'forest-wisp'
      expect(getResistance(state, 'enemy', 'fire')).toBe(0)
      state.combat.enemyId = null
      expect(getResistance(state, 'enemy', 'fire')).toBe(0)
    } finally {
      delete ITEMS[itemId]
      delete ITEMS[secondItemId]
    }
  })
})

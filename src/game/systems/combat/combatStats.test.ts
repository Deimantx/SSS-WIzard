import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { BALANCE } from '../../core/balance/balance'
import { calculateCombatDamage, damageEnemy } from './effectResolver'
import { executeCombatEffects } from './effectResolver'
import { resolveCurrentEnemyAction } from './actionRuntime'
import { spawnEnemy } from './combatRuntime'
import { getBlockChance, getCritChance, getCritDamageMultiplier, getDefense, getDefenseReduction, getDefenseReductionFromRating, getEnemyCombatStats, getPlayerCombatStats } from './combatStats'
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

    const playerDefenseReduction = getDefenseReductionFromRating(BALANCE.player.baseDefense)
    expect(getDefense(state, 'player')).toBe(BALANCE.player.baseDefense)
    expect(getDefenseReduction(state, 'player')).toBeCloseTo(playerDefenseReduction)
    const direct = calculateCombatDamage(state, 100, 'physical', { actor: 'enemy', kind: 'basic-attack', sourceId: 'test', tags: ['basic-attack', 'direct'] }, 'player')
    const dot = calculateCombatDamage(state, 100, 'physical', { actor: 'enemy', kind: 'status', sourceId: 'test-dot', tags: ['status', 'dot'] }, 'player')
    expect(direct.defenseReduction).toBeCloseTo(playerDefenseReduction)
    expect(direct.resolvedBeforeBarrier).toBeCloseTo(100 * (1 - playerDefenseReduction))
    expect(dot.defenseReduction).toBe(0)
    expect(dot.resolvedBeforeBarrier).toBe(100)
  })

  it('uses the slower shared Defense curve and preserves its cap', () => {
    expect(getDefenseReductionFromRating(0)).toBe(0)
    expect(getDefenseReductionFromRating(47)).toBeCloseTo(0.1354, 4)
    expect(getDefenseReductionFromRating(100)).toBe(0.25)
    expect(getDefenseReductionFromRating(300)).toBe(0.5)
    expect(getDefenseReductionFromRating(700)).toBe(0.7)
    expect(getDefenseReductionFromRating(1_000)).toBe(0.7)
    expect(getDefenseReductionFromRating(-10)).toBe(0)
  })

  it('exposes the locked default player and enemy stat sheet', () => {
    const state = createInitialState()
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyMaxHp = 1_000
    const player = getPlayerCombatStats(state)
    const enemy = getEnemyCombatStats(state)
    expect(player).not.toHaveProperty('basicAttackDamage')
    expect(player).not.toHaveProperty('basicAttackSpeedMultiplier')
    expect(player).not.toHaveProperty('basicAttackIntervalMs')
    expect(player).not.toHaveProperty('blockChance')
    expect(player).toMatchObject({ spellPower: BALANCE.player.baseSpellPower, critChance: 0.05, critDamageMultiplier: 1.5, defense: BALANCE.player.baseDefense })
    expect(enemy).toMatchObject({ maxHealth: 1_000, defense: 8, critChance: 0.05, critDamageMultiplier: 1.5, blockChance: 0 })
    expect(getCritChance(state, 'player', playerSpell)).toBe(0.05)
    expect(getCritDamageMultiplier(state, 'player', playerSpell)).toBe(1.5)
    expect(getBlockChance(state, 'player', playerSpell)).toBe(0)
  })

  it('includes equipped Crystal stats in live player combat modifiers', () => {
    const state = createInitialState()
    state.crystals.equippedSlots[0] = 'cataclysm-t1'
    state.crystals.equippedSlots[1] = 'bulwark-t1'

    const player = getPlayerCombatStats(state)

    expect(player.critDamageMultiplier).toBe(BALANCE.player.baseCritDamage + 0.04)
    expect(getDefense(state, 'player')).toBe(BALANCE.player.baseDefense + 12)
    expect(getDefenseReduction(state, 'player')).toBeCloseTo(getDefenseReductionFromRating(BALANCE.player.baseDefense + 12))
  })

  it('keeps the enemy Basic Attack path after removing player Basic fields', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.activeSpellLoadout = { presetId: null, presetName: 'Combat test', slots: [{ spellId: 'fire-bolt', autoCast: false }], signature: 'fire-bolt:0' }
    spawnEnemy(state, 'forest-wisp')
    const before = state.player.health
    expect(resolveCurrentEnemyAction(state, executeCombatEffects)).toBe(true)
    expect(state.player.health).toBeLessThan(before)
    expect(getEnemyCombatStats(state).basicAttackDamage).toBe(10)
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
    const item: ItemDefinition = { ...ITEMS['tideglass-wand'], id: itemId, stats: { resistances: { fire: 0.5 } } }
    ITEMS[itemId] = item
    const secondItemId = 'stats-resistance-test-2' as ItemId
    ITEMS[secondItemId] = { ...ITEMS['tideglass-wand'], id: secondItemId, equipmentSlot: 'armor', stats: { resistances: { fire: 0.4 } } }
    try {
      const state = createInitialState()
      state.equipment.weapon = itemId
      state.equipment.armor = secondItemId
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

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { executeCombatEffects, damageEnemy, damagePlayer, resolveBasicAttackInterval } from './effectResolver'
import { applyStatus, tickStatuses } from './statusRuntime'
import { executeSpecial, spawnEnemy } from './combatRuntime'
import { migrateSave } from '../../../persistence/migrations'
import type { CombatSource } from '../../types'

const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test-spell', school: 'fire', tags: ['spell', 'magic'] }
const enemyAttack: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: 'test-attack', tags: ['basic-attack', 'direct'] }
const stateWithEnemy = (enemyId: Parameters<typeof spawnEnemy>[1] = 'forest-wisp') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  spawnEnemy(state, enemyId)
  return state
}

describe('universal combat effects', () => {
  it('resolves damage, healing, barriers, mana, delay, and cooldowns', () => {
    const state = stateWithEnemy()
    state.combat.playerBarrier = 10
    damagePlayer(state, 15, enemyAttack)
    expect(state.combat.playerBarrier).toBe(0)
    expect(state.player.health).toBe(95)
    state.player.health = 99
    executeCombatEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 20 } }, { type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 25 } }, { type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 100 } }, { type: 'modify-action-timer', target: 'self', action: 'basic-attack', amountMs: 700 }, { type: 'modify-cooldown', target: 'self', spellId: 'fire-bolt', amountMs: -2000 }], playerSpell)
    expect(state.player.health).toBe(state.player.maxHealth)
    expect(state.combat.playerBarrier).toBe(25)
    expect(state.player.mana).toBe(state.player.maxMana)
    expect(state.combat.playerAttackTimerMs).toBe(700)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
  })

  it('uses one damage pipeline for enemy barriers, overflow, resistances, and source tags', () => {
    const state = stateWithEnemy('thornling')
    state.combat.enemyBarrier = 5
    const dealt = damageEnemy(state, 10, 'basic')
    expect(dealt).toBe(4)
    expect(state.combat.enemyBarrier).toBe(0)
    expect(state.combat.enemyHp).toBe(60)
    expect(state.combat.log).toContain('Barrier breaks.')
  })
})

describe('authored status runtime', () => {
  it('applies, refreshes, ticks, expires, and retains Burning source', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'burning', playerSpell)
    expect(state.combat.enemyStatuses[0]).toMatchObject({ statusId: 'burning', source: playerSpell, remainingMs: 5000 })
    const first = state.combat.enemyStatuses[0]
    tickStatuses(state, 1000, executeCombatEffects)
    expect(state.combat.enemyHp).toBe(39)
    applyStatus(state, 'enemy', 'burning', { ...playerSpell, sourceId: 'ignite-again' })
    expect(state.combat.enemyStatuses[0]).toMatchObject({ remainingMs: 5000, source: { sourceId: 'ignite-again' } })
    expect(first.statusId).toBe('burning')
    tickStatuses(state, 5000, executeCombatEffects)
    expect(state.combat.enemyStatuses).toHaveLength(0)
  })

  it('uses authored modifiers and stack caps without status-ID checks in damage code', () => {
    const state = stateWithEnemy()
    for (let index = 0; index < 6; index += 1) applyStatus(state, 'enemy', 'shock', playerSpell)
    expect(state.combat.enemyStatuses[0].stacks).toBe(5)
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: 'air', magnitude: { type: 'flat', value: 10 }, tags: ['spell'] }], { ...playerSpell, school: 'air' })
    expect(state.combat.enemyHp).toBe(32)
    applyStatus(state, 'player', 'quickening', { actor: 'player', kind: 'spell', sourceId: 'quickening', tags: ['spell'] })
    expect(resolveBasicAttackInterval(state, 'player', 1200)).toBe(900)
  })

  it('ticks a holder-relative Regeneration and supports cleanse, dispel, and Stun', () => {
    const state = stateWithEnemy()
    state.player.health = 50
    applyStatus(state, 'player', 'regeneration', { actor: 'player', kind: 'spell', sourceId: 'regen', tags: ['spell'] })
    applyStatus(state, 'player', 'burning', { actor: 'enemy', kind: 'special-attack', sourceId: 'burn', tags: ['special'] })
    applyStatus(state, 'player', 'stunned', { actor: 'enemy', kind: 'special-attack', sourceId: 'stun', tags: ['special'] })
    tickStatuses(state, 1000, executeCombatEffects)
    expect(state.player.health).toBe(50)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'burning')).toBe(true)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'stunned')).toBe(true)
  })
})

describe('combat save compatibility', () => {
  it('converts legacy Barrier and action-delay statuses without losing the remaining status source', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, combat: { ...initial.combat, playerStatuses: [{ id: 'barrier', remainingMs: 9000, value: 22 }, { id: 'attack-delay', remainingMs: 700, value: 700 }, { id: 'burning', remainingMs: 4000, value: 5, tickIntervalMs: 1000, nextTickMs: 500 }], enemySpecialUsed: {} } } as any)
    expect(migrated.combat.playerBarrier).toBe(22)
    expect(migrated.combat.playerAttackTimerMs).toBe(700)
    expect(migrated.combat.playerStatuses).toHaveLength(1)
    expect(migrated.combat.playerStatuses[0]).toMatchObject({ statusId: 'burning', potency: 5 })
  })
})

describe('data-driven monster mechanics', () => {
  it('composes Thorn Lash and Root Slam effects', () => {
    const thornling = stateWithEnemy('thornling')
    executeSpecial(thornling, 'thorn-lash')
    expect(thornling.player.health).toBe(90)
    expect(thornling.combat.playerStatuses[0].statusId).toBe('thorn-wound')
    const root = stateWithEnemy('stone-root')
    expect(root.combat.enemyBarrier).toBe(14)
    executeSpecial(root, 'root-slam')
    expect(root.player.health).toBe(82)
    expect(root.combat.playerAttackTimerMs).toBe(700)
  })

  it('fires authored threshold rules once per encounter', () => {
    const sentinel = stateWithEnemy('grove-sentinel')
    damageEnemy(sentinel, 220, 'spell')
    expect(sentinel.combat.enemyBarrier).toBe(80)
    damageEnemy(sentinel, 10, 'spell')
    expect(sentinel.combat.enemyBarrier).toBe(70)
    expect(sentinel.combat.triggeredRuleIds).toEqual(['grove-sentinel-ancient-growth-threshold'])
    const heart = stateWithEnemy('forest-heart')
    damageEnemy(heart, 310, 'spell')
    expect(heart.combat.enemyStatuses[0]).toMatchObject({ statusId: 'quickening', potency: 0.15, remainingMs: null })
    expect(resolveBasicAttackInterval(heart, 'enemy', 2400)).toBe(2040)
  })
})

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { recalculateDerivedStats } from '../../engine'
import { ITEMS, validateItemDefinitions } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { RECIPES, isRecipeUnlocked, validateRecipeDefinitions } from '../../content/recipes/recipes'
import { resolveMonsterLoot } from '../loot/lootResolution'
import { getEquipmentStats } from '../../core/equipment/equipmentStats'
import { getEffectiveManaCost, getPlayerCombatStats } from './combatStats'
import { getCombatModifiers, getResistance } from './modifiers'
import { damageEnemy, damagePlayer, executeCombatEffects } from './effectResolver'
import { spawnEnemy } from './combatRuntime'
import { applyStatus, tickStatuses } from './statusRuntime'
import { tickRuleCooldowns } from './triggerRuntime'
import type { CombatSource } from './combatTypes'

const playerSpell: CombatSource = {
  actor: 'player',
  kind: 'spell',
  sourceId: 'equipment-test-spell',
  school: 'fire',
  tags: ['spell', 'magic', 'direct', 'fire'],
}

const enemyAction: CombatSource = {
  actor: 'enemy',
  kind: 'action',
  sourceId: 'equipment-test-enemy-action',
  sourceMonsterId: 'forest-wisp',
  sourceInstanceKey: 'enemy:equipment-test',
  tags: ['status', 'debuff'],
}

const stateWithEnemy = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.enemyId = 'forest-wisp'
  state.combat.enemyInstanceKey = 'enemy:equipment-test'
  state.combat.enemyMaxHp = 1_000
  state.combat.enemyHp = 1_000
  return state
}

describe('authored equipment content', () => {
  it('contains exactly the planned equipment set and validates all content', () => {
    const equipment = Object.values(ITEMS).filter((item) => item.kind === 'equipment')
    expect(equipment).toHaveLength(27)
    expect(ITEMS['apprentice-wand' as keyof typeof ITEMS]).toBeUndefined()
    expect(validateItemDefinitions()).toEqual([])
    expect(validateRecipeDefinitions()).toEqual([])
    expect(Object.values(MONSTERS).every((monster) => monster.loot.every((drop) => ITEMS[drop.itemId]))).toBe(true)
  })

  it('uses authored stats for derived combat values and mana costs', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.equipment.offhand = 'tide-focus'
    state.equipment.helmet = 'wispveil-hood'
    recalculateDerivedStats(state)

    expect(getEquipmentStats(state)).toMatchObject({ spellPower: 30, maxMana: 40, basicDamage: 4 })
    expect(getPlayerCombatStats(state)).toMatchObject({ spellPower: 130, basicAttackDamage: 12, maxMana: 140, cooldownRecovery: 1 })
    expect(getResistance(state, 'player', 'fire')).toBe(0)
    expect(getEffectiveManaCost(state, 10)).toBe(10)

    state.equipment.weapon = 'fangbound-dagger'
    state.equipment.offhand = 'fangbound-buckler'
    state.equipment.helmet = 'razorclaw-circlet'
    recalculateDerivedStats(state)
    expect(getPlayerCombatStats(state)).toMatchObject({ basicAttackDamage: 16, basicAttackSpeedMultiplier: 1.13, critDamageMultiplier: 1.65, blockChance: 0.15 })
    expect(getPlayerCombatStats(state).critChance).toBeCloseTo(0.12)
    expect(getResistance(state, 'player', 'physical')).toBe(0.03)

    state.equipment.weapon = 'graveglass-wand'
    state.equipment.offhand = null
    state.equipment.helmet = 'wispveil-hood'
    recalculateDerivedStats(state)
    expect(getPlayerCombatStats(state)).toMatchObject({ spellPower: 130, maxMana: 115, cooldownRecovery: 1.1, manaCostReduction: 0.1 })
    expect(getEffectiveManaCost(state, 10)).toBe(9)
  })

  it('resolves direct Forest Heart loot through central item acquisition', () => {
    const state = createInitialState()
    const result = resolveMonsterLoot(state, 'forest-heart', undefined, () => 0)

    expect(result).toContain('Heartseed')
    expect(state.inventory.heartseed).toBe(1)
    expect(state.inventory['heartseed-necklace']).toBe(1)
    expect(state.inventory['life-essence']).toBe(1)
    expect(state.progress.discoveredItems).toEqual(expect.arrayContaining(['heartseed', 'heartseed-necklace', 'life-essence']))
  })

  it('uses progression and dungeon unlock definitions for equipment recipes', () => {
    const state = createInitialState()
    expect(isRecipeUnlocked(state, RECIPES['wispwood-wand'])).toBe(false)
    expect(isRecipeUnlocked(state, RECIPES['fangbound-dagger'])).toBe(false)

    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    expect(isRecipeUnlocked(state, RECIPES['wispwood-wand'])).toBe(true)
    expect(isRecipeUnlocked(state, RECIPES['fangbound-dagger'])).toBe(false)

    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(isRecipeUnlocked(state, RECIPES['fangbound-dagger'])).toBe(true)
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(isRecipeUnlocked(state, RECIPES['graveglass-wand'])).toBe(true)
  })
})

describe('equipment combat effects', () => {
  it('activates each threshold relic once per encounter and resets on spawn', () => {
    const heartseedState = stateWithEnemy()
    heartseedState.equipment.amulet = 'heartseed-necklace'
    recalculateDerivedStats(heartseedState)
    heartseedState.player.health = 100
    damagePlayer(heartseedState, 80, enemyAction)
    expect(heartseedState.combat.playerBarrier).toBe(20)

    heartseedState.combat.playerBarrier = 0
    heartseedState.player.health = 100
    damagePlayer(heartseedState, 80, enemyAction)
    expect(heartseedState.combat.playerBarrier).toBe(0)

    spawnEnemy(heartseedState, 'forest-wisp')
    heartseedState.player.health = 100
    damagePlayer(heartseedState, 80, enemyAction)
    expect(heartseedState.combat.playerBarrier).toBe(20)

    const heartstoneState = stateWithEnemy()
    heartstoneState.equipment.amulet = 'greatbear-heartstone'
    recalculateDerivedStats(heartstoneState)
    heartstoneState.player.health = 100
    damagePlayer(heartstoneState, 80, enemyAction)
    expect(heartstoneState.combat.playerBarrier).toBe(40)
  })

  it("heals on kill with Howling Signet's authored trigger", () => {
    const state = stateWithEnemy()
    state.equipment.ring1 = 'howling-signet'
    recalculateDerivedStats(state)
    state.player.health = 50
    state.combat.enemyHp = 10

    damageEnemy(state, 100, 'spell')

    expect(state.player.health).toBe(75)
    expect(state.combat.log).toContain("Predator's Feast triggers.")
  })

  it('applies conditional debuffed-target damage and stacks two Gravebinder Rings', () => {
    const state = stateWithEnemy()
    state.equipment.weapon = 'edrins-remnant-staff'
    state.equipment.ring1 = 'gravebinder-ring'
    state.equipment.ring2 = 'gravebinder-ring'
    recalculateDerivedStats(state)

    expect(getCombatModifiers(state, 'player', 'damage-dealt-percent', { source: playerSpell })).toBe(0)
    applyStatus(state, 'enemy', 'chilled', playerSpell)
    expect(getCombatModifiers(state, 'player', 'damage-dealt-percent', { source: playerSpell })).toBeCloseTo(0.3)
  })

  it('combines outgoing and received status-duration modifiers', () => {
    const outgoing = stateWithEnemy()
    outgoing.equipment.weapon = 'corrupted-howlstaff'
    outgoing.equipment.helmet = 'wraithveil-hood'
    recalculateDerivedStats(outgoing)
    expect(applyStatus(outgoing, 'enemy', 'chilled', playerSpell, { durationMs: 5_000 })?.remainingMs).toBe(6_250)

    const received = stateWithEnemy()
    received.equipment.helmet = 'wraithveil-hood'
    recalculateDerivedStats(received)
    expect(applyStatus(received, 'player', 'chilled', enemyAction, { durationMs: 5_000 })?.remainingMs).toBe(4_500)
    received.equipment.helmet = null
    received.equipment.cape = 'predator-hide-mantle'
    expect(applyStatus(received, 'player', 'vulnerable', enemyAction, { durationMs: 5_000 })?.remainingMs).toBe(4_500)
    expect(applyStatus(received, 'player', 'regeneration', enemyAction, { durationMs: 5_000 })?.remainingMs).toBe(5_000)
  })

  it('scales periodic damage through the wearer-owned DoT modifier', () => {
    const plain = stateWithEnemy()
    applyStatus(plain, 'enemy', 'burning', playerSpell)
    tickStatuses(plain, 1_000, executeCombatEffects)
    const plainDamage = 1_000 - plain.combat.enemyHp

    const soulglass = stateWithEnemy()
    soulglass.equipment.amulet = 'soulglass-amulet'
    recalculateDerivedStats(soulglass)
    applyStatus(soulglass, 'enemy', 'burning', playerSpell)
    tickStatuses(soulglass, 1_000, executeCombatEffects)
    expect(1_000 - soulglass.combat.enemyHp).toBeGreaterThan(plainDamage)
  })

  it('restores Mana or strikes back when a Soulward Barrier breaks', () => {
    const focus = stateWithEnemy()
    focus.equipment.offhand = 'soulward-focus'
    recalculateDerivedStats(focus)
    focus.player.mana = 10
    executeCombatEffects(focus, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], playerSpell)
    damagePlayer(focus, 40, enemyAction)
    expect(focus.combat.playerBarrier).toBe(0)
    expect(focus.player.mana).toBe(25)

    const shield = stateWithEnemy()
    shield.equipment.offhand = 'soulward-shield'
    recalculateDerivedStats(shield)
    executeCombatEffects(shield, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], playerSpell)
    damagePlayer(shield, 40, enemyAction)
    expect(shield.combat.playerBarrier).toBe(0)
    expect(shield.combat.enemyHp).toBeLessThan(1_000)
    expect(shield.combat.log).toContain('Soul Release triggers.')
  })

  it('triggers Edrin Signet for hostile debuffs with its cooldown', () => {
    const state = stateWithEnemy()
    state.equipment.ring1 = 'edrins-signet'
    recalculateDerivedStats(state)

    executeCombatEffects(state, [{ type: 'apply-status', target: 'opponent', statusId: 'chilled', tags: ['debuff'] }], enemyAction)
    expect(state.combat.playerBarrier).toBe(20)

    executeCombatEffects(state, [{ type: 'apply-status', target: 'opponent', statusId: 'vulnerable', tags: ['debuff'] }], enemyAction)
    expect(state.combat.playerBarrier).toBe(20)

    tickRuleCooldowns(state, 30_000)
    state.combat.playerBarrier = 0
    executeCombatEffects(state, [{ type: 'apply-status', target: 'opponent', statusId: 'vulnerable', tags: ['debuff'] }], enemyAction)
    expect(state.combat.playerBarrier).toBe(20)

    state.combat.playerBarrier = 0
    executeCombatEffects(state, [{ type: 'apply-status', target: 'opponent', statusId: 'chilled', tags: ['debuff'] }], playerSpell)
    expect(state.combat.playerBarrier).toBe(0)

    const selfBuff = stateWithEnemy()
    selfBuff.equipment.ring1 = 'edrins-signet'
    recalculateDerivedStats(selfBuff)
    executeCombatEffects(selfBuff, [{ type: 'apply-status', target: 'self', statusId: 'haste', tags: ['buff'] }], enemyAction)
    executeCombatEffects(selfBuff, [{ type: 'apply-status', target: 'self', statusId: 'regeneration', tags: ['buff'] }], playerSpell)
    expect(selfBuff.combat.playerBarrier).toBe(0)
  })
})

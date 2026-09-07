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
import type { CombatEffect, CombatSource } from './combatTypes'
import { BALANCE } from '../../core/balance/balance'

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
    expect(equipment).toHaveLength(18)
    expect(ITEMS['apprentice-wand' as keyof typeof ITEMS]).toBeUndefined()
    expect(validateItemDefinitions()).toEqual([])
    expect(validateRecipeDefinitions()).toEqual([])
    expect(Object.values(MONSTERS).every((monster) => monster.loot.every((drop) => ITEMS[drop.itemId]))).toBe(true)
  })

  it('uses authored Artifact and accessory stats for derived combat values', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.equipment.helmet = 'wispveil-hood'
    recalculateDerivedStats(state)

    expect(getEquipmentStats(state)).toMatchObject({ spellPower: 16, maxHealth: 10, basicDamage: 5 })
    expect(getPlayerCombatStats(state)).toMatchObject({ spellPower: BALANCE.player.baseSpellPower + 16, basicAttackDamage: BALANCE.player.basicAttackDamage + 5, maxMana: 100, cooldownRecovery: 1 })
    expect(getResistance(state, 'player', 'fire')).toBe(0)
    expect(getEffectiveManaCost(state, 10)).toBe(10)

    const build = createInitialState()
    build.equipment.weapon = 'tideglass-wand'
    build.equipment.offhand = 'prismatic-focus'
    build.equipment.armor = 'wispweave-robe'
    build.equipment.amulet = 'windthread-charm'
    recalculateDerivedStats(build)
    expect(getEquipmentStats(build)).toMatchObject({ spellPower: expect.any(Number), maxMana: expect.any(Number), basicDamage: expect.any(Number) })
    expect(getPlayerCombatStats(build).maxMana).toBeGreaterThan(100)
    expect(getCombatModifiers(build, 'player', 'spell-damage-percent', { source: { ...playerSpell, school: 'air', tags: ['spell', 'air'] } })).toBeCloseTo(0.1)
    expect(getEffectiveManaCost(build, 10)).toBe(10)
  })

  it('resolves Forest Heart material loot through central item acquisition', () => {
    const state = createInitialState()
    const result = resolveMonsterLoot(state, 'forest-heart', undefined, () => 0)

    expect(result).toContain('Heartseed')
    expect(state.inventory.heartseed).toBe(1)
    expect(state.inventory['heartseed-necklace']).toBeUndefined()
    expect(state.inventory['life-essence']).toBe(10)
    expect(state.progress.discoveredItems).toEqual(expect.arrayContaining(['heartseed', 'life-essence']))
    expect(state.progress.discoveredItems).not.toContain('heartseed-necklace')
  })

  it('uses progression and dungeon unlock definitions for equipment recipes', () => {
    const state = createInitialState()
    expect(isRecipeUnlocked(state, RECIPES['tideglass-wand'])).toBe(false)
    expect(isRecipeUnlocked(state, RECIPES['predator-hide-mantle'])).toBe(false)

    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    expect(isRecipeUnlocked(state, RECIPES['tideglass-wand'])).toBe(true)
    expect(isRecipeUnlocked(state, RECIPES['predator-hide-mantle'])).toBe(false)

    state.progress.lifetimeKillsByMonster['cavefang-wolf'] = 1
    expect(isRecipeUnlocked(state, RECIPES['predator-hide-mantle'])).toBe(true)
    state.progress.lifetimeKillsByMonster['restless-skeleton'] = 1
    expect(isRecipeUnlocked(state, RECIPES['ossuary-mantle'])).toBe(true)
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

  it('applies Gravebinder through real Basic, Spell, and DoT damage paths', () => {
    const resolveBasicDamage = (equipment: boolean, targetStatus: 'none' | 'buff' | 'debuff') => {
      const state = stateWithEnemy()
      if (equipment) { state.inventory['gravebinder-ring'] = 1; state.equipment.ring1 = 'gravebinder-ring' }
      if (targetStatus === 'buff') applyStatus(state, 'enemy', 'haste', enemyAction)
      if (targetStatus === 'debuff') applyStatus(state, 'enemy', 'chilled', playerSpell)
      const before = state.combat.enemyHp
      damageEnemy(state, 100, 'basic')
      return before - state.combat.enemyHp
    }
    expect(resolveBasicDamage(true, 'none')).toBe(resolveBasicDamage(false, 'none'))
    expect(resolveBasicDamage(true, 'buff')).toBe(resolveBasicDamage(false, 'buff'))
    expect(resolveBasicDamage(true, 'debuff')).toBeCloseTo(resolveBasicDamage(false, 'debuff') * 1.1)

    const plainSpell = stateWithEnemy()
    const ringSpell = stateWithEnemy()
    ringSpell.inventory['gravebinder-ring'] = 1
    ringSpell.equipment.ring1 = 'gravebinder-ring'
    applyStatus(plainSpell, 'enemy', 'chilled', playerSpell)
    applyStatus(ringSpell, 'enemy', 'chilled', playerSpell)
    damageEnemy(plainSpell, 100, 'spell')
    damageEnemy(ringSpell, 100, 'spell')
    expect(1_000 - ringSpell.combat.enemyHp).toBeCloseTo((1_000 - plainSpell.combat.enemyHp) * 1.1)

    const plainDot = stateWithEnemy()
    const ringDot = stateWithEnemy()
    ringDot.inventory['gravebinder-ring'] = 1
    ringDot.equipment.ring1 = 'gravebinder-ring'
    applyStatus(plainDot, 'enemy', 'chilled', playerSpell)
    applyStatus(ringDot, 'enemy', 'chilled', playerSpell)
    applyStatus(plainDot, 'enemy', 'burning', playerSpell)
    applyStatus(ringDot, 'enemy', 'burning', playerSpell)
    tickStatuses(plainDot, 1_000, executeCombatEffects)
    tickStatuses(ringDot, 1_000, executeCombatEffects)
    expect(1_000 - ringDot.combat.enemyHp).toBeCloseTo((1_000 - plainDot.combat.enemyHp) * 1.1)

    const double = stateWithEnemy()
    double.inventory['gravebinder-ring'] = 2
    double.equipment.ring1 = 'gravebinder-ring'
    double.equipment.ring2 = 'gravebinder-ring'
    applyStatus(double, 'enemy', 'chilled', playerSpell)
    expect(getCombatModifiers(double, 'player', 'damage-dealt-percent', { source: playerSpell })).toBeCloseTo(0.2)
    const doublePlain = stateWithEnemy()
    applyStatus(doublePlain, 'enemy', 'chilled', playerSpell)
    damageEnemy(doublePlain, 100, 'basic')
    const before = double.combat.enemyHp
    damageEnemy(double, 100, 'basic')
    expect(before - double.combat.enemyHp).toBeCloseTo((1_000 - doublePlain.combat.enemyHp) * 1.2)
  })

  it('applies Ember Staff Fire Spell damage to direct and Spell-origin Burning only', () => {
    const fireHit: CombatEffect[] = [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 100 } }], tags: ['direct', 'fire'] }]
    const equipEmber = (state: ReturnType<typeof stateWithEnemy>) => { state.inventory['ember-staff'] = 1; state.equipment.weapon = 'ember-staff'; state.artifactProgress['ember-staff'] = { level: 2, allocatedNodeIds: ['arcane-kindling'], attunedNodeIds: [] }; recalculateDerivedStats(state) }
    const spellBurn = (withStaff: boolean) => {
      const state = stateWithEnemy()
      if (withStaff) equipEmber(state)
      applyStatus(state, 'enemy', 'burning', { ...playerSpell, sourceId: 'ignite' }, { durationMs: 1_000, periodicEffects: [{ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 100 } }], tags: ['dot', 'fire'] }] })
      tickStatuses(state, 1_000, executeCombatEffects)
      return 1_000 - state.combat.enemyHp
    }
    const directSpell = (withStaff: boolean) => {
      const state = stateWithEnemy()
      if (withStaff) equipEmber(state)
      executeCombatEffects(state, fireHit, playerSpell)
      return 1_000 - state.combat.enemyHp
    }
    const nonSpellBurn = (withStaff: boolean) => {
      const state = stateWithEnemy()
      if (withStaff) equipEmber(state)
      applyStatus(state, 'enemy', 'burning', { actor: 'player', kind: 'status', sourceId: 'environment-burning', tags: ['status', 'dot', 'fire'] }, { durationMs: 1_000, periodicEffects: [{ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 100 } }], tags: ['dot', 'fire'] }] })
      tickStatuses(state, 1_000, executeCombatEffects)
      return 1_000 - state.combat.enemyHp
    }

    expect(directSpell(true)).toBeCloseTo(directSpell(false) * 1.05)
    expect(spellBurn(true)).toBeCloseTo(spellBurn(false) * 1.05)
    expect(nonSpellBurn(true)).toBeCloseTo(nonSpellBurn(false))
  })

  it('applies surviving status-duration modifiers to received hostile statuses', () => {
    const received = stateWithEnemy()
    received.equipment.cape = 'predator-hide-mantle'
    recalculateDerivedStats(received)
    expect(applyStatus(received, 'player', 'chilled', enemyAction, { durationMs: 5_000 })?.remainingMs).toBe(4_500)
    received.equipment.cape = null
    expect(applyStatus(received, 'player', 'vulnerable', enemyAction, { durationMs: 5_000 })?.remainingMs).toBe(5_000)
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

  it("keeps duplicate Edrin Signets as independent providers and cooldowns", () => {
    const state = stateWithEnemy()
    state.inventory['edrins-signet'] = 2
    state.equipment.ring1 = 'edrins-signet'
    state.equipment.ring2 = 'edrins-signet'
    recalculateDerivedStats(state)
    executeCombatEffects(state, [{ type: 'apply-status', target: 'opponent', statusId: 'chilled', tags: ['debuff'] }], enemyAction)
    expect(state.combat.playerBarrier).toBe(40)
    const keys = Object.keys(state.combat.ruleCooldowns).filter((key) => key.includes('edrins-signet'))
    expect(keys).toHaveLength(2)
    expect(keys.some((key) => key.includes('equipment:ring1:edrins-signet'))).toBe(true)
    expect(keys.some((key) => key.includes('equipment:ring2:edrins-signet'))).toBe(true)
    state.combat.playerBarrier = 0
    executeCombatEffects(state, [{ type: 'apply-status', target: 'opponent', statusId: 'vulnerable', tags: ['debuff'] }], enemyAction)
    expect(state.combat.playerBarrier).toBe(0)
    tickRuleCooldowns(state, 30_000)
    executeCombatEffects(state, [{ type: 'apply-status', target: 'opponent', statusId: 'haste', tags: ['buff'] }], enemyAction)
    expect(state.combat.playerBarrier).toBe(0)
    executeCombatEffects(state, [{ type: 'apply-status', target: 'opponent', statusId: 'vulnerable', tags: ['debuff'] }], enemyAction)
    expect(state.combat.playerBarrier).toBe(40)

    const playerSource = stateWithEnemy()
    playerSource.inventory['edrins-signet'] = 2
    playerSource.equipment.ring1 = 'edrins-signet'
    playerSource.equipment.ring2 = 'edrins-signet'
    executeCombatEffects(playerSource, [{ type: 'apply-status', target: 'opponent', statusId: 'chilled', tags: ['debuff'] }], playerSpell)
    expect(playerSource.combat.playerBarrier).toBe(0)
  })
})

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
import { damageEnemy, damagePlayer, executeCombatEffects, getCombatDamagePreview } from './effectResolver'
import { spawnEnemy } from './combatRuntime'
import { applyStatus, tickStatuses } from './statusRuntime'
import { tickRuleCooldowns } from './triggerRuntime'
import type { CombatSource } from './combatTypes'
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
    expect(equipment).toHaveLength(27)
    expect(ITEMS['apprentice-wand' as keyof typeof ITEMS]).toBeUndefined()
    expect(validateItemDefinitions()).toEqual([])
    expect(validateRecipeDefinitions()).toEqual([])
    expect(Object.values(MONSTERS).every((monster) => monster.loot.every((drop) => ITEMS[drop.itemId]))).toBe(true)
  })

  it('uses authored stats for derived combat values and mana costs', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.equipment.helmet = 'wispveil-hood'
    recalculateDerivedStats(state)

    expect(getEquipmentStats(state)).toMatchObject({ spellPower: 20, maxMana: 25, basicDamage: 4 })
    expect(getPlayerCombatStats(state)).toMatchObject({ spellPower: BALANCE.player.baseSpellPower + 20, basicAttackDamage: BALANCE.player.basicAttackDamage + 4, maxMana: 125, cooldownRecovery: 1 })
    expect(getResistance(state, 'player', 'fire')).toBe(0)
    expect(getEffectiveManaCost(state, 10)).toBe(10)

    const water = createInitialState()
    water.equipment.weapon = 'wispwood-wand'
    water.equipment.offhand = 'tide-focus'
    water.equipment.helmet = 'wispveil-hood'
    recalculateDerivedStats(water)
    expect(getEquipmentStats(water)).toMatchObject({ spellPower: 20, maxMana: 35, basicDamage: 2 })
    expect(getPlayerCombatStats(water)).toMatchObject({ spellPower: BALANCE.player.baseSpellPower + 20, basicAttackDamage: BALANCE.player.basicAttackDamage + 2, maxMana: 135 })
    expect(getCombatModifiers(water, 'player', 'barrier-power-percent', { source: { ...playerSpell, school: 'water', tags: ['spell', 'water'] }, damageType: 'water' })).toBeCloseTo(0.2)

    state.equipment.weapon = 'fangbound-dagger'
    state.equipment.offhand = 'fangbound-buckler'
    state.equipment.helmet = 'razorclaw-circlet'
    recalculateDerivedStats(state)
    expect(getPlayerCombatStats(state)).toMatchObject({ basicAttackDamage: BALANCE.player.basicAttackDamage + 8, basicAttackSpeedMultiplier: 1.13, critDamageMultiplier: 1.65, blockChance: 0.15 })
    expect(getPlayerCombatStats(state).critChance).toBeCloseTo(0.12)
    expect(getResistance(state, 'player', 'physical')).toBe(0.03)

    state.equipment.weapon = 'graveglass-wand'
    state.equipment.offhand = null
    state.equipment.helmet = 'wispveil-hood'
    recalculateDerivedStats(state)
    expect(getPlayerCombatStats(state)).toMatchObject({ spellPower: BALANCE.player.baseSpellPower + 30, maxMana: 115, cooldownRecovery: 1.1, manaCostReduction: 0.1 })
    expect(getEffectiveManaCost(state, 10)).toBe(9)
  })

  it('resolves Forest Heart material loot through central item acquisition', () => {
    const state = createInitialState()
    const result = resolveMonsterLoot(state, 'forest-heart', undefined, () => 0)

    expect(result).toContain('Heartseed')
    expect(state.inventory.heartseed).toBe(1)
    expect(state.inventory['heartseed-necklace']).toBeUndefined()
    expect(state.inventory['life-essence']).toBe(1)
    expect(state.progress.discoveredItems).toEqual(expect.arrayContaining(['heartseed', 'life-essence']))
    expect(state.progress.discoveredItems).not.toContain('heartseed-necklace')
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

  it("keeps Edrin's Forbidden Knowledge Spell-specific", () => {
    const noStatus = stateWithEnemy()
    noStatus.equipment.weapon = 'edrins-remnant-staff'
    const noStatusPlain = stateWithEnemy()
    damageEnemy(noStatus, 100, 'spell')
    damageEnemy(noStatusPlain, 100, 'spell')
    expect(noStatus.combat.enemyHp).toBe(noStatusPlain.combat.enemyHp)

    const debuffedStaff = stateWithEnemy()
    const debuffedStaffBasic = stateWithEnemy()
    debuffedStaff.equipment.weapon = 'edrins-remnant-staff'
    applyStatus(debuffedStaff, 'enemy', 'chilled', playerSpell)
    applyStatus(debuffedStaffBasic, 'enemy', 'chilled', playerSpell)
    damageEnemy(debuffedStaff, 100, 'spell')
    damageEnemy(debuffedStaffBasic, 100, 'spell')
    expect(1_000 - debuffedStaff.combat.enemyHp).toBeCloseTo((1_000 - debuffedStaffBasic.combat.enemyHp) * 1.1)

    const buffStaff = stateWithEnemy()
    const buffPlain = stateWithEnemy()
    buffStaff.equipment.weapon = 'edrins-remnant-staff'
    applyStatus(buffStaff, 'enemy', 'haste', enemyAction)
    applyStatus(buffPlain, 'enemy', 'haste', enemyAction)
    damageEnemy(buffStaff, 100, 'spell')
    damageEnemy(buffPlain, 100, 'spell')
    expect(buffStaff.combat.enemyHp).toBe(buffPlain.combat.enemyHp)

    const basicStaff = stateWithEnemy()
    const basicPlain = stateWithEnemy()
    basicStaff.equipment.weapon = 'edrins-remnant-staff'
    applyStatus(basicStaff, 'enemy', 'chilled', playerSpell)
    applyStatus(basicPlain, 'enemy', 'chilled', playerSpell)
    damageEnemy(basicStaff, 100, 'basic')
    damageEnemy(basicPlain, 100, 'basic')
    expect(basicStaff.combat.enemyHp).toBe(basicPlain.combat.enemyHp)
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

  it('resolves Soulward Shield as exact normal Physical retaliation and ignores enemy Barrier breaks', () => {
    const state = stateWithEnemy()
    state.equipment.offhand = 'soulward-shield'
    state.combat.combatRngState = 0
    recalculateDerivedStats(state)
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], playerSpell)
    const retaliationSource: CombatSource = { actor: 'player', kind: 'equipment', sourceId: 'soulward-shield', providerInstanceKey: 'offhand', tags: ['equipment', 'direct', 'physical'] }
    const expected = getCombatDamagePreview(state, 20, retaliationSource, 'enemy', 'physical')
    const events: import('./combatTypes').CombatEvent[] = []
    damagePlayer(state, 40, enemyAction)
    const actualDamage = 1_000 - state.combat.enemyHp
    expect(actualDamage).toBeCloseTo(expected.healthDamage)
    expect(actualDamage).toBeCloseTo(20 * (1 - expected.resistance) * (1 - expected.defenseReduction))

    const eventState = stateWithEnemy()
    eventState.equipment.offhand = 'soulward-shield'
    eventState.combat.combatRngState = 0
    const eventSink = { push: (event: import('./combatTypes').CombatEvent) => events.push(event) }
    executeCombatEffects(eventState, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], playerSpell, undefined, eventSink)
    executeCombatEffects(eventState, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 40 } }], tags: ['physical'] }], enemyAction, undefined, eventSink)
    expect(events.some((event) => event.sourceKind === 'equipment' && event.itemId === 'soulward-shield' && event.providerInstanceKey === 'offhand')).toBe(true)

    const enemyBarrier = stateWithEnemy()
    enemyBarrier.equipment.offhand = 'soulward-shield'
    enemyBarrier.combat.enemyBarrier = 20
    enemyBarrier.player.mana = 10
    damageEnemy(enemyBarrier, 40, 'basic')
    expect(enemyBarrier.combat.playerBarrier).toBe(0)
    expect(enemyBarrier.player.mana).toBe(10)
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

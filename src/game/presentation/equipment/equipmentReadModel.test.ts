import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getEquipmentKeyChanges, getEquipmentLoadoutIdentity, getEquipmentPreview, getEquipmentStatSnapshot, resolveEquipmentPreviewTarget } from './equipmentReadModel'
import { getDefenseReductionFromRating, getPlayerSheetCombatStats } from '../../systems/combat/combatStats'
import { BALANCE } from '../../core/balance/balance'

describe('Equipment read model', () => {
  it('uses authored sheet inputs without borrowing transient encounter state', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.equipment.weapon = 'ember-staff'
    const sheet = getEquipmentStatSnapshot(state, state.equipment)
    const combatState = { ...state, combat: { ...state.combat, active: true, dungeonId: 'whispering-woods' as const, enemyId: 'forest-wisp' as const, enemyHp: 1, enemyMaxHp: 44 } }
    expect(getEquipmentStatSnapshot(combatState, combatState.equipment)).toEqual(sheet)
  })

  it('reports central evaluator failures and keeps incompatible explicit targets out', () => {
    const state = createInitialState()
    expect(getEquipmentPreview(state, 'ember-staff')).toMatchObject({ compatible: false, failureReason: 'not-owned' })
    state.inventory['wispweave-robe'] = 1
    expect(resolveEquipmentPreviewTarget({ itemId: 'wispweave-robe', selectedPosition: 'weapon', equipment: state.equipment })).toBe('armor')
    expect(getEquipmentPreview(state, 'wispweave-robe', 'armor')).toMatchObject({ compatible: true, position: 'armor' })
  })

  it('projects Artifact mechanics and returns compact build identity', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = { minorRanks: { 'flame-impact': 2 } }
    expect(getEquipmentStatSnapshot(state, state.equipment).fireSpellDamage).toBeCloseTo(0.005)
    expect(getEquipmentLoadoutIdentity('ember-staff')).toEqual(['FIRE', 'DOT'])
    expect(getEquipmentLoadoutIdentity('tideglass-wand')).toEqual(['WATER', 'HEALING'])
  })

  it('projects representative equipped Crystal stats through the shared Wizard sheet', () => {
    const state = createInitialState()
    state.crystals.equippedSlots = ['cataclysm-t1', 'renewal-t1', 'current-t1', 'bulwark-t1', ...state.crystals.equippedSlots.slice(4)]
    const withoutCrystals = createInitialState()
    const sheet = getPlayerSheetCombatStats(state)
    const snapshot = getEquipmentStatSnapshot(state, state.equipment)
    const baseline = getEquipmentStatSnapshot(withoutCrystals, withoutCrystals.equipment)

    expect(sheet.spellPower).toBe(BALANCE.player.baseSpellPower + 7)
    expect(snapshot.spellPower).toBe(baseline.spellPower + 7)
    expect(snapshot.healthRegen).toBe(baseline.healthRegen + 0.7)
    expect(snapshot.manaRegen).toBe(baseline.manaRegen + 1)
    expect(snapshot.critDamageMultiplier).toBe(baseline.critDamageMultiplier + 0.04)
    expect(snapshot.defense).toBe(BALANCE.player.baseDefense + 12)
    expect(snapshot.damageReduction).toBeCloseTo(getDefenseReductionFromRating(BALANCE.player.baseDefense + 12))
  })

  it('keeps Crystal contribution in both sides of an Equipment preview', () => {
    const state = createInitialState()
    state.crystals.equippedSlots[0] = 'cataclysm-t1'
    state.inventory['tideglass-wand'] = 1

    const preview = getEquipmentPreview(state, 'tideglass-wand')

    expect(preview.compatible).toBe(true)
    expect(preview.current.spellPower).toBe(BALANCE.player.baseSpellPower + 7)
    expect(preview.preview?.spellPower).toBe(BALANCE.player.baseSpellPower + 7 + 15)
    expect(preview.impact.spellPower).toBe(15)
    expect(preview.current.defense).toBe(preview.preview?.defense)
    expect(preview.current.critDamageMultiplier).toBe(preview.preview?.critDamageMultiplier)
  })

  it('ranks compact key changes from preview impact', () => {
    const changes = getEquipmentKeyChanges({ maxHealth: 10, spellPower: 17, maxMana: -42, defense: 3, critChance: 0.04 })
    expect(changes.map(({ key }) => key)).toEqual(['maxHealth', 'spellPower', 'maxMana', 'defense', 'critChance'])
    expect(changes[1]).toMatchObject({ label: 'Spell Power', formatted: '+17', direction: 'increase' })
  })
})

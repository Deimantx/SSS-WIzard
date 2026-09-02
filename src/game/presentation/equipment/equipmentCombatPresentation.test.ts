import { describe, expect, it } from 'vitest'
import { ITEMS } from '../../content/items/items'
import { getEquipmentCombatPresentation } from './equipmentCombatPresentation'

describe('equipment combat presentation', () => {
  it('translates authored filtered modifiers into readable player language', () => {
    expect(getEquipmentCombatPresentation(ITEMS['ember-staff']).modifiers).toContain('+20% Fire Spell Damage')
    expect(getEquipmentCombatPresentation(ITEMS['tide-focus']).modifiers).toContain('+20% Barrier Power from Water Spells')
    expect(getEquipmentCombatPresentation(ITEMS['stoneweave-robe']).modifiers).toContain('+10 Barrier Received')
  })

  it('presents trigger chance, effect and cooldown without exposing engine keys', () => {
    const presentation = getEquipmentCombatPresentation({ combat: { rules: [{ id: 'barrier-proc', event: 'on-damage-dealt', chance: 0.2, cooldownMs: 5_000, condition: { type: 'self-hp-below-percent', percent: 40 }, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 } }] }] } })
    expect(presentation.rules[0]).toMatchObject({ trigger: '20% chance on Damage Dealt', condition: 'While below 40% Health', effects: ['Gain 40 Barrier'], cooldown: 'Cooldown: 5s' })
    expect(presentation.rules[0].summary).toContain('Gain 40 Barrier')
    expect(presentation.rules[0].summary).not.toContain('on-damage-dealt')
  })
})

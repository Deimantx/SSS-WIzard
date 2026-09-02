import { describe, expect, it } from 'vitest'
import { ITEMS } from '../../content/items/items'
import type { ItemDefinition } from '../../types'
import { getEquipmentCombatPresentation } from './equipmentCombatPresentation'

describe('equipment combat presentation', () => {
  it('translates authored filtered modifiers into readable player language', () => {
    expect(getEquipmentCombatPresentation(ITEMS['ember-staff']).modifiers).toContain('+20% Fire Spell Damage')
    expect(getEquipmentCombatPresentation(ITEMS['tide-focus']).modifiers).toContain('+20% Barrier Power from Water Spells')
    expect(getEquipmentCombatPresentation(ITEMS['stoneweave-robe']).modifiers).toContain('+10 Barrier Received')
  })

  it('presents trigger chance, effect and cooldown without exposing engine keys', () => {
    const presentation = getEquipmentCombatPresentation({ combat: { rules: [{ id: 'barrier-proc', event: 'on-damage-dealt', chance: 0.2, cooldownMs: 5_000, condition: { type: 'self-hp-below-percent', percent: 40 }, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 } }] }] } })
    expect(presentation.rules[0]).toMatchObject({ trigger: '20% chance on Damage Dealt', condition: 'While below 40% Health', effects: ['Gain 40 Barrier'], cooldown: 'Cooldown: 5.0s' })
    expect(presentation.rules[0].summary).toContain('Gain 40 Barrier')
    expect(presentation.rules[0].summary).not.toContain('on-damage-dealt')
  })

  it('shows custom periodic potency and Chilled modifier overrides', () => {
    const combat = {
      rules: [{
        id: 'custom-burning',
        event: 'on-spell-hit',
        effects: [{
          type: 'apply-status',
          target: 'opponent',
          statusId: 'burning',
          durationMs: 6_000,
          statusSourceKey: 'internal-only-key',
          periodicEffects: [{ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'spell-power', coefficient: 0.2 } }], tags: ['dot', 'fire'] }],
        }],
      }, {
        id: 'custom-chilled',
        event: 'on-spell-hit',
        effects: [{ type: 'apply-status', target: 'opponent', statusId: 'chilled', durationMs: 4_000, stacks: 1, modifierOverrides: { 'basic-attack-speed-percent': -0.3, 'action-speed-percent': -0.3 } }],
      }],
    } satisfies NonNullable<ItemDefinition['combat']>
    const presentation = getEquipmentCombatPresentation({ combat })
    expect(presentation.rules[0].effects).toEqual(expect.arrayContaining(['Apply Burning for 6.0s', '120% Spell Power total Fire damage']))
    expect(presentation.rules[1].effects).toEqual(expect.arrayContaining(['Apply Chilled for 4.0s (1 stack)', '-30% Basic Attack Speed', '-30% Action Speed']))
    expect(presentation.rules.flatMap((rule) => rule.effects).join(' ')).not.toContain('internal-only-key')
  })

  it('formats effect time in seconds and preserves fractional percentages', () => {
    const presentation = getEquipmentCombatPresentation({ combat: {
      modifiers: [{ key: 'damage-dealt-percent', value: 0.125 }],
      rules: [{ id: 'timing', event: 'on-spell-hit', cooldownMs: 2_500, effects: [
        { type: 'modify-action-timer', target: 'self', action: 'basic-attack', amountMs: 1_000 },
        { type: 'modify-cooldown', target: 'self', spellId: 'fire-bolt', amountMs: -2_500 },
      ] }],
    } })
    const text = [...presentation.modifiers, ...presentation.rules.flatMap((rule) => [...rule.effects, rule.cooldown ?? ''])].join(' ')
    expect(text).toContain('+12.5% Damage Dealt')
    expect(text).toContain('Delay Basic Attack by 1.0s')
    expect(text).toContain('Reduce Fire Bolt cooldown by 2.5s')
    expect(text).not.toMatch(/\b(?:1000|2500)ms\b/)
  })
})

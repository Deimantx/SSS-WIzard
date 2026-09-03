import { describe, expect, it } from 'vitest'
import { buildBalancingDocuments, buildEnemyCoreRow, buildEnemyLootRows, buildEquipmentStatRow } from './buildBalancingDocuments'

describe('sheet-first balancing workbook', () => {
  it('uses fixed enemy and equipment sheet schemas', () => {
    const balancing = buildBalancingDocuments()
    const enemy = balancing.docs.get('Enemies/Whispering_Woods.md') ?? ''
    const equipment = balancing.docs.get('Items/Equipment_Whispering_Woods.md') ?? ''

    expect(enemy).toContain('| Enemy | Type | HP | Basic Dmg | Attack | DEF | Crit | Crit Dmg | Block | Phys Res | Arc Res | Fire Res | Water Res | Earth Res | Air Res | Damage Immune | Status Immune |')
    expect(equipment).toContain('| Item | Slot | Hands | HP | Mana | Mana Regen | Focus | Spell Power | Basic Dmg | Basic AS | Crit | Crit Dmg | DEF | Block | Phys Res | Arc Res | Fire Res | Water Res | Earth Res | Air Res | CDR | Mana Cost | Status Dur | Neg Status Dur | Healing | Barrier | DoT | Fire Spell | Water Spell | Earth Spell | Air Spell | Special Effect | Sell |')
    expect(enemy).toContain('## Traits & Patterns')
    expect(enemy).toContain('## Special Actions')
    expect(enemy).toContain('## Loot')
    expect(enemy).not.toContain('## Enemy details')
    expect(equipment).not.toContain('## Ember Staff')
  })

  it('keeps representative runtime values exact in generated rows', () => {
    expect(buildEnemyCoreRow('forest-wisp')).toEqual(['Forest Wisp (forest-wisp)', 'Normal', '44', '5', '2.8 s', '10', '5%', '150%', '0%', '0%', '0%', '0%', '0%', '0%', '0%', '—', '—'])

    const emberStaff = buildEquipmentStatRow('ember-staff')
    expect(emberStaff).toContain('+10')
    expect(emberStaff).toContain('+20')
    expect(emberStaff).toContain('+4')
    expect(emberStaff).toContain('+20% Spell damage for Fire damage')

    expect(buildEnemyLootRows(['cavefang-wolf'])[0]).toEqual(['Cavefang Wolf (cavefang-wolf)', 'Predator Fang (predator-fang)', '1', '1', '55%', '0.55'])
  })

  it('separates recipe ingredient names and quantities and removes runtime dumps', () => {
    const balancing = buildBalancingDocuments()
    const recipes = balancing.docs.get('Transmutation/Recipes.md') ?? ''

    expect(recipes).toContain('| Recipe | Output Qty | Time | Mana | Ingredient 1 | Qty 1 | Ingredient 2 | Qty 2 | Ingredient 3 | Qty 3 | Ingredient 4 | Qty 4 | Ingredient 5 | Qty 5 | Unlock |')
    expect(recipes).toContain('Ember Staff (ember-staff)')
    expect(recipes).toContain('Fire Fragment (fire-fragment) | 4')
    expect(recipes).toContain('Wisp Essence (wisp-essence) | 4')
    expect(recipes).toContain('Defeat Grove Sentinel')
    expect(recipes).not.toContain('<br>')
    expect(recipes).not.toContain('"event"')
  })
})

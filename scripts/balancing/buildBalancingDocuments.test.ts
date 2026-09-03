import { describe, expect, it } from 'vitest'
import { buildBalancingDocuments, buildEnemyCoreRow, buildEnemyLootRows, buildEquipmentStatRow, buildSchoolXpRows } from './buildBalancingDocuments'

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
    expect(equipment).not.toContain('## Direct Drops')
  })

  it('keeps representative runtime values exact in generated rows', () => {
    const core = buildEnemyCoreRow('forest-wisp')
    expect(core.slice(0, 15)).toEqual(['Forest Wisp (forest-wisp)', 'Normal', '44', '5', '2.8 s', '10', '5%', '150%', '0%', '0%', '0%', '0%', '0%', '0%', '0%'])
    expect(core).toHaveLength(17)
    const emberStaff = buildEquipmentStatRow('ember-staff')
    expect(emberStaff).toContain('+10')
    expect(emberStaff).toContain('+20')
    expect(emberStaff).toContain('+4')
    expect(emberStaff).toContain('+20% Spell damage for Fire damage')
    expect(buildEnemyLootRows(['cavefang-wolf'])[0]).toEqual(['Cavefang Wolf (cavefang-wolf)', 'Predator Fang (predator-fang)', '1', '1', '55%', '0.55'])
  })

  it('separates recipe ingredient names and quantities and removes runtime dumps', () => {
    const recipes = buildBalancingDocuments().docs.get('Transmutation/Recipes.md') ?? ''
    expect(recipes).toContain('| Recipe | Output Qty | Time | Mana | Ingredient 1 | Qty 1 | Ingredient 2 | Qty 2 | Ingredient 3 | Qty 3 | Ingredient 4 | Qty 4 | Ingredient 5 | Qty 5 | Unlock |')
    expect(recipes).toContain('Ember Staff (ember-staff)')
    expect(recipes).toContain('Fire Fragment (fire-fragment) | 4')
    expect(recipes).toContain('Wisp Essence (wisp-essence) | 4')
    expect(recipes).toContain('Defeat Grove Sentinel')
    expect(recipes).toContain('Heartseed Necklace (heartseed-necklace)')
    expect(recipes).toContain('Heartseed (heartseed) | 20')
    expect(recipes).toContain('Greatbear Heartstone (greatbear-heartstone)')
    expect(recipes).toContain('Greatbear Core (greatbear-core) | 7')
    expect(recipes).toContain("Edrin's Signet (edrins-signet)")
    expect(recipes).toContain('Edrin Remnant (edrin-remnant) | 7')
    expect(recipes).not.toContain('<br>')
    expect(recipes).not.toContain('"event"')
  })

  it('documents signature crafting without direct Equipment loot', () => {
    const balancing = buildBalancingDocuments()
    const bossRelics = balancing.docs.get('Items/Boss_Relics.md') ?? ''
    const bossDrops = balancing.docs.get('Loot/Boss_Drops.md') ?? ''
    const equipment = balancing.docs.get('Items/Equipment_Whispering_Woods.md') ?? ''
    expect(balancing.invariants).toEqual({ recipes: 32, equipment: 27, equipmentRecipeCoverage: 27, directEquipmentLoot: 0 })
    expect(bossRelics).toContain('# Boss-signature equipment')
    expect(bossRelics).toContain('Heartseed Necklace (heartseed-necklace)')
    expect(bossRelics).toContain('Heartseed (heartseed)')
    expect(bossRelics).toContain('20')
    expect(bossRelics).toContain('10 s')
    expect(bossDrops).not.toContain('heartseed-necklace')
    expect(bossDrops).not.toContain('greatbear-heartstone')
    expect(bossDrops).not.toContain('edrins-signet')
    expect(equipment).toContain('Heartseed Necklace (heartseed-necklace)')
    expect(equipment).toContain('Heartseed (heartseed) | 20')
  })

  it('exports School XP and material tiers in human-readable balancing sheets', () => {
    const rows = buildSchoolXpRows()
    expect(rows[0]).toEqual([1, '100', '0'])
    expect(rows[1]).toEqual([2, '140', '100'])
    expect(rows[7]).toEqual([8, '770', '2,070'])
    expect(rows[19]).toEqual([20, '4,820', '29,870'])
    expect(rows[39][1]).toContain('CAP')
    expect(rows[39][2]).toBe('252,310')
    const balancing = buildBalancingDocuments()
    const sheet = balancing.docs.get('Progression/Magic_School_XP.md') ?? ''
    const materials = balancing.docs.get('Items/Materials.md') ?? ''
    expect(sheet).toContain('| Level | XP to Next Level | Total XP to Reach This Level |')
    expect(sheet).toContain('| 8 | 770 | 2,070 |')
    expect(sheet).toContain('| 20 | 4,820 | 29,870 |')
    expect(sheet).toContain('252,310')
    expect(materials).toContain('| Material | Type | Material Tier | Dungeon / Tier |')
    expect(materials).toContain('| Fire Fragment (fire-fragment) | Elemental | T1 |')
  })
})

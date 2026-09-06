import { describe, expect, it } from 'vitest'
import { buildBalancingDocuments } from './buildBalancingDocuments'

describe('canonical balancing workbook', () => {
  it('emits the v2 one-page domain structure', () => {
    const balancing = buildBalancingDocuments()
    expect([...balancing.docs.keys()]).toEqual(expect.arrayContaining(['README.md', 'BALANCE_OVERVIEW.md', 'Combat/Combat.md', 'Dungeons/Whispering_Woods.md', 'Dungeons/Howling_Den.md', 'Dungeons/Abandoned_Catacombs.md', 'Items/Items.md', 'Crafting/Crafting.md', 'Magic/Magic.md', 'Progression/Channeling.md', 'Progression/Research.md', 'Progression/Focus.md', 'Progression/Guild_And_Unlocks.md', 'Economy/Economy.md']))
    expect(balancing.docs.has('Transmutation/Recipes.md')).toBe(false)
    expect(balancing.docs.has('Items/Equipment_Whispering_Woods.md')).toBe(false)
  })

  it('keeps recipe ingredients normalized and tables compact', () => {
    const crafting = buildBalancingDocuments().docs.get('Crafting/Crafting.md') ?? ''
    expect(crafting).toContain('| Recipe | Ingredient | Qty |')
    expect(crafting).toContain('Ember Staff (ember-staff)')
    expect(crafting).not.toContain('Ingredient 1')
    expect(crafting).not.toContain('<br>')
    expect(crafting).not.toContain('"event"')
  })

  it('keeps acquisition invariants and stable IDs represented', () => {
    const balancing = buildBalancingDocuments()
    expect(balancing.invariants).toEqual({ recipes: 32, equipment: 27, equipmentRecipeCoverage: 27, directEquipmentLoot: 0 })
    for (const registry of Object.values(balancing.registries)) {
      const text = registry.documents.map((path) => balancing.docs.get(path) ?? '').join('\n')
      for (const id of registry.ids) expect(text).toContain(id)
    }
  })
})

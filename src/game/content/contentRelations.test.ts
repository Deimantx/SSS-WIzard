import { describe, expect, it } from 'vitest'
import { getItemRecipeUses, getItemSourceInfo, getMonsterDungeon } from './contentRelations'

describe('content relations', () => {
  it('derives equipment origin and transmutation output from authored registries', () => {
    const info = getItemSourceInfo('ember-staff')
    expect(info.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'dungeon', id: 'whispering-woods' }),
      expect.objectContaining({ kind: 'recipe', id: 'ember-staff' }),
    ]))
  })

  it('derives monster loot sources without parsing display source text', () => {
    const info = getItemSourceInfo('predator-fang')
    expect(info.relations.filter((relation) => relation.kind === 'monster').map((relation) => relation.id)).toEqual(expect.arrayContaining(['cavefang-wolf', 'razorclaw-lynx', 'corrupted-dire-wolf']))
    expect(getMonsterDungeon('corrupted-greatbear')).toMatchObject({ dungeonId: 'howling-den', role: 'boss' })
  })

  it('returns every recipe that consumes an item', () => {
    expect(getItemRecipeUses('fire-fragment').map((recipe) => recipe.id)).toEqual(expect.arrayContaining(['prismatic-fragment', 'ember-staff']))
  })
})

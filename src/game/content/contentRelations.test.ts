import { describe, expect, it } from 'vitest'
import { getItemRecipeUses, getItemSourceInfo, getMonsterDungeon } from './contentRelations'

describe('content relations', () => {
  it('keeps Artifact recipe origin separate from dungeon Equipment origin', () => {
    const info = getItemSourceInfo('ember-staff')
    expect(info.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'recipe', id: 'ember-staff' }),
    ]))
    expect(info.relations.some((relation) => relation.kind === 'dungeon')).toBe(false)
    expect(info.relations.some((relation) => relation.kind === 'monster')).toBe(false)
  })

  it('derives monster loot sources without parsing display source text', () => {
    const info = getItemSourceInfo('wispglass-earring')
    expect(info.relations).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'dungeon', id: 'whispering-woods' })]))
    expect(info.relations.filter((relation) => relation.kind === 'monster').map((relation) => relation.id)).toEqual(expect.arrayContaining(['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel', 'forest-heart']))
    expect(getItemSourceInfo('heartseed-necklace').relations.filter((relation) => relation.kind === 'monster').map((relation) => relation.id)).toEqual(['forest-heart'])
    expect(getMonsterDungeon('corrupted-greatbear')).toMatchObject({ dungeonId: 'howling-den', role: 'boss' })
  })

  it('returns every recipe that consumes an item', () => {
    expect(getItemRecipeUses('fire-fragment').map((recipe) => recipe.id)).toEqual(expect.arrayContaining(['prismatic-fragment', 'ember-staff']))
  })
})

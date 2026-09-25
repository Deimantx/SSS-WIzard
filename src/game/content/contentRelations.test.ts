import { describe, expect, it } from 'vitest'
import { getItemRecipeUses, getItemSourceInfo, getMonsterDungeon } from './contentRelations'

describe('content relations', () => {
  it('keeps Artifact recipe origin separate from dungeon loot origin', () => {
    const info = getItemSourceInfo('ember-staff')
    expect(info.relations).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'recipe', id: 'ember-staff' })]))
    expect(info.relations.some((relation) => relation.kind === 'dungeon' || relation.kind === 'monster')).toBe(false)
  })

  it('keeps universal combat currencies out of authored monster source relations', () => {
    const info = getItemSourceInfo('artifact-essence')
    expect(info.relations.filter((relation) => relation.kind === 'monster')).toEqual([])
    expect(info.authoredSource).toContain('Combat')
    expect(getMonsterDungeon('grove-sentinel')).toMatchObject({ dungeonId: 'whispering-woods', role: 'normal' })
    expect(getMonsterDungeon('corrupted-greatbear')).toMatchObject({ dungeonId: 'howling-den', role: 'boss' })
  })

  it('returns every recipe that consumes an item', () => {
    expect(getItemRecipeUses('fire-fragment').map((recipe) => recipe.id)).toEqual(expect.arrayContaining(['prismatic-fragment', 'ember-staff']))
  })
})

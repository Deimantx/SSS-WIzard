import { describe, expect, it } from 'vitest'
import { getItemRecipeUses, getItemSourceInfo, getMonsterCombatLocation } from './contentRelations'

describe('content relations', () => {
  it('uses Artificing recipes as the Artifact Equipment origin', () => {
    const info = getItemSourceInfo('ember-staff')
    expect(info.relations).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'recipe', id: 'ember-staff' })]))
    expect(info.relations.some((relation) => relation.kind === 'monster')).toBe(false)
  })

  it('keeps universal combat currencies out of authored monster source relations', () => {
    const info = getItemSourceInfo('artifact-essence')
    expect(info.relations.filter((relation) => relation.kind === 'monster')).toEqual([])
    expect(info.authoredSource).toContain('Combat')
    expect(getMonsterCombatLocation('grove-sentinel')).toMatchObject({ locationId: 'whispering-woods', role: 'normal' })
    expect(getMonsterCombatLocation('corrupted-greatbear')).toMatchObject({ locationId: 'howling-den', role: 'boss' })
    expect(getMonsterCombatLocation('thorn-maw')).toMatchObject({ locationId: 'whispering-woods', role: 'normal' })
    expect(getMonsterCombatLocation('deep-bell-saint')).toMatchObject({ locationId: 'black-gate', role: 'boss' })
    expect(getMonsterCombatLocation('sepulcher-flamekeeper')).toMatchObject({ locationId: 'broken-meridian', role: 'boss' })
  })

  it('returns every recipe that consumes an item', () => {
    expect(getItemRecipeUses('fire-fragment').map((recipe) => recipe.id)).toEqual(expect.arrayContaining(['prismatic-fragment', 'ember-staff']))
  })
})

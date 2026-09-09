import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { getArtificingEquipmentPreview, getArtificingOutputInspection } from './artificingEquipmentReadModel'

describe('Artificing output read model', () => {

  it('uses the real equipment preview for a Weapon output', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['prismatic-focus'] = 1
    state.equipment.weapon = 'prismatic-focus'
    const inspection = getArtificingOutputInspection(state, ARTIFICING_RECIPES['ember-staff'])
    const preview = getArtificingEquipmentPreview(state, inspection.itemId)
    expect(inspection.equipment).toEqual({ slot: 'weapon' })
    expect(preview.compatible).toBe(true)
    expect('removedOffhand' in preview).toBe(false)
  })

  it('uses Level 1 effective stats for an unowned Artifact forge result', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = { level: 4, allocatedNodeIds: [], attunedNodeIds: [] }
    state.artifactProgress['prismatic-focus'] = { level: 10, allocatedNodeIds: [], attunedNodeIds: [] }

    const inspection = getArtificingOutputInspection(state, ARTIFICING_RECIPES['prismatic-focus'])
    const preview = getArtificingEquipmentPreview(state, inspection.itemId, 'weapon')

    expect(inspection).toMatchObject({
      itemId: 'prismatic-focus',
      owned: 0,
      stats: { basicDamage: 2, spellPower: 11, maxMana: 10, maxFocus: 2 },
      artifactLevel: 1,
      artifactMaxLevel: 10,
    })
    expect(preview.compatible).toBe(true)
    expect(preview.impact).toMatchObject({ basicDamage: -6, spellPower: -18, maxMana: 10, maxFocus: 2 })
  })
})

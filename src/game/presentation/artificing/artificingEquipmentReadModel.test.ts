import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ARTIFICING_RECIPES } from '../../content/recipes/artificingRecipes'
import { getArtificingEquipmentPreview, getArtificingOutputInspection } from './artificingEquipmentReadModel'

describe('Artificing output read model', () => {

  it('uses the real equipment preview for a Weapon output', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['tideglass-wand'] = 1
    state.equipment.weapon = 'tideglass-wand'
    const inspection = getArtificingOutputInspection(state, ARTIFICING_RECIPES['ember-staff'])
    const preview = getArtificingEquipmentPreview(state, inspection.itemId)
    expect(inspection.equipment).toEqual({ slot: 'weapon' })
    expect(preview.compatible).toBe(true)
    expect('removedOffhand' in preview).toBe(false)
  })

  it('uses Level 1 effective stats for an unowned Artifact forge result', () => {
    const state = createInitialState()
    state.equipment.weapon = 'tideglass-wand'
    state.artifactProgress['tideglass-wand'] = { level: 4, allocatedNodeIds: [], attunedNodeIds: [] }

    const inspection = getArtificingOutputInspection(state, ARTIFICING_RECIPES['ember-staff'])
    const preview = getArtificingEquipmentPreview(state, inspection.itemId, 'weapon')

    expect(inspection).toMatchObject({
      itemId: 'ember-staff',
      owned: 0,
      stats: { basicDamage: 5, spellPower: 16 },
      artifactLevel: 1,
      artifactMaxLevel: 10,
    })
    expect(preview.compatible).toBe(true)
    expect(preview.impact).toMatchObject({ basicDamage: -3, spellPower: -12 })
  })
})

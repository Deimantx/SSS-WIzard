import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { RECIPES } from '../../content/recipes/recipes'
import { getArtificingEquipmentPreview, getArtificingOutputInspection } from './artificingEquipmentReadModel'

describe('Artificing output read model', () => {

  it('uses the real equipment preview for a Weapon output', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['prismatic-focus'] = 1
    state.equipment.weapon = 'prismatic-focus'
    const inspection = getArtificingOutputInspection(state, RECIPES['ember-staff'])
    const preview = getArtificingEquipmentPreview(state, inspection.itemId)
    expect(inspection.equipment).toEqual({ slot: 'weapon' })
    expect(preview.compatible).toBe(true)
    expect('removedOffhand' in preview).toBe(false)
  })
})

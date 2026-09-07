import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { RECIPES } from '../../content/recipes/recipes'
import { getArtificingEquipmentPreview, getArtificingOutputInspection } from './artificingEquipmentReadModel'

describe('Artificing output read model', () => {

  it('uses the real equipment preview and reports a removed Offhand for a two-handed output', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['prismatic-focus'] = 1
    state.equipment.offhand = 'prismatic-focus'
    const inspection = getArtificingOutputInspection(state, RECIPES['ember-staff'])
    const preview = getArtificingEquipmentPreview(state, inspection.itemId)
    expect(inspection.equipment).toMatchObject({ slot: 'weapon', hands: 2 })
    expect(preview.compatible).toBe(true)
    expect(preview.removedOffhand).toBe('prismatic-focus')
  })
})

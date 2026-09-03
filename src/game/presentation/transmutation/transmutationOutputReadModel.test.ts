import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { RECIPES } from '../../content/recipes/recipes'
import { getTransmutationEquipmentPreview, getTransmutationOutputInspection } from './transmutationOutputReadModel'

describe('Transmutation output read model', () => {
  it('exposes material tier, source, uses, and research metadata', () => {
    const inspection = getTransmutationOutputInspection(createInitialState(), RECIPES['fire-fragment'])
    expect(inspection.material?.tier).toBe(1)
    expect(inspection.material?.source).toContain('Transmutation')
    expect(inspection.material?.usedIn.length).toBeGreaterThan(0)
    expect(inspection.equipment).toBeNull()
  })

  it('uses the real equipment preview and reports a removed Offhand for a two-handed output', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['tide-focus'] = 1
    state.equipment.offhand = 'tide-focus'
    const inspection = getTransmutationOutputInspection(state, RECIPES['ember-staff'])
    const preview = getTransmutationEquipmentPreview(state, inspection.itemId)
    expect(inspection.equipment).toMatchObject({ slot: 'weapon', hands: 2 })
    expect(preview.compatible).toBe(true)
    expect(preview.removedOffhand).toBe('tide-focus')
  })
})

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { generateSigil } from './sigilGeneration'
import { bulkSalvageSigils, shouldAutoSalvageSigil } from './sigilSalvage'
import { getSigilSalvageValue } from './sigilRuntime'

const makeSigil = (state: ReturnType<typeof createInitialState>, quality: 'common' | 'refined' | 'perfect' | 'legendary', slot: 1 | 2 | 3 | 4 | 5 | 6) => generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: slot, forcedQuality: quality, source: 'debug', rng: () => .5 })

describe('Sigil salvage', () => {
  it('bulk salvages eligible instances once and reports locked, equipped, and missing selections', () => {
    const state = createInitialState()
    const common = makeSigil(state, 'common', 1)
    const refined = makeSigil(state, 'refined', 2)
    const locked = makeSigil(state, 'perfect', 3)
    const equipped = makeSigil(state, 'legendary', 4)
    locked.locked = true
    state.sigils.equipped[4] = equipped.instanceId
    const expectedDust = getSigilSalvageValue(common) + getSigilSalvageValue(refined)

    const result = bulkSalvageSigils(state, [common.instanceId, refined.instanceId, locked.instanceId, equipped.instanceId, 'sigil:missing'])

    expect(result).toEqual({ ok: true, salvagedCount: 2, dustGranted: expectedDust, skippedLocked: 1, skippedEquipped: 1, missing: 1 })
    expect(state.sigils.dust).toBe(expectedDust)
    expect(state.sigils.storage[common.instanceId]).toBeUndefined()
    expect(state.sigils.storage[refined.instanceId]).toBeUndefined()
    expect(state.sigils.storage[locked.instanceId]).toBeDefined()
    expect(state.sigils.storage[equipped.instanceId]).toBeDefined()
    expect(state.sigils.discovery.discoveredSets.arcane).toBe(true)
    expect(state.sigils.discovery.qualitiesFound.perfect).toBe(true)
    expect(state.sigils.discovery.qualitiesFound.legendary).toBe(true)
  })

  it.each(['common', 'refined', 'perfect', 'legendary'] as const)('supports player Auto-Salvage for %s', (quality) => {
    const state = createInitialState()
    const sigil = makeSigil(state, quality, 1)

    expect(shouldAutoSalvageSigil(state, sigil.instanceId)).toBe(false)
    state.sigils.autoSalvage[quality] = true
    expect(shouldAutoSalvageSigil(state, sigil.instanceId)).toBe(true)
  })
})
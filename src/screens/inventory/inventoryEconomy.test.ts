import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { getItemFlow, getItemNeeds, getNeededItemIds } from './inventoryEconomy'

describe('inventory economy selectors', () => {
  it('reports active Transmutation production and research consumption', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 37
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    state.activities.research = { ...state.activities.research, running: true, itemId: 'fire-fragment', targetSchoolId: 'fire', remainingQuantity: 2 }

    const flow = getItemFlow('fire-fragment', state)
    expect(flow?.productionPerHour).toBe(600)
    expect(flow?.consumptionPerHour).toBe(720)
    expect(flow?.netPerHour).toBe(-120)
    expect(flow?.direction).toBe('mixed')
    expect(flow?.depletionEtaMs).toBe(37 / 120 * 3_600_000)
  })

  it('reports transmutation ingredient consumption and hides inactive flow', () => {
    const state = createInitialState()
    state.progress.firstBossKill = true
    state.activities.transmutation.jobs['ember-staff'] = { echoesAssigned: 1, progressMs: 1000 }
    expect(getItemFlow('fire-fragment', state)?.consumptionPerHour).toBe(1_800)

    state.activities.transmutation.jobs['ember-staff'] = { echoesAssigned: 0, progressMs: 1000 }
    expect(getItemFlow('fire-fragment', state)).toBeNull()
  })

  it('derives exact next-use needs and respects protected readiness', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 12
    state.progress.emberStaffUnlocked = true
    state.progress.firstBossKill = true
    state.progress.guildUnlocked = true
    state.progress.requestProgress['arcane-supply'] = 8
    const needs = getItemNeeds('fire-fragment', state)

    expect(needs.some((entry) => entry.label === 'Mana Resonance Lv.1' && entry.owned === 12 && entry.required === 5 && entry.status === 'READY')).toBe(true)
    expect(needs.some((entry) => entry.label === 'Ember Staff' && entry.owned === 12 && entry.required === 4 && entry.status === 'READY')).toBe(true)
    expect(needs.some((entry) => entry.label === 'Arcane Supply' && entry.required === 12 && entry.missing === 0 && entry.status === 'READY')).toBe(true)

    state.protectedItems['fire-fragment'] = true
    expect(getItemNeeds('fire-fragment', state).every((entry) => entry.status === 'PROTECTED')).toBe(true)
    expect(getNeededItemIds(state)).toContain('fire-fragment')
  })
})

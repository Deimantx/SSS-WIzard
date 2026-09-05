import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { getItemFlow } from '../../game/systems/inventory/itemFlow'
import { getItemNeeds, getNeededItemIds } from './inventoryEconomy'

describe('inventory economy selectors', () => {
  it('reports active Transmutation production and research consumption', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 37
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    state.activities.research = { ...state.activities.research, running: true, itemId: 'fire-fragment', targetSchoolId: 'fire', remainingQuantity: 2 }

    const flow = getItemFlow('fire-fragment', state)
    expect(flow?.productionPerHour).toBe(450)
    expect(flow?.consumptionPerHour).toBe(360)
    expect(flow?.netPerHour).toBe(90)
    expect(flow?.direction).toBe('mixed')
    expect(flow?.depletionEtaMs).toBeNull()
  })

  it('does not report continuous consumption for legacy Equipment jobs', () => {
    const state = createInitialState()
    state.progress.firstBossKill = true
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    ;(state.activities.transmutation.jobs as Record<string, { echoesAssigned: number; progressMs: number }>)['ember-staff'] = { echoesAssigned: 1, progressMs: 1000 }
    expect(getItemFlow('fire-fragment', state)).toBeNull()

    ;(state.activities.transmutation.jobs as Record<string, { echoesAssigned: number; progressMs: number }>)['ember-staff'] = { echoesAssigned: 0, progressMs: 1000 }
    expect(getItemFlow('fire-fragment', state)).toBeNull()
  })

  it('derives exact next-use needs and respects protected readiness', () => {
    const state = createInitialState()
    state.inventory['fire-fragment'] = 12
    state.progress.emberStaffUnlocked = true
    state.progress.firstBossKill = true
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    state.progress.guildUnlocked = true
    state.progress.requestProgress['arcane-supply'] = 8
    const needs = getItemNeeds('fire-fragment', state)

    expect(needs.some((entry) => entry.label === 'Mana Resonance Lv.1' && entry.owned === 12 && entry.required === 20 && entry.status === 'MISSING')).toBe(true)
    expect(needs.some((entry) => entry.label === 'Ember Staff' && entry.owned === 12 && entry.required === 48 && entry.status === 'MISSING')).toBe(true)
    expect(needs.some((entry) => entry.label === 'Arcane Supply' && entry.required === 12 && entry.missing === 0 && entry.status === 'READY')).toBe(true)

    state.protectedItems['fire-fragment'] = true
    expect(getItemNeeds('fire-fragment', state).filter(entry => entry.owned >= entry.required).every((entry) => entry.status === 'PROTECTED')).toBe(true)
    expect(getNeededItemIds(state)).toEqual([])
    expect(getNeededItemIds(state, 'ember-staff')).toContain('fire-fragment')
  })

  it('reports Focus Capacity as a Prismatic-only need', () => {
    const state = createInitialState()
    state.inventory['prismatic-fragment'] = 2
    state.inventory['life-essence'] = 99

    expect(getItemNeeds('prismatic-fragment', state).some((entry) => entry.label === 'Focus Capacity Lv 1' && entry.required === 20)).toBe(true)
    expect(getItemNeeds('life-essence', state).some((entry) => entry.label.startsWith('Focus Capacity'))).toBe(false)
  })
})

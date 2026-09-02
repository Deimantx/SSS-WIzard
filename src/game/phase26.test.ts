import { describe, expect, it } from 'vitest'
import { makeInitialState, useGameStore } from '../store/gameStore'
import { recalculateDerivedStats } from './engine'
import { selectUsedFocus } from './engine'
import { advanceChanneling } from './engine/channelingEngine'
import { BALANCE } from './core/balance/balance'
import { RECIPES } from './content/recipes/recipes'
import { advanceGameState } from './systems/simulation/advanceGameState'
import { getManaFlowBreakdown } from './systems/channeling/manaFlow'
import { getActivityTelemetry } from './systems/activity/activityTelemetry'
import { getTransmutationEchoesAssigned } from './systems/transmutation/transmutationSelectors'
import { clampResourcePercent } from '../app/shell/Topbar'

describe('Unified Transmutation', () => {
  it('defines four fragment and four equipment recipes with the intended costs', () => {
    expect(Object.keys(RECIPES)).toHaveLength(29)
    expect(['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'].map((id) => RECIPES[id as keyof typeof RECIPES].manaCost)).toEqual([15, 15, 15, 15])
    expect(['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'].map((id) => RECIPES[id as keyof typeof RECIPES].baseDurationMs)).toEqual([6000, 6000, 6000, 6000])
    expect(RECIPES['ember-staff'].ingredients).toEqual([
      { itemId: 'fire-fragment', quantity: 4 },
      { itemId: 'wisp-essence', quantity: 4 },
      { itemId: 'grove-bark', quantity: 1 },
    ])
    expect(RECIPES['ember-staff'].manaCost).toBe(0)
    expect(RECIPES['ember-staff'].unlock).toEqual({ type: 'boss-kill', bossId: 'grove-sentinel' })
  })

  it('assigns Echoes across independent jobs and reserves ten Focus per Echo', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.assignTransmutationEcho('fire-fragment')
    game.assignTransmutationEcho('water-fragment')
    const state = useGameStore.getState()
    expect(state.activities.transmutation.jobs['fire-fragment']).toMatchObject({ echoesAssigned: 1, progressMs: 0 })
    expect(state.activities.transmutation.jobs['water-fragment']).toMatchObject({ echoesAssigned: 1, progressMs: 0 })
    expect(getTransmutationEchoesAssigned(state)).toBe(2)
    expect(selectUsedFocus(state)).toBe(20)
  })

  it('advances multiple jobs at Echo-adjusted speed and preserves partial progress', () => {
    const state = makeInitialState()
    state.player.mana = state.player.maxMana
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 2, progressMs: 1000 }
    state.activities.transmutation.jobs['water-fragment'] = { echoesAssigned: 1, progressMs: 2000 }
    advanceGameState(state, 1000, { mode: 'banked' })
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBe(3000)
    expect(state.activities.transmutation.jobs['water-fragment']?.progressMs).toBe(3000)
    for (let index = 0; index < 3; index += 1) advanceGameState(state, 1000, { mode: 'banked' })
    expect(state.inventory['fire-fragment']).toBe(1)
    expect(state.inventory['water-fragment']).toBe(1)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBeGreaterThan(0)
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBeLessThan(6000)
  })

  it('charges only the funded Mana for the final portion of an elemental cycle', () => {
    const state = makeInitialState()
    state.player.mana = 20
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 5999 }
    advanceGameState(state, 1, { mode: 'banked' })
    expect(state.player.mana).toBeCloseTo(20.0025)
    expect(state.inventory['fire-fragment']).toBe(1)
  })

  it('does not preserve an old full bar when Mana is unavailable', () => {
    const state = makeInitialState()
    state.player.mana = 0
    state.debug.bonusManaRegenFlat = -5
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 5999 }
    advanceGameState(state, 1, { mode: 'banked' })
    expect(state.activities.transmutation.jobs['fire-fragment']?.progressMs).toBe(5999)
    expect(state.inventory['fire-fragment'] ?? 0).toBe(0)
    expect(getActivityTelemetry(state).find((item) => item.id === 'transmutation')?.status).toBe('waiting-mana')
  })

  it('does not preserve an old full equipment bar when an ingredient is missing', () => {
    const state = makeInitialState()
    state.progress.firstBossKill = true
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    state.activities.transmutation.jobs['ember-staff'] = { echoesAssigned: 1, progressMs: 8000 }
    advanceGameState(state, 1, { mode: 'banked' })
    expect(state.activities.transmutation.jobs['ember-staff']?.progressMs).toBe(0)
    expect(state.inventory['ember-staff'] ?? 0).toBe(0)
    expect(getActivityTelemetry(state).find((item) => item.id === 'transmutation')?.status).toBe('waiting-materials')
  })

  it('aggregates simultaneous jobs into one Activity Monitor card', () => {
    const state = makeInitialState()
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 1000 }
    state.activities.transmutation.jobs['water-fragment'] = { echoesAssigned: 2, progressMs: 1000 }
    const cards = getActivityTelemetry(state).filter((item) => item.id === 'transmutation')
    expect(cards).toHaveLength(1)
    expect(cards[0].subtitle).toContain('2 recipes')
    expect(cards[0].subtitle).toContain('3 Echoes')
    expect(cards[0].metrics.find((metric) => metric.label === 'Output')?.value).toBe('1.8k/h')
  })

  it('separates Transmutation Mana demand from channeling Echo output', () => {
    const state = makeInitialState()
    state.activities.channeling.echoesAssigned = 1
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    const flow = getManaFlowBreakdown(state)
    expect(flow.production).toBe(10)
    expect(flow.demand).toBe(2.5)
    expect(flow.demandSources.map((source) => source.id)).toContain('transmutation-fire-fragment')
  })

  it('clamps Focus and handles zero maxima without invalid widths', () => {
    expect(clampResourcePercent(150, 100)).toBe(100)
    expect(clampResourcePercent(50, 0)).toBe(0)
  })

  it('continues Mana regeneration above Max Mana only while the debug override is enabled', () => {
    const state = makeInitialState()
    state.player.mana = state.player.maxMana
    state.debug.allowManaOverCap = true
    advanceChanneling(state, 1000)
    expect(state.player.mana).toBeGreaterThan(state.player.maxMana)
    state.debug.allowManaOverCap = false
    recalculateDerivedStats(state)
    expect(state.player.mana).toBe(state.player.maxMana)
  })

  it('uses the authored five-Echo capacity', () => {
    expect(BALANCE.transmutation.maxEchoes).toBe(5)
  })
})

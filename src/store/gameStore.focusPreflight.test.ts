import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from './initialState'
import { useGameStore } from './gameStore'
import { selectUsedFocus } from '../game/engine'

const preparedState = (maxFocus: number, researchEchoes: number) => {
  const state = createInitialState()
  state.player.baseMaxFocus = maxFocus
  state.progress.spellRanks = { 'fire-bolt': 1 }
  state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 1, remainingQuantity: 1, progressMs: 0, echoesAssigned: researchEchoes, status: 'running' }
  state.spellPresets.presets = [{ id: 'prepared', name: 'Prepared', slots: [{ spellId: 'fire-bolt', autoCast: true }] }]
  state.spellPresets.selectedPresetId = 'prepared'
  return state
}

describe('combat Focus preflight', () => {
  beforeEach(() => useGameStore.getState().hydrateState(createInitialState()))

  it('starts combat atomically when the prepared loadout fits', () => {
    useGameStore.getState().hydrateState(preparedState(100, 3))
    expect(useGameStore.getState().huntCombatTarget('whispering-woods', 'forest-wisp')).toBe(true)
    const state = useGameStore.getState()
    expect(state.combat.active).toBe(true)
    expect(state.combat.activeSpellLoadout?.slots).toEqual([{ spellId: 'fire-bolt', autoCast: true }])
    expect(state.combat.enemyId).toBeTruthy()
    expect(selectUsedFocus(state)).toBe(40)
  })

  it('blocks combat before mutating combat or non-combat runtime when Focus is short', () => {
    const state = preparedState(35, 3)
    const beforeResearch = state.activities.research.slots['research-1']?.echoesAssigned
    useGameStore.getState().hydrateState(state)
    useGameStore.getState().enterDungeon('whispering-woods')
    const next = useGameStore.getState()
    expect(next.combat.active).toBe(false)
    expect(next.combat.enemyId).toBeNull()
    expect(next.combat.activeSpellLoadout).toBeNull()
    expect(next.activities.research.slots['research-1']?.echoesAssigned).toBe(beforeResearch)
    expect(next.spellPresets.presets[0].slots[0].autoCast).toBe(true)
    expect(next.notifications[next.notifications.length - 1]?.text).toContain('Missing Focus: 5')
  })

  it('uses the same preflight for targeted combat', () => {
    useGameStore.getState().hydrateState(preparedState(35, 3))
    expect(useGameStore.getState().huntCombatTarget('whispering-woods', 'forest-wisp')).toBe(false)
    expect(useGameStore.getState().combat.active).toBe(false)
    const notifications = useGameStore.getState().notifications
    expect(notifications[notifications.length - 1]?.text).toContain('Combat Focus Required: 10')
  })
})

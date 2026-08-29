import { describe, expect, it } from 'vitest'
import { SPELLS, validateSpellDefinitions } from '../../content/spells/spells'
import { createInitialState } from '../../../store/initialState'
import { getAutoCastFocusCostForRank, getSpellAutoCastFocusCost, getSpellRank, getSpellsForSchool, syncSpellUnlocksForSchool } from './spellProgression'

describe('Spell progression foundation', () => {
  it('supports the global Rank I–VIII Auto-Cast Focus formula', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((rank) => getAutoCastFocusCostForRank(rank as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8))).toEqual([10, 20, 30, 40, 50, 60, 70, 80])
  })

  it('unlocks one authored Rank-I spell at each current threshold and handles jumps', () => {
    const state = createInitialState()
    expect(syncSpellUnlocksForSchool(state, 'fire')).toEqual([])
    state.schools.fire.level = 2
    expect(syncSpellUnlocksForSchool(state, 'fire')).toEqual(['fire-bolt'])
    state.schools.fire.level = 9
    expect(syncSpellUnlocksForSchool(state, 'fire')).toEqual(['ignite'])
    state.schools.fire.level = 16
    expect(syncSpellUnlocksForSchool(state, 'fire')).toEqual(['fireball'])
    expect(state.progress.spellRanks).toEqual({ 'fire-bolt': 1, ignite: 1, fireball: 1 })
  })

  it('unlocks all crossed thresholds for a School in one sync', () => {
    const state = createInitialState()
    state.schools.water.level = 9
    expect(syncSpellUnlocksForSchool(state, 'water')).toEqual(['water-ward', 'flow-mend'])
    expect(getSpellRank(state, 'flow-mend')).toBe(1)
  })

  it('does not overwrite a future rank when syncing current content', () => {
    const state = createInitialState()
    state.schools.fire.level = 16
    state.progress.spellRanks['fire-bolt'] = 3
    syncSpellUnlocksForSchool(state, 'fire')
    expect(state.progress.spellRanks).toEqual({ 'fire-bolt': 3, ignite: 1, fireball: 1 })
    expect(getSpellAutoCastFocusCost(state, 'fire-bolt')).toBe(30)
  })

  it('defines exactly the current 12-spell tutorial roster with validated content', () => {
    expect(Object.keys(SPELLS)).toHaveLength(12)
    expect(validateSpellDefinitions()).toEqual([])
    expect(['fire', 'water', 'earth', 'air'].map((school) => getSpellsForSchool(school as 'fire' | 'water' | 'earth' | 'air').map((spell) => spell.unlockLevel))).toEqual([[2, 8, 16], [2, 8, 16], [2, 8, 16], [2, 8, 16]])
    expect(SPELLS['air-lance'].description).toContain('strikes the enemy')
    expect(SPELLS['water-ward']).toMatchObject({ cooldownMs: 8000, manaCost: 15, effects: [expect.objectContaining({ type: 'gain-barrier', magnitude: { type: 'flat', value: 35 } })] })
    expect(SPELLS.stoneguard).toMatchObject({ cooldownMs: 18000, manaCost: 22, effects: [expect.objectContaining({ type: 'gain-barrier', magnitude: { type: 'flat', value: 70 } })] })
  })
})

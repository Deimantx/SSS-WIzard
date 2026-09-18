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
    expect(syncSpellUnlocksForSchool(state, 'fire')).toEqual(['searing-touch'])
    state.schools.fire.level = 16
    expect(syncSpellUnlocksForSchool(state, 'fire')).toEqual(['flame-burst'])
    expect(state.progress.spellRanks).toEqual({ 'fire-bolt': 1, 'searing-touch': 1, 'flame-burst': 1 })
  })

  it('unlocks all crossed thresholds for a School in one sync', () => {
    const state = createInitialState()
    state.schools.water.level = 9
    expect(syncSpellUnlocksForSchool(state, 'water')).toEqual(['water-bolt', 'mending-waters'])
    expect(getSpellRank(state, 'mending-waters')).toBe(1)
  })

  it('does not overwrite a future rank when syncing current content', () => {
    const state = createInitialState()
    state.schools.fire.level = 16
    state.progress.spellRanks['fire-bolt'] = 3
    syncSpellUnlocksForSchool(state, 'fire')
    expect(state.progress.spellRanks).toEqual({ 'fire-bolt': 3, 'searing-touch': 1, 'flame-burst': 1 })
    expect(getSpellAutoCastFocusCost(state, 'fire-bolt')).toBe(30)
  })

  it('defines exactly the current 32-spell roster with validated content', () => {
    expect(Object.keys(SPELLS)).toHaveLength(32)
    expect(validateSpellDefinitions()).toEqual([])
    expect(['fire', 'water', 'earth', 'air'].map((school) => getSpellsForSchool(school as 'fire' | 'water' | 'earth' | 'air').map((spell) => spell.unlockLevel))).toEqual([[2, 7, 12, 17, 22, 28, 34, 40], [2, 7, 12, 17, 22, 28, 34, 40], [2, 7, 12, 17, 22, 28, 34, 40], [2, 7, 12, 17, 22, 28, 34, 40]])
    expect(SPELLS['wind-blade'].description).toContain('swift')
    expect(Object.values(SPELLS).map((spell) => spell.manaCost)).toEqual([30, 45, 55, 55, 105, 75, 125, 150, 20, 50, 45, 60, 75, 50, 80, 75, 25, 50, 60, 100, 65, 75, 100, 100, 25, 50, 65, 75, 100, 75, 90, 100])
    expect(SPELLS['earthen-barrier']).toMatchObject({ cooldownMs: 14000, manaCost: 60, effects: [expect.objectContaining({ type: 'gain-barrier', mode: 'replace-if-stronger', durationMs: 10000, magnitude: { type: 'spell-power', coefficient: 1.2 } })] })
  })
})

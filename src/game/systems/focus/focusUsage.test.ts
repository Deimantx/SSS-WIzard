import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { selectUsedFocus } from '../../engine'
import { getFocusUsageGroups } from './focusUsage'

describe('Focus usage groups', () => {
  it('groups the reservation engine into all four Focus Load categories', () => {
    const state = createInitialState()
    state.activities.channeling.echoesAssigned = 4
    state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 1, remainingQuantity: 1, progressMs: 0, echoesAssigned: 2, status: 'running' }
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 3, progressMs: 0 }
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.combat.active = true
    state.combat.activeSpellLoadout = { presetId: null, presetName: 'Test', slots: [{ spellId: 'fire-bolt', autoCast: true }], signature: 'fire-bolt:1' }

    const groups = getFocusUsageGroups(state)
    expect(groups.map((group) => group.sourceType)).toEqual(['channeling', 'research', 'transmutation', 'combat'])
    expect(groups.map((group) => group.amount)).toEqual([40, 20, 30, 10])
    expect(groups.map((group) => group.entries).map((entries) => entries.length)).toEqual([1, 1, 1, 1])
    expect(groups[1].entries[0]?.detail).toContain('1 active project')
    expect(groups[2].entries[0]?.detail).toContain('1 active job')
    expect(groups[3].entries[0]?.detail).toBe('1 Auto-Cast Spell')
    expect(groups.reduce((sum, group) => sum + group.amount, 0)).toBe(selectUsedFocus(state))
  })

  it('keeps multiple Research and Transmutation jobs in one system row', () => {
    const state = createInitialState()
    state.activities.research.slots['research-1'] = { itemId: 'fire-fragment', targetSchoolId: 'fire', requestedQuantity: 1, remainingQuantity: 1, progressMs: 0, echoesAssigned: 1, status: 'running' }
    state.activities.research.slots['research-2'] = { itemId: 'water-fragment', targetSchoolId: 'water', requestedQuantity: 1, remainingQuantity: 1, progressMs: 0, echoesAssigned: 1, status: 'running' }
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 0 }
    state.activities.transmutation.jobs['water-fragment'] = { echoesAssigned: 1, progressMs: 0 }

    const groups = getFocusUsageGroups(state)
    expect(groups.find((group) => group.sourceType === 'research')?.entries).toHaveLength(1)
    expect(groups.find((group) => group.sourceType === 'research')?.entries[0]?.detail).toContain('2 active projects')
    expect(groups.find((group) => group.sourceType === 'transmutation')?.entries).toHaveLength(1)
    expect(groups.find((group) => group.sourceType === 'transmutation')?.entries[0]?.detail).toContain('2 active jobs')
  })
})

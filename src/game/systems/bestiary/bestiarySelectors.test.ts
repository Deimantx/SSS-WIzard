import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { formatDefeats, getBestiaryCompletion, getBestiaryEntries, getMonsterDefeatCount, getMonsterLocations } from './bestiarySelectors'

describe('Bestiary selectors', () => {
  it('derives all authored categories from monster content', () => {
    expect(getBestiaryEntries()).toHaveLength(Object.keys(MONSTERS).length)
    expect(MONSTERS['forest-wisp'].bestiaryCategory).toBe('monster')
    expect(MONSTERS['grove-sentinel'].bestiaryCategory).toBe('monster')
    expect(MONSTERS['forest-heart'].bestiaryCategory).toBe('boss')
  })

  it('uses normal and boss defeat records according to category', () => {
    const state = createInitialState()
    state.progress.lifetimeKillsByMonster['forest-wisp'] = 4
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 2
    expect(getMonsterDefeatCount(state, 'forest-wisp')).toBe(4)
    expect(getMonsterDefeatCount(state, 'grove-sentinel')).toBe(2)
  })

  it('formats defeat counts with singular grammar', () => {
    expect(formatDefeats(0)).toBe('0 defeats')
    expect(formatDefeats(1)).toBe('1 defeat')
    expect(formatDefeats(2)).toBe('2 defeats')
  })

  it('derives completion and locations without storing duplicate totals', () => {
    const state = createInitialState()
    state.progress.discoveredMonsters = ['forest-wisp', 'grove-sentinel']
    const completion = getBestiaryCompletion(state)
    expect(completion).toMatchObject({ discovered: 2, total: 13, percent: 15 })
    expect(completion.categories).toMatchObject({ monster: { discovered: 2, total: 10 }, boss: { discovered: 0, total: 3 } })
    expect(getMonsterLocations('forest-wisp')).toEqual(['Whispering Woods'])
  })
})

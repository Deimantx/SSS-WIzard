import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { formatDefeats, getBestiaryCompletion, getBestiaryEntries, getBestiarySearchText, getBestiaryMetadataFilterOptions, matchesBestiaryMetadataFilter, getMonsterDefeatCount, getMonsterLocations } from './bestiarySelectors'

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
    const monsterTotal = Object.values(MONSTERS).filter((monster) => monster.bestiaryCategory === 'monster').length
    const bossTotal = Object.values(MONSTERS).filter((monster) => monster.bestiaryCategory === 'boss').length
    expect(completion).toMatchObject({ discovered: 2, total: Object.keys(MONSTERS).length, percent: 2 })
    expect(completion.categories).toMatchObject({ monster: { discovered: 2, total: monsterTotal }, boss: { discovered: 0, total: bossTotal } })
    expect(getMonsterLocations('forest-wisp')).toEqual(['Whispering Woods'])
  })

  it('searches discovered entries through referenced status definitions and action effects', () => {
    expect(getBestiarySearchText(MONSTERS['forest-heart'])).toContain('rapid regrow')
    expect(getBestiarySearchText(MONSTERS['forest-heart'])).toContain('haste')
    expect(getBestiarySearchText(MONSTERS['corrupted-greatbear'])).toContain('corruption')
    expect(getBestiarySearchText(MONSTERS['corrupted-greatbear'])).toContain('vulnerable')
    expect(getBestiarySearchText(MONSTERS['archmage-edrin-shade'])).toContain('arcane disruption')
    expect(getBestiarySearchText(MONSTERS['archmage-edrin-shade'])).toContain('final incantation')
  })

  it('offers data-driven Bestiary filters for Hunter metadata, locations, bosses, and discovery', () => {
    const state = createInitialState()
    state.progress.discoveredMonsters = ['ashen-tracker', 'nightglass-alpha', 'forest-wisp']
    const filters = getBestiaryMetadataFilterOptions()
    expect(filters.some((entry) => entry.value === 'region:hunters-ground')).toBe(true)
    expect(filters.some((entry) => entry.value === 'family:Gloamridge Predators')).toBe(true)
    expect(filters.some((entry) => entry.value === 'alignment:Wild')).toBe(true)
    expect(filters.some((entry) => entry.value === 'tier:prestigious')).toBe(true)
    expect(matchesBestiaryMetadataFilter(MONSTERS['ashen-tracker'], state.progress, 'hunter-only')).toBe(true)
    expect(MONSTERS['nightglass-alpha'].bestiaryCategory).toBe('monster')
    expect(matchesBestiaryMetadataFilter(MONSTERS['nightglass-alpha'], state.progress, 'boss')).toBe(false)
    expect(matchesBestiaryMetadataFilter(MONSTERS['nightglass-alpha'], state.progress, 'all')).toBe(true)
    expect(matchesBestiaryMetadataFilter(MONSTERS['forest-wisp'], state.progress, 'discovered')).toBe(true)
    expect(matchesBestiaryMetadataFilter(MONSTERS['gloamfang-stalker'], state.progress, 'discovered')).toBe(false)
    expect(matchesBestiaryMetadataFilter(MONSTERS['ashen-tracker'], state.progress, 'family:Gloamridge Predators')).toBe(true)
  })
})

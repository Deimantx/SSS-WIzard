import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { finishEnemy, spawnEnemy } from './combatRuntime'

const bossState = (bossId: 'forest-heart' | 'archmage-edrin-shade', dungeonId: 'whispering-woods' | 'abandoned-catacombs') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = dungeonId
  spawnEnemy(state, bossId)
  return state
}

describe('School cap milestone rewards', () => {
  it('keeps the starting cap at 20 after Forest Heart while preserving its Focus reward', () => {
    const state = bossState('forest-heart', 'whispering-woods')
    finishEnemy(state)
    expect(state.progress.magicLevelCap).toBe(20)
    expect(state.progress.permanentFocusBonuses['forest-heart']).toBe(10)
    expect(state.progress.guildUnlocked).toBe(true)
    expect(state.notifications.some((note) => note.text.includes('cap increased to 20'))).toBe(false)
  })

  it('raises the cap to at least 40 on the first Edrin defeat only', () => {
    const state = bossState('archmage-edrin-shade', 'abandoned-catacombs')
    finishEnemy(state)
    expect(state.progress.magicLevelCap).toBe(40)
    expect(state.notifications.some((note) => note.text === 'FIRST CHAPTER COMPLETE')).toBe(true)
    expect(state.notifications.some((note) => note.text === 'Magic School cap increased to 40')).toBe(true)

    state.combat.active = true
    spawnEnemy(state, 'archmage-edrin-shade')
    finishEnemy(state)
    expect(state.progress.magicLevelCap).toBe(40)
    expect(state.notifications.filter((note) => note.text === 'Magic School cap increased to 40')).toHaveLength(1)
  })
})

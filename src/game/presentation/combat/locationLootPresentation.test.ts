import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { createInitialState } from '../../../store/initialState'
import { buildLocationLootPresentation, getLocationLootAvailabilityLabel } from './locationLootPresentation'

const discoveredProgress = (dungeonId: keyof typeof DUNGEONS, includeBoss = true) => {
  const state = createInitialState()
  const dungeon = DUNGEONS[dungeonId]
  state.progress.discoveredMonsters = [...dungeon.monsterPool, ...(includeBoss ? [dungeon.boss] : [])]
  return state.progress
}

describe('location loot presentation', () => {
  it('shows only material rewards and keeps boss rewards separate', () => {
    const normal = buildLocationLootPresentation('abandoned-catacombs', discoveredProgress('abandoned-catacombs', false))
    expect(normal.monsters.map((entry) => entry.itemId)).toEqual(['artifact-essence', 'life-essence'])
    expect(normal.boss).toEqual([])
    expect(normal.discoveredNormalEncounterCount).toBe(3)

    const withBoss = buildLocationLootPresentation('abandoned-catacombs', discoveredProgress('abandoned-catacombs'))
    expect(withBoss.boss.map((entry) => entry.itemId)).toEqual(['artifact-essence', 'life-essence'])
    expect(withBoss.boss.some((entry) => entry.signature)).toBe(false)
  })

  it('derives shared and varying values from raw material loot', () => {
    const woods = buildLocationLootPresentation('whispering-woods', discoveredProgress('whispering-woods', false))
    const life = woods.monsters.find((entry) => entry.itemId === 'life-essence')!
    expect(life).toMatchObject({ chanceMin: 1, chanceMax: 1, variesByEncounter: true, sourceCount: 7, encounterCount: 7 })
    expect(getLocationLootAvailabilityLabel(life)).toBe('Varies')
  })

  it('does not reveal undiscovered normal or boss loot', () => {
    const state = createInitialState()
    const groups = buildLocationLootPresentation('whispering-woods', state.progress)
    expect(groups.monsters).toEqual([])
    expect(groups.boss).toEqual([])
    state.progress.discoveredMonsters = ['forest-wisp']
    expect(buildLocationLootPresentation('whispering-woods', state.progress).monsters).toHaveLength(2)
  })
})

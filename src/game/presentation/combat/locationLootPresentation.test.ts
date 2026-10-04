import { describe, expect, it } from 'vitest'
import { COMBAT_LOCATIONS, hasBossEncounter } from '../../content/combat-locations/worldNavigation'
import { createInitialState } from '../../../store/initialState'
import { buildLocationLootPresentation, getLocationLootAvailabilityLabel } from './locationLootPresentation'

const discoveredProgress = (locationId: keyof typeof COMBAT_LOCATIONS, includeBoss = true) => {
  const state = createInitialState()
  const dungeon = COMBAT_LOCATIONS[locationId]
  state.progress.discoveredMonsters = [...dungeon.monsterPool, ...(includeBoss && hasBossEncounter(dungeon) ? [dungeon.boss] : [])]
  return state.progress
}

describe('location loot presentation', () => {
  it('shows only material rewards and keeps boss rewards separate', () => {
    const normal = buildLocationLootPresentation('abandoned-catacombs', discoveredProgress('abandoned-catacombs', false))
    expect(normal.monsters.map((entry) => entry.itemId)).toEqual(['life-essence', 'artifact-essence'])
    expect(normal.boss).toEqual([])
    expect(normal.discoveredNormalEncounterCount).toBe(3)

    const withBoss = buildLocationLootPresentation('abandoned-catacombs', discoveredProgress('abandoned-catacombs'))
    expect(withBoss.boss.map((entry) => entry.itemId)).toEqual(['life-essence', 'artifact-essence'])
    expect(withBoss.boss.some((entry) => entry.signature)).toBe(false)
  })

  it('derives shared and varying values from raw material loot', () => {
    const woods = buildLocationLootPresentation('whispering-woods', discoveredProgress('whispering-woods', false))
    const life = woods.monsters.find((entry) => entry.itemId === 'life-essence')!
    const artifact = woods.monsters.find((entry) => entry.itemId === 'artifact-essence')!
    expect(life).toMatchObject({ chanceMin: 1, chanceMax: 1, variesByEncounter: true, sourceCount: 8, encounterCount: 8 })
    expect(artifact).toMatchObject({ chanceMin: 1, chanceMax: 1, variesByEncounter: true, sourceCount: 8, encounterCount: 8 })
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

import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { createInitialState } from '../../../store/initialState'
import { buildCampaignLootPresentation, getCampaignLootAvailabilityLabel } from './campaignLootPresentation'

const discoveredProgress = (dungeonId: keyof typeof DUNGEONS, includeBoss = true) => {
  const state = createInitialState()
  const dungeon = DUNGEONS[dungeonId]
  state.progress.discoveredMonsters = [...dungeon.monsterPool, ...(includeBoss ? [dungeon.boss] : [])]
  return state.progress
}

describe('campaign loot presentation', () => {
  it('shows only material rewards and keeps boss rewards separate', () => {
    const normal = buildCampaignLootPresentation('abandoned-catacombs', discoveredProgress('abandoned-catacombs', false))
    expect(normal.monsters.map((entry) => entry.itemId)).toEqual(['artifact-essence', 'life-essence'])
    expect(normal.boss).toEqual([])
    expect(normal.discoveredNormalEncounterCount).toBe(3)

    const withBoss = buildCampaignLootPresentation('abandoned-catacombs', discoveredProgress('abandoned-catacombs'))
    expect(withBoss.boss.map((entry) => entry.itemId)).toEqual(['artifact-essence', 'life-essence'])
    expect(withBoss.boss.some((entry) => entry.signature)).toBe(false)
  })

  it('derives shared and varying values from raw material loot', () => {
    const woods = buildCampaignLootPresentation('whispering-woods', discoveredProgress('whispering-woods', false))
    const life = woods.monsters.find((entry) => entry.itemId === 'life-essence')!
    expect(life).toMatchObject({ min: 1, max: 5, chanceMin: 0.2, chanceMax: 1, variesByEncounter: true, sourceCount: 4, encounterCount: 4 })
    expect(getCampaignLootAvailabilityLabel(life)).toBe('Varies')
  })

  it('does not reveal undiscovered normal or boss loot', () => {
    const state = createInitialState()
    const groups = buildCampaignLootPresentation('whispering-woods', state.progress)
    expect(groups.monsters).toEqual([])
    expect(groups.boss).toEqual([])
    state.progress.discoveredMonsters = ['forest-wisp']
    expect(buildCampaignLootPresentation('whispering-woods', state.progress).monsters).toHaveLength(2)
  })
})

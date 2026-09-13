import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import { createInitialState } from '../../../store/initialState'
import type { DungeonId, MonsterId } from '../../types'
import { buildCampaignLootPresentation, formatCampaignLootChance, getCampaignLootAvailabilityLabel } from './campaignLootPresentation'

const discoveredProgress = (dungeonId: DungeonId, includeBoss = true) => {
  const state = createInitialState()
  const dungeon = DUNGEONS[dungeonId]
  state.progress.discoveredMonsters = [...dungeon.monsterPool, ...(includeBoss ? [dungeon.boss] : [])]
  return state.progress
}

describe('campaign loot presentation', () => {
  it('aggregates the complete Abandoned Catacombs normal pool once per item', () => {
    const groups = buildCampaignLootPresentation('abandoned-catacombs', discoveredProgress('abandoned-catacombs', false))
    expect(groups.monsters.map((entry) => entry.itemId)).toEqual(['ossuary-mantle', 'mourning-glass-earring', 'gravebinder-ring', 'soulglass-amulet', 'artifact-essence', 'life-essence'])
    expect(new Set(groups.monsters.map((entry) => entry.itemId)).size).toBe(groups.monsters.length)
    expect(groups.boss).toEqual([])
    expect(groups.discoveredNormalEncounterCount).toBe(3)
    expect(groups.discoveredBoss).toBe(false)
  })

  it('keeps a discovered boss pool separate and marks only its signature', () => {
    const groups = buildCampaignLootPresentation('abandoned-catacombs', discoveredProgress('abandoned-catacombs'))
    expect(groups.boss.map((entry) => entry.itemId)).toEqual(['ossuary-mantle', 'mourning-glass-earring', 'gravebinder-ring', 'soulglass-amulet', 'artifact-essence', 'edrins-signet', 'life-essence'])
    expect(new Set(groups.boss.map((entry) => entry.itemId)).size).toBe(groups.boss.length)
    expect(groups.boss.find((entry) => entry.itemId === 'edrins-signet')).toMatchObject({ chanceMin: 0.1, chanceMax: 0.1, signature: true, sourceCount: 1, encounterCount: 1 })
    expect(groups.boss.filter((entry) => entry.signature)).toHaveLength(1)
  })

  it('derives shared and varying normal values from raw monster loot', () => {
    const catacombs = buildCampaignLootPresentation('abandoned-catacombs', discoveredProgress('abandoned-catacombs', false))
    expect(catacombs.monsters.find((entry) => entry.itemId === 'artifact-essence')).toMatchObject({ min: 3, max: 4, chanceMin: 1, chanceMax: 1, variesByEncounter: false, sourceCount: 3, encounterCount: 3 })
    expect(catacombs.monsters.find((entry) => entry.itemId === 'life-essence')).toMatchObject({ min: 4, max: 10, chanceMin: 1, chanceMax: 1, variesByEncounter: true, sourceCount: 3, encounterCount: 3 })

    const woods = buildCampaignLootPresentation('whispering-woods', discoveredProgress('whispering-woods', false))
    const life = woods.monsters.find((entry) => entry.itemId === 'life-essence')!
    expect(life).toMatchObject({ min: 1, max: 5, chanceMin: 0.2, chanceMax: 1, variesByEncounter: true, sourceCount: 4, encounterCount: 4 })
    expect(formatCampaignLootChance(life)).toBe('20%–100%')
    expect(getCampaignLootAvailabilityLabel(life)).toBe('Varies')
  })

  it('does not reveal undiscovered normal or boss loot', () => {
    const state = createInitialState()
    const groups = buildCampaignLootPresentation('whispering-woods', state.progress)
    expect(groups.monsters).toEqual([])
    expect(groups.boss).toEqual([])

    state.progress.discoveredMonsters = ['forest-wisp' as MonsterId]
    const partial = buildCampaignLootPresentation('whispering-woods', state.progress)
    expect(partial.monsters).toHaveLength(6)
    expect(partial.boss).toEqual([])
    expect(Object.values(MONSTERS).some((monster) => monster.id === partial.bossId)).toBe(true)
  })
})

import { DUNGEONS } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import { formatDropChance, formatDropQuantity } from '../../systems/bestiary/bestiarySelectors'
import type { DungeonId, GameState, ItemId, MonsterId } from '../../types'

export interface CampaignLootEntry {
  itemId: ItemId
  min: number
  max: number
  chanceMin: number
  chanceMax: number
  sourceCount: number
  encounterCount: number
  variesByEncounter: boolean
  signature: boolean
}

export interface CampaignAreaLootGroups {
  monsters: CampaignLootEntry[]
  boss: CampaignLootEntry[]
  bossId: MonsterId
  normalEncounterCount: number
  discoveredNormalEncounterCount: number
  discoveredBoss: boolean
}

interface AggregateEntry extends CampaignLootEntry {
  sourceValues: Set<string>
  sourceMonsterIds: Set<MonsterId>
}

const percentage = (chance: number) => `${Number((Math.max(0, chance) * 100).toFixed(1))}%`

const aggregateLoot = (monsterIds: readonly MonsterId[], signatureItemId?: ItemId): CampaignLootEntry[] => {
  const entries = new Map<ItemId, AggregateEntry>()
  monsterIds.forEach((monsterId) => {
    MONSTERS[monsterId].loot.forEach((drop) => {
      const entry = entries.get(drop.itemId) ?? {
        itemId: drop.itemId,
        min: drop.min,
        max: drop.max,
        chanceMin: drop.chance,
        chanceMax: drop.chance,
        sourceCount: 0,
        encounterCount: monsterIds.length,
        variesByEncounter: false,
        signature: drop.itemId === signatureItemId,
        sourceValues: new Set<string>(),
        sourceMonsterIds: new Set<MonsterId>(),
      }
      entry.min = Math.min(entry.min, drop.min)
      entry.max = Math.max(entry.max, drop.max)
      entry.chanceMin = Math.min(entry.chanceMin, drop.chance)
      entry.chanceMax = Math.max(entry.chanceMax, drop.chance)
      entry.sourceValues.add(`${drop.min}:${drop.max}:${drop.chance}`)
      entry.sourceMonsterIds.add(monsterId)
      entry.sourceCount = entry.sourceMonsterIds.size
      entry.variesByEncounter = entry.sourceValues.size > 1
      entries.set(drop.itemId, entry)
    })
  })

  return [...entries.values()].map(({ sourceValues: _sourceValues, sourceMonsterIds: _sourceMonsterIds, ...entry }) => entry)
}

export function buildCampaignLootPresentation(dungeonId: DungeonId, progress: Pick<GameState, 'progress'>['progress']): CampaignAreaLootGroups {
  const dungeon = DUNGEONS[dungeonId]
  const discovered = new Set(progress.discoveredMonsters)
  const discoveredNormalIds = dungeon.monsterPool.filter((monsterId) => discovered.has(monsterId))
  const discoveredBoss = discovered.has(dungeon.boss)
  return {
    monsters: aggregateLoot(discoveredNormalIds),
    boss: discoveredBoss ? aggregateLoot([dungeon.boss]) : [],
    bossId: dungeon.boss,
    normalEncounterCount: dungeon.monsterPool.length,
    discoveredNormalEncounterCount: discoveredNormalIds.length,
    discoveredBoss,
  }
}

export const formatCampaignLootChance = (entry: Pick<CampaignLootEntry, 'chanceMin' | 'chanceMax'>) => {
  if (entry.chanceMin === 1 && entry.chanceMax === 1) return 'Guaranteed'
  if (entry.chanceMin === entry.chanceMax) return formatDropChance(entry.chanceMin)
  return `${percentage(entry.chanceMin)}–${percentage(entry.chanceMax)}`
}

export const formatCampaignLootQuantity = (entry: Pick<CampaignLootEntry, 'min' | 'max'>) => formatDropQuantity(entry.min, entry.max)

export const getCampaignLootAvailabilityLabel = (entry: Pick<CampaignLootEntry, 'sourceCount' | 'encounterCount' | 'variesByEncounter'>) => {
  if (entry.sourceCount < entry.encounterCount) return 'Some encounters'
  if (entry.variesByEncounter) return 'Varies'
  return null
}

import { DUNGEONS } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import { formatDropChance, formatDropQuantity } from '../../systems/bestiary/bestiarySelectors'
import { resolveLifeEssenceRewardRange } from '../../systems/loot/lifeEssenceReward'
import type { DungeonId, GameState, ItemId, MonsterId, WorldTierId } from '../../types'

export interface LocationLootEntry {
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

export interface LocationLootGroups {
  monsters: LocationLootEntry[]
  boss: LocationLootEntry[]
  bossId: MonsterId
  normalEncounterCount: number
  discoveredNormalEncounterCount: number
  discoveredBoss: boolean
}

interface AggregateEntry extends LocationLootEntry {
  sourceValues: Set<string>
  sourceMonsterIds: Set<MonsterId>
}

const percentage = (chance: number) => `${Number((Math.max(0, chance) * 100).toFixed(1))}%`

const aggregateLoot = (monsterIds: readonly MonsterId[], worldTier: WorldTierId, signatureItemId?: ItemId): LocationLootEntry[] => {
  const entries = new Map<ItemId, AggregateEntry>()
  monsterIds.forEach((monsterId) => {
    const drops = [...MONSTERS[monsterId].loot, (() => {
      const reward = resolveLifeEssenceRewardRange(monsterId, worldTier)
      return { itemId: 'life-essence' as const, min: reward.finalMin, max: reward.finalMax, chance: 1 }
    })()]
    drops.forEach((drop) => {
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

export function buildLocationLootPresentation(dungeonId: DungeonId, progress: Pick<GameState, 'progress'>['progress'], worldTier: WorldTierId = 1): LocationLootGroups {
  const dungeon = DUNGEONS[dungeonId]
  const discovered = new Set(progress.discoveredMonsters)
  const discoveredNormalIds = dungeon.monsterPool.filter((monsterId) => discovered.has(monsterId))
  const discoveredBoss = discovered.has(dungeon.boss)
  return {
    monsters: aggregateLoot(discoveredNormalIds, worldTier),
    boss: discoveredBoss ? aggregateLoot([dungeon.boss], worldTier) : [],
    bossId: dungeon.boss,
    normalEncounterCount: dungeon.monsterPool.length,
    discoveredNormalEncounterCount: discoveredNormalIds.length,
    discoveredBoss,
  }
}

export const formatLocationLootChance = (entry: Pick<LocationLootEntry, 'chanceMin' | 'chanceMax'>) => {
  if (entry.chanceMin === 1 && entry.chanceMax === 1) return 'Guaranteed'
  if (entry.chanceMin === entry.chanceMax) return formatDropChance(entry.chanceMin)
  return `${percentage(entry.chanceMin)}–${percentage(entry.chanceMax)}`
}

export const formatLocationLootQuantity = (entry: Pick<LocationLootEntry, 'min' | 'max'>) => formatDropQuantity(entry.min, entry.max)

export const getLocationLootAvailabilityLabel = (entry: Pick<LocationLootEntry, 'sourceCount' | 'encounterCount' | 'variesByEncounter'>) => {
  if (entry.sourceCount < entry.encounterCount) return 'Some encounters'
  if (entry.variesByEncounter) return 'Varies'
  return null
}

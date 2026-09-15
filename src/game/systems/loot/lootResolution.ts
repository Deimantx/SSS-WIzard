import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { DUNGEONS, DUNGEON_ORDER } from '../../content/dungeons/dungeons'
import { getDungeonBossSignature } from '../../content/equipment/equipmentSets'
import type { DungeonId, GameState, ItemId, MonsterId } from '../../types'
import { grantItem } from '../inventory/itemAcquisition'

const getBossDungeonId = (state: Pick<GameState, 'combat'>, enemyId: MonsterId): DungeonId | null => {
  const activeDungeonId = state.combat.dungeonId
  if (activeDungeonId && DUNGEONS[activeDungeonId]?.boss === enemyId) return activeDungeonId
  return DUNGEON_ORDER.find((dungeonId) => DUNGEONS[dungeonId].boss === enemyId) ?? null
}

const isFirstBossSignatureDrop = (state: GameState, enemyId: MonsterId, itemId: ItemId) => {
  if (MONSTERS[enemyId].bestiaryCategory !== 'boss' || (state.progress.bossKillsByBoss[enemyId] ?? 0) > 0) return false
  const dungeonId = getBossDungeonId(state, enemyId)
  return dungeonId !== null && getDungeonBossSignature(dungeonId) === itemId
}

/** Resolves the current monster table into inventory changes and a readable log fragment. */
export function resolveMonsterLoot(state: GameState, enemyId: MonsterId, onDrop?: (itemId: ItemId, quantity: number) => void, rng: () => number = Math.random): string {
  const drops: string[] = []
  MONSTERS[enemyId].loot.forEach((drop) => {
    const chance = isFirstBossSignatureDrop(state, enemyId, drop.itemId) ? 1 : drop.chance
    if (rng() <= chance) {
      const quantity = Math.floor(drop.min + rng() * (drop.max - drop.min + 1))
      grantItem(state, drop.itemId, quantity)
      onDrop?.(drop.itemId, quantity)
      drops.push(`${quantity} ${ITEMS[drop.itemId].name}`)
    }
  })
  return drops.join(', ')
}

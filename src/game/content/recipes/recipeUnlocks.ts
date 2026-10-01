import { COMBAT_LOCATIONS, isCombatLocationUnlocked } from '../combat-locations/worldNavigation'
import { MONSTERS } from '../monsters'
import type { GameState, RecipeUnlockCondition } from '../../types'
const hasProgress = (progress: GameState['progress'], monsterId: string, count: number) => Math.max(progress.lifetimeKillsByMonster[monsterId as keyof typeof progress.lifetimeKillsByMonster] ?? 0, progress.bossKillsByBoss[monsterId as keyof typeof progress.bossKillsByBoss] ?? 0) >= count

export const isRecipeUnlocked = (state: Pick<GameState, 'progress'>, recipe: { unlock: RecipeUnlockCondition }) => {
  switch (recipe.unlock.type) {
    case 'always': return true
    case 'first-dungeon-boss-kill': return state.progress.firstBossKill
    case 'boss-kill': return Boolean(MONSTERS[recipe.unlock.bossId]) && hasProgress(state.progress, recipe.unlock.bossId, Math.max(1, recipe.unlock.count ?? 1))
    case 'monster-kill': return Boolean(MONSTERS[recipe.unlock.monsterId]) && hasProgress(state.progress, recipe.unlock.monsterId, Math.max(1, recipe.unlock.count ?? 1))
    case 'location-monster-kills': {
      const dungeon = COMBAT_LOCATIONS[recipe.unlock.locationId]
      const count = Math.max(1, recipe.unlock.count ?? 1)
      const totalKills = dungeon?.monsterPool.reduce((total, monsterId) => total + (state.progress.lifetimeKillsByMonster[monsterId] ?? 0), 0) ?? 0
      return Boolean(dungeon) && totalKills >= count
    }
    case 'location-unlocked': {
      const dungeon = COMBAT_LOCATIONS[recipe.unlock.locationId]
      return Boolean(dungeon) && isCombatLocationUnlocked(dungeon, state.progress)
    }
  }
}

export const getRecipeUnlockRequirement = (recipe: { unlock: RecipeUnlockCondition }): string | null => {
  switch (recipe.unlock.type) {
    case 'always': return null
    case 'first-dungeon-boss-kill': return 'Defeat the first Boss to unlock this recipe.'
    case 'boss-kill': return `Defeat ${MONSTERS[recipe.unlock.bossId]?.name ?? recipe.unlock.bossId}${(recipe.unlock.count ?? 1) > 1 ? ` ${recipe.unlock.count} times` : ''} to unlock this recipe.`
    case 'monster-kill': return `Defeat ${MONSTERS[recipe.unlock.monsterId]?.name ?? recipe.unlock.monsterId}${(recipe.unlock.count ?? 1) > 1 ? ` ${recipe.unlock.count} times` : ''} to unlock this recipe.`
    case 'location-monster-kills': return `Defeat any monster in ${COMBAT_LOCATIONS[recipe.unlock.locationId]?.name ?? recipe.unlock.locationId}${(recipe.unlock.count ?? 1) > 1 ? ` ${recipe.unlock.count} times` : ''} to unlock this recipe.`
    case 'location-unlocked': return `Unlock ${COMBAT_LOCATIONS[recipe.unlock.locationId]?.name ?? recipe.unlock.locationId} to access this recipe.`
  }
}

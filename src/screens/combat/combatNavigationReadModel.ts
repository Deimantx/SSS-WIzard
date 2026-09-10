import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement, isDungeonCompleted, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import type { CombatState, DungeonId } from '../../game/types'
import { isBossCurrentlyActive } from '../../game/systems/combat/combatBossSelectors'
import type { CombatNavigationProgress, CombatRegionMap, CombatRegionMapNode, WorldRegionMap, WorldRegionMapNode, WorldRegionId } from './combatNavigationTypes'
import { REGION_WAYPOINT_LAYOUT } from './atlas/atlasLayout'

const REGION_DUNGEON_IDS: Partial<Record<WorldRegionId, readonly DungeonId[]>> = {
  'deep-woods': DUNGEON_ORDER,
}

export const getRegionForDungeon = (dungeonId: DungeonId): WorldRegionId => {
  const region = Object.entries(REGION_DUNGEON_IDS).find(([, dungeonIds]) => dungeonIds?.includes(dungeonId))
  return region?.[0] as WorldRegionId ?? 'deep-woods'
}

const WORLD_REGION_DEFINITIONS: Omit<WorldRegionMapNode, 'status' | 'unlockText'>[] = [
  { id: 'deep-woods', name: 'Deep Woods', description: 'The first living frontier of the tower. Three routes wind through the grove toward the Forest Heart.', slot: 'center', linkedRegionMapId: 'deep-woods', accent: 'violet' },
  { id: 'frostmarch', name: 'Frostmarch', description: 'A frozen expanse where old leyline channels sleep beneath the ice.', slot: 'north', linkedRegionMapId: null, accent: 'blue' },
  { id: 'emberreach', name: 'Emberreach', description: 'A volcanic borderland lit by a furnace that never cools.', slot: 'east', linkedRegionMapId: null, accent: 'orange' },
  { id: 'stormcoast', name: 'Stormcoast', description: 'A charged coastline where thunder rolls through the arcane mist.', slot: 'west', linkedRegionMapId: null, accent: 'cyan' },
  { id: 'duskmoor', name: 'Duskmoor', description: 'A silent moor filled with half-remembered paths and dark water.', slot: 'south', linkedRegionMapId: null, accent: 'red' },
]

export const isWorldMapUnlocked = (progress: CombatNavigationProgress) => (progress.bossKillsByBoss['archmage-edrin-shade'] ?? 0) >= 1

const getDungeonNodeStatus = (dungeonId: CombatRegionMapNode['id'], progress: CombatNavigationProgress, combat: CombatState): CombatRegionMapNode['status'] => {
  const dungeon = DUNGEONS[dungeonId]
  if (!isDungeonUnlocked(dungeon, progress)) return 'locked'
  const current = Boolean(combat.active && combat.dungeonId === dungeonId)
  const bossActive = current && isBossCurrentlyActive({ combat })
  const bossReady = current && combat.threatCleared >= dungeon.threatRequired && !bossActive && !combat.pendingBossId
  if (bossReady) return 'boss-ready'
  if (current) return 'active'
  if (isDungeonCompleted(dungeonId, progress)) return 'completed'
  return 'available'
}

const getNormalKills = (dungeonId: CombatRegionMapNode['id'], progress: CombatNavigationProgress) => DUNGEONS[dungeonId].monsterPool.reduce((total, monsterId) => total + (progress.lifetimeKillsByMonster[monsterId] ?? 0), 0)

export const buildCombatRegionMap = (progress: CombatNavigationProgress, combat: CombatState): CombatRegionMap => {
  const nodes = DUNGEON_ORDER.map((dungeonId) => {
    const dungeon = DUNGEONS[dungeonId]
    const position = REGION_WAYPOINT_LAYOUT[dungeonId]
    return {
      id: dungeonId,
      name: dungeon.name,
      subtitle: dungeonId === 'whispering-woods' ? 'THE LIVING GROVE' : dungeonId === 'howling-den' ? 'PREDATOR FRONTIER' : 'THE FORGOTTEN DEPTHS',
      description: dungeon.ui?.description ?? 'A dangerous route beyond the tower gate.',
      x: position.x,
      y: position.y,
      status: getDungeonNodeStatus(dungeonId, progress, combat),
      unlockText: getDungeonUnlockRequirement(dungeon),
      targetAreaId: dungeonId,
      threatRequired: dungeon.threatRequired,
      threatCleared: combat.active && combat.dungeonId === dungeonId ? combat.threatCleared : 0,
      bossName: MONSTERS[dungeon.boss].name,
      normalMonsterNames: dungeon.monsterPool.map((monsterId) => MONSTERS[monsterId].name),
      normalKills: getNormalKills(dungeonId, progress),
      bossClears: progress.bossKillsByBoss[dungeon.boss] ?? 0,
    } satisfies CombatRegionMapNode
  })
  return {
    id: 'deep-woods',
    name: 'Deep Woods',
    subtitle: 'TUTORIAL REGION · LOCAL ROUTES',
    description: 'Trace the living leyline through three connected hunting grounds. Each route opens the next when its boss falls.',
    nodes,
    connections: [
    { from: 'whispering-woods', to: 'howling-den' },
    { from: 'howling-den', to: 'abandoned-catacombs' },
    ],
  }
}

export const buildWorldRegionMap = (progress: CombatNavigationProgress): WorldRegionMap => {
  const nodes: WorldRegionMapNode[] = WORLD_REGION_DEFINITIONS.map((node) => ({
    ...node,
    status: node.id === 'deep-woods' ? 'current' : 'locked',
    unlockText: node.id === 'deep-woods' ? null : 'Future region · path not yet restored',
  }))
  return {
    name: 'The World Map',
    description: 'The tower has revealed a wider network of regions. Recovered paths will open new destinations beyond the Deep Woods.',
    nodes,
    connections: [
    { from: 'deep-woods', to: 'frostmarch' },
    { from: 'deep-woods', to: 'emberreach' },
    { from: 'deep-woods', to: 'stormcoast' },
    { from: 'deep-woods', to: 'duskmoor' },
    ],
  }
}

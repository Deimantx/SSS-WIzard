import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement, isDungeonCompleted, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import type { CombatState } from '../../game/types'
import { isBossCurrentlyActive } from '../../game/systems/combat/combatBossSelectors'
import type { CombatNavigationProgress, CombatRegionMap, CombatRegionMapNode, WorldRegionMap, WorldRegionMapNode, WorldRegionId } from './combatNavigationTypes'

const REGION_NODE_LAYOUT: Record<CombatRegionMapNode['id'], { x: number; y: number }> = {
  'whispering-woods': { x: 19, y: 53 },
  'howling-den': { x: 50, y: 30 },
  'abandoned-catacombs': { x: 81, y: 58 },
}

const WORLD_NODE_LAYOUT: Record<WorldRegionId, { x: number; y: number }> = {
  'deep-woods': { x: 25, y: 54 },
  frostmarch: { x: 73, y: 22 },
  emberreach: { x: 76, y: 73 },
  stormcoast: { x: 42, y: 78 },
  duskmoor: { x: 52, y: 26 },
}

const WORLD_REGION_DEFINITIONS: Omit<WorldRegionMapNode, 'status' | 'unlockText'>[] = [
  { id: 'deep-woods', name: 'Deep Woods', subtitle: 'TUTORIAL REGION', description: 'The first living frontier of the tower. Three routes wind through the grove toward the Forest Heart.', x: WORLD_NODE_LAYOUT['deep-woods'].x, y: WORLD_NODE_LAYOUT['deep-woods'].y, linkedRegionMapId: 'deep-woods', accent: 'violet' },
  { id: 'frostmarch', name: 'Frostmarch', subtitle: 'DORMANT FRONTIER', description: 'A frozen expanse where old leyline channels sleep beneath the ice.', x: WORLD_NODE_LAYOUT.frostmarch.x, y: WORLD_NODE_LAYOUT.frostmarch.y, linkedRegionMapId: null, accent: 'blue' },
  { id: 'emberreach', name: 'Emberreach', subtitle: 'DORMANT FRONTIER', description: 'A volcanic borderland lit by a furnace that never cools.', x: WORLD_NODE_LAYOUT.emberreach.x, y: WORLD_NODE_LAYOUT.emberreach.y, linkedRegionMapId: null, accent: 'orange' },
  { id: 'stormcoast', name: 'Stormcoast', subtitle: 'DORMANT FRONTIER', description: 'A charged coastline where thunder rolls through the arcane mist.', x: WORLD_NODE_LAYOUT.stormcoast.x, y: WORLD_NODE_LAYOUT.stormcoast.y, linkedRegionMapId: null, accent: 'cyan' },
  { id: 'duskmoor', name: 'Duskmoor', subtitle: 'DORMANT FRONTIER', description: 'A silent moor filled with half-remembered paths and dark water.', x: WORLD_NODE_LAYOUT.duskmoor.x, y: WORLD_NODE_LAYOUT.duskmoor.y, linkedRegionMapId: null, accent: 'red' },
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

export const buildCombatRegionMap = (progress: CombatNavigationProgress, combat: CombatState): CombatRegionMap => ({
  id: 'deep-woods',
  name: 'Deep Woods',
  subtitle: 'TUTORIAL REGION · LOCAL ROUTES',
  description: 'Trace the living leyline through three connected hunting grounds. Each route opens the next when its boss falls.',
  nodes: DUNGEON_ORDER.map((dungeonId) => {
    const dungeon = DUNGEONS[dungeonId]
    const position = REGION_NODE_LAYOUT[dungeonId]
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
  }),
  connections: [
    { from: 'whispering-woods', to: 'howling-den' },
    { from: 'howling-den', to: 'abandoned-catacombs' },
  ],
})

export const buildWorldRegionMap = (progress: CombatNavigationProgress): WorldRegionMap => ({
  name: 'The World Map',
  subtitle: 'MACRO ROUTES · THE SHATTERED FRONTIER',
  description: 'The tower has revealed a wider network of regions. Recovered paths will open new destinations beyond the Deep Woods.',
  nodes: WORLD_REGION_DEFINITIONS.map((node) => ({
    ...node,
    status: node.id === 'deep-woods' ? 'current' : 'locked',
    unlockText: node.id === 'deep-woods' ? null : 'Future region · path not yet restored',
  })),
  connections: [
    { from: 'deep-woods', to: 'frostmarch' },
    { from: 'deep-woods', to: 'emberreach' },
    { from: 'deep-woods', to: 'stormcoast' },
    { from: 'deep-woods', to: 'duskmoor' },
  ],
})

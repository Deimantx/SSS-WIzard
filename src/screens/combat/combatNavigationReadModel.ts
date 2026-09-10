import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement, isDungeonCompleted, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import type { CombatState, DungeonId } from '../../game/types'
import { isBossCurrentlyActive } from '../../game/systems/combat/combatBossSelectors'
import type { CombatNavigationProgress, CombatRegionMap, CombatRegionMapNode, WorldRegionMap, WorldRegionMapNode, WorldRegionId } from './combatNavigationTypes'

const REGION_NODE_LAYOUT: Record<CombatRegionMapNode['id'], { x: number; y: number }> = {
  'whispering-woods': { x: 18, y: 54 },
  'howling-den': { x: 50, y: 42 },
  'abandoned-catacombs': { x: 82, y: 54 },
}

const WORLD_NODE_LAYOUT: Record<WorldRegionId, { x: number; y: number }> = {
  'deep-woods': { x: 50, y: 50 },
  frostmarch: { x: 50, y: 18 },
  emberreach: { x: 85, y: 50 },
  stormcoast: { x: 15, y: 50 },
  duskmoor: { x: 50, y: 82 },
}

const REGION_DUNGEON_IDS: Record<CombatRegionMap['id'], readonly DungeonId[]> = {
  'deep-woods': DUNGEON_ORDER,
}

const MAP_LAYOUT_REFERENCE = { width: 480, height: 450, nodeWidth: 106, nodeHeight: 105, edgePadding: 16, horizontalGap: 24, verticalGap: 20 }

const validateMapLayout = (mapName: string, nodes: readonly { id: string; x: number; y: number }[]) => {
  if (!import.meta.env.DEV) return
  const issues: string[] = []
  const halfWidth = MAP_LAYOUT_REFERENCE.nodeWidth / MAP_LAYOUT_REFERENCE.width * 50
  const halfHeight = MAP_LAYOUT_REFERENCE.nodeHeight / MAP_LAYOUT_REFERENCE.height * 50
  const safeMinX = MAP_LAYOUT_REFERENCE.edgePadding / MAP_LAYOUT_REFERENCE.width * 100 + halfWidth
  const safeMaxX = 100 - MAP_LAYOUT_REFERENCE.edgePadding / MAP_LAYOUT_REFERENCE.width * 100 - halfWidth
  const safeMinY = MAP_LAYOUT_REFERENCE.edgePadding / MAP_LAYOUT_REFERENCE.height * 100 + halfHeight
  const safeMaxY = 100 - MAP_LAYOUT_REFERENCE.edgePadding / MAP_LAYOUT_REFERENCE.height * 100 - halfHeight
  for (const node of nodes) {
    if (node.x < safeMinX || node.x > safeMaxX || node.y < safeMinY || node.y > safeMaxY) issues.push(`${node.id} is outside the safe map area`)
  }
  for (let firstIndex = 0; firstIndex < nodes.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < nodes.length; secondIndex += 1) {
      const first = nodes[firstIndex]
      const second = nodes[secondIndex]
      const horizontalOverlap = Math.abs(first.x - second.x) / 100 * MAP_LAYOUT_REFERENCE.width < MAP_LAYOUT_REFERENCE.nodeWidth + MAP_LAYOUT_REFERENCE.horizontalGap
      const verticalOverlap = Math.abs(first.y - second.y) / 100 * MAP_LAYOUT_REFERENCE.height < MAP_LAYOUT_REFERENCE.nodeHeight + MAP_LAYOUT_REFERENCE.verticalGap
      if (horizontalOverlap && verticalOverlap) issues.push(`${first.id} overlaps ${second.id}`)
    }
  }
  if (issues.length) console.warn(`[combat-navigation] ${mapName} layout: ${issues.join('; ')}`)
}

export const getRegionForDungeon = (dungeonId: DungeonId): CombatRegionMap['id'] => {
  const region = Object.entries(REGION_DUNGEON_IDS).find(([, dungeonIds]) => dungeonIds.includes(dungeonId))
  return region?.[0] as CombatRegionMap['id'] ?? 'deep-woods'
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

export const buildCombatRegionMap = (progress: CombatNavigationProgress, combat: CombatState): CombatRegionMap => {
  const nodes = DUNGEON_ORDER.map((dungeonId) => {
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
  })
  validateMapLayout('Deep Woods', nodes)
  return {
    id: getRegionForDungeon(DUNGEON_ORDER[0]),
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
  validateMapLayout('World', nodes)
  return {
    name: 'The World Map',
    subtitle: 'MACRO ROUTES · THE SHATTERED FRONTIER',
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

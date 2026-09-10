import type { DungeonId, GameState } from '../../game/types'

export type CombatNavigationMode = 'region' | 'world'
export type CombatMapNodeStatus = 'locked' | 'available' | 'active' | 'completed' | 'boss-ready'
export type WorldRegionId = 'deep-woods' | 'frostmarch' | 'emberreach' | 'stormcoast' | 'duskmoor'
export type WorldRegionSlot = 'north' | 'west' | 'center' | 'east' | 'south'

export interface CombatMapConnection {
  from: string
  to: string
}

export interface CombatRegionMapNode {
  id: DungeonId
  name: string
  subtitle: string
  description: string
  x: number
  y: number
  status: CombatMapNodeStatus
  unlockText: string | null
  targetAreaId: DungeonId
  threatRequired: number
  threatCleared: number
  bossName: string
  normalMonsterNames: string[]
  normalKills: number
  bossClears: number
}

export interface CombatRegionMap {
  id: 'deep-woods'
  name: string
  subtitle: string
  description: string
  nodes: CombatRegionMapNode[]
  connections: CombatMapConnection[]
}

export interface WorldRegionMapNode {
  id: WorldRegionId
  name: string
  subtitle: string
  description: string
  slot: WorldRegionSlot
  status: 'locked' | 'available' | 'current'
  unlockText: string | null
  linkedRegionMapId: CombatRegionMap['id'] | null
  accent: 'violet' | 'blue' | 'orange' | 'cyan' | 'red'
}

export interface WorldRegionMap {
  name: string
  subtitle: string
  description: string
  nodes: WorldRegionMapNode[]
  connections: CombatMapConnection[]
}

export type CombatNavigationProgress = Pick<GameState, 'progress'>['progress']

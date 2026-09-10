import type { DungeonId, GameState, MonsterId } from '../../../game/types'

export type CombatActId = 'act-0' | 'act-1'
export type CombatActNodeKind = 'main' | 'branch' | 'final'
export type CombatActNodeState = 'locked' | 'available' | 'active' | 'boss-ready' | 'completed' | 'prototype'
export type CombatActStatus = 'in-progress' | 'completed' | 'current'

/** Presentation metadata only. Real dungeon copy is resolved from the canonical dungeon registry. */
export interface CombatActNodeDefinition {
  id: string
  actId: CombatActId
  x: number
  y: number
  kind: CombatActNodeKind
  dungeonId: DungeonId | null
  tierLabel: string
  recommendedLevel?: number | null
  chapterId?: string | null
  prototype?: boolean
  name?: string
  description?: string
}

export interface CombatActConnection {
  from: string
  to: string
  kind?: 'main' | 'branch'
}

export interface CombatChapterDefinition {
  id: string
  label: string
  startX: number
  endX: number
}

export interface CombatActDefinition {
  id: CombatActId
  label: string
  title: string
  subtitle?: string
  description?: string
  unlock: { type: 'always' } | { type: 'boss-kill'; bossId: MonsterId; kills: number }
  stage: { width: number; height: number }
  nodes: CombatActNodeDefinition[]
  connections: CombatActConnection[]
  chapters?: CombatChapterDefinition[]
}

export interface CombatEncounterViewModel {
  id: string
  monsterId: MonsterId | null
  role: 'normal' | 'boss'
  name: string
  known: boolean
}

export interface CombatActNodeViewModel extends Omit<CombatActNodeDefinition, 'name' | 'description'> {
  name: string
  description: string
  state: CombatActNodeState
  statusLabel: string
  unlockText: string | null
  encounters: CombatEncounterViewModel[]
  boss: CombatEncounterViewModel | null
  threatRequired: number | null
  threatCleared: number
  normalKills: number
  bossClears: number
}

export interface CombatActSummaryViewModel {
  id: CombatActId
  label: string
  title: string
  subtitle: string
  status: CombatActStatus
  statusLabel: string
}

export interface CombatActViewModel extends CombatActSummaryViewModel {
  definition: CombatActDefinition
  nodes: CombatActNodeViewModel[]
  connections: CombatActConnection[]
  chapters: CombatChapterDefinition[]
}

export interface CombatActNavigationViewModel {
  acts: CombatActSummaryViewModel[]
  selectedAct: CombatActViewModel
  selectedNode: CombatActNodeViewModel
}

export type CombatActNavigationProgress = GameState['progress']

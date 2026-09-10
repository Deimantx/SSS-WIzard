import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement, isDungeonCompleted, isDungeonUnlocked } from '../../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../../game/content/monsters'
import { isBossCurrentlyActive } from '../../../game/systems/combat/combatBossSelectors'
import type { CombatState, DungeonId, GameState } from '../../../game/types'
import { COMBAT_ACT_DEFINITIONS, getCombatActDefinition } from './combatActDefinitions'
import type { CombatActDefinition, CombatActId, CombatActNavigationProgress, CombatActNodeDefinition, CombatActNodeState, CombatActNodeViewModel, CombatActStatus, CombatActSummaryViewModel, CombatActViewModel, CombatActNavigationViewModel } from './combatActNavigationTypes'

const getEdrinKills = (progress: CombatActNavigationProgress) => progress.bossKillsByBoss['archmage-edrin-shade'] ?? 0

export const isCombatActUnlocked = (act: CombatActDefinition, progress: CombatActNavigationProgress) => act.unlock.type === 'always' || getEdrinKills(progress) >= act.unlock.kills

const getActStatus = (act: CombatActDefinition, progress: CombatActNavigationProgress): CombatActStatus => {
  if (act.id === 'act-0' && getEdrinKills(progress) >= 1) return 'completed'
  if (act.id === 'act-1') return 'current'
  return 'in-progress'
}

const getActStatusLabel = (status: CombatActStatus) => status === 'completed' ? 'COMPLETED' : status === 'current' ? 'CURRENT' : 'IN PROGRESS'

export const getVisibleCombatActs = (progress: CombatActNavigationProgress): CombatActSummaryViewModel[] => COMBAT_ACT_DEFINITIONS.filter((act) => isCombatActUnlocked(act, progress)).map((act) => ({ id: act.id, label: act.label, title: act.title, subtitle: act.subtitle ?? '', status: getActStatus(act, progress), statusLabel: getActStatusLabel(getActStatus(act, progress)) }))

export const getDefaultCombatActId = (progress: CombatActNavigationProgress, combat: CombatState): CombatActId => {
  if (combat.active && combat.dungeonId) return 'act-0'
  const visible = getVisibleCombatActs(progress)
  return visible[visible.length - 1]?.id ?? 'act-0'
}

export const getDefaultCombatActNodeId = (actId: CombatActId, progress: CombatActNavigationProgress, combat: CombatState, selectedDungeonId: DungeonId): string => {
  const definition = getCombatActDefinition(actId)
  if (!definition) return ''
  if (actId === 'act-1') return definition.nodes[0]?.id ?? ''
  if (combat.active && combat.dungeonId && definition.nodes.some((node) => node.dungeonId === combat.dungeonId)) return combat.dungeonId
  if (DUNGEONS[selectedDungeonId] && isDungeonUnlocked(DUNGEONS[selectedDungeonId], progress)) return selectedDungeonId
  return DUNGEON_ORDER.find((dungeonId) => isDungeonUnlocked(DUNGEONS[dungeonId], progress) && !isDungeonCompleted(dungeonId, progress)) ?? DUNGEON_ORDER.find((dungeonId) => isDungeonUnlocked(DUNGEONS[dungeonId], progress)) ?? definition.nodes[definition.nodes.length - 1]?.id ?? ''
}

const getDungeonNodeState = (dungeonId: DungeonId, progress: CombatActNavigationProgress, combat: CombatState): CombatActNodeState => {
  const dungeon = DUNGEONS[dungeonId]
  if (!isDungeonUnlocked(dungeon, progress)) return 'locked'
  const active = Boolean(combat.active && combat.dungeonId === dungeonId)
  if (active && combat.threatCleared >= dungeon.threatRequired && !isBossCurrentlyActive({ combat }) && !combat.pendingBossId) return 'boss-ready'
  if (active) return 'active'
  if (isDungeonCompleted(dungeonId, progress)) return 'completed'
  return 'available'
}

const getStateLabel = (state: CombatActNodeState) => state === 'locked' ? 'LOCKED' : state === 'available' ? 'AVAILABLE' : state === 'active' ? 'ACTIVE' : state === 'boss-ready' ? 'BOSS READY' : state === 'completed' ? 'CLEARED' : 'PROTOTYPE'

const buildEncounter = (monsterId: import('../../../game/types').MonsterId, role: 'normal' | 'boss', progress: CombatActNavigationProgress): CombatActNodeViewModel['encounters'][number] => {
  const known = progress.discoveredMonsters.includes(monsterId)
  return { id: monsterId, monsterId, role, name: known ? MONSTERS[monsterId].name : role === 'boss' ? 'UNKNOWN BOSS' : 'UNKNOWN CREATURE', known }
}

const buildPrototypeEncounters = (nodeId: string): CombatActNodeViewModel['encounters'] => [1, 2, 3].map((index) => ({ id: `${nodeId}-encounter-${index}`, monsterId: null, role: 'normal' as const, name: 'UNKNOWN CREATURE', known: false }))

const buildNode = (definition: CombatActNodeDefinition, progress: CombatActNavigationProgress, combat: CombatState): CombatActNodeViewModel => {
  if (definition.dungeonId === null || definition.prototype) {
    return { ...definition, name: definition.name ?? 'Prototype Area', description: definition.description ?? 'Temporary navigation prototype used to validate future Act structure.', state: 'prototype', statusLabel: 'PROTOTYPE', unlockText: null, encounters: buildPrototypeEncounters(definition.id), boss: { id: `${definition.id}-boss`, monsterId: null, role: 'boss', name: 'UNKNOWN BOSS', known: false }, threatRequired: null, threatCleared: 0, normalKills: 0, bossClears: 0 }
  }
  const dungeon = DUNGEONS[definition.dungeonId]
  const state = getDungeonNodeState(definition.dungeonId, progress, combat)
  return { ...definition, name: dungeon.name, description: dungeon.ui?.description ?? 'A dangerous route beyond the tower gate.', state, statusLabel: getStateLabel(state), unlockText: getDungeonUnlockRequirement(dungeon), encounters: dungeon.monsterPool.map((monsterId) => buildEncounter(monsterId, 'normal', progress)), boss: buildEncounter(dungeon.boss, 'boss', progress), threatRequired: dungeon.threatRequired, threatCleared: combat.active && combat.dungeonId === dungeon.id ? combat.threatCleared : 0, normalKills: dungeon.monsterPool.reduce((total, monsterId) => total + (progress.lifetimeKillsByMonster[monsterId] ?? 0), 0), bossClears: progress.bossKillsByBoss[dungeon.boss] ?? 0 }
}

const buildAct = (definition: CombatActDefinition, progress: CombatActNavigationProgress, combat: CombatState): CombatActViewModel => {
  const status = getActStatus(definition, progress)
  return { id: definition.id, label: definition.label, title: definition.title, subtitle: definition.subtitle ?? '', status, statusLabel: getActStatusLabel(status), definition, nodes: definition.nodes.map((node) => buildNode(node, progress, combat)), connections: definition.connections, chapters: definition.chapters ?? [] }
}

export const buildCombatActNavigationViewModel = ({ progress, combat, selectedDungeonId, selectedActId, selectedNodeId }: { progress: GameState['progress']; combat: CombatState; selectedDungeonId: DungeonId; selectedActId: CombatActId; selectedNodeId: string }): CombatActNavigationViewModel => {
  const acts = getVisibleCombatActs(progress)
  const selectedDefinition = getCombatActDefinition(selectedActId) ?? getCombatActDefinition(acts[acts.length - 1]?.id ?? 'act-0') ?? COMBAT_ACT_DEFINITIONS[0]
  const selectedAct = buildAct(selectedDefinition, progress, combat)
  const selectedNode = selectedAct.nodes.find((node) => node.id === selectedNodeId) ?? selectedAct.nodes[0]
  return { acts, selectedAct, selectedNode: selectedNode ?? buildNode(selectedDefinition.nodes[0], progress, combat) }
}

export const getDungeonNode = (node: CombatActNodeViewModel) => node.dungeonId ? DUNGEONS[node.dungeonId] : null

export const getFirstUnlockedDungeon = (progress: CombatActNavigationProgress): DungeonId => DUNGEON_ORDER.find((dungeonId) => isDungeonUnlocked(DUNGEONS[dungeonId], progress)) ?? DUNGEON_ORDER[0]

export const dungeonHasMeaningfulProgress = (combat: CombatState) => Boolean(combat.threatCleared > 0 || combat.inBossFight || combat.pendingBossId || combat.enemyId)

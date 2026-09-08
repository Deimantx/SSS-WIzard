import { ARTIFACTS, type ArtifactNodeDefinition } from '../../content/artifacts/artifacts'
import { DUNGEONS, isDungeonUnlocked as isDungeonDefinitionUnlocked } from '../../content/dungeons/dungeons'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { grantItem } from '../inventory/itemAcquisition'
import type { ArtifactId, ArtifactProgressState, GameState, ItemId } from '../../types'

const EMPTY: ArtifactProgressState = { level: 1, allocatedNodeIds: [], attunedNodeIds: [] }
export const getArtifactDefinition = (id: ArtifactId) => ARTIFACTS[id]
export const isArtifactItem = (id: ItemId) => Boolean(ARTIFACTS[id])
type ArtifactProgressionState = Pick<GameState, 'artifactProgress'> & Partial<Pick<GameState, 'debug'>>
export const getArtifactProgress = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => state.artifactProgress?.[id] ?? EMPTY
export const getArtifactLevel = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => getArtifactProgress(state, id).level
export const getArtifactLevelCap = (state: Pick<GameState, 'artifactProgress' | 'progress'> & Partial<Pick<GameState, 'debug'>>, id: ArtifactId) => {
  if (!ARTIFACTS[id]) return 0
  if (state.debug?.artifactIgnoreLevelCap) return ARTIFACTS[id].maxLevel
  if (isDungeonDefinitionUnlocked(DUNGEONS['abandoned-catacombs'], state.progress)) return 10
  if (isDungeonDefinitionUnlocked(DUNGEONS['howling-den'], state.progress)) return 7
  return 4
}
export const getArtifactTotalPoints = (state: ArtifactProgressionState, id: ArtifactId) => Math.max(0, getArtifactLevel(state, id) - 1) + Math.max(0, state.debug?.artifactBonusPointsByArtifact?.[id] ?? 0)
export const getArtifactSpentPoints = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => getArtifactProgress(state, id).allocatedNodeIds.reduce((total, nodeId) => total + (ARTIFACTS[id]?.nodes.find(node => node.id === nodeId)?.pointCost ?? 0), 0)
export const getArtifactAvailablePoints = (state: ArtifactProgressionState, id: ArtifactId) => Math.max(0, getArtifactTotalPoints(state, id) - getArtifactSpentPoints(state, id))
export const getArtifactEffectiveStats = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => {
  const definition = ARTIFACTS[id]; const progress = getArtifactProgress(state, id); const total = { ...(definition?.coreStatsByLevel[progress.level] ?? {}) }
  progress.allocatedNodeIds.forEach(nodeId => Object.entries(definition?.nodes.find(node => node.id === nodeId)?.stats ?? {}).forEach(([key, value]) => {
    if (key === 'resistances' && value && typeof value === 'object') {
      total.resistances = { ...(total.resistances ?? {}), ...Object.fromEntries(Object.entries(value as Record<string, number>).map(([damageType, resistance]) => [damageType, (total.resistances?.[damageType as keyof NonNullable<typeof total.resistances>] ?? 0) + resistance])) }
      return
    }
    total[key as keyof typeof total] = ((total[key as keyof typeof total] ?? 0) as number + (value ?? 0)) as never
  }))
  return total
}
export const getAllocatedArtifactCombatProviders = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => {
  const definition = ARTIFACTS[id]; const allocated = new Set(getArtifactProgress(state, id).allocatedNodeIds)
  return (definition?.nodes.filter(node => allocated.has(node.id)) ?? []).map(node => ({ node, modifiers: node.combat?.modifiers ?? [], rules: node.combat?.rules ?? [] }))
}
export const getArtifactUpgrade = (id: ArtifactId, fromLevel: number) => ARTIFACTS[id]?.upgrades.find(upgrade => upgrade.fromLevel === fromLevel) ?? null
export const canUpgradeArtifact = (state: Pick<GameState, 'artifactProgress' | 'progress' | 'inventory' | 'protectedItems' | 'equipment' | 'activities'> & Partial<Pick<GameState, 'debug'>>, id: ArtifactId) => {
  const definition = ARTIFACTS[id]; const progress = state.artifactProgress?.[id]; const upgrade = progress ? getArtifactUpgrade(id, progress.level) : null
  return Boolean(definition && progress && (state.inventory[id] ?? 0) > 0 && progress.level < getArtifactLevelCap(state, id) && upgrade && (state.debug?.artifactFreeUpgrade || upgrade.ingredients.every(item => getConsumableQuantity(state, item.itemId) >= item.quantity)))
}
export const getArtifactNode = (id: ArtifactId, nodeId: string) => ARTIFACTS[id]?.nodes.find(node => node.id === nodeId) ?? null
export type ArtifactNodeEligibilityStatus = 'allocated' | 'attuned' | 'available' | 'missingLevel' | 'missingPoints' | 'missingPrerequisites' | 'missingBoss' | 'missingCatalyst' | 'unowned'
export interface ArtifactNodeEligibility {
  status: ArtifactNodeEligibilityStatus
  canAllocate: boolean
  missingPrerequisiteIds: string[]
  missingBossId?: import('../../types').MonsterId
  catalystRequired?: { itemId: ItemId; quantity: number }
}
export const getArtifactNodeEligibility = (state: Pick<GameState, 'artifactProgress' | 'progress' | 'inventory' | 'protectedItems' | 'equipment' | 'activities'> & Partial<Pick<GameState, 'debug'>>, id: ArtifactId, nodeId: string): ArtifactNodeEligibility => {
  const node = getArtifactNode(id, nodeId); const progress = state.artifactProgress?.[id]
  if (!node || !progress || (state.inventory[id] ?? 0) < 1) return { status: 'unowned', canAllocate: false, missingPrerequisiteIds: [] }
  if (progress.allocatedNodeIds.includes(nodeId)) return { status: 'allocated', canAllocate: false, missingPrerequisiteIds: [] }
  if (progress.level < node.requiresLevel && !state.debug?.artifactAllowBeyondLimit) return { status: 'missingLevel', canAllocate: false, missingPrerequisiteIds: [] }
  const missingPrerequisiteIds = state.debug?.artifactIgnoreNodePrerequisites ? [] : (node.prerequisites ?? []).filter((prerequisite) => !progress.allocatedNodeIds.includes(prerequisite))
  if (missingPrerequisiteIds.length) return { status: 'missingPrerequisites', canAllocate: false, missingPrerequisiteIds }
  if (node.requiresBossKill && (state.progress.bossKillsByBoss[node.requiresBossKill] ?? 0) < 1 && !state.debug?.artifactIgnoreDungeonGate) return { status: 'missingBoss', canAllocate: false, missingPrerequisiteIds: [], missingBossId: node.requiresBossKill }
  const catalystRequired = node.catalyst && !progress.attunedNodeIds.includes(nodeId) ? node.catalyst : undefined
  if (catalystRequired && getConsumableQuantity(state, catalystRequired.itemId) < catalystRequired.quantity) return { status: 'missingCatalyst', canAllocate: false, missingPrerequisiteIds: [], catalystRequired }
  if (getArtifactAvailablePoints(state, id) < node.pointCost) return { status: 'missingPoints', canAllocate: false, missingPrerequisiteIds: [], catalystRequired }
  return { status: progress.attunedNodeIds.includes(nodeId) ? 'attuned' : 'available', canAllocate: true, missingPrerequisiteIds: [], catalystRequired }
}
export const canAllocateArtifactNode = (state: Pick<GameState, 'artifactProgress' | 'progress' | 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, id: ArtifactId, nodeId: string) => getArtifactNodeEligibility(state, id, nodeId).canAllocate
export const allocateArtifactNode = (state: GameState, id: ArtifactId, nodeId: string) => {
  const node = getArtifactNode(id, nodeId); if (!node || !canAllocateArtifactNode(state, id, nodeId)) return false
  const progress = state.artifactProgress[id] ??= { ...EMPTY, allocatedNodeIds: [], attunedNodeIds: [] }
  if (node.catalyst && !progress.attunedNodeIds.includes(nodeId)) {
    if (getConsumableQuantity(state, node.catalyst.itemId) < node.catalyst.quantity) return false
    state.inventory[node.catalyst.itemId] = Math.max(0, (state.inventory[node.catalyst.itemId] ?? 0) - node.catalyst.quantity)
    progress.attunedNodeIds.push(nodeId)
  }
  progress.allocatedNodeIds.push(nodeId); return true
}
export const respecArtifact = (state: GameState, id: ArtifactId) => { const progress = state.artifactProgress[id]; if (!progress) return false; progress.allocatedNodeIds = []; return true }
export const completeArtifactForge = (state: GameState, id: ArtifactId) => { if (state.artifactProgress?.[id] || (state.inventory[id] ?? 0) > 0) return false; state.artifactProgress ??= {}; grantItem(state, id, 1); state.artifactProgress[id] = { ...EMPTY, allocatedNodeIds: [], attunedNodeIds: [] }; return true }

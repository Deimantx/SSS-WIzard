import { ARTIFACTS, type ArtifactNodeDefinition } from '../../content/artifacts/artifacts'
import { DUNGEONS, isDungeonUnlocked as isDungeonDefinitionUnlocked } from '../../content/dungeons/dungeons'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { grantItem } from '../inventory/itemAcquisition'
import type { ArtifactId, ArtifactProgressState, GameState, ItemId } from '../../types'

const EMPTY: ArtifactProgressState = { level: 1, allocatedNodeIds: [], attunedNodeIds: [] }
export const getArtifactDefinition = (id: ArtifactId) => ARTIFACTS[id]
export const isArtifactItem = (id: ItemId) => Boolean(ARTIFACTS[id])
export const getArtifactProgress = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => state.artifactProgress?.[id] ?? EMPTY
export const getArtifactLevel = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => getArtifactProgress(state, id).level
export const getArtifactLevelCap = (state: Pick<GameState, 'artifactProgress' | 'progress'>, id: ArtifactId) => {
  if (!ARTIFACTS[id]) return 0
  if (isDungeonDefinitionUnlocked(DUNGEONS['abandoned-catacombs'], state.progress)) return 10
  if (isDungeonDefinitionUnlocked(DUNGEONS['howling-den'], state.progress)) return 7
  return 4
}
export const getArtifactTotalPoints = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => Math.max(0, getArtifactLevel(state, id) - 1)
export const getArtifactSpentPoints = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => getArtifactProgress(state, id).allocatedNodeIds.reduce((total, nodeId) => total + (ARTIFACTS[id]?.nodes.find(node => node.id === nodeId)?.pointCost ?? 0), 0)
export const getArtifactAvailablePoints = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => Math.max(0, getArtifactTotalPoints(state, id) - getArtifactSpentPoints(state, id))
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
export const canUpgradeArtifact = (state: Pick<GameState, 'artifactProgress' | 'progress' | 'inventory' | 'protectedItems' | 'equipment' | 'activities'>, id: ArtifactId) => {
  const definition = ARTIFACTS[id]; const progress = getArtifactProgress(state, id); const upgrade = getArtifactUpgrade(id, progress.level)
  return Boolean(definition && (state.inventory[id] ?? 0) > 0 && !state.activities.artificing.activeJob && progress.level < getArtifactLevelCap(state, id) && upgrade?.ingredients.every(item => getConsumableQuantity(state, item.itemId) >= item.quantity))
}
export const getArtifactNode = (id: ArtifactId, nodeId: string) => ARTIFACTS[id]?.nodes.find(node => node.id === nodeId) ?? null
export const canAllocateArtifactNode = (state: Pick<GameState, 'artifactProgress' | 'progress' | 'inventory'>, id: ArtifactId, nodeId: string) => {
  const node = getArtifactNode(id, nodeId); const progress = getArtifactProgress(state, id)
  if (!node || !state.artifactProgress?.[id] || (state.inventory[id] ?? 0) < 1 || progress.allocatedNodeIds.includes(nodeId) || progress.level < node.requiresLevel || getArtifactAvailablePoints(state, id) < node.pointCost || (node.requiresBossKill && (state.progress.bossKillsByBoss[node.requiresBossKill] ?? 0) < 1)) return false
  return (node.prerequisites ?? []).every(prerequisite => progress.allocatedNodeIds.includes(prerequisite))
}
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
export const completeArtifactForge = (state: GameState, id: ArtifactId) => { if (state.artifactProgress[id] || (state.inventory[id] ?? 0) > 0) return false; grantItem(state, id, 1); state.artifactProgress[id] = { ...EMPTY, allocatedNodeIds: [], attunedNodeIds: [] }; return true }

import { ARTIFACTS, isArtifactId, type ArtifactDefinition, type ArtifactMinorNodeDefinition, type ArtifactResolvedEffects } from '../../content/artifacts/artifacts'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { grantItem } from '../inventory/itemAcquisition'
import { spendResonanceBundle } from '../resonance/resonanceRuntime'
import type { ArtifactId, ArtifactProgressState, EquipmentStats, GameState, ItemId } from '../../types'
import { addEquipmentStats } from '../../core/equipment/equipmentStatAggregation'

const EMPTY: ArtifactProgressState = { minorRanks: {} }
export const getArtifactDefinition = (id: ArtifactId) => ARTIFACTS[id]
export const isArtifactItem = (id: ItemId): id is ArtifactId => isArtifactId(id)
export const getArtifactProgress = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => state.artifactProgress?.[id] ?? EMPTY
const getNode = (id: ArtifactId, nodeId: string) => ARTIFACTS[id]?.minorNodes.find((node) => node.id === nodeId)
export const getArtifactMinorRank = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId, nodeId: string) => Math.max(0, Math.min(10, Math.floor(getArtifactProgress(state, artifactId).minorRanks[nodeId] ?? 0)))
export const getArtifactTotalInvestedRanks = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => ARTIFACTS[artifactId]?.minorNodes.reduce((total, node) => total + getArtifactMinorRank(state, artifactId, node.id), 0) ?? 0
export const getArtifactMaxInvestedRanks = (artifactId: ArtifactId) => (ARTIFACTS[artifactId]?.minorNodes.length ?? 0) * 10
export const getArtifactUnlockedMajorMilestones = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => (ARTIFACTS[artifactId]?.majorMilestones ?? []).filter((major) => getArtifactTotalInvestedRanks(state, artifactId) >= major.unlockAtTotalRanks)
export const getArtifactNextMajorMilestone = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => (ARTIFACTS[artifactId]?.majorMilestones.find((major) => getArtifactTotalInvestedRanks(state, artifactId) < major.unlockAtTotalRanks) ?? null)
export const getArtifactCompletionPercent = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => { const max = getArtifactMaxInvestedRanks(artifactId); return max > 0 ? getArtifactTotalInvestedRanks(state, artifactId) / max : 0 }
export const getArtifactRankCost = (artifactId: ArtifactId, nodeId: string, nextRank = 1) => getNode(artifactId, nodeId)?.rankCosts[nextRank - 1] ?? null

const addEffects = (target: EquipmentStats, resolved?: ArtifactResolvedEffects) => addEquipmentStats(target, resolved?.stats)
const getActiveEffects = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => {
  const definition = ARTIFACTS[artifactId]
  if (!definition) return [] as Array<{ name: string; effects: ArtifactResolvedEffects }>
  const active: Array<{ name: string; effects: ArtifactResolvedEffects }> = [{ name: 'Rank 0 Baseline', effects: definition.baseline }]
  definition.minorNodes.forEach((node) => { for (let rank = 1; rank <= getArtifactMinorRank(state, artifactId, node.id); rank += 1) active.push({ name: `${node.name} · Rank ${rank}`, effects: node.rankEffects[rank - 1] }) })
  getArtifactUnlockedMajorMilestones(state, artifactId).forEach((major) => active.push({ name: major.name, effects: major.effects }))
  return active
}
export const getArtifactEffectiveStats = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => {
  const total: EquipmentStats = {}; getActiveEffects(state, id).forEach(({ effects }) => addEffects(total, effects)); return total
}
export interface ActiveArtifactCombatProvider { name: string; modifiers: NonNullable<NonNullable<ArtifactResolvedEffects['combat']>['modifiers']>; rules: NonNullable<NonNullable<ArtifactResolvedEffects['combat']>['rules']>; special: NonNullable<ArtifactResolvedEffects['special']> }
export const getActiveArtifactCombatProviders = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId): ActiveArtifactCombatProvider[] => getActiveEffects(state, id).map(({ name, effects }) => ({ name, modifiers: effects.combat?.modifiers ?? [], rules: effects.combat?.rules ?? [], special: effects.special ?? [] })).filter((provider) => provider.modifiers.length > 0 || provider.rules.length > 0 || provider.special.length > 0)

export type ArtifactRankPurchaseFailure = 'artifact-not-owned' | 'unknown-minor-node' | 'rank-maxed' | 'insufficient-artifact-essence' | 'insufficient-fragment' | 'insufficient-prismatic-fragment' | 'insufficient-resonance'
export type ArtifactRankPurchaseResult = { ok: true; newRank: number; totalInvestedRanks: number } | { ok: false; reason: ArtifactRankPurchaseFailure }
const hasArtifactOwnership = (state: Pick<GameState, 'inventory' | 'artifactProgress'>, artifactId: ArtifactId) => (state.inventory[artifactId] ?? 0) > 0 && Boolean(state.artifactProgress?.[artifactId])
const ensureProgress = (state: GameState, artifactId: ArtifactId) => state.artifactProgress[artifactId] ??= { minorRanks: {} }
export const purchaseArtifactMinorRank = (state: GameState, artifactId: ArtifactId, nodeId: string): ArtifactRankPurchaseResult => {
  const definition = ARTIFACTS[artifactId]; const node = getNode(artifactId, nodeId)
  if (!definition || (!state.debug.artifactIgnoreOwnership && !hasArtifactOwnership(state, artifactId))) return { ok: false, reason: 'artifact-not-owned' }
  if (!node) return { ok: false, reason: 'unknown-minor-node' }
  const currentRank = getArtifactMinorRank(state, artifactId, nodeId)
  if (currentRank >= node.maxRank) return { ok: false, reason: 'rank-maxed' }
  const cost = node.rankCosts[currentRank]
  if (!state.debug.artifactFreeRankPurchase) {
    if ((state.inventory['artifact-essence'] ?? 0) < cost.artifactEssence) return { ok: false, reason: 'insufficient-artifact-essence' }
    if (cost.fragment && (state.inventory[cost.fragment.itemId] ?? 0) < cost.fragment.quantity) return { ok: false, reason: 'insufficient-fragment' }
    if (cost.prismaticFragment && (state.inventory['prismatic-fragment'] ?? 0) < cost.prismaticFragment) return { ok: false, reason: 'insufficient-prismatic-fragment' }
    if (!Object.entries(cost.resonance).every(([type, amount]) => (state.resonance[type as keyof typeof state.resonance] ?? 0) >= (amount ?? 0))) return { ok: false, reason: 'insufficient-resonance' }
    state.inventory['artifact-essence'] = Math.max(0, (state.inventory['artifact-essence'] ?? 0) - cost.artifactEssence)
    if (cost.fragment) state.inventory[cost.fragment.itemId] = Math.max(0, (state.inventory[cost.fragment.itemId] ?? 0) - cost.fragment.quantity)
    if (cost.prismaticFragment) state.inventory['prismatic-fragment'] = Math.max(0, (state.inventory['prismatic-fragment'] ?? 0) - cost.prismaticFragment)
    if (!spendResonanceBundle(state.resonance, cost.resonance)) return { ok: false, reason: 'insufficient-resonance' }
  }
  const progress = ensureProgress(state, artifactId); progress.minorRanks[nodeId] = currentRank + 1
  return { ok: true, newRank: currentRank + 1, totalInvestedRanks: getArtifactTotalInvestedRanks(state, artifactId) }
}

export const debugSetArtifactMinorRank = (state: GameState, artifactId: ArtifactId, nodeId: string, rank: number) => { if (!ARTIFACTS[artifactId] || !getNode(artifactId, nodeId)) return false; const progress = ensureProgress(state, artifactId); progress.minorRanks[nodeId] = Math.max(0, Math.min(10, Math.floor(rank))); return true }
export const debugAdjustArtifactMinorRank = (state: GameState, artifactId: ArtifactId, nodeId: string, delta: number) => debugSetArtifactMinorRank(state, artifactId, nodeId, getArtifactMinorRank(state, artifactId, nodeId) + delta)
export const debugMaxArtifactMinorNode = (state: GameState, artifactId: ArtifactId, nodeId: string) => debugSetArtifactMinorRank(state, artifactId, nodeId, 10)
export const debugResetArtifactMinorNode = (state: GameState, artifactId: ArtifactId, nodeId: string) => debugSetArtifactMinorRank(state, artifactId, nodeId, 0)
export const debugMaxArtifact = (state: GameState, artifactId: ArtifactId) => { const definition = ARTIFACTS[artifactId]; if (!definition) return false; definition.minorNodes.forEach((node) => debugSetArtifactMinorRank(state, artifactId, node.id, 10)); return true }
export const debugResetArtifact = (state: GameState, artifactId: ArtifactId) => { const definition = ARTIFACTS[artifactId]; if (!definition) return false; state.artifactProgress[artifactId] = { minorRanks: {} }; return true }
export const debugMaxOwnedArtifacts = (state: GameState) => Object.keys(ARTIFACTS).forEach((id) => { if ((state.inventory[id as ArtifactId] ?? 0) > 0) debugMaxArtifact(state, id as ArtifactId) })
export const debugGrantAllArtifacts = (state: GameState) => Object.keys(ARTIFACTS).forEach((id) => { if ((state.inventory[id as ArtifactId] ?? 0) < 1) grantItem(state, id as ArtifactId, 1) })
export const debugResetAllArtifactRanks = (state: GameState) => Object.keys(ARTIFACTS).forEach((id) => debugResetArtifact(state, id as ArtifactId))
export const completeArtifactForge = (state: GameState, id: ArtifactId) => { if (state.artifactProgress?.[id] || (state.inventory[id] ?? 0) > 0) return false; state.artifactProgress[id] = { minorRanks: {} }; grantItem(state, id, 1); return true }

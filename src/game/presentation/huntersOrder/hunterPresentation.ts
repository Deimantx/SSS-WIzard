import { HUNTER_RANKS, HUNTER_STANDINGS } from '../../content/hunters-order/hunterRanks'
import { HUNTER_UPGRADES } from '../../content/hunters-order/hunterUpgrades'
import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../content/monsters/first-frontier/gloamridge'
import { MONSTERS } from '../../content/monsters'
import { DUNGEONS } from '../../content/combat-locations/dungeons/dungeons'
import { getEligibleHunterContractMembers, getHunterRankProgress, getHunterStandingProgress, getHunterUpgradePurchaseStatus } from '../../systems/hunters-order/huntersOrderRuntime'
import type { GameState, HunterContractState, HunterRankId, HunterUpgradeId } from '../../types'
import { getHunterUpgradeEffectBreakdown } from './hunterUpgradeEffectBreakdown'

export const getHunterHeaderPresentation = (state: Pick<GameState, 'progress'>) => {
  const order = state.progress.huntersOrder
  const progress = getHunterRankProgress(order.reputation)
  const standing = getHunterStandingProgress(order.reputation)
  const remaining = progress.nextRank ? Math.max(0, progress.nextRank.reputation - order.reputation) : 0
  return { ...progress, ...standing, reputation: order.reputation, marks: order.hunterMarks, contractsCompleted: order.totalContractsCompleted, totalHunterKills: order.totalHunterKills, activeContract: order.activeContract, remaining: standing.nextStanding ? standing.nextStanding.reputation - order.reputation : 0, progressPercent: Math.round(standing.progress * 100), availableUpgradeCount: HUNTER_UPGRADES.filter((upgrade) => getHunterUpgradePurchaseStatus(state, upgrade.id).canPurchase).length }
}

export const getHunterRankPresentation = (state: Pick<GameState, 'progress'>, selectedRankId?: HunterRankId) => {
  const header = getHunterHeaderPresentation(state)
  const selectedRank = HUNTER_RANKS.find((rank) => rank.id === selectedRankId) ?? header.currentRank
  const standings = HUNTER_STANDINGS.filter((standing) => standing.rankId === selectedRank.id).map((standing) => ({ ...standing, reached: header.reputation >= standing.reputation, current: standing.id === header.currentStanding.id }))
  return { ...header, selectedRank, categories: HUNTER_RANKS.map((rank) => ({ ...rank, reached: header.reputation >= rank.reputation, current: rank.id === header.currentRank.id })), ladder: standings }
}

export { getHunterUpgradeEffectBreakdown }

export const getHunterUpgradePresentation = (state: Pick<GameState, 'progress'>, upgradeId: HunterUpgradeId | string, contract?: HunterContractState) => {
  const status = getHunterUpgradePurchaseStatus(state, upgradeId)
  const upgrade = status.upgrade ?? HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade) return null
  const breakdown = getHunterUpgradeEffectBreakdown(state, upgrade.id, contract)!
  return { ...status, upgrade, maxed: status.ownedRank >= upgrade.maxRank, breakdown, currentEffect: breakdown.current.join(' / '), nextEffect: breakdown.next.join(' / '), maximumEffect: breakdown.maximum.join(' / ') }
}

export const getHunterContractPresentation = (state: Pick<GameState, 'progress'>, contract: HunterContractState) => {
  const type = contract.targetSpec.type
  const action = type === 'monster' || type === 'boss' ? 'HUNT' : type === 'family' ? 'CULL' : type === 'alignment' ? 'PURSUE' : 'PATROL'
  const objective = type === 'monster' || type === 'boss' ? MONSTERS[contract.targetSpec.monsterId]?.name ?? 'Quarry' : type === 'family' ? `${contract.targetSpec.familyId} Family` : type === 'alignment' ? `${contract.targetSpec.alignmentId} Quarry` : 'Ground Patrol'
  const groundId = contract.huntingGroundId ?? 'hunters-ground'
  const eligibleMonsterIds = getEligibleHunterContractMembers(state, contract, groundId)
  return { action, objective: type === 'region' ? DUNGEONS[groundId]?.name ?? objective : objective, groundId, groundName: DUNGEONS[groundId]?.name ?? groundId, eligibleMonsterIds, quarryCount: eligibleMonsterIds.length, progress: Math.min(contract.target, contract.progress), remaining: Math.max(0, contract.target - contract.progress), progressPercent: contract.target > 0 ? Math.min(100, contract.progress / contract.target * 100) : 0 }
}

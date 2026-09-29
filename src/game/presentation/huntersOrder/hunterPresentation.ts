import { HUNTER_RANKS, HUNTER_STANDINGS } from '../../content/huntersOrder/hunterRanks'
import { HUNTER_UPGRADES } from '../../content/huntersOrder/hunterUpgrades'
import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../content/monsters/huntersOrder'
import { MONSTERS } from '../../content/monsters'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { getEligibleHunterContractMembers, getHunterRankProgress, getHunterStandingProgress, getHunterUpgradePurchaseStatus } from '../../systems/huntersOrder/huntersOrderRuntime'
import type { GameState, HunterContractState, HunterRankId, HunterUpgradeId } from '../../types'

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

const effectForRank = (upgrade: typeof HUNTER_UPGRADES[number], rank: number) => {
  const effect = upgrade.effect
  const total = effect.rankAmounts ? effect.rankAmounts.slice(0, rank).reduce((sum, value) => sum + value, 0) : (effect.amount ?? 0) * rank
  if (effect.type.includes('target-reduction')) return `${Math.round(total * 100)}% lower ${effect.type.replace('-target-reduction-percent', '').replace('target-reduction-percent', 'all')} contract target`
  if (effect.type.includes('reputation-bonus')) return `${Math.round(total * 100)}% bonus ${effect.type === 'reputation-bonus' ? 'contract' : effect.type.replace('-reputation-bonus', '')} Reputation`
  if (effect.type === 'block-slots') return `${total} Target Block ${total === 1 ? 'slot' : 'slots'}`
  if (effect.type === 'bonus-marks' || effect.type === 'broad-bonus-marks') return `+${total} Hunter ${total === 1 ? 'Mark' : 'Marks'} per qualifying Contract`
  if (effect.type === 'reroll-cost-reduction' || effect.type === 'skip-cost-reduction') return `-${total} Hunter Mark ${effect.type === 'reroll-cost-reduction' ? 'refresh' : 'skip'} cost`
  if (effect.type === 'pin-slots') return `${total} offer ${total === 1 ? 'slot' : 'slots'} can be pinned`
  if (effect.type === 'dispatch-directives') return ['Preferred Contract Type selector', '2× preferred Contract weight', 'Guarantee preferred offer when eligible'][Math.max(0, rank - 1)] ?? 'Dispatch directive'
  if (effect.type === 'contract-recall') return `Retain up to ${total} valid offer${total === 1 ? '' : 's'} after completion`
  if (effect.type === 'resonance-yield') return `${Math.round(total * 100)}% more Resonance from authorized quarry`
  if (effect.type === 'essence-yield') return `${Math.round(total * 100)}% more Life Essence from authorized quarry`
  if (effect.type === 'item-drop-multiplier') return `${Math.round(total * 100)}% relative normal item drop chance`
  if (effect.type === 'sigil-drop-multiplier') return `${Math.round(total * 100)}% relative Sigil drop chance`
  if (effect.type === 'completion-resonance') return 'Additional Resonance on Contract completion'
  if (effect.type === 'completion-essence') return 'Bonus Life Essence on Contract completion'
  if (effect.type === 'hunt-forecast') return 'Unlock measured Hunt Forecast'
  if (effect.type === 'board-forecast') return 'Reveal offer efficiency and eligible quarry count'
  if (effect.type === 'quarry-memory') return 'Remember last eligible quarry per Ground'
  if (effect.type === 'ground-survey') return `Improve multi-Ground offer diversity · Rank ${rank}`
  if (effect.type === 'priority-dispatch') return ['Preferred Hunting Ground selector', '2× preferred Ground weight', 'Guarantee preferred Ground when eligible'][Math.max(0, rank - 1)] ?? 'Ground dispatch directive'
  if (effect.type === 'master-dossier') return 'Reveal limited metadata for undiscovered quarry'
  return `${total} ${effect.type}`
}

export const getHunterUpgradePresentation = (state: Pick<GameState, 'progress'>, upgradeId: HunterUpgradeId | string) => {
  const status = getHunterUpgradePurchaseStatus(state, upgradeId)
  const upgrade = status.upgrade ?? HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade) return null
  const current = status.ownedRank
  return { ...status, upgrade, maxed: current >= upgrade.maxRank, currentEffect: effectForRank(upgrade, current), nextEffect: effectForRank(upgrade, Math.min(upgrade.maxRank, current + 1)), maximumEffect: effectForRank(upgrade, upgrade.maxRank) }
}

export const getHunterContractPresentation = (state: Pick<GameState, 'progress'>, contract: HunterContractState) => {
  const type = contract.targetSpec.type
  const action = type === 'monster' || type === 'boss' ? 'HUNT' : type === 'family' ? 'CULL' : type === 'alignment' ? 'PURSUE' : 'PATROL'
  const objective = type === 'monster' || type === 'boss' ? MONSTERS[contract.targetSpec.monsterId]?.name ?? 'Quarry' : type === 'family' ? `${contract.targetSpec.familyId} Family` : type === 'alignment' ? `${contract.targetSpec.alignmentId} Quarry` : 'Ground Patrol'
  const groundId = contract.huntingGroundId ?? 'hunters-ground'
  const eligibleMonsterIds = getEligibleHunterContractMembers(state, contract, groundId)
  return { action, objective: type === 'region' ? DUNGEONS[groundId]?.name ?? objective : objective, groundId, groundName: DUNGEONS[groundId]?.name ?? groundId, eligibleMonsterIds, quarryCount: eligibleMonsterIds.length, progress: Math.min(contract.target, contract.progress), remaining: Math.max(0, contract.target - contract.progress), progressPercent: contract.target > 0 ? Math.min(100, contract.progress / contract.target * 100) : 0 }
}

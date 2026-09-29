import { HUNTER_RANKS } from '../../content/huntersOrder/hunterRanks'
import { HUNTER_UPGRADES } from '../../content/huntersOrder/hunterUpgrades'
import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../content/monsters/huntersOrder'
import { MONSTERS } from '../../content/monsters'
import { getHunterRankProgress, getHunterUpgradePurchaseStatus } from '../../systems/huntersOrder/huntersOrderRuntime'
import type { GameState, HunterContractState, HunterRankId, HunterUpgradeId } from '../../types'

export const getHunterHeaderPresentation = (state: Pick<GameState, 'progress'>) => {
  const order = state.progress.huntersOrder
  const progress = getHunterRankProgress(order.reputation)
  const remaining = progress.nextRank ? Math.max(0, progress.nextRank.reputation - order.reputation) : 0
  return { ...progress, reputation: order.reputation, marks: order.hunterMarks, contractsCompleted: order.totalContractsCompleted, remaining, progressPercent: Math.round(progress.progress * 100), availableUpgradeCount: HUNTER_UPGRADES.filter((upgrade) => getHunterUpgradePurchaseStatus(state, upgrade.id).canPurchase).length }
}

export const getHunterRankPresentation = (state: Pick<GameState, 'progress'>, selectedRankId?: HunterRankId) => {
  const header = getHunterHeaderPresentation(state)
  const selectedRank = HUNTER_RANKS.find((rank) => rank.id === selectedRankId) ?? header.currentRank
  return { ...header, selectedRank, ladder: HUNTER_RANKS.map((rank) => ({ ...rank, reached: header.reputation >= rank.reputation, current: rank.id === header.currentRank.id })) }
}

const effectForRank = (upgrade: typeof HUNTER_UPGRADES[number], rank: number) => {
  const effect = upgrade.effect
  const total = 'rankAmounts' in effect ? effect.rankAmounts.slice(0, rank).reduce((sum, value) => sum + value, 0) : effect.amount * rank
  if (effect.type === 'target-reduction-percent') return `${Math.round(total * 100)}% lower contract kill requirements`
  if (effect.type === 'reputation-bonus') return `${Math.round(total * 100)}% bonus Hunter Reputation`
  if (effect.type === 'block-slots') return `${total} Target Block ${total === 1 ? 'slot' : 'slots'}`
  if (effect.type === 'bonus-marks') return `${total} additional Hunter ${total === 1 ? 'Mark' : 'Marks'} per contract`
  if (effect.type === 'contract-choices') return `${total} additional board ${total === 1 ? 'choice' : 'choices'}`
  return `${total} Mark lower ${effect.type === 'reroll-cost-reduction' ? 'refresh' : 'skip'} cost`
}

export const getHunterUpgradePresentation = (state: Pick<GameState, 'progress'>, upgradeId: HunterUpgradeId | string) => {
  const status = getHunterUpgradePurchaseStatus(state, upgradeId)
  const upgrade = status.upgrade ?? HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade) return null
  const current = status.ownedRank
  return { ...status, upgrade, maxed: current >= upgrade.maxRank, currentEffect: effectForRank(upgrade, current), nextEffect: effectForRank(upgrade, Math.min(upgrade.maxRank, current + 1)), maximumEffect: effectForRank(upgrade, upgrade.maxRank) }
}

export const getHunterContractPresentation = (contract: HunterContractState) => {
  const type = contract.targetSpec.type
  const action = type === 'monster' ? 'HUNT' : type === 'family' ? 'CULL' : type === 'alignment' ? 'PURSUE' : type === 'region' ? 'PATROL' : 'APEX CONTRACT'
  const objective = type === 'monster' || type === 'boss' ? MONSTERS[contract.targetSpec.monsterId]?.name ?? 'Quarry' : type === 'family' ? `${contract.targetSpec.familyId} Family` : type === 'alignment' ? `${contract.targetSpec.alignmentId} Quarry` : 'Gloamridge'
  const quarryCount = type === 'monster' || type === 'boss' ? 1 : HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => {
    const metadata = MONSTERS[id]?.hunter
    if (!metadata || id === 'nightglass-alpha') return false
    if (type === 'family') return metadata.family === contract.targetSpec.familyId
    if (type === 'alignment') return metadata.alignment === contract.targetSpec.alignmentId
    return true
  }).length
  return { action, objective, quarryCount, progress: Math.min(contract.target, contract.progress), remaining: Math.max(0, contract.target - contract.progress), progressPercent: contract.target > 0 ? Math.min(100, contract.progress / contract.target * 100) : 0 }
}

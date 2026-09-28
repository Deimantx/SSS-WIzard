import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../content/monsters/huntersOrder'
import { HUNTER_RANKS } from '../../content/huntersOrder/hunterRanks'
import { HUNTER_UPGRADES } from '../../content/huntersOrder/hunterUpgrades'
import { MONSTERS } from '../../content/monsters'
import { pushNotification } from '../../engine'
import type { GameState, HunterContractState, HunterRankId, MonsterId } from '../../types'

const normalTargets = HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => MONSTERS[id]?.bestiaryCategory === 'monster')
const safeInt = (n: number) => Math.max(0, Math.floor(Number.isFinite(n) ? n : 0))

export const isHuntersOrderUnlocked = (state: Pick<GameState, 'progress'>) => (state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0) > 0
export const getHunterRank = (reputation: number) => [...HUNTER_RANKS].reverse().find((rank) => reputation >= rank.reputation) ?? HUNTER_RANKS[0]

export const generateHunterContractChoices = (state: Pick<GameState, 'progress'>): HunterContractState[] => {
  const order = state.progress.huntersOrder
  if (!isHuntersOrderUnlocked(state)) return []
  const candidates = normalTargets.filter((id) => !order.blockedTargets.includes(id))
  if (candidates.length < 1) return []
  const start = order.generationCount % candidates.length
  return Array.from({ length: Math.min(3, candidates.length) }, (_, index) => {
    const targetMonsterId = candidates[(start + index) % candidates.length]
    const tier = order.totalContractsCompleted >= 8 && index === 2 ? 'prestigious' : order.totalContractsCompleted >= 3 && index === 1 ? 'special' : 'routine'
    const baseTarget = tier === 'routine' ? 3 : tier === 'special' ? 6 : 10
    const target = Math.max(2, baseTarget - (order.purchasedUpgrades['trail-kit'] ? 1 : 0))
    const rewardScale = tier === 'routine' ? 1 : tier === 'special' ? 2.2 : 4
    const serial = order.generationCount * 3 + index
    return { id: `hunt-${serial}-${targetMonsterId}`, targetMonsterId, target, progress: 0, tier, reputationReward: Math.round(target * 25 * rewardScale), marksReward: tier === 'routine' ? 2 : tier === 'special' ? 5 : 10 }
  })
}

export const ensureHunterContractChoices = (state: GameState) => {
  if (!isHuntersOrderUnlocked(state) || state.progress.huntersOrder.availableContracts.length > 0) return
  state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
}

export const acceptHunterContract = (state: GameState, contractId: string) => {
  const order = state.progress.huntersOrder
  if (!isHuntersOrderUnlocked(state) || order.activeContract) return false
  const selected = order.availableContracts.find((contract) => contract.id === contractId)
  if (!selected) return false
  order.activeContract = { ...selected }
  order.totalContractsAccepted = safeInt(order.totalContractsAccepted) + 1
  order.availableContracts = order.availableContracts.filter((contract) => contract.id !== contractId)
  pushNotification(state, `Hunt Contract accepted: ${MONSTERS[selected.targetMonsterId].name}.`, 'info')
  return true
}

export const canHuntMonster = (state: Pick<GameState, 'progress'>, monsterId: MonsterId) => {
  if (!HUNTER_EXCLUSIVE_MONSTER_IDS.includes(monsterId)) return true
  const order = state.progress.huntersOrder
  return isHuntersOrderUnlocked(state) && Boolean(order.activeContract)
}

export const recordHunterKill = (state: GameState, monsterId: MonsterId) => {
  const order = state.progress.huntersOrder
  if (!HUNTER_EXCLUSIVE_MONSTER_IDS.includes(monsterId)) return false
  order.totalHunterKills = safeInt(order.totalHunterKills) + 1
  const stats = order.monsterHunterStats[monsterId] ??= { contractKills: 0, contractsCompleted: 0, marksEarned: 0 }
  if (order.activeContract?.targetMonsterId !== monsterId) return false
  const contract = order.activeContract
  contract.progress = Math.min(contract.target, contract.progress + 1)
  stats.contractKills += 1
  if (contract.progress < contract.target) return true
  const reputationReward = Math.round(contract.reputationReward * (order.purchasedUpgrades['marked-quarry'] ? 1.1 : 1))
  order.reputation = safeInt(order.reputation) + reputationReward
  order.hunterMarks = safeInt(order.hunterMarks) + contract.marksReward
  order.totalContractsCompleted = safeInt(order.totalContractsCompleted) + 1
  stats.contractsCompleted += 1
  stats.marksEarned += contract.marksReward
  const nextRank = getHunterRank(order.reputation)
  if (nextRank.id !== order.rankId) {
    order.rankId = nextRank.id
    pushNotification(state, `Hunter Rank raised to ${nextRank.id.replaceAll('-', ' ')}.`, 'success')
  }
  order.activeContract = null
  order.generationCount += 1
  order.availableContracts = generateHunterContractChoices(state)
  pushNotification(state, `Hunt Contract complete · +${contract.reputationReward} Reputation · +${contract.marksReward} Hunter Marks.`, 'success')
  return true
}

export const skipHunterContract = (state: GameState) => {
  const order = state.progress.huntersOrder
  if (!order.activeContract) return false
  order.activeContract = null
  order.generationCount += 1
  order.availableContracts = generateHunterContractChoices(state)
  pushNotification(state, 'Hunt Contract skipped. Its progress was forfeited.', 'info')
  return true
}

export const rerollHunterContracts = (state: GameState) => {
  const order = state.progress.huntersOrder
  if (!isHuntersOrderUnlocked(state) || order.hunterMarks < 1) return false
  order.hunterMarks -= 1
  order.generationCount += 1
  order.availableContracts = generateHunterContractChoices(state)
  pushNotification(state, 'Hunt Contract board refreshed · 1 Hunter Mark spent.', 'info')
  return true
}

export const setHunterTargetBlocked = (state: GameState, monsterId: MonsterId, blocked: boolean) => {
  if (!HUNTER_EXCLUSIVE_MONSTER_IDS.includes(monsterId)) return false
  const blockedTargets = state.progress.huntersOrder.blockedTargets
  const exists = blockedTargets.includes(monsterId)
  if (exists === blocked) return false
  state.progress.huntersOrder.blockedTargets = blocked ? [...blockedTargets, monsterId] : blockedTargets.filter((id) => id !== monsterId)
  state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
  return true
}

export const purchaseHunterUpgrade = (state: GameState, upgradeId: string) => {
  const order = state.progress.huntersOrder
  const upgrade = HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade || order.purchasedUpgrades[upgrade.id] || order.hunterMarks < upgrade.markCost) return false
  order.hunterMarks -= upgrade.markCost
  order.purchasedUpgrades[upgrade.id] = 1
  if (upgrade.id === 'trail-kit') order.availableContracts = generateHunterContractChoices(state)
  pushNotification(state, `${upgrade.name} unlocked.`, 'success')
  return true
}

export const normalizeHuntersOrderProgress = (state: GameState) => {
  const order = state.progress.huntersOrder
  order.reputation = safeInt(order.reputation)
  order.hunterMarks = safeInt(order.hunterMarks)
  order.totalContractsAccepted = safeInt(order.totalContractsAccepted)
  order.totalContractsCompleted = safeInt(order.totalContractsCompleted)
  order.totalHunterKills = safeInt(order.totalHunterKills)
  order.generationCount = safeInt(order.generationCount)
  order.rankId = getHunterRank(order.reputation).id
  ensureHunterContractChoices(state)
  return order
}

export const debugSetHuntersOrderUnlocked = (state: GameState, unlocked: boolean) => { if (unlocked) state.progress.bossKillsByBoss['corrupted-greatbear'] = Math.max(1, state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0); else delete state.progress.bossKillsByBoss['corrupted-greatbear']; ensureHunterContractChoices(state) }
export const debugGrantHunterReputation = (state: GameState, amount: number) => { const order = state.progress.huntersOrder; order.reputation = safeInt(order.reputation) + safeInt(amount); const rank = getHunterRank(order.reputation); if (rank.id !== order.rankId) pushNotification(state, `Hunter Rank raised to ${rank.name}.`, 'success'); order.rankId = rank.id }
export const debugGrantHunterMarks = (state: GameState, amount: number) => { state.progress.huntersOrder.hunterMarks = safeInt(state.progress.huntersOrder.hunterMarks) + safeInt(amount) }
export const debugCompleteActiveHunterContract = (state: GameState) => { const contract = state.progress.huntersOrder.activeContract; if (!contract) return false; for (let count = contract.progress; count < contract.target; count += 1) recordHunterKill(state, contract.targetMonsterId); return true }

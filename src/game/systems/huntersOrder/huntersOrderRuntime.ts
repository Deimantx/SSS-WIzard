import { BALANCE } from '../../core/balance/balance'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../content/monsters/huntersOrder'
import { HUNTER_RANKS } from '../../content/huntersOrder/hunterRanks'
import { HUNTER_UPGRADES } from '../../content/huntersOrder/hunterUpgrades'
import { MONSTERS, isBossMonster } from '../../content/monsters'
import { pushNotification } from '../../engine'
import type { DungeonId, GameState, HunterContractState, HunterContractTarget, HunterRankId, HunterUpgradeId, MonsterId } from '../../types'

const normalTargets = HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => MONSTERS[id]?.hunter?.exclusive && !isBossMonster(MONSTERS[id]))
const safeInt = (n: number) => Math.max(0, Math.floor(Number.isFinite(n) ? n : 0))
const orderFor = (state: Pick<GameState, 'progress'>) => state.progress.huntersOrder
const tierOrder = { routine: 0, special: 1, prestigious: 2 } as const
const requiredRankForTier = (tier: keyof typeof tierOrder): number => BALANCE.huntersOrder.tierMinimumReputation[tier]

export const isHuntersOrderUnlocked = (state: Pick<GameState, 'progress'>) => (state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0) > 0
export const getHunterRank = (reputation: number) => [...HUNTER_RANKS].reverse().find((rank) => reputation >= rank.reputation) ?? HUNTER_RANKS[0]

export const getHunterRankProgress = (reputation: number) => {
  const currentRank = getHunterRank(reputation)
  const nextRank = HUNTER_RANKS.find((rank) => rank.reputation > reputation) ?? null
  const span = nextRank ? nextRank.reputation - currentRank.reputation : 0
  return { currentRank, nextRank, progress: nextRank && span > 0 ? Math.max(0, Math.min(1, (reputation - currentRank.reputation) / span)) : 1 }
}

const nextHunterRandom = (state: Pick<GameState, 'progress'>) => {
  const order = orderFor(state)
  let value = safeInt(order.rngState) || 2654435769
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5
  order.rngState = value >>> 0
  return order.rngState / 0x100000000
}

export const doesMonsterMatchHunterContract = (contract: HunterContractState, monsterId: MonsterId, dungeonId: DungeonId | null | undefined): boolean => {
  const metadata = MONSTERS[monsterId]?.hunter
  if (!metadata?.exclusive) return false
  switch (contract.targetSpec.type) {
    case 'monster': return contract.targetSpec.monsterId === monsterId
    case 'boss': return contract.targetSpec.monsterId === monsterId && isBossMonster(MONSTERS[monsterId])
    case 'family': return metadata.family === contract.targetSpec.familyId
    case 'alignment': return metadata.alignment === contract.targetSpec.alignmentId
    case 'region': return dungeonId === contract.targetSpec.dungeonId && (DUNGEONS[dungeonId]?.monsterPool.includes(monsterId) === true || DUNGEONS[dungeonId]?.boss === monsterId)
  }
}

export type HunterAuthorizationFailure = 'order-locked' | 'contract-required' | 'contract-target-mismatch' | 'contract-tier-locked' | 'target-not-authorized'
export type HunterAuthorization = { authorized: true } | { authorized: false; reason: HunterAuthorizationFailure }
export const getHunterAuthorization = (state: Pick<GameState, 'progress'>, monsterId: MonsterId, dungeonId?: DungeonId | null): HunterAuthorization => {
  const metadata = MONSTERS[monsterId]?.hunter
  if (!metadata?.exclusive || !metadata.contractRequired) return { authorized: true }
  if (!isHuntersOrderUnlocked(state)) return { authorized: false, reason: 'order-locked' }
  const rank = getHunterRank(orderFor(state).reputation)
  const monsterTier = tierOrder[metadata.contractTier]
  if (rank.reputation < requiredRankForTier(metadata.contractTier)) return { authorized: false, reason: 'contract-tier-locked' }
  if (metadata.contractTier === 'prestigious' && isBossMonster(MONSTERS[monsterId]) && rank.id !== 'master-hunter') return { authorized: false, reason: 'contract-tier-locked' }
  const active = orderFor(state).activeContract
  if (!active) return { authorized: false, reason: 'contract-required' }
  const contractTier = tierOrder[active.tier]
  if (contractTier < monsterTier || rank.reputation < requiredRankForTier(active.tier)) return { authorized: false, reason: 'contract-tier-locked' }
  return doesMonsterMatchHunterContract(active, monsterId, dungeonId) ? { authorized: true } : { authorized: false, reason: 'contract-target-mismatch' }
}
export const canHuntMonster = (state: Pick<GameState, 'progress'>, monsterId: MonsterId, dungeonId?: DungeonId | null) => getHunterAuthorization(state, monsterId, dungeonId).authorized

const matchesSpec = (spec: HunterContractTarget, monsterId: MonsterId) => doesMonsterMatchHunterContract({ id: 'candidate', targetSpec: spec, target: 1, progress: 0, tier: 'routine', reputationReward: 0, marksReward: 0 }, monsterId, spec.type === 'region' ? spec.dungeonId : 'hunters-ground')
const eligibleMembers = (spec: HunterContractTarget) => HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => matchesSpec(spec, id) && (spec.type === 'boss' ? isBossMonster(MONSTERS[id]) : !isBossMonster(MONSTERS[id])))
const specKey = (spec: HunterContractTarget) => spec.type === 'region' ? `${spec.type}:${spec.dungeonId}` : `${spec.type}:${'monsterId' in spec ? spec.monsterId : 'familyId' in spec ? spec.familyId : spec.alignmentId}`
const rankIndex = (state: Pick<GameState, 'progress'>) => HUNTER_RANKS.findIndex((rank) => rank.id === getHunterRank(orderFor(state).reputation).id)
const makeTargetSpecs = (state: Pick<GameState, 'progress'>): HunterContractTarget[] => {
  const order = orderFor(state)
  const blocked = new Set(order.blockedTargets)
  const candidates: HunterContractTarget[] = normalTargets.filter((id) => !blocked.has(id)).map((monsterId) => ({ type: 'monster', monsterId }))
  const families = [...new Set(normalTargets.filter((id) => !blocked.has(id)).map((id) => MONSTERS[id].hunter!.family))]
  const alignments = [...new Set(normalTargets.filter((id) => !blocked.has(id)).map((id) => MONSTERS[id].hunter!.alignment))]
  const index = rankIndex(state)
  if (index >= 1) families.forEach((familyId) => candidates.push({ type: 'family', familyId }))
  if (index >= 2) alignments.forEach((alignmentId) => candidates.push({ type: 'alignment', alignmentId }))
  if (index >= 3) candidates.push({ type: 'region', dungeonId: 'hunters-ground' })
  if (index >= HUNTER_RANKS.length - 1 && MONSTERS['nightglass-alpha']?.hunter?.exclusive) candidates.push({ type: 'boss', monsterId: 'nightglass-alpha' })
  return candidates.filter((spec) => eligibleMembers(spec).some((id) => !blocked.has(id)))
}

const chooseQuality = (state: Pick<GameState, 'progress'>) => {
  const reputation = orderFor(state).reputation
  const weights = BALANCE.arcaneGuild.qualityWeights
  const choices = (['routine', 'special', 'prestigious'] as const).filter((tier) => reputation >= requiredRankForTier(tier))
  const total = choices.reduce((sum, tier) => sum + weights[tier], 0)
  let roll = nextHunterRandom(state) * total
  for (const tier of choices) { roll -= weights[tier]; if (roll < 0) return tier }
  return 'routine' as const
}

export const generateHunterContractChoices = (state: Pick<GameState, 'progress'>): HunterContractState[] => {
  const order = orderFor(state)
  if (!isHuntersOrderUnlocked(state)) return []
  const pool = makeTargetSpecs(state)
  const selected: HunterContractState[] = []
  const seen = new Set<string>()
  const count = Math.min(3, pool.length)
  for (let index = 0; index < count; index += 1) {
    const available = pool.filter((spec) => !seen.has(specKey(spec)))
    if (!available.length) break
    const spec = available[Math.floor(nextHunterRandom(state) * available.length)]
    const quality = spec.type === 'boss' ? 'prestigious' : chooseQuality(state)
    const range = BALANCE.huntersOrder.targetRanges[quality]
    const baseTarget = range[0] + Math.floor(nextHunterRandom(state) * (range[1] - range[0] + 1))
    const target = Math.max(1, baseTarget - (order.purchasedUpgrades['trail-kit'] ?? 0))
    const members = eligibleMembers(spec)
    const primary = 'monsterId' in spec ? spec.monsterId : members[0]
    const rewardMultiplier = BALANCE.huntersOrder.reputationMultipliers[quality]
    const reward = Math.round(target * BALANCE.huntersOrder.reputationPerKill * rewardMultiplier)
    const serial = order.generationCount * 3 + index
    selected.push({ id: `hunt-${serial}-${specKey(spec)}`, targetSpec: spec, target, progress: 0, tier: quality, reputationReward: reward, marksReward: BALANCE.huntersOrder.markRewards[quality] })
    seen.add(specKey(spec))
  }
  return selected
}

export const ensureHunterContractChoices = (state: GameState) => {
  if (!isHuntersOrderUnlocked(state) || state.progress.huntersOrder.availableContracts.length > 0) return
  state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
}

export const acceptHunterContract = (state: GameState, contractId: string) => {
  const order = state.progress.huntersOrder
  if (!isHuntersOrderUnlocked(state) || order.activeContract) return false
  const selected = order.availableContracts.find((contract) => contract.id === contractId)
  if (!selected || !eligibleMembers(selected.targetSpec).length) return false
  order.activeContract = { ...selected, targetSpec: { ...selected.targetSpec } }
  order.totalContractsAccepted = safeInt(order.totalContractsAccepted) + 1
  order.availableContracts = order.availableContracts.filter((contract) => contract.id !== contractId)
  const label = getHunterContractTargetLabel(selected)
  pushNotification(state, `Hunt Contract accepted: ${label}.`, 'info')
  return true
}

export const getHunterContractTargetLabel = (contract: HunterContractState) => {
  const spec = contract.targetSpec
  if ('monsterId' in spec) return MONSTERS[spec.monsterId]?.name ?? 'Unknown target'
  if (spec.type === 'family') return `${spec.familyId} family`
  if (spec.type === 'alignment') return `${spec.alignmentId} alignment`
  return DUNGEONS[spec.dungeonId]?.name ?? 'Unknown region'
}

export const getHunterBlockSlotCount = (state: Pick<GameState, 'progress'>) => BALANCE.huntersOrder.baseBlockSlots + (orderFor(state).purchasedUpgrades['extended-trails'] ?? 0)

export const recordHunterKill = (state: GameState, monsterId: MonsterId, dungeonId = state.combat.dungeonId) => {
  const order = state.progress.huntersOrder
  if (!HUNTER_EXCLUSIVE_MONSTER_IDS.includes(monsterId)) return false
  order.totalHunterKills = safeInt(order.totalHunterKills) + 1
  const stats = order.monsterHunterStats[monsterId] ??= { contractKills: 0, contractsCompleted: 0, marksEarned: 0 }
  const contract = order.activeContract
  if (!contract || !doesMonsterMatchHunterContract(contract, monsterId, dungeonId)) return false
  contract.progress = Math.min(contract.target, contract.progress + 1)
  stats.contractKills += 1
  if (contract.progress < contract.target) return true
  const reputationReward = Math.round(contract.reputationReward * (1 + BALANCE.huntersOrder.markedQuarryBonusPerRank * (order.purchasedUpgrades['marked-quarry'] ?? 0)))
  order.reputation = safeInt(order.reputation) + reputationReward
  order.hunterMarks = safeInt(order.hunterMarks) + contract.marksReward + BALANCE.huntersOrder.deepPocketsMarksPerRank * (order.purchasedUpgrades['deep-pockets'] ?? 0)
  order.totalContractsCompleted = safeInt(order.totalContractsCompleted) + 1
  stats.contractsCompleted += 1
  stats.marksEarned += contract.marksReward + BALANCE.huntersOrder.deepPocketsMarksPerRank * (order.purchasedUpgrades['deep-pockets'] ?? 0)
  const nextRank = getHunterRank(order.reputation)
  if (nextRank.id !== order.rankId) { order.rankId = nextRank.id; pushNotification(state, `Hunter Rank raised to ${nextRank.name}.`, 'success') }
  order.activeContract = null
  order.generationCount += 1
  order.availableContracts = generateHunterContractChoices(state)
  pushNotification(state, `Hunt Contract complete - +${reputationReward} Reputation - +${contract.marksReward} Hunter Marks.`, 'success')
  return true
}

export const skipHunterContract = (state: GameState) => {
  const order = state.progress.huntersOrder
  const cost = BALANCE.huntersOrder.skipMarkCost
  if (!order.activeContract || order.hunterMarks < cost) return false
  order.hunterMarks -= cost
  order.activeContract = null
  order.generationCount += 1
  order.availableContracts = generateHunterContractChoices(state)
  pushNotification(state, `Hunt Contract skipped - ${cost} Hunter Marks spent.`, 'info')
  return true
}

export const rerollHunterContracts = (state: GameState) => {
  const order = state.progress.huntersOrder
  const cost = BALANCE.huntersOrder.rerollMarkCost
  if (!isHuntersOrderUnlocked(state) || order.hunterMarks < cost) return false
  order.hunterMarks -= cost
  order.generationCount += 1
  order.availableContracts = generateHunterContractChoices(state)
  pushNotification(state, `Hunt Contract board refreshed - ${cost} Hunter Mark spent.`, 'info')
  return true
}

export const setHunterTargetBlocked = (state: GameState, monsterId: MonsterId, blocked: boolean) => {
  const order = state.progress.huntersOrder
  if (!normalTargets.includes(monsterId)) return false
  const blockedTargets = order.blockedTargets
  const exists = blockedTargets.includes(monsterId)
  if (exists === blocked) return false
  if (!blocked) order.blockedTargets = blockedTargets.filter((id) => id !== monsterId)
  else {
    if (blockedTargets.length >= getHunterBlockSlotCount(state)) return false
    if (order.activeContract && doesMonsterMatchHunterContract(order.activeContract, monsterId, 'hunters-ground')) return false
    if (normalTargets.filter((id) => id !== monsterId && !blockedTargets.includes(id)).length < 1) return false
    order.blockedTargets = [...blockedTargets, monsterId]
  }
  order.availableContracts = generateHunterContractChoices(state)
  return true
}

export const purchaseHunterUpgrade = (state: GameState, upgradeId: HunterUpgradeId | string) => {
  const order = state.progress.huntersOrder
  const upgrade = HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade) return false
  const currentRank = order.purchasedUpgrades[upgrade.id] ?? 0
  if (currentRank >= upgrade.maxRank) return false
  const cost = upgrade.markCosts[currentRank]
  if (cost === undefined || order.hunterMarks < cost) return false
  order.hunterMarks -= cost
  order.purchasedUpgrades[upgrade.id] = currentRank + 1
  order.availableContracts = generateHunterContractChoices(state)
  pushNotification(state, `${upgrade.name} rank ${currentRank + 1} unlocked.`, 'success')
  return true
}

export const normalizeHuntersOrderProgress = (state: GameState) => {
  const order = state.progress.huntersOrder
  order.reputation = safeInt(order.reputation); order.hunterMarks = safeInt(order.hunterMarks)
  order.totalContractsAccepted = safeInt(order.totalContractsAccepted); order.totalContractsCompleted = safeInt(order.totalContractsCompleted)
  order.totalHunterKills = safeInt(order.totalHunterKills); order.generationCount = safeInt(order.generationCount)
  order.rngState = safeInt(order.rngState) || 2654435769
  order.blockedTargets = order.blockedTargets.filter((id) => normalTargets.includes(id)).slice(0, getHunterBlockSlotCount(state))
  order.rankId = getHunterRank(order.reputation).id
  ensureHunterContractChoices(state)
  return order
}

export const debugSetHuntersOrderUnlocked = (state: GameState, unlocked: boolean) => { if (unlocked) state.progress.bossKillsByBoss['corrupted-greatbear'] = Math.max(1, state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0); else delete state.progress.bossKillsByBoss['corrupted-greatbear']; ensureHunterContractChoices(state) }
export const debugGrantHunterReputation = (state: GameState, amount: number) => { const order = state.progress.huntersOrder; order.reputation = safeInt(order.reputation) + safeInt(amount); const rank = getHunterRank(order.reputation); if (rank.id !== order.rankId) pushNotification(state, `Hunter Rank raised to ${rank.name}.`, 'success'); order.rankId = rank.id }
export const debugGrantHunterMarks = (state: GameState, amount: number) => { state.progress.huntersOrder.hunterMarks = safeInt(state.progress.huntersOrder.hunterMarks) + safeInt(amount) }
export const debugCompleteActiveHunterContract = (state: GameState) => {
  const contract = state.progress.huntersOrder.activeContract
  if (!contract) return false
  const monsterId = eligibleMembers(contract.targetSpec)[0]
  if (!monsterId) return false
  for (let count = contract.progress; count < contract.target; count += 1) recordHunterKill(state, monsterId, 'hunters-ground')
  return true
}
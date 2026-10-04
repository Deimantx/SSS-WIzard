import { BALANCE } from '../../core/balance/balance'
import { COMBAT_LOCATIONS, isCombatLocationUnlocked } from '../../content/combat-locations/worldNavigation'
import type { ResonanceType } from '../../content/resonance/resonance'
import { HUNTER_RANKS } from '../../content/hunters-order/hunterRanks'
import { HUNTER_STANDINGS } from '../../content/hunters-order/hunterRanks'
import { HUNTER_GROUNDS, getHunterGround } from '../../content/hunters-order/hunterGrounds'
import { HUNTER_UPGRADES } from '../../content/hunters-order/hunterUpgrades'
import { HUNTER_EXCLUSIVE_MONSTER_IDS, HUNTER_REGULAR_MONSTER_IDS, MONSTERS, isBossMonster } from '../../content/monsters'
import { pushNotification } from '../../engine'
import { grantItem } from '../inventory/itemAcquisition'
import { grantResonance } from '../resonance/resonanceRuntime'
import type { CombatLocationId, GameState, HunterContractState, HunterContractTarget, HunterRankId, HunterUpgradeId, MonsterId } from '../../types'

const normalTargets = HUNTER_REGULAR_MONSTER_IDS.filter((id) => MONSTERS[id]?.hunter?.exclusive)
const starterTargets = normalTargets.filter((id) => MONSTERS[id]?.hunter?.contractTier === 'routine' && !MONSTERS[id]?.hunter?.minimumRank)
const safeInt = (n: number) => Math.max(0, Math.floor(Number.isFinite(n) ? n : 0))
const orderFor = (state: Pick<GameState, 'progress'>) => state.progress.huntersOrder
const tierOrder = { routine: 0, special: 1, prestigious: 2 } as const
const requiredRankForTier = (tier: keyof typeof tierOrder): number => BALANCE.huntersOrder.tierMinimumReputation[tier]

export const isHuntersOrderUnlocked = (state: Pick<GameState, 'progress'>) => (state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0) > 0
export const getHunterRank = (reputation: number) => [...HUNTER_RANKS].reverse().find((rank) => reputation >= rank.reputation) ?? HUNTER_RANKS[0]
export const getHunterStanding = (reputation: number) => [...HUNTER_STANDINGS].reverse().find((standing) => reputation >= standing.reputation) ?? HUNTER_STANDINGS[0]
export const getHunterStandingProgress = (reputation: number) => {
  const currentStanding = getHunterStanding(reputation)
  const nextStanding = HUNTER_STANDINGS.find((standing) => standing.reputation > reputation) ?? null
  const span = nextStanding ? nextStanding.reputation - currentStanding.reputation : 0
  return { currentStanding, nextStanding, progress: nextStanding && span > 0 ? Math.max(0, Math.min(1, (reputation - currentStanding.reputation) / span)) : 1 }
}
export const isHunterRankAtLeast = (current: string, required: string, ranks: readonly { id: string }[] = HUNTER_RANKS) => {
  const currentIndex = ranks.findIndex((rank) => rank.id === current)
  const requiredIndex = ranks.findIndex((rank) => rank.id === required)
  return currentIndex >= 0 && requiredIndex >= 0 && currentIndex >= requiredIndex
}
export const isHunterMonsterRankEligible = (state: Pick<GameState, 'progress'>, monsterId: MonsterId) => {
  const minimumRank = MONSTERS[monsterId]?.hunter?.minimumRank
  return !minimumRank || isHunterRankAtLeast(getHunterRank(orderFor(state).reputation).id, minimumRank)
}

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

export const doesMonsterMatchHunterContract = (contract: HunterContractState, monsterId: MonsterId, locationId: CombatLocationId | null | undefined): boolean => {
  const metadata = MONSTERS[monsterId]?.hunter
  if (!metadata?.exclusive) return false
  if (metadata.huntingGroundId !== (contract.huntingGroundId ?? 'hunters-ground')) return false
  switch (contract.targetSpec.type) {
    case 'monster': return contract.targetSpec.monsterId === monsterId
    case 'boss': return contract.targetSpec.monsterId === monsterId && isBossMonster(MONSTERS[monsterId])
    case 'family': return metadata.family === contract.targetSpec.familyId
    case 'alignment': return metadata.alignment === contract.targetSpec.alignmentId
    case 'ground': return locationId === contract.targetSpec.groundId && (COMBAT_LOCATIONS[locationId]?.monsterPool.includes(monsterId) === true || COMBAT_LOCATIONS[locationId]?.boss === monsterId)
  }
}

export type HunterAuthorizationFailure = 'order-locked' | 'contract-required' | 'contract-target-mismatch' | 'contract-tier-locked' | 'target-not-authorized'
export type HunterAuthorization = { authorized: true } | { authorized: false; reason: HunterAuthorizationFailure }
export const getHunterAuthorizationMessage = (authorization: HunterAuthorization, targetName?: string) => {
  if (authorization.authorized) return ''
  const messages: Record<HunterAuthorizationFailure, string> = {
    'order-locked': 'Unlock Hunter’s Order before hunting this creature.',
    'contract-required': 'Accept a Hunt Contract before engaging this creature.',
    'contract-target-mismatch': 'Your active Hunt Contract does not authorize this target.',
    'contract-tier-locked': 'Your Hunter Rank does not authorize this contract tier.',
    'target-not-authorized': `${targetName ?? 'This creature'} is not authorized for the active Hunt Contract.`,
  }
  return messages[authorization.reason]
}
export const getMinimumContractTierForMonster = (monsterId: MonsterId): HunterContractState['tier'] => MONSTERS[monsterId]?.hunter?.contractTier ?? 'routine'
const meetsContractTier = (contractTier: HunterContractState['tier'], monsterId: MonsterId) => tierOrder[contractTier] >= tierOrder[getMinimumContractTierForMonster(monsterId)]

const getUpgradeRankCount = (state: Pick<GameState, 'progress'>, effectType: string) => HUNTER_UPGRADES.reduce((sum, upgrade) => {
  if (upgrade.effect.type !== effectType) return sum
  const rank = Math.min(upgrade.maxRank, safeInt(orderFor(state).purchasedUpgrades[upgrade.id] ?? 0))
  const effect = upgrade.effect
  return sum + (effect.rankAmounts ? effect.rankAmounts.slice(0, rank).reduce((total, amount) => total + amount, 0) : rank * (effect.amount ?? 0))
}, 0)
const getOwnedUpgradeRank = (state: Pick<GameState, 'progress'>, id: string) => Math.min(HUNTER_UPGRADES.find((entry) => entry.id === id)?.maxRank ?? 0, safeInt(orderFor(state).purchasedUpgrades[id] ?? 0))
export const getHunterContractTargetReduction = (state: Pick<GameState, 'progress'>, type: HunterContractTarget['type'], tier: HunterContractState['tier']) => {
  const idsByType: Partial<Record<HunterContractTarget['type'], string>> = { monster: 'exact-quarry-briefing', family: 'family-cull-orders', alignment: 'alignment-pursuit-orders', ground: 'ground-patrol-orders' }
  const base = getOwnedUpgradeRank(state, 'trail-kit') * 0.02
    + getOwnedUpgradeRank(state, idsByType[type] ?? '') * 0.02
    + (tier === 'prestigious' ? getOwnedUpgradeRank(state, 'prestigious-preparation') * 0.02 : 0)
  return Math.min(0.25, base)
}
export const getHunterContractBoardSlotCount = (state: Pick<GameState, 'progress'>) => {
  const standing = getHunterStanding(orderFor(state).reputation)
  return standing.reputation >= 2350 ? 3 : standing.reputation >= 500 ? 2 : 1
}
export const isHunterContractBoardUnlocked = (state: Pick<GameState, 'progress'>) => getHunterStanding(orderFor(state).reputation).reputation >= 500
export const getHunterContractChoiceCount = (state: Pick<GameState, 'progress'>) => isHunterContractBoardUnlocked(state) ? getHunterContractBoardSlotCount(state) : 0
export const getHunterRerollMarkCost = (state: Pick<GameState, 'progress'>) => Math.max(1, BALANCE.huntersOrder.rerollMarkCost - getUpgradeRankCount(state, 'reroll-cost-reduction'))
export const getHunterSkipMarkCost = (state: Pick<GameState, 'progress'>) => Math.max(1, BALANCE.huntersOrder.skipMarkCost - getUpgradeRankCount(state, 'skip-cost-reduction'))

export const getHunterUpgradePurchaseStatus = (state: Pick<GameState, 'progress'>, upgradeId: HunterUpgradeId | string) => {
  const upgrade = HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade) return { upgrade: null, ownedRank: 0, cost: null, currentRank: getHunterRank(orderFor(state).reputation), requiredRank: null, canPurchase: false, reason: 'unknown-upgrade' as const }
  const ownedRank = Math.min(upgrade.maxRank, safeInt(orderFor(state).purchasedUpgrades[upgrade.id] ?? 0))
  const cost = upgrade.markCosts[ownedRank] ?? null
  const currentRank = getHunterRank(orderFor(state).reputation)
  const currentStanding = getHunterStanding(orderFor(state).reputation)
  const requiredStanding = HUNTER_STANDINGS.find((standing) => standing.id === upgrade.requiredStanding) ?? HUNTER_STANDINGS[0]
  const requiredRank = HUNTER_RANKS.find((rank) => rank.id === requiredStanding.rankId) ?? HUNTER_RANKS[0]
  const hasRequiredRank = currentStanding.reputation >= requiredStanding.reputation
  const hiddenUntilMultipleGrounds = (upgrade.id === 'ground-survey' || upgrade.id === 'priority-dispatch') && HUNTER_GROUNDS.filter((ground) => ground.enabled && isCombatLocationUnlocked(ground.id, state.progress)).length < 2
  const reason = ownedRank >= upgrade.maxRank ? 'max-rank' as const : !hasRequiredRank ? 'rank-required' as const : hiddenUntilMultipleGrounds ? 'ground-required' as const : cost === null || orderFor(state).hunterMarks < cost ? 'marks-required' as const : null
  return { upgrade, ownedRank, cost, currentRank, currentStanding, requiredRank, requiredStanding, canPurchase: reason === null, reason }
}
const getHunterAuthorizationForContract = (state: Pick<GameState, 'progress'>, monsterId: MonsterId, locationId: CombatLocationId | null | undefined, active: HunterContractState | null): HunterAuthorization => {
  const metadata = MONSTERS[monsterId]?.hunter
  if (!metadata?.exclusive || !metadata.contractRequired) return { authorized: true }
  if (!isHuntersOrderUnlocked(state)) return { authorized: false, reason: 'order-locked' }
  const rank = getHunterRank(orderFor(state).reputation)
  if (metadata.minimumRank && !isHunterRankAtLeast(rank.id, metadata.minimumRank)) return { authorized: false, reason: 'contract-tier-locked' }
  if (!active) return { authorized: false, reason: 'contract-required' }
  if (!meetsContractTier(active.tier, monsterId) || rank.reputation < requiredRankForTier(active.tier)) return { authorized: false, reason: 'contract-tier-locked' }
  if (isBossMonster(MONSTERS[monsterId]) && active.targetSpec.type !== 'boss') return { authorized: false, reason: 'contract-target-mismatch' }
  return doesMonsterMatchHunterContract(active, monsterId, locationId) ? { authorized: true } : { authorized: false, reason: 'contract-target-mismatch' }
}
export const getHunterAuthorization = (state: Pick<GameState, 'progress'>, monsterId: MonsterId, locationId?: CombatLocationId | null): HunterAuthorization => getHunterAuthorizationForContract(state, monsterId, locationId, orderFor(state).activeContract)
export const canHuntMonster = (state: Pick<GameState, 'progress'>, monsterId: MonsterId, locationId?: CombatLocationId | null) => getHunterAuthorization(state, monsterId, locationId).authorized

/** Canonical set of creatures whose kills can advance this assignment in the supplied location. */
export const getEligibleHunterContractMembers = (state: Pick<GameState, 'progress'>, contract: HunterContractState, locationId: CombatLocationId): MonsterId[] => {
  if (locationId !== (contract.huntingGroundId ?? 'hunters-ground')) return []
  const dungeon = COMBAT_LOCATIONS[locationId]
  if (!dungeon) return []
  const roster = [...dungeon.monsterPool, ...(dungeon.boss ? [dungeon.boss] : [])]
  const blocked = new Set(orderFor(state).blockedTargets)
  return roster.filter((monsterId) => !blocked.has(monsterId)
    && doesMonsterMatchHunterContract(contract, monsterId, locationId)
    && getHunterAuthorizationForContract(state, monsterId, locationId, contract).authorized) as MonsterId[]
}

const matchesSpec = (spec: HunterContractTarget, monsterId: MonsterId, groundId: CombatLocationId) => doesMonsterMatchHunterContract({ id: 'candidate', huntingGroundId: groundId, targetSpec: spec, target: 1, progress: 0, tier: 'routine', reputationReward: 0, marksReward: 0 }, monsterId, groundId)
const eligibleMembers = (spec: HunterContractTarget, groundId: CombatLocationId) => {
  const dungeon = COMBAT_LOCATIONS[groundId]
  return [...(dungeon?.monsterPool ?? []), ...(dungeon?.boss ? [dungeon.boss] : [])].filter((id) => matchesSpec(spec, id, groundId) && (spec.type === 'boss' ? isBossMonster(MONSTERS[id]) : !isBossMonster(MONSTERS[id]))) as MonsterId[]
}
const specKey = (spec: HunterContractTarget, groundId: CombatLocationId) => `${groundId}:${spec.type}:${'monsterId' in spec ? spec.monsterId : 'familyId' in spec ? spec.familyId : 'alignmentId' in spec ? spec.alignmentId : spec.groundId}`
const rankIndex = (state: Pick<GameState, 'progress'>) => HUNTER_RANKS.findIndex((rank) => rank.id === getHunterRank(orderFor(state).reputation).id)
type GroundTargetSpec = { spec: HunterContractTarget; groundId: CombatLocationId }
const makeTargetSpecs = (state: Pick<GameState, 'progress'>): GroundTargetSpec[] => {
  const order = orderFor(state)
  const blocked = new Set(order.blockedTargets)
  const candidates: GroundTargetSpec[] = []
  const index = rankIndex(state)
  for (const ground of HUNTER_GROUNDS.filter((entry) => entry.enabled && isCombatLocationUnlocked(entry.id, state.progress) && HUNTER_STANDINGS.findIndex((standing) => standing.id === getHunterStanding(order.reputation).id) >= HUNTER_STANDINGS.findIndex((standing) => standing.id === entry.minimumStandingId))) {
    const dungeon = COMBAT_LOCATIONS[ground.id]
    const targets = [...(dungeon?.monsterPool ?? []), ...(dungeon?.boss ? [dungeon.boss] : [])].filter((id) => isHunterMonsterRankEligible(state, id))
    const specs: HunterContractTarget[] = targets.filter((id) => !blocked.has(id)).map((monsterId) => ({ type: 'monster', monsterId }))
    const families = [...new Set(targets.filter((id) => !blocked.has(id)).map((id) => MONSTERS[id].hunter?.family).filter((value): value is string => Boolean(value)))]
    const alignments = [...new Set(targets.filter((id) => !blocked.has(id)).map((id) => MONSTERS[id].hunter?.alignment).filter((value): value is string => Boolean(value)))]
    if (index >= 1) families.forEach((familyId) => specs.push({ type: 'family', familyId }))
    if (index >= 2) alignments.forEach((alignmentId) => specs.push({ type: 'alignment', alignmentId }))
    if (index >= 3) specs.push({ type: 'ground', groundId: ground.id })
    specs.filter((spec) => eligibleMembers(spec, ground.id).some((id) => !blocked.has(id))).forEach((spec) => candidates.push({ spec, groundId: ground.id }))
  }
  return candidates
}

const chooseQuality = (state: Pick<GameState, 'progress'>, availableTypes: ReadonlySet<HunterContractTarget['type']>, forcedTier?: HunterContractState['tier'], minimumTier: HunterContractState['tier'] = 'routine') => {
  const reputation = orderFor(state).reputation
  const weights = BALANCE.huntersOrder.qualityWeights
  const choices = (['routine', 'special', 'prestigious'] as const).filter((tier) => tierOrder[tier] >= tierOrder[minimumTier] && reputation >= requiredRankForTier(tier) && archetypesByTier[tier].some((type) => availableTypes.has(type)))
  if (forcedTier) return choices.includes(forcedTier) ? forcedTier : null
  const total = choices.reduce((sum, tier) => sum + weights[tier], 0)
  let roll = nextHunterRandom(state) * total
  for (const tier of choices) { roll -= weights[tier]; if (roll < 0) return tier }
  return 'routine' as const
}

const archetypesByTier: Record<HunterContractState['tier'], readonly HunterContractTarget['type'][]> = {
  routine: ['monster', 'family'],
  special: ['monster', 'family', 'alignment', 'ground'],
  prestigious: ['monster', 'family', 'alignment', 'ground', 'boss'],
}

const chooseWeightedTargetSpec = (state: Pick<GameState, 'progress'>, available: GroundTargetSpec[], selectedGrounds: readonly CombatLocationId[], choiceCount: number) => {
  const weights = BALANCE.huntersOrder.archetypeWeights
  const preferred = orderFor(state).preferredContractType
  const preferredWeight = preferred && getOwnedUpgradeRank(state, 'dispatch-directives') >= 2 ? 2 : 1
  const grouped = new Map<HunterContractTarget['type'], GroundTargetSpec[]>()
  available.forEach((candidate) => grouped.set(candidate.spec.type, [...(grouped.get(candidate.spec.type) ?? []), candidate]))
  const eligibleTypes = [...grouped.entries()].filter(([type]) => weights[type] > 0)
  const weightFor = (type: HunterContractTarget['type']) => weights[type] * (type === preferred ? preferredWeight : 1)
  const totalWeight = eligibleTypes.reduce((sum, [type]) => sum + weightFor(type), 0)
  if (totalWeight <= 0) return available[Math.floor(nextHunterRandom(state) * available.length)]
  let roll = nextHunterRandom(state) * totalWeight
  for (const [type, specs] of eligibleTypes) {
    roll -= weightFor(type)
    if (roll < 0) {
      const order = orderFor(state)
      const surveyRank = getOwnedUpgradeRank(state, 'ground-survey')
      const distinctGrounds = [...new Set(specs.map((candidate) => candidate.groundId))]
      const hasUnrepresentedGround = available.some((candidate) => !selectedGrounds.includes(candidate.groundId))
      const weightsByGround = new Map(distinctGrounds.map((groundId) => {
        const definition = getHunterGround(groundId)
        let groundWeight = definition?.boardWeight ?? 1
        if (order.preferredHuntingGroundId === groundId && getOwnedUpgradeRank(state, 'priority-dispatch') >= 2) groundWeight *= 2
        if (surveyRank === 1 && hasUnrepresentedGround && !selectedGrounds.includes(groundId)) groundWeight *= 1000
        if (surveyRank === 2 && choiceCount >= 3 && new Set(selectedGrounds).size < 2 && !selectedGrounds.includes(groundId)) groundWeight *= 1000
        if (surveyRank >= 3) groundWeight /= 1 + selectedGrounds.filter((selected) => selected === groundId).length
        return [groundId, groundWeight] as const
      }))
      const totalGroundWeight = [...weightsByGround.values()].reduce((sum, weight) => sum + weight, 0)
      let groundRoll = nextHunterRandom(state) * totalGroundWeight
      let chosenGround = distinctGrounds[distinctGrounds.length - 1]!
      for (const groundId of distinctGrounds) { groundRoll -= weightsByGround.get(groundId) ?? 0; if (groundRoll < 0) { chosenGround = groundId; break } }
      const groundSpecs = specs.filter((candidate) => candidate.groundId === chosenGround)
      return groundSpecs[Math.floor(nextHunterRandom(state) * groundSpecs.length)]
    }
  }
  const fallback = eligibleTypes[eligibleTypes.length - 1]?.[1] ?? available
  return fallback[Math.floor(nextHunterRandom(state) * fallback.length)]
}

export interface HunterContractGenerationOptions { archetype?: HunterContractTarget['type']; tier?: HunterContractState['tier']; monsterId?: MonsterId; fixtureChoiceCount?: 1 | 2 | 3; huntingGroundId?: CombatLocationId }
export const generateHunterContractChoices = (state: Pick<GameState, 'progress'>, options: HunterContractGenerationOptions = {}): HunterContractState[] => {
  const order = orderFor(state)
  if (!isHuntersOrderUnlocked(state) || (!isHunterContractBoardUnlocked(state) && !options.fixtureChoiceCount)) return []
  const pool = makeTargetSpecs(state).filter(({ spec, groundId }) => (!options.archetype || spec.type === options.archetype) && (!options.monsterId || spec.type === 'monster' && spec.monsterId === options.monsterId) && (!options.huntingGroundId || groundId === options.huntingGroundId))
  const selected: HunterContractState[] = []
  const seen = new Set<string>()
  const count = Math.min(options.fixtureChoiceCount ?? getHunterContractChoiceCount(state), pool.length)
  for (let index = 0; index < count; index += 1) {
    const unselected = pool.filter(({ spec, groundId }) => !seen.has(specKey(spec, groundId)))
    const exactTarget = unselected.find(({ spec }) => spec.type === 'monster')?.spec
    const minimumTier = options.monsterId && exactTarget?.type === 'monster' ? getMinimumContractTierForMonster(exactTarget.monsterId) : 'routine'
    const preferredTypeCandidates = order.preferredContractType ? unselected.filter(({ spec }) => spec.type === order.preferredContractType) : []
    const preferredGroundCandidates = order.preferredHuntingGroundId ? unselected.filter(({ groundId }) => groundId === order.preferredHuntingGroundId) : []
    const forcePreferredType = selected.length === 0 && getOwnedUpgradeRank(state, 'dispatch-directives') >= 3 && preferredTypeCandidates.length > 0
    const forcePreferredGround = selected.length === 0 && getOwnedUpgradeRank(state, 'priority-dispatch') >= 3 && preferredGroundCandidates.length > 0
    const preferredCandidates = forcePreferredType ? preferredTypeCandidates : forcePreferredGround ? preferredGroundCandidates : unselected
    const quality = chooseQuality(state, new Set(preferredCandidates.map(({ spec }) => spec.type)), options.tier, minimumTier)
    if (!quality) break
    const allowedTypes = archetypesByTier[quality]
    const available = preferredCandidates.filter(({ spec }) => allowedTypes.includes(spec.type)
      && (spec.type !== 'monster' || meetsContractTier(quality, spec.monsterId)))
    if (!available.length) break
    const candidate = chooseWeightedTargetSpec(state, available, selected.map((offer) => offer.huntingGroundId ?? 'hunters-ground'), count)
    const { spec, groundId } = candidate
    const tierRanges = spec.type === 'boss'
      ? BALANCE.huntersOrder.bossTargetRanges as Partial<Record<HunterContractState['tier'], readonly [number, number]>>
      : BALANCE.huntersOrder.targetRanges[spec.type] as Partial<Record<HunterContractState['tier'], readonly [number, number]>>
    const range = tierRanges[quality]
    if (!range) continue
    const baseTarget = range[0] + Math.floor(nextHunterRandom(state) * (range[1] - range[0] + 1))
    const target = spec.type === 'boss' ? baseTarget : Math.max(1, Math.ceil(baseTarget * (1 - getHunterContractTargetReduction(state, spec.type, quality))))
    const rewardMultiplier = BALANCE.huntersOrder.reputationMultipliers[quality]
    const reward = Math.round(target * BALANCE.huntersOrder.reputationPerKill * rewardMultiplier)
    selected.push({ id: `hunt-${order.generationCount}-${index}-${specKey(spec, groundId)}`, huntingGroundId: groundId, targetSpec: spec, target, progress: 0, tier: quality, reputationReward: reward, marksReward: BALANCE.huntersOrder.markRewards[quality] })
    seen.add(specKey(spec, groundId))
  }
  return selected
}

const randomStarterTarget = (state: Pick<GameState, 'progress'>): HunterContractState => {
  const order = orderFor(state)
  const monsterId = starterTargets[Math.floor(nextHunterRandom(state) * starterTargets.length)]
  const [min, max] = BALANCE.huntersOrder.starterTargetRange
  const target = min + Math.floor(nextHunterRandom(state) * (max - min + 1))
  return {
    id: `hunt-starter-${order.generationCount}`,
    targetSpec: { type: 'monster', monsterId },
    huntingGroundId: (MONSTERS[monsterId]?.hunter?.huntingGroundId ?? 'hunters-ground') as CombatLocationId,
    target,
    progress: 0,
    tier: 'routine',
    reputationReward: target * BALANCE.huntersOrder.starterReputationPerKill,
    marksReward: BALANCE.huntersOrder.starterMarksReward,
  }
}

/** Issues the tutorial assignment from an explicit first-kill/recovery gameplay action. */
export const issueFirstHunterContract = (state: GameState) => {
  const order = state.progress.huntersOrder
  if (!isHuntersOrderUnlocked(state) || order.activeContract || safeInt(order.totalContractsAccepted) !== 0) return false
  order.activeContract = randomStarterTarget(state)
  order.totalContractsAccepted = 1
  order.availableContracts = []
  pushNotification(state, `First Hunt Assignment: ${getHunterContractTargetLabel(order.activeContract)}.`, 'success')
  return true
}

/** Tracker receives one free routine assignment at a time, without a choice board. */
export const requestHunterAssignment = (state: GameState) => {
  const order = state.progress.huntersOrder
  if (!isHuntersOrderUnlocked(state) || isHunterContractBoardUnlocked(state) || order.activeContract || safeInt(order.totalContractsAccepted) === 0) return false
  const contract = randomStarterTarget(state)
  order.activeContract = { ...contract, id: `hunt-tracker-${order.generationCount}` }
  order.totalContractsAccepted = safeInt(order.totalContractsAccepted) + 1
  order.generationCount += 1
  order.availableContracts = []
  pushNotification(state, `Hunt Assignment received: ${getHunterContractTargetLabel(contract)}.`, 'info')
  return true
}

/** A blank Scout+ board is repaired only after the player explicitly requests it. */
export const requestHunterContractBoard = (state: GameState) => {
  const order = state.progress.huntersOrder
  if (!isHuntersOrderUnlocked(state) || !isHunterContractBoardUnlocked(state) || order.activeContract || order.availableContracts.length) return false
  order.generationCount += 1
  order.availableContracts = generateHunterContractChoices(state)
  return order.availableContracts.length > 0
}

export const getHunterBlockableTargets = (state: Pick<GameState, 'progress'>) => normalTargets.filter((id) => isHunterMonsterRankEligible(state, id))

export const acceptHunterContract = (state: GameState, contractId: string) => {
  const order = state.progress.huntersOrder
  if (!isHuntersOrderUnlocked(state) || order.activeContract) return false
  const selected = order.availableContracts.find((contract) => contract.id === contractId)
  if (!selected || !getEligibleHunterContractMembers(state, selected, selected.huntingGroundId ?? 'hunters-ground').length) return false
  order.activeContract = { ...selected, targetSpec: { ...selected.targetSpec } }
  order.totalContractsAccepted = safeInt(order.totalContractsAccepted) + 1
  order.availableContracts = order.availableContracts.filter((contract) => contract.id !== contractId)
  order.pinnedContractIds = (order.pinnedContractIds ?? []).filter((id) => id !== contractId)
  const label = getHunterContractTargetLabel(selected)
  pushNotification(state, `Hunt Contract accepted: ${label}.`, 'info')
  return true
}

export const getHunterContractTargetLabel = (contract: HunterContractState) => {
  const spec = contract.targetSpec
  if ('monsterId' in spec) return MONSTERS[spec.monsterId]?.name ?? 'Unknown target'
  if (spec.type === 'family') return `${spec.familyId} family`
  if (spec.type === 'alignment') return `${spec.alignmentId} alignment`
  return COMBAT_LOCATIONS[spec.groundId]?.name ?? 'Unknown location'
}

export const getHunterBlockSlotCount = (state: Pick<GameState, 'progress'>) => BALANCE.huntersOrder.baseBlockSlots + (orderFor(state).purchasedUpgrades['extended-trails'] ?? 0)

export const getHunterUpgradeRank = (state: Pick<GameState, 'progress'>, id: string) => getOwnedUpgradeRank(state, id)
export const getHunterHarvestBonuses = (state: Pick<GameState, 'progress'>, monsterId: MonsterId, locationId: CombatLocationId | null | undefined) => {
  const contract = orderFor(state).activeContract
  const authorized = Boolean(contract && locationId && getEligibleHunterContractMembers(state, contract, locationId).includes(monsterId))
  return {
    authorized,
    resonanceMultiplier: authorized ? 1 + getOwnedUpgradeRank(state, 'resonant-claim') * 0.05 : 1,
    essenceMultiplier: authorized ? 1 + getOwnedUpgradeRank(state, 'essence-claim') * 0.05 : 1,
    itemDropMultiplier: authorized ? 1 + getOwnedUpgradeRank(state, 'fragment-rights') * 0.05 : 1,
    sigilDropMultiplier: authorized ? 1 + getOwnedUpgradeRank(state, 'sigil-claim') * 0.03 : 1,
  }
}

export const toggleHunterContractPin = (state: GameState, contractId: string) => {
  const order = state.progress.huntersOrder
  order.pinnedContractIds ??= []
  const maxPins = getOwnedUpgradeRank(state, 'pinned-orders')
  if (!order.availableContracts.some((contract) => contract.id === contractId) || maxPins <= 0) return false
  if (order.pinnedContractIds.includes(contractId)) { order.pinnedContractIds = order.pinnedContractIds.filter((id) => id !== contractId); return true }
  if (order.pinnedContractIds.length >= maxPins) return false
  order.pinnedContractIds.push(contractId)
  return true
}

export const setHunterPreferredContractType = (state: GameState, type: HunterContractTarget['type'] | null) => {
  if (getOwnedUpgradeRank(state, 'dispatch-directives') < 1) return false
  if (type && !['monster', 'family', 'alignment', 'ground'].includes(type)) return false
  state.progress.huntersOrder.preferredContractType = type
  return true
}
export const setHunterPreferredHuntingGround = (state: GameState, groundId: CombatLocationId | null) => {
  if (getOwnedUpgradeRank(state, 'priority-dispatch') < 1) return false
  if (groundId && (!getHunterGround(groundId) || !HUNTER_GROUNDS.find((ground) => ground.id === groundId)?.enabled || getHunterStanding(orderFor(state).reputation).reputation < (HUNTER_STANDINGS.find((standing) => standing.id === getHunterGround(groundId)?.minimumStandingId)?.reputation ?? Number.MAX_SAFE_INTEGER))) return false
  state.progress.huntersOrder.preferredHuntingGroundId = groundId
  return true
}
export const rememberHunterQuarry = (state: GameState, monsterId: MonsterId, groundId: CombatLocationId) => {
  if (getOwnedUpgradeRank(state, 'quarry-memory') <= 0) return false
  const contract = state.progress.huntersOrder.activeContract
  if (!contract || !getEligibleHunterContractMembers(state, contract, groundId).includes(monsterId)) return false
  state.progress.huntersOrder.lastSelectedQuarryByGround ??= {}
  state.progress.huntersOrder.lastSelectedQuarryByGround[groundId] = monsterId
  return true
}

export const recordHunterKill = (state: GameState, monsterId: MonsterId, locationId = state.combat.locationId) => {
  const order = state.progress.huntersOrder
  if (!HUNTER_EXCLUSIVE_MONSTER_IDS.includes(monsterId)) return false
  order.totalHunterKills = safeInt(order.totalHunterKills) + 1
  const stats = order.monsterHunterStats[monsterId] ??= { contractKills: 0, contractsCompleted: 0, marksEarned: 0 }
  const contract = order.activeContract
  if (!contract || !locationId || !getEligibleHunterContractMembers(state, contract, locationId).includes(monsterId)) return false
  contract.progress = Math.min(contract.target, contract.progress + 1)
  stats.contractKills += 1
  if (contract.progress < contract.target) return true
  const previousStanding = getHunterStanding(order.reputation)
  const qualityBonusId = contract.tier === 'routine' ? 'routine-commendation' : contract.tier === 'special' ? 'special-commendation' : 'prestige-recognition'
  const reputationMultiplier = 1 + getOwnedUpgradeRank(state, 'marked-quarry') * 0.08 + getOwnedUpgradeRank(state, qualityBonusId) * (contract.tier === 'routine' ? 0.05 : contract.tier === 'special' ? 0.07 : 0.10)
  const reputationReward = Math.round(contract.reputationReward * reputationMultiplier)
  const broad = ['family', 'alignment', 'ground'].includes(contract.targetSpec.type) ? getOwnedUpgradeRank(state, 'broad-assignment-pay') : 0
  const marksAwarded = contract.marksReward + getOwnedUpgradeRank(state, 'deep-pockets') + broad
  const rememberedOffers = order.availableContracts.filter((offer) => getEligibleHunterContractMembers(state, offer, offer.huntingGroundId ?? 'hunters-ground').length > 0)
  order.reputation = safeInt(order.reputation) + reputationReward
  order.hunterMarks = safeInt(order.hunterMarks) + marksAwarded
  order.totalContractsCompleted = safeInt(order.totalContractsCompleted) + 1
  stats.contractsCompleted += 1
  stats.marksEarned += marksAwarded
  const completionHarvest = getHunterCompletionHarvestPreview(state, contract, monsterId)
  if (completionHarvest.resonance) grantResonance(state.resonance, completionHarvest.resonance.type, completionHarvest.resonance.amount)
  if (completionHarvest.lifeEssence > 0) grantItem(state, 'life-essence', completionHarvest.lifeEssence)
  const nextRank = getHunterRank(order.reputation)
  const nextStanding = getHunterStanding(order.reputation)
  if (nextRank.id !== order.rankId) { order.rankId = nextRank.id; pushNotification(state, `Order Rank advanced to ${nextRank.name}.`, 'success') }
  if (nextStanding.id !== previousStanding.id) pushNotification(state, `Hunter Standing increased: ${nextStanding.name}.`, 'success')
  order.activeContract = null
  order.generationCount += 1
  if (isHunterContractBoardUnlocked(state)) {
    const recall = Math.min(getOwnedUpgradeRank(state, 'contract-recall'), Math.max(0, getHunterContractChoiceCount(state) - 1))
    const retained = rememberedOffers.slice(0, recall)
    const retainedKeys = new Set(retained.map((offer) => specKey(offer.targetSpec, offer.huntingGroundId ?? 'hunters-ground')))
    const fresh = generateHunterContractChoices(state).filter((offer) => !retainedKeys.has(specKey(offer.targetSpec, offer.huntingGroundId ?? 'hunters-ground')))
    order.availableContracts = [...retained, ...fresh].slice(0, getHunterContractChoiceCount(state))
    order.pinnedContractIds = (order.pinnedContractIds ?? []).filter((id) => order.availableContracts.some((offer) => offer.id === id))
  } else order.availableContracts = []
  pushNotification(state, `HUNT CONTRACT COMPLETE · ${getHunterContractTargetLabel(contract)} · ${contract.target} / ${contract.target} · +${reputationReward} Hunter Reputation · +${marksAwarded} Hunter Marks.`, 'success', { key: `hunter-contract-complete:${contract.id}`, cooldownMs: 1000 })
  return true
}

export const skipHunterContract = (state: GameState) => {
  const order = state.progress.huntersOrder
  const cost = getHunterSkipMarkCost(state)
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
  const cost = getHunterRerollMarkCost(state)
  if (!isHuntersOrderUnlocked(state) || order.hunterMarks < cost) return false
  const pinned = order.availableContracts.filter((contract) => order.pinnedContractIds?.includes(contract.id))
  order.hunterMarks -= cost
  order.generationCount += 1
  const pinnedKeys = new Set(pinned.map((contract) => specKey(contract.targetSpec, contract.huntingGroundId ?? 'hunters-ground')))
  const generated = generateHunterContractChoices(state).filter((contract) => !pinnedKeys.has(specKey(contract.targetSpec, contract.huntingGroundId ?? 'hunters-ground')))
  order.availableContracts = [...pinned, ...generated].slice(0, getHunterContractChoiceCount(state))
  order.pinnedContractIds = pinned.map((contract) => contract.id)
  pushNotification(state, `Hunt Contract board refreshed - ${cost} Hunter Mark spent.`, 'info')
  return true
}

export const setHunterTargetBlocked = (state: GameState, monsterId: MonsterId, blocked: boolean) => {
  const order = state.progress.huntersOrder
  if (!getHunterBlockableTargets(state).includes(monsterId) || getHunterBlockSlotCount(state) <= 0) return false
  const blockedTargets = order.blockedTargets
  const exists = blockedTargets.includes(monsterId)
  if (exists === blocked) return false
  if (!blocked) order.blockedTargets = blockedTargets.filter((id) => id !== monsterId)
  else {
    if (blockedTargets.length >= getHunterBlockSlotCount(state)) return false
    if (order.activeContract && getEligibleHunterContractMembers(state, order.activeContract, order.activeContract.huntingGroundId ?? 'hunters-ground').includes(monsterId)) return false
    if (normalTargets.filter((id) => id !== monsterId && !blockedTargets.includes(id)).length < 1) return false
    order.blockedTargets = [...blockedTargets, monsterId]
  }
  order.availableContracts = generateHunterContractChoices(state)
  return true
}

export const purchaseHunterUpgrade = (state: GameState, upgradeId: HunterUpgradeId | string) => {
  const order = state.progress.huntersOrder
  const status = getHunterUpgradePurchaseStatus(state, upgradeId)
  const upgrade = status.upgrade
  if (!upgrade || !status.canPurchase || status.cost === null) return false
  const currentRank = status.ownedRank
  const cost = status.cost
  order.hunterMarks -= cost
  order.purchasedUpgrades[upgrade.id] = currentRank + 1
  order.availableContracts = generateHunterContractChoices(state)
  pushNotification(state, `${upgrade.name} rank ${currentRank + 1} unlocked.`, 'success')
  return true
}

export const normalizeHuntersOrderProgress = (state: GameState) => {
  const order = state.progress.huntersOrder
  order.reputation = safeInt(order.reputation); order.hunterMarks = safeInt(order.hunterMarks)
  order.pinnedContractIds = Array.isArray(order.pinnedContractIds) ? order.pinnedContractIds.filter((id) => typeof id === 'string') : []
  order.preferredContractType = ['monster', 'family', 'alignment', 'ground'].includes(order.preferredContractType ?? '') ? order.preferredContractType : null
  order.lastSelectedQuarryByGround = order.lastSelectedQuarryByGround && typeof order.lastSelectedQuarryByGround === 'object' ? order.lastSelectedQuarryByGround : {}
  order.totalContractsAccepted = safeInt(order.totalContractsAccepted); order.totalContractsCompleted = safeInt(order.totalContractsCompleted)
  order.totalHunterKills = safeInt(order.totalHunterKills); order.generationCount = safeInt(order.generationCount)
  order.rngState = safeInt(order.rngState) || 2654435769
  order.blockedTargets = order.blockedTargets.filter((id) => normalTargets.includes(id)).slice(0, getHunterBlockSlotCount(state))
  for (const upgrade of HUNTER_UPGRADES) order.purchasedUpgrades[upgrade.id] = Math.min(upgrade.maxRank, safeInt(order.purchasedUpgrades[upgrade.id] ?? 0))
  order.rankId = getHunterRank(order.reputation).id
  const migrateNightglassBossContract = (contract: HunterContractState): HunterContractState => contract.targetSpec.type === 'boss' && contract.targetSpec.monsterId === 'nightglass-alpha'
    ? { ...contract, targetSpec: { type: 'monster', monsterId: 'nightglass-alpha' }, tier: 'prestigious' }
    : contract
  const normalizeContract = (contract: HunterContractState): HunterContractState => {
    const migrated = migrateNightglassBossContract(contract)
    const groundId = getHunterGround(migrated.huntingGroundId)?.id ?? 'hunters-ground'
    return { ...migrated, huntingGroundId: groundId, progress: Math.min(safeInt(migrated.target), safeInt(migrated.progress)), target: Math.max(1, safeInt(migrated.target)) }
  }
  order.activeContract = order.activeContract ? normalizeContract(order.activeContract) : null
  order.availableContracts = order.availableContracts.map(normalizeContract)
  if (!isHunterContractBoardUnlocked(state)) order.availableContracts = []
  order.availableContracts = order.availableContracts.slice(0, getHunterContractChoiceCount(state))
  const liveIds = new Set(order.availableContracts.map((contract) => contract.id))
  order.pinnedContractIds = order.pinnedContractIds.filter((id) => liveIds.has(id)).slice(0, getOwnedUpgradeRank(state, 'pinned-orders'))
  const preferredGround = HUNTER_GROUNDS.find((ground) => ground.id === order.preferredHuntingGroundId && ground.enabled)
  const preferredStanding = preferredGround && HUNTER_STANDINGS.find((standing) => standing.id === preferredGround.minimumStandingId)
  if (!preferredGround || !preferredStanding || order.reputation < preferredStanding.reputation) order.preferredHuntingGroundId = null
  for (const [groundId, monsterId] of Object.entries(order.lastSelectedQuarryByGround)) {
    if (!getHunterGround(groundId) || !MONSTERS[monsterId as MonsterId]?.hunter?.exclusive || MONSTERS[monsterId as MonsterId]?.hunter?.huntingGroundId !== groundId) delete order.lastSelectedQuarryByGround[groundId as CombatLocationId]
  }
  return order
}

export const debugSetHuntersOrderUnlocked = (state: GameState, unlocked: boolean) => { if (unlocked) state.progress.bossKillsByBoss['corrupted-greatbear'] = Math.max(1, state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0); else delete state.progress.bossKillsByBoss['corrupted-greatbear'] }
export const debugGrantHunterReputation = (state: GameState, amount: number) => { const order = state.progress.huntersOrder; order.reputation = safeInt(order.reputation) + safeInt(amount); const rank = getHunterRank(order.reputation); if (rank.id !== order.rankId) pushNotification(state, `Hunter Rank raised to ${rank.name}.`, 'success'); order.rankId = rank.id }
export const debugGrantHunterMarks = (state: GameState, amount: number) => { state.progress.huntersOrder.hunterMarks = safeInt(state.progress.huntersOrder.hunterMarks) + safeInt(amount) }
export const debugCompleteActiveHunterContract = (state: GameState) => {
  const contract = state.progress.huntersOrder.activeContract
  if (!contract) return false
  const groundId = contract.huntingGroundId ?? 'hunters-ground'
  const monsterId = getEligibleHunterContractMembers(state, contract, groundId)[0]
  if (!monsterId) return false
  for (let count = contract.progress; count < contract.target; count += 1) recordHunterKill(state, monsterId, groundId)
  return true
}

export const getHunterCompletionHarvestPreview = (state: Pick<GameState, 'progress'>, contract: HunterContractState, monsterId: MonsterId) => {
  const resonanceRank = getOwnedUpgradeRank(state, 'resonant-completion')
  const resonanceScale = contract.tier === 'routine' ? 1 : contract.tier === 'special' ? 1.5 : 2
  const dominant = Object.entries(MONSTERS[monsterId]?.resonanceYield ?? {}).sort((a, b) => b[1] - a[1])[0]
  const resonance = resonanceRank > 0 && dominant
    ? { type: dominant[0] as ResonanceType, amount: Math.round(dominant[1] * Math.max(1, contract.target / 100) * resonanceScale * resonanceRank * 0.1) }
    : null
  const essenceRank = getOwnedUpgradeRank(state, 'essence-completion')
  const essenceScale = contract.tier === 'routine' ? 1 : contract.tier === 'special' ? 2 : 3
  const lifeEssence = essenceRank > 0 ? Math.max(1, Math.floor(contract.target / 25) * essenceScale * essenceRank) : 0
  return { resonance, lifeEssence }
}

const rankForTargetType: Partial<Record<HunterContractTarget['type'], HunterRankId>> = { family: 'scout', alignment: 'stalker', ground: 'warden' }
export const debugSetHunterRngSeed = (state: GameState, seed: number) => { state.progress.huntersOrder.rngState = safeInt(seed) || 1 }
export const debugRegenerateHunterContractBoard = (state: GameState, options: HunterContractGenerationOptions = {}) => {
  debugSetHuntersOrderUnlocked(state, true)
  const requiredRankId = options.monsterId ? MONSTERS[options.monsterId]?.hunter?.minimumRank : options.archetype ? rankForTargetType[options.archetype] : undefined
  const requiredRank = requiredRankId ? HUNTER_RANKS.find((rank) => rank.id === requiredRankId) : undefined
  const tierReputation = options.tier ? requiredRankForTier(options.tier) : 0
  const requiredGroundStanding = options.huntingGroundId ? HUNTER_GROUNDS.find((ground) => ground.id === options.huntingGroundId)?.minimumStandingId : undefined
  const groundStandingReputation = requiredGroundStanding ? HUNTER_STANDINGS.find((standing) => standing.id === requiredGroundStanding)?.reputation ?? 0 : 0
  const fixtureStandingReputation = options.fixtureChoiceCount === 3 ? 2350 : options.fixtureChoiceCount === 2 ? 500 : options.fixtureChoiceCount === 1 ? 0 : 0
  if (requiredRank || tierReputation || groundStandingReputation || options.fixtureChoiceCount) state.progress.huntersOrder.reputation = Math.max(groundStandingReputation, fixtureStandingReputation, requiredRank?.reputation ?? 0, tierReputation)
  state.progress.huntersOrder.rankId = getHunterRank(state.progress.huntersOrder.reputation).id
  state.progress.huntersOrder.generationCount += 1
  state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state, options)
  return state.progress.huntersOrder.availableContracts
}
export const debugSetHunterRank = (state: GameState, rankId: HunterRankId) => {
  const rank = HUNTER_RANKS.find((entry) => entry.id === rankId)
  if (!rank) return false
  debugSetHuntersOrderUnlocked(state, true)
  state.progress.huntersOrder.reputation = rank.reputation
  state.progress.huntersOrder.rankId = rank.id
  state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
  return true
}
export const debugSetHunterStanding = (state: GameState, standingId: string) => {
  const standing = HUNTER_STANDINGS.find((entry) => entry.id === standingId)
  if (!standing) return false
  debugSetHuntersOrderUnlocked(state, true)
  const order = state.progress.huntersOrder
  order.reputation = standing.reputation
  order.rankId = standing.rankId
  order.availableContracts = generateHunterContractChoices(state)
  return true
}
export const debugSetHunterUpgradeRank = (state: GameState, upgradeId: string, rank: number) => {
  const upgrade = HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade || !Number.isFinite(rank)) return false
  state.progress.huntersOrder.purchasedUpgrades[upgradeId] = Math.max(0, Math.min(upgrade.maxRank, Math.floor(rank)))
  return true
}
export const debugSetAllHunterUpgrades = (state: GameState, mode: 'max' | 'reset') => {
  for (const upgrade of HUNTER_UPGRADES) state.progress.huntersOrder.purchasedUpgrades[upgrade.id] = mode === 'max' ? upgrade.maxRank : 0
  return true
}
export const debugGrantHunterUpgrade = (state: GameState, upgradeId: HunterUpgradeId | string) => {
  const upgrade = HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade) return false
  debugSetHuntersOrderUnlocked(state, true)
  const requiredStanding = HUNTER_STANDINGS.find((standing) => standing.id === upgrade.requiredStanding) ?? HUNTER_STANDINGS[0]
  state.progress.huntersOrder.reputation = Math.max(state.progress.huntersOrder.reputation, requiredStanding.reputation)
  state.progress.huntersOrder.rankId = getHunterRank(state.progress.huntersOrder.reputation).id
  const currentRank = safeInt(state.progress.huntersOrder.purchasedUpgrades[upgrade.id] ?? 0)
  if (currentRank >= upgrade.maxRank) return false
  state.progress.huntersOrder.purchasedUpgrades[upgrade.id] = currentRank + 1
  state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
  return true
}
export const clearHunterTargetBlocks = (state: GameState) => {
  if (!state.progress.huntersOrder.blockedTargets.length) return false
  state.progress.huntersOrder.blockedTargets = []
  state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
  return true
}
export const debugClearHunterTargetBlocks = clearHunterTargetBlocks
export const debugGrantNightglassContract = (state: GameState) => {
  const masterRank = HUNTER_RANKS.find((rank) => rank.id === MONSTERS['nightglass-alpha'].hunter?.minimumRank)
  if (!masterRank) return false
  debugSetHuntersOrderUnlocked(state, true)
  state.progress.huntersOrder.reputation = Math.max(state.progress.huntersOrder.reputation, masterRank.reputation)
  state.progress.huntersOrder.rankId = getHunterRank(state.progress.huntersOrder.reputation).id
  const [nightglassContract] = debugRegenerateHunterContractBoard(state, { archetype: 'monster', tier: 'prestigious', monsterId: 'nightglass-alpha' })
  return nightglassContract?.targetSpec.type === 'monster' && nightglassContract.targetSpec.monsterId === 'nightglass-alpha'
}

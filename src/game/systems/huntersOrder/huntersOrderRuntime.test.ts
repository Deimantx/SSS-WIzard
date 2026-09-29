import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { createInitialState } from '../../../store/initialState'
import { spawnEnemy, spawnNextEnemy } from '../combat/combatRuntime'
import { getHunterAuthorization, getHunterBlockSlotCount, getHunterRankProgress, getHunterStanding, getHunterContractBoardSlotCount, getHunterContractChoiceCount, getHunterRerollMarkCost, getHunterSkipMarkCost, getHunterUpgradePurchaseStatus, acceptHunterContract, canHuntMonster, doesMonsterMatchHunterContract, generateHunterContractChoices, issueFirstHunterContract, requestHunterAssignment, recordHunterKill, rerollHunterContracts, setHunterTargetBlocked, skipHunterContract, purchaseHunterUpgrade, isHunterRankAtLeast, debugRegenerateHunterContractBoard, getEligibleHunterContractMembers, getMinimumContractTierForMonster, toggleHunterContractPin, getHunterContractTargetReduction, getHunterHarvestBonuses } from './huntersOrderRuntime'
import { BALANCE } from '../../core/balance/balance'
import { HUNTER_RANKS, HUNTER_STANDINGS } from '../../content/huntersOrder/hunterRanks'
import { HUNTER_UPGRADES } from '../../content/huntersOrder/hunterUpgrades'
import { HUNTER_GROUNDS } from '../../content/huntersOrder/hunterGrounds'
import { HUNTER_REGULAR_MONSTER_IDS } from '../../content/monsters/huntersOrder'
import { MONSTERS } from '../../content/monsters'
import type { HunterContractState } from '../../types'

const contract = (targetSpec: HunterContractState['targetSpec'], tier: HunterContractState['tier'] = 'routine'): HunterContractState => ({ id: 'test-contract', targetSpec, target: 1, progress: 0, tier, reputationReward: 100, marksReward: 3 })
const unlock = () => { const state = createInitialState(); state.progress.bossKillsByBoss['corrupted-greatbear'] = 1; return state }

describe('Hunter Order hardened runtime', () => {
  it('uses the extended authored Gloamridge roster and rank thresholds', () => {
    expect(HUNTER_RANKS.map(({ reputation }) => reputation)).toEqual([0, 1250, 4000, 9000, 17500, 32500])
    expect(HUNTER_REGULAR_MONSTER_IDS).toHaveLength(7)
    expect(DUNGEONS['hunters-ground'].monsterPool).toHaveLength(7)
    expect(DUNGEONS['hunters-ground'].monsterPool).toEqual(expect.arrayContaining([...HUNTER_REGULAR_MONSTER_IDS]))
    for (const id of ['veilwing-harrier', 'cinderback-mauler', 'gloomroot-hexer'] as const) {
      expect(MONSTERS[id]).toMatchObject({ bestiaryCategory: 'monster', hunter: { exclusive: true, contractRequired: true, huntingGroundId: 'hunters-ground' } })
      expect(MONSTERS[id]?.actions && Object.keys(MONSTERS[id]!.actions).length).toBeGreaterThan(0)
      expect(MONSTERS[id]?.resonanceYield && Object.values(MONSTERS[id]!.resonanceYield!).some((amount) => amount > 0)).toBe(true)
    }
  })

  it('applies the five-rank Trail Kit reduction to normal targets and offers no boss contracts', () => {
    const withoutKit = unlock(); const withKit = unlock()
    for (const state of [withoutKit, withKit]) { state.progress.huntersOrder.reputation = 32500; state.progress.huntersOrder.rngState = 901 }
    withKit.progress.huntersOrder.hunterMarks = 100
    expect(purchaseHunterUpgrade(withKit, 'trail-kit')).toBe(true)
    expect(purchaseHunterUpgrade(withKit, 'trail-kit')).toBe(true)
    expect(purchaseHunterUpgrade(withKit, 'trail-kit')).toBe(true)
    withKit.progress.huntersOrder.rngState = 901
    const raw = debugRegenerateHunterContractBoard(withoutKit, { archetype: 'monster', tier: 'prestigious' })
    const reduced = debugRegenerateHunterContractBoard(withKit, { archetype: 'monster', tier: 'prestigious' })
    expect(reduced.map((offer) => offer.target)).toEqual(raw.map((offer) => Math.ceil(offer.target * 0.94)))
    expect(reduced.every((offer) => offer.reputationReward === Math.round(offer.target * 2 * 3))).toBe(true)
    const boss = debugRegenerateHunterContractBoard(withKit, { archetype: 'boss', tier: 'prestigious' })
    expect(boss).toEqual([])
  })

  it('generates unique seeded generalized offers and save state preserves the next sequence', () => {
    const a = unlock(); const b = unlock()
    a.progress.huntersOrder.reputation = b.progress.huntersOrder.reputation = 20000
    a.progress.huntersOrder.rngState = b.progress.huntersOrder.rngState = 123456
    const firstA = generateHunterContractChoices(a); const firstB = generateHunterContractChoices(b)
    expect(firstA).toEqual(firstB)
    expect(new Set(firstA.map((offer) => JSON.stringify(offer.targetSpec))).size).toBe(firstA.length)
    expect(firstA.every((offer) => offer.target > 1)).toBe(true)
    const saved = structuredClone(a.progress.huntersOrder)
    const nextA = generateHunterContractChoices(a)
    const continued = unlock(); continued.progress.huntersOrder = saved
    expect(generateHunterContractChoices(continued)).toEqual(nextA)
  })

  it('scopes every generated offer to an authored enabled Hunting Ground', () => {
    const state = unlock()
    state.progress.huntersOrder.reputation = 32500
    const offers = generateHunterContractChoices(state)
    const enabledGroundIds = HUNTER_GROUNDS.filter((ground) => ground.enabled).map((ground) => ground.id)
    expect(enabledGroundIds).toEqual(['hunters-ground'])
    expect(offers.length).toBeGreaterThan(0)
    expect(offers.every((offer) => offer.huntingGroundId && enabledGroundIds.includes(offer.huntingGroundId))).toBe(true)
  })

  it('issues the first routine Contract immediately and supports the Tracker continuation action', () => {
    const state = unlock()
    const order = state.progress.huntersOrder
    expect(issueFirstHunterContract(state)).toBe(true)
    expect(order.activeContract).toMatchObject({ tier: 'routine', targetSpec: { type: 'monster' }, marksReward: 3 })
    expect(HUNTER_REGULAR_MONSTER_IDS).toContain((order.activeContract?.targetSpec as { monsterId: string }).monsterId)
    expect(order.activeContract?.target).toBeGreaterThanOrEqual(BALANCE.huntersOrder.starterTargetRange[0])
    expect(order.activeContract?.target).toBeLessThanOrEqual(BALANCE.huntersOrder.starterTargetRange[1])
    expect(order.activeContract?.reputationReward).toBe(order.activeContract!.target * BALANCE.huntersOrder.starterReputationPerKill)
    expect(order.totalContractsAccepted).toBe(1)
    expect(issueFirstHunterContract(state)).toBe(false)

    order.activeContract = null
    expect(requestHunterAssignment(state)).toBe(true)
    const nextAssignment = state.progress.huntersOrder.activeContract as HunterContractState | null
    expect(nextAssignment?.tier).toBe('routine')
    expect(order.totalContractsAccepted).toBe(2)
  })

  it('uses seeded archetype weights rather than the number of candidates per archetype', () => {
    const counts: Record<HunterContractState['targetSpec']['type'], number> = { monster: 0, family: 0, region: 0, alignment: 0, boss: 0 }
    for (let seed = 1; seed <= 400; seed += 1) {
      const state = unlock()
      state.progress.huntersOrder.reputation = 32500
      state.progress.huntersOrder.rngState = seed
      generateHunterContractChoices(state).forEach((offer) => { counts[offer.targetSpec.type] += 1 })
    }
    expect(counts.monster).toBeGreaterThan(counts.family)
    expect(counts.family).toBeGreaterThan(counts.alignment)
    expect(counts.boss).toBe(0)
  })

  it('uses Hunter-owned quality weights independently from Arcane Guild weights', () => {
    const huntersBalance = BALANCE.huntersOrder as unknown as { qualityWeights: { routine: number; special: number; prestigious: number } }
    const previous = huntersBalance.qualityWeights
    try {
      huntersBalance.qualityWeights = { routine: 0, special: 1, prestigious: 0 }
      const state = unlock()
      state.progress.huntersOrder.reputation = 2350
      expect(generateHunterContractChoices(state).every((offer) => offer.tier === 'special')).toBe(true)
    } finally {
      huntersBalance.qualityWeights = previous
    }
  })

  it('matches specific monster, family, region, and alignment objectives while Nightglass stays a monster', () => {
    const state = unlock()
    const specific = contract({ type: 'monster', monsterId: 'ashen-tracker' })
    expect(doesMonsterMatchHunterContract(specific, 'ashen-tracker', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(specific, 'gloamfang-stalker', 'hunters-ground')).toBe(false)
    expect(doesMonsterMatchHunterContract(contract({ type: 'family', familyId: 'Gloamridge Predators' }), 'gloamfang-stalker', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(contract({ type: 'region', dungeonId: 'hunters-ground' }), 'ashen-tracker', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(contract({ type: 'region', dungeonId: 'hunters-ground' }), 'ashen-tracker', 'howling-den')).toBe(false)
    expect(doesMonsterMatchHunterContract(contract({ type: 'alignment', alignmentId: 'Wild' }), 'ashen-tracker', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(contract({ type: 'family', familyId: 'Gloamridge Mystics' }), 'gloomroot-hexer', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(contract({ type: 'alignment', alignmentId: 'Embermarked' }), 'cinderback-mauler', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(contract({ type: 'boss', monsterId: 'nightglass-alpha' }, 'prestigious'), 'nightglass-alpha', 'hunters-ground')).toBe(false)
    expect(state.progress.huntersOrder.rngState).toBeGreaterThan(0)
  })

  it('authorizes exact targets and leaves ordinary monsters unaffected', () => {
    const state = unlock()
    expect(getHunterAuthorization(state, 'ashen-tracker')).toMatchObject({ authorized: false, reason: 'contract-required' })
    state.progress.huntersOrder.activeContract = contract({ type: 'monster', monsterId: 'ashen-tracker' })
    expect(canHuntMonster(state, 'ashen-tracker', 'hunters-ground')).toBe(true)
    expect(getHunterAuthorization(state, 'gloamfang-stalker', 'hunters-ground')).toEqual({ authorized: false, reason: 'contract-target-mismatch' })
    expect(canHuntMonster(state, 'forest-wisp', 'whispering-woods')).toBe(true)
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 0
    expect(getHunterAuthorization(state, 'ashen-tracker')).toMatchObject({ authorized: false, reason: 'order-locked' })
  })

  it('rejects direct, pending-boss, and auto-hunt spawns that lack matching authorization', () => {
    const state = unlock()
    state.combat.dungeonId = 'hunters-ground'
    state.progress.huntersOrder.activeContract = contract({ type: 'monster', monsterId: 'ashen-tracker' })
    expect(spawnEnemy(state, 'gloamfang-stalker')).toBe(false)
    state.combat.pendingBossId = 'nightglass-alpha'
    expect(spawnNextEnemy(state)).toBe(false)
    expect(state.combat.enemyId).toBeNull()
    expect(state.combat.pendingBossId).toBeNull()
    expect(DUNGEONS['hunters-ground'].boss).toBeNull()
  })

  it('keeps block capacity, protects active eligibility, and permits unblocking', () => {
    const state = unlock()
    expect(getHunterBlockSlotCount(state)).toBe(0)
    expect(setHunterTargetBlocked(state, 'ashen-tracker', true)).toBe(false)
    state.progress.huntersOrder.reputation = 4000
    state.progress.huntersOrder.purchasedUpgrades['extended-trails'] = 1
    expect(getHunterBlockSlotCount(state)).toBe(1)
    expect(setHunterTargetBlocked(state, 'ashen-tracker', true)).toBe(true)
    expect(setHunterTargetBlocked(state, 'gloamfang-stalker', true)).toBe(false)
    expect(setHunterTargetBlocked(state, 'ashen-tracker', false)).toBe(true)
    state.progress.huntersOrder.activeContract = contract({ type: 'monster', monsterId: 'gloamfang-stalker' })
    expect(setHunterTargetBlocked(state, 'gloamfang-stalker', true)).toBe(false)
    expect(state.progress.huntersOrder.availableContracts.length).toBeGreaterThan(0)
  })

  it('spends Marks for reroll and skip, and applies upgrades by rank', () => {
    const state = unlock()
    state.progress.huntersOrder.reputation = 1250
    state.progress.huntersOrder.availableContracts = generateHunterContractChoices(state)
    state.progress.huntersOrder.hunterMarks = 30
    expect(rerollHunterContracts(state)).toBe(true)
    const costAfterReroll = state.progress.huntersOrder.hunterMarks
    const offer = state.progress.huntersOrder.availableContracts[0]
    expect(acceptHunterContract(state, offer.id)).toBe(true)
    expect(skipHunterContract(state)).toBe(true)
    expect(state.progress.huntersOrder.hunterMarks).toBe(costAfterReroll - 6)
    expect(purchaseHunterUpgrade(state, 'trail-kit')).toBe(true)
    expect(purchaseHunterUpgrade(state, 'trail-kit')).toBe(true)
    expect(state.progress.huntersOrder.purchasedUpgrades['trail-kit']).toBe(2)
  })

  it('uses progress within the current rank interval', () => {
    expect(getHunterRankProgress(0).progress).toBe(0)
    expect(getHunterRankProgress(1250).progress).toBe(0)
    expect(getHunterRankProgress(2625).progress).toBe(0.5)
    expect(getHunterRankProgress(4000).progress).toBe(0)
    expect(getHunterRankProgress(32500)).toMatchObject({ nextRank: null, progress: 1 })
  })

  it('does not authorize Nightglass with an unrelated or under-tier contract', () => {
    const state = unlock()
    state.progress.huntersOrder.reputation = 17500
    state.progress.huntersOrder.activeContract = contract({ type: 'monster', monsterId: 'ashen-tracker' }, 'routine')
    expect(getHunterAuthorization(state, 'nightglass-alpha', 'hunters-ground')).toEqual({ authorized: false, reason: 'contract-tier-locked' })
    state.progress.huntersOrder.reputation = 32500
    state.progress.huntersOrder.activeContract = contract({ type: 'monster', monsterId: 'nightglass-alpha' }, 'prestigious')
    expect(canHuntMonster(state, 'nightglass-alpha', 'hunters-ground')).toBe(true)
  })

  it('gates authored programs by exact Standing and grows Board slots from one to three', () => {
    const state = unlock()
    const order = state.progress.huntersOrder
    order.hunterMarks = 100
    expect(getHunterContractChoiceCount(state)).toBe(0)
    expect(getHunterContractBoardSlotCount(state)).toBe(1)
    expect(getHunterUpgradePurchaseStatus(state, 'exact-quarry-briefing')).toMatchObject({ canPurchase: false, reason: 'rank-required', requiredStanding: { id: 'tracker-3' } })
    expect(purchaseHunterUpgrade(state, 'exact-quarry-briefing')).toBe(false)
    order.reputation = 500
    expect(getHunterContractBoardSlotCount(state)).toBe(2)
    expect(getHunterContractChoiceCount(state)).toBe(2)
    order.reputation = 2350
    expect(getHunterContractBoardSlotCount(state)).toBe(3)
    expect(getHunterContractChoiceCount(state)).toBe(3)
  })

  it('reduces Reroll and Skip costs through their authored upgrades', () => {
    const state = unlock()
    const order = state.progress.huntersOrder
    order.reputation = 17500
    order.hunterMarks = 200
    expect(getHunterRerollMarkCost(state)).toBe(BALANCE.huntersOrder.rerollMarkCost)
    expect(getHunterSkipMarkCost(state)).toBe(BALANCE.huntersOrder.skipMarkCost)
    expect(purchaseHunterUpgrade(state, 'negotiated-rerolls')).toBe(true)
    expect(purchaseHunterUpgrade(state, 'order-privilege')).toBe(true)
    expect(getHunterRerollMarkCost(state)).toBe(BALANCE.huntersOrder.rerollMarkCost - 1)
    expect(getHunterSkipMarkCost(state)).toBe(BALANCE.huntersOrder.skipMarkCost - 1)
  })

  it('pins offers across refresh, scopes matching to the Contract ground, and caps stacked target reductions', () => {
    const state = unlock()
    const order = state.progress.huntersOrder
    order.reputation = 2900
    order.purchasedUpgrades['pinned-orders'] = 2
    order.purchasedUpgrades['trail-kit'] = 5
    order.purchasedUpgrades['exact-quarry-briefing'] = 3
    order.purchasedUpgrades['prestigious-preparation'] = 3
    order.hunterMarks = 100
    order.availableContracts = generateHunterContractChoices(state)
    expect(order.availableContracts).toHaveLength(3)
    const pinned = order.availableContracts[0]!
    expect(toggleHunterContractPin(state, pinned.id)).toBe(true)
    expect(rerollHunterContracts(state)).toBe(true)
    expect(order.availableContracts[0]).toEqual(pinned)
    expect(getHunterContractTargetReduction(state, 'monster', 'prestigious')).toBe(0.22)
    expect(getHunterContractTargetReduction(state, 'monster', 'prestigious')).toBeLessThanOrEqual(0.25)
    const otherGround = contract({ type: 'monster', monsterId: 'ashen-tracker' }, 'routine')
    otherGround.huntingGroundId = 'howling-den'
    expect(getEligibleHunterContractMembers(state, otherGround, 'hunters-ground')).toEqual([])
    expect(doesMonsterMatchHunterContract(otherGround, 'ashen-tracker', 'howling-den')).toBe(false)
  })

  it('applies Harvest upgrades only to quarry authorized by the active Contract', () => {
    const state = unlock()
    state.progress.huntersOrder.purchasedUpgrades['resonant-claim'] = 2
    state.progress.huntersOrder.purchasedUpgrades['essence-claim'] = 1
    state.progress.huntersOrder.purchasedUpgrades['fragment-rights'] = 2
    state.progress.huntersOrder.purchasedUpgrades['sigil-claim'] = 1
    expect(getHunterHarvestBonuses(state, 'ashen-tracker', 'hunters-ground')).toMatchObject({ authorized: false, resonanceMultiplier: 1, essenceMultiplier: 1, itemDropMultiplier: 1, sigilDropMultiplier: 1 })
    state.progress.huntersOrder.activeContract = contract({ type: 'monster', monsterId: 'ashen-tracker' })
    expect(getHunterHarvestBonuses(state, 'ashen-tracker', 'hunters-ground')).toMatchObject({ authorized: true, resonanceMultiplier: 1.1, essenceMultiplier: 1.05, itemDropMultiplier: 1.1, sigilDropMultiplier: 1.03 })
  })

  it('gates Nightglass Alpha by authored minimum Hunter rank and matching normal quarry contract', () => {
    const state = unlock()
    state.progress.huntersOrder.reputation = 32500
    state.progress.huntersOrder.activeContract = contract({ type: 'region', dungeonId: 'hunters-ground' }, 'prestigious')
    state.progress.huntersOrder.reputation = 32499
    expect(getHunterAuthorization(state, 'nightglass-alpha', 'hunters-ground')).toEqual({ authorized: false, reason: 'contract-tier-locked' })
    state.progress.huntersOrder.reputation = 32500
    state.progress.huntersOrder.activeContract = contract({ type: 'region', dungeonId: 'hunters-ground' }, 'prestigious')
    expect(getHunterAuthorization(state, 'nightglass-alpha', 'hunters-ground')).toEqual({ authorized: true })
    state.progress.huntersOrder.activeContract = contract({ type: 'monster', monsterId: 'nightglass-alpha' }, 'prestigious')
    expect(getHunterAuthorization(state, 'nightglass-alpha', 'hunters-ground')).toEqual({ authorized: true })
  })

  it('offers Nightglass as a prestigious monster contract at Master Hunter', () => {
    const futureRanks = [...HUNTER_RANKS, { id: 'apex-hunter' }]
    expect(isHunterRankAtLeast('apex-hunter', 'master-hunter', futureRanks)).toBe(true)
    const state = unlock()
    state.progress.huntersOrder.reputation = 32500
    const offers = debugRegenerateHunterContractBoard(state, { archetype: 'monster', tier: 'prestigious', monsterId: 'nightglass-alpha' })
    expect(offers).toHaveLength(1)
    expect(offers[0]?.targetSpec).toEqual({ type: 'monster', monsterId: 'nightglass-alpha' })
  })

  it('never generates a lower-tier exact Nightglass contract at Master Hunter', () => {
    expect(getMinimumContractTierForMonster('nightglass-alpha')).toBe('prestigious')
    for (let seed = 1; seed <= 64; seed += 1) {
      const state = unlock()
      state.progress.huntersOrder.reputation = 32500
      state.progress.huntersOrder.rngState = seed
      const offers = generateHunterContractChoices(state, { archetype: 'monster', monsterId: 'nightglass-alpha' })
      expect(offers).toHaveLength(1)
      expect(offers[0]?.tier).toBe('prestigious')
    }
  })

  it('uses authorization-aware members for broad contracts and keeps Nightglass locked below Master', () => {
    const state = unlock()
    state.progress.huntersOrder.reputation = 9000
    const routine = contract({ type: 'family', familyId: 'Gloamridge Predators' }, 'routine')
    expect(getEligibleHunterContractMembers(state, routine, 'hunters-ground')).toEqual(expect.arrayContaining(['gloamfang-stalker', 'veilwing-harrier']))
    expect(getEligibleHunterContractMembers(state, routine, 'hunters-ground')).not.toContain('nightglass-alpha')
    expect(getHunterAuthorization({ progress: state.progress }, 'nightglass-alpha', 'hunters-ground')).toMatchObject({ authorized: false, reason: 'contract-tier-locked' })
    state.progress.huntersOrder.reputation = 32500
    const prestigious = contract({ type: 'family', familyId: 'Gloamridge Predators' }, 'prestigious')
    expect(getEligibleHunterContractMembers(state, prestigious, 'hunters-ground')).toContain('nightglass-alpha')
  })

  it('keeps maximum Hunter Marks costs proportionate to the rank path', () => {
    const totalMarks = HUNTER_UPGRADES.reduce((sum, upgrade) => sum + upgrade.markCosts.reduce((rankSum, cost) => rankSum + cost, 0), 0)
    expect(HUNTER_UPGRADES).toHaveLength(30)
    expect(totalMarks).toBe(1261)
  })

  it('derives all 30 Standing thresholds from Reputation and preserves macro ranks', () => {
    expect(HUNTER_STANDINGS).toHaveLength(30)
    for (let index = 0; index < HUNTER_STANDINGS.length; index += 1) {
      const standing = HUNTER_STANDINGS[index]!
      expect(getHunterStanding(standing.reputation).id).toBe(standing.id)
      if (index > 0) expect(getHunterStanding(standing.reputation - 1).id).toBe(HUNTER_STANDINGS[index - 1]!.id)
    }
    expect(getHunterStanding(249).id).toBe('tracker-1')
    expect(getHunterStanding(250).id).toBe('tracker-2')
    expect(getHunterStanding(1249).id).toBe('tracker-5')
    expect(getHunterStanding(1250).id).toBe('scout-1')
    expect(getHunterStanding(55999).id).toBe('master-hunter-4')
    expect(getHunterStanding(56000).id).toBe('master-hunter-5')
    expect(HUNTER_RANKS.map((rank) => rank.reputation)).toEqual([0, 1250, 4000, 9000, 17500, 32500])
  })

  it('reports and records the same Deep Pockets Marks award', () => {
    const state = unlock()
    const order = state.progress.huntersOrder
    order.activeContract = contract({ type: 'monster', monsterId: 'ashen-tracker' })
    order.purchasedUpgrades['deep-pockets'] = 2
    expect(recordHunterKill(state, 'ashen-tracker', 'hunters-ground')).toBe(true)
    expect(order.hunterMarks).toBe(5)
    expect(order.monsterHunterStats['ashen-tracker']?.marksEarned).toBe(5)
    expect(state.notifications[state.notifications.length - 1]?.text).toContain('+5 Hunter Marks')
  })

  it('progresses and rewards generalized matching targets only', () => {
    const state = unlock()
    state.progress.huntersOrder.activeContract = contract({ type: 'family', familyId: 'Gloamridge Predators' })
    expect(recordHunterKill(state, 'runehorn-brute', 'hunters-ground')).toBe(false)
    expect(recordHunterKill(state, 'gloamfang-stalker', 'hunters-ground')).toBe(true)
    expect(state.progress.huntersOrder.reputation).toBe(100)
  })
})

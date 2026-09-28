import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { createInitialState } from '../../../store/initialState'
import { spawnEnemy, spawnNextEnemy } from '../combat/combatRuntime'
import { getHunterAuthorization, getHunterBlockSlotCount, getHunterRankProgress, getHunterContractChoiceCount, getHunterRerollMarkCost, getHunterSkipMarkCost, getHunterUpgradePurchaseStatus, acceptHunterContract, canHuntMonster, doesMonsterMatchHunterContract, generateHunterContractChoices, recordHunterKill, rerollHunterContracts, setHunterTargetBlocked, skipHunterContract, purchaseHunterUpgrade } from './huntersOrderRuntime'
import { BALANCE } from '../../core/balance/balance'
import type { HunterContractState } from '../../types'

const contract = (targetSpec: HunterContractState['targetSpec'], tier: HunterContractState['tier'] = 'routine'): HunterContractState => ({ id: 'test-contract', targetSpec, target: 1, progress: 0, tier, reputationReward: 100, marksReward: 3 })
const unlock = () => { const state = createInitialState(); state.progress.bossKillsByBoss['corrupted-greatbear'] = 1; return state }

describe('Hunter Order hardened runtime', () => {
  it('generates unique seeded generalized offers and save state preserves the next sequence', () => {
    const a = unlock(); const b = unlock()
    a.progress.huntersOrder.reputation = b.progress.huntersOrder.reputation = 1800
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

  it('uses seeded archetype weights rather than the number of candidates per archetype', () => {
    const counts: Record<HunterContractState['targetSpec']['type'], number> = { monster: 0, family: 0, region: 0, alignment: 0, boss: 0 }
    for (let seed = 1; seed <= 400; seed += 1) {
      const state = unlock()
      state.progress.huntersOrder.reputation = 10000
      state.progress.huntersOrder.rngState = seed
      generateHunterContractChoices(state).forEach((offer) => { counts[offer.targetSpec.type] += 1 })
    }
    expect(counts.monster).toBeGreaterThan(counts.family)
    expect(counts.family).toBeGreaterThan(counts.alignment)
    expect(counts.boss).toBeGreaterThan(0)
  })

  it('uses Hunter-owned quality weights independently from Arcane Guild weights', () => {
    const huntersBalance = BALANCE.huntersOrder as unknown as { qualityWeights: { routine: number; special: number; prestigious: number } }
    const previous = huntersBalance.qualityWeights
    try {
      huntersBalance.qualityWeights = { routine: 0, special: 1, prestigious: 0 }
      const state = unlock()
      state.progress.huntersOrder.reputation = 1000
      expect(generateHunterContractChoices(state).every((offer) => offer.tier === 'special')).toBe(true)
    } finally {
      huntersBalance.qualityWeights = previous
    }
  })

  it('matches specific monster, family, region, alignment, and boss objectives', () => {
    const state = unlock()
    const specific = contract({ type: 'monster', monsterId: 'ashen-tracker' })
    expect(doesMonsterMatchHunterContract(specific, 'ashen-tracker', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(specific, 'gloamfang-stalker', 'hunters-ground')).toBe(false)
    expect(doesMonsterMatchHunterContract(contract({ type: 'family', familyId: 'Gloamridge Predators' }), 'gloamfang-stalker', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(contract({ type: 'region', dungeonId: 'hunters-ground' }), 'ashen-tracker', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(contract({ type: 'region', dungeonId: 'hunters-ground' }), 'ashen-tracker', 'howling-den')).toBe(false)
    expect(doesMonsterMatchHunterContract(contract({ type: 'alignment', alignmentId: 'Wild' }), 'ashen-tracker', 'hunters-ground')).toBe(true)
    expect(doesMonsterMatchHunterContract(contract({ type: 'boss', monsterId: 'nightglass-alpha' }, 'prestigious'), 'nightglass-alpha', 'hunters-ground')).toBe(true)
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
    expect(DUNGEONS['hunters-ground'].boss).toBe('nightglass-alpha')
  })

  it('keeps block capacity, protects active eligibility, and permits unblocking', () => {
    const state = unlock()
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
    expect(getHunterRankProgress(250).progress).toBe(0)
    expect(getHunterRankProgress(525).progress).toBe(0.5)
    expect(getHunterRankProgress(800).progress).toBe(0)
    expect(getHunterRankProgress(9000)).toMatchObject({ nextRank: null, progress: 1 })
  })

  it('does not authorize Apex targets with an unrelated or under-tier contract', () => {
    const state = unlock()
    state.progress.huntersOrder.reputation = 7000
    state.progress.huntersOrder.activeContract = contract({ type: 'monster', monsterId: 'ashen-tracker' }, 'routine')
    expect(getHunterAuthorization(state, 'nightglass-alpha', 'hunters-ground')).toEqual({ authorized: false, reason: 'contract-tier-locked' })
    state.progress.huntersOrder.activeContract = contract({ type: 'boss', monsterId: 'nightglass-alpha' }, 'prestigious')
    expect(canHuntMonster(state, 'nightglass-alpha', 'hunters-ground')).toBe(true)
  })

  it('gates authored upgrades by Hunter Rank and adds the Contract Portfolio choices', () => {
    const state = unlock()
    const order = state.progress.huntersOrder
    order.hunterMarks = 100
    expect(getHunterContractChoiceCount(state)).toBe(BALANCE.huntersOrder.baseContractChoices)
    expect(getHunterUpgradePurchaseStatus(state, 'contract-portfolio')).toMatchObject({ canPurchase: false, reason: 'rank-required', requiredRank: { id: 'scout' } })
    expect(purchaseHunterUpgrade(state, 'contract-portfolio')).toBe(false)

    order.reputation = 250
    expect(purchaseHunterUpgrade(state, 'contract-portfolio')).toBe(true)
    expect(getHunterContractChoiceCount(state)).toBe(BALANCE.huntersOrder.baseContractChoices + 1)
    expect(order.availableContracts).toHaveLength(Math.min(getHunterContractChoiceCount(state), 5))
  })

  it('reduces Reroll and Skip costs through their authored upgrades', () => {
    const state = unlock()
    const order = state.progress.huntersOrder
    order.reputation = 6500
    order.hunterMarks = 200
    expect(getHunterRerollMarkCost(state)).toBe(BALANCE.huntersOrder.rerollMarkCost)
    expect(getHunterSkipMarkCost(state)).toBe(BALANCE.huntersOrder.skipMarkCost)
    expect(purchaseHunterUpgrade(state, 'negotiated-rerolls')).toBe(true)
    expect(purchaseHunterUpgrade(state, 'order-privilege')).toBe(true)
    expect(getHunterRerollMarkCost(state)).toBe(BALANCE.huntersOrder.rerollMarkCost - 1)
    expect(getHunterSkipMarkCost(state)).toBe(BALANCE.huntersOrder.skipMarkCost - 1)
  })

  it('requires a matching explicit Boss contract for Nightglass Alpha at Master Hunter', () => {
    const state = unlock()
    state.progress.huntersOrder.reputation = 10000
    state.progress.huntersOrder.activeContract = contract({ type: 'region', dungeonId: 'hunters-ground' }, 'prestigious')
    expect(getHunterAuthorization(state, 'nightglass-alpha', 'hunters-ground')).toEqual({ authorized: false, reason: 'contract-target-mismatch' })
    state.progress.huntersOrder.activeContract = contract({ type: 'boss', monsterId: 'nightglass-alpha' }, 'prestigious')
    expect(getHunterAuthorization(state, 'nightglass-alpha', 'hunters-ground')).toEqual({ authorized: true })
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

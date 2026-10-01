import { describe, expect, it } from 'vitest'
import { HUNTER_UPGRADES } from '../../content/hunters-order/hunterUpgrades'
import { createInitialState } from '../../../store/initialState'
import { getHunterUpgradeEffectBreakdown, getHunterForecastPresentation } from './hunterUpgradeEffectBreakdown'
import { getHunterUpgradePurchaseStatus } from '../../systems/hunters-order/huntersOrderRuntime'
import type { DungeonStatisticsSession } from '../../telemetry/dungeon/dungeonStatisticsTypes'
import type { HunterContractState } from '../../types'
import { resolvePreferredHunterContractMonster } from './hunterContractCombatPresentation'
import { getHunterRerollMarkCost, getHunterContractTargetReduction } from '../../systems/hunters-order/huntersOrderRuntime'

const stateAtStanding = () => {
  const state = createInitialState()
  state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
  state.progress.huntersOrder.reputation = 32_500
  state.progress.huntersOrder.hunterMarks = 100_000
  return state
}
const contract: HunterContractState = { id: 'forecast-contract', targetSpec: { type: 'monster', monsterId: 'ashen-tracker' }, huntingGroundId: 'hunters-ground', target: 12, progress: 3, tier: 'routine', reputationReward: 100, marksReward: 3 }

describe('Hunter upgrade effect presentation', () => {
  it('keeps one-time services inactive at rank zero while explaining their unlock', () => {
    const state = stateAtStanding()
    for (const id of ['hunt-forecast', 'board-forecast', 'quarry-memory', 'master-dossier', 'dispatch-directives', 'priority-dispatch']) {
      const breakdown = getHunterUpgradeEffectBreakdown(state, id)!
      expect(breakdown.current).toEqual(['Not active'])
      expect(breakdown.rankRows[0]?.label).not.toBe('Not active')
      expect(breakdown.maximum.length).toBeGreaterThan(0)
    }
  })

  it('describes cumulative Dispatch Directives and Priority Dispatch ranks', () => {
    const state = stateAtStanding()
    const directives = getHunterUpgradeEffectBreakdown(state, 'dispatch-directives')!
    const priority = getHunterUpgradeEffectBreakdown(state, 'priority-dispatch')!
    expect(directives.rankRows.map(({ label }) => label)).toEqual([
      'Preferred Contract Type selector',
      'Preferred Contract Type selector · 2× preferred archetype generation weight',
      'Preferred Contract Type selector · 2× preferred archetype generation weight · Guarantee one preferred-type offer when eligible',
    ])
    expect(priority.rankRows.map(({ label }) => label)).toEqual([
      'Preferred Hunting Ground selector',
      'Preferred Hunting Ground selector · 2× preferred Ground generation weight',
      'Preferred Hunting Ground selector · 2× preferred Ground generation weight · Guarantee one preferred-Ground offer when eligible',
    ])
  })

  it('caps Contract Recall at rank two and clamps legacy over-rank saves', () => {
    const recall = HUNTER_UPGRADES.find(({ id }) => id === 'contract-recall')!
    const state = stateAtStanding()
    state.progress.huntersOrder.purchasedUpgrades['contract-recall'] = 3
    expect(recall.maxRank).toBe(2)
    expect(getHunterUpgradePurchaseStatus(state, 'contract-recall')).toMatchObject({ ownedRank: 2, reason: 'max-rank', canPurchase: false })
  })

  it('keeps Ground Survey and Priority Dispatch locked until another enabled ground exists', () => {
    const state = stateAtStanding()
    expect(getHunterUpgradePurchaseStatus(state, 'ground-survey')).toMatchObject({ canPurchase: false, reason: 'ground-required' })
    expect(getHunterUpgradePurchaseStatus(state, 'priority-dispatch')).toMatchObject({ canPurchase: false, reason: 'ground-required' })
    expect(getHunterUpgradeEffectBreakdown(state, 'ground-survey')?.rankRows[0]?.label).not.toBe('Not active')
  })

  it('shows locked upgrades full current, next, maximum, and rank detail', () => {
    const state = createInitialState()
    const view = getHunterUpgradeEffectBreakdown(state, 'exact-quarry-briefing')!
    expect(view).toMatchObject({ current: ['Not active'], next: expect.any(Array), maximum: expect.any(Array), rankRows: expect.any(Array) })
    expect(view.rankRows[0]?.label).toContain('Monster')
  })

  it('matches Inspector numbers to runtime costs and Contract reduction calculations', () => {
    const state = stateAtStanding()
    state.progress.huntersOrder.purchasedUpgrades['negotiated-rerolls'] = 2
    state.progress.huntersOrder.purchasedUpgrades['trail-kit'] = 2
    expect(getHunterUpgradeEffectBreakdown(state, 'negotiated-rerolls')).toMatchObject({
      current: [`${getHunterRerollMarkCost(state)} Hunter Mark refresh cost`],
      next: [`Rank 3 · 1 Hunter Mark refresh cost`],
      maximum: ['1 Hunter Mark refresh cost'],
    })
    const reduction = getHunterContractTargetReduction(state, 'monster', 'routine')
    expect(getHunterUpgradeEffectBreakdown(state, 'trail-kit')?.current[0]).toContain(`Monster Contracts −${Math.round(reduction * 100)}% target`)
    expect(getHunterUpgradeEffectBreakdown(state, 'broad-assignment-pay')?.tileEffect).toBe('+1 Mark / broad Contract')
    expect(getHunterUpgradeEffectBreakdown(state, 'resonant-completion')?.tileEffect).toBe('Formula-based Resonance / completion / rank')
  })

  it('uses a remembered quarry only when it remains eligible for the active contract', () => {
    const state = stateAtStanding()
    const broad = { ...contract, targetSpec: { type: 'family' as const, familyId: 'Gloamridge Predators' } }
    state.progress.huntersOrder.activeContract = broad
    state.progress.huntersOrder.lastSelectedQuarryByGround = { 'hunters-ground': 'veilwing-harrier' }
    expect(resolvePreferredHunterContractMonster(state, broad)).toBe('veilwing-harrier')
    state.progress.huntersOrder.lastSelectedQuarryByGround['hunters-ground'] = 'runehorn-brute'
    expect(resolvePreferredHunterContractMonster(state, broad)).not.toBe('runehorn-brute')
  })
})

describe('Hunter measured forecast presentation', () => {
  it('returns unavailable until three completed eligible encounters at the contract ground exist', () => {
    const state = stateAtStanding()
    const session = { locationId: 'hunters-ground', hunterEncounterSamplesByMonster: { 'ashen-tracker': { kills: 2, combatMs: 20_000 } } } as unknown as DungeonStatisticsSession
    expect(getHunterForecastPresentation(state, session, contract)).toMatchObject({ kills: 2, killsPerHour: null, etaMs: null })
    expect(getHunterForecastPresentation(state, { ...session, locationId: 'whispering-woods' }, contract)).toBeNull()
  })

  it('uses measured eligible kill time to calculate rate and remaining contract estimate', () => {
    const state = stateAtStanding()
    const session = { locationId: 'hunters-ground', hunterEncounterSamplesByMonster: { 'ashen-tracker': { kills: 4, combatMs: 20_000 } } } as unknown as DungeonStatisticsSession
    const forecast = getHunterForecastPresentation(state, session, contract)
    expect(forecast?.averageKillMs).toBe(5_000)
    expect(forecast?.killsPerHour).toBe(720)
    expect(forecast?.etaMs).toBe(45_000)
  })
})

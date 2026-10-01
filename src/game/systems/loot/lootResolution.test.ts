import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { resolvePowerScaledCurrencyRewardRange } from './powerScaledCurrencyRewards'
import { resolveMonsterLoot } from './lootResolution'
import { getHunterHarvestBonuses } from '../hunters-order/huntersOrderRuntime'

describe('monster loot resolution', () => {
  it('grants universal Life Essence through the normal item acquisition path', () => {
    const state = createInitialState()
    const drops: Array<[string, number]> = []
    resolveMonsterLoot(state, 'forest-wisp', (itemId, quantity) => drops.push([itemId, quantity]), () => 0)
    expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
    expect(state.inventory['life-essence']).toBe(resolvePowerScaledCurrencyRewardRange('forest-wisp', 'life-essence', 1).finalMin)
    expect(drops.filter(([itemId]) => itemId === 'artifact-essence')).toHaveLength(1)
    expect(drops.filter(([itemId]) => itemId === 'life-essence')).toHaveLength(1)
    expect(Object.keys(state.inventory).some((itemId) => (state.inventory[itemId as keyof typeof state.inventory] ?? 0) > 0 && ['ember-staff', 'wispweave-robe', 'wispveil-hood'].includes(itemId))).toBe(false)
  })

  it('scales Life Essence after rolling its WT1 base quantity', () => {
    const wt1 = createInitialState()
    const wt5 = createInitialState()
    wt5.worldTier = { current: 5, highestUnlocked: 5 }
    resolveMonsterLoot(wt1, 'forest-wisp', undefined, () => 0)
    resolveMonsterLoot(wt5, 'forest-wisp', undefined, () => 0)
    const base = resolvePowerScaledCurrencyRewardRange('forest-wisp', 'life-essence', 1)
    const wt5Range = resolvePowerScaledCurrencyRewardRange('forest-wisp', 'life-essence', 5)
    expect(wt1.inventory['life-essence']).toBe(base.baseMin)
    expect(wt5.inventory['life-essence']).toBe(wt5Range.finalMin)
  })

  it('uses the encounter snapshot instead of the current global tier', () => {
    const state = createInitialState()
    state.worldTier = { current: 1, highestUnlocked: 4 }
    state.combat.enemyWorldTier = 4
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0)
    expect(state.inventory['life-essence']).toBe(resolvePowerScaledCurrencyRewardRange('forest-wisp', 'life-essence', 4).finalMin)
  })

  it('applies Hunter material and Sigil chance upgrades as relative multipliers only for authorized quarry', () => {
    const base = createInitialState()
    const boosted = createInitialState()
    for (const state of [base, boosted]) {
      state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
      state.progress.huntersOrder.activeContract = { id: 'authorized-hunt', huntingGroundId: 'hunters-ground', targetSpec: { type: 'monster', monsterId: 'ashen-tracker' }, target: 10, progress: 0, tier: 'routine', reputationReward: 20, marksReward: 3 }
      state.sigils.lifetimeDrops = 1
    }
    boosted.progress.huntersOrder.purchasedUpgrades['fragment-rights'] = 3
    boosted.progress.huntersOrder.purchasedUpgrades['sigil-claim'] = 3
    const drops: string[] = []
    resolveMonsterLoot(base, 'ashen-tracker', (itemId) => drops.push(itemId), () => 0.18, undefined, getHunterHarvestBonuses(base, 'ashen-tracker', 'hunters-ground'))
    expect(drops).not.toContain('fire-fragment')
    drops.length = 0
    resolveMonsterLoot(boosted, 'ashen-tracker', (itemId) => drops.push(itemId), () => 0.18, undefined, getHunterHarvestBonuses(boosted, 'ashen-tracker', 'hunters-ground'))
    expect(drops).toContain('fire-fragment')

    let baseSigil = false
    let boostedSigil = false
    resolveMonsterLoot(base, 'ashen-tracker', undefined, () => 0.041, () => { baseSigil = true }, getHunterHarvestBonuses(base, 'ashen-tracker', 'hunters-ground'))
    resolveMonsterLoot(boosted, 'ashen-tracker', undefined, () => 0.041, () => { boostedSigil = true }, getHunterHarvestBonuses(boosted, 'ashen-tracker', 'hunters-ground'))
    expect(baseSigil).toBe(false)
    expect(boostedSigil).toBe(true)
  })

  it('keeps every monster on the generic material-only authored loot path', () => {
    Object.values(MONSTERS).forEach((monster) => {
      expect(monster.loot.some((drop) => drop.itemId === 'life-essence' || drop.itemId === 'artifact-essence')).toBe(false)
      const state = createInitialState()
      resolveMonsterLoot(state, monster.id, undefined, () => 0)
      expect(state.inventory['life-essence']).toBeGreaterThan(0)
      expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
    })
  })

  it.each([
    ['common', .25], ['refined', .85], ['perfect', .98], ['legendary', .999],
  ] as const)('auto-salvages a future %s Combat drop when enabled', (quality, roll) => {
    const state = createInitialState()
    state.sigils.firstDropPityKills = 4
    state.sigils.autoSalvage[quality] = true
    let result: { quality: string; instanceId: string; autoSalvaged: boolean; dustGranted: number } | undefined

    resolveMonsterLoot(state, 'forest-wisp', undefined, () => roll, (drop) => { result = drop })

    expect(result).toMatchObject({ quality, autoSalvaged: true })
    expect(state.sigils.storage[result!.instanceId]).toBeUndefined()
    expect(result!.dustGranted).toBeGreaterThan(0)
    expect(state.sigils.discovery.qualitiesFound[quality]).toBe(true)
  })
  it('emits a structured Sigil loot result for live and offline consumers', () => {
    const state = createInitialState()
    let result: { quality: string; tier: number; instanceId: string; autoSalvaged: boolean } | undefined
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0, (drop) => { result = drop })
    expect(result).toMatchObject({ tier: 1, autoSalvaged: false })
    expect(result?.instanceId).toMatch(/^sigil:/)
  })
})

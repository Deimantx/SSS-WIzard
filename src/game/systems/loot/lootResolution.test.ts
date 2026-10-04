import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { resolveCombatCurrencyRewardRange } from './combatCurrencyRewards'
import { resolveMonsterLoot } from './lootResolution'
import { getHunterHarvestBonuses } from '../hunters-order/huntersOrderRuntime'
import { resolveCombatLootContext, resolveLootChance } from './universalLootRuntime'
import { UNIVERSAL_LOOT_TIERS } from '../../content/loot/universalLootTiers'

describe('monster loot resolution', () => {
  it('grants universal Life Essence through the normal item acquisition path', () => {
    const state = createInitialState()
    const drops: Array<[string, number]> = []
    resolveMonsterLoot(state, 'forest-wisp', (itemId, quantity) => drops.push([itemId, quantity]), () => 0)
    expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
    expect(state.inventory['life-essence']).toBe(resolveCombatCurrencyRewardRange('forest-wisp', 'life-essence').finalMin)
    expect(drops.filter(([itemId]) => itemId === 'artifact-essence')).toHaveLength(1)
    expect(drops.filter(([itemId]) => itemId === 'life-essence')).toHaveLength(1)
    expect(Object.keys(state.inventory).some((itemId) => (state.inventory[itemId as keyof typeof state.inventory] ?? 0) > 0 && ['ember-staff', 'wispweave-robe', 'wispveil-hood'].includes(itemId))).toBe(false)
  })

  it('uses the canonical Power-selected Life Essence quantity', () => {
    const first = createInitialState()
    const second = createInitialState()
    resolveMonsterLoot(first, 'forest-wisp', undefined, () => 0)
    resolveMonsterLoot(second, 'forest-wisp', undefined, () => 0)
    const base = resolveCombatCurrencyRewardRange('forest-wisp', 'life-essence')
    const secondRange = resolveCombatCurrencyRewardRange('forest-wisp', 'life-essence')
    expect(first.inventory['life-essence']).toBe(base.finalMin)
    expect(second.inventory['life-essence']).toBe(secondRange.finalMin)
  })

  it('uses the canonical enemy profile for reward quantities', () => {
    const state = createInitialState()
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0)
    expect(state.inventory['life-essence']).toBe(resolveCombatCurrencyRewardRange('forest-wisp', 'life-essence').finalMin)
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
    const baseHunter = getHunterHarvestBonuses(base, 'ashen-tracker', 'hunters-ground')
    const boostedHunter = getHunterHarvestBonuses(boosted, 'ashen-tracker', 'hunters-ground')
    const context = resolveCombatLootContext('ashen-tracker')
    const material = MONSTERS['ashen-tracker'].loot.find((drop) => drop.itemId === 'fire-fragment')!
    const baseMaterialChance = resolveLootChance(material.baseChance, context, baseHunter.itemDropMultiplier)
    const boostedMaterialChance = resolveLootChance(material.baseChance, context, boostedHunter.itemDropMultiplier)
    const materialRoll = (baseMaterialChance + boostedMaterialChance) / 2
    resolveMonsterLoot(base, 'ashen-tracker', (itemId) => drops.push(itemId), () => materialRoll, undefined, baseHunter)
    expect(drops).not.toContain('fire-fragment')
    drops.length = 0
    resolveMonsterLoot(boosted, 'ashen-tracker', (itemId) => drops.push(itemId), () => materialRoll, undefined, boostedHunter)
    expect(drops).toContain('fire-fragment')

    let baseSigil = false
    let boostedSigil = false
    const baseSigilChance = context.lootTier.sigilDropChance * baseHunter.sigilDropMultiplier
    const boostedSigilChance = context.lootTier.sigilDropChance * boostedHunter.sigilDropMultiplier
    const sigilRoll = (baseSigilChance + boostedSigilChance) / 2
    resolveMonsterLoot(base, 'ashen-tracker', undefined, () => sigilRoll, () => { baseSigil = true }, baseHunter)
    resolveMonsterLoot(boosted, 'ashen-tracker', undefined, () => sigilRoll, () => { boostedSigil = true }, boostedHunter)
    expect(baseSigil).toBe(false)
    expect(boostedSigil).toBe(true)
  })

  it('keeps T20 successful Sigil instances at one normal and five boss Sigils', () => {
    const normalState = createInitialState()
    const bossState = createInitialState()
    const baseContext = resolveCombatLootContext('forest-heart')
    const normalContext = { ...baseContext, lootTier: UNIVERSAL_LOOT_TIERS[19], isBoss: false }
    const bossContext = { ...normalContext, isBoss: true }
    const normalDrops: string[] = []
    const bossDrops: string[] = []
    expect(normalContext.lootTier.quantityMultiplier).toBe(14)
    resolveMonsterLoot(normalState, 'forest-wisp', undefined, () => 0, ({ instanceId }) => normalDrops.push(instanceId), {}, normalContext)
    resolveMonsterLoot(bossState, 'forest-heart', undefined, () => 0, ({ instanceId }) => bossDrops.push(instanceId), {}, bossContext)
    expect(normalDrops).toHaveLength(1)
    expect(bossDrops).toHaveLength(5)
  })

  it('keeps every monster on the generic material-only authored loot path', () => {
    Object.values(MONSTERS).forEach((monster) => {
      expect(monster.loot.some((drop) => drop.itemId === 'life-essence' || drop.itemId === 'artifact-essence')).toBe(false)
      expect(monster.loot.every((drop) => drop.category === 'material')).toBe(true)
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

  it('generates five independent Sigil instances on a natural boss drop', () => {
    const state = createInitialState()
    state.sigils.lifetimeDrops = 1
    const results: Array<{ instanceId: string; slot: number }> = []
    resolveMonsterLoot(state, 'forest-heart', undefined, () => 0, (drop) => results.push(drop))
    expect(results).toHaveLength(5)
    expect(new Set(results.map((drop) => drop.instanceId)).size).toBe(5)
  })

  it('keeps first-drop pity to exactly one Sigil on a boss', () => {
    const state = createInitialState()
    state.sigils.firstDropPityKills = 4
    const results: string[] = []
    resolveMonsterLoot(state, 'forest-heart', undefined, () => .99, (drop) => results.push(drop.instanceId))
    expect(results).toHaveLength(1)
  })
})

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { SIGIL_TIERS, resolveSigilTierFromDefinitions, resolveSigilTierFromEnemyPower } from '../../content/sigils/sigilTiers'
import { getSigilQualityDefinition } from '../../content/sigils/sigilQualities'
import { getSigilSetBonusCount, getSigilSetBonuses } from '../../content/sigils/sigilSets'
import { generateSigil } from './sigilGeneration'
import { getActiveSigilTraitIds, resolveSigilStatsForInstance } from './sigilRuntime'
import { enhanceSigil } from './sigilEnhancement'
import { salvageSigil } from './sigilSalvage'
import { resolveMonsterLoot } from '../loot/lootResolution'
import { migrateSave } from '../../../persistence/migrations'
import { getActiveSigilCombatProviders } from './sigilCombatRuntime'
import { processSigilSpecialCombatEvent } from './sigilCombatRuntime'
import { getCombatModifiers } from '../combat/modifiers'
import { getEffectiveManaCost } from '../combat/combatStats'
import { createOfflineBankReportCollector } from '../offline-bank/offlineBankReport'
import type { CombatSource } from '../combat/combatTypes'
import { isDirectPlayerSpell } from '../spells/spellSource'
import { spawnEnemy } from '../combat/combatRuntime'
import { advanceWithOfflineBank } from '../offline-bank/offlineBankSimulation'

const equipDebugSigil = (state: ReturnType<typeof createInitialState>, slot: 1 | 2 | 3 | 4, setId: 'arcane' | 'echo' | 'precision' | 'sage' | 'tempest', traitIds: string[] = []) => {
  const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: setId, forcedSlot: slot, forcedQuality: 'legendary', rng: () => .1, source: 'debug' })
  sigil.traitIds = traitIds as typeof sigil.traitIds
  state.sigils.equipped[slot] = sigil.instanceId
}

describe('Arcane Sigils', () => {
  it('resolves authored tiers from resolved enemy Power boundaries', () => {
    expect(resolveSigilTierFromEnemyPower(0)).toBe(1)
    expect(resolveSigilTierFromEnemyPower(4999)).toBe(1)
    expect(resolveSigilTierFromEnemyPower(5000)).toBe(2)
    expect(resolveSigilTierFromEnemyPower(999999)).toBe(2)
    expect(SIGIL_TIERS).toHaveLength(2)
    expect(resolveSigilTierFromDefinitions(12000, [...SIGIL_TIERS, { ...SIGIL_TIERS[1], tier: 3, label: 'T3', minEnemyPower: 10000 }])).toBe(3)
  })

  it('derives stronger main and secondary values for T2', () => {
    const state = createInitialState()
    const t1 = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 1, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, rng: () => .5 })
    const t2 = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 5000, forcedTier: 2, forcedSetId: 'arcane', forcedSlot: 1, rng: () => .5 })
    expect(resolveSigilStatsForInstance(t2).spellPower).toBeGreaterThan(resolveSigilStatsForInstance(t1).spellPower ?? 0)
  })

  it('keeps quality caps and trait milestones authored', () => {
    expect(getSigilQualityDefinition('common')).toMatchObject({ maxRank: 10, startingSecondaries: 0, traitCount: 0 })
    expect(getSigilQualityDefinition('refined')).toMatchObject({ maxRank: 12, startingSecondaries: 1, traitCount: 0 })
    expect(getSigilQualityDefinition('perfect')).toMatchObject({ maxRank: 15, startingSecondaries: 2, traitCount: 1 })
    expect(getSigilQualityDefinition('legendary')).toMatchObject({ maxRank: 20, startingSecondaries: 3, traitCount: 2 })
  })

  it('counts repeated two-piece bonuses and only one four-piece bonus', () => {
    expect(getSigilSetBonusCount('precision', 2)).toBe(1)
    expect(getSigilSetBonusCount('precision', 4)).toBe(2)
    expect(getSigilSetBonusCount('precision', 6)).toBe(3)
    expect(getSigilSetBonusCount('tempest', 3)).toBe(0)
    expect(getSigilSetBonusCount('tempest', 6)).toBe(1)
    expect(getSigilSetBonuses({ precision: 4 }).critChance).toBeCloseTo(.15)
  })

  it('enhances with dust and records milestone rolls', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, qualityWeights: { common: 0, refined: 0, perfect: 0, legendary: 100 }, rng: () => .5 })
    state.sigils.dust = 100000
    const result = enhanceSigil(state, sigil.instanceId, { bypassGlobalCap: true, rng: () => .5 })
    expect(result.ok).toBe(true)
    expect(sigil.rank).toBe(1)
    for (let rank = 2; rank <= 15; rank += 1) enhanceSigil(state, sigil.instanceId, { bypassGlobalCap: true, rng: () => .5 })
    expect(sigil.traitIds).toHaveLength(1)
    expect(sigil.rollHistory.some((entry) => entry.kind === 'trait' && entry.rank === 15)).toBe(true)
  })

  it('grants Legendary Trait I at +15 and Trait II at +20 without a secondary at +20', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'legendary', rng: () => .5 })
    state.sigils.dust = 1_000_000
    for (let rank = 1; rank <= 20; rank += 1) expect(enhanceSigil(state, sigil.instanceId, { bypassGlobalCap: true, rng: () => .5 }).ok).toBe(true)
    expect(sigil.traitIds).toHaveLength(2)
    expect(new Set(sigil.traitIds).size).toBe(2)
    expect(sigil.rollHistory.filter((entry) => entry.kind === 'trait')).toHaveLength(2)
    expect(sigil.rollHistory.some((entry) => entry.rank === 20 && entry.kind !== 'trait')).toBe(false)
  })

  it('supports free debug-style enhancement without spending Dust', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'common', rng: () => .5, source: 'debug' })
    state.sigils.dust = 0
    expect(enhanceSigil(state, sigil.instanceId, { bypassGlobalCap: true, free: true, rng: () => .5 })).toMatchObject({ ok: true, cost: 0 })
    expect(state.sigils.dust).toBe(0)
    expect(state.sigils.lifetimeDrops).toBe(0)
  })

  it('exposes mechanical providers for every equipped combat Set and Trait', () => {
    const state = createInitialState()
    for (let slot = 1; slot <= 4; slot += 1) {
      const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'tempest', forcedSlot: slot as 1 | 2 | 3 | 4, forcedQuality: 'legendary', rng: () => .1, source: 'debug' })
      state.sigils.equipped[slot as 1 | 2 | 3 | 4] = sigil.instanceId
    }
    state.combat.inBossFight = true
    const providers = getActiveSigilCombatProviders(state)
    expect(providers.map((provider) => provider.id)).toContain('set:tempest')
  })

  it('executes Tempest cooldown reduction and Predator boss damage', () => {
    const state = createInitialState()
    for (let slot = 1; slot <= 4; slot += 1) {
      const tempest = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'tempest', forcedSlot: slot as 1 | 2 | 3 | 4, forcedQuality: 'legendary', rng: () => .1, source: 'debug' })
      state.sigils.equipped[slot as 1 | 2 | 3 | 4] = tempest.instanceId
    }
    state.combat.spellCooldowns['fire-bolt'] = 1000
    const source: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'fire-bolt', tags: ['spell', 'direct'] }
    for (let cast = 0; cast < 5; cast += 1) processSigilSpecialCombatEvent(state, 'player', 'on-spell-cast', { source }, () => undefined, 0)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(700)

    const predatorState = createInitialState()
    for (let slot = 1; slot <= 4; slot += 1) {
      const predator = generateSigil({ state: predatorState, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'predator', forcedSlot: slot as 1 | 2 | 3 | 4, forcedQuality: 'legendary', rng: () => .1, source: 'debug' })
      predatorState.sigils.equipped[slot as 1 | 2 | 3 | 4] = predator.instanceId
    }
    predatorState.combat.inBossFight = true
    expect(getCombatModifiers(predatorState, 'player', 'damage-dealt-percent', { source })).toBeCloseTo(.15)
    predatorState.combat.inBossFight = false
    expect(getCombatModifiers(predatorState, 'player', 'damage-dealt-percent', { source })).toBe(0)
  })

  it('applies Efficient Cycle to the next committed spell and keeps failed casts out of the count', () => {
    const state = createInitialState()
    equipDebugSigil(state, 1, 'sage', ['efficient-cycle'])
    const source: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'fire-bolt', tags: ['spell', 'direct'] }
    const committed = { source, sourceTags: ['spell', 'direct'] as const }

    expect(getEffectiveManaCost(state, 100)).toBe(100)
    for (let cast = 0; cast < 5; cast += 1) processSigilSpecialCombatEvent(state, 'player', 'on-spell-cast', committed, () => undefined, 0)
    expect(state.combat.sigilRuntime.spellCastCount).toBe(5)
    expect(getEffectiveManaCost(state, 100)).toBe(80)

    processSigilSpecialCombatEvent(state, 'player', 'on-spell-cast', committed, () => undefined, 0)
    expect(state.combat.sigilRuntime.spellCastCount).toBe(6)
    expect(getEffectiveManaCost(state, 100)).toBe(100)
    expect(getEffectiveManaCost(state, 100)).toBe(100)
  })

  it('limits Critical Flow to direct critical hits with a one-second internal cooldown', () => {
    const state = createInitialState()
    equipDebugSigil(state, 1, 'precision', ['critical-flow'])
    state.combat.spellCooldowns['fire-bolt'] = 1000
    const directSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'fire-bolt', tags: ['spell', 'direct'] }

    processSigilSpecialCombatEvent(state, 'player', 'on-spell-hit', { source: directSource, sourceTags: ['spell', 'direct'], critical: true }, () => undefined, 0)
    processSigilSpecialCombatEvent(state, 'player', 'on-spell-hit', { source: directSource, sourceTags: ['spell', 'direct'], critical: true }, () => undefined, 0)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(850)
    state.combat.arcaneCoreRuntime.elapsedMs = 1000
    processSigilSpecialCombatEvent(state, 'player', 'on-spell-hit', { source: directSource, sourceTags: ['spell', 'direct'], critical: true }, () => undefined, 0)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(700)

    const indirectState = createInitialState()
    equipDebugSigil(indirectState, 1, 'precision', ['critical-flow'])
    indirectState.combat.spellCooldowns['fire-bolt'] = 1000
    processSigilSpecialCombatEvent(indirectState, 'player', 'on-spell-hit', { source: directSource, critical: true }, () => undefined, 0)
    expect(indirectState.combat.spellCooldowns['fire-bolt']).toBe(1000)
  })

  it('lets Echo Set copy direct damage and healing spells, but not status ticks or recursively copied spells', () => {
    expect(isDirectPlayerSpell('fire-bolt')).toBe(true)
    expect(isDirectPlayerSpell('mending-waters')).toBe(true)
    expect(isDirectPlayerSpell('regeneration')).toBe(false)

    const directState = createInitialState()
    for (let slot = 1; slot <= 4; slot += 1) equipDebugSigil(directState, slot as 1 | 2 | 3 | 4, 'echo')
    const directSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'fire-bolt', tags: ['spell', 'direct'] }
    let echoCalls = 0
    let echoSeed = 0
    for (; echoSeed < 1000 && echoCalls === 0; echoSeed += 1) {
      directState.combat.sigilRuntime.spellCastCount = 0
      directState.combat.combatRngState = echoSeed
      echoCalls = 0
      processSigilSpecialCombatEvent(directState, 'player', 'on-spell-cast', { source: directSource, sourceTags: ['spell', 'direct'] }, () => { echoCalls += 1 }, 0)
    }
    expect(echoCalls).toBe(1)

    const statusState = createInitialState()
    for (let slot = 1; slot <= 4; slot += 1) equipDebugSigil(statusState, slot as 1 | 2 | 3 | 4, 'echo')
    statusState.combat.combatRngState = echoSeed - 1
    let statusCalls = 0
    processSigilSpecialCombatEvent(statusState, 'player', 'on-spell-cast', { source: directSource, sourceTags: ['spell', 'magic'] }, () => { statusCalls += 1 }, 0)
    expect(statusCalls).toBe(0)
  })

  it('deduplicates UNIQUE traits while preserving repeated non-unique traits', () => {
    const state = createInitialState()
    const uniqueA = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'restoration', forcedSlot: 1, source: 'debug', rng: () => .2 })
    const uniqueB = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'restoration', forcedSlot: 2, source: 'debug', rng: () => .2 })
    uniqueA.traitIds = ['restorative-echo', 'execution-mark']
    uniqueB.traitIds = ['restorative-echo', 'execution-mark']
    state.sigils.equipped[1] = uniqueA.instanceId
    state.sigils.equipped[2] = uniqueB.instanceId
    const active = getActiveSigilTraitIds(state)
    expect(active.filter((traitId) => traitId === 'restorative-echo')).toHaveLength(1)
    expect(active.filter((traitId) => traitId === 'execution-mark')).toHaveLength(2)
  })

  it('records Sigil quality in the offline report without putting Sigils in item loot', () => {
    const state = createInitialState()
    const collector = createOfflineBankReportCollector(state, 1000, 0)
    collector.recordSigil({ instanceId: 'sigil:test', setId: 'echo', slot: 1, tier: 2, quality: 'legendary', autoSalvaged: false, dustGranted: 0 })
    const report = collector.finalize(state)
    expect(report.combat.sigilsFound).toBe(1)
    expect(report.combat.legendarySigils).toBe(1)
    expect(report.combat.loot).toEqual({})
  })

  it('protects locked and equipped sigils from salvage', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, rng: () => .5 })
    sigil.locked = true
    expect(salvageSigil(state, sigil.instanceId)).toMatchObject({ ok: false })
    sigil.locked = false
    state.sigils.equipped[1] = sigil.instanceId
    expect(salvageSigil(state, sigil.instanceId)).toMatchObject({ ok: false })
  })

  it('uses normal first-drop odds for four kills and guarantees the fifth', () => {
    const state = createInitialState()
    state.sigils.autoSalvage.refined = true
    for (let kill = 1; kill <= 4; kill += 1) {
      resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0.8)
      expect(state.sigils.lifetimeDrops).toBe(0)
      expect(state.sigils.firstDropPityKills).toBe(kill)
    }
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0.8)
    expect(state.sigils.lifetimeDrops).toBe(1)
    expect(state.sigils.firstDropPityKills).toBe(0)
    expect(Object.keys(state.sigils.storage)).toHaveLength(0)
    expect(Object.keys(state.sigils.discovery.discoveredSets)).toHaveLength(1)
    expect(state.sigils.dust).toBeGreaterThan(0)

    resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0.8)
    expect(state.sigils.lifetimeDrops).toBe(1)
  })

  it('honors first-Sigil pity in Offline Bank combat and reports it before auto-salvage', async () => {
    const state = createInitialState()
    state.progress.spellRanks['fire-bolt'] = 1
    state.spellPresets.presets = [{ id: 'offline-sigil-test', name: 'Offline Sigil Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
    state.spellPresets.selectedPresetId = 'offline-sigil-test'
    state.sigils.autoSalvage.refined = true
    state.sigils.firstDropPityKills = 4
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.offlineBankMs = 60_000
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.enemyHp = 0

    const result = await advanceWithOfflineBank(60_000, () => state, (recipe) => recipe(state), () => {}, undefined, {})
    expect(result.ok).toBe(true)
    expect(result.report?.combat.sigilsFound).toBeGreaterThanOrEqual(1)
    expect(state.sigils.lifetimeDrops).toBeGreaterThanOrEqual(1)
    expect(Object.keys(state.sigils.discovery.discoveredSets)).toHaveLength(1)
  })

  it('adds a safe default Sigil state to old saves and sanitizes malformed instances', () => {
    const state = migrateSave({ ...createInitialState(), saveVersion: 49, sigils: { storage: { bad: { instanceId: 'bad', setId: 'missing', slot: 9, tier: 99, quality: 'legendary', mainStatId: 'nope' } } } })
    expect(state.sigils.storage).toEqual({})
    expect(state.sigils.equipped).toEqual({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null })
    expect(state.saveVersion).toBe(createInitialState().saveVersion)
  })

  it('preserves authored discovery evidence even when storage has been salvaged', () => {
    const raw = createInitialState()
    raw.sigils.discovery.discoveredSets.echo = true
    raw.sigils.discovery.discoveredSlotsBySet.echo = { 2: true }
    raw.sigils.discovery.bestQualityBySet.echo = 'perfect'
    raw.sigils.discovery.bestTierBySet.echo = 2
    raw.sigils.discovery.discoveredTraits['mana-echo'] = true
    raw.sigils.discovery.qualitiesFound.legendary = true
    raw.sigils.discovery.tiersFound[2] = true
    raw.sigils.nextInstanceSequence = 4
    const migrated = migrateSave({ ...raw, saveVersion: 49, sigils: { ...raw.sigils, storage: { 'sigil:9': undefined } } })
    expect(migrated.sigils.discovery.discoveredSets.echo).toBe(true)
    expect(migrated.sigils.discovery.discoveredSlotsBySet.echo).toEqual({ 2: true })
    expect(migrated.sigils.discovery.bestQualityBySet.echo).toBe('perfect')
    expect(migrated.sigils.discovery.bestTierBySet.echo).toBe(2)
    expect(migrated.sigils.discovery.discoveredTraits['mana-echo']).toBe(true)
    expect(migrated.sigils.discovery.qualitiesFound.legendary).toBe(true)
    expect(migrated.sigils.discovery.tiersFound[2]).toBe(true)
    expect(migrated.sigils.nextInstanceSequence).toBe(4)
  })
})

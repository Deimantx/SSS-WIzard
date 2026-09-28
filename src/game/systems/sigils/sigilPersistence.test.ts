import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { loadProfileGame, saveProfileGame, serializeGameState } from '../../../persistence/profileSaveManager'
import { validateSerializedSave } from '../../../persistence/saveIntegrity'
import { generateSigil } from './sigilGeneration'
import { normalizeSigilState } from './sigilStateNormalization'
import { resolveMonsterLoot } from '../loot/lootResolution'
import { advanceWithOfflineBank } from '../offline-bank/offlineBankSimulation'
import { spawnEnemy } from '../combat/combatRuntime'

const validateState = (state: ReturnType<typeof createInitialState>) => validateSerializedSave(JSON.stringify(serializeGameState(state)), state)

describe('Sigil save invariants', () => {
  it('normalizes legacy two-quality Auto-Salvage settings into all authored qualities', () => {
    const normalized = normalizeSigilState({ autoSalvage: { common: true, refined: false } })
    expect(normalized.autoSalvage).toEqual({ common: true, refined: false, perfect: false, legendary: false })
  })
  it('round-trips a newly generated +0 Sigil with starting Secondary rolls at rank 0', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'legendary', rng: () => .4 })

    expect(sigil.rank).toBe(0)
    expect(sigil.secondaries.length).toBeGreaterThan(0)
    expect(sigil.secondaries.every((secondary) => secondary.rolls.every((roll) => roll.rank === 0))).toBe(true)
    const validation = validateState(state)
    expect(validation.ok).toBe(true)
    expect(validation.report.classification).not.toBe('AUTHORITATIVE_CHANGE')
  })

  it('round-trips the first Sigil created by the fifth-kill pity guarantee', () => {
    const state = createInitialState()
    for (let kill = 1; kill <= 4; kill += 1) {
      resolveMonsterLoot(state, 'forest-wisp', undefined, () => .8)
      expect(state.sigils.lifetimeDrops).toBe(0)
      expect(validateState(state).ok).toBe(true)
    }
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => .8)

    expect(state.sigils.lifetimeDrops).toBe(1)
    const validation = validateState(state)
    expect(validation.ok).toBe(true)
    expect(validation.report.classification).not.toBe('AUTHORITATIVE_CHANGE')
  })

  it('keeps stored controlled Developer Sigils and their Discovery canonical', () => {
    const state = createInitialState()
    const instances = Array.from({ length: 6 }, (_, index) => generateSigil({
      state,
      dungeonId: 'whispering-woods',
      enemyPower: 0,
      forcedTier: index > 3 ? 2 : 1,
      forcedSetId: index % 2 ? 'precision' : 'arcane',
      forcedSlot: (index + 1) as 1 | 2 | 3 | 4 | 5 | 6,
      forcedQuality: 'legendary',
      rng: () => .4,
      source: 'debug',
    }))
    state.sigils.equipped[1] = instances[0]!.instanceId
    state.sigils.equipped[4] = instances[3]!.instanceId

    expect(state.sigils.discovery.discoveredSets.arcane).toBe(true)
    expect(state.sigils.discovery.discoveredSets.precision).toBe(true)
    expect(state.sigils.discovery.bestQualityBySet.arcane).toBe('legendary')
    const validation = validateState(state)
    expect(validation.ok).toBe(true)
    expect(validation.report.classification).not.toBe('AUTHORITATIVE_CHANGE')
  })

  it.each([60_000, 300_000, 900_000, 3_600_000])('commits a %s ms Offline Bank advance containing a Sigil drop', async (durationMs) => {
    localStorage.clear()
    const state = createInitialState()
    state.progress.spellRanks['fire-bolt'] = 1
    state.spellPresets.presets = [{ id: 'offline-p0', name: 'Offline P0', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
    state.spellPresets.selectedPresetId = 'offline-p0'
    state.sigils.firstDropPityKills = 4
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.targetEnemyId = 'forest-wisp'
    state.offlineBankMs = durationMs
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.enemyHp = 0

    const result = await advanceWithOfflineBank(
      durationMs,
      () => state,
      (recipe) => recipe(state),
      (candidate) => candidate ? saveProfileGame('slot-1', candidate) : { ok: false, error: 'Missing candidate.' },
    )

    expect(result.ok, result.error).toBe(true)
    expect(result.report?.combat.sigilsFound).toBeGreaterThanOrEqual(1)
    expect(state.sigils.lifetimeDrops).toBeGreaterThanOrEqual(1)
    expect(state.offlineBankMs).toBe(0)
    expect(validateState(state).ok).toBe(true)
    expect(loadProfileGame('slot-1').state?.sigils.lifetimeDrops).toBeGreaterThanOrEqual(1)
  }, 120_000)
})

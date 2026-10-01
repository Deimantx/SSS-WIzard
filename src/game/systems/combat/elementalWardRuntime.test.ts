import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { applyElementalWard, clearElementalWards, clearExpiredElementalWards, getElementalWardMultiplier } from './elementalWardRuntime'
import { calculateCombatDamage, executeCombatEffects } from './effectResolver'
import { resolveCombatDeaths, spawnNextEnemy } from './combatRuntime'
import { getActiveElementalWardPresentations } from '../../presentation/combat/elementalWardPresentation'
import { SPELLS } from '../../content/spells/spells'

describe('elemental Wards', () => {
  it('reduces matching incoming damage and leaves other elements unchanged', () => {
    const state = createInitialState()
    state.combat.arcaneCoreRuntime.elapsedMs = 100
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 1000 })
    expect(getElementalWardMultiplier(state, 'fire')).toBeCloseTo(0.85)
    expect(getElementalWardMultiplier(state, 'water')).toBe(1)
    expect(getElementalWardMultiplier(state, 'fire', 1100)).toBe(1)
  })

  it('replaces a Ward from the same source and refreshes its duration', () => {
    const state = createInitialState()
    state.combat.arcaneCoreRuntime.elapsedMs = 1000
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 1000 })
    state.combat.arcaneCoreRuntime.elapsedMs = 1500
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 1000 })
    expect(state.combat.elementalDamageReductions).toHaveLength(1)
    expect(state.combat.elementalDamageReductions[0].expiresAt).toBe(2500)
    expect(getElementalWardMultiplier(state, 'fire')).toBeCloseTo(0.85)
  })

  it('applies Ward reduction once after ordinary mitigation', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'fire-elemental'
    state.combat.enemyHp = state.combat.enemyMaxHp = 1000
    const source = { actor: 'enemy' as const, kind: 'action' as const, sourceId: 'fire-hit', sourceMonsterId: 'fire-elemental' as const, tags: ['direct' as const] }
    const withoutWard = calculateCombatDamage(state, 100, 'fire', source, 'player', ['direct'])
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward' })
    const withWard = calculateCombatDamage(state, 100, 'fire', source, 'player', ['direct'])
    expect(withWard.wardMultiplier).toBe(0.85)
    expect(withWard.afterWard).toBeCloseTo(withoutWard.afterDefense * 0.85)
  })

  it('exposes canonical beforeWard, multiplier, afterWard, and prevented values in combat events', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'fire-elemental'
    state.combat.enemyHp = state.combat.enemyMaxHp = 1000
    state.player.maxHealth = state.player.health = 100_000
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward' })
    const events: import('./combatTypes').CombatEvent[] = []

    executeCombatEffects(state, [{
      type: 'deal-damage', target: 'opponent',
      components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 100 } }],
      tags: ['direct', 'fire'],
    }], { actor: 'enemy', kind: 'action', sourceId: 'ward-breakdown-hit', sourceMonsterId: 'fire-elemental', tags: ['direct', 'fire'] }, 0, { push: (event) => events.push(event) })

    const component = events.find((event) => event.target === 'player' && event.damageComponents?.length === 1)?.damageComponents?.[0]
    expect(component).toMatchObject({ wardMultiplier: 0.85 })
    expect(component?.afterWard).toBeCloseTo((component?.beforeWard ?? 0) * 0.85)
    expect(component?.wardPrevented).toBeCloseTo((component?.beforeWard ?? 0) * 0.15)
  })

  it('uses strongest-only reduction for same-element sources and allows different elements together', () => {
    const state = createInitialState()
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward-a' })
    applyElementalWard(state, { element: 'fire', reduction: 0.1, sourceId: 'fire-ward-b' })
    expect(getElementalWardMultiplier(state, 'fire')).toBeCloseTo(0.85)
    applyElementalWard(state, { element: 'fire', reduction: 0.2, sourceId: 'fire-ward-c' })
    expect(getElementalWardMultiplier(state, 'fire')).toBeCloseTo(0.8)
    applyElementalWard(state, { element: 'water', reduction: 0.15, sourceId: 'water-ward' })
    expect(getElementalWardMultiplier(state, 'water')).toBeCloseTo(0.85)
    expect(state.combat.elementalDamageReductions).toHaveLength(4)
  })

  it('uses the strongest Ward, then longest expiry, then stable source id for presentation', () => {
    const state = createInitialState()
    state.combat.arcaneCoreRuntime.elapsedMs = 100
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'short-source', durationMs: 2_000 })
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'long-source', durationMs: 5_000 })
    expect(getActiveElementalWardPresentations(state)[0].sourceId).toBe('long-source')
    applyElementalWard(state, { element: 'fire', reduction: 0.2, sourceId: 'weaker-time', durationMs: 1_000 })
    expect(getActiveElementalWardPresentations(state)[0]).toMatchObject({ sourceId: 'weaker-time', reduction: 0.2 })
  })

  it('cleans expired rows only when needed and preserves the array reference otherwise', () => {
    const state = createInitialState()
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'lasting', durationMs: 2_000 })
    const original = state.combat.elementalDamageReductions
    clearExpiredElementalWards(state)
    expect(state.combat.elementalDamageReductions).toBe(original)
    state.combat.arcaneCoreRuntime.elapsedMs = 2_000
    clearExpiredElementalWards(state)
    expect(state.combat.elementalDamageReductions).toEqual([])
    expect(state.combat.elementalDamageReductions).not.toBe(original)
  })

  it('authors the four 20-second Wards and presents live remaining time from the run clock', () => {
    const state = createInitialState()
    for (const spellId of ['fire-ward', 'water-ward', 'earth-ward', 'air-ward'] as const) {
      const spell = SPELLS[spellId]
      const effect = spell.effects[0]
      expect(spell).toMatchObject({ unlockLevel: 10, manaCost: 5, castTimeMs: 500, cooldownMs: 18_000 })
      expect(effect).toMatchObject({ type: 'apply-elemental-ward', reduction: 0.15, durationMs: 20_000 })
    }
    state.combat.arcaneCoreRuntime.elapsedMs = 5_000
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 20_000 })
    expect(getActiveElementalWardPresentations(state)[0]).toMatchObject({ element: 'fire', name: 'Fire Ward', reduction: 0.15, reductionPercent: 15, remainingMs: 20_000, durationMs: 20_000, active: true })
    state.combat.arcaneCoreRuntime.elapsedMs += 5_000
    expect(getActiveElementalWardPresentations(state)[0].remainingMs).toBe(15_000)
  })

  it('keeps a partially elapsed 20-second Ward at its authoritative remaining duration', () => {
    const state = createInitialState()
    state.combat.arcaneCoreRuntime.elapsedMs = 10_000
    state.combat.elementalDamageReductions = [{ element: 'fire', reduction: 0.15, sourceId: 'fire-ward', expiresAt: 20_000, durationMs: 20_000 }]
    expect(getActiveElementalWardPresentations(state)[0]).toMatchObject({ durationMs: 20_000, remainingMs: 10_000 })
  })

  it('clears all runtime Wards on a full run reset', () => {
    const state = createInitialState()
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward' })
    applyElementalWard(state, { element: 'water', reduction: 0.15, sourceId: 'water-ward' })
    clearElementalWards(state)
    expect(state.combat.elementalDamageReductions).toEqual([])
  })

  it('clears runtime Wards when the player dies', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'fire-elemental'
    state.combat.enemyHp = state.combat.enemyMaxHp = 1000
    state.player.health = 0
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward' })
    expect(resolveCombatDeaths(state)).toBe(true)
    expect(state.combat.elementalDamageReductions).toEqual([])
  })

  it('keeps an unexpired Ward through a normal kill and the following enemy spawn', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'stonewake-hollow'
    state.combat.targetEnemyId = 'stonewake-gravel-wisp'
    state.progress.spellRanks['fire-bolt'] = 1
    state.spellPresets.presets = [{ id: 'ward-lifecycle', name: 'Ward Lifecycle', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
    state.spellPresets.selectedPresetId = 'ward-lifecycle'
    expect(spawnNextEnemy(state)).toBe(true)
    applyElementalWard(state, { element: 'earth', reduction: 0.15, sourceId: 'earth-ward' })
    state.combat.enemyHp = 0
    expect(resolveCombatDeaths(state)).toBe(true)
    expect(state.combat.elementalDamageReductions).toHaveLength(1)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.elementalDamageReductions).toHaveLength(1)
  })
})

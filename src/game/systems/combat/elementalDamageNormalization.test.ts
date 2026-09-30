import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { executeCombatEffects, resolveEffectiveDamageTags, resolveEffectiveDamageType } from './effectResolver'
import { applyElementalWard } from './elementalWardRuntime'
import type { CombatEvent, CombatEffect } from './combatTypes'

describe('effective elemental damage normalization', () => {
  it('normalizes event tags without mutating semantic tags or root provenance', () => {
    expect(resolveEffectiveDamageTags(['special', 'direct', 'melee', 'physical'], ['fire'])).toEqual(['special', 'direct', 'melee', 'fire'])
    expect(resolveEffectiveDamageTags(['magic', 'direct'], ['arcane'])).toEqual(['magic', 'direct', 'arcane'])
    expect(resolveEffectiveDamageTags(['special', 'physical', 'melee'], ['fire', 'arcane'])).toEqual(['special', 'melee', 'fire', 'arcane'])
    expect(resolveEffectiveDamageTags(['dot', 'physical'], ['water'])).toEqual(['dot', 'water'])
    expect(resolveEffectiveDamageTags(['direct', 'physical'], ['physical', 'fire'])).toEqual(['direct', 'physical', 'fire'])
  })

  it('normalizes a legacy enemy Physical hit to the source monster element in metadata and Ward math', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'emberfall-basin'
    state.combat.enemyId = 'emberfall-flame-hound'
    state.combat.enemyWorldTier = 1
    state.worldTier.current = 1
    state.player.health = 1000
    state.player.maxHealth = 1000
    state.combat.arcaneCoreRuntime.elapsedMs = 1000
    expect(resolveEffectiveDamageType('physical', { actor: 'enemy', kind: 'action', sourceId: 'legacy-hit', sourceMonsterId: 'emberfall-flame-hound' })).toBe('fire')
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 22_000 })
    const events: CombatEvent[] = []
    const hit: CombatEffect = { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 100 } }], tags: ['direct', 'physical'] }
    executeCombatEffects(state, [hit], { actor: 'enemy', kind: 'action', sourceId: 'legacy-hit', sourceMonsterId: 'emberfall-flame-hound', tags: ['direct', 'physical'] }, undefined, { push: (event) => events.push(event) })
    const event = events.find((entry) => entry.damageComponents)
    expect(event?.damageTypes).toEqual(['fire'])
    expect(event?.damageComponents?.[0]).toMatchObject({ damageType: 'fire', wardMultiplier: 0.85, wardPrevented: expect.any(Number) })
    expect(event?.damageComponents?.[0]?.wardPrevented).toBeGreaterThan(0)
    expect(state.progress.chronicle.eventFlags['first-elemental-ward-mitigation']).toBe(true)
  })

  it('keeps World Tier damage scaling ahead of elemental Ward reduction', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'emberfall-basin'
    state.combat.enemyId = 'emberfall-flame-hound'
    state.combat.enemyWorldTier = 2
    state.worldTier.current = 2
    state.player.health = 1000
    state.player.maxHealth = 1000
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 22_000 })
    const events: CombatEvent[] = []
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 100 } }], tags: ['direct', 'fire'] }], { actor: 'enemy', kind: 'action', sourceId: 'tier-2-hit', sourceMonsterId: 'emberfall-flame-hound', tags: ['direct', 'fire'] }, undefined, { push: (event) => events.push(event) })
    const component = events.find((entry) => entry.damageComponents)?.damageComponents?.[0]
    expect(component?.damageType).toBe('fire')
    expect(component?.wardMultiplier).toBe(0.85)
    expect(component?.wardPrevented).toBeGreaterThan(0)
  })
})

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { executeCombatEffects, resolveEffectiveDamageTags } from './effectResolver'
import { applyElementalWard } from './elementalWardRuntime'
import type { CombatEvent, CombatEffect } from './combatTypes'

describe('effective elemental damage normalization', () => {
  it('normalizes event tags without mutating semantic tags or root provenance', () => {
    expect(resolveEffectiveDamageTags(['special', 'direct', 'melee', 'arcane'], ['fire'])).toEqual(['special', 'direct', 'melee', 'arcane', 'fire'])
    expect(resolveEffectiveDamageTags(['magic', 'direct'], ['arcane'])).toEqual(['magic', 'direct', 'arcane'])
    expect(resolveEffectiveDamageTags(['special', 'arcane', 'melee'], ['fire', 'arcane'])).toEqual(['special', 'arcane', 'melee', 'fire'])
    expect(resolveEffectiveDamageTags(['dot', 'arcane'], ['water'])).toEqual(['dot', 'arcane', 'water'])
    expect(resolveEffectiveDamageTags(['direct', 'arcane'], ['arcane', 'fire'])).toEqual(['direct', 'arcane', 'fire'])
  })

  it('keeps explicitly authored enemy elements in metadata and Ward math', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.locationId = 'emberfall-basin'
    state.combat.enemyId = 'emberfall-flame-hound'
    state.player.health = 1000
    state.player.maxHealth = 1000
    state.combat.arcaneCoreRuntime.elapsedMs = 1000
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 22_000 })
    const events: CombatEvent[] = []
    const hit: CombatEffect = { type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 100 } }], tags: ['direct', 'fire'] }
    executeCombatEffects(state, [hit], { actor: 'enemy', kind: 'action', sourceId: 'authored-fire-hit', sourceMonsterId: 'emberfall-flame-hound', tags: ['direct', 'fire'] }, undefined, { push: (event) => events.push(event) })
    const event = events.find((entry) => entry.damageComponents)
    expect(event?.damageTypes).toEqual(['fire'])
    expect(event?.damageComponents?.[0]).toMatchObject({ damageType: 'fire', wardMultiplier: 0.85, wardPrevented: expect.any(Number) })
    expect(event?.damageComponents?.[0]?.wardPrevented).toBeGreaterThan(0)
    expect(state.progress.chronicle.eventFlags['first-elemental-ward-mitigation']).toBe(true)
  })

  it('applies Ward reduction to authored enemy damage without a global multiplier', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.locationId = 'emberfall-basin'
    state.combat.enemyId = 'emberfall-flame-hound'
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

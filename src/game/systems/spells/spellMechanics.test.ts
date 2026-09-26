import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { castSpellAction } from '../../../store/actions/combatActions'
import { cancelPendingPlayerSpellCast, resolvePlayerSpellCast } from '../../engine/spellEngine'
import { spawnEnemy } from '../combat/combatRuntime'
import { calculateCombatDamage } from '../combat/effectResolver'
import type { CombatSource } from '../../types'
import { BALANCE } from '../../core/balance/balance'
import { getDefenseReductionFromRating } from '../combat/combatStats'

const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test', school: 'fire', tags: ['spell', 'magic'] }
const spellState = (spellId: 'searing-touch' | 'frost-touch' | 'harden' | 'static-charge' | 'wind-blade' | 'thunderstrike', school: 'fire' | 'water' | 'earth' | 'air') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.schools[school].level = 16
  state.progress.spellRanks[spellId] = 1
  const loadoutIds = [...new Set([spellId, 'static-charge', 'wind-blade', 'thunderstrike'])]
  state.spellPresets.presets = [{ id: 'test-loadout', name: 'Test Loadout', slots: loadoutIds.map((id) => ({ spellId: id as typeof spellId, autoCast: false })) }]
  state.spellPresets.selectedPresetId = 'test-loadout'
  spawnEnemy(state, 'forest-wisp')
  state.combat.activeSpellLoadout!.slots = loadoutIds.map((id) => ({ spellId: id as typeof spellId, autoCast: false }))
  state.combat.enemyMaxHp = 1000
  state.combat.enemyHp = 1000
  state.player.mana = 300
  return state
}

describe('Rank-I spell mechanics', () => {
  it('casts Searing Touch from Spell Power and applies its Burning proc', () => {
    const state = spellState('searing-touch', 'fire')
    expect(castSpellAction(state, 'searing-touch')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(state.combat.enemyHp).toBeCloseTo(1000 - BALANCE.player.baseSpellPower * 0.25 * 1.5 * (1 - getDefenseReductionFromRating(8)))
    expect(state.player.mana).toBe(290)
    expect(state.combat.spellCooldowns['searing-touch']).toBe(10000)
    expect(state.combat.enemyStatuses).toMatchObject([{ statusId: 'burning', instanceKey: 'player:spell:searing-touch', remainingMs: 6000 }])
  })

  it('casts Frost Touch and applies the existing Chilled status', () => {
    const state = spellState('frost-touch', 'water')
    expect(castSpellAction(state, 'frost-touch')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(state.combat.enemyHp).toBeCloseTo(1000 - BALANCE.player.baseSpellPower * 0.7 * 1.5 * (1 - getDefenseReductionFromRating(8)))
    expect(state.combat.enemyStatuses[0]).toMatchObject({ statusId: 'chilled', stacks: 1 })
  })

  it('casts Harden and uses the existing 25 percent damage reduction', () => {
    const state = spellState('harden', 'earth')
    expect(castSpellAction(state, 'harden')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(state.combat.playerStatuses[0].statusId).toBe('hardened')
    const before = state.player.health
    const source = { ...playerSpell, actor: 'enemy' as const, kind: 'basic-attack' as const }
    const breakdown = calculateCombatDamage(state, 10, 'physical', source, 'player')
    expect(breakdown.resolvedBeforeBarrier).toBe(7.5)
    expect(state.player.health).toBe(before)
  })

  it('casts Static Charge and applies its Static status', () => {
    const state = spellState('static-charge', 'air')
    expect(castSpellAction(state, 'static-charge')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(state.combat.enemyHp).toBeCloseTo(1000 - BALANCE.player.baseSpellPower * 0.5 * 1.5 * (1 - getDefenseReductionFromRating(8)))
    expect(state.combat.playerStatuses[0]).toMatchObject({ statusId: 'static' })
  })

  it('consumes old Static before resolving a new Air spell', () => {
    const state = spellState('static-charge', 'air')
    state.progress.spellRanks['wind-blade'] = 1
    expect(castSpellAction(state, 'static-charge')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    state.combat.spellCooldowns['static-charge'] = 0
    const beforeWind = state.combat.enemyHp
    const baseline = JSON.parse(JSON.stringify(state)) as typeof state
    baseline.combat.playerStatuses = []
    const beforeBaselineWind = baseline.combat.enemyHp
    expect(castSpellAction(state, 'wind-blade')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(castSpellAction(baseline, 'wind-blade')).toBe(true)
    expect(resolvePlayerSpellCast(baseline)).toBe(true)
    const baseDamage = beforeBaselineWind - baseline.combat.enemyHp
    expect(beforeWind - state.combat.enemyHp).toBeCloseTo(baseDamage * 1.75)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'static')).toBe(false)
  })

  it('lets Static Charge consume the old charge while retaining its replacement', () => {
    const state = spellState('static-charge', 'air')
    expect(castSpellAction(state, 'static-charge')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    state.combat.spellCooldowns['static-charge'] = 0
    expect(castSpellAction(state, 'static-charge')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(state.combat.playerStatuses.filter((status) => status.statusId === 'static')).toHaveLength(1)
  })

  it('preserves Static when its empowered cast is interrupted', () => {
    const state = spellState('static-charge', 'air')
    state.progress.spellRanks['wind-blade'] = 1
    expect(castSpellAction(state, 'static-charge')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    const enemyHp = state.combat.enemyHp
    expect(castSpellAction(state, 'wind-blade')).toBe(true)
    expect(cancelPendingPlayerSpellCast(state, 'manual-interrupt')).toBe(true)
    expect(state.combat.enemyHp).toBe(enemyHp)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'static')).toBe(true)
  })

  it('preserves Static when an empowered cast fizzles for Mana', () => {
    const state = spellState('static-charge', 'air')
    state.progress.spellRanks['wind-blade'] = 1
    expect(castSpellAction(state, 'static-charge')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    const enemyHp = state.combat.enemyHp
    expect(castSpellAction(state, 'wind-blade')).toBe(true)
    state.player.mana = 0
    expect(resolvePlayerSpellCast(state)).toBe(false)
    expect(state.combat.enemyHp).toBe(enemyHp)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'static')).toBe(true)
  })

  it('adds the Thunderstrike-specific Static bonus to the generic Static bonus', () => {
    const state = spellState('thunderstrike', 'air')
    state.progress.spellRanks['static-charge'] = 1
    expect(castSpellAction(state, 'static-charge')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    const baseline = JSON.parse(JSON.stringify(state)) as typeof state
    baseline.combat.playerStatuses = []
    const beforeBaselineThunderstrike = baseline.combat.enemyHp
    const beforeThunderstrike = state.combat.enemyHp
    expect(castSpellAction(state, 'thunderstrike')).toBe(true)
    expect(resolvePlayerSpellCast(state)).toBe(true)
    expect(castSpellAction(baseline, 'thunderstrike')).toBe(true)
    expect(resolvePlayerSpellCast(baseline)).toBe(true)
    const baseDamage = beforeBaselineThunderstrike - baseline.combat.enemyHp
    expect(beforeThunderstrike - state.combat.enemyHp).toBeCloseTo(baseDamage * 2)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'static')).toBe(false)
  })
})

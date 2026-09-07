import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { recalculateDerivedStats } from '../../engine'
import { castSpellInternal } from '../../engine/spellEngine'
import { getSpellPower } from '../spells/spellPower'
import { executeCombatEffects } from './effectResolver'
import { applyStatus, tickStatuses } from './statusRuntime'
import type { CombatEvent, CombatSource } from './combatTypes'
import type { SpellId } from '../../types'

const fixture = (staff: boolean) => {
  const state = createInitialState()
  if (staff) state.equipment.weapon = 'ember-staff'
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.enemyId = 'forest-wisp'
  state.combat.enemyInstanceKey = 'enemy:ember-staff-test'
  state.combat.enemyHp = 10_000
  state.combat.enemyMaxHp = 10_000
  state.combat.combatRngState = 12345
  recalculateDerivedStats(state)
  state.player.mana = state.player.maxMana
  return state
}

const resolveSpell = (staff: boolean, spellId: SpellId, soulglass = false) => {
  const state = fixture(staff)
  if (soulglass) state.equipment.amulet = 'soulglass-amulet'
  state.progress.spellRanks[spellId] = 1
  const events: CombatEvent[] = []
  const sink = { push: (event: CombatEvent) => { events.push(event) } }
  expect(castSpellInternal(state, spellId, true, sink)).toBe(true)
  tickStatuses(state, 12_000, executeCombatEffects, sink)
  const damage = events.filter((event) => event.target === 'enemy' && event.damageComponents)
  return {
    spellPower: getSpellPower(state),
    direct: damage.filter((event) => event.sourceKind === 'spell').reduce((sum, event) => sum + (event.amount ?? 0), 0),
    burning: damage.filter((event) => event.sourceKind === 'status').reduce((sum, event) => sum + (event.amount ?? 0), 0),
  }
}

describe('Ember Staff Fire spell bonus', () => {
  it.each(['fire-bolt', 'ignite', 'fireball'] as const)('boosts %s direct damage and any Burning by exactly 20 percent', (spellId) => {
    const plain = resolveSpell(false, spellId)
    const staff = resolveSpell(true, spellId)
    // Normalize the staff's separate flat Spell Power contribution.
    const expectedMultiplier = staff.spellPower / plain.spellPower * 1.2
    expect(staff.direct).toBeCloseTo(plain.direct * expectedMultiplier)
    if (spellId === 'fire-bolt') expect(staff.burning).toBe(0)
    else {
      expect(plain.burning).toBeGreaterThan(0)
      expect(staff.burning).toBeCloseTo(plain.burning * expectedMultiplier)
    }
  })

  it('applies the Fire bonus once alongside Soulglass DoT and duration bonuses', () => {
    const plain = resolveSpell(false, 'ignite', true)
    const staff = resolveSpell(true, 'ignite', true)
    expect(staff.burning).toBeCloseTo(plain.burning * staff.spellPower / plain.spellPower * 1.2)
  })

  it('does not add the Fire bonus to Water spells', () => {
    const plain = resolveSpell(false, 'frostbite')
    const staff = resolveSpell(true, 'frostbite')
    expect(staff.direct).toBeCloseTo(plain.direct * staff.spellPower / plain.spellPower)
  })

  it('does not boost Fire weapon damage or Burning applied by equipment', () => {
    const resolve = (staff: boolean) => {
      const state = fixture(staff)
      const source: CombatSource = { actor: 'player', kind: 'equipment', sourceId: 'test-fire-proc', school: 'fire', tags: ['equipment', 'fire'] }
      executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'fire', magnitude: { type: 'flat', value: 100 } }], tags: ['basic-attack', 'direct'] }], { ...source, kind: 'weapon' })
      applyStatus(state, 'enemy', 'burning', source)
      tickStatuses(state, 1_000, executeCombatEffects)
      return 10_000 - state.combat.enemyHp
    }
    expect(resolve(true)).toBeCloseTo(resolve(false))
  })
})

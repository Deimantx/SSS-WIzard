import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { SPELLS } from '../../content/spells/spells'
import { spawnEnemy } from '../combat/combatRuntime'
import { executeCombatEffects } from '../combat/effectResolver'
import { resolveMagnitude } from '../combat/magnitude'
import { tickStatuses } from '../combat/statusRuntime'
import { getSpellEquipmentBonusPreview } from './spellEquipmentPreview'
import { getSpellPower, getSpellPowerBreakdown } from './spellPower'
import type { CombatEffect, CombatSource } from '../../types'
import { BALANCE } from '../../core/balance/balance'

const spellSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test-spell', school: 'fire', tags: ['spell', 'magic', 'fire'] }

describe('Spell Power foundation', () => {
  it('derives one Spell Power total from the balance base and equipped flat bonuses', () => {
    const state = createInitialState()
    expect(getSpellPower(state)).toBe(BALANCE.player.baseSpellPower)
    expect(getSpellPowerBreakdown(state)).toEqual({ base: BALANCE.player.baseSpellPower, equipment: 0, total: BALANCE.player.baseSpellPower })

    state.equipment.weapon = 'ember-staff'
    expect(getSpellPowerBreakdown(state)).toEqual({ base: BALANCE.player.baseSpellPower, equipment: 20, total: BALANCE.player.baseSpellPower + 20 })
    expect(getSpellPower(state)).toBe(BALANCE.player.baseSpellPower + 20)
    expect(getSpellEquipmentBonusPreview(state, 'fireball')).toMatchObject({ spellPower: 20, totalPercent: 0.2 })
  })

  it('resolves Spell Power coefficients only for Spell sources', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    expect(resolveMagnitude(state, { type: 'spell-power', coefficient: 1 }, spellSource, 'enemy')).toBe(BALANCE.player.baseSpellPower + 20)
    expect(resolveMagnitude(state, { type: 'spell-power', coefficient: 0.8 }, spellSource, 'player')).toBe((BALANCE.player.baseSpellPower + 20) * 0.8)
    expect(resolveMagnitude(state, { type: 'spell-power', coefficient: 1 }, { actor: 'enemy', kind: 'action', sourceId: 'enemy-action' }, 'player')).toBe(0)
  })

  it('authors direct, heal, barrier, and total periodic coefficients without flat spell power', () => {
    const ignite = SPELLS.ignite.effects[1] as Extract<CombatEffect, { type: 'apply-status' }>
    const fireballBurn = SPELLS.fireball.effects[1] as Extract<CombatEffect, { type: 'apply-status' }>
    expect(SPELLS['fire-bolt'].effects[0]).toMatchObject({ components: [{ magnitude: { type: 'spell-power', coefficient: 0.6 } }] })
    expect(SPELLS['flow-mend'].effects[0]).toMatchObject({ magnitude: { type: 'spell-power', coefficient: 0.8 } })
    expect(SPELLS['water-ward'].effects[0]).toMatchObject({ magnitude: { type: 'spell-power', coefficient: 0.7 } })
    expect(SPELLS.stoneguard.effects[0]).toMatchObject({ magnitude: { type: 'spell-power', coefficient: 1.3 } })
    expect(ignite.periodicEffects?.[0]).toMatchObject({ components: [{ magnitude: { type: 'spell-power', coefficient: 1 / 6 } }] })
    const fireballTickMagnitude = fireballBurn.periodicEffects?.[0]
    expect(fireballTickMagnitude?.type).toBe('deal-damage')
    if (fireballTickMagnitude?.type !== 'deal-damage' || fireballTickMagnitude.components[0]?.magnitude.type !== 'spell-power') throw new Error('Expected a Spell Power Fireball Burn payload')
    expect(fireballTickMagnitude.components[0].magnitude.coefficient).toBeCloseTo(0.02)

    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    state.equipment.weapon = 'ember-staff'
    spawnEnemy(state, 'forest-wisp')
    state.combat.enemyHp = 1_000
    state.combat.enemyMaxHp = 1_000
    executeCombatEffects(state, [ignite], spellSource)
    tickStatuses(state, 1_000, executeCombatEffects)
    expect(state.combat.enemyHp).toBe(1_000 - (BALANCE.player.baseSpellPower + 20) / 6)
  })
})

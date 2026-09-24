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
    expect(getSpellPowerBreakdown(state)).toEqual({ base: BALANCE.player.baseSpellPower, equipment: 16, total: BALANCE.player.baseSpellPower + 16 })
    expect(getSpellPower(state)).toBe(BALANCE.player.baseSpellPower + 16)
    expect(getSpellEquipmentBonusPreview(state, 'flame-burst')).toMatchObject({ spellPower: 16, totalPercent: 0 })

    state.artifactProgress['ember-staff'] = { minorRanks: { 'arcane-embers': 10 } }
    expect(getSpellPowerBreakdown(state)).toEqual({ base: BALANCE.player.baseSpellPower, equipment: 75, total: BALANCE.player.baseSpellPower + 75 })
    expect(getSpellPower(state)).toBe(BALANCE.player.baseSpellPower + 75)
  })

  it('resolves Spell Power coefficients only for Spell sources', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    expect(resolveMagnitude(state, { type: 'spell-power', coefficient: 1 }, spellSource, 'enemy')).toBe(BALANCE.player.baseSpellPower + 16)
    expect(resolveMagnitude(state, { type: 'spell-power', coefficient: 0.8 }, spellSource, 'player')).toBe((BALANCE.player.baseSpellPower + 16) * 0.8)
    expect(resolveMagnitude(state, { type: 'spell-power', coefficient: 1 }, { actor: 'enemy', kind: 'action', sourceId: 'enemy-action' }, 'player')).toBe(0)
  })

  it('authors direct, heal, barrier, and total periodic coefficients without flat spell power', () => {
    const searingTouch = SPELLS['searing-touch'].effects[1] as Extract<CombatEffect, { type: 'apply-status' }>
    const infernoBurn = SPELLS.inferno.effects[1] as Extract<CombatEffect, { type: 'apply-status' }>
    expect(SPELLS['fire-bolt'].effects[0]).toMatchObject({ components: [{ magnitude: { type: 'spell-power', coefficient: 0.75 } }] })
    expect(SPELLS['mending-waters'].effects[0]).toMatchObject({ magnitude: { type: 'spell-power', coefficient: 0.5 } })
    expect(SPELLS['water-bolt'].effects[0]).toMatchObject({ components: [{ magnitude: { type: 'spell-power', coefficient: 0.4 } }] })
    expect(SPELLS['earthen-barrier'].effects[0]).toMatchObject({ magnitude: { type: 'spell-power', coefficient: 1.2 } })
    expect(searingTouch.periodicEffects?.[0]).toMatchObject({ components: [{ magnitude: { type: 'spell-power', coefficient: 1 / 12 } }] })
    const infernoTickMagnitude = infernoBurn.periodicEffects?.[0]
    expect(infernoTickMagnitude?.type).toBe('deal-damage')
    if (infernoTickMagnitude?.type !== 'deal-damage' || infernoTickMagnitude.components[0]?.magnitude.type !== 'spell-power') throw new Error('Expected an Inferno Burn payload')
    expect(infernoTickMagnitude.components[0].magnitude.coefficient).toBeCloseTo(0.75 / 12)

    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    state.equipment.weapon = 'ember-staff'
    spawnEnemy(state, 'forest-wisp')
    state.combat.enemyHp = 1_000
    state.combat.enemyMaxHp = 1_000
    executeCombatEffects(state, [searingTouch], spellSource)
    tickStatuses(state, 1_000, executeCombatEffects)
    expect(state.combat.enemyHp).toBe(1_000 - (BALANCE.player.baseSpellPower + 16) / 12)
  })
})

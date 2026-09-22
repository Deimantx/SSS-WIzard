import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { getActiveEliteZoneAffix, getActiveEliteZoneAffixId } from './eliteZoneAffixRuntime'
import { getActorTraits, getMonsterTraits } from './traitRuntime'
import { damageEnemy, spawnEnemy } from './combatRuntime'

const prepare = () => {
  const state = createInitialState()
  state.progress.spellRanks['fire-bolt'] = 1
  state.spellPresets.presets = [{ id: 'affix-test', name: 'Affix Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
  state.spellPresets.selectedPresetId = 'affix-test'
  state.combat.active = true
  state.combat.dungeonId = 'howling-den'
  return state
}

describe('Elite Zone Affix runtime provider', () => {
  it('derives one location-owned Frenzied affix for every normal Howling Den encounter', () => {
    const state = prepare()
    for (const monsterId of ['cavefang-wolf', 'razorclaw-lynx', 'corrupted-dire-wolf', 'bonehide-boar', 'moonblind-jackal', 'den-stalker'] as const) {
      state.combat.enemyId = monsterId
      expect(getActiveEliteZoneAffixId(state)).toBe('frenzied')
      expect(getActiveEliteZoneAffix(state)?.name).toBe('Frenzied')
      expect(getActorTraits(state, 'enemy').some((trait) => trait.id === 'elite-zone-affix:frenzied')).toBe(true)
    }
  })

  it('does not apply the zone affix to the Greatbear boss or Bestiary traits', () => {
    const state = prepare()
    state.combat.enemyId = 'corrupted-greatbear'
    expect(getActiveEliteZoneAffixId(state)).toBeNull()
    expect(getActiveEliteZoneAffix(state)).toBeNull()
    expect(getMonsterTraits(MONSTERS['cavefang-wolf'])).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'elite-zone-affix:frenzied' })]))
  })

  it('does not leak the Howling Den affix into another location', () => {
    const state = prepare()
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'cavefang-wolf'
    expect(getActiveEliteZoneAffixId(state)).toBeNull()
  })

  it.each([
    ['graveglass-hollow', 'graveglass-shade', 'warded'],
    ['starfallen-observatory', 'starbound-eye', 'relentless'],
  ] as const)('derives the authored %s affix from the location for normal targets', (dungeonId, enemyId, affixId) => {
    const state = prepare()
    state.combat.dungeonId = dungeonId
    state.combat.enemyId = enemyId
    expect(getActiveEliteZoneAffixId(state)).toBe(affixId)
    expect(getActiveEliteZoneAffix(state)?.id).toBe(affixId)
  })

  it('activates Frenzied once at the threshold for different normal enemy IDs', () => {
    for (const monsterId of ['cavefang-wolf', 'den-stalker'] as const) {
      const state = prepare()
      spawnEnemy(state, monsterId)
      damageEnemy(state, Math.ceil(state.combat.enemyMaxHp * 0.51), 'spell')
      damageEnemy(state, 1, 'spell')
      expect(state.combat.enemyStatuses.filter((status) => status.statusId === 'haste')).toHaveLength(1)
      expect(state.combat.triggeredRuleIds.filter((id) => id.includes('frenzied-threshold'))).toHaveLength(1)
    }
  })
})

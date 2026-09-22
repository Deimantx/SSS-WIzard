import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { MONSTERS } from '../../content/monsters'
import { getCombatModifiers } from './modifiers'
import { getActiveEliteMinorAffix, getActiveEliteMinorAffixId } from './eliteMinorAffixRuntime'
import { getActorTraits, getMonsterTraits } from './traitRuntime'
import { spawnEnemy } from './combatRuntime'

const prepare = (targetEnemyId: 'cavefang-wolf' | 'corrupted-dire-wolf' | 'bonehide-boar' | 'moonblind-jackal' | 'den-stalker' = 'cavefang-wolf') => {
  const state = createInitialState()
  state.progress.spellRanks['fire-bolt'] = 1
  state.spellPresets.presets = [{ id: 'affix-test', name: 'Affix Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
  state.spellPresets.selectedPresetId = 'affix-test'
  state.combat.active = true
  state.combat.dungeonId = 'howling-den'
  state.combat.targetEnemyId = targetEnemyId
  return state
}

describe('Elite Minor Affix runtime provider', () => {
  it('resolves the active affix only for its targeted Howling Den encounter', () => {
    const state = prepare()
    spawnEnemy(state, 'cavefang-wolf')
    expect(getActiveEliteMinorAffixId(state)).toBe('vicious')
    expect(getActiveEliteMinorAffix(state)?.name).toBe('Vicious')
    expect(getActorTraits(state, 'enemy').some((trait) => trait.id === 'elite-affix:vicious')).toBe(true)
    expect(getMonsterTraits(MONSTERS['cavefang-wolf']).some((trait) => trait.id === 'elite-affix:vicious')).toBe(false)
  })

  it('keeps the affix out of Bestiary intrinsic traits and applies static modifiers', () => {
    const state = prepare('bonehide-boar')
    spawnEnemy(state, 'bonehide-boar')
    expect(getActiveEliteMinorAffixId(state)).toBe('armored')
    expect(getCombatModifiers(state, 'enemy', 'defense-percent')).toBeCloseTo(0.25)
    expect(getMonsterTraits(MONSTERS['bonehide-boar'])).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'elite-affix:armored' })]))
  })

  it('applies Warded Barrier at combat start and resolves the remaining target affixes', () => {
    const warded = prepare('corrupted-dire-wolf')
    spawnEnemy(warded, 'corrupted-dire-wolf')
    expect(warded.combat.enemyBarrier).toBeCloseTo(warded.combat.enemyMaxHp * 0.15)

    const relentless = prepare('moonblind-jackal')
    spawnEnemy(relentless, 'moonblind-jackal')
    expect(getActiveEliteMinorAffix(relentless)?.id).toBe('relentless')
    expect(getCombatModifiers(relentless, 'enemy', 'status-duration-received-percent', { statusTags: ['control'] })).toBeCloseTo(-0.4)

    const regenerative = prepare('den-stalker')
    spawnEnemy(regenerative, 'den-stalker')
    expect(getActiveEliteMinorAffix(regenerative)?.id).toBe('regenerative')
  })
})

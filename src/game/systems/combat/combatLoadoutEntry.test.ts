import { describe, expect, it } from 'vitest'
import { getAllSpellsInOrder, getSpellPresetFocusProjection } from '../spells'
import { createInitialState } from '../../../store/initialState'
import { spawnEnemy } from './combatRuntime'

const prepareCombatState = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  return state
}

describe('combat spell loadout entry preflight', () => {
  it('starts with the same eight slots that the pre-combat projection shows', () => {
    const state = prepareCombatState()
    const slots = getAllSpellsInOrder().filter((spell) => spell.unlockLevel <= 20).slice(0, 8).map((spell, index) => ({ spellId: spell.id, autoCast: index < 6 }))
    state.progress.spellRanks = Object.fromEntries(slots.map((slot) => [slot.spellId, 1]))
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Level 20', slots }]
    state.spellPresets.selectedPresetId = 'spell-preset-1'

    expect(getSpellPresetFocusProjection(state, state.spellPresets.presets[0]).validSlots).toHaveLength(8)
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    expect(state.combat.enemyId).toBe('forest-wisp')
    expect(state.combat.activeSpellLoadout?.slots).toEqual(slots)
    expect(state.combat.activeSpellLoadout?.slots.filter((slot) => slot.autoCast)).toHaveLength(6)
  })

  it('reports distinct missing, empty, unavailable, and Focus failures', () => {
    const missing = prepareCombatState()
    expect(spawnEnemy(missing, 'forest-wisp')).toBe(false)
    expect(missing.notifications[missing.notifications.length - 1]?.text).toBe('Select a Spell Preset before entering combat.')

    const empty = prepareCombatState()
    empty.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Empty', slots: [] }]
    empty.spellPresets.selectedPresetId = 'spell-preset-1'
    expect(spawnEnemy(empty, 'forest-wisp')).toBe(false)
    expect(empty.notifications[empty.notifications.length - 1]?.text).toBe('Empty has no Spells. Add at least one Spell in Manage Presets.')

    const unavailable = prepareCombatState()
    unavailable.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Locked', slots: [{ spellId: 'fire-bolt', autoCast: true }] }]
    unavailable.spellPresets.selectedPresetId = 'spell-preset-1'
    expect(spawnEnemy(unavailable, 'forest-wisp')).toBe(false)
    expect(unavailable.notifications[unavailable.notifications.length - 1]?.text).toBe('Locked has no currently unlocked Spells.')

    const focus = prepareCombatState()
    focus.player.maxFocus = 0
    focus.progress.spellRanks = { 'fire-bolt': 1 }
    focus.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Too Much', slots: [{ spellId: 'fire-bolt', autoCast: true }] }]
    focus.spellPresets.selectedPresetId = 'spell-preset-1'
    expect(spawnEnemy(focus, 'forest-wisp')).toBe(false)
    expect(focus.notifications[focus.notifications.length - 1]?.text).toBe('Too Much could not activate — requires 10 more Focus.')
  })

  it('auto-selects one valid saved preset when entry is otherwise unambiguous', () => {
    const state = prepareCombatState()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Only', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
    expect(state.spellPresets.selectedPresetId).toBeNull()
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    expect(state.spellPresets.selectedPresetId).toBe('spell-preset-1')
  })
})

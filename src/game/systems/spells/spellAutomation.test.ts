import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { evaluateSpellAutomation, getNextAutoCastEligibilityBoundaryMs, getSpellAutomationPriorityPreview, getSpellAutomationTargetOptions, normalizeSpellAutomationConfig, selectNextAutomatedSpell, selectNextAutomatedSpellFast } from './spellAutomation'

describe('spell automation evaluator', () => {
  it('normalizes automation rules to five AND conditions and validates targets', () => {
    const normalized = normalizeSpellAutomationConfig({
      targetRule: 'current-enemy',
      conditions: [
        { type: 'player-hp', operator: 'below', percent: 0 },
        { type: 'mana', operator: 'above', percent: 120 },
        { type: 'boss', operator: 'is' },
        { type: 'always' },
        { type: 'enemy-hp', operator: 'below', percent: 50 },
        { type: 'player-hp', operator: 'below', percent: 20 },
      ],
    }, 'mending-waters', true, false)

    expect(normalized.targetRule).toBe('self')
    expect(normalized.conditions).toEqual([{ type: 'always' }])
    expect(getSpellAutomationTargetOptions('mending-waters')).toEqual([{ value: 'self', label: 'Self' }])
  })

  it('treats a missing effect as passing for remaining-below rules', () => {
    const state = createInitialState()
    state.combat.active = true
    state.progress.spellRanks = { 'stone-skin': 1 }
    state.activities.autoCast['stone-skin'] = true
    const evaluation = evaluateSpellAutomation(state, {
      spellId: 'stone-skin',
      autoCast: true,
      automation: { conditions: [{ type: 'player-buff', operator: 'remaining-below', effectId: 'stone-skin', seconds: 4 }], targetRule: 'self' },
    })

    expect(evaluation.conditions[0]).toMatchObject({ passed: true })
  })

  it('selects the first eligible AUTO spell in loadout order', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = 100
    state.combat.enemyMaxHp = 100
    state.player.mana = state.player.maxMana
    state.progress.spellRanks = { 'fire-bolt': 1, 'wind-blade': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCast['wind-blade'] = true
    state.combat.activeSpellLoadout = {
      presetId: null,
      presetName: 'Test',
      signature: '',
      slots: [
        { spellId: 'fire-bolt', autoCast: true, automation: { conditions: [{ type: 'enemy-hp', operator: 'below', percent: 20 }], targetRule: 'current-enemy' } },
        { spellId: 'wind-blade', autoCast: true, automation: { conditions: [{ type: 'always' }], targetRule: 'current-enemy' } },
      ],
    }

    expect(selectNextAutomatedSpell(state)).toMatchObject({ spellId: 'wind-blade', slotIndex: 1 })
    expect(selectNextAutomatedSpellFast(state)).toEqual({ spellId: 'wind-blade', slotIndex: 1 })
  })

  it('reports an eligible spell that is waiting behind an earlier eligible slot', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = 100
    state.combat.enemyMaxHp = 100
    state.progress.spellRanks = { 'fire-bolt': 1, 'wind-blade': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCast['wind-blade'] = true
    state.player.mana = state.player.maxMana
    state.combat.activeSpellLoadout = { presetId: null, presetName: 'Test', signature: 'fire-bolt:1|wind-blade:1', slots: [{ spellId: 'fire-bolt', autoCast: true }, { spellId: 'wind-blade', autoCast: true }] }
    const slots = [
      { spellId: 'fire-bolt' as const, autoCast: true, automation: { conditions: [{ type: 'always' as const }], targetRule: 'current-enemy' as const } },
      { spellId: 'wind-blade' as const, autoCast: true, automation: { conditions: [{ type: 'always' as const }], targetRule: 'current-enemy' as const } },
    ]

    expect(getSpellAutomationPriorityPreview(state, slots, 1)).toMatchObject({ isNext: false, firstEligibleSlotIndex: 0, blockingSpellId: 'fire-bolt' })
  })

  it('schedules the exact Mana threshold instead of polling Auto-Cast', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = 100
    state.combat.enemyMaxHp = 100
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.player.mana = 0
    state.combat.activeSpellLoadout = {
      presetId: null,
      presetName: 'Test',
      signature: '',
      slots: [{ spellId: 'fire-bolt', autoCast: true, automation: { conditions: [{ type: 'always' }], targetRule: 'current-enemy' } }],
    }

    expect(getNextAutoCastEligibilityBoundaryMs(state, 1, 10)).toBe(3_000)
  })

  it('hard-blocks AUTO evaluation while a manual spell is queued', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = 100
    state.combat.enemyMaxHp = 100
    state.combat.queuedPlayerSpellId = 'wind-blade'
    state.progress.spellRanks = { 'fire-bolt': 1, 'wind-blade': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.player.mana = state.player.maxMana

    const evaluation = evaluateSpellAutomation(state, {
      spellId: 'fire-bolt',
      autoCast: true,
      automation: { conditions: [{ type: 'always' }], targetRule: 'current-enemy' },
    })

    expect(evaluation.eligible).toBe(false)
    expect(evaluation.systemChecks).toContainEqual(expect.objectContaining({ key: 'manual-override', passed: false, reason: 'Manual Spell queued. Automation resumes after the manual request resolves.' }))
  })

  it('does not treat an AUTO pending cast as a manual override', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = 100
    state.combat.enemyMaxHp = 100
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.combat.pendingPlayerSpellCast = { spellId: 'fire-bolt', targetInstanceKey: null, remainingWorkMs: 100, castWorkMs: 100, manaCostSnapshot: 30, arcaneCoreFree: false, castWorkMultiplier: 1, castOrigin: 'auto' }

    const evaluation = evaluateSpellAutomation(state, {
      spellId: 'fire-bolt',
      autoCast: true,
      automation: { conditions: [{ type: 'always' }], targetRule: 'current-enemy' },
    })

    expect(evaluation.systemChecks).toContainEqual(expect.objectContaining({ key: 'manual-override', passed: true }))
  })
})

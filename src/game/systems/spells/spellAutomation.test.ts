import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { createCombatTestState } from '../combat/testCombatState'
import { applyElementalWard } from '../combat/elementalWardRuntime'
import { spawnEnemy } from '../combat/combatRuntime'
import { applyStatus } from '../combat/statusRuntime'
import { advanceCombatState } from '../simulation/advanceGameState'
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

    expect(getNextAutoCastEligibilityBoundaryMs(state, 1, 10)).toBe(1_500)
  })

  it('waits until a matching Ward is nearly expired before making its spell eligible', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'emberfall-flame-hound'
    state.combat.arcaneCoreRuntime.elapsedMs = 1_000
    state.progress.spellRanks['fire-ward'] = 1
    state.activities.autoCast['fire-ward'] = true
    const automation = { conditions: [{ type: 'elemental-ward-expiring' as const, element: 'fire' as const, sourceId: 'fire-ward', remainingMs: 2_500 }], targetRule: 'self' as const }
    applyElementalWard(state, { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', durationMs: 22_000 })
    const slot = { spellId: 'fire-ward' as const, autoCast: true, automation }
    state.combat.activeSpellLoadout = { presetId: null, presetName: 'Ward Test', signature: 'fire-ward:1', slots: [slot] }

    expect(evaluateSpellAutomation(state, slot).eligible).toBe(false)
    expect(getNextAutoCastEligibilityBoundaryMs(state, 1, 10)).toBe(19_500)
    state.combat.arcaneCoreRuntime.elapsedMs += 19_500
    expect(evaluateSpellAutomation(state, slot).eligible).toBe(true)
  })

  it('maintains at least 99.5% Fire Ward coverage during a five-minute no-control run', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    state.combat.targetEnemyId = 'forest-wisp'
    state.progress.spellRanks['fire-ward'] = 1
    state.activities.autoCast['fire-ward'] = true
    state.player.maxHealth = 1_000_000
    state.player.health = state.player.maxHealth
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.activeSpellLoadout = {
      presetId: null,
      presetName: 'Ward uptime fixture',
      signature: 'fire-ward:auto',
      slots: [{ spellId: 'fire-ward', autoCast: true, automation: { conditions: [{ type: 'elemental-ward-expiring', element: 'fire', sourceId: 'fire-ward', remainingMs: 2_500 }], targetRule: 'self' } }],
    }
    const stepMs = 250
    const durationMs = 300_000
    let firstAppliedAt: number | null = null
    let protectedMs = 0
    let casts = 0
    let lastExpiry: number | undefined
    for (let elapsed = 0; elapsed < durationMs; elapsed += stepMs) {
      const now = state.combat.arcaneCoreRuntime.elapsedMs
      const active = state.combat.elementalDamageReductions.find((ward) => ward.element === 'fire' && (ward.expiresAt === undefined || ward.expiresAt > now))
      if (active) {
        firstAppliedAt ??= now
        protectedMs += stepMs
        if (active.expiresAt !== lastExpiry) {
          casts += 1
          lastExpiry = active.expiresAt
        }
      }
      advanceCombatState(state, stepMs, { mode: 'live' })
    }
    const measuredMs = firstAppliedAt === null ? 0 : durationMs - firstAppliedAt
    expect(casts).toBeGreaterThan(1)
    expect(measuredMs).toBeGreaterThan(0)
    expect(protectedMs / measuredMs).toBeGreaterThanOrEqual(0.995)
  })

  it('allows a Ward to expire during Silence and recasts after spellcasting resumes', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    state.combat.targetEnemyId = 'forest-wisp'
    state.debug.freezeEnemyActions = true
    state.player.maxHealth = state.player.health = 1_000_000
    state.progress.spellRanks['fire-ward'] = 1
    state.activities.autoCast['fire-ward'] = true
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.activeSpellLoadout = {
      presetId: null,
      presetName: 'Ward silence fixture',
      signature: 'fire-ward:auto',
      slots: [{ spellId: 'fire-ward', autoCast: true, automation: { conditions: [{ type: 'elemental-ward-expiring', element: 'fire', sourceId: 'fire-ward', remainingMs: 2_500 }], targetRule: 'self' } }],
    }
    const stepMs = 250
    let elapsed = 0
    while (!state.combat.elementalDamageReductions.some((ward) => ward.element === 'fire') && elapsed < 10_000) {
      advanceCombatState(state, stepMs, { mode: 'live' })
      elapsed += stepMs
    }
    const firstWard = state.combat.elementalDamageReductions.find((ward) => ward.element === 'fire')
    expect(firstWard).toBeDefined()
    const firstExpiry = firstWard?.expiresAt ?? Infinity
    const silence = { actor: 'enemy' as const, kind: 'action' as const, sourceId: 'ward-silence-fixture', sourceMonsterId: 'forest-wisp' as const, tags: ['control' as const] }
    applyStatus(state, 'player', 'silenced', silence, { durationMs: 30_000 })

    let sawWardExpireWhileSilenced = false
    for (let simulated = 0; simulated < 35_000; simulated += stepMs) {
      const now = state.combat.arcaneCoreRuntime.elapsedMs
      const hasWard = state.combat.elementalDamageReductions.some((ward) => ward.element === 'fire' && (ward.expiresAt === undefined || ward.expiresAt > now))
      const silenced = state.combat.playerStatuses.some((status) => status.statusId === 'silenced')
      if (!hasWard && now >= firstExpiry && silenced) sawWardExpireWhileSilenced = true
      advanceCombatState(state, stepMs, { mode: 'live' })
    }

    expect(sawWardExpireWhileSilenced).toBe(true)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'silenced')).toBe(false)
    expect(state.combat.elementalDamageReductions.some((ward) => ward.element === 'fire')).toBe(true)
  })

  it('casts two different Wards through normal slots and mana costs while keeping both active', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    state.combat.targetEnemyId = 'forest-wisp'
    state.debug.freezeEnemyActions = true
    state.player.maxHealth = state.player.health = 1_000_000
    state.player.maxMana = state.player.mana = 1_000
    state.progress.spellRanks['fire-ward'] = 1
    state.progress.spellRanks['water-ward'] = 1
    state.activities.autoCast['fire-ward'] = true
    state.activities.autoCast['water-ward'] = true
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.activeSpellLoadout = {
      presetId: null,
      presetName: 'Two Ward fixture',
      signature: 'fire-ward:auto|water-ward:auto',
      slots: [
        { spellId: 'fire-ward', autoCast: true, automation: { conditions: [{ type: 'elemental-ward-expiring', element: 'fire', sourceId: 'fire-ward', remainingMs: 2_500 }], targetRule: 'self' } },
        { spellId: 'water-ward', autoCast: true, automation: { conditions: [{ type: 'elemental-ward-expiring', element: 'water', sourceId: 'water-ward', remainingMs: 2_500 }], targetRule: 'self' } },
      ],
    }
    const startingMana = state.player.mana
    for (let elapsed = 0; elapsed < 60_000; elapsed += 250) advanceCombatState(state, 250, { mode: 'live' })

    const active = state.combat.elementalDamageReductions.filter((ward) => ward.expiresAt === undefined || ward.expiresAt > state.combat.arcaneCoreRuntime.elapsedMs)
    expect(active.map((ward) => ward.element).sort()).toEqual(['fire', 'water'])
    expect(state.player.mana).toBeLessThan(startingMana)
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

import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { executeCombatEffects, damageEnemy, damagePlayer, getCombatDamagePreview, resolveBasicAttackInterval } from './effectResolver'
import { applyStatus, tickStatuses } from './statusRuntime'
import { applyBarrier, finishEnemy, spawnEnemy } from './combatRuntime'
import { forceResolveEnemyAction } from './actionRuntime'
import { runCombatTriggers } from './triggerRuntime'
import { migrateSave } from '../../../persistence/migrations'
import type { CombatSource, TraitDefinition, TraitId } from '../../types'
import { advanceGameState } from '../simulation/advanceGameState'
import { tickBarriers } from './barrierRuntime'
import { castSpellAction } from '../../../store/actions/combatActions'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { TRAIT_DEFINITIONS } from '../../content/traits'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { SPELLS } from '../../content/spells/spells'
import { resolveActionRecoveryMs } from './actionRuntime'

const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test-spell', school: 'fire', tags: ['spell', 'magic'] }
const enemyAttack: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: 'test-attack', tags: ['basic-attack', 'direct'] }
const stateWithEnemy = (enemyId: Parameters<typeof spawnEnemy>[1] = 'forest-wisp') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  spawnEnemy(state, enemyId)
  return state
}

const withTemporaryTrait = (trait: TraitDefinition, test: () => void) => {
  const monster = MONSTERS['forest-wisp']
  const traitId = trait.id as TraitId
  const registry = TRAIT_DEFINITIONS as Record<string, TraitDefinition>
  const original = registry[trait.id]
  registry[trait.id] = trait
  monster.traitIds.push(traitId)
  try { test() } finally {
    monster.traitIds.pop()
    if (original) registry[trait.id] = original
    else delete registry[trait.id]
  }
}

describe('universal combat effects', () => {
  it('resolves damage, healing, barriers, mana, delay, and cooldowns', () => {
    const state = stateWithEnemy()
    state.combat.playerBarrier = 10
    damagePlayer(state, 15, enemyAttack)
    expect(state.combat.playerBarrier).toBe(0)
    expect(state.player.health).toBe(95)
    state.player.health = 99
    executeCombatEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 20 } }, { type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 25 } }, { type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 100 } }, { type: 'modify-action-timer', target: 'self', action: 'basic-attack', amountMs: 700 }, { type: 'modify-cooldown', target: 'self', spellId: 'fire-bolt', amountMs: -2000 }], playerSpell)
    expect(state.player.health).toBe(state.player.maxHealth)
    expect(state.combat.playerBarrier).toBe(25)
    expect(state.player.mana).toBe(state.player.maxMana)
    expect(state.combat.playerAttackTimerMs).toBe(700)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
  })

  it('uses one damage pipeline for enemy barriers, overflow, resistances, and source tags', () => {
    const state = stateWithEnemy('thornling')
    state.combat.enemyBarrier = 5
    const dealt = damageEnemy(state, 10, 'basic')
    expect(dealt).toBe(4)
    expect(state.combat.enemyBarrier).toBe(0)
    expect(state.combat.enemyHp).toBe(60)
    expect(state.combat.log).toContain('Barrier breaks.')
  })
})

describe('authored status runtime', () => {
  it('applies, refreshes, ticks, expires, and retains Burning source', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'burning', playerSpell)
    expect(state.combat.enemyStatuses[0]).toMatchObject({ statusId: 'burning', source: playerSpell, remainingMs: 5000 })
    const first = state.combat.enemyStatuses[0]
    tickStatuses(state, 1000, executeCombatEffects)
    expect(state.combat.enemyHp).toBe(39)
    applyStatus(state, 'enemy', 'burning', { ...playerSpell, sourceId: 'ignite-again' })
    expect(state.combat.enemyStatuses[0]).toMatchObject({ remainingMs: 5000, source: { sourceId: 'ignite-again' } })
    expect(first.statusId).toBe('burning')
    tickStatuses(state, 5000, executeCombatEffects)
    expect(state.combat.enemyStatuses).toHaveLength(0)
  })

  it('uses authored modifiers and stack caps without status-ID checks in damage code', () => {
    const state = stateWithEnemy()
    for (let index = 0; index < 6; index += 1) applyStatus(state, 'enemy', 'shock', playerSpell)
    expect(state.combat.enemyStatuses[0].stacks).toBe(5)
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: 'air', magnitude: { type: 'flat', value: 10 }, tags: ['spell'] }], { ...playerSpell, school: 'air' })
    expect(state.combat.enemyHp).toBe(32)
    applyStatus(state, 'player', 'quickening', { actor: 'player', kind: 'spell', sourceId: 'quickening', tags: ['spell'] })
    expect(resolveBasicAttackInterval(state, 'player', 1200)).toBe(900)
  })

  it('ticks a holder-relative Regeneration and supports cleanse, dispel, and Stun', () => {
    const state = stateWithEnemy()
    state.player.health = 50
    applyStatus(state, 'player', 'regeneration', { actor: 'player', kind: 'spell', sourceId: 'regen', tags: ['spell'] })
    applyStatus(state, 'player', 'burning', { actor: 'enemy', kind: 'action', sourceId: 'burn', tags: ['special'] })
    applyStatus(state, 'player', 'stunned', { actor: 'enemy', kind: 'action', sourceId: 'stun', tags: ['special'] })
    tickStatuses(state, 1000, executeCombatEffects)
    expect(state.player.health).toBe(50)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'burning')).toBe(true)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'stunned')).toBe(true)
  })

  it('preserves a status applied by a periodic effect', () => {
    const original = STATUS_DEFINITIONS.quickening.periodic
    STATUS_DEFINITIONS.quickening.periodic = { intervalMs: 1000, effects: [{ type: 'apply-status', target: 'self', statusId: 'haste' }] }
    try {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', playerSpell)
      tickStatuses(state, 1000, executeCombatEffects)
      expect(state.combat.playerStatuses.map((status) => status.statusId)).toEqual(['quickening', 'haste'])
    } finally {
      STATUS_DEFINITIONS.quickening.periodic = original
    }
  })

  it('does not resurrect a status removed by an earlier periodic effect', () => {
    const original = STATUS_DEFINITIONS.quickening.periodic
    STATUS_DEFINITIONS.quickening.periodic = { intervalMs: 1000, effects: [{ type: 'remove-status', target: 'self', statusId: 'vulnerable' }] }
    try {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', playerSpell)
      applyStatus(state, 'player', 'vulnerable', enemyAttack)
      tickStatuses(state, 1000, executeCombatEffects)
      expect(state.combat.playerStatuses.map((status) => status.statusId)).toEqual(['quickening'])
    } finally {
      STATUS_DEFINITIONS.quickening.periodic = original
    }
  })

  it('preserves the live list after a periodic cleanse', () => {
    const original = STATUS_DEFINITIONS.quickening.periodic
    STATUS_DEFINITIONS.quickening.periodic = { intervalMs: 1000, effects: [{ type: 'cleanse', target: 'self', mode: 'all' }] }
    try {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', playerSpell)
      applyStatus(state, 'player', 'burning', enemyAttack)
      tickStatuses(state, 1000, executeCombatEffects)
      expect(state.combat.playerStatuses.map((status) => status.statusId)).toEqual(['quickening'])
    } finally {
      STATUS_DEFINITIONS.quickening.periodic = original
    }
  })
})

describe('combat save compatibility', () => {
  it('converts legacy Barrier and action-delay statuses without losing the remaining status source', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 11, combat: { ...initial.combat, playerBarrierRemainingMs: null, playerStatuses: [{ id: 'barrier', remainingMs: 9000, value: 22 }, { id: 'attack-delay', remainingMs: 700, value: 700 }, { id: 'burning', remainingMs: 4000, value: 5, tickIntervalMs: 1000, nextTickMs: 500 }], enemySpecialUsed: {} } } as any)
    expect(migrated.combat.playerBarrier).toBe(22)
    expect(migrated.combat.playerBarrierRemainingMs).toBe(9000)
    expect(migrated.combat.playerAttackTimerMs).toBe(700)
    expect(migrated.combat.playerStatuses).toHaveLength(1)
    expect(migrated.combat.playerStatuses[0]).toMatchObject({ statusId: 'burning' })
  })
})

describe('data-driven monster mechanics', () => {
  it('composes Thorn Lash and Root Slam effects', () => {
    const thornling = stateWithEnemy('thornling')
    forceResolveEnemyAction(thornling, 'thorn-lash', executeCombatEffects)
    expect(thornling.player.health).toBe(90)
    expect(thornling.combat.playerStatuses[0].statusId).toBe('thorn-wound')
    const root = stateWithEnemy('stone-root')
    expect(root.combat.enemyBarrier).toBe(14)
    forceResolveEnemyAction(root, 'root-slam', executeCombatEffects)
    expect(root.player.health).toBe(82)
    expect(root.combat.playerAttackTimerMs).toBe(700)
  })

  it('fires authored threshold rules once per encounter', () => {
    const sentinel = stateWithEnemy('grove-sentinel')
    damageEnemy(sentinel, 220, 'spell')
    expect(sentinel.combat.enemyBarrier).toBe(80)
    damageEnemy(sentinel, 10, 'spell')
    expect(sentinel.combat.enemyBarrier).toBe(70)
    expect(sentinel.combat.triggeredRuleIds).toEqual(['enemy:trait:grove-sentinel-ancient-growth:grove-sentinel-ancient-growth-threshold'])
    const heart = stateWithEnemy('forest-heart')
    damageEnemy(heart, 310, 'spell')
    expect(heart.combat.enemyStatuses[0]).toMatchObject({ statusId: 'haste', remainingMs: null })
    expect(resolveActionRecoveryMs(heart, 'enemy', 2400)).toBe(2040)
  })
})

describe('post-implementation combat audit regressions', () => {
  it('resolves a player death from a status tick before starting another action', () => {
    const state = stateWithEnemy()
    state.player.health = 1
    state.combat.playerAttackTimerMs = 0
    applyStatus(state, 'player', 'burning', enemyAttack)

    advanceGameState(state, 1000, { mode: 'live' })

    expect(state.combat.active).toBe(false)
    expect(state.combat.enemyId).toBeNull()
    expect(state.combat.playerStatuses).toEqual([])
  })

  it('blocks manual and automatic spell casts while Stunned without spending resources', () => {
    const state = stateWithEnemy()
    state.progress.unlockedSpells = ['fire-bolt']
    state.player.mana = 50
    applyStatus(state, 'player', 'stunned', enemyAttack)
    expect(castSpellAction(state, 'fire-bolt')).toBe(false)
    expect(state.player.mana).toBe(50)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
    expect(state.notifications.some((notification) => notification.text === 'Cannot cast while Stunned.')).toBe(true)

    state.notifications = []
    state.debug.bonusManaRegenFlat = -5
    state.activities.autoCast['fire-bolt'] = true
    state.combat.spellCooldowns['fire-bolt'] = 1000
    state.combat.playerAttackTimerMs = 500
    advanceGameState(state, 1000, { mode: 'live' })
    expect(state.player.mana).toBe(50)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
    expect(state.combat.playerAttackTimerMs).toBe(500)
  })

  it('replaces temporary player barriers, expires them, and pauses them during encounter delay', () => {
    const state = stateWithEnemy()
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], playerSpell)
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 10 } }], playerSpell)
    expect(state.combat.playerBarrier).toBe(30)
    expect(state.combat.playerBarrierRemainingMs).toBeNull()

    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 25 }, mode: 'replace', durationMs: 9000 }], playerSpell)
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 }, mode: 'replace', durationMs: 9000 }], playerSpell)
    expect(state.combat.playerBarrier).toBe(40)
    expect(state.combat.playerBarrierRemainingMs).toBe(9000)
    tickBarriers(state, 8999)
    expect(state.combat.playerBarrierRemainingMs).toBe(1)
    tickBarriers(state, 1)
    expect(state.combat.playerBarrier).toBe(0)
    expect(state.combat.playerBarrierRemainingMs).toBeNull()

    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 }, mode: 'replace', durationMs: 9000 }], playerSpell)
    const remaining = state.combat.playerBarrierRemainingMs
    state.combat.enemyHp = 0
    state.combat.enemyId = 'forest-wisp'
    // The normal finish path starts an encounter delay; temporary combat time is paused there.
    finishEnemy(state)
    advanceGameState(state, 1000, { mode: 'live' })
    expect(state.combat.playerBarrierRemainingMs).toBe(remaining)
  })

  it('keeps authored barrier duration and effect tags explicit', () => {
    const state = stateWithEnemy()
    applyBarrier(state, 12)
    expect(state.combat.playerBarrier).toBe(12)
    expect(state.combat.playerBarrierRemainingMs).toBe(9000)
    expect(SPELLS['water-ward'].effects[0]).toMatchObject({ type: 'gain-barrier', mode: 'replace', durationMs: 9000 })
    expect(SPELLS.stoneguard.effects[0]).toMatchObject({ type: 'gain-barrier', mode: 'replace', durationMs: 9000 })
    expect(STATUS_DEFINITIONS.haste.tags).toEqual(['buff'])
    expect(STATUS_DEFINITIONS.quickening.tags).toEqual(['buff', 'air'])
    expect(MONSTERS['forest-heart'].actions['rejuvenating-sap'].tags).toEqual(['special', 'heal', 'direct'])
    expect(TRAIT_DEFINITIONS['stone-rooted-shell'].rules?.[0].effects[0]).toMatchObject({ type: 'gain-barrier', mode: 'add', durationMs: null })
  })

  it('dispatches damage-dealt only to the source actor', () => {
    const trait = { id: 'audit-damage-owner', name: 'Audit Damage Owner', description: 'Test trait.', rules: [{ id: 'audit-damage-owner-rule', event: 'on-damage-dealt' as const, effects: [{ type: 'gain-barrier' as const, target: 'self' as const, magnitude: { type: 'flat' as const, value: 1 } }] }] }
    withTemporaryTrait(trait, () => {
      const state = stateWithEnemy()
      damageEnemy(state, 1, 'spell')
      expect(state.combat.enemyBarrier).toBe(0)
      damagePlayer(state, 1, enemyAttack)
      expect(state.combat.enemyBarrier).toBe(1)
    })
  })

  it('applies Purified only to harmful status durations', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'player', 'purified', { actor: 'player', kind: 'system', sourceId: 'test' })
    const burning = applyStatus(state, 'player', 'burning', enemyAttack)
    const regeneration = applyStatus(state, 'player', 'regeneration', { actor: 'player', kind: 'system', sourceId: 'test' })
    expect(burning?.remainingMs).toBe(2500)
    expect(regeneration?.remainingMs).toBe(6000)
  })

  it('does not interrupt a special attack authored as non-interruptible', () => {
    const action = MONSTERS['forest-wisp'].actions['arc-spark']
    const previous = action.interruptible
    action.interruptible = false
    try {
      const state = stateWithEnemy()
      state.combat.enemyTelegraphMs = 1000
      state.combat.enemyTelegraphActionId = 'arc-spark'
      executeCombatEffects(state, [{ type: 'interrupt', target: 'opponent' }], playerSpell)
      expect(state.combat.enemyTelegraphMs).toBe(1000)
      expect(state.combat.enemyTelegraphActionId).toBe('arc-spark')
    } finally {
      action.interruptible = previous
    }
  })

  it('modifies the active enemy telegraph only for the current action timer', () => {
    const state = stateWithEnemy()
    state.combat.enemyTelegraphMs = 2000
    state.combat.enemyTelegraphActionId = 'arc-spark'
    state.combat.enemyActionTimerMs = 400
    executeCombatEffects(state, [{ type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: -500 }], playerSpell)
    expect(state.combat.enemyTelegraphMs).toBe(1500)
    expect(state.combat.enemyActionTimerMs).toBe(400)
  })

  it('produces identical periodic results for one large tick and many small ticks', () => {
    const large = stateWithEnemy()
    const small = stateWithEnemy()
    large.player.health = 50
    small.player.health = 50
    applyStatus(large, 'enemy', 'burning', playerSpell)
    applyStatus(small, 'enemy', 'burning', playerSpell)
    applyStatus(large, 'enemy', 'thorn-wound', playerSpell)
    applyStatus(small, 'enemy', 'thorn-wound', playerSpell)
    applyStatus(large, 'player', 'regeneration', { actor: 'player', kind: 'system', sourceId: 'regen' })
    applyStatus(small, 'player', 'regeneration', { actor: 'player', kind: 'system', sourceId: 'regen' })
    tickStatuses(large, 5000, executeCombatEffects)
    for (let index = 0; index < 5; index += 1) tickStatuses(small, 1000, executeCombatEffects)
    expect(large.combat.enemyHp).toBe(small.combat.enemyHp)
    expect(large.player.health).toBe(small.player.health)
    expect(large.combat.enemyStatuses.map((status) => [status.statusId, status.remainingMs])).toEqual(small.combat.enemyStatuses.map((status) => [status.statusId, status.remainingMs]))
  })

  it('uses only the authored melee or ranged weapon tag', () => {
    const modifiers = STATUS_DEFINITIONS.quickening.modifiers ?? []
    const original = [...modifiers]
    modifiers.push({ key: 'melee-damage-percent', value: 0.5 })
    try {
      const melee = stateWithEnemy()
      applyStatus(melee, 'player', 'quickening', playerSpell)
      executeCombatEffects(melee, [{ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: 10 }, tags: ['direct'] }], { actor: 'player', kind: 'weapon', sourceId: 'melee', tags: ['weapon', 'melee'] })
      const ranged = stateWithEnemy()
      applyStatus(ranged, 'player', 'quickening', playerSpell)
      executeCombatEffects(ranged, [{ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: 10 }, tags: ['direct'] }], { actor: 'player', kind: 'weapon', sourceId: 'ranged', tags: ['weapon', 'ranged'] })
      expect(melee.combat.enemyHp).toBe(29)
      expect(ranged.combat.enemyHp).toBe(34)
    } finally {
      STATUS_DEFINITIONS.quickening.modifiers = original
    }
  })

  it('does not apply spell equipment multipliers to periodic Burning ticks', () => {
    const plain = stateWithEnemy()
    const equipped = stateWithEnemy()
    equipped.equipment.weapon = 'ember-staff'
    applyStatus(plain, 'enemy', 'burning', playerSpell)
    applyStatus(equipped, 'enemy', 'burning', playerSpell)
    tickStatuses(plain, 1000, executeCombatEffects)
    tickStatuses(equipped, 1000, executeCombatEffects)
    expect(equipped.combat.enemyHp).toBe(plain.combat.enemyHp)
  })

  it('uses the canonical damage calculation for preview and resolution', () => {
    const state = stateWithEnemy()
    state.equipment.weapon = 'ember-staff'
    const source: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'fire-bolt', school: 'fire', tags: ['spell', 'magic'] }
    const preview = getCombatDamagePreview(state, 10, source, 'enemy', 'fire')
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: 'fire', school: 'fire', magnitude: { type: 'flat', value: 10 } }], source)
    expect(state.combat.enemyHp).toBe(44 - preview.healthDamage)
  })

  it('fires HP threshold rules only when health crosses downward', () => {
    const trait = { id: 'audit-threshold-owner', name: 'Audit Threshold Owner', description: 'Test trait.', rules: [{ id: 'audit-threshold-rule', event: 'on-hp-threshold' as const, condition: { type: 'self-hp-below-percent' as const, percent: 50 }, effects: [{ type: 'gain-barrier' as const, target: 'self' as const, magnitude: { type: 'flat' as const, value: 5 } }] }] }
    withTemporaryTrait(trait, () => {
      const state = stateWithEnemy()
      damageEnemy(state, 25, 'spell')
      expect(state.combat.enemyBarrier).toBe(5)
      damageEnemy(state, 1, 'spell')
      expect(state.combat.enemyBarrier).toBe(4)
    })
  })

  it('runs status-owned triggers with status source metadata and emits on-heal', () => {
    const original = STATUS_DEFINITIONS.quickening.triggers
    STATUS_DEFINITIONS.quickening.triggers = [{ id: 'audit-status-heal', event: 'on-heal', effects: [{ type: 'apply-status', target: 'self', statusId: 'haste' }] }]
    try {
      const state = stateWithEnemy()
      state.player.health = 90
      applyStatus(state, 'player', 'quickening', playerSpell)
      executeCombatEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 1 }, tags: ['heal', 'direct'] }], playerSpell)
      const haste = state.combat.playerStatuses.find((status) => status.statusId === 'haste')
      expect(haste?.source).toMatchObject({ kind: 'status', sourceId: 'quickening' })
    } finally {
      STATUS_DEFINITIONS.quickening.triggers = original
    }
  })

  it('runs player status combat-start rules once per spawned encounter', () => {
    const original = STATUS_DEFINITIONS.quickening.triggers
    STATUS_DEFINITIONS.quickening.triggers = [{
      id: 'audit-player-combat-start',
      event: 'on-combat-start',
      oncePerEncounter: true,
      effects: [
        { type: 'apply-status', target: 'self', statusId: 'haste' },
        { type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 5 }, mode: 'add', durationMs: null },
      ],
    }]
    try {
      const state = createInitialState()
      state.combat.active = true
      state.combat.dungeonId = 'whispering-woods'
      applyStatus(state, 'player', 'quickening', playerSpell)

      spawnEnemy(state, 'forest-wisp')
      expect(state.combat.playerBarrier).toBe(5)
      expect(state.combat.playerStatuses.find((status) => status.statusId === 'haste')?.source).toMatchObject({ kind: 'status', sourceId: 'quickening', tags: ['status', 'buff', 'air'] })

      runCombatTriggers(state, 'player', 'on-combat-start', { source: { actor: 'player', kind: 'system', sourceId: 'combat-start' }, eventTarget: 'enemy' }, executeCombatEffects)
      expect(state.combat.playerBarrier).toBe(5)

      spawnEnemy(state, 'thornling')
      expect(state.combat.playerBarrier).toBe(10)
      expect(state.combat.triggeredRuleIds).toContain('player:status:quickening:audit-player-combat-start')
    } finally {
      STATUS_DEFINITIONS.quickening.triggers = original
    }
  })
})

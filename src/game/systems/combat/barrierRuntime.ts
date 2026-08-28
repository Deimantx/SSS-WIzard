import { appendLog, barrierMultiplier, equipmentStats } from '../../engine'
import type { GameState } from '../../types'
import type { CombatSource, CombatTag } from './combatTypes'
import type { CombatActor } from './magnitude'
import { getCombatModifiers } from './modifiers'

export interface BarrierOptions {
  mode?: 'add' | 'replace'
  durationMs?: number | null
}

const getBarrier = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerBarrier : state.combat.enemyBarrier
const setBarrier = (state: GameState, actor: CombatActor, amount: number) => {
  if (actor === 'player') state.combat.playerBarrier = amount
  else state.combat.enemyBarrier = amount
}
const getRemaining = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerBarrierRemainingMs : state.combat.enemyBarrierRemainingMs
const setRemaining = (state: GameState, actor: CombatActor, remainingMs: number | null) => {
  if (actor === 'player') state.combat.playerBarrierRemainingMs = remainingMs
  else state.combat.enemyBarrierRemainingMs = remainingMs
}

export const getActiveBarrier = (state: GameState, actor: CombatActor) => getBarrier(state, actor)

export const gainBarrier = (state: GameState, raw: number, source: CombatSource, target: CombatActor, tags: CombatTag[], options: BarrierOptions = {}) => {
  const sourcePower = Math.max(0, 1 + getCombatModifiers(state, source.actor, 'barrier-power-percent', { sourceTags: tags }))
  const targetPower = Math.max(0, 1 + getCombatModifiers(state, target, 'barrier-received-percent', { sourceTags: tags }))
  const equipmentBonus = target === 'player' ? equipmentStats(state).barrierReceived ?? 0 : 0
  const amount = Math.max(0, Math.round(raw * sourcePower * targetPower * (target === 'player' ? barrierMultiplier(state) : 1) + equipmentBonus))
  const mode = options.mode ?? 'add'
  const next = mode === 'replace' ? amount : Math.max(0, getBarrier(state, target) + amount)
  setBarrier(state, target, next)
  if (options.durationMs !== undefined) setRemaining(state, target, next > 0 && options.durationMs !== null ? Math.max(0, options.durationMs) : null)
  else if (mode === 'replace' && next <= 0) setRemaining(state, target, null)
  return amount
}

export const consumeBarrier = (state: GameState, target: CombatActor, amount: number) => {
  const before = getBarrier(state, target)
  const absorbed = Math.min(before, Math.max(0, amount))
  const next = Math.max(0, before - absorbed)
  setBarrier(state, target, next)
  if (next <= 0 && before > 0) setRemaining(state, target, null)
  return absorbed
}

export const tickBarriers = (state: GameState, deltaMs: number) => {
  ;(['player', 'enemy'] as CombatActor[]).forEach((actor) => {
    const remaining = getRemaining(state, actor)
    if (remaining === null || getBarrier(state, actor) <= 0) return
    const next = Math.max(0, remaining - deltaMs)
    setRemaining(state, actor, next)
    if (next <= 0) {
      setBarrier(state, actor, 0)
      setRemaining(state, actor, null)
      appendLog(state, `${actor === 'player' ? 'Player' : 'Enemy'} Barrier expires.`)
    }
  })
}

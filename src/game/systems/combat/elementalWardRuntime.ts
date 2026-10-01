import { isElementId, type ElementId } from '../../content/elements/elements'
import type { ElementalDamageReduction, GameState } from '../../types'

export interface ApplyElementalWardOptions {
  element: ElementId
  reduction: number
  sourceId: string
  durationMs?: number | null
}

/** Applies or refreshes one named Ward. Reapplying a source replaces its value and duration. */
export const applyElementalWard = (state: GameState, options: ApplyElementalWardOptions): ElementalDamageReduction | null => {
  const { element, sourceId } = options
  if (!isElementId(element) || !sourceId.trim() || !Number.isFinite(options.reduction) || options.reduction <= 0 || options.reduction >= 1) return null
  const now = Number.isFinite(state.combat.arcaneCoreRuntime.elapsedMs) ? Math.max(0, state.combat.arcaneCoreRuntime.elapsedMs) : 0
  if (options.durationMs !== null && options.durationMs !== undefined && (!Number.isFinite(options.durationMs) || options.durationMs < 0)) return null
  const duration = options.durationMs === null || options.durationMs === undefined ? undefined : Math.max(0, options.durationMs)
  const ward: ElementalDamageReduction = {
    element,
    reduction: options.reduction,
    sourceId,
    ...(duration === undefined ? {} : { expiresAt: now + duration, durationMs: duration }),
  }
  const activeWards = (state.combat.elementalDamageReductions ?? [])
    .filter((active) => active.expiresAt === undefined || active.expiresAt > now)
    .filter((active) => active.element !== element || active.sourceId !== sourceId)
  state.combat.elementalDamageReductions = [...activeWards, ward].slice(-32)
  return ward
}

export const getElementalWardMultiplier = (state: GameState, element: ElementId | null, now = state.combat.arcaneCoreRuntime.elapsedMs): number => {
  if (!element) return 1
  const strongest = (state.combat.elementalDamageReductions ?? [])
    .filter((ward) => ward.element === element && (ward.expiresAt === undefined || ward.expiresAt > now))
    .reduce((reduction, ward) => Math.max(reduction, ward.reduction), 0)
  return 1 - strongest
}

export const clearExpiredElementalWards = (state: GameState) => {
  const now = state.combat.arcaneCoreRuntime.elapsedMs
  state.combat.elementalDamageReductions = (state.combat.elementalDamageReductions ?? []).filter((ward) => ward.expiresAt === undefined || ward.expiresAt > now)
}

export const clearElementalWards = (state: GameState) => { state.combat.elementalDamageReductions = [] }
export const debugApplyElementalWard = (state: GameState, element: ElementId, sourceId = `developer-${element}-ward-fixture`) => applyElementalWard(state, { element, reduction: 0.15, sourceId, durationMs: 20_000 })
export const debugSetElementalWardsToRemaining = (state: GameState, remainingMs: number) => {
  const now = state.combat.arcaneCoreRuntime.elapsedMs
  state.combat.elementalDamageReductions = (state.combat.elementalDamageReductions ?? []).map((ward) => ({ ...ward, expiresAt: now + Math.max(0, remainingMs), durationMs: ward.durationMs ?? 20_000 }))
}
export const debugExpireElementalWards = (state: GameState) => { const now = state.combat.arcaneCoreRuntime.elapsedMs; state.combat.elementalDamageReductions = (state.combat.elementalDamageReductions ?? []).map((ward) => ({ ...ward, expiresAt: now })) }

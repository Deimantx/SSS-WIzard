import { SPELLS } from '../../content/spells/spells'
import { deriveFocusReservations } from '../../engine'
import { getSpellAutoCastFocusCost, isSpellUnlocked } from './spellProgression'
import type { GameState, SpellId, SpellPreset, SpellPresetId, SpellPresetState } from '../../types'

export const SPELL_PRESET_NAME_MAX_LENGTH = 40
export const DEFAULT_SPELL_PRESET_NAME = 'New Preset'

export interface SpellPresetFocusProjection {
  validSpellIds: SpellId[]
  unavailableSpellIds: SpellId[]
  invalidSpellIds: string[]
  presetAutoCastFocus: number
  nonAutoCastFocus: number
  totalAfterApply: number
  freeAfterApply: number
  canApply: boolean
}

export type SpellPresetProjectionState = Pick<GameState, 'activities' | 'progress'> & {
  player: Pick<GameState['player'], 'maxFocus'>
  debug: Pick<GameState['debug'], 'allowFocusOverCap'>
}

export const normalizeSpellPresetName = (value: unknown, fallback = DEFAULT_SPELL_PRESET_NAME) => {
  const name = typeof value === 'string' ? value.trim().slice(0, SPELL_PRESET_NAME_MAX_LENGTH) : ''
  return name || fallback
}

const isSpellId = (value: unknown): value is SpellId => typeof value === 'string' && Object.prototype.hasOwnProperty.call(SPELLS, value)

const dedupeSpellIds = (values: unknown[]): SpellId[] => {
  const seen = new Set<SpellId>()
  return values.flatMap((value) => {
    if (!isSpellId(value) || seen.has(value)) return []
    seen.add(value)
    return [value]
  })
}

/** Sanitizes persisted preset data without changing live Auto-Cast state. */
export const normalizeSpellPresetState = (raw: unknown, autoCast?: Partial<Record<SpellId, boolean>>): SpellPresetState => {
  const source = raw && typeof raw === 'object' ? raw as { presets?: unknown; lastAppliedPresetId?: unknown } : {}
  const rawPresets = Array.isArray(source.presets) ? source.presets : []
  const usedIds = new Set<string>()
  let generatedId = 1
  const presets: SpellPreset[] = rawPresets.flatMap((value): SpellPreset[] => {
    if (!value || typeof value !== 'object') return []
    const candidate = value as { id?: unknown; name?: unknown; spellIds?: unknown }
    let id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : ''
    while (!id || usedIds.has(id)) {
      id = `spell-preset-${generatedId}`
      generatedId += 1
    }
    usedIds.add(id)
    const spellIds = Array.isArray(candidate.spellIds) ? dedupeSpellIds(candidate.spellIds) : []
    return [{ id, name: normalizeSpellPresetName(candidate.name), spellIds }]
  })
  const requestedAppliedId = typeof source.lastAppliedPresetId === 'string' ? source.lastAppliedPresetId : null
  const applied = requestedAppliedId && presets.some((preset) => preset.id === requestedAppliedId) ? requestedAppliedId : null
  if (!applied || !autoCast) return { presets, lastAppliedPresetId: applied }
  const preset = presets.find((entry) => entry.id === applied)
  const presetIds = new Set(preset?.spellIds ?? [])
  const matches = Object.keys(SPELLS).every((id) => Boolean(autoCast[id as SpellId]) === presetIds.has(id as SpellId))
  return { presets, lastAppliedPresetId: matches ? applied : null }
}

export interface SpellPresetFocusBreakdown {
  autoCastFocus: number
  otherFocus: number
  totalFocus: number
  maxFocus: number
  freeFocus: number
}

export type SpellPresetFocusState = Pick<GameState, 'activities' | 'progress'> & { player: Pick<GameState['player'], 'maxFocus'> }

export const getSpellPresetFocusBreakdown = (state: SpellPresetFocusState): SpellPresetFocusBreakdown => {
  const reservations = deriveFocusReservations(state)
  const autoCastFocus = reservations.filter((reservation) => reservation.sourceType === 'autocast').reduce((sum, reservation) => sum + reservation.amount, 0)
  const otherFocus = reservations.filter((reservation) => reservation.sourceType !== 'autocast').reduce((sum, reservation) => sum + reservation.amount, 0)
  const totalFocus = autoCastFocus + otherFocus
  return { autoCastFocus, otherFocus, totalFocus, maxFocus: state.player.maxFocus, freeFocus: state.player.maxFocus - totalFocus }
}

export const doesCurrentAutoCastMatchPreset = (state: Pick<GameState, 'activities' | 'progress'>, preset: Pick<SpellPreset, 'spellIds'>) => {
  const projection = getSpellPresetFocusProjection({ ...state, player: { maxFocus: 0 }, debug: { allowFocusOverCap: true } }, preset)
  if (!projection.validSpellIds.length || projection.unavailableSpellIds.length || projection.invalidSpellIds.length) return false
  const presetIds = new Set(projection.validSpellIds)
  return Object.keys(SPELLS).every((id) => Boolean(state.activities.autoCast[id as SpellId]) === presetIds.has(id as SpellId))
}

export const getSpellPresetFocusProjection = (
  state: SpellPresetProjectionState,
  preset: Pick<SpellPreset, 'spellIds'>,
): SpellPresetFocusProjection => {
  const validSpellIds: SpellId[] = []
  const unavailableSpellIds: SpellId[] = []
  const invalidSpellIds: string[] = []
  const seen = new Set<string>()
  for (const rawId of preset.spellIds) {
    if (seen.has(rawId)) continue
    seen.add(rawId)
    if (!isSpellId(rawId)) { invalidSpellIds.push(String(rawId)); continue }
    if (isSpellUnlocked(state, rawId)) validSpellIds.push(rawId)
    else unavailableSpellIds.push(rawId)
  }
  const presetAutoCastFocus = validSpellIds.reduce((sum, spellId) => sum + (getSpellAutoCastFocusCost(state, spellId) ?? 0), 0)
  const nonAutoCastFocus = getSpellPresetFocusBreakdown({ activities: state.activities, progress: state.progress, player: state.player }).otherFocus
  const totalAfterApply = nonAutoCastFocus + presetAutoCastFocus
  const freeAfterApply = state.player.maxFocus - totalAfterApply
  return {
    validSpellIds,
    unavailableSpellIds,
    invalidSpellIds,
    presetAutoCastFocus,
    nonAutoCastFocus,
    totalAfterApply,
    freeAfterApply,
    canApply: validSpellIds.length > 0 && (Boolean(state.debug.allowFocusOverCap) || totalAfterApply <= state.player.maxFocus),
  }
}

export const getNextSpellPresetId = (presets: readonly SpellPreset[]) => {
  const used = new Set(presets.map((preset) => preset.id))
  let index = 1
  while (used.has(`spell-preset-${index}`)) index += 1
  return `spell-preset-${index}` as SpellPresetId
}

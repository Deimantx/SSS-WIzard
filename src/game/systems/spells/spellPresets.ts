import { CANONICAL_SPELL_IDS, LEGACY_SPELL_ID_MAP } from '../../content/spells/spells'
import { deriveFocusReservations } from '../focus/focusReservations'
import type { FocusReservationState } from '../focus/focusReservations'
import { getSpellAutoCastFocusCost, isSpellUnlocked } from './spellProgression'
import type { ActiveCombatSpellLoadout, CanonicalSpellId, GameState, SpellId, SpellPreset, SpellPresetId, SpellPresetSlot, SpellPresetState } from '../../types'

export const MAX_COMBAT_SPELLS = 8
export const SPELL_PRESET_NAME_MAX_LENGTH = 40
export const DEFAULT_SPELL_PRESET_NAME = 'New Preset'
export const DEFAULT_COMBAT_LOADOUT_NAME = 'Combat Loadout'

export interface SpellPresetFocusProjection {
  validSlots: SpellPresetSlot[]
  validSpellIds: CanonicalSpellId[]
  unavailableSpellIds: CanonicalSpellId[]
  invalidSpellIds: string[]
  presetAutoCastFocus: number
  nonAutoCastFocus: number
  totalAfterApply: number
  freeAfterApply: number
  canApply: boolean
}

export type SpellPresetProjectionState = Pick<GameState, 'activities' | 'progress' | 'equipment' | 'artifactProgress' | 'arcaneCore'> & {
  player: Pick<GameState['player'], 'maxFocus'>
  debug: Pick<GameState['debug'], 'allowFocusOverCap'>
}

export const normalizeSpellPresetName = (value: unknown, fallback = DEFAULT_SPELL_PRESET_NAME) => {
  const name = typeof value === 'string' ? value.trim().slice(0, SPELL_PRESET_NAME_MAX_LENGTH) : ''
  return name || fallback
}

const isSpellId = (value: unknown): value is SpellId => typeof value === 'string' && (CANONICAL_SPELL_IDS.includes(value as CanonicalSpellId) || Boolean(LEGACY_SPELL_ID_MAP[value]))
export const canonicalSpellId = (value: unknown): CanonicalSpellId | undefined => {
  if (!isSpellId(value)) return undefined
  const canonical = LEGACY_SPELL_ID_MAP[value] ?? value
  return CANONICAL_SPELL_IDS.includes(canonical as CanonicalSpellId) ? canonical as CanonicalSpellId : undefined
}

const normalizeRawSlots = (value: unknown, legacySpellIds?: unknown): SpellPresetSlot[] => {
  const source = Array.isArray(value)
    ? value.map((entry) => ({ spellId: entry && typeof entry === 'object' ? (entry as { spellId?: unknown }).spellId : undefined, autoCast: entry && typeof entry === 'object' ? Boolean((entry as { autoCast?: unknown }).autoCast) : false }))
    : Array.isArray(legacySpellIds) ? legacySpellIds.map((spellId) => ({ spellId, autoCast: true })) : []
  const seen = new Set<CanonicalSpellId>()
  return source.flatMap((entry): SpellPresetSlot[] => {
    const spellId = canonicalSpellId(entry.spellId)
    if (!spellId || seen.has(spellId)) return []
    seen.add(spellId)
    return [{ spellId, autoCast: Boolean(entry.autoCast) }]
  }).slice(0, MAX_COMBAT_SPELLS)
}

export const normalizeSpellPresetSlots = (value: unknown, legacySpellIds?: unknown) => normalizeRawSlots(value, legacySpellIds)

/** Sanitizes persisted preset data. Legacy spellIds are converted to AUTO slots. */
export const normalizeSpellPresetState = (raw: unknown): SpellPresetState => {
  const source = raw && typeof raw === 'object' ? raw as { presets?: unknown; selectedPresetId?: unknown; lastAppliedPresetId?: unknown } : {}
  const rawPresets = Array.isArray(source.presets) ? source.presets : []
  const usedIds = new Set<string>()
  let generatedId = 1
  const presets: SpellPreset[] = rawPresets.flatMap((value): SpellPreset[] => {
    if (!value || typeof value !== 'object') return []
    const candidate = value as { id?: unknown; name?: unknown; slots?: unknown; spellIds?: unknown }
    let id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : ''
    while (!id || usedIds.has(id)) {
      id = `spell-preset-${generatedId}`
      generatedId += 1
    }
    usedIds.add(id)
    return [{ id, name: normalizeSpellPresetName(candidate.name), slots: normalizeRawSlots(candidate.slots, candidate.spellIds) }]
  })
  const requestedId = typeof source.selectedPresetId === 'string'
    ? source.selectedPresetId
    : typeof source.lastAppliedPresetId === 'string' ? source.lastAppliedPresetId : null
  const selectedPresetId = requestedId && presets.some((preset) => preset.id === requestedId)
    ? requestedId
    : presets[0]?.id ?? null
  return { presets, selectedPresetId }
}

export interface SpellPresetFocusBreakdown {
  autoCastFocus: number
  otherFocus: number
  totalFocus: number
  maxFocus: number
  freeFocus: number
}

export type SpellPresetFocusState = FocusReservationState & { player: Pick<GameState['player'], 'maxFocus'> }

export const getSpellPresetFocusBreakdown = (state: SpellPresetFocusState): SpellPresetFocusBreakdown => {
  const reservations = deriveFocusReservations(state)
  const autoCastFocus = reservations.filter((reservation) => reservation.sourceType === 'autocast').reduce((sum, reservation) => sum + reservation.amount, 0)
  const otherFocus = reservations.filter((reservation) => reservation.sourceType !== 'autocast').reduce((sum, reservation) => sum + reservation.amount, 0)
  const totalFocus = autoCastFocus + otherFocus
  return { autoCastFocus, otherFocus, totalFocus, maxFocus: state.player.maxFocus, freeFocus: state.player.maxFocus - totalFocus }
}

export const getSpellPresetSignature = (slots: readonly SpellPresetSlot[]) => slots.map((slot) => `${slot.spellId}:${slot.autoCast ? 1 : 0}`).join('|')

export const getSpellPresetAutoCastPriority = (slots: readonly SpellPresetSlot[]): CanonicalSpellId[] => slots.filter((slot) => slot.autoCast).map((slot) => slot.spellId)

export const doesCurrentAutoCastMatchPreset = (
  state: Pick<GameState, 'activities' | 'progress' | 'equipment' | 'artifactProgress' | 'arcaneCore'>,
  preset: Pick<SpellPreset, 'slots'>,
) => {
  const projection = getSpellPresetFocusProjection({ ...state, player: { maxFocus: 0 }, debug: { allowFocusOverCap: true } }, preset)
  if (!projection.validSlots.length || projection.unavailableSpellIds.length || projection.invalidSpellIds.length) return false
  const current = state.activities.autoCastPriority?.filter((spellId) => state.activities.autoCast[spellId]) ?? []
  const expected = getSpellPresetAutoCastPriority(projection.validSlots)
  return current.length === expected.length && current.every((id, index) => id === expected[index])
}

export const getSpellPresetFocusProjection = (
  state: SpellPresetProjectionState,
  preset: Pick<SpellPreset, 'slots'>,
): SpellPresetFocusProjection => {
  const validSlots: SpellPresetSlot[] = []
  const validSpellIds: CanonicalSpellId[] = []
  const unavailableSpellIds: CanonicalSpellId[] = []
  const invalidSpellIds: string[] = []
  const seen = new Set<CanonicalSpellId>()
  const rawSlots = Array.isArray(preset.slots) ? preset.slots : []
  rawSlots.slice(0, MAX_COMBAT_SPELLS).forEach((rawSlot) => {
    const rawId = rawSlot && typeof rawSlot === 'object' ? (rawSlot as { spellId?: unknown }).spellId : undefined
    const canonical = canonicalSpellId(rawId)
    if (!canonical) { invalidSpellIds.push(String(rawId)); return }
    if (seen.has(canonical)) return
    seen.add(canonical)
    const slot = { spellId: canonical, autoCast: Boolean((rawSlot as { autoCast?: unknown }).autoCast) }
    if (isSpellUnlocked(state, canonical)) {
      validSlots.push(slot)
      validSpellIds.push(canonical)
    } else unavailableSpellIds.push(canonical)
  })
  const presetAutoCastFocus = validSlots.filter((slot) => slot.autoCast).reduce((sum, slot) => sum + (getSpellAutoCastFocusCost(state, slot.spellId) ?? 0), 0)
  const nonAutoCastFocus = getSpellPresetFocusBreakdown({ activities: state.activities, progress: state.progress, equipment: state.equipment, artifactProgress: state.artifactProgress, arcaneCore: state.arcaneCore, player: state.player }).otherFocus
  const totalAfterApply = nonAutoCastFocus + presetAutoCastFocus
  const freeAfterApply = state.player.maxFocus - totalAfterApply
  return { validSlots, validSpellIds, unavailableSpellIds, invalidSpellIds, presetAutoCastFocus, nonAutoCastFocus, totalAfterApply, freeAfterApply, canApply: validSlots.length > 0 && (Boolean(state.debug.allowFocusOverCap) || totalAfterApply <= state.player.maxFocus) }
}

export const getNextSpellPresetId = (presets: readonly SpellPreset[]) => {
  const used = new Set(presets.map((preset) => preset.id))
  let index = 1
  while (used.has(`spell-preset-${index}`)) index += 1
  return `spell-preset-${index}` as SpellPresetId
}

/** Applies a loadout snapshot to the compatibility Auto-Cast runtime. */
export const syncAutoCastRuntimeForLoadout = (state: Pick<GameState, 'activities' | 'combat'>, slots: readonly SpellPresetSlot[]) => {
  Object.keys(state.activities.autoCast).forEach((spellId) => { state.activities.autoCast[spellId as SpellId] = false })
  const priority = getSpellPresetAutoCastPriority(slots)
  priority.forEach((spellId) => { state.activities.autoCast[spellId] = true })
  state.activities.autoCastPriority = [...priority]
  state.combat.autoCastManaStarvedSpells = state.combat.autoCastManaStarvedSpells.filter((spellId) => priority.includes(spellId as CanonicalSpellId))
}

export const getSelectedSpellPreset = (state: Pick<GameState, 'spellPresets'>) => state.spellPresets.presets.find((preset) => preset.id === state.spellPresets.selectedPresetId) ?? null

export const buildActiveCombatSpellLoadout = (state: SpellPresetProjectionState & Pick<GameState, 'spellPresets'>): ActiveCombatSpellLoadout => {
  const preset = getSelectedSpellPreset(state)
  const projection = preset ? getSpellPresetFocusProjection(state, preset) : null
  const slots = projection?.validSlots ?? []
  return { presetId: preset?.id ?? null, presetName: preset?.name ?? 'No Preset Selected', slots, signature: getSpellPresetSignature(slots) }
}

/** The only battle-boundary transition from persisted build configuration to combat runtime. */
export const activateSelectedSpellPresetForBattle = (state: GameState) => {
  const next = buildActiveCombatSpellLoadout({ ...state, player: { maxFocus: state.player.maxFocus }, debug: { allowFocusOverCap: state.debug.allowFocusOverCap } })
  const previous = state.combat.activeSpellLoadout
  const changed = !previous || previous.presetId !== next.presetId || previous.signature !== next.signature
  if (changed) state.combat.queuedPlayerSpellId = null
  state.combat.activeSpellLoadout = next
  syncAutoCastRuntimeForLoadout(state, next.slots)
  return { loadout: next, changed }
}

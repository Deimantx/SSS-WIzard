import { CANONICAL_SPELL_IDS, LEGACY_SPELL_ID_MAP } from '../../content/spells/spells'
import { deriveActiveNonCombatFocusReservations, getCombatFocusReadiness } from '../focus/focusReservations'
import type { FocusReservationState } from '../focus/focusReservations'
import { getSpellAutoCastFocusCost, isSpellUnlocked } from './spellProgression'
import { getSpellAutomationConfig, normalizeSpellAutomationConfig } from './spellAutomation'
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
  combat?: Pick<GameState['combat'], 'active' | 'activeSpellLoadout'>
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
  const source: Array<{ spellId: unknown; autoCast: boolean; automation?: unknown; hasAutomation: boolean }> = Array.isArray(value)
    ? value.map((entry) => ({ spellId: entry && typeof entry === 'object' ? (entry as { spellId?: unknown }).spellId : undefined, autoCast: entry && typeof entry === 'object' ? Boolean((entry as { autoCast?: unknown }).autoCast) : false, automation: entry && typeof entry === 'object' ? (entry as { automation?: unknown }).automation : undefined, hasAutomation: Boolean(entry && typeof entry === 'object' && Object.prototype.hasOwnProperty.call(entry, 'automation')) }))
    : Array.isArray(legacySpellIds) ? legacySpellIds.map((spellId) => ({ spellId, autoCast: true, hasAutomation: false })) : []
  const seen = new Set<CanonicalSpellId>()
  return source.flatMap((entry): SpellPresetSlot[] => {
    const spellId = canonicalSpellId(entry.spellId)
    if (!spellId || seen.has(spellId)) return []
    seen.add(spellId)
    const slot: SpellPresetSlot = { spellId, autoCast: Boolean(entry.autoCast) }
    if (entry.hasAutomation) slot.automation = normalizeSpellAutomationConfig(entry.automation, spellId, slot.autoCast)
    return [slot]
  }).slice(0, MAX_COMBAT_SPELLS)
}

export const normalizeSpellPresetSlots = (value: unknown, legacySpellIds?: unknown) => normalizeRawSlots(value, legacySpellIds)

export type SpellPresetInsertFailure = 'duplicate' | 'full' | 'invalid-index' | 'unavailable'

export type SpellPresetInsertResult =
  | { ok: true; slots: SpellPresetSlot[] }
  | { ok: false; reason: SpellPresetInsertFailure }

/** Returns a reordered draft without mutating the source slot array or its slot objects. */
export const moveSpellToIndex = (slots: readonly SpellPresetSlot[], fromIndex: number, toIndex: number): SpellPresetSlot[] | null => {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex < 0 || fromIndex >= slots.length || toIndex < 0 || toIndex >= slots.length) return null
  if (fromIndex === toIndex) return slots.map((slot) => ({ ...slot }))
  const next = slots.map((slot) => ({ ...slot }))
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

/** Swaps two visible loadout positions; an empty trailing position moves the source to the compacted end. */
export const swapSpellSlots = (slots: readonly SpellPresetSlot[], sourceIndex: number, targetIndex: number): SpellPresetSlot[] | null => {
  if (!Number.isInteger(sourceIndex) || !Number.isInteger(targetIndex) || sourceIndex < 0 || sourceIndex >= slots.length || targetIndex < 0 || targetIndex >= MAX_COMBAT_SPELLS) return null
  if (sourceIndex === targetIndex) return slots.map((slot) => ({ ...slot }))
  const next = slots.map((slot) => ({ ...slot }))
  const resolvedTarget = Math.min(targetIndex, next.length - 1)
  if (resolvedTarget < 0) return null
  const source = next[sourceIndex]
  next[sourceIndex] = next[resolvedTarget]
  next[resolvedTarget] = source
  return next
}

/** Inserts an unlocked spell into a draft while enforcing the editor's duplicate and slot limits. */
export const insertSpellAt = (
  slots: readonly SpellPresetSlot[],
  spellId: CanonicalSpellId,
  index: number,
  options: { maxSlots?: number; available?: boolean } = {},
): SpellPresetInsertResult => {
  const maxSlots = options.maxSlots ?? MAX_COMBAT_SPELLS
  if (!Number.isInteger(index) || index < 0 || index > maxSlots) return { ok: false, reason: 'invalid-index' }
  if (options.available === false) return { ok: false, reason: 'unavailable' }
  if (slots.some((slot) => slot.spellId === spellId)) return { ok: false, reason: 'duplicate' }
  if (slots.length >= maxSlots) return { ok: false, reason: 'full' }
  const next = slots.map((slot) => ({ ...slot }))
  next.splice(Math.min(index, next.length), 0, { spellId, autoCast: false })
  return { ok: true, slots: next }
}

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
  const autoCastFocus = state.combat?.active
    ? getCombatFocusReadiness(state, state.combat.activeSpellLoadout?.slots).combatFocusRequired
    : 0
  const otherFocus = deriveActiveNonCombatFocusReservations(state).reduce((sum, reservation) => sum + reservation.amount, 0)
  const totalFocus = autoCastFocus + otherFocus
  return { autoCastFocus, otherFocus, totalFocus, maxFocus: state.player.maxFocus, freeFocus: state.player.maxFocus - totalFocus }
}

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key])}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}

/** Includes authored automation in battle identity so an edited rule cannot
 * leave an old active snapshot looking equivalent to the new preset. */
export const getSpellPresetSignature = (slots: readonly SpellPresetSlot[]) => slots.map((slot) => {
  const automation = Object.prototype.hasOwnProperty.call(slot, 'automation') ? `:${stableSerialize(getSpellAutomationConfig(slot))}` : ''
  return `${slot.spellId}:${slot.autoCast ? 1 : 0}${automation}`
}).join('|')

export const getSpellPresetAutoCastPriority = (slots: readonly SpellPresetSlot[]): CanonicalSpellId[] => slots.filter((slot) => slot.autoCast).map((slot) => slot.spellId)

export const doesCurrentAutoCastMatchPreset = (
  state: Pick<GameState, 'activities' | 'progress' | 'equipment' | 'artifactProgress' | 'arcaneCore' | 'combat'>,
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
    const autoCast = Boolean((rawSlot as { autoCast?: unknown }).autoCast)
    const slot: SpellPresetSlot = { spellId: canonical, autoCast }
    if (rawSlot && typeof rawSlot === 'object' && Object.prototype.hasOwnProperty.call(rawSlot, 'automation')) slot.automation = normalizeSpellAutomationConfig((rawSlot as { automation?: unknown }).automation, canonical, autoCast)
    if (isSpellUnlocked(state, canonical)) {
      validSlots.push(slot)
      validSpellIds.push(canonical)
    } else unavailableSpellIds.push(canonical)
  })
  const presetAutoCastFocus = validSlots.filter((slot) => slot.autoCast).reduce((sum, slot) => sum + (getSpellAutoCastFocusCost(state, slot.spellId) ?? 0), 0)
  const readiness = getCombatFocusReadiness(state, validSlots)
  const nonAutoCastFocus = readiness.activeNonCombatFocus
  const totalAfterApply = readiness.projectedTotalFocus
  const freeAfterApply = readiness.projectedFreeFocus
  return { validSlots, validSpellIds, unavailableSpellIds, invalidSpellIds, presetAutoCastFocus, nonAutoCastFocus, totalAfterApply, freeAfterApply, canApply: validSlots.length > 0 && readiness.ready }
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
}

export const getSelectedSpellPreset = (state: Pick<GameState, 'spellPresets'>) => state.spellPresets.presets.find((preset) => preset.id === state.spellPresets.selectedPresetId) ?? null

/** Reconciles the derived compatibility Auto-Cast runtime without touching an active battle snapshot. */
export const syncSelectedSpellPresetRuntime = (state: GameState) => {
  if (state.combat.active) return false
  const hadActiveAutoCast = Object.values(state.activities.autoCast).some(Boolean)
  syncAutoCastRuntimeForLoadout(state, [])
  return hadActiveAutoCast
}

export const buildActiveCombatSpellLoadout = (state: SpellPresetProjectionState & Pick<GameState, 'spellPresets'>): ActiveCombatSpellLoadout => {
  const preset = getSelectedSpellPreset(state)
  const projection = preset ? getSpellPresetFocusProjection(state, preset) : null
  const slots = projection?.validSlots ?? []
  return { presetId: preset?.id ?? null, presetName: preset?.name ?? 'No Preset Selected', slots, signature: getSpellPresetSignature(slots) }
}

export type CombatLoadoutPreflight =
  | { ok: true; presetId: SpellPresetId; projection: SpellPresetFocusProjection }
  | { ok: false; reason: 'focus' | 'empty' | 'unavailable' | 'missing-preset'; requiredExtraFocus?: number; unavailableSpellIds?: CanonicalSpellId[]; focus?: ReturnType<typeof getCombatFocusReadiness> }

/** Validates the persisted preset and its current projection before an encounter starts. */
export const validateSelectedCombatLoadout = (state: GameState): CombatLoadoutPreflight => {
  const preset = getSelectedSpellPreset(state)
  if (!preset) return { ok: false, reason: 'missing-preset' }
  const projection = getSpellPresetFocusProjection(state, preset)
  if (!preset.slots.length) return { ok: false, reason: 'empty', unavailableSpellIds: projection.unavailableSpellIds }
  if (!projection.validSlots.length) return { ok: false, reason: 'unavailable', unavailableSpellIds: projection.unavailableSpellIds }
  if (!projection.canApply) {
    return { ok: false, reason: 'focus', requiredExtraFocus: Math.max(0, projection.totalAfterApply - state.player.maxFocus), unavailableSpellIds: projection.unavailableSpellIds, focus: getCombatFocusReadiness(state, projection.validSlots) }
  }
  return { ok: true, presetId: preset.id, projection }
}

export type ActivateCombatLoadoutResult =
  | { ok: true; loadout: ActiveCombatSpellLoadout; changed: boolean }
  | Extract<CombatLoadoutPreflight, { ok: false }>

/** The only battle-boundary transition from persisted build configuration to combat runtime. */
export const activateSelectedSpellPresetForBattle = (state: GameState): ActivateCombatLoadoutResult => {
  if (state.spellPresets.selectedPresetId === null && state.spellPresets.presets.length === 1) {
    const onlyPreset = state.spellPresets.presets[0]
    const onlyProjection = getSpellPresetFocusProjection(state, onlyPreset)
    if (onlyProjection.validSlots.length) state.spellPresets.selectedPresetId = onlyPreset.id
  }
  const preflight = validateSelectedCombatLoadout(state)
  if (!preflight.ok) return preflight
  const preset = getSelectedSpellPreset(state)
  if (!preset) return { ok: false, reason: 'missing-preset' }

  const slots = preflight.projection.validSlots
  const next: ActiveCombatSpellLoadout = { presetId: preset.id, presetName: preset.name, slots, signature: getSpellPresetSignature(slots) }
  const previous = state.combat.activeSpellLoadout
  const changed = !previous || previous.presetId !== next.presetId || previous.signature !== next.signature
  if (changed) state.combat.queuedPlayerSpellId = null
  state.combat.activeSpellLoadout = next
  syncAutoCastRuntimeForLoadout(state, next.slots)
  return { ok: true, loadout: next, changed }
}

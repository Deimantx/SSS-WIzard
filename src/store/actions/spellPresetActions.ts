import { canonicalSpellId, getNextSpellPresetId, getSelectedSpellPreset, getSpellPresetFocusProjection, isSpellUnlocked, MAX_COMBAT_SPELLS, moveSpellToIndex, normalizeSpellPresetName, normalizeSpellPresetSlots, syncAutoCastRuntimeForLoadout, syncSelectedSpellPresetRuntime as syncSelectedSpellPresetRuntimeForState } from '../../game/systems/spells'
import type { CanonicalSpellId, GameState, SpellId, SpellPreset, SpellPresetId } from '../../game/types'

export interface ApplySpellPresetResult {
  ok: boolean
  reason?: 'focus' | 'missing-preset' | 'empty'
  requiredExtraFocus?: number
  unavailableSpellIds?: CanonicalSpellId[]
}

export type SelectedPresetSlotMutationResult =
  | { ok: true }
  | { ok: false; reason: 'missing-preset' | 'duplicate' | 'full' | 'unavailable' | 'invalid-index' }

const clearAutoCastRuntime = (state: GameState) => {
  const hadActiveAutoCast = Object.values(state.activities.autoCast).some(Boolean)
  syncAutoCastRuntimeForLoadout(state, [])
  state.combat.autoCastManaStarvedSpells = []
  return hadActiveAutoCast
}

export const syncSelectedSpellPresetRuntime = (state: GameState) => syncSelectedSpellPresetRuntimeForState(state)

export const addSpellToSelectedPresetAction = (state: GameState, requestedSpellId: SpellId): SelectedPresetSlotMutationResult => {
  const spellId = canonicalSpellId(requestedSpellId)
  if (!spellId || !isSpellUnlocked(state, spellId)) return { ok: false, reason: 'unavailable' }
  let preset = getSelectedSpellPreset(state)
  if (!preset) {
    const id = getNextSpellPresetId(state.spellPresets.presets)
    preset = { id, name: 'Combat Loadout', slots: [] }
    state.spellPresets.presets.push(preset)
    state.spellPresets.selectedPresetId = id
  }
  if (preset.slots.some((slot) => slot.spellId === spellId)) return { ok: false, reason: 'duplicate' }
  if (preset.slots.length >= MAX_COMBAT_SPELLS) return { ok: false, reason: 'full' }
  preset.slots.push({ spellId, autoCast: false })
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  return { ok: true }
}

export const removeSpellFromSelectedPresetAction = (state: GameState, requestedSpellId: SpellId): SelectedPresetSlotMutationResult => {
  const spellId = canonicalSpellId(requestedSpellId)
  const preset = spellId ? getSelectedSpellPreset(state) : null
  if (!preset) return { ok: false, reason: 'missing-preset' }
  const index = preset.slots.findIndex((slot) => slot.spellId === spellId)
  if (index < 0) return { ok: false, reason: 'unavailable' }
  preset.slots.splice(index, 1)
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  return { ok: true }
}

export const moveSelectedPresetSlotAction = (state: GameState, fromIndex: number, toIndex: number): SelectedPresetSlotMutationResult => {
  const preset = getSelectedSpellPreset(state)
  if (!preset) return { ok: false, reason: 'missing-preset' }
  const next = moveSpellToIndex(preset.slots, fromIndex, toIndex)
  if (!next) return { ok: false, reason: 'invalid-index' }
  preset.slots = next
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  return { ok: true }
}

/** Compatibility action retained for internal/debug callers. Build editing is owned by the Preset Manager. */
export const clearAutoCastAction = (state: GameState) => clearAutoCastRuntime(state)

/** @deprecated Auto priority is now the order of AUTO slots in the selected loadout. */
export const moveAutoCastPriorityAction = (_state: GameState, _spellId: SpellId, _direction: -1 | 1) => false

export const createSpellPresetAction = (state: GameState, name: string): SpellPresetId => {
  const id = getNextSpellPresetId(state.spellPresets.presets)
  state.spellPresets.presets.push({ id, name: normalizeSpellPresetName(name), slots: [] })
  return id
}

export const renameSpellPresetAction = (state: GameState, id: SpellPresetId, name: string) => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  if (!preset) return false
  preset.name = normalizeSpellPresetName(name, preset.name)
  return true
}

export const duplicateSpellPresetAction = (state: GameState, id: SpellPresetId): SpellPresetId | null => {
  const source = state.spellPresets.presets.find((entry) => entry.id === id)
  if (!source) return null
  const nextId = getNextSpellPresetId(state.spellPresets.presets)
  state.spellPresets.presets.push({ id: nextId, name: normalizeSpellPresetName(`${source.name} Copy`), slots: source.slots.map((slot) => ({ ...slot })) })
  return nextId
}

export const saveSpellPresetAction = (state: GameState, preset: Pick<SpellPreset, 'id' | 'name' | 'slots'>) => {
  const stored = state.spellPresets.presets.find((entry) => entry.id === preset.id)
  if (!stored) return false
  const shouldAutoSelect = state.spellPresets.selectedPresetId === null
  stored.name = normalizeSpellPresetName(preset.name, stored.name)
  stored.slots = normalizeSpellPresetSlots(preset.slots)
  const projection = getSpellPresetFocusProjection(state, stored)
  if (shouldAutoSelect && projection.validSlots.length) state.spellPresets.selectedPresetId = stored.id
  const isSelectedOutsideCombat = !state.combat.active && state.spellPresets.selectedPresetId === stored.id
  if (isSelectedOutsideCombat) {
    if (!projection.validSlots.length) {
      syncAutoCastRuntimeForLoadout(state, [])
      pushPresetNotification(state, `Saved ${stored.name}, but it has no available Spells to activate.`, 'warning')
    } else if (projection.canApply) {
      syncAutoCastRuntimeForLoadout(state, projection.validSlots)
    } else {
      pushPresetNotification(state, `Saved ${stored.name}, but it requires ${Math.max(0, projection.totalAfterApply - state.player.maxFocus)} more Focus to activate.`, 'warning')
    }
  }
  return true
}

export const setPresetSlotAutoCastAction = (state: GameState, id: SpellPresetId, spellId: CanonicalSpellId, autoCast: boolean) => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  const slot = preset?.slots.find((entry) => entry.spellId === spellId)
  if (!slot) return false
  slot.autoCast = Boolean(autoCast)
  return true
}

export const deleteSpellPresetAction = (state: GameState, id: SpellPresetId) => {
  const index = state.spellPresets.presets.findIndex((entry) => entry.id === id)
  if (index < 0) return false
  state.spellPresets.presets.splice(index, 1)
  if (state.spellPresets.selectedPresetId === id) {
    const replacement = state.spellPresets.presets[index] ?? state.spellPresets.presets[index - 1] ?? null
    state.spellPresets.selectedPresetId = replacement?.id ?? null
    if (!state.combat.active) syncSelectedSpellPresetRuntime(state)
  }
  return true
}

export const selectSpellPresetAction = (state: GameState, id: SpellPresetId): ApplySpellPresetResult => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  if (!preset) return { ok: false, reason: 'missing-preset', unavailableSpellIds: [] }
  const projection = getSpellPresetFocusProjection(state, preset)
  if (!projection.validSlots.length) {
    pushPresetNotification(state, `Cannot select ${preset.name} · Add at least one available Spell.`, 'warning')
    return { ok: false, reason: 'empty', unavailableSpellIds: projection.unavailableSpellIds }
  }
  if (!projection.canApply) {
    const required = Math.max(0, projection.totalAfterApply - state.player.maxFocus)
    pushPresetNotification(state, `Cannot select ${preset.name} · Requires ${required} more Focus.`, 'warning')
    return { ok: false, reason: 'focus', requiredExtraFocus: required, unavailableSpellIds: projection.unavailableSpellIds }
  }
  state.spellPresets.selectedPresetId = id
  if (!state.combat.active) syncAutoCastRuntimeForLoadout(state, projection.validSlots)
  if (projection.unavailableSpellIds.length) pushPresetNotification(state, `${preset.name} selected · ${projection.unavailableSpellIds.length} unavailable slot${projection.unavailableSpellIds.length === 1 ? '' : 's'} excluded until available.`, 'warning')
  return { ok: true, unavailableSpellIds: projection.unavailableSpellIds }
}

export const applySpellPresetAction = selectSpellPresetAction

const pushPresetNotification = (state: GameState, text: string, tone: 'info' | 'success' | 'warning') => {
  state.notifications.push({ id: `spell-preset-${Date.now()}-${Math.random().toString(36).slice(2)}`, text, tone, createdAt: Date.now() })
}

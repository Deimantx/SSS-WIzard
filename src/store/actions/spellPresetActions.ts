import { canonicalSpellId, getDefaultSpellAutomationConfig, getNextSpellPresetId, getSelectedSpellPreset, getSpellPresetFocusProjection, isSpellUnlocked, MAX_COMBAT_SPELLS, moveSpellToIndex, normalizeSpellAutomationConfig, normalizeSpellPresetName, normalizeSpellPresetSlots, swapSpellSlots, syncAutoCastRuntimeForLoadout, syncSelectedSpellPresetRuntime as syncSelectedSpellPresetRuntimeForState } from '../../game/systems/spells'
import type { CanonicalSpellId, GameState, SpellAutomationConfig, SpellId, SpellPreset, SpellPresetId } from '../../game/types'

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
  preset.slots.push({ spellId, autoCast: false, automation: getDefaultSpellAutomationConfig(spellId, false, true) })
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  return { ok: true }
}

/** Inserts a prepared Spell at a visible loadout position. A full loadout keeps its maximum size by dropping the final shifted slot. */
export const addSpellToSelectedPresetAtAction = (state: GameState, requestedSpellId: SpellId, requestedIndex: number): SelectedPresetSlotMutationResult => {
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
  const index = Math.max(0, Math.min(Number.isInteger(requestedIndex) ? requestedIndex : preset.slots.length, MAX_COMBAT_SPELLS - 1))
  preset.slots.splice(Math.min(index, preset.slots.length), 0, { spellId, autoCast: false, automation: getDefaultSpellAutomationConfig(spellId, false, true) })
  if (preset.slots.length > MAX_COMBAT_SPELLS) preset.slots.length = MAX_COMBAT_SPELLS
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

export const swapSelectedPresetSlotsAction = (state: GameState, sourceIndex: number, targetIndex: number): SelectedPresetSlotMutationResult => {
  const preset = getSelectedSpellPreset(state)
  if (!preset) return { ok: false, reason: 'missing-preset' }
  if (sourceIndex === targetIndex) return { ok: true }
  const next = swapSpellSlots(preset.slots, sourceIndex, targetIndex)
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
  state.spellPresets.presets.push({ id: nextId, name: normalizeSpellPresetName(`${source.name} Copy`), slots: source.slots.map((slot) => ({ ...slot, automation: slot.automation ? { ...slot.automation, conditions: slot.automation.conditions.map((condition) => ({ ...condition })) } : undefined })) })
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
  const previousAutoCast = slot.autoCast
  slot.autoCast = Boolean(autoCast)
  if (slot.autoCast && !slot.automation) slot.automation = getDefaultSpellAutomationConfig(slot.spellId, true, true)
  if (!state.combat.active && !syncSelectedSpellPresetRuntimeForState(state) && slot.autoCast) {
    const projection = preset && state.spellPresets.selectedPresetId === id ? getSpellPresetFocusProjection(state, preset) : null
    slot.autoCast = previousAutoCast
    syncSelectedSpellPresetRuntimeForState(state)
    if (projection) pushPresetNotification(state, `Cannot enable Auto-Cast · Requires ${Math.max(0, projection.totalAfterApply - state.player.maxFocus)} more Focus.`, 'warning')
    return false
  }
  return true
}

export const setPresetSlotAutomationAction = (state: GameState, id: SpellPresetId, spellId: CanonicalSpellId, automation: SpellAutomationConfig) => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  const slot = preset?.slots.find((entry) => entry.spellId === spellId)
  if (!slot) return false
  slot.automation = normalizeSpellAutomationConfig(automation, slot.spellId, slot.autoCast, false)
  return true
}

export type ApplyPresetSlotAutomationResult =
  | { ok: true }
  | { ok: false; reason: 'missing-preset' | 'missing-slot' | 'focus'; requiredExtraFocus?: number; message: string }

/** Applies the editor's mode and rule as one state transition. */
export const applyPresetSlotAutomationAction = (state: GameState, id: SpellPresetId, spellId: CanonicalSpellId, automation: SpellAutomationConfig, autoCast: boolean): ApplyPresetSlotAutomationResult => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  if (!preset) return { ok: false, reason: 'missing-preset', message: 'This preset no longer exists.' }
  const slot = preset.slots.find((entry) => entry.spellId === spellId)
  if (!slot) return { ok: false, reason: 'missing-slot', message: 'This Spell is no longer in the selected loadout.' }
  const previousAutoCast = slot.autoCast
  const previousAutomation = slot.automation
  slot.autoCast = Boolean(autoCast)
  slot.automation = normalizeSpellAutomationConfig(automation, slot.spellId, slot.autoCast, false)
  if (!state.combat.active && state.spellPresets.selectedPresetId === id && slot.autoCast) {
    const projection = getSpellPresetFocusProjection(state, preset)
    if (!projection.canApply) {
      slot.autoCast = previousAutoCast
      slot.automation = previousAutomation
      const requiredExtraFocus = Math.max(0, projection.totalAfterApply - state.player.maxFocus)
      return { ok: false, reason: 'focus', requiredExtraFocus, message: `Cannot enable Auto-Cast: requires ${requiredExtraFocus} more Focus.` }
    }
    syncAutoCastRuntimeForLoadout(state, projection.validSlots)
  }
  return { ok: true }
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

/** Selects a preset for editing without requiring it to be activation-ready. */
export const selectSpellPresetForEditingAction = (state: GameState, id: SpellPresetId) => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  if (!preset) return false
  state.spellPresets.selectedPresetId = id
  if (!state.combat.active) {
    const projection = getSpellPresetFocusProjection(state, preset)
    syncAutoCastRuntimeForLoadout(state, projection.canApply ? projection.validSlots : [])
  }
  return true
}

export const applySpellPresetAction = selectSpellPresetAction

const pushPresetNotification = (state: GameState, text: string, tone: 'info' | 'success' | 'warning') => {
  state.notifications.push({ id: `spell-preset-${Date.now()}-${Math.random().toString(36).slice(2)}`, text, tone, createdAt: Date.now() })
}

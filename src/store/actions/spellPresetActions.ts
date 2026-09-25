import { canonicalSpellId, getDefaultSpellAutomationConfig, getNextSpellPresetId, getSelectedSpellPreset, getSpellPresetFocusProjection, isSpellUnlocked, MAX_COMBAT_SPELLS, moveSpellToIndex, normalizeSpellAutomationConfig, normalizeSpellPresetName, normalizeSpellPresetSlots, swapSpellSlots, syncSelectedSpellPresetRuntime as syncSelectedSpellPresetRuntimeForState } from '../../game/systems/spells'
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
  const index = preset.slots.findIndex((entry) => entry.spellId === spellId)
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

/** Compatibility action retained for internal/debug callers. */
export const clearAutoCastAction = (state: GameState) => {
  const hadActiveAutoCast = Object.values(state.activities.autoCast).some(Boolean)
  Object.keys(state.activities.autoCast).forEach((spellId) => { state.activities.autoCast[spellId as SpellId] = false })
  state.activities.autoCastPriority = []
  return hadActiveAutoCast
}

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
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  if (state.spellPresets.selectedPresetId === stored.id && projection.validSlots.length && !projection.canApply) pushPresetNotification(state, `Saved ${stored.name}; it is ${Math.max(0, projection.totalAfterApply - state.player.maxFocus)} Focus short for combat.`, 'warning')
  return true
}

export const setPresetSlotAutoCastAction = (state: GameState, id: SpellPresetId, spellId: CanonicalSpellId, autoCast: boolean) => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  const slot = preset?.slots.find((entry) => entry.spellId === spellId)
  if (!slot) return false
  slot.autoCast = Boolean(autoCast)
  if (slot.autoCast && !slot.automation) slot.automation = getDefaultSpellAutomationConfig(slot.spellId, true, true)
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  return true
}

export const setPresetSlotAutomationAction = (state: GameState, id: SpellPresetId, spellId: CanonicalSpellId, automation: SpellAutomationConfig) => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  const slot = preset?.slots.find((entry) => entry.spellId === spellId)
  if (!slot) return false
  slot.automation = normalizeSpellAutomationConfig(automation, slot.spellId, slot.autoCast, false)
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  return true
}

export type ApplyPresetSlotAutomationResult =
  | { ok: true }
  | { ok: false; reason: 'missing-preset' | 'missing-slot'; message: string }

/** Applies the editor's mode and rule without treating Focus shortage as an editor failure. */
export const applyPresetSlotAutomationAction = (state: GameState, id: SpellPresetId, spellId: CanonicalSpellId, automation: SpellAutomationConfig, autoCast: boolean): ApplyPresetSlotAutomationResult => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  if (!preset) return { ok: false, reason: 'missing-preset', message: 'This preset no longer exists.' }
  const slot = preset.slots.find((entry) => entry.spellId === spellId)
  if (!slot) return { ok: false, reason: 'missing-slot', message: 'This Spell is no longer in the selected loadout.' }
  slot.autoCast = Boolean(autoCast)
  slot.automation = normalizeSpellAutomationConfig(automation, slot.spellId, slot.autoCast, false)
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  return { ok: true }
}

export const deleteSpellPresetAction = (state: GameState, id: SpellPresetId) => {
  const index = state.spellPresets.presets.findIndex((entry) => entry.id === id)
  if (index < 0) return false
  state.spellPresets.presets.splice(index, 1)
  if (state.spellPresets.selectedPresetId === id) state.spellPresets.selectedPresetId = state.spellPresets.presets[index]?.id ?? state.spellPresets.presets[index - 1]?.id ?? null
  return true
}

export const selectSpellPresetAction = (state: GameState, id: SpellPresetId): ApplySpellPresetResult => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  if (!preset) return { ok: false, reason: 'missing-preset', unavailableSpellIds: [] }
  const projection = getSpellPresetFocusProjection(state, preset)
  if (!projection.validSlots.length) {
    pushPresetNotification(state, `Cannot select ${preset.name}; add at least one available Spell.`, 'warning')
    return { ok: false, reason: 'empty', unavailableSpellIds: projection.unavailableSpellIds }
  }
  state.spellPresets.selectedPresetId = id
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  if (projection.unavailableSpellIds.length) pushPresetNotification(state, `${preset.name} selected; unavailable slots are excluded until available.`, 'warning')
  if (!projection.canApply) pushPresetNotification(state, `${preset.name} selected; ${Math.max(0, projection.totalAfterApply - state.player.maxFocus)} Focus short for combat.`, 'warning')
  return { ok: true, unavailableSpellIds: projection.unavailableSpellIds }
}

export const selectSpellPresetForEditingAction = (state: GameState, id: SpellPresetId) => {
  if (!state.spellPresets.presets.some((entry) => entry.id === id)) return false
  state.spellPresets.selectedPresetId = id
  if (!state.combat.active) syncSelectedSpellPresetRuntimeForState(state)
  return true
}

export const applySpellPresetAction = selectSpellPresetAction

const pushPresetNotification = (state: GameState, text: string, tone: 'info' | 'success' | 'warning') => {
  state.notifications.push({ id: `spell-preset-${Date.now()}-${Math.random().toString(36).slice(2)}`, text, tone, createdAt: Date.now() })
}

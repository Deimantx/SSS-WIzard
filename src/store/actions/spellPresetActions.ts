import { SPELLS } from '../../game/content/spells/spells'
import { getNextSpellPresetId, getSpellPresetFocusProjection, normalizeSpellPresetName } from '../../game/systems/spells'
import type { GameState, SpellId, SpellPreset, SpellPresetId } from '../../game/types'

const normalizedSpellIds = (spellIds: readonly SpellId[]) => [...new Set(spellIds.filter((spellId) => Boolean(SPELLS[spellId])))]

export const createSpellPresetAction = (state: GameState, name: string): SpellPresetId => {
  const id = getNextSpellPresetId(state.spellPresets.presets)
  state.spellPresets.presets.push({ id, name: normalizeSpellPresetName(name), spellIds: [] })
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
  state.spellPresets.presets.push({ id: nextId, name: normalizeSpellPresetName(`${source.name} Copy`), spellIds: [...source.spellIds] })
  return nextId
}

export const saveSpellPresetAction = (state: GameState, preset: Pick<SpellPreset, 'id' | 'name' | 'spellIds'>) => {
  const stored = state.spellPresets.presets.find((entry) => entry.id === preset.id)
  if (!stored) return false
  stored.name = normalizeSpellPresetName(preset.name, stored.name)
  stored.spellIds = normalizedSpellIds(preset.spellIds)
  return true
}

export const deleteSpellPresetAction = (state: GameState, id: SpellPresetId) => {
  const index = state.spellPresets.presets.findIndex((entry) => entry.id === id)
  if (index < 0) return false
  state.spellPresets.presets.splice(index, 1)
  if (state.spellPresets.lastAppliedPresetId === id) state.spellPresets.lastAppliedPresetId = null
  return true
}

export const applySpellPresetAction = (state: GameState, id: SpellPresetId) => {
  const preset = state.spellPresets.presets.find((entry) => entry.id === id)
  if (!preset) return false
  const projection = getSpellPresetFocusProjection(state, preset)
  if (!projection.canApply) {
    const required = Math.max(0, projection.totalAfterApply - state.player.maxFocus)
    pushPresetNotification(state, `Cannot apply ${preset.name} · Requires ${required} more Focus.`, 'warning')
    return false
  }
  Object.keys(SPELLS).forEach((spellId) => { state.activities.autoCast[spellId as SpellId] = false })
  projection.validSpellIds.forEach((spellId) => { state.activities.autoCast[spellId] = true })
  state.spellPresets.lastAppliedPresetId = id
  if (projection.unavailableSpellIds.length) {
    pushPresetNotification(state, `${preset.name} applied · ${projection.unavailableSpellIds.length} spell${projection.unavailableSpellIds.length === 1 ? '' : 's'} unavailable.`, 'warning')
  }
  return true
}

const pushPresetNotification = (state: GameState, text: string, tone: 'info' | 'success' | 'warning') => {
  state.notifications.push({ id: `spell-preset-${Date.now()}-${Math.random().toString(36).slice(2)}`, text, tone, createdAt: Date.now() })
}

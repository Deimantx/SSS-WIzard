import { isRecord } from '../saveSchema'
import type { PersistedGameStateV1 } from './persistedGameState'
import { ITEMS } from '../../game/content/items/items'

const gameplayFields = [
  'player', 'schools', 'currencies', 'resonance', 'tower', 'worldTier', 'inventory', 'crystals',
  'protectedItems', 'equipment', 'arcaneCore', 'artifactProgress', 'sigils', 'guardians', 'activities',
  'combat', 'progress', 'storyProgress', 'darkPortal', 'spellPresets',
] as const
const documentFields = new Set(['schemaVersion', 'savedAt', 'offlineBankMs', ...gameplayFields])
const playerFields = ['health', 'mana', 'baseMaxHealth', 'baseMaxMana', 'healthRegenTimerMs'] as const

export const validatePersistedGameStateV1 = (value: unknown): value is PersistedGameStateV1 => {
  if (!isRecord(value) || value.schemaVersion !== 1) return false
  if (Object.keys(value).some((key) => !documentFields.has(key))) return false
  if (typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt) || value.savedAt < 0) return false
  if (typeof value.offlineBankMs !== 'number' || !Number.isFinite(value.offlineBankMs) || value.offlineBankMs < 0) return false
  if (!gameplayFields.every((field) => isRecord(value[field]))) return false
  const player = value.player as Record<string, unknown>
  if (Object.keys(player).some((key) => !playerFields.includes(key as typeof playerFields[number]))) return false
  if (!playerFields.every((key) => typeof player[key] === 'number' && Number.isFinite(player[key]))) return false
  const combat = value.combat as Record<string, unknown>
  if (Object.prototype.hasOwnProperty.call(combat, 'log')) return false
  const inventory = value.inventory as Record<string, unknown>
  if (Object.entries(inventory).some(([id, quantity]) => !Object.prototype.hasOwnProperty.call(ITEMS, id) || typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0)) return false
  const protectedItems = value.protectedItems as Record<string, unknown>
  if (Object.keys(protectedItems).some((id) => !Object.prototype.hasOwnProperty.call(ITEMS, id))) return false
  return true
}

export const parsePersistedGameStateV1 = (encoded: string): PersistedGameStateV1 => {
  const value: unknown = JSON.parse(encoded)
  if (!validatePersistedGameStateV1(value)) throw new Error('Save does not match the V2 schema.')
  return value
}

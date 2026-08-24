import { migrateSave } from '../persistence/migrations'
import { LEGACY_SAVE_BACKUP_KEY, LEGACY_SAVE_KEY } from '../persistence/saveSchema'
import { loadProfileGame, saveProfileGame } from '../persistence/profileSaveManager'
import { DIFFICULTIES, GAME_MODES, type DifficultyId, type GameModeId, type ProfileMetadata, type ProfileRegistry, type ProfileSlotId } from './profileTypes'
import { PROFILE_REGISTRY_KEY, PROFILE_SLOT_IDS } from './profileKeys'

const emptyRegistry = (): ProfileRegistry => ({ version: 1, slots: { 'slot-1': null, 'slot-2': null, 'slot-3': null } })

const validTimestamp = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null

const normalizeMetadata = (value: unknown, slotId: ProfileSlotId): ProfileMetadata | null => {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<ProfileMetadata>
  const slotNumber = Number(slotId.slice(-1)) as 1 | 2 | 3
  if (candidate.slotId !== slotId || candidate.slotNumber !== slotNumber || typeof candidate.name !== 'string' || !candidate.name.trim()) return null
  if (typeof candidate.gameMode !== 'string' || typeof candidate.difficulty !== 'string') return null
  const createdAt = validTimestamp(candidate.createdAt)
  if (createdAt === null) return null
  const unsupportedReason = candidate.gameMode !== 'default'
    ? `Unsupported game mode: ${candidate.gameMode}`
    : candidate.difficulty !== 'normal' ? `Unsupported difficulty: ${candidate.difficulty}` : undefined
  return {
    slotId,
    slotNumber,
    name: candidate.name.trim().slice(0, 24),
    gameMode: candidate.gameMode as GameModeId,
    difficulty: candidate.difficulty as DifficultyId,
    createdAt,
    lastPlayedAt: validTimestamp(candidate.lastPlayedAt),
    lastSavedAt: validTimestamp(candidate.lastSavedAt),
    ...(unsupportedReason ? { unsupportedReason } : {}),
  }
}

const normalizeRegistry = (value: unknown): ProfileRegistry => {
  if (!value || typeof value !== 'object' || (value as { version?: unknown }).version !== 1) return emptyRegistry()
  const source = (value as { slots?: unknown }).slots
  const slots = {} as ProfileRegistry['slots']
  for (const slotId of PROFILE_SLOT_IDS) slots[slotId] = normalizeMetadata(source && typeof source === 'object' ? (source as Record<string, unknown>)[slotId] : null, slotId)
  return { version: 1, slots }
}

const readRegistryKey = () => {
  if (typeof localStorage === 'undefined') return { value: null as string | null, error: null as string | null }
  try { return { value: localStorage.getItem(PROFILE_REGISTRY_KEY), error: null } } catch (error) { return { value: null, error: error instanceof Error ? error.message : 'Profile registry could not be read.' } }
}

const migrateLegacySave = (): ProfileRegistry | null => {
  if (typeof localStorage === 'undefined') return null
  let raw: string | null = null
  try { raw = localStorage.getItem(LEGACY_SAVE_KEY) } catch { return null }
  if (!raw) return null
  try {
    const state = migrateSave(JSON.parse(raw))
    const now = Date.now()
    const metadata: ProfileMetadata = {
      slotId: 'slot-1', slotNumber: 1, name: 'Profile 1', gameMode: 'default', difficulty: 'normal',
      createdAt: state.lastSavedAt || now, lastPlayedAt: null, lastSavedAt: state.lastSavedAt || null,
    }
    const result = saveProfileGame('slot-1', state)
    if (!result.ok) return null
    const verification = loadProfileGame('slot-1')
    if (!verification.state) return null
    const registry = emptyRegistry()
    registry.slots['slot-1'] = metadata
    if (!saveProfileRegistry(registry)) return null
    try {
      localStorage.setItem(LEGACY_SAVE_BACKUP_KEY, raw)
      localStorage.removeItem(LEGACY_SAVE_KEY)
    } catch { /* Keep the legacy live key if recovery backup cleanup fails. */ }
    return registry
  } catch {
    return null
  }
}

export const loadProfileRegistry = (): ProfileRegistry => {
  const raw = readRegistryKey()
  if (!raw.value && !raw.error) {
    const migrated = migrateLegacySave()
    if (migrated) return migrated
  }
  if (!raw.value) return emptyRegistry()
  try {
    const registry = normalizeRegistry(JSON.parse(raw.value))
    if (Object.values(registry.slots).every((slot) => slot === null)) {
      const migrated = migrateLegacySave()
      if (migrated) return migrated
    }
    return registry
  } catch { return emptyRegistry() }
}

export const saveProfileRegistry = (registry: ProfileRegistry): boolean => {
  if (typeof localStorage === 'undefined') return false
  try { localStorage.setItem(PROFILE_REGISTRY_KEY, JSON.stringify(normalizeRegistry(registry))); return true } catch { return false }
}

export const createProfileMetadata = (slotId: ProfileSlotId, name: string, options?: { gameMode?: GameModeId; difficulty?: DifficultyId; now?: number }): ProfileMetadata => {
  const now = options?.now ?? Date.now()
  const slotNumber = Number(slotId.slice(-1)) as 1 | 2 | 3
  return { slotId, slotNumber, name: name.trim().slice(0, 24), gameMode: options?.gameMode ?? 'default', difficulty: options?.difficulty ?? 'normal', createdAt: now, lastPlayedAt: null, lastSavedAt: null }
}

export const updateProfileMetadata = (slotId: ProfileSlotId, changes: Partial<Omit<ProfileMetadata, 'slotId' | 'slotNumber'>>): { registry: ProfileRegistry; ok: boolean } => {
  const registry = loadProfileRegistry()
  const current = registry.slots[slotId]
  if (!current) return { registry, ok: false }
  registry.slots[slotId] = normalizeMetadata({ ...current, ...changes }, slotId)
  return { registry, ok: Boolean(registry.slots[slotId]) && saveProfileRegistry(registry) }
}

export const getProfileMetadata = (slotId: ProfileSlotId) => loadProfileRegistry().slots[slotId]

export const profileStorageInfo = () => ({ registryKey: PROFILE_REGISTRY_KEY, slotIds: [...PROFILE_SLOT_IDS], gameModes: Object.keys(GAME_MODES), difficulties: Object.keys(DIFFICULTIES) })

export { emptyRegistry }

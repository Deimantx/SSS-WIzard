import { createInitialState } from '../store/initialState'
import { useGameStore } from '../store/gameStore'
import { closeDeveloperTools } from '../devtools/developerToolsStore'
import { closeLayoutEditor } from '../ui/layout-editor/layoutEditorStore'
import { clearProfileGame, loadProfileGame, resetProfileGame } from '../persistence/profileSaveManager'
import { setSaveDiagnosticsProfile } from '../persistence/saveDiagnosticsStore'
import { createProfileMetadata, loadProfileRegistry, saveProfileRegistry } from './profileStorage'
import { closeCreateProfileDialog, getActiveProfileId, refreshProfiles, setActiveProfileId } from './profileSessionStore'
import type { ProfileSlotId } from './profileTypes'
import { clearProfileAttention } from '../ui/attention/attentionStore'

export interface ProfileOperationResult { ok: boolean; error: string | null }

const success = (): ProfileOperationResult => ({ ok: true, error: null })
const failure = (error: string): ProfileOperationResult => ({ ok: false, error })

export const enterProfile = (slotId: ProfileSlotId): ProfileOperationResult => {
  const metadata = loadProfileRegistry().slots[slotId]
  if (!metadata) return failure('That profile slot is empty.')
  if (metadata.unsupportedReason) return failure(metadata.unsupportedReason)
  const loaded = loadProfileGame(slotId)
  if (!loaded.state) return failure(loaded.error ?? 'This profile has no readable gameplay save.')
  const previousSavedAt = loaded.state.lastSavedAt
  useGameStore.getState().hydrateState(loaded.state)
  setActiveProfileId(slotId)
  setSaveDiagnosticsProfile(slotId)
  const now = Date.now()
  const offlineElapsed = Math.max(0, now - previousSavedAt)
  if (offlineElapsed > 1000) useGameStore.getState().resumeFromHidden(offlineElapsed, false)
  const anchored = useGameStore.getState().saveGame('profile-anchor')
  if (!anchored.ok) { setActiveProfileId(null); setSaveDiagnosticsProfile(null); refreshProfiles(); return failure(anchored.error ?? 'The profile could not be anchored.') }
  const registry = loadProfileRegistry()
  if (registry.slots[slotId]) {
    registry.slots[slotId] = { ...registry.slots[slotId]!, lastPlayedAt: now, lastSavedAt: useGameStore.getState().lastSavedAt }
    saveProfileRegistry(registry)
  }
  refreshProfiles()
  return success()
}

export const leaveToProfiles = (): ProfileOperationResult => {
  const active = getActiveProfileId()
  if (active) {
    const saved = useGameStore.getState().saveGame('profile-switch')
    if (!saved.ok) return failure(saved.error ?? 'The current profile could not be saved.')
  }
  closeDeveloperTools()
  closeLayoutEditor()
  setActiveProfileId(null)
  setSaveDiagnosticsProfile(null)
  refreshProfiles()
  useGameStore.getState().hydrateState(createInitialState())
  return success()
}

export const createProfile = (slotId: ProfileSlotId, name: string): ProfileOperationResult => {
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 24) return failure('Profile name must be 1-24 characters.')
  const registry = loadProfileRegistry()
  if (registry.slots[slotId]) return failure('That profile slot is already occupied.')
  const state = createInitialState()
  const saved = resetProfileGame(slotId, state)
  if (!saved.ok) return failure(saved.error ?? 'The new profile could not be saved.')
  clearProfileAttention(slotId)
  const metadata = createProfileMetadata(slotId, trimmed)
  registry.slots[slotId] = { ...metadata, lastSavedAt: state.lastSavedAt }
  if (!saveProfileRegistry(registry)) {
    clearProfileGame(slotId)
    return failure('The profile registry could not be updated.')
  }
  closeCreateProfileDialog()
  refreshProfiles()
  return success()
}

export const deleteProfile = (slotId: ProfileSlotId): ProfileOperationResult => {
  if (getActiveProfileId() === slotId) return failure('Leave the active profile before deleting it.')
  const registry = loadProfileRegistry()
  if (!registry.slots[slotId]) return failure('That profile slot is already empty.')
  const nextRegistry = { ...registry, slots: { ...registry.slots, [slotId]: null } }
  if (!saveProfileRegistry(nextRegistry)) return failure('The profile registry could not be updated.')
  const cleared = clearProfileGame(slotId)
  if (!cleared.ok) {
    saveProfileRegistry(registry)
    return failure(cleared.error ?? 'The profile save could not be removed.')
  }
  clearProfileAttention(slotId)
  refreshProfiles()
  return success()
}

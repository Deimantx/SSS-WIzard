import { useSyncExternalStore } from 'react'
import { loadProfileRegistry } from './profileStorage'
import type { ProfileRegistry, ProfileSlotId } from './profileTypes'

export interface ProfileSessionState {
  activeProfileId: ProfileSlotId | null
  profiles: ProfileRegistry
  createDialogSlot: ProfileSlotId | null
}

const listeners = new Set<() => void>()
let session: ProfileSessionState = { activeProfileId: null, profiles: loadProfileRegistry(), createDialogSlot: null }
const emit = () => listeners.forEach((listener) => listener())

export const getProfileSession = () => session
export const subscribeProfileSession = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }
export const useProfileSession = () => useSyncExternalStore(subscribeProfileSession, getProfileSession, getProfileSession)
export const getActiveProfileId = () => session.activeProfileId

export const setActiveProfileId = (activeProfileId: ProfileSlotId | null) => { session = { ...session, activeProfileId }; emit() }
export const refreshProfiles = () => { session = { ...session, profiles: loadProfileRegistry() }; emit() }
export const openCreateProfileDialog = (slotId: ProfileSlotId) => { session = { ...session, createDialogSlot: slotId }; emit() }
export const closeCreateProfileDialog = () => { session = { ...session, createDialogSlot: null }; emit() }

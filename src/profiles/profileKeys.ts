import type { ProfileSlotId } from './profileTypes'

export const PROFILE_REGISTRY_KEY = 'sss-wizard-profiles-v1'
export const PROFILE_SLOT_IDS: ProfileSlotId[] = ['slot-1', 'slot-2', 'slot-3']

export const profileSaveKey = (slotId: ProfileSlotId) => `sss-wizard-profile-${slotId}-save-v1`

export const isProfileSlotId = (value: unknown): value is ProfileSlotId => PROFILE_SLOT_IDS.includes(value as ProfileSlotId)

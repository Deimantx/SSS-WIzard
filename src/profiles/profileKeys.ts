import type { ProfileSlotId } from './profileTypes'

export const PROFILE_REGISTRY_KEY = 'sss-wizard-profiles-v1'
export const PROFILE_SLOT_IDS: ProfileSlotId[] = ['slot-1', 'slot-2', 'slot-3']

export const profileSaveKey = (slotId: ProfileSlotId) => `sss-wizard-profile-${slotId}-save-v1`
/** Backup 1 keeps the original key for compatibility with existing browser saves. */
export const profileSaveBackupKey = (slotId: ProfileSlotId) => `sss-wizard-profile-${slotId}-save-backup-v1`
export const profileSaveBackup2Key = (slotId: ProfileSlotId) => `sss-wizard-profile-${slotId}-save-backup-2-v1`
export const profileSaveBackup3Key = (slotId: ProfileSlotId) => `sss-wizard-profile-${slotId}-save-backup-3-v1`
export const profileSaveRecoveryKey = (slotId: ProfileSlotId) => `sss-wizard-profile-${slotId}-save-recovery-v1`
export const profileSaveSuspectKey = (slotId: ProfileSlotId) => `sss-wizard-profile-${slotId}-save-suspect-v1`

export const isProfileSlotId = (value: unknown): value is ProfileSlotId => PROFILE_SLOT_IDS.includes(value as ProfileSlotId)

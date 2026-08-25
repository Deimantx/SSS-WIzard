export const LEGACY_SAVE_KEY = 'sss-wizard-save-v1'
/** @deprecated Kept as a migration/test compatibility alias; active saves use profile slot keys. */
export const SAVE_KEY = LEGACY_SAVE_KEY
export const LEGACY_SAVE_BACKUP_KEY = 'sss-wizard-legacy-save-backup-v1'
export const CURRENT_SAVE_VERSION = 4

export class SaveMigrationError extends Error {
  constructor(message: string) { super(message); this.name = 'SaveMigrationError' }
}

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

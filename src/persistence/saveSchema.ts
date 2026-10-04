/** Old global key is intentionally not read by current Save System. */
export const LEGACY_SAVE_KEY = 'sss-wizard-save-v1'
export const CURRENT_SAVE_VERSION = 68
export const CURRENT_PERSISTED_SCHEMA_VERSION = 3

export class SaveMigrationError extends Error {
  constructor(message: string) { super(message); this.name = 'SaveMigrationError' }
}

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

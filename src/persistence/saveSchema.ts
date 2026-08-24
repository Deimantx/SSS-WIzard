export const SAVE_KEY = 'sss-wizard-save-v1'
export const CURRENT_SAVE_VERSION = 2

export class SaveMigrationError extends Error {
  constructor(message: string) { super(message); this.name = 'SaveMigrationError' }
}

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

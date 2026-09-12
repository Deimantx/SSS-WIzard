import { UI_EDITOR_SCHEMA_VERSION, type UiPreset } from './uiEditorTypes'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/** Keep development preset loading compatible with explicitly supported older snapshots. */
export function migrateUiPreset(value: unknown): unknown {
  if (!isRecord(value)) return value
  const source = { ...value }
  if (source.schemaVersion === undefined && source.version === 1) source.schemaVersion = UI_EDITOR_SCHEMA_VERSION
  if (source.schemaVersion === 0) {
    source.schemaVersion = UI_EDITOR_SCHEMA_VERSION
    if (source.uiVersion !== undefined && source.gameUiVersion === undefined) source.gameUiVersion = source.uiVersion
  }
  return source
}

export function migrateUiPresetToCurrent(value: unknown): UiPreset | null {
  const migrated = migrateUiPreset(value)
  return isRecord(migrated) && migrated.schemaVersion === UI_EDITOR_SCHEMA_VERSION ? migrated as unknown as UiPreset : null
}

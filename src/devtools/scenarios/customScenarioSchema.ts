import { createInitialState } from '../../store/initialState'
import { serializeGameStateV1 } from '../../persistence/v2/saveSerializer'
import { validateSerializedSave } from '../../persistence/saveIntegrity'
import { DEVELOPER_SCENARIO_SCHEMA_VERSION, type DeveloperScenarioRecord } from './customScenarioTypes'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const finiteTree = (value: unknown, seen = new WeakSet<object>()): boolean => {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) return false
    seen.add(value)
  }
  if (Array.isArray(value)) return value.every((item) => finiteTree(item, seen))
  if (isRecord(value)) return Object.values(value).every((item) => finiteTree(item, seen))
  return true
}

export const validateDeveloperScenario = (value: unknown): { ok: true; record: DeveloperScenarioRecord } | { ok: false; reason: string } => {
  if (!isRecord(value) || value.scenarioSchemaVersion !== DEVELOPER_SCENARIO_SCHEMA_VERSION) return { ok: false, reason: 'Unsupported Developer Scenario schema version.' }
  const allowedKeys = ['id', 'name', 'description', 'tags', 'createdAt', 'updatedAt', 'sourceAppVersion', 'scenarioSchemaVersion', 'snapshot']
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) return { ok: false, reason: 'Scenario contains unsupported identity or metadata fields.' }
  if (typeof value.id !== 'string' || !value.id || typeof value.name !== 'string' || !value.name.trim()) return { ok: false, reason: 'Scenario identity or name is missing.' }
  if (typeof value.description !== 'string' || !Array.isArray(value.tags) || !value.tags.every((tag) => typeof tag === 'string')) return { ok: false, reason: 'Scenario description or tags are invalid.' }
  if (!Number.isFinite(value.createdAt) || !Number.isFinite(value.updatedAt) || typeof value.sourceAppVersion !== 'string') return { ok: false, reason: 'Scenario source or timestamp metadata is invalid.' }
  if (!isRecord(value.snapshot) || !isRecord(value.snapshot.gameState) || !isRecord(value.snapshot.viewContext) || !isRecord(value.snapshot.summary)) return { ok: false, reason: 'Scenario snapshot is incomplete.' }
  const screens = ['home', 'combat', 'schools', 'inventory', 'equipment', 'arcane-core', 'crystals', 'collection', 'bestiary', 'tower-channeling', 'tower-acolytes', 'tower-research', 'tower-transmutation', 'tower-artificing', 'tower-summoning', 'tower-dark-portal', 'arcane-guild', 'hunters-order', 'settings']
  if (typeof value.snapshot.viewContext.screen !== 'string' || !screens.includes(value.snapshot.viewContext.screen)) return { ok: false, reason: 'Scenario view context refers to an unknown screen.' }
  const expectedKeys = Object.keys(createInitialState()).sort()
  const actualKeys = Object.keys(value.snapshot.gameState).sort()
  if (expectedKeys.join('|') !== actualKeys.join('|')) return { ok: false, reason: 'Scenario game data does not match this game version.' }
  if (!finiteTree(value.snapshot.gameState)) return { ok: false, reason: 'Scenario contains a non-finite number.' }
  if (!finiteTree(value.snapshot.summary)) return { ok: false, reason: 'Scenario summary contains invalid values.' }
  try {
    const persistedCheck = validateSerializedSave(JSON.stringify(serializeGameStateV1(value.snapshot.gameState as never)))
    if (!persistedCheck.ok) return { ok: false, reason: persistedCheck.error ?? 'Scenario contains invalid gameplay data.' }
  } catch { return { ok: false, reason: 'Scenario gameplay data could not be validated.' } }
  let byteLength = 0
  try { byteLength = new TextEncoder().encode(JSON.stringify(value)).length }
  catch { return { ok: false, reason: 'Scenario data is cyclic or could not be encoded.' } }
  if (byteLength > 10 * 1024 * 1024) return { ok: false, reason: 'Scenario exceeds the 10 MB import limit.' }
  return { ok: true, record: value as unknown as DeveloperScenarioRecord }
}

export const parseDeveloperScenarioFile = (source: string) => {
  try { return validateDeveloperScenario(JSON.parse(source) as unknown) }
  catch { return { ok: false as const, reason: 'File is not valid JSON.' } }
}

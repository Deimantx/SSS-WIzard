export const SCENARIO_READY_PRESET_KEY = 'sss-wizard-dev-scenario-ready-presets-v1'
export type DeveloperScenarioGroup = 'Foundation' | 'Combat' | 'Hunter’s Order' | 'Arcane Guild' | 'Tower Systems'
export interface ScenarioReadyPreset {
  stats: Record<string, number>
  refillHealth: boolean
  refillMana: boolean
  clearStatuses: boolean
  clearBarrier: boolean
  godMode: boolean
  infiniteMana: boolean
}
export interface ScenarioReadyPresetStoreV1 { version: 1; globalDefault: ScenarioReadyPreset; globalDefaultCustomized: boolean; groupDefaults: Partial<Record<DeveloperScenarioGroup, ScenarioReadyPreset>>; scenarioOverrides: Record<string, ScenarioReadyPreset> }
export const createDefaultScenarioReadyPreset = (): ScenarioReadyPreset => ({ stats: { 'core.maxHealthFlat': 150, 'core.maxManaFlat': 50, 'core.healthRegenFlat': 2, 'core.manaRegenFlat': 5, 'core.spellPowerPercent': 0.35 }, refillHealth: true, refillMana: true, clearStatuses: true, clearBarrier: true, godMode: false, infiniteMana: false })
const groups: readonly DeveloperScenarioGroup[] = ['Foundation', 'Combat', 'Hunter’s Order', 'Arcane Guild', 'Tower Systems']
const numberOrZero = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.min(1_000_000_000, Math.max(-1_000_000_000, value)) : 0
export const normalizeScenarioReadyPreset = (value: unknown): ScenarioReadyPreset => {
  const record = value && typeof value === 'object' ? value as Partial<ScenarioReadyPreset> : {}
  const stats: Record<string, number> = {}
  if (record.stats && typeof record.stats === 'object') for (const [key, amount] of Object.entries(record.stats)) stats[key] = numberOrZero(amount)
  return { stats, refillHealth: record.refillHealth !== false, refillMana: record.refillMana !== false, clearStatuses: record.clearStatuses !== false, clearBarrier: record.clearBarrier !== false, godMode: record.godMode === true, infiniteMana: record.infiniteMana === true }
}
export const createDefaultScenarioReadyPresetStore = (): ScenarioReadyPresetStoreV1 => ({ version: 1, globalDefault: createDefaultScenarioReadyPreset(), globalDefaultCustomized: false, groupDefaults: {}, scenarioOverrides: {} })
export const readScenarioReadyPresetStore = (storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): ScenarioReadyPresetStoreV1 => {
  if (!storage) return createDefaultScenarioReadyPresetStore()
  try {
    const raw = JSON.parse(storage.getItem(SCENARIO_READY_PRESET_KEY) ?? 'null') as Partial<ScenarioReadyPresetStoreV1> | null
    if (raw?.version !== 1) return createDefaultScenarioReadyPresetStore()
    const groupDefaults: ScenarioReadyPresetStoreV1['groupDefaults'] = {}
    if (raw.groupDefaults) for (const group of groups) if (raw.groupDefaults[group]) groupDefaults[group] = normalizeScenarioReadyPreset(raw.groupDefaults[group])
    const scenarioOverrides: Record<string, ScenarioReadyPreset> = {}
    if (raw.scenarioOverrides && typeof raw.scenarioOverrides === 'object') for (const [id, preset] of Object.entries(raw.scenarioOverrides)) scenarioOverrides[id] = normalizeScenarioReadyPreset(preset)
    return { version: 1, globalDefault: normalizeScenarioReadyPreset(raw.globalDefault), globalDefaultCustomized: raw.globalDefaultCustomized === true, groupDefaults, scenarioOverrides }
  } catch { return createDefaultScenarioReadyPresetStore() }
}
export const writeScenarioReadyPresetStore = (store: ScenarioReadyPresetStoreV1, storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage) => {
  try { storage?.setItem(SCENARIO_READY_PRESET_KEY, JSON.stringify(store)); return true } catch { return false }
}
export const resolveScenarioReadyPreset = (store: ScenarioReadyPresetStoreV1, group: DeveloperScenarioGroup, scenarioId: string, scenarioDefault?: ScenarioReadyPreset) => ({
  preset: store.scenarioOverrides[scenarioId] ?? store.groupDefaults[group] ?? (store.globalDefaultCustomized ? store.globalDefault : scenarioDefault ?? store.globalDefault),
  source: store.scenarioOverrides[scenarioId] ? 'Custom' as const : store.groupDefaults[group] ? `${group} default` as const : store.globalDefaultCustomized ? 'Global default' as const : scenarioDefault ? 'Scenario default' as const : 'Global default' as const,
})
export const setScenarioReadyPreset = (store: ScenarioReadyPresetStoreV1, target: { type: 'global' } | { type: 'group'; group: DeveloperScenarioGroup } | { type: 'scenario'; id: string }, preset: ScenarioReadyPreset): ScenarioReadyPresetStoreV1 => {
  const clean = normalizeScenarioReadyPreset(preset)
  if (target.type === 'global') return { ...store, globalDefault: clean, globalDefaultCustomized: true }
  if (target.type === 'group') return { ...store, groupDefaults: { ...store.groupDefaults, [target.group]: clean } }
  return { ...store, scenarioOverrides: { ...store.scenarioOverrides, [target.id]: clean } }
}
export const clearScenarioReadyOverride = (store: ScenarioReadyPresetStoreV1, scenarioId: string): ScenarioReadyPresetStoreV1 => {
  const scenarioOverrides = { ...store.scenarioOverrides }; delete scenarioOverrides[scenarioId]
  return { ...store, scenarioOverrides }
}

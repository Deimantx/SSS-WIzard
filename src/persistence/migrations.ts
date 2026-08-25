import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { MANA_PILLAR_IDS } from '../game/data/manaPillars'
import type { GameState, ItemId, ResearchActivity, SchoolId } from '../game/types'
import { isRecord, SaveMigrationError } from './saveSchema'

const normalizeScreen = (value: unknown, fallback: GameState['ui']['screen']): GameState['ui']['screen'] => {
  if (value === 'tower') return 'tower-channeling'
  const valid = ['home', 'combat', 'schools', 'inventory', 'equipment', 'collection', 'tower-channeling', 'tower-focus', 'tower-condensation', 'tower-research', 'tower-transmutation', 'guild', 'settings']
  return typeof value === 'string' && valid.includes(value) ? value as GameState['ui']['screen'] : fallback
}

const merge = <T extends Record<string, any>>(base: T, value: unknown): T => {
  if (!isRecord(value)) return base
  const result = { ...base } as T
  Object.keys(base).forEach((key) => {
    const incoming = value[key]
    const current = base[key]
    if (isRecord(current) && isRecord(incoming)) result[key as keyof T] = merge(current, incoming) as T[keyof T]
    else if (incoming !== undefined) result[key as keyof T] = incoming as T[keyof T]
  })
  return result
}

const safeLevel = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(10, Math.round(value))) : 0

const migrateChanneling = (rawProgress: unknown, fresh: GameState['progress']): GameState['progress']['channeling'] => {
  const source = isRecord(rawProgress) && isRecord(rawProgress.channeling) ? rawProgress.channeling : {}
  const oldPillars = isRecord(source.pillars) ? source.pillars : {}
  const oldLeyline = typeof source.leylineConduitRank === 'number' ? source.leylineConduitRank : undefined
  const oldReservoir = typeof source.manaReservoirRank === 'number' ? source.manaReservoirRank : undefined
  const pillars = { ...fresh.channeling.pillars }
  MANA_PILLAR_IDS.forEach((id) => {
    const oldPillar = isRecord(oldPillars[id]) ? oldPillars[id] : {}
    const legacyLevel = id === 'leyline-conduit' ? oldLeyline : id === 'arcane-reservoir' ? oldReservoir : undefined
    pillars[id] = { rank: 1, level: safeLevel(oldPillar.level ?? legacyLevel) }
  })
  const discoveries = { ...fresh.channeling.discoveries }
  ;(['stable-leyline', 'echo-resonance', 'deep-reservoir'] as const).forEach((id) => {
    if (isRecord(source.discoveries) && typeof source.discoveries[id] === 'boolean') discoveries[id] = source.discoveries[id] as boolean
  })
  return {
    pillars,
    totalManaGenerated: typeof source.totalManaGenerated === 'number' ? Math.max(0, source.totalManaGenerated) : fresh.channeling.totalManaGenerated,
    fiveEchoSustainMs: typeof source.fiveEchoSustainMs === 'number' ? Math.max(0, source.fiveEchoSustainMs) : fresh.channeling.fiveEchoSustainMs,
    discoveries,
  }
}

const finalize = (migrated: GameState, raw: Record<string, any>) => {
  migrated.saveVersion = SAVE_VERSION
  migrated.progress.channeling = migrateChanneling(raw.progress, createInitialState().progress)
  migrated.ui.screen = normalizeScreen(isRecord(raw.ui) ? raw.ui.screen : undefined, migrated.ui.screen)
  return migrated
}

const migrateV1 = (raw: Record<string, any>): GameState => {
  const fresh = createInitialState()
  const oldPlayer = isRecord(raw.player) ? raw.player : {}
  const oldActivities = isRecord(raw.activities) ? raw.activities : {}
  const oldResearch = isRecord(oldActivities.research) ? oldActivities.research : {}
  const oldEquipment = isRecord(raw.equipment) ? raw.equipment : {}
  const oldProgress = isRecord(raw.progress) ? raw.progress : {}
  const oldItem = typeof oldResearch.itemId === 'string' ? oldResearch.itemId as ItemId : null
  const oldWeapon = typeof oldEquipment.weapon === 'string' ? oldEquipment.weapon as ItemId : null
  const oldFocus = typeof oldEquipment.focus === 'string' ? oldEquipment.focus as ItemId : null
  const oldMaxHealth = typeof oldPlayer.maxHealth === 'number' ? oldPlayer.maxHealth : fresh.player.baseMaxHealth
  const oldMaxMana = typeof oldPlayer.maxMana === 'number' ? oldPlayer.maxMana : fresh.player.baseMaxMana
  const oldMaxFocus = typeof oldPlayer.maxFocus === 'number' ? oldPlayer.maxFocus : fresh.player.baseMaxFocus
  const target = oldItem?.split('-')[0] as SchoolId | undefined
  const research: ResearchActivity = { ...fresh.activities.research, running: Boolean(oldResearch.running), itemId: oldItem, targetSchoolId: target && ['fire', 'water', 'earth', 'air'].includes(target) ? target : null, requestedQuantity: oldItem ? 1 : 0, remainingQuantity: oldItem ? 1 : 0, progressMs: typeof oldResearch.progressMs === 'number' ? oldResearch.progressMs : 0, status: oldResearch.running ? 'running' : 'idle' }
  const migrated: GameState = {
    ...fresh,
    player: { ...fresh.player, ...oldPlayer, baseMaxHealth: typeof oldPlayer.baseMaxHealth === 'number' ? oldPlayer.baseMaxHealth : oldMaxHealth, baseMaxMana: typeof oldPlayer.baseMaxMana === 'number' ? oldPlayer.baseMaxMana : oldMaxMana, baseMaxFocus: typeof oldPlayer.baseMaxFocus === 'number' ? oldPlayer.baseMaxFocus : oldMaxFocus },
    inventory: { ...fresh.inventory, ...(isRecord(raw.inventory) ? raw.inventory : {}) },
    protectedItems: { ...fresh.protectedItems, ...(oldWeapon ? { [oldWeapon]: true } : {}) },
    equipment: { ...fresh.equipment, weapon: oldWeapon ?? fresh.equipment.weapon, focus: oldFocus ?? null },
    activities: { ...fresh.activities, channeling: { echoesAssigned: oldActivities.autoChannel === true ? 1 : 0 }, research, autoCast: { ...fresh.activities.autoCast, ...(isRecord(oldActivities.autoCast) ? oldActivities.autoCast : {}) } },
    progress: { ...fresh.progress, ...(oldProgress as Partial<GameState['progress']>) },
    combat: { ...fresh.combat, ...(isRecord(raw.combat) ? raw.combat : {}) },
    ui: { screen: fresh.ui.screen },
    offlineBankMs: typeof raw.offlineBankMs === 'number' ? raw.offlineBankMs : 0,
  }
  return finalize(migrated, raw)
}

const migrateV2 = (raw: Record<string, any>): GameState => {
  const fresh = createInitialState()
  const migrated = merge(fresh, raw)
  const oldActivities = isRecord(raw.activities) ? raw.activities : {}
  migrated.activities = {
    ...fresh.activities,
    condense: isRecord(oldActivities.condense) ? { ...fresh.activities.condense, ...oldActivities.condense } : fresh.activities.condense,
    research: isRecord(oldActivities.research) ? { ...fresh.activities.research, ...oldActivities.research } as ResearchActivity : fresh.activities.research,
    transmutation: isRecord(oldActivities.transmutation) ? { ...fresh.activities.transmutation, ...oldActivities.transmutation } : fresh.activities.transmutation,
    channeling: { echoesAssigned: oldActivities.autoChannel === true ? 1 : 0 },
    autoCast: { ...fresh.activities.autoCast, ...(isRecord(oldActivities.autoCast) ? oldActivities.autoCast : {}) },
  }
  return finalize(migrated, raw)
}

const migrateV3 = (raw: Record<string, any>): GameState => finalize(merge(createInitialState(), raw), raw)

export const migrateSave = (rawSave: unknown): GameState => {
  if (!isRecord(rawSave)) throw new SaveMigrationError('Save data is not a valid object.')
  const version = rawSave.saveVersion
  if (version === 1) return migrateV1(rawSave)
  if (version === 2) return migrateV2(rawSave)
  if (version === 3) return migrateV3(rawSave)
  if (version === SAVE_VERSION) {
    const migrated = merge(createInitialState(), rawSave)
    migrated.ui.screen = normalizeScreen(isRecord(rawSave.ui) ? rawSave.ui.screen : undefined, migrated.ui.screen)
    return migrated
  }
  throw new SaveMigrationError(`Unsupported save version: ${String(version ?? 'missing')}.`)
}

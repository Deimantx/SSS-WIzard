import { isRecord } from '../saveSchema'

/** Renames the schema-2 combat-location fields before current schema validation. */
export const migrateSchema2LocationFields = (value: Record<string, unknown>): Record<string, unknown> => {
  if (value.schemaVersion !== 2) return value
  const combat = isRecord(value.combat) ? { ...value.combat } : null
  const progress = isRecord(value.progress) ? { ...value.progress } : null
  const ui = isRecord(value.ui) ? { ...value.ui } : null
  if (combat) {
    if (!Object.prototype.hasOwnProperty.call(combat, 'locationId') && Object.prototype.hasOwnProperty.call(combat, 'dungeonId')) combat.locationId = combat.dungeonId
    if (!Object.prototype.hasOwnProperty.call(combat, 'sequenceIndex') && Object.prototype.hasOwnProperty.call(combat, 'dungeonSequenceIndex')) combat.sequenceIndex = combat.dungeonSequenceIndex
    delete combat.dungeonId
    delete combat.dungeonSequenceIndex
  }
  if (progress) {
    if (!Object.prototype.hasOwnProperty.call(progress, 'autoHuntBossByLocation') && Object.prototype.hasOwnProperty.call(progress, 'autoHuntBossByDungeon')) progress.autoHuntBossByLocation = progress.autoHuntBossByDungeon
    delete progress.autoHuntBossByDungeon
    const hunters = isRecord(progress.huntersOrder) ? { ...progress.huntersOrder } : null
    if (hunters) {
      const remapContract = (candidate: unknown) => {
        if (!isRecord(candidate)) return candidate
        const contract = { ...candidate }
        if (isRecord(contract.targetSpec) && contract.targetSpec.type === 'region' && !Object.prototype.hasOwnProperty.call(contract.targetSpec, 'locationId')) {
          contract.targetSpec = { ...contract.targetSpec, locationId: contract.targetSpec.dungeonId }
          delete (contract.targetSpec as Record<string, unknown>).dungeonId
        }
        return contract
      }
      hunters.activeContract = remapContract(hunters.activeContract)
      if (Array.isArray(hunters.availableContracts)) hunters.availableContracts = hunters.availableContracts.map(remapContract)
      progress.huntersOrder = hunters
    }
  }
  const lastEnteredCombatLocationId = ui?.lastEnteredCombatLocationId ?? ui?.lastEnteredCombatDungeonId
  const persistedUi = lastEnteredCombatLocationId === undefined ? undefined : { lastEnteredCombatLocationId }
  return { ...value, schemaVersion: 3, ...(combat ? { combat } : {}), ...(progress ? { progress } : {}), ...(persistedUi ? { ui: persistedUi } : {}) }
}

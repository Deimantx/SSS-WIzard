import { getFocusCapacityBreakdown } from '../focus/focusCapacity'
import { selectUsedFocus } from '../focus/focusReservations'
import { grantItem } from '../inventory/itemAcquisition'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { CRYSTAL_CACHE_DUST, CRYSTAL_CACHE_ITEM_ID, CRYSTAL_CACHE_POWER_THRESHOLD, CRYSTAL_CACHE_DROP_CHANCE, CRYSTAL_CRUSH_DUST, CRYSTAL_FAMILY_ORDER, CRYSTAL_GROUP_CAP, CRYSTAL_SLOT_COUNT, CRYSTAL_STARTING_UNLOCKED_SLOTS, CRYSTAL_UPGRADE_COSTS, CRYSTAL_VARIANT_IDS, getCrystalFamily, getCrystalTier, getNextCrystalVariant } from '../../content/crystals/crystals'
import type { CrystalPreset, CrystalPresetId, CrystalState, CrystalTier, CrystalVariantId, GameState, ItemId } from '../../types'

export const CRYSTAL_RNG_DEFAULT_SEED = 0xC12A5EED
const PRESET_IDS: readonly CrystalPresetId[] = ['crystal-preset-1', 'crystal-preset-2', 'crystal-preset-3']

const finiteInteger = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback
const validVariant = (value: unknown): value is CrystalVariantId => typeof value === 'string' && (CRYSTAL_VARIANT_IDS as readonly string[]).includes(value)
const defaultPreset = (id: CrystalPresetId, index: number): CrystalPreset => ({ id, name: `Preset ${index + 1}`, slots: Array.from({ length: CRYSTAL_SLOT_COUNT }, () => null) })

export const createInitialCrystalState = (): CrystalState => ({
  dust: 0,
  owned: {},
  equippedSlots: Array.from({ length: CRYSTAL_SLOT_COUNT }, () => null),
  unlockedSlots: CRYSTAL_STARTING_UNLOCKED_SLOTS,
  presets: PRESET_IDS.map((id, index) => defaultPreset(id, index)),
  selectedPresetId: 'crystal-preset-1',
  rngState: CRYSTAL_RNG_DEFAULT_SEED,
})

/** Defensive save boundary for Crystal data. It never invents ownership. */
export const normalizeCrystalState = (raw: unknown): CrystalState => {
  const fresh = createInitialCrystalState()
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const owned: Partial<Record<CrystalVariantId, number>> = {}
  const rawOwned = source.owned && typeof source.owned === 'object' ? source.owned as Record<string, unknown> : {}
  CRYSTAL_VARIANT_IDS.forEach((variantId) => {
    const quantity = finiteInteger(rawOwned[variantId])
    if (quantity > 0) owned[variantId] = quantity
  })
  const unlockedSlots = Math.min(CRYSTAL_SLOT_COUNT, Math.max(CRYSTAL_STARTING_UNLOCKED_SLOTS, finiteInteger(source.unlockedSlots, fresh.unlockedSlots)))
  const equippedSlots: Array<CrystalVariantId | null> = Array.from({ length: CRYSTAL_SLOT_COUNT }, () => null)
  const equippedByVariant: Partial<Record<CrystalVariantId, number>> = {}
  const equippedByGroup: Partial<Record<ReturnType<typeof getCrystalFamily>['group'], number>> = {}
  const rawSlots = Array.isArray(source.equippedSlots) ? source.equippedSlots : []
  rawSlots.slice(0, CRYSTAL_SLOT_COUNT).forEach((value, index) => {
    if (index >= unlockedSlots || !validVariant(value)) return
    const nextVariantCount = (equippedByVariant[value] ?? 0) + 1
    const group = getCrystalFamily(value).group
    const nextGroupCount = (equippedByGroup[group] ?? 0) + 1
    if (nextVariantCount > (owned[value] ?? 0) || nextGroupCount > CRYSTAL_GROUP_CAP) return
    equippedSlots[index] = value
    equippedByVariant[value] = nextVariantCount
    equippedByGroup[group] = nextGroupCount
  })
  const rawPresets = Array.isArray(source.presets) ? source.presets : []
  const presets = PRESET_IDS.map((id, index) => {
    const rawPreset = rawPresets.find((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object' && (entry as Record<string, unknown>).id === id))
    const name = typeof rawPreset?.name === 'string' && rawPreset.name.trim() ? rawPreset.name.trim().slice(0, 32) : fresh.presets[index].name
    const slots = Array.from({ length: CRYSTAL_SLOT_COUNT }, (_, slotIndex) => {
      const value = Array.isArray(rawPreset?.slots) ? rawPreset.slots[slotIndex] : null
      return slotIndex < unlockedSlots && validVariant(value) ? value : null
    })
    return { id, name, slots }
  })
  const selectedPresetId = PRESET_IDS.includes(source.selectedPresetId as CrystalPresetId) ? source.selectedPresetId as CrystalPresetId : fresh.selectedPresetId
  const rawRng = typeof source.rngState === 'number' && Number.isFinite(source.rngState) ? source.rngState >>> 0 : fresh.rngState
  return { dust: finiteInteger(source.dust), owned, equippedSlots, unlockedSlots, presets, selectedPresetId, rngState: rawRng || CRYSTAL_RNG_DEFAULT_SEED }
}

export const isCrystalSystemUnlocked = (state: Pick<GameState, 'progress'>) => (state.progress.bossKillsByBoss['meridian-splitter'] ?? 0) >= 1
export const getCrystalOwnedCount = (state: Pick<GameState, 'crystals'>, variantId: CrystalVariantId) => Math.max(0, state.crystals.owned[variantId] ?? 0)
export const getCrystalEquippedCount = (state: Pick<GameState, 'crystals'>, variantId: CrystalVariantId) => state.crystals.equippedSlots.filter((value) => value === variantId).length
export const getCrystalAvailableCount = (state: Pick<GameState, 'crystals'>, variantId: CrystalVariantId) => Math.max(0, getCrystalOwnedCount(state, variantId) - getCrystalEquippedCount(state, variantId))
export const getCrystalGroupUsage = (state: Pick<GameState, 'crystals'>, group: ReturnType<typeof getCrystalFamily>['group']) => state.crystals.equippedSlots.reduce((count, variantId) => count + (variantId && getCrystalFamily(variantId).group === group ? 1 : 0), 0)
export const hasUnsavedCrystalChanges = (state: Pick<GameState, 'crystals'>) => {
  const selected = state.crystals.presets.find((preset) => preset.id === state.crystals.selectedPresetId)
  return Boolean(selected && selected.slots.some((value, index) => value !== state.crystals.equippedSlots[index]))
}

const candidateFocusIsLegal = (state: GameState, slots: Array<CrystalVariantId | null>) => {
  const candidate = { ...state, crystals: { ...state.crystals, equippedSlots: slots } }
  return selectUsedFocus(candidate) <= getFocusCapacityBreakdown(candidate).total
}

const candidateSlotsAreValid = (state: GameState, slots: Array<CrystalVariantId | null>) => {
  const usedByVariant: Partial<Record<CrystalVariantId, number>> = {}
  const usedByGroup: Partial<Record<ReturnType<typeof getCrystalFamily>['group'], number>> = {}
  for (let index = 0; index < CRYSTAL_SLOT_COUNT; index += 1) {
    const variantId = slots[index] ?? null
    if (!variantId) continue
    if (index >= state.crystals.unlockedSlots || !validVariant(variantId)) return false
    usedByVariant[variantId] = (usedByVariant[variantId] ?? 0) + 1
    const group = getCrystalFamily(variantId).group
    usedByGroup[group] = (usedByGroup[group] ?? 0) + 1
    if ((usedByVariant[variantId] ?? 0) > getCrystalOwnedCount(state, variantId) || (usedByGroup[group] ?? 0) > CRYSTAL_GROUP_CAP) return false
  }
  return true
}

const applySlots = (state: GameState, slots: Array<CrystalVariantId | null>): { ok: boolean; reason?: string } => {
  if (!candidateSlotsAreValid(state, slots)) return { ok: false, reason: 'Crystal ownership or group limit would be exceeded.' }
  if (!candidateFocusIsLegal(state, slots)) return { ok: false, reason: 'Not enough Focus capacity for the current reservations.' }
  state.crystals.equippedSlots = slots
  return { ok: true }
}

export const equipCrystal = (state: GameState, variantId: CrystalVariantId, requestedSlot?: number) => {
  if (state.combat.active) return { ok: false, reason: 'Crystal loadouts cannot change during active combat.' }
  if (!validVariant(variantId) || getCrystalAvailableCount(state, variantId) < 1) return { ok: false, reason: 'No available copy of this Crystal.' }
  const slot = requestedSlot ?? state.crystals.equippedSlots.findIndex((value, index) => index < state.crystals.unlockedSlots && value === null)
  if (slot < 0) return { ok: false, reason: 'No empty unlocked Crystal Slot.' }
  if (slot >= state.crystals.unlockedSlots || slot >= CRYSTAL_SLOT_COUNT) return { ok: false, reason: 'Crystal Slot Locked.' }
  const slots = [...state.crystals.equippedSlots]
  slots[slot] = variantId
  return applySlots(state, slots)
}

export const unequipCrystal = (state: GameState, slot: number) => {
  if (state.combat.active) return { ok: false, reason: 'Crystal loadouts cannot change during active combat.' }
  if (!Number.isInteger(slot) || slot < 0 || slot >= CRYSTAL_SLOT_COUNT || !state.crystals.equippedSlots[slot]) return { ok: false, reason: 'No Crystal is equipped in that slot.' }
  const slots = [...state.crystals.equippedSlots]
  slots[slot] = null
  return applySlots(state, slots)
}

export const saveCrystalPreset = (state: GameState, presetId: CrystalPresetId) => {
  const preset = state.crystals.presets.find((entry) => entry.id === presetId)
  if (!preset) return false
  preset.slots = [...state.crystals.equippedSlots]
  state.crystals.selectedPresetId = presetId
  return true
}

export const renameCrystalPreset = (state: GameState, presetId: CrystalPresetId, name: string) => {
  const preset = state.crystals.presets.find((entry) => entry.id === presetId)
  const trimmed = name.trim().slice(0, 32)
  if (!preset || !trimmed) return false
  preset.name = trimmed
  return true
}

export const loadCrystalPreset = (state: GameState, presetId: CrystalPresetId) => {
  if (state.combat.active) return { ok: false, reason: 'Crystal presets cannot load during active combat.' }
  const preset = state.crystals.presets.find((entry) => entry.id === presetId)
  if (!preset) return { ok: false, reason: 'Crystal preset not found.' }
  const slots = [...preset.slots]
  if (!candidateSlotsAreValid(state, slots)) return { ok: false, reason: 'Preset cannot load: missing Crystal copies or a group cap is exceeded.' }
  if (!candidateFocusIsLegal(state, slots)) return { ok: false, reason: 'Preset cannot load: not enough Focus capacity for current reservations.' }
  state.crystals.equippedSlots = slots
  state.crystals.selectedPresetId = presetId
  return { ok: true }
}

export const upgradeCrystal = (state: GameState, variantId: CrystalVariantId, equippedSlot?: number) => {
  const nextVariant = getNextCrystalVariant(variantId)
  if (!nextVariant) return { ok: false, reason: 'This Crystal is already at max tier.' }
  if (equippedSlot !== undefined && state.combat.active) return { ok: false, reason: 'Equipped Crystal upgrades are disabled during active combat.' }
  if (getCrystalAvailableCount(state, variantId) < 1 && equippedSlot === undefined) return { ok: false, reason: 'No unequipped copy is available to upgrade.' }
  if (equippedSlot !== undefined && state.crystals.equippedSlots[equippedSlot] !== variantId) return { ok: false, reason: 'That Crystal is no longer in the selected slot.' }
  const tier = getCrystalTier(variantId)
  const cost = CRYSTAL_UPGRADE_COSTS[tier]
  if (state.crystals.dust < cost.dust) return { ok: false, reason: `Requires ${cost.dust.toLocaleString()} Crystal Dust.` }
  for (const [itemId, quantity] of Object.entries(cost.materials) as [ItemId, number][]) {
    if (getConsumableQuantity(state, itemId) < quantity) return { ok: false, reason: `Requires ${quantity} available ${itemId}.` }
  }
  state.crystals.dust -= cost.dust
  Object.entries(cost.materials).forEach(([itemId, quantity]) => { state.inventory[itemId as ItemId] = Math.max(0, (state.inventory[itemId as ItemId] ?? 0) - quantity) })
  state.crystals.owned[variantId] = Math.max(0, (state.crystals.owned[variantId] ?? 0) - 1)
  state.crystals.owned[nextVariant] = (state.crystals.owned[nextVariant] ?? 0) + 1
  if (equippedSlot !== undefined) state.crystals.equippedSlots[equippedSlot] = nextVariant
  return { ok: true, nextVariant }
}

export const crushCrystals = (state: GameState, variantId: CrystalVariantId, quantity: number) => {
  const amount = Math.min(getCrystalAvailableCount(state, variantId), Math.max(0, Math.floor(quantity)))
  if (amount < 1) return { ok: false, quantity: 0, dust: 0, reason: 'No unequipped copies are available to Crush.' }
  const dust = amount * CRYSTAL_CRUSH_DUST[getCrystalTier(variantId)]
  state.crystals.owned[variantId] = Math.max(0, (state.crystals.owned[variantId] ?? 0) - amount)
  state.crystals.dust += dust
  return { ok: true, quantity: amount, dust }
}

/** Debug-only ownership removal that never touches equipped copies. */
export const removeAvailableCrystals = (state: GameState, variantId: CrystalVariantId, quantity: number) => {
  const amount = Math.min(getCrystalAvailableCount(state, variantId), Math.max(0, Math.floor(quantity)))
  if (amount < 1) return 0
  state.crystals.owned[variantId] = Math.max(0, (state.crystals.owned[variantId] ?? 0) - amount)
  return amount
}

export const bulkCrushCrystals = (state: GameState, requests: Partial<Record<CrystalVariantId, number>>) => {
  const entries = Object.entries(requests).filter(([variantId, quantity]) => validVariant(variantId) && Number.isFinite(quantity) && (quantity as number) > 0).map(([variantId, quantity]) => [variantId as CrystalVariantId, Math.floor(quantity as number)] as const)
  const resolved = entries.map(([variantId, quantity]) => [variantId, Math.min(quantity, getCrystalAvailableCount(state, variantId))] as const).filter(([, quantity]) => quantity > 0)
  if (!resolved.length) return { ok: false, quantity: 0, dust: 0, reason: 'No unequipped copies are available to Crush.' }
  const dust = resolved.reduce((total, [variantId, quantity]) => total + quantity * CRYSTAL_CRUSH_DUST[getCrystalTier(variantId)], 0)
  resolved.forEach(([variantId, quantity]) => { state.crystals.owned[variantId] = Math.max(0, (state.crystals.owned[variantId] ?? 0) - quantity) })
  state.crystals.dust += dust
  return { ok: true, quantity: resolved.reduce((total, [, quantity]) => total + quantity, 0), dust }
}

const nextCrystalRandom = (state: GameState) => {
  let value = state.crystals.rngState >>> 0
  value = (Math.imul(value ^ (value >>> 16), 2246822507) + 3266489909) >>> 0
  state.crystals.rngState = value || CRYSTAL_RNG_DEFAULT_SEED
  return state.crystals.rngState / 0x1_0000_0000
}

export interface CrystalCacheOpenResult {
  ok: boolean
  opened: number
  dust: number
  crystals: Partial<Record<CrystalVariantId, number>>
  reason?: string
}

export const isCrystalCacheEligiblePower = (power: number) => Number.isFinite(power) && power >= CRYSTAL_CACHE_POWER_THRESHOLD

export const openCrystalCaches = (state: GameState, requestedQuantity: number, rng: () => number = () => nextCrystalRandom(state)): CrystalCacheOpenResult => {
  const quantity = Math.min(Math.max(0, Math.floor(requestedQuantity)), state.inventory[CRYSTAL_CACHE_ITEM_ID] ?? 0)
  if (!isCrystalSystemUnlocked(state)) return { ok: false, opened: 0, dust: 0, crystals: {}, reason: 'Crystal System is not unlocked.' }
  if (quantity < 1) return { ok: false, opened: 0, dust: 0, crystals: {}, reason: 'No Crystal Caches are available.' }
  state.inventory[CRYSTAL_CACHE_ITEM_ID] = Math.max(0, (state.inventory[CRYSTAL_CACHE_ITEM_ID] ?? 0) - quantity)
  let dust = 0
  const crystals: Partial<Record<CrystalVariantId, number>> = {}
  for (let index = 0; index < quantity; index += 1) {
    if (rng() < 0.8) dust += CRYSTAL_CACHE_DUST
    else {
      const familyId = CRYSTAL_FAMILY_ORDER[Math.floor(rng() * CRYSTAL_FAMILY_ORDER.length)]
      const variantId = `${familyId}-t1` as CrystalVariantId
      crystals[variantId] = (crystals[variantId] ?? 0) + 1
      state.crystals.owned[variantId] = (state.crystals.owned[variantId] ?? 0) + 1
    }
  }
  state.crystals.dust += dust
  return { ok: true, opened: quantity, dust, crystals }
}

export const resolveCrystalCacheDrop = (state: GameState, enemyId: import('../../types').MonsterId, enemyWorldTier: import('../../types').WorldTierId, rng: () => number) => {
  if (!isCrystalSystemUnlocked(state)) return false
  if (!isCrystalCacheEligiblePower(resolveEnemyPowerRating(enemyId, enemyWorldTier))) return false
  if (rng() >= CRYSTAL_CACHE_DROP_CHANCE) return false
  grantItem(state, CRYSTAL_CACHE_ITEM_ID, 1)
  return true
}

import type { ItemId } from '../game/types'

/** The only resources granted by the one-click Quick Setup testing action. */
export const QUICK_TESTING_RESOURCE_TARGETS = {
  'fire-fragment': 10_000,
  'water-fragment': 10_000,
  'earth-fragment': 10_000,
  'air-fragment': 10_000,
  'prismatic-fragment': 10_000,
  'artifact-essence': 10_000,
  'life-essence': 10_000,
} as const satisfies Partial<Record<ItemId, number>>

export type QuickTestingResourceId = keyof typeof QUICK_TESTING_RESOURCE_TARGETS

export function getQuickTestingResourceGrants(inventory: Partial<Record<ItemId, number>>): Array<readonly [QuickTestingResourceId, number]> {
  return (Object.entries(QUICK_TESTING_RESOURCE_TARGETS) as Array<[QuickTestingResourceId, number]>).flatMap(([itemId, target]) => {
    const owned = Number.isFinite(inventory[itemId]) ? Math.max(0, Math.floor(inventory[itemId] ?? 0)) : 0
    const missing = Math.max(0, target - owned)
    return missing > 0 ? [[itemId, missing] as const] : []
  })
}

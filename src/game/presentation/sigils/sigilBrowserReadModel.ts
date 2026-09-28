import { SIGIL_QUALITIES } from '../../content/sigils/sigilQualities'
import { SIGIL_STAT_DEFINITIONS } from '../../content/sigils/sigilStats'
import { SIGIL_SETS } from '../../content/sigils/sigilSets'
import { SIGIL_TRAITS } from '../../content/sigils/sigilTraits'
import type { SigilInstance, SigilQuality, SigilSetId, SigilSlot, SigilStatId, SigilTier } from '../../types'
import { getSigilSearchText } from './sigilEquipmentReadModel'

export type SigilStateFilter = 'all' | 'equipped' | 'stored' | 'locked' | 'unlocked'
export type SigilSortMode = 'quality' | 'tier' | 'rank' | 'newest'
export interface SigilBrowserFilters { search: string; quality: SigilQuality | 'all'; set: SigilSetId | 'all'; tier: SigilTier | 'all'; slot: SigilSlot | 'all'; mainStat: SigilStatId | 'all'; state: SigilStateFilter; sort: SigilSortMode }
export const DEFAULT_SIGIL_BROWSER_FILTERS: SigilBrowserFilters = { search: '', quality: 'all', set: 'all', tier: 'all', slot: 'all', mainStat: 'all', state: 'all', sort: 'quality' }
const qualityRank = (quality: SigilQuality) => SIGIL_QUALITIES.findIndex(({ id }) => id === quality)
const sequence = (sigil: SigilInstance) => Number(/sigil:(\d+)/.exec(sigil.instanceId)?.[1] ?? 0)

export function getVisibleSigils(storage: Record<string, SigilInstance>, equipped: Record<SigilSlot, string | null>, filters: SigilBrowserFilters, slotConstraint: SigilSlot | null = null, revealInstanceId: string | null = null) {
  const equippedIds = new Set(Object.values(equipped).filter((id): id is string => Boolean(id)))
  const search = filters.search.trim().toLocaleLowerCase()
  const slot = slotConstraint ?? filters.slot
  return Object.values(storage).filter((sigil) => {
    if (sigil.instanceId === revealInstanceId) return true
    if (search && !getSigilSearchText(sigil).includes(search)) return false
    if (filters.quality !== 'all' && sigil.quality !== filters.quality) return false
    if (filters.set !== 'all' && sigil.setId !== filters.set) return false
    if (filters.tier !== 'all' && sigil.tier !== filters.tier) return false
    if (slot !== 'all' && slot !== null && sigil.slot !== slot) return false
    if (filters.mainStat !== 'all' && sigil.mainStatId !== filters.mainStat) return false
    if (filters.state === 'equipped' && !equippedIds.has(sigil.instanceId)) return false
    if (filters.state === 'stored' && equippedIds.has(sigil.instanceId)) return false
    if (filters.state === 'locked' && !sigil.locked) return false
    if (filters.state === 'unlocked' && sigil.locked) return false
    return true
  }).sort((left, right) => {
    if (left.instanceId === revealInstanceId) return -1
    if (right.instanceId === revealInstanceId) return 1
    if (filters.sort === 'tier') return right.tier - left.tier || right.rank - left.rank
    if (filters.sort === 'rank') return right.rank - left.rank || right.tier - left.tier
    if (filters.sort === 'newest') return sequence(right) - sequence(left)
    return qualityRank(right.quality) - qualityRank(left.quality) || right.tier - left.tier || right.rank - left.rank
  })
}

export const getSigilBrowserFilterLabels = () => ({
  qualities: SIGIL_QUALITIES.map(({ id, label }) => ({ value: id, label })),
  sets: Object.entries(SIGIL_SETS).map(([value, set]) => ({ value: value as SigilSetId, label: set.name })),
  stats: Object.entries(SIGIL_STAT_DEFINITIONS).map(([value, stat]) => ({ value: value as SigilStatId, label: stat.label })),
  traits: Object.values(SIGIL_TRAITS).map(({ name }) => name),
})

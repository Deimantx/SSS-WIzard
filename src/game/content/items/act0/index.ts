import { mergeItemRegistries } from '../shared/itemAuthoring'
import { ABANDONED_CATACOMBS_ITEMS } from './abandonedCatacombs'
import { ACT0_ARTIFACTS } from './artifacts'
import { HOWLING_DEN_ITEMS } from './howlingDen'
import { WHISPERING_WOODS_ITEMS } from './whisperingWoods'

/** ACT 0 — all authored item ownership, merged with duplicate-ID protection. */
export const ACT0_ITEMS = mergeItemRegistries(
  ACT0_ARTIFACTS,
  WHISPERING_WOODS_ITEMS,
  HOWLING_DEN_ITEMS,
  ABANDONED_CATACOMBS_ITEMS,
)

export { ACT0_ARTIFACTS, WHISPERING_WOODS_ITEMS, HOWLING_DEN_ITEMS, ABANDONED_CATACOMBS_ITEMS }

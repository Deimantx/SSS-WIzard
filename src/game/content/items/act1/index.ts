import { mergeItemRegistries } from '../shared/itemAuthoring'
import { ACT1_ARTIFACTS } from './artifacts'

/** ACT 1 — all authored item ownership, merged with duplicate-ID protection. */
export const ACT1_ITEMS = mergeItemRegistries(
  ACT1_ARTIFACTS,
)

export {
  ACT1_ARTIFACTS,
}

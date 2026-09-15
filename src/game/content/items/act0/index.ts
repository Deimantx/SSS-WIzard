import { mergeItemRegistries } from '../shared/itemAuthoring'
import { ACT0_MATERIALS } from './materials'
import { ACT0_ARTIFACTS } from './artifacts'

/** ACT 0 — all authored item ownership, merged with duplicate-ID protection. */
export const ACT0_ITEMS = mergeItemRegistries(
  ACT0_ARTIFACTS,
  ACT0_MATERIALS,
)

export { ACT0_ARTIFACTS, ACT0_MATERIALS }

import { mergeItemRegistries } from '../shared/itemAuthoring'
import { ASHEN_WATCH_ITEMS } from './ashenWatch'
import { ACT1_ARTIFACTS } from './artifacts'
import { BLACK_GATE_ITEMS } from './blackGate'
import { BROKEN_MERIDIAN_ITEMS } from './brokenMeridian'
import { CROSSROADS_OF_RUIN_ITEMS } from './crossroadsOfRuin'
import { FLOODED_RELIQUARY_ITEMS } from './floodedReliquary'
import { FRACTURED_APPROACH_ITEMS } from './fracturedApproach'
import { GRAVEGLASS_HOLLOW_ITEMS } from './graveglassHollow'
import { HALL_OF_UNBOUND_NAMES_ITEMS } from './hallOfUnboundNames'
import { ROOTSCAR_HOLLOW_ITEMS } from './rootscarHollow'
import { STARFALLEN_OBSERVATORY_ITEMS } from './starfallenObservatory'
import { STORMVAULT_GALLERY_ITEMS } from './stormvaultGallery'
import { VAULT_OF_THE_BLACK_SIGIL_ITEMS } from './vaultOfTheBlackSigil'

/** ACT 1 — all authored item ownership, merged with duplicate-ID protection. */
export const ACT1_ITEMS = mergeItemRegistries(
  ACT1_ARTIFACTS,
  FRACTURED_APPROACH_ITEMS,
  FLOODED_RELIQUARY_ITEMS,
  ASHEN_WATCH_ITEMS,
  ROOTSCAR_HOLLOW_ITEMS,
  CROSSROADS_OF_RUIN_ITEMS,
  GRAVEGLASS_HOLLOW_ITEMS,
  STORMVAULT_GALLERY_ITEMS,
  STARFALLEN_OBSERVATORY_ITEMS,
  BROKEN_MERIDIAN_ITEMS,
  HALL_OF_UNBOUND_NAMES_ITEMS,
  VAULT_OF_THE_BLACK_SIGIL_ITEMS,
  BLACK_GATE_ITEMS,
)

export {
  ACT1_ARTIFACTS,
  FRACTURED_APPROACH_ITEMS,
  FLOODED_RELIQUARY_ITEMS,
  ASHEN_WATCH_ITEMS,
  ROOTSCAR_HOLLOW_ITEMS,
  CROSSROADS_OF_RUIN_ITEMS,
  GRAVEGLASS_HOLLOW_ITEMS,
  STORMVAULT_GALLERY_ITEMS,
  STARFALLEN_OBSERVATORY_ITEMS,
  BROKEN_MERIDIAN_ITEMS,
  HALL_OF_UNBOUND_NAMES_ITEMS,
  VAULT_OF_THE_BLACK_SIGIL_ITEMS,
  BLACK_GATE_ITEMS,
}

import { FLOODED_RELIQUARY_MONSTERS } from './combat-zones/floodedReliquary'
import { ASHEN_WATCH_MONSTERS } from './combat-zones/ashenWatch'
import { ROOTSCAR_HOLLOW_MONSTERS } from './combat-zones/rootscarHollow'
import { STORMVAULT_GALLERY_MONSTERS } from './combat-zones/stormvaultGallery'
import { GRAVEGLASS_HOLLOW_MONSTERS } from './elite-zones/graveglassHollow'
import { STARFALLEN_OBSERVATORY_MONSTERS } from './elite-zones/starfallenObservatory'
import { HALL_OF_UNBOUND_NAMES_MONSTERS } from './elite-zones/hallOfUnboundNames'
import { VAULT_OF_THE_BLACK_SIGIL_MONSTERS } from './elite-zones/vaultOfTheBlackSigil'
import { FRACTURED_APPROACH_MONSTERS } from './dungeons/fracturedApproach'
import { CROSSROADS_OF_RUIN_MONSTERS } from './dungeons/crossroadsOfRuin'
import { BROKEN_MERIDIAN_MONSTERS } from './dungeons/brokenMeridian'
import { BLACK_GATE_MONSTERS } from './dungeons/blackGate'

export const ESTABLISHED_COMBAT_MONSTERS = Object.assign(
  {},
  FLOODED_RELIQUARY_MONSTERS,
  ASHEN_WATCH_MONSTERS,
  ROOTSCAR_HOLLOW_MONSTERS,
  STORMVAULT_GALLERY_MONSTERS,
  GRAVEGLASS_HOLLOW_MONSTERS,
  STARFALLEN_OBSERVATORY_MONSTERS,
  HALL_OF_UNBOUND_NAMES_MONSTERS,
  VAULT_OF_THE_BLACK_SIGIL_MONSTERS,
  FRACTURED_APPROACH_MONSTERS,
  CROSSROADS_OF_RUIN_MONSTERS,
  BROKEN_MERIDIAN_MONSTERS,
  BLACK_GATE_MONSTERS,
)

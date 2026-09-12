import type { ItemId, SchoolId, SpellId } from '../../game/types'
import type { StatusId } from '../../game/systems/combat/combatTypes'

import airFragmentAsset from '../../assets/Icons/Test/fc170.png'
import airLanceAsset from '../../assets/Icons/Test/fc1071.png'
import airSchoolAsset from '../../assets/Icons/Test/fc1065.png'
import blackPortalShardAsset from '../../assets/Icons/Test/fc749.png'
import burialClothAsset from '../../assets/Icons/Test/fc204.png'
import bleedingStatusAsset from '../../assets/Icons/Test/fc742.png'
import burningStatusAsset from '../../assets/Icons/Test/fc693.png'
import chilledStatusAsset from '../../assets/Icons/Test/fc711.png'
import corruptedBeastEssenceAsset from '../../assets/Icons/Test/fc115.png'
import earthFragmentAsset from '../../assets/Icons/Test/fc164.png'
import earthSchoolAsset from '../../assets/Icons/Test/fc1032.png'
import earthSpikeAsset from '../../assets/Icons/Test/fc1033.png'
import edrinsSignetAsset from '../../assets/Icons/Test/fc2076.png'
import emberStaffAsset from '../../assets/Icons/Test/fc1712.png'
import fireBoltAsset from '../../assets/Icons/Test/fc1001.png'
import fireFragmentAsset from '../../assets/Icons/Test/fc163.png'
import fireballAsset from '../../assets/Icons/Test/fc1008.png'
import fireSchoolAsset from '../../assets/Icons/Test/fc993.png'
import fortifiedStatusAsset from '../../assets/Icons/Test/fc853.png'
import fortifyAsset from '../../assets/Icons/Test/fc1042.png'
import frostbiteAsset from '../../assets/Icons/Test/fc1014.png'
import fangwireEarringAsset from '../../assets/Icons/Test/fc2063.png'
import flowMendAsset from '../../assets/Icons/Test/fc1017.png'
import groveBarkAsset from '../../assets/Icons/Test/fc202.png'
import grovekeeperMantleAsset from '../../assets/Icons/Test/fc2032.png'
import greatbearHeartstoneAsset from '../../assets/Icons/Test/fc2068.png'
import gravebinderRingAsset from '../../assets/Icons/Test/fc2075.png'
import graveglassShardAsset from '../../assets/Icons/Test/fc168.png'
import heartseedAsset from '../../assets/Icons/Test/fc659.png'
import heartseedNecklaceAsset from '../../assets/Icons/Test/fc2066.png'
import howlingSignetAsset from '../../assets/Icons/Test/fc2064.png'
import igniteAsset from '../../assets/Icons/Test/fc998.png'
import lifeEssenceAsset from '../../assets/Icons/Test/fc383.png'
import mourningGlassEarringAsset from '../../assets/Icons/Test/fc2069.png'
import ossuaryMantleAsset from '../../assets/Icons/Test/fc1976.png'
import ossuaryRemnantAsset from '../../assets/Icons/Test/fc231.png'
import predatorFangAsset from '../../assets/Icons/Test/fc234.png'
import predatorHideAsset from '../../assets/Icons/Test/fc496.png'
import predatorHideMantleAsset from '../../assets/Icons/Test/fc2031.png'
import predatorSinewAsset from '../../assets/Icons/Test/fc492.png'
import prismaticFragmentAsset from '../../assets/Icons/Test/fc166.png'
import regenerationStatusAsset from '../../assets/Icons/Test/fc709.png'
import rootstoneShardAsset from '../../assets/Icons/Test/fc315.png'
import shockStatusAsset from '../../assets/Icons/Test/fc683.png'
import shockSparkAsset from '../../assets/Icons/Test/fc1047.png'
import soulResidueAsset from '../../assets/Icons/Test/fc751.png'
import soulglassAmuletAsset from '../../assets/Icons/Test/fc2070.png'
import stoneguardAsset from '../../assets/Icons/Test/fc1043.png'
import stoneheartScepterAsset from '../../assets/Icons/Test/fc1706.png'
import thornFiberAsset from '../../assets/Icons/Test/fc251.png'
import thornWoundStatusAsset from '../../assets/Icons/Test/fc747.png'
import tideglassWandAsset from '../../assets/Icons/Test/fc1601.png'
import waterFragmentAsset from '../../assets/Icons/Test/fc165.png'
import waterSchoolAsset from '../../assets/Icons/Test/fc1020.png'
import waterWardAsset from '../../assets/Icons/Test/fc1013.png'
import windthreadCharmAsset from '../../assets/Icons/Test/fc2065.png'
import windthreadWandAsset from '../../assets/Icons/Test/fc1704.png'
import wispboundRingAsset from '../../assets/Icons/Test/fc2067.png'
import wispEssenceAsset from '../../assets/Icons/Test/fc384.png'
import wispglassEarringAsset from '../../assets/Icons/Test/fc2062.png'
import wispveilHoodAsset from '../../assets/Icons/Test/fc1954.png'
import wispweaveRobeAsset from '../../assets/Icons/Test/fc1977.png'
import quickeningAsset from '../../assets/Icons/Test/fc1070.png'

/** Presentation-only switch for the experimental raster icon layer. */
export const GAME_ICON_MODE: 'legacy' | 'asset-pack' = 'asset-pack'

type GameAssetIconKey =
  | `item:${ItemId}`
  | `spell:${SpellId}`
  | `school:${SchoolId}`
  | `status:${StatusId}`

export type GameAssetIconRef =
  | { kind: 'item'; id: ItemId }
  | { kind: 'spell'; id: SpellId }
  | { kind: 'school'; id: SchoolId }
  | { kind: 'status'; id: StatusId }

const GAME_ASSET_ICONS: Partial<Record<GameAssetIconKey, string>> = {
  'item:air-fragment': airFragmentAsset,
  'item:burial-cloth': burialClothAsset,
  'item:corrupted-beast-essence': corruptedBeastEssenceAsset,
  'item:earth-fragment': earthFragmentAsset,
  'item:ember-staff': emberStaffAsset,
  'item:fire-fragment': fireFragmentAsset,
  'item:graveglass-shard': graveglassShardAsset,
  'item:grove-bark': groveBarkAsset,
  'item:grovekeeper-mantle': grovekeeperMantleAsset,
  'item:greatbear-heartstone': greatbearHeartstoneAsset,
  'item:gravebinder-ring': gravebinderRingAsset,
  'item:heartseed': heartseedAsset,
  'item:heartseed-necklace': heartseedNecklaceAsset,
  'item:howling-signet': howlingSignetAsset,
  'item:life-essence': lifeEssenceAsset,
  'item:mourning-glass-earring': mourningGlassEarringAsset,
  'item:ossuary-mantle': ossuaryMantleAsset,
  'item:ossuary-remnant': ossuaryRemnantAsset,
  'item:predator-fang': predatorFangAsset,
  'item:predator-hide': predatorHideAsset,
  'item:predator-hide-mantle': predatorHideMantleAsset,
  'item:predator-sinew': predatorSinewAsset,
  'item:prismatic-fragment': prismaticFragmentAsset,
  'item:rootstone-shard': rootstoneShardAsset,
  'item:soul-residue': soulResidueAsset,
  'item:soulglass-amulet': soulglassAmuletAsset,
  'item:stoneheart-scepter': stoneheartScepterAsset,
  'item:thorn-fiber': thornFiberAsset,
  'item:tideglass-wand': tideglassWandAsset,
  'item:water-fragment': waterFragmentAsset,
  'item:windthread-charm': windthreadCharmAsset,
  'item:windthread-wand': windthreadWandAsset,
  'item:wisp-essence': wispEssenceAsset,
  'item:wispbound-ring': wispboundRingAsset,
  'item:wispglass-earring': wispglassEarringAsset,
  'item:wispveil-hood': wispveilHoodAsset,
  'item:wispweave-robe': wispweaveRobeAsset,
  'item:fangwire-earring': fangwireEarringAsset,
  'item:edrins-signet': edrinsSignetAsset,
  'item:black-portal-shard': blackPortalShardAsset,

  'spell:air-lance': airLanceAsset,
  'spell:earth-spike': earthSpikeAsset,
  'spell:fire-bolt': fireBoltAsset,
  'spell:fireball': fireballAsset,
  'spell:flow-mend': flowMendAsset,
  'spell:fortify': fortifyAsset,
  'spell:frostbite': frostbiteAsset,
  'spell:ignite': igniteAsset,
  'spell:quickening': quickeningAsset,
  'spell:shock-spark': shockSparkAsset,
  'spell:stoneguard': stoneguardAsset,
  'spell:water-ward': waterWardAsset,

  'school:air': airSchoolAsset,
  'school:earth': earthSchoolAsset,
  'school:fire': fireSchoolAsset,
  'school:water': waterSchoolAsset,

  'status:bleeding': bleedingStatusAsset,
  'status:burning': burningStatusAsset,
  'status:chilled': chilledStatusAsset,
  'status:fortified': fortifiedStatusAsset,
  'status:regeneration': regenerationStatusAsset,
  'status:shock': shockStatusAsset,
  'status:thorn-wound': thornWoundStatusAsset,
}

export function resolveGameAssetIcon(ref: GameAssetIconRef): string | null {
  if (GAME_ICON_MODE === 'legacy') return null
  return GAME_ASSET_ICONS[`${ref.kind}:${ref.id}` as GameAssetIconKey] ?? null
}

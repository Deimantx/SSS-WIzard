import type { ItemId, SchoolId, SpellId } from '../../game/types'
import type { StatusId } from '../../game/systems/combat/combatTypes'

import airFragmentAsset from '../../assets/Icons/Test/fc170.png'
import airLanceAsset from '../../assets/Icons/Test/fc1071.png'
import airSchoolAsset from '../../assets/Icons/Test/fc1065.png'
import blackPortalShardAsset from '../../assets/Icons/Test/fc749.png'
import bleedingStatusAsset from '../../assets/Icons/Test/fc742.png'
import burningStatusAsset from '../../assets/Icons/Test/fc693.png'
import chilledStatusAsset from '../../assets/Icons/Test/fc711.png'
import earthFragmentAsset from '../../assets/Icons/Test/fc164.png'
import earthSchoolAsset from '../../assets/Icons/Test/fc1032.png'
import earthSpikeAsset from '../../assets/Icons/Test/fc1033.png'
import emberStaffAsset from '../../assets/Icons/Test/fc1712.png'
import fireBoltAsset from '../../assets/Icons/Test/fc1001.png'
import fireFragmentAsset from '../../assets/Icons/Test/fc163.png'
import fireballAsset from '../../assets/Icons/Test/fc1008.png'
import fireSchoolAsset from '../../assets/Icons/Test/fc993.png'
import fortifiedStatusAsset from '../../assets/Icons/Test/fc853.png'
import fortifyAsset from '../../assets/Icons/Test/fc1042.png'
import frostbiteAsset from '../../assets/Icons/Test/fc1014.png'
import flowMendAsset from '../../assets/Icons/Test/fc1017.png'
import igniteAsset from '../../assets/Icons/Test/fc998.png'
import lifeEssenceAsset from '../../assets/Icons/Test/fc383.png'
import prismaticFragmentAsset from '../../assets/Icons/Test/fc166.png'
import regenerationStatusAsset from '../../assets/Icons/Test/fc709.png'
import shockStatusAsset from '../../assets/Icons/Test/fc683.png'
import shockSparkAsset from '../../assets/Icons/Test/fc1047.png'
import stoneguardAsset from '../../assets/Icons/Test/fc1043.png'
import stoneheartScepterAsset from '../../assets/Icons/Test/fc1706.png'
import thornWoundStatusAsset from '../../assets/Icons/Test/fc747.png'
import tideglassWandAsset from '../../assets/Icons/Test/fc1601.png'
import waterFragmentAsset from '../../assets/Icons/Test/fc165.png'
import waterSchoolAsset from '../../assets/Icons/Test/fc1020.png'
import waterWardAsset from '../../assets/Icons/Test/fc1013.png'
import windthreadWandAsset from '../../assets/Icons/Test/fc1704.png'
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
  'item:earth-fragment': earthFragmentAsset,
  'item:ember-staff': emberStaffAsset,
  'item:fire-fragment': fireFragmentAsset,
  'item:life-essence': lifeEssenceAsset,
  'item:prismatic-fragment': prismaticFragmentAsset,
  'item:stoneheart-scepter': stoneheartScepterAsset,
  'item:tideglass-wand': tideglassWandAsset,
  'item:water-fragment': waterFragmentAsset,
  'item:windthread-wand': windthreadWandAsset,
  'item:wispveil-hood': wispveilHoodAsset,
  'item:wispweave-robe': wispweaveRobeAsset,
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

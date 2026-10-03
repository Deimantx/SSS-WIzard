import type { CombatLocationId } from '../../types'

export interface ArcaneCoreRewardDefinition {
  normalKillPoints: number
  bossKillPoints: number
}

export const ARCANE_CORE_REWARDS: Record<CombatLocationId, ArcaneCoreRewardDefinition> = {
  'whispering-woods': { normalKillPoints: 1, bossKillPoints: 8 },
  'howling-den': { normalKillPoints: 1, bossKillPoints: 10 },
  'hunters-ground': { normalKillPoints: 1, bossKillPoints: 11 },
  'abandoned-catacombs': { normalKillPoints: 2, bossKillPoints: 13 },
  'fractured-approach': { normalKillPoints: 2, bossKillPoints: 16 },
  'flooded-reliquary': { normalKillPoints: 2, bossKillPoints: 19 },
  'ashen-watch': { normalKillPoints: 3, bossKillPoints: 22 },
  'rootscar-hollow': { normalKillPoints: 3, bossKillPoints: 25 },
  'crossroads-of-ruin': { normalKillPoints: 4, bossKillPoints: 28 },
  'graveglass-hollow': { normalKillPoints: 4, bossKillPoints: 31 },
  'stormvault-gallery': { normalKillPoints: 4, bossKillPoints: 34 },
  'starfallen-observatory': { normalKillPoints: 5, bossKillPoints: 38 },
  'broken-meridian': { normalKillPoints: 5, bossKillPoints: 42 },
  'hall-of-unbound-names': { normalKillPoints: 6, bossKillPoints: 46 },
  'vault-of-the-black-sigil': { normalKillPoints: 6, bossKillPoints: 50 },
  'black-gate': { normalKillPoints: 7, bossKillPoints: 60 },
  'stonewake-hollow': { normalKillPoints: 1, bossKillPoints: 8 },
  'galecrest-heights': { normalKillPoints: 1, bossKillPoints: 8 },
  'tideglass-caverns': { normalKillPoints: 1, bossKillPoints: 8 },
  'emberfall-basin': { normalKillPoints: 1, bossKillPoints: 8 },
  'brineveil-marsh': { normalKillPoints: 3, bossKillPoints: 22 },
  'cinderwild-expanse': { normalKillPoints: 4, bossKillPoints: 25 },
  'skybreak-cliffs': { normalKillPoints: 5, bossKillPoints: 28 },
  'runeblight-expanse': { normalKillPoints: 5, bossKillPoints: 32 },
  'pyrehold-bastion': { normalKillPoints: 6, bossKillPoints: 36 },
  'abyssal-reservoir': { normalKillPoints: 6, bossKillPoints: 40 },
  'scalding-rift': { normalKillPoints: 7, bossKillPoints: 44 },
  'mistclaw-highlands': { normalKillPoints: 5, bossKillPoints: 30 },
  'cinderhex-barrens': { normalKillPoints: 6, bossKillPoints: 34 },
  'cinder-sepulcher': { normalKillPoints: 7, bossKillPoints: 43 },
  'temple-of-the-sunken-bell': { normalKillPoints: 7, bossKillPoints: 45 },
  'stormspire-monastery': { normalKillPoints: 8, bossKillPoints: 48 },
  'nullstone-archive': { normalKillPoints: 9, bossKillPoints: 55 },
}
export const getArcaneCoreReward = (locationId: CombatLocationId | null) => locationId ? ARCANE_CORE_REWARDS[locationId] : null

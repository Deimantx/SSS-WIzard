import { DUNGEONS, isDungeonUnlocked } from '../dungeons/dungeons'
import type { DungeonId, GameState } from '../../types'
import { MONSTERS } from '../monsters'
import { getMonsterPrimaryAffinity } from '../monsters/monsterTypes'
import { ELEMENT_IDS } from '../elements/elements'
import { getElementMultiplier } from '../elements/elements'
import type { CombatEncounterMode, CombatLocationDefinition, CombatLocationId, CombatRegionDefinition, CombatRegionId } from './worldNavigationTypes'

const firstFrontierLocationIds: readonly CombatLocationId[] = ['stonewake-hollow', 'galecrest-heights', 'tideglass-caverns', 'emberfall-basin', 'whispering-woods', 'howling-den', 'hunters-ground', 'abandoned-catacombs']
const elementalScarLocationIds: readonly CombatLocationId[] = ['fractured-approach', 'flooded-reliquary', 'ashen-watch', 'rootscar-hollow', 'crossroads-of-ruin']
const shatteredMeridianLocationIds: readonly CombatLocationId[] = ['graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory', 'broken-meridian']
const blackSigilReachLocationIds: readonly CombatLocationId[] = ['hall-of-unbound-names', 'vault-of-the-black-sigil', 'black-gate']

export const COMBAT_REGIONS: Record<CombatRegionId, CombatRegionDefinition> = {
  'first-frontier': {
    id: 'first-frontier',
    name: 'First Frontier',
    description: 'The first stretch of wild territory traced from the tower.',
    locationIds: [...firstFrontierLocationIds],
    order: 1,
    unlock: { type: 'always' },
  },
  'elemental-scar': {
    id: 'elemental-scar',
    name: 'Elemental Scar',
    description: 'A wounded elemental corridor where the old frontier gives way to unstable crossings.',
    locationIds: [...elementalScarLocationIds],
    order: 2,
    unlock: { type: 'boss-kill', bossId: 'archmage-edrin-shade', count: 1 },
  },
  'shattered-meridian': {
    id: 'shattered-meridian',
    name: 'Shattered Meridian',
    description: 'A fractured leyline where roads, ruins, and starlight pull against one another.',
    locationIds: [...shatteredMeridianLocationIds],
    order: 3,
    unlock: { type: 'boss-kill', bossId: 'crossroads-keeper', count: 1 },
  },
  'black-sigil-reach': {
    id: 'black-sigil-reach',
    name: 'Black Sigil Reach',
    description: 'The sealed approach to the dark gate, marked by names and wards that should not endure.',
    locationIds: [...blackSigilReachLocationIds],
    order: 4,
    unlock: { type: 'boss-kill', bossId: 'meridian-splitter', count: 1 },
  },
}

const dungeonLocation = (regionId: CombatRegionId, dungeonId: DungeonId, type: CombatLocationDefinition['type'], order: number): CombatLocationDefinition => ({
  id: dungeonId,
  regionId,
  name: DUNGEONS[dungeonId].name,
  type,
  order,
  dungeonId,
  encounterMode: 'random-pool',
})

export const COMBAT_LOCATIONS: Record<CombatLocationId, CombatLocationDefinition> = {
  'stonewake-hollow': {
    ...dungeonLocation('first-frontier', 'stonewake-hollow', 'combat-zone', 1),
    name: 'Stonewake Hollow', description: 'An Earth frontier of barriers and heavy, deliberate attacks.', primaryElement: 'earth', elementsPresent: ['earth'], encounterMode: 'targeted',
    targetMetadata: { 'stonewake-gravel-wisp': { difficulty: 'easy', order: 1 }, 'stonewake-rootback-crawler': { difficulty: 'easy', order: 2 }, 'stonewake-shardhide-golem': { difficulty: 'standard', order: 3 }, 'stonewake-stonebound-warden': { difficulty: 'hard', order: 4 } },
    unlock: { type: 'any', conditions: [{ type: 'starter-advantage', targetElement: 'earth' }, { type: 'chronicle-event', eventId: 'elemental-tutorial-zones-opened' }] },
  },
  'galecrest-heights': {
    ...dungeonLocation('first-frontier', 'galecrest-heights', 'combat-zone', 2),
    name: 'Galecrest Heights', description: 'An Air frontier of haste and multi-hit pressure.', primaryElement: 'air', elementsPresent: ['air'], encounterMode: 'targeted',
    targetMetadata: { 'galecrest-zephyr-wisp': { difficulty: 'easy', order: 1 }, 'galecrest-gale-imp': { difficulty: 'easy', order: 2 }, 'galecrest-razorwing': { difficulty: 'standard', order: 3 }, 'galecrest-stormcaller-adept': { difficulty: 'hard', order: 4 } },
    unlock: { type: 'any', conditions: [{ type: 'starter-advantage', targetElement: 'air' }, { type: 'chronicle-event', eventId: 'elemental-tutorial-zones-opened' }] },
  },
  'tideglass-caverns': {
    ...dungeonLocation('first-frontier', 'tideglass-caverns', 'combat-zone', 3),
    name: 'Tideglass Caverns', description: 'A Water frontier of barriers, healing, and dragging currents.', primaryElement: 'water', elementsPresent: ['water'], encounterMode: 'targeted',
    targetMetadata: { 'tideglass-tide-wisp': { difficulty: 'easy', order: 1 }, 'tideglass-reef-crawler': { difficulty: 'easy', order: 2 }, 'tideglass-current-serpent': { difficulty: 'standard', order: 3 }, 'tideglass-drowned-channeler': { difficulty: 'hard', order: 4 } },
    unlock: { type: 'any', conditions: [{ type: 'starter-advantage', targetElement: 'water' }, { type: 'chronicle-event', eventId: 'elemental-tutorial-zones-opened' }] },
  },
  'emberfall-basin': {
    ...dungeonLocation('first-frontier', 'emberfall-basin', 'combat-zone', 4),
    name: 'Emberfall Basin', description: 'A Fire frontier of direct strikes and lingering burns.', primaryElement: 'fire', elementsPresent: ['fire'], encounterMode: 'targeted',
    targetMetadata: { 'emberfall-ember-wisp': { difficulty: 'easy', order: 1 }, 'emberfall-ashling': { difficulty: 'easy', order: 2 }, 'emberfall-flame-hound': { difficulty: 'standard', order: 3 }, 'emberfall-ashen-adept': { difficulty: 'hard', order: 4 } },
    unlock: { type: 'any', conditions: [{ type: 'starter-advantage', targetElement: 'fire' }, { type: 'chronicle-event', eventId: 'elemental-tutorial-zones-opened' }] },
  },
  'whispering-woods': {
    ...dungeonLocation('first-frontier', 'whispering-woods', 'combat-zone', 5),
    name: 'Whispering Woods', description: 'A mixed-target forest where elemental affinities shape each encounter.', elementsPresent: ['air', 'earth', 'water', 'fire'],
    encounterMode: 'targeted',
    unlock: { type: 'any', conditions: [{ type: 'chronicle-event', eventId: 'first-elemental-tutorial-boss-defeated' }, { type: 'boss-kill', bossId: 'forest-heart', count: 1 }] },
    targetMetadata: {
      'forest-wisp': { difficulty: 'easy', order: 1 },
      thornling: { difficulty: 'easy', order: 2 },
      'dewbound-sprite': { difficulty: 'standard', order: 3 },
      'cinder-moth': { difficulty: 'standard', order: 4 },
      'stone-root': { difficulty: 'standard', order: 5 },
      'grove-sentinel': { difficulty: 'hard', order: 6 },
      'tempest-stag': { difficulty: 'apex', order: 7 },
    },
  },
  'howling-den': {
    ...dungeonLocation('first-frontier', 'howling-den', 'elite-zone', 6),
    name: 'Howling Den', description: 'An elite hunting ground where every normal foe gains Haste once at half Health.', elementsPresent: ['air', 'arcane', 'earth', 'fire'],
    encounterMode: 'targeted',
    zoneAffixId: 'frenzied',
    unlock: { type: 'boss-kill', bossId: 'forest-heart', count: 1 },
    targetMetadata: {
      'cavefang-wolf': { difficulty: 'standard', order: 1 },
      'razorclaw-lynx': { difficulty: 'standard', order: 2 },
      'corrupted-dire-wolf': { difficulty: 'hard', order: 3 },
      'bonehide-boar': { difficulty: 'hard', order: 4 },
      'moonblind-jackal': { difficulty: 'hard', order: 5 },
      'den-stalker': { difficulty: 'apex', order: 6 },
    },
  },
  'hunters-ground': { ...dungeonLocation('first-frontier', 'hunters-ground', 'hunting-ground', 7), name: 'Gloamridge', description: 'A bossless ridge of deterministic Hunter’s Order quarry contracts.', elementsPresent: ['air', 'arcane', 'earth', 'fire'], encounterMode: 'targeted', unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear', count: 1 }, targetMetadata: { 'ashen-tracker': { difficulty: 'standard', order: 1 }, 'gloamfang-stalker': { difficulty: 'standard', order: 2 }, 'runehorn-brute': { difficulty: 'hard', order: 3 }, 'veilwing-harrier': { difficulty: 'standard', order: 4 }, 'cinderback-mauler': { difficulty: 'hard', order: 5 }, 'gloomroot-hexer': { difficulty: 'hard', order: 6 }, 'nightglass-alpha': { difficulty: 'hard', order: 7 } } },
  'abandoned-catacombs': {
    ...dungeonLocation('first-frontier', 'abandoned-catacombs', 'dungeon', 8),
    name: 'Abandoned Catacombs', description: 'A fixed sequence through the old crypts, ending at Archmage Edrin’s Shade.', elementsPresent: ['water', 'earth', 'arcane'],
    encounterMode: 'sequence',
    unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear', count: 1 },
    firstClearUnlockPreview: [
      { id: 'black-portal-shard', label: 'Black Portal Shard' },
      { id: 'dark-portal', label: 'Dark Portal' },
      { id: 'world-tier-2', label: 'World Tier 2' },
      { id: 'elemental-scar', label: 'Elemental Scar' },
      { id: 'magic-school-cap', label: 'Magic School Cap Increase' },
    ],
  },
  'fractured-approach': {
    ...dungeonLocation('elemental-scar', 'fractured-approach', 'dungeon', 1),
    encounterMode: 'sequence',
    firstClearUnlockPreview: [
      { id: 'summoning', label: 'Summoning' },
      { id: 'flooded-reliquary', label: 'Flooded Reliquary' },
      { id: 'ashen-watch', label: 'Ashen Watch' },
      { id: 'rootscar-hollow', label: 'Rootscar Hollow' },
    ],
  },
  'flooded-reliquary': {
    ...dungeonLocation('elemental-scar', 'flooded-reliquary', 'combat-zone', 2),
    encounterMode: 'targeted',
    targetMetadata: {
      'drowned-acolyte': { difficulty: 'easy', order: 1 },
      'reliquary-slime': { difficulty: 'easy', order: 2 },
      'mist-wraith': { difficulty: 'standard', order: 3 },
      'rune-leech': { difficulty: 'standard', order: 4 },
      'tidefang-serpent': { difficulty: 'standard', order: 5 },
      'brinebound-sentinel': { difficulty: 'hard', order: 6 },
      'abyssal-archivist': { difficulty: 'apex', order: 7 },
    },
  },
  'ashen-watch': {
    ...dungeonLocation('elemental-scar', 'ashen-watch', 'combat-zone', 3),
    encounterMode: 'targeted',
    targetMetadata: {
      'cinder-hound': { difficulty: 'easy', order: 1 },
      'ash-cultist': { difficulty: 'easy', order: 2 },
      'fire-elemental': { difficulty: 'standard', order: 3 },
      'lava-eel': { difficulty: 'standard', order: 4 },
      'emberwing-harrier': { difficulty: 'standard', order: 5 },
      'charred-warden': { difficulty: 'hard', order: 6 },
      'pyre-colossus': { difficulty: 'apex', order: 7 },
    },
  },
  'rootscar-hollow': {
    ...dungeonLocation('elemental-scar', 'rootscar-hollow', 'combat-zone', 4),
    encounterMode: 'targeted',
    targetMetadata: {
      'thorn-maw': { difficulty: 'easy', order: 1 },
      'rootbound-stalker': { difficulty: 'easy', order: 2 },
      'briar-sprite': { difficulty: 'standard', order: 3 },
      'moss-carapace': { difficulty: 'standard', order: 4 },
      'sporeback-brute': { difficulty: 'standard', order: 5 },
      'vinebound-reaver': { difficulty: 'hard', order: 6 },
      'scarwood-behemoth': { difficulty: 'apex', order: 7 },
    },
  },
  'crossroads-of-ruin': {
    ...dungeonLocation('elemental-scar', 'crossroads-of-ruin', 'dungeon', 5),
    encounterMode: 'sequence',
    firstClearUnlockPreview: [
      { id: 'shattered-meridian', label: 'Shattered Meridian' },
      { id: 'world-tier-3', label: 'World Tier 3' },
    ],
  },
  'graveglass-hollow': {
    ...dungeonLocation('shattered-meridian', 'graveglass-hollow', 'elite-zone', 1),
    encounterMode: 'targeted',
    zoneAffixId: 'warded',
    targetMetadata: {
      'graveglass-shade': { difficulty: 'standard', order: 1 },
      'bone-shardling': { difficulty: 'standard', order: 2 },
      'silent-mourner': { difficulty: 'hard', order: 3 },
      'crypt-guardian': { difficulty: 'hard', order: 4 },
      'epitaph-weaver': { difficulty: 'hard', order: 5 },
      'tombglass-reaver': { difficulty: 'apex', order: 6 },
      'ossuary-oracle': { difficulty: 'apex', order: 7 },
    },
  },
  'stormvault-gallery': {
    ...dungeonLocation('shattered-meridian', 'stormvault-gallery', 'combat-zone', 2),
    encounterMode: 'targeted',
    targetMetadata: {
      'volt-wisp': { difficulty: 'easy', order: 1 },
      'gale-scribe': { difficulty: 'easy', order: 2 },
      'charged-seeker': { difficulty: 'standard', order: 3 },
      'thundercoil-serpent': { difficulty: 'standard', order: 4 },
      'static-armor': { difficulty: 'hard', order: 5 },
      'stormbound-curator': { difficulty: 'hard', order: 6 },
      'tempest-engine': { difficulty: 'apex', order: 7 },
    },
  },
  'starfallen-observatory': {
    ...dungeonLocation('shattered-meridian', 'starfallen-observatory', 'elite-zone', 3),
    encounterMode: 'targeted',
    zoneAffixId: 'relentless',
    targetMetadata: {
      'starbound-eye': { difficulty: 'standard', order: 1 },
      'astral-husk': { difficulty: 'standard', order: 2 },
      'orbiting-fragment': { difficulty: 'hard', order: 3 },
      'lenskeeper-remnant': { difficulty: 'hard', order: 4 },
      'comet-wraith': { difficulty: 'hard', order: 5 },
      'voidglass-custodian': { difficulty: 'apex', order: 6 },
      'zenith-horror': { difficulty: 'apex', order: 7 },
    },
  },
  'broken-meridian': {
    ...dungeonLocation('shattered-meridian', 'broken-meridian', 'dungeon', 4),
    encounterMode: 'sequence',
    firstClearUnlockPreview: [
      { id: 'black-sigil-reach', label: 'Black Sigil Reach' },
      { id: 'world-tier-4', label: 'World Tier 4' },
      { id: 'crystals', label: 'Crystals' },
    ],
  },
  'hall-of-unbound-names': {
    ...dungeonLocation('black-sigil-reach', 'hall-of-unbound-names', 'elite-zone', 1),
    encounterMode: 'targeted',
    zoneAffixId: 'vicious',
    targetMetadata: {
      'name-eater': { difficulty: 'standard', order: 1 },
      'bound-echo': { difficulty: 'standard', order: 2 },
      'hollow-liturgist': { difficulty: 'hard', order: 3 },
      'whisper-archivist': { difficulty: 'hard', order: 4 },
      'nameless-cantor': { difficulty: 'hard', order: 5 },
      'oathless-confessor': { difficulty: 'apex', order: 6 },
      'unwritten-hierophant': { difficulty: 'apex', order: 7 },
    },
  },
  'vault-of-the-black-sigil': {
    ...dungeonLocation('black-sigil-reach', 'vault-of-the-black-sigil', 'elite-zone', 2),
    encounterMode: 'targeted',
    zoneAffixId: 'armored',
    targetMetadata: {
      'black-seal-parasite': { difficulty: 'standard', order: 1 },
      'inkbound-specter': { difficulty: 'standard', order: 2 },
      'sigil-guardian': { difficulty: 'hard', order: 3 },
      'vault-devourer': { difficulty: 'hard', order: 4 },
      'sealbound-custodian': { difficulty: 'hard', order: 5 },
      'blackscript-colossus': { difficulty: 'apex', order: 6 },
      'voidseal-arbiter': { difficulty: 'apex', order: 7 },
    },
  },
  'black-gate': {
    ...dungeonLocation('black-sigil-reach', 'black-gate', 'dungeon', 3),
    encounterMode: 'sequence',
    firstClearUnlockPreview: [{ id: 'world-tier-5', label: 'World Tier 5' }],
  },
}

// Transitional zone metadata is derived from the canonical roster. It keeps the browser data-driven
// while legacy mixed rosters remain in place ahead of their later content migration.
Object.values(COMBAT_LOCATIONS).forEach((location) => {
  const dungeon = location.dungeonId ? DUNGEONS[location.dungeonId] : undefined
  if (!dungeon) {
    location.elementsPresent = []
    return
  }
  const roster = [...(dungeon.encounterSequence ?? dungeon.monsterPool), ...(dungeon.boss ? [dungeon.boss] : [])]
  const elementsPresent = ELEMENT_IDS.filter((element) => roster.some((monsterId) => MONSTERS[monsterId] && getMonsterPrimaryAffinity(MONSTERS[monsterId]) === element))
  location.elementsPresent = elementsPresent
  if (['stonewake-hollow', 'galecrest-heights', 'tideglass-caverns', 'emberfall-basin'].includes(location.id) && elementsPresent.length === 1) location.primaryElement = elementsPresent[0]
  else if (!['stonewake-hollow', 'galecrest-heights', 'tideglass-caverns', 'emberfall-basin'].includes(location.id)) delete location.primaryElement
})

export const getCombatLocation = (locationId: CombatLocationId | null | undefined) => locationId ? COMBAT_LOCATIONS[locationId] ?? null : null

export const getCombatLocationByDungeonId = (dungeonId: DungeonId | null | undefined) => {
  if (!dungeonId) return null
  return Object.values(COMBAT_LOCATIONS).find((location) => location.dungeonId === dungeonId) ?? null
}

type NavigationProgress = Pick<GameState['progress'], 'bossKillsByBoss'> & Partial<Pick<GameState['progress'], 'startingSchoolId' | 'chronicle'>>

export const isCombatNavigationConditionUnlocked = (condition: CombatLocationDefinition['unlock'] | CombatRegionDefinition['unlock'], progress: NavigationProgress): boolean => {
  if (!condition || condition.type === 'always') return true
  if (condition.type === 'boss-kill') return (progress.bossKillsByBoss[condition.bossId] ?? 0) >= (condition.count ?? 1)
  if (condition.type === 'all-boss-kills') return condition.bossIds.every((bossId) => (progress.bossKillsByBoss[bossId] ?? 0) >= 1)
  if (condition.type === 'chronicle-event') return progress.chronicle?.eventFlags[condition.eventId] === true
  if (condition.type === 'starter-advantage') return Boolean(progress.startingSchoolId && getElementMultiplier(progress.startingSchoolId, condition.targetElement) > 1)
  if (condition.type === 'any') return condition.conditions.some((entry) => isCombatNavigationConditionUnlocked(entry, progress))
  return condition.conditions.every((entry) => isCombatNavigationConditionUnlocked(entry, progress))
}

export const isCombatLocationUnlocked = (locationId: CombatLocationId, progress: NavigationProgress): boolean => {
  const location = COMBAT_LOCATIONS[locationId]
  const region = location && COMBAT_REGIONS[location.regionId]
  if (!location || !region || !isCombatNavigationConditionUnlocked(region.unlock, progress) || !isCombatNavigationConditionUnlocked(location.unlock, progress)) return false
  return location.dungeonId ? isDungeonUnlocked(DUNGEONS[location.dungeonId], progress) : !location.prototype
}

export const getCombatEncounterMode = (location: CombatLocationDefinition | null | undefined): CombatEncounterMode => location?.encounterMode ?? 'random-pool'

export const usesPowerBasedThreat = (location: CombatLocationDefinition | null | undefined) => Boolean(
  location?.encounterMode === 'targeted' && (location.type === 'combat-zone' || location.type === 'elite-zone'),
)

export const isCombatTargetForLocation = (location: CombatLocationDefinition | null | undefined, dungeonId: DungeonId | null | undefined, targetEnemyId: string | null | undefined) => {
  if (!location || !dungeonId || getCombatEncounterMode(location) !== 'targeted' || !targetEnemyId || !location.targetMetadata?.[targetEnemyId as keyof typeof location.targetMetadata]) return false
  const dungeon = DUNGEONS[dungeonId]
  return Boolean(dungeon && dungeon.monsterPool.includes(targetEnemyId as typeof dungeon.monsterPool[number]))
}

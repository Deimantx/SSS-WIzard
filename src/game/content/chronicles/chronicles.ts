import type { ArtifactId, ChronicleChapterId, ChronicleEventId, ChronicleObjectiveId, ChronicleTrack, CrystalVariantId, DungeonId, GuildRankId, ItemId, MonsterId, ScreenId, SchoolId, WorldTierId } from '../../types'

export type ChronicleCondition =
  | { type: 'starting-school-selected' }
  | { type: 'lifetime-kills'; count: number }
  | { type: 'boss-kill'; bossId: MonsterId; count: number }
  | { type: 'dungeon-entered'; dungeonId: DungeonId }
  | { type: 'auto-cast-enabled' }
  | { type: 'channeling-acolytes'; count: number }
  | { type: 'chronicle-event'; eventId: ChronicleEventId }
  | { type: 'school-level'; school: 'starting'; level: number }
  | { type: 'artifact-invested-ranks'; artifact: 'starting'; ranks: number }
  | { type: 'guild-request-claimed'; count: number }
  | { type: 'guild-rank'; rank: GuildRankId }
  | { type: 'guardian-selected' }
  | { type: 'guardian-combat-completed' }
  | { type: 'crystal-equipped'; count: number }
  | { type: 'arcane-core-invested-nodes'; count: number }
  | { type: 'spell-loadout-slots'; count: number }
  | { type: 'world-tier-kill'; tier: WorldTierId; count: number }

export type ChronicleReward =
  | { type: 'item'; itemId: ItemId; quantity: number }
  | { type: 'crystal'; variantId: CrystalVariantId; quantity: number }
  | { type: 'arcane-points'; amount: number }

export interface ChronicleChapterDefinition {
  id: ChronicleChapterId
  name: string
  description: string
}

export interface ChronicleObjectiveDefinition {
  id: ChronicleObjectiveId
  chapterId: ChronicleChapterId
  track: ChronicleTrack
  title: string
  description: string
  prerequisiteIds?: ChronicleObjectiveId[]
  unlockAnyPrerequisiteIds?: ChronicleObjectiveId[]
  unlockCondition?: ChronicleCondition
  condition: ChronicleCondition
  navigateTo?: ScreenId
  onUnlockReward?: ChronicleReward[]
  onCompleteReward?: ChronicleReward[]
  optional?: boolean
}

export const CHRONICLE_CHAPTERS: readonly ChronicleChapterDefinition[] = [
  { id: 'first-frontier', name: 'First Frontier', description: 'Establish the Tower, master the first schools, and answer the call of the Verdant Circle.' },
  { id: 'shattered-frontier', name: 'Shattered Frontier', description: 'Push beyond the first gate, bind a Guardian, and survive a world that no longer stays still.' },
]

export const CHRONICLE_OBJECTIVES: readonly ChronicleObjectiveDefinition[] = [
  { id: 'm1-choose-school', chapterId: 'first-frontier', track: 'main', title: 'Choose Your School', description: 'Choose the Magic School that will shape your first frontier.', condition: { type: 'starting-school-selected' }, navigateTo: 'schools' },
  { id: 'm2-first-blood', chapterId: 'first-frontier', track: 'main', title: 'First Blood', description: 'Defeat your first enemy and begin the real work of the Tower.', prerequisiteIds: ['m1-choose-school'], condition: { type: 'lifetime-kills', count: 1 }, navigateTo: 'combat' },
  { id: 'm3-heart-of-the-woods', chapterId: 'first-frontier', track: 'main', title: 'Heart of the Woods', description: 'Defeat Forest Heart in Whispering Woods.', prerequisiteIds: ['m2-first-blood'], condition: { type: 'boss-kill', bossId: 'forest-heart', count: 1 }, navigateTo: 'combat' },
  { id: 'm4-break-the-den', chapterId: 'first-frontier', track: 'main', title: 'Break the Den', description: 'Defeat Corrupted Greatbear in Howling Den.', prerequisiteIds: ['m3-heart-of-the-woods'], condition: { type: 'boss-kill', bossId: 'corrupted-greatbear', count: 1 }, navigateTo: 'combat' },
  { id: 'm5-fallen-archmage', chapterId: 'first-frontier', track: 'main', title: 'The Fallen Archmage', description: "Defeat Archmage Edrin's Shade in the Abandoned Catacombs.", prerequisiteIds: ['m4-break-the-den'], condition: { type: 'boss-kill', bossId: 'archmage-edrin-shade', count: 1 }, navigateTo: 'combat' },

  { id: 'c1-enter-whispering-woods', chapterId: 'first-frontier', track: 'combat', title: 'Enter Whispering Woods', description: 'Enter Whispering Woods at least once.', prerequisiteIds: ['m1-choose-school'], condition: { type: 'dungeon-entered', dungeonId: 'whispering-woods' }, navigateTo: 'combat' },
  { id: 'c2-auto-cast', chapterId: 'first-frontier', track: 'combat', title: 'Let the Spellbook Work', description: 'Enable Auto-Cast for at least one Spell.', prerequisiteIds: ['c1-enter-whispering-woods'], condition: { type: 'auto-cast-enabled' }, navigateTo: 'schools', optional: true },

  { id: 'mg1-strengthen-artifact', chapterId: 'first-frontier', track: 'magic', title: 'Strengthen Your Artifact', description: 'Purchase one minor rank on your starting Artifact.', prerequisiteIds: ['m2-first-blood'], condition: { type: 'artifact-invested-ranks', artifact: 'starting', ranks: 1 }, navigateTo: 'equipment' },
  { id: 'mg2-expand-spellbook', chapterId: 'first-frontier', track: 'magic', title: 'Expand Your Spellbook', description: 'Raise your starting School to Level 17.', unlockAnyPrerequisiteIds: ['mg1-strengthen-artifact', 'm3-heart-of-the-woods'], condition: { type: 'school-level', school: 'starting', level: 17 }, navigateTo: 'schools' },
  { id: 'mg3-four-spell-arsenal', chapterId: 'first-frontier', track: 'magic', title: 'Four-Spell Arsenal', description: 'Fill at least four real Spell slots in the active loadout.', prerequisiteIds: ['mg2-expand-spellbook'], condition: { type: 'spell-loadout-slots', count: 4 }, navigateTo: 'schools', optional: true },

  { id: 't1-channeling-acolyte', chapterId: 'first-frontier', track: 'tower', title: 'Put an Acolyte to Work', description: 'Assign at least one Acolyte to Channeling.', prerequisiteIds: ['m2-first-blood'], condition: { type: 'channeling-acolytes', count: 1 }, navigateTo: 'tower-channeling' },
  { id: 't2-shape-resonance', chapterId: 'first-frontier', track: 'tower', title: 'Shape Resonance', description: 'Complete your first Fragment Transmutation cycle.', prerequisiteIds: ['t1-channeling-acolyte'], condition: { type: 'chronicle-event', eventId: 'first-fragment-transmuted' }, navigateTo: 'tower-transmutation' },
  { id: 't3-study-the-fragment', chapterId: 'first-frontier', track: 'tower', title: 'Study the Fragment', description: 'Complete your first Research batch.', prerequisiteIds: ['t2-shape-resonance'], condition: { type: 'chronicle-event', eventId: 'first-research-batch-completed' }, navigateTo: 'tower-research' },
  { id: 't4-answer-verdant-circle', chapterId: 'first-frontier', track: 'tower', title: 'Answer the Verdant Circle', description: 'Claim your first Guild Request.', prerequisiteIds: ['m3-heart-of-the-woods'], condition: { type: 'guild-request-claimed', count: 1 }, navigateTo: 'guild' },

  { id: 'sf-bind-guardian', chapterId: 'shattered-frontier', track: 'magic', title: 'Bind a Guardian', description: 'Choose one elemental Guardian.', unlockCondition: { type: 'boss-kill', bossId: 'corrupted-elemental-gatekeeper', count: 1 }, condition: { type: 'guardian-selected' }, navigateTo: 'tower-summoning' },
  { id: 'sf-fight-together', chapterId: 'shattered-frontier', track: 'magic', title: 'Fight Together', description: 'Complete one valid encounter with an active Guardian.', prerequisiteIds: ['sf-bind-guardian'], condition: { type: 'guardian-combat-completed' }, navigateTo: 'combat', onCompleteReward: [{ type: 'arcane-points', amount: 250 }] },
  { id: 'sf-socket-first-crystal', chapterId: 'shattered-frontier', track: 'magic', title: 'Socket Your First Crystal', description: 'Equip at least one Crystal.', unlockCondition: { type: 'boss-kill', bossId: 'meridian-splitter', count: 1 }, condition: { type: 'crystal-equipped', count: 1 }, navigateTo: 'crystals', onUnlockReward: [{ type: 'crystal', variantId: 'force-t1', quantity: 1 }] },
  { id: 'sf-step-into-harder-world', chapterId: 'shattered-frontier', track: 'combat', title: 'Step Into a Harder World', description: 'Defeat one enemy in World Tier 2.', unlockCondition: { type: 'boss-kill', bossId: 'archmage-edrin-shade', count: 1 }, condition: { type: 'chronicle-event', eventId: 'first-wt2-kill' }, navigateTo: 'combat', onCompleteReward: [{ type: 'arcane-points', amount: 250 }] },
]

export const CHRONICLE_OBJECTIVE_BY_ID = Object.fromEntries(CHRONICLE_OBJECTIVES.map((objective) => [objective.id, objective])) as Record<ChronicleObjectiveId, ChronicleObjectiveDefinition>
export const FIRST_FRONTIER_OBJECTIVE_IDS = CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === 'first-frontier').map((objective) => objective.id)
export const SHATTERED_FRONTIER_OBJECTIVE_IDS = CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === 'shattered-frontier').map((objective) => objective.id)

// Retained as a typed marker for future authored starting-Artifact variants.
export type ChronicleStartingArtifact = ArtifactId
export type ChronicleStartingSchool = SchoolId

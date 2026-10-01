import type { ArtifactId, ChronicleChapterId, ChronicleEventId, ChronicleObjectiveId, ChronicleTrack, CrystalVariantId, CombatLocationId, GuildRankId, ItemId, MonsterId, ScreenId, SchoolId, SigilQuality, SigilSetId, SigilTier, WorldTierId } from '../../types'
import { SIGIL_SETS, SIGIL_SET_IDS } from '../sigils/sigilSets'

export type ChronicleCondition =
  | { type: 'starting-school-selected' }
  | { type: 'lifetime-kills'; count: number }
  | { type: 'boss-kill'; bossId: MonsterId; count: number }
  | { type: 'all-boss-kills'; bossIds: MonsterId[] }
  | { type: 'dungeon-entered'; locationId: CombatLocationId }
  | { type: 'auto-cast-enabled' }
  | { type: 'channeling-acolytes'; count: number }
  | { type: 'chronicle-event'; eventId: ChronicleEventId }
  | { type: 'school-level'; school: 'starting'; level: number }
  | { type: 'artifact-invested-ranks'; artifact: 'starting'; ranks: number }
  | { type: 'guild-request-claimed'; count: number }
  | { type: 'guild-rank'; rank: GuildRankId }
  | { type: 'guild-commissions-completed'; count: number }
  | { type: 'registry-items-registered'; count: number }
  | { type: 'hunters-order-unlocked' }
  | { type: 'hunter-contracts-completed'; count: number }
  | { type: 'hunter-contracts-accepted'; count: number }
  | { type: 'guild-project-completed'; projectId: string }
  | { type: 'guild-registry-sets-completed'; count: number }
  | { type: 'guild-points-spent'; count: number }
  | { type: 'hunter-upgrades-purchased'; count: number }
  | { type: 'guardian-selected' }
  | { type: 'guardian-combat-completed' }
  | { type: 'crystal-equipped'; count: number }
  | { type: 'arcane-core-invested-nodes'; count: number }
  | { type: 'spell-loadout-slots'; count: number }
  | { type: 'world-tier-kill'; tier: WorldTierId; count: number }
  | { type: 'sigil-obtained'; count: number }
  | { type: 'sigil-equipped'; count: number }
  | { type: 'sigil-rank-at-least'; rank: number }
  | { type: 'sigil-secondary-rolls'; count: number }
  | { type: 'sigil-set-active'; setId: SigilSetId; pieces: number }
  | { type: 'sigil-quality-found'; quality: SigilQuality }
  | { type: 'sigil-tier-found'; tier: SigilTier }
  | { type: 'sigil-traits-unlocked'; count: number }
  | { type: 'sigil-set-discovered'; setId: SigilSetId }

export type ChronicleReward =
  | { type: 'item'; itemId: ItemId; quantity: number }
  | { type: 'crystal'; variantId: CrystalVariantId; quantity: number }
  | { type: 'arcane-points'; amount: number }

export interface ChronicleChapterDefinition {
  id: ChronicleChapterId
  name: string
  description: string
  order: number
  unlockCondition?: ChronicleCondition
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
  { id: 'first-frontier', name: 'First Frontier', description: 'Establish the Tower, master the first schools, and earn the Arcane Guild’s invitation.', order: 1 },
  { id: 'shattered-frontier', name: 'Shattered Frontier', description: 'Push beyond the first gate, bind a Guardian, and survive a world that no longer stays still.', order: 2, unlockCondition: { type: 'boss-kill', bossId: 'archmage-edrin-shade', count: 1 } },
]

const SIGIL_CHRONICLE_OBJECTIVES: ChronicleObjectiveDefinition[] = SIGIL_SET_IDS.flatMap((setId) => {
  const set = SIGIL_SETS[setId]
  return [
    { id: `sigil-${setId}-discovered` as ChronicleObjectiveId, chapterId: 'first-frontier', track: 'equipment', title: `Archive the ${set.name} Set`, description: `Discover the ${set.name} Sigil Set.`, condition: { type: 'sigil-set-discovered', setId }, navigateTo: 'tower-artificing', optional: true },
    { id: `sigil-${setId}-active` as ChronicleObjectiveId, chapterId: 'first-frontier', track: 'equipment', title: `Activate ${set.name}`, description: `Equip enough ${set.name} Sigils to activate the Set bonus.`, condition: { type: 'sigil-set-active', setId, pieces: set.piecesRequired }, navigateTo: 'tower-artificing', optional: true },
  ]
})

export const CHRONICLE_OBJECTIVES: readonly ChronicleObjectiveDefinition[] = [
  { id: 'm1-choose-school', chapterId: 'first-frontier', track: 'main', title: 'Choose Your School', description: 'Choose the Magic School that will shape your first frontier.', condition: { type: 'starting-school-selected' }, navigateTo: 'schools' },
  { id: 'm1a-enter-elemental-counter-zone', chapterId: 'first-frontier', track: 'main', title: 'Enter Your Counter Zone', description: 'Enter the elemental frontier your school has the advantage against.', prerequisiteIds: ['m1-choose-school'], condition: { type: 'chronicle-event', eventId: 'starting-counter-zone-entered' }, navigateTo: 'combat' },
  { id: 'm1b-exploit-elemental-weakness', chapterId: 'first-frontier', track: 'main', title: 'Exploit an Elemental Weakness', description: 'Land a strong elemental hit in your tutorial frontier.', prerequisiteIds: ['m1a-enter-elemental-counter-zone'], condition: { type: 'chronicle-event', eventId: 'first-elemental-weakness-hit' }, navigateTo: 'combat' },
  { id: 'm2-first-blood', chapterId: 'first-frontier', track: 'main', title: 'First Blood', description: 'Defeat your first enemy and begin the real work of the Tower.', prerequisiteIds: ['m1b-exploit-elemental-weakness'], condition: { type: 'lifetime-kills', count: 1 }, navigateTo: 'combat' },
  { id: 'm2a-elemental-frontier', chapterId: 'first-frontier', track: 'main', title: 'Open the Elemental Frontier', description: 'Defeat a tutorial frontier enemy to open the other elemental zones.', prerequisiteIds: ['m2-first-blood'], condition: { type: 'chronicle-event', eventId: 'elemental-tutorial-zones-opened' }, navigateTo: 'combat' },
  { id: 'm2b-equip-elemental-ward', chapterId: 'first-frontier', track: 'main', title: 'Prepare an Elemental Ward', description: 'Add your school’s Elemental Ward to the selected combat preset.', prerequisiteIds: ['m2a-elemental-frontier'], condition: { type: 'chronicle-event', eventId: 'first-elemental-ward-equipped' }, navigateTo: 'schools' },
  { id: 'm2c-test-elemental-ward', chapterId: 'first-frontier', track: 'main', title: 'Test the Ward', description: 'Reduce matching elemental damage with your Ward.', prerequisiteIds: ['m2b-equip-elemental-ward'], condition: { type: 'chronicle-event', eventId: 'first-elemental-ward-mitigation' }, navigateTo: 'combat' },
  { id: 'm2d-defeat-elemental-boss', chapterId: 'first-frontier', track: 'main', title: 'Defeat an Elemental Boss', description: 'Defeat the boss of any elemental tutorial frontier.', prerequisiteIds: ['m2c-test-elemental-ward'], condition: { type: 'chronicle-event', eventId: 'first-elemental-tutorial-boss-defeated' }, navigateTo: 'combat' },
  { id: 'm3-heart-of-the-woods', chapterId: 'first-frontier', track: 'main', title: 'Heart of the Woods', description: 'Defeat Forest Heart in Whispering Woods.', prerequisiteIds: ['m2d-defeat-elemental-boss'], condition: { type: 'boss-kill', bossId: 'forest-heart', count: 1 }, navigateTo: 'combat' },
  { id: 'm4-break-the-den', chapterId: 'first-frontier', track: 'main', title: 'Break the Den', description: 'Defeat Corrupted Greatbear in Howling Den.', prerequisiteIds: ['m3-heart-of-the-woods'], condition: { type: 'boss-kill', bossId: 'corrupted-greatbear', count: 1 }, navigateTo: 'combat' },
  { id: 'm5-fallen-archmage', chapterId: 'first-frontier', track: 'main', title: 'The Fallen Archmage', description: "Defeat Archmage Edrin's Shade in the Abandoned Catacombs.", prerequisiteIds: ['m4-break-the-den'], condition: { type: 'boss-kill', bossId: 'archmage-edrin-shade', count: 1 }, navigateTo: 'combat' },

  { id: 'c1-enter-whispering-woods', chapterId: 'first-frontier', track: 'combat', title: 'Enter Whispering Woods', description: 'Enter Whispering Woods at least once.', prerequisiteIds: ['m1-choose-school'], condition: { type: 'dungeon-entered', locationId: 'whispering-woods' }, navigateTo: 'combat' },
  { id: 'c2-auto-cast', chapterId: 'first-frontier', track: 'combat', title: 'Let the Spellbook Work', description: 'Enable Auto-Cast for at least one Spell.', prerequisiteIds: ['c1-enter-whispering-woods'], condition: { type: 'auto-cast-enabled' }, navigateTo: 'schools', optional: true },

  { id: 'mg1-strengthen-artifact', chapterId: 'first-frontier', track: 'magic', title: 'Strengthen Your Artifact', description: 'Purchase one minor rank on your starting Artifact.', prerequisiteIds: ['m2-first-blood'], condition: { type: 'artifact-invested-ranks', artifact: 'starting', ranks: 1 }, navigateTo: 'equipment' },
  { id: 'mg2-expand-spellbook', chapterId: 'first-frontier', track: 'magic', title: 'Expand Your Spellbook', description: 'Raise your starting School to Level 17.', unlockAnyPrerequisiteIds: ['mg1-strengthen-artifact', 'm3-heart-of-the-woods'], condition: { type: 'school-level', school: 'starting', level: 17 }, navigateTo: 'schools' },
  { id: 'mg3-four-spell-arsenal', chapterId: 'first-frontier', track: 'magic', title: 'Four-Spell Arsenal', description: 'Fill at least four real Spell slots in the active loadout.', prerequisiteIds: ['mg2-expand-spellbook'], condition: { type: 'spell-loadout-slots', count: 4 }, navigateTo: 'schools', optional: true },

  { id: 't1-channeling-acolyte', chapterId: 'first-frontier', track: 'tower', title: 'Put an Acolyte to Work', description: 'Assign at least one Acolyte to Channeling.', prerequisiteIds: ['m2-first-blood'], condition: { type: 'channeling-acolytes', count: 1 }, navigateTo: 'tower-channeling' },
  { id: 't2-shape-resonance', chapterId: 'first-frontier', track: 'tower', title: 'Shape Resonance', description: 'Complete your first Fragment Transmutation cycle.', prerequisiteIds: ['t1-channeling-acolyte'], condition: { type: 'chronicle-event', eventId: 'first-fragment-transmuted' }, navigateTo: 'tower-transmutation' },
  { id: 't3-study-the-fragment', chapterId: 'first-frontier', track: 'tower', title: 'Study the Fragment', description: 'Complete your first Research batch.', prerequisiteIds: ['t2-shape-resonance'], condition: { type: 'chronicle-event', eventId: 'first-research-batch-completed' }, navigateTo: 'tower-research' },
  { id: 't4-answer-verdant-circle', chapterId: 'first-frontier', track: 'tower', title: 'Focus an Arcane Core Node', description: 'Invest your first Arcane Core node.', prerequisiteIds: ['t3-study-the-fragment', 'm3-heart-of-the-woods'], condition: { type: 'arcane-core-invested-nodes', count: 1 }, navigateTo: 'arcane-core' },
  { id: 't5-read-a-sigil', chapterId: 'first-frontier', track: 'tower', title: 'Read the Arcane Sigils', description: 'Earn your first combat-born Sigil.', prerequisiteIds: ['m2-first-blood'], condition: { type: 'chronicle-event', eventId: 'first-sigil-earned' }, navigateTo: 'tower-artificing', optional: true },

  { id: 'g1-join-verdant-circle', chapterId: 'first-frontier', track: 'guild', title: 'Join the Arcane Guild', description: 'Open the Registry and begin your Guild advancement.', prerequisiteIds: ['m3-heart-of-the-woods'], condition: { type: 'guild-rank', rank: 'initiate' }, navigateTo: 'arcane-guild' },
  { id: 'g2-first-guild-contract', chapterId: 'first-frontier', track: 'guild', title: 'Commissioned Work', description: 'Complete your first Arcane Guild Commission.', prerequisiteIds: ['g1-join-verdant-circle'], condition: { type: 'guild-commissions-completed', count: 1 }, navigateTo: 'arcane-guild' },
  { id: 'g3-guild-apprentice', chapterId: 'first-frontier', track: 'guild', title: 'Record the First Discovery', description: 'Register an item in the Arcane Registry.', prerequisiteIds: ['g1-join-verdant-circle'], condition: { type: 'registry-items-registered', count: 1 }, navigateTo: 'arcane-guild' },
  { id: 'g4-hunters-calling', chapterId: 'first-frontier', track: 'guild', title: 'The Hunter’s Calling', description: 'Defeat Corrupted Greatbear and unlock the Hunter’s Order.', prerequisiteIds: ['m4-break-the-den'], condition: { type: 'hunters-order-unlocked' }, navigateTo: 'hunters-order' },
  { id: 'g5-first-hunt-contract', chapterId: 'first-frontier', track: 'guild', title: 'Take the Field', description: 'Complete your first Hunt Contract.', prerequisiteIds: ['g4-hunters-calling'], condition: { type: 'hunter-contracts-completed', count: 1 }, navigateTo: 'hunters-order' },
  { id: 'g6-arcane-service', chapterId: 'first-frontier', track: 'guild', title: 'Arcane Service', description: 'Register three items in the Arcane Registry.', prerequisiteIds: ['g1-join-verdant-circle'], condition: { type: 'registry-items-registered', count: 3 }, navigateTo: 'arcane-guild' },
  { id: 'g7-professional-standing', chapterId: 'first-frontier', track: 'guild', title: 'Professional Standing', description: 'Complete two Arcane Guild Commissions.', prerequisiteIds: ['g2-first-guild-contract'], condition: { type: 'guild-commissions-completed', count: 2 }, navigateTo: 'arcane-guild' },
  { id: 'g8-guild-rank-two', chapterId: 'first-frontier', track: 'guild', title: 'Guild Rank II', description: 'Reach Apprentice standing in the Arcane Guild.', prerequisiteIds: ['g6-arcane-service', 'g7-professional-standing'], condition: { type: 'guild-rank', rank: 'apprentice' }, navigateTo: 'arcane-guild' },
  { id: 'g9-restore-guild-archive', chapterId: 'first-frontier', track: 'guild', title: 'Restore the Arcane Archive', description: 'Complete the permanent Arcane Archive Guild Project.', prerequisiteIds: ['g8-guild-rank-two'], condition: { type: 'guild-project-completed', projectId: 'restore-arcane-archive' }, navigateTo: 'arcane-guild', onCompleteReward: [{ type: 'arcane-points', amount: 100 }], optional: true },
  { id: 'g10-first-registry-set', chapterId: 'first-frontier', track: 'guild', title: 'Complete a Registry Collection', description: 'Finish one curated Arcane Registry set.', prerequisiteIds: ['g1-join-verdant-circle'], condition: { type: 'guild-registry-sets-completed', count: 1 }, navigateTo: 'arcane-guild', optional: true },
  { id: 'g11-invest-in-the-guild', chapterId: 'first-frontier', track: 'guild', title: 'Invest in the Guild', description: 'Spend an Advancement Point on a Guild skill.', prerequisiteIds: ['g1-join-verdant-circle'], condition: { type: 'guild-points-spent', count: 1 }, navigateTo: 'arcane-guild', optional: true },
  { id: 'g12-enter-gloamridge', chapterId: 'first-frontier', track: 'guild', title: 'Into Gloamridge', description: 'Enter Gloamridge Hunting Ground.', prerequisiteIds: ['g4-hunters-calling'], condition: { type: 'dungeon-entered', locationId: 'hunters-ground' }, navigateTo: 'combat', optional: true },
  { id: 'g13-accept-a-hunt', chapterId: 'first-frontier', track: 'guild', title: 'Take a Contract', description: 'Accept your first Hunt Contract.', prerequisiteIds: ['g4-hunters-calling'], condition: { type: 'hunter-contracts-accepted', count: 1 }, navigateTo: 'hunters-order', optional: true },
  { id: 'g14-hunter-training', chapterId: 'first-frontier', track: 'guild', title: 'Order Training', description: 'Purchase your first Hunter upgrade.', prerequisiteIds: ['g4-hunters-calling'], condition: { type: 'hunter-upgrades-purchased', count: 1 }, navigateTo: 'hunters-order', optional: true },

  { id: 'sf-m1-cross-fractured-approach', chapterId: 'shattered-frontier', track: 'main', title: 'Cross the Fractured Approach', description: 'Enter the first dungeon beyond the fallen Archmage.', prerequisiteIds: ['m5-fallen-archmage'], condition: { type: 'dungeon-entered', locationId: 'fractured-approach' }, navigateTo: 'combat' },
  { id: 'sf-m2-elemental-gatekeeper', chapterId: 'shattered-frontier', track: 'main', title: 'Break the Elemental Gatekeeper', description: 'Defeat the corrupted gatekeeper guarding the next frontier.', prerequisiteIds: ['sf-m1-cross-fractured-approach'], condition: { type: 'boss-kill', bossId: 'corrupted-elemental-gatekeeper', count: 1 }, navigateTo: 'combat' },
  { id: 'sf-m3-bind-guardian', chapterId: 'shattered-frontier', track: 'main', title: 'Bind a Guardian', description: 'Choose one elemental Guardian to accompany the Tower.', prerequisiteIds: ['sf-m2-elemental-gatekeeper'], condition: { type: 'guardian-selected' }, navigateTo: 'tower-summoning' },
  { id: 'sf-m3a-stabilize-elemental-scar', chapterId: 'shattered-frontier', track: 'main', title: 'Stabilize the Elemental Scar', description: 'Defeat the Drowned Keeper, Flamebound Revenant, and Rootscar Ancient.', prerequisiteIds: ['sf-m3-bind-guardian'], condition: { type: 'all-boss-kills', bossIds: ['drowned-keeper', 'flamebound-revenant', 'rootscar-ancient'] }, navigateTo: 'combat' },
  { id: 'sf-m3b-enter-crossroads', chapterId: 'shattered-frontier', track: 'main', title: 'Enter Crossroads of Ruin', description: 'The three regional victories have opened the road to the convergence.', prerequisiteIds: ['sf-m3a-stabilize-elemental-scar'], condition: { type: 'dungeon-entered', locationId: 'crossroads-of-ruin' }, navigateTo: 'combat' },
  { id: 'sf-m3c-crossroads-keeper', chapterId: 'shattered-frontier', track: 'main', title: 'Defeat the Crossroads Keeper', description: 'Defeat the keeper at the convergence to open Shattered Meridian.', prerequisiteIds: ['sf-m3b-enter-crossroads'], condition: { type: 'boss-kill', bossId: 'crossroads-keeper', count: 1 }, navigateTo: 'combat' },
  { id: 'sf-m3d-stabilize-shattered-meridian', chapterId: 'shattered-frontier', track: 'main', title: 'Stabilize the Shattered Meridian', description: 'Defeat the three powers anchoring the fractured Meridian.', prerequisiteIds: ['sf-m3c-crossroads-keeper'], condition: { type: 'all-boss-kills', bossIds: ['graveglass-behemoth', 'storm-archivist', 'fallen-astromancer'] }, navigateTo: 'combat' },
  { id: 'sf-m4-reach-meridian', chapterId: 'shattered-frontier', track: 'main', title: 'Reach the Broken Meridian', description: 'Enter the Broken Meridian and find the source of the fracture.', prerequisiteIds: ['sf-m3d-stabilize-shattered-meridian'], condition: { type: 'dungeon-entered', locationId: 'broken-meridian' }, navigateTo: 'combat' },
  { id: 'sf-m5-meridian-splitter', chapterId: 'shattered-frontier', track: 'main', title: 'Defeat the Meridian Splitter', description: 'Defeat the boss tearing the frontier apart.', prerequisiteIds: ['sf-m4-reach-meridian'], condition: { type: 'boss-kill', bossId: 'meridian-splitter', count: 1 }, navigateTo: 'combat' },
  { id: 'sf-m5a-break-black-sigil-reach', chapterId: 'shattered-frontier', track: 'main', title: 'Break Black Sigil Reach', description: 'Defeat Unspoken Prelate and Sigil Warden to open the Black Gate.', prerequisiteIds: ['sf-m5-meridian-splitter'], condition: { type: 'all-boss-kills', bossIds: ['unspoken-prelate', 'sigil-warden'] }, navigateTo: 'combat' },
  { id: 'sf-m5b-enter-black-gate', chapterId: 'shattered-frontier', track: 'main', title: 'Enter the Black Gate', description: 'Begin the fixed five-encounter run beyond Black Sigil Reach.', prerequisiteIds: ['sf-m5a-break-black-sigil-reach'], condition: { type: 'dungeon-entered', locationId: 'black-gate' }, navigateTo: 'combat' },
  { id: 'sf-m5c-black-gatekeeper', chapterId: 'shattered-frontier', track: 'main', title: 'Defeat the Black Gatekeeper', description: 'End the current current regional frontier by defeating the Gatekeeper.', prerequisiteIds: ['sf-m5b-enter-black-gate'], condition: { type: 'boss-kill', bossId: 'black-gatekeeper', count: 1 }, navigateTo: 'combat' },
  { id: 'sf-m6-world-tier-two', chapterId: 'shattered-frontier', track: 'combat', title: 'Step Into World Tier II', description: 'Defeat one enemy in World Tier II, unlocked by Archmage Edrin.', prerequisiteIds: ['m5-fallen-archmage'], condition: { type: 'world-tier-kill', tier: 2, count: 1 }, navigateTo: 'combat', optional: true },
  { id: 'sf-c1-world-tier-three', chapterId: 'shattered-frontier', track: 'combat', title: 'Test World Tier III', description: 'Defeat one enemy in World Tier III after defeating the Crossroads Keeper.', unlockCondition: { type: 'boss-kill', bossId: 'crossroads-keeper', count: 1 }, condition: { type: 'world-tier-kill', tier: 3, count: 1 }, navigateTo: 'combat', optional: true },
  { id: 'sf-c2-world-tier-four', chapterId: 'shattered-frontier', track: 'combat', title: 'Test World Tier IV', description: 'Defeat one enemy in World Tier IV after defeating the Meridian Splitter.', unlockCondition: { type: 'boss-kill', bossId: 'meridian-splitter', count: 1 }, condition: { type: 'world-tier-kill', tier: 4, count: 1 }, navigateTo: 'combat', optional: true },
  { id: 'sf-c3-world-tier-five', chapterId: 'shattered-frontier', track: 'combat', title: 'Test World Tier V', description: 'Defeat one enemy in World Tier V after unlocking it from the Black Gatekeeper.', unlockCondition: { type: 'boss-kill', bossId: 'black-gatekeeper', count: 1 }, condition: { type: 'world-tier-kill', tier: 5, count: 1 }, navigateTo: 'combat', optional: true },

  { id: 'sf-bind-guardian', chapterId: 'shattered-frontier', track: 'magic', title: 'Guardian Bond', description: 'Choose one elemental Guardian.', unlockCondition: { type: 'boss-kill', bossId: 'corrupted-elemental-gatekeeper', count: 1 }, condition: { type: 'guardian-selected' }, navigateTo: 'tower-summoning', optional: true },
  { id: 'sf-fight-together', chapterId: 'shattered-frontier', track: 'magic', title: 'Fight Together', description: 'Complete one valid encounter with an active Guardian.', prerequisiteIds: ['sf-bind-guardian'], condition: { type: 'guardian-combat-completed' }, navigateTo: 'combat', onCompleteReward: [{ type: 'arcane-points', amount: 250 }] },
  { id: 'sf-socket-first-crystal', chapterId: 'shattered-frontier', track: 'magic', title: 'Socket Your First Crystal', description: 'Equip at least one Crystal.', unlockCondition: { type: 'boss-kill', bossId: 'meridian-splitter', count: 1 }, condition: { type: 'crystal-equipped', count: 1 }, navigateTo: 'crystals', onUnlockReward: [{ type: 'crystal', variantId: 'force-t1', quantity: 1 }] },
  ...SIGIL_CHRONICLE_OBJECTIVES,
]

export const CHRONICLE_OBJECTIVE_BY_ID = Object.fromEntries(CHRONICLE_OBJECTIVES.map((objective) => [objective.id, objective])) as Record<ChronicleObjectiveId, ChronicleObjectiveDefinition>
export const FIRST_FRONTIER_OBJECTIVE_IDS = CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === 'first-frontier').map((objective) => objective.id)
export const SHATTERED_FRONTIER_OBJECTIVE_IDS = CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === 'shattered-frontier').map((objective) => objective.id)

// Retained as a typed marker for future authored starting-Artifact variants.
export type ChronicleStartingArtifact = ArtifactId
export type ChronicleStartingSchool = SchoolId

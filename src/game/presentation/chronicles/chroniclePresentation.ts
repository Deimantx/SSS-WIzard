import { COMBAT_LOCATIONS } from '../../content/combat-locations/worldNavigation'
import { getCrystalVariantName } from '../../content/crystals/crystals'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { SCHOOLS } from '../../content/schools/schools'
import { formatReadableId } from '../content/balanceFormatters'
import type { ChronicleCondition, ChronicleObjectiveDefinition, ChronicleReward } from '../../content/chronicles/chronicles'
import type { GameState, GuildRankId } from '../../types'
import { getChronicleConditionValue } from '../../systems/chronicles/chronicleRuntime'

export interface ChronicleConditionProgress {
  label: string
  current: number
  target: number
  complete: boolean
}

const rankLabel = (rank: GuildRankId) => formatReadableId(rank)

export const formatChronicleCondition = (condition: ChronicleCondition): string => {
  switch (condition.type) {
    case 'starting-school-selected': return 'Choose a Magic School'
    case 'lifetime-kills': return `Defeat ${condition.count} ${condition.count === 1 ? 'enemy' : 'enemies'}`
    case 'boss-kill': return `Defeat ${MONSTERS[condition.bossId]?.name ?? formatReadableId(condition.bossId)}`
    case 'all-boss-kills': return condition.bossIds.includes('graveglass-behemoth') && condition.bossIds.includes('storm-archivist') && condition.bossIds.includes('fallen-astromancer') ? 'Defeat the Meridian Anchors' : `Defeat ${condition.bossIds.map((id) => MONSTERS[id]?.name ?? formatReadableId(id)).join(', ')}`
    case 'dungeon-entered': return `Enter ${COMBAT_LOCATIONS[condition.locationId]?.name ?? formatReadableId(condition.locationId)}`
    case 'auto-cast-enabled': return 'Enable Auto-Cast for one Spell'
    case 'channeling-acolytes': return `Assign ${condition.count} Acolyte${condition.count === 1 ? '' : 's'} to Channeling`
    case 'chronicle-event': return formatReadableId(condition.eventId)
    case 'school-level': return `Reach Level ${condition.level} in your starting School`
    case 'artifact-invested-ranks': return `Invest ${condition.ranks} rank${condition.ranks === 1 ? '' : 's'} in your starting Artifact`
    case 'guild-request-claimed': return `Claim ${condition.count} Guild Request${condition.count === 1 ? '' : 's'}`
    case 'guild-rank': return `Reach Guild Rank ${rankLabel(condition.rank)}`
    case 'guild-commissions-completed': return `Complete ${condition.count} Guild Commission${condition.count === 1 ? '' : 's'}`
    case 'registry-items-registered': return `Register ${condition.count} item${condition.count === 1 ? '' : 's'} in the Arcane Registry`
    case 'hunters-order-unlocked': return 'Unlock the Hunter’s Order'
    case 'hunter-contracts-completed': return `Complete ${condition.count} Hunt Contract${condition.count === 1 ? '' : 's'}`
    case 'hunter-contracts-accepted': return `Accept ${condition.count} Hunt Contract${condition.count === 1 ? '' : 's'}`
    case 'guild-project-completed': return `Complete the ${formatReadableId(condition.projectId)} Guild Project`
    case 'guild-registry-sets-completed': return `Complete ${condition.count} Arcane Registry Set${condition.count === 1 ? '' : 's'}`
    case 'guild-points-spent': return `Spend ${condition.count} Guild Advancement Point${condition.count === 1 ? '' : 's'}`
    case 'hunter-upgrades-purchased': return `Purchase ${condition.count} Hunter upgrade${condition.count === 1 ? '' : 's'}`
    case 'guardian-selected': return 'Select an elemental Guardian'
    case 'guardian-combat-completed': return 'Complete an encounter with an active Guardian'
    case 'crystal-equipped': return `Equip ${condition.count} Crystal${condition.count === 1 ? '' : 's'}`
    case 'arcane-core-invested-nodes': return `Invest in ${condition.count} Arcane Core node${condition.count === 1 ? '' : 's'}`
    case 'spell-loadout-slots': return `Fill ${condition.count} Spell slots`
    case 'world-tier-kill': return `Defeat ${condition.count} ${condition.count === 1 ? 'enemy' : 'enemies'} in World Tier ${condition.tier}`
    case 'sigil-obtained': return `Earn ${condition.count} Sigil${condition.count === 1 ? '' : 's'}`
    case 'sigil-equipped': return `Equip ${condition.count} Sigil${condition.count === 1 ? '' : 's'}`
    case 'sigil-rank-at-least': return `Reach Sigil Rank +${condition.rank}`
    case 'sigil-secondary-rolls': return `Reach ${condition.count} Sigil secondary roll${condition.count === 1 ? '' : 's'}`
    case 'sigil-set-active': return `Activate the ${formatReadableId(condition.setId)} Set with ${condition.pieces} pieces`
    case 'sigil-quality-found': return `Find a ${formatReadableId(condition.quality)} Sigil`
    case 'sigil-tier-found': return `Reach Sigil Tier ${condition.tier}`
    case 'sigil-traits-unlocked': return `Unlock ${condition.count} Sigil Trait${condition.count === 1 ? '' : 's'}`
    case 'sigil-set-discovered': return `Discover the ${formatReadableId(condition.setId)} Set`
  }
}

export const getChronicleConditionProgressForCondition = (state: GameState, condition: ChronicleCondition): ChronicleConditionProgress => {
  const { current, target } = getChronicleConditionValue(state, condition)
  return { label: formatChronicleCondition(condition), current, target, complete: current >= target }
}

export const getChronicleConditionProgress = (state: GameState, objective: ChronicleObjectiveDefinition): ChronicleConditionProgress => getChronicleConditionProgressForCondition(state, objective.condition)

export const formatChronicleReward = (reward: ChronicleReward): string => {
  if (reward.type === 'arcane-points') return `${reward.amount.toLocaleString()} Arcane Points`
  if (reward.type === 'crystal') return `${reward.quantity} × ${getCrystalVariantName(reward.variantId)}`
  return `${reward.quantity} × ${ITEMS[reward.itemId]?.name ?? formatReadableId(reward.itemId)}`
}

export const getChronicleRewardSummary = (objective: ChronicleObjectiveDefinition) => [
  ...(objective.onUnlockReward ?? []).map((reward) => `Unlock: ${formatChronicleReward(reward)}`),
  ...(objective.onCompleteReward ?? []).map((reward) => `Complete: ${formatChronicleReward(reward)}`),
]

export const getChronicleConditionValueLabel = (progress: ChronicleConditionProgress) => progress.target <= 1 && progress.current <= 1 ? (progress.complete ? 'Complete' : 'In progress') : `${Math.min(progress.current, progress.target)} / ${progress.target}`

export const getChronicleSchoolLabel = (state: GameState) => state.progress.startingSchoolId ? SCHOOLS[state.progress.startingSchoolId].name : 'No school selected'

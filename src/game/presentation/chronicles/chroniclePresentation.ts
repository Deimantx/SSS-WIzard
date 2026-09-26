import { DUNGEONS } from '../../content/dungeons/dungeons'
import { getCrystalVariantName } from '../../content/crystals/crystals'
import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { SCHOOLS } from '../../content/schools/schools'
import { formatReadableId } from '../../content/presentation/balanceFormatters'
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
    case 'dungeon-entered': return `Enter ${DUNGEONS[condition.dungeonId]?.name ?? formatReadableId(condition.dungeonId)}`
    case 'auto-cast-enabled': return 'Enable Auto-Cast for one Spell'
    case 'channeling-acolytes': return `Assign ${condition.count} Acolyte${condition.count === 1 ? '' : 's'} to Channeling`
    case 'chronicle-event': return formatReadableId(condition.eventId)
    case 'school-level': return `Reach Level ${condition.level} in your starting School`
    case 'artifact-invested-ranks': return `Invest ${condition.ranks} rank${condition.ranks === 1 ? '' : 's'} in your starting Artifact`
    case 'guild-request-claimed': return `Claim ${condition.count} Guild Request${condition.count === 1 ? '' : 's'}`
    case 'guild-rank': return `Reach Guild Rank ${rankLabel(condition.rank)}`
    case 'guardian-selected': return 'Select an elemental Guardian'
    case 'guardian-combat-completed': return 'Complete an encounter with an active Guardian'
    case 'crystal-equipped': return `Equip ${condition.count} Crystal${condition.count === 1 ? '' : 's'}`
    case 'arcane-core-invested-nodes': return `Invest in ${condition.count} Arcane Core node${condition.count === 1 ? '' : 's'}`
    case 'spell-loadout-slots': return `Fill ${condition.count} Spell slots`
    case 'world-tier-kill': return `Defeat ${condition.count} ${condition.count === 1 ? 'enemy' : 'enemies'} in World Tier ${condition.tier}`
  }
}

export const getChronicleConditionProgress = (state: GameState, objective: ChronicleObjectiveDefinition): ChronicleConditionProgress => {
  const { current, target } = getChronicleConditionValue(state, objective.condition)
  return { label: formatChronicleCondition(objective.condition), current, target, complete: current >= target }
}

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

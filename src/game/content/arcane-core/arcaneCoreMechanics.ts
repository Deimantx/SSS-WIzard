import type { ArcaneCoreBranchId, ArcaneCoreNodeDefinition, ArcaneCoreNodeType, ArcaneCoreRingIndex, ArcaneCoreSpecialEffect } from '../../types'
import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from './arcaneCoreBranches'

export type ArcaneCoreMechanicRuntimeKind = 'cast-modifier' | 'combat-event' | 'timeline' | 'resource' | 'survival' | 'static-extra'

export interface ArcaneCoreMechanicDefinition {
  mechanicId: string
  branch: ArcaneCoreBranchId
  ring: ArcaneCoreRingIndex
  slot: `S${5 | 6 | 7 | 8}` | 'M'
  name: string
  nodeId: string
  nodeType: ArcaneCoreNodeType
  runtime: { kind: ArcaneCoreMechanicRuntimeKind; handler: string }
  describeRank: (rank: number) => string[]
}

const getMarker = (node: ArcaneCoreNodeDefinition): Extract<ArcaneCoreSpecialEffect, { type: 'arcane-core-mechanic' }> | undefined => {
  const effect = node.resolveEffects(1).special?.find((entry) => entry.type === 'arcane-core-mechanic')
  return effect?.type === 'arcane-core-mechanic' ? effect : undefined
}
const lastPart = (value: string) => value.split(':').pop() ?? value
const rankIndex = (rank: number, length: number) => Math.max(0, Math.min(length - 1, Math.floor(rank) - 1))
const atRank = <T>(values: readonly T[], rank: number) => values[rankIndex(rank, values.length)]
const pct = (values: readonly number[], rank: number, digits = 1) => `${Number(atRank(values, rank).toFixed(digits))}%`
const manaValue = (values: readonly number[], rank: number) => `${atRank(values, rank)} Mana`
const pp = (values: readonly number[], rank: number) => {
  const value = atRank(values, rank)
  return `${value} percentage point${value === 1 ? '' : 's'}`
}

type ArcaneCoreMechanicDescriptor = (rank: number) => string[]
type ArcaneCoreMechanicDescriptorMap = Partial<Record<string, ArcaneCoreMechanicDescriptor>>

const power: ArcaneCoreMechanicDescriptorMap = {
  Opportunist: r => [`After you apply a Negative Status, the next damaging Spell deals +${pct([1,2,3,4,5],r)} Damage. Consumed by that damaging Spell; does not stack.`],
  Finisher: r => [`Damaging Spells deal +${pct([1,2,3,4,5],r)} Damage while the enemy is below 25% Health.`],
  'Opening Volley': r => [`The first damaging Spell of each encounter deals +${pct([1,2,3,4,5],r)} Damage.`],
  'Mana Edge': r => [`While above 80% Mana, damaging Spells deal +${pct([0.5,1,1.5,2,2.5],r)} Damage.`],
  'Arcane Rhythm': () => ['Every 5th successful damaging Spell deals +10% Damage.'],
  'Critical Recovery': r => [`A direct Spell Crit restores ${manaValue([1,2,3,4,5],r)}. Internal cooldown: 750 ms.`],
  'Marked Precision': r => [`Against a Controlled enemy, damaging Spells gain +${pp([0.2,0.4,0.6,0.8,1],r)} Crit Chance.`],
  'Second Chance': r => [`After a damaging Spell fails to Crit, the next damaging Spell gains +${pp([0.2,0.4,0.6,0.8,1],r)} Crit Chance. Consumed by the next damaging Spell; does not guarantee a Crit.`],
  'Perfect Window': r => [`While the enemy is above 90% Health, Spells gain +${pct([2,4,6,8,10],r)} Crit Damage.`],
  'Perfect Precision': () => ['After 2 consecutive damaging Spells fail to Crit, the next damaging Spell gains +15 percentage points Crit Chance. The bonus does not guarantee a Crit; the miss counter resets after the empowered attempt or a Crit.'],
  'Spell Sequence': r => [`Casting 3 different damaging Spells in succession causes the third to deal +${pct([3,6,9,12,15],r)} Damage. Repeating a Spell before the third resets the sequence.`],
  'Arcane Momentum': r => [`Every 4th damaging Spell deals +${pct([3,6,9,12,15],r)} Damage.`],
  'Rapid Escalation': r => [`If a damaging Spell resolves within 3 seconds of the previous successful Spell, it deals +${pct([2,4,6,8,10],r)} Damage.`],
  'Debuff Assault': r => [`Against an enemy with at least 2 Negative Statuses, damaging Spells deal +${pct([1,2,3,4,5],r)} Damage.`],
  'Arcane Overload': () => ['Every 6th successful damaging Spell repeats 15% of its direct damage as a separate Arcane hit. The echo cannot Crit, does not count as another cast, and cannot trigger itself.'],
  'Kill Surge': r => [`Defeating an enemy reduces all remaining Spell cooldowns by ${atRank([100,200,300,400,500],r)} ms.`],
  'Burst Window': r => [`When one of your Spell cooldowns completes naturally, the next damaging Spell deals +${pct([2,4,6,8,10],r)} Damage. One prepared Burst Window at a time; consumed on use.`],
  'Aggressive Rotation': r => [`After casting 4 different Spells without repeating, the next Spell gains +${pct([2,4,6,8,10],r)} Action Speed. Repeating a Spell resets the sequence.`],
  'Cooldown Punisher': r => [`A Spell with a base cooldown of at least 20 seconds deals +${pct([2,4,6,8,10],r)} Damage.`],
  'Perfect Execution': () => ['Against enemies below 20% Health, damaging Spells deal +10% Damage. If the Spell kills the enemy, reduce all remaining Spell cooldowns by 500 ms.'],
  'Burning Momentum': r => [`Each DoT damage tick grants 1 Ruin stack, up to 5. The next direct damaging Spell consumes all stacks and gains +${pct([1,2,3,4,5],r)} Damage per stack. Maximum at Rank 5: +25% Damage.`],
  'Detonation Theory': r => [`When your Spell consumes or removes one of your own damaging periodic Statuses before it expires naturally, that Spell deals +${pct([3,6,9,12,15],r)} Damage.`],
  'Lingering Execution': r => [`Your DoT damage deals +${pct([2,4,6,8,10],r)} Damage while the enemy is below 35% Health.`],
  'Deep Wounds': r => [`A damaging Spell that applies a damaging periodic Status to an already-debuffed enemy gains +${pct([2,4,6,8,10],r)} Effect Damage for that periodic effect.`],
  'Unstable Power': () => ['Every 5th successful damaging Spell gains +30% Damage and +15% final Mana Cost. A free Spell still receives the Damage bonus.'],
  Overcast: r => [`A Spell costing at least 15% Max Mana deals +${pct([3,6,9,12,15],r)} Damage.`],
  'Mana Burn': r => [`If the Spell's final Mana cost leaves you below 20% Mana, that damaging Spell deals +${pct([2,4,6,8,10],r)} Damage. Uses projected post-cost Mana.`],
  'Cataclysmic Reserve': r => [`Spending at least 15% Max Mana on one Spell prepares the next damaging Spell with +${pp([1,2,3,4,5],r)} Crit Chance. Consumed by the next damaging Spell.`],
  'Critical Cataclysm': r => [`A direct Crit from a Spell costing at least 15% Max Mana reduces that Spell's remaining cooldown by ${atRank([200,400,600,800,1000],r)} ms after the cooldown starts.`],
  Cataclysm: () => ['The first Spell each encounter costing at least 15% Max Mana gains +30% Damage, costs +15% Mana, and starts its cooldown with 15% already recovered. Once per encounter.'],
  'Sovereign Sequence': r => [`Casting 5 different Spells without repeating causes the fifth damaging Spell to deal +${pct([4,8,12,16,20],r)} Damage.`],
  'First Blood': r => [`The first damaging Spell against each enemy deals +${pct([4,8,12,16,20],r)} Damage.`],
  'Last Word': r => [`The first damaging Spell to hit an enemy below 20% Health deals +${pct([4,8,12,16,20],r)} Damage. Once per enemy.`],
  'Dominating Weakness': r => [`Against enemies with at least 3 Negative Statuses, damaging Spells deal +${pct([2,4,6,8,10],r)} Damage.`],
  'Sovereign Casting': () => ['Each encounter begins with 3 Sovereignty charges. A damaging Spell consumes one charge and deals +12% Damage. A direct Crit does not consume a charge.'],
  'Perfect Cycle': r => [`Every 4th damaging Spell deals +${pct([6,12,18,24,30],r)} Damage.`],
  'Arcane Echo': r => [`Every 6th successful damaging Spell creates a separate Arcane hit for ${pct([5,10,15,20,25],r)} of its direct damage. It cannot Crit, count as a cast, or trigger Arcane Echo.`],
  'Apotheosis Execution': r => [`Damaging Spells deal +${pct([3,6,9,12,15],r)} Damage against enemies below 20% Health.`],
  'Limit Break': () => ['Once per encounter, the first Spell costing at least 20% Max Mana refunds 25% of its final Mana cost after completion.'],
  'Arcane Apotheosis': () => ['After 8 successful damaging Spells in one encounter, enter Apotheosis for 6 seconds: +20% Damage, -15% Mana Cost, and +10% Action Speed. Once per encounter.'],
}

const vitality: ArcaneCoreMechanicDescriptorMap = {
  'Second Skin': r => [`While above 80% Health, gain +${atRank([2,4,6,8,10],r)} Defense.`],
  'Emergency Pulse': r => [`When Barrier breaks while you are below 50% Health, heal ${pct([1,1.5,2,2.5,3],r)} Max Health. Internal cooldown: 8 seconds.`],
  'Recovery Window': r => [`After taking Health damage, gain +${pct([1,2,3,4,5],r)} Healing Received for 3 seconds. Reapplying refreshes the duration; it does not stack.`],
  'Victory Recovery': r => [`Defeating an enemy heals ${pct([0.5,1,1.5,2,2.5],r)} Max Health.`],
  'Second Wind': () => ['The first time each encounter Health falls below 30%, heal 5% Max Health. Once per encounter.'],
  Stonewall: r => [`While Barrier is active, gain +${atRank([2,4,6,8,10],r)} Defense.`],
  'Barrier Recovery': r => [`When Barrier breaks, heal ${pct([1,1.5,2,2.5,3],r)} Max Health.`],
  'Guarded Recovery': r => [`Taking Health damage restores ${pct([1,2,3,4,5],r)} Max Mana. Internal cooldown: 3 seconds.`],
  'Low Health Guard': r => [`While below 25% Health, gain +${pct([1,2,3,4,5],r)} Healing Received.`],
  Unyielding: () => ['While below 50% Health, take 5% less Health damage. Damage already absorbed by Barrier is not reduced by this Major.'],
  'Reactive Ward': r => [`Taking Health damage while you have no Barrier grants Barrier equal to ${pct([0.5,1,1.5,2,2.5],r)} Max Health.`],
  'Ward Renewal': r => [`Gaining Barrier from a non-conversion source heals ${pct([0.2,0.4,0.6,0.8,1],r)} Max Health. Internal cooldown: 2 seconds.`],
  'Barrier Memory': r => [`When Barrier breaks, for 8 seconds your next Barrier gained is increased by ${pct([5,10,15,20,25],r)}. Consumed by that Barrier gain.`],
  'Stable Protection': r => [`Barrier gained from a non-conversion source is increased by ${pct([1,2,3,4,5],r)}. Conversion-generated Barrier is excluded to prevent loops.`],
  'Arcane Aegis': () => ["When Barrier breaks, gain replacement Barrier equal to 20% of the broken Barrier's original value. Internal cooldown: 10 seconds."],
  'Last Breath': r => [`The first time each encounter Health falls below 25%, your next Defensive Spell gains +${pct([2,4,6,8,10],r)} Action Speed.`],
  'Emergency Aegis': r => [`When Health falls below 20% while you have no Barrier, gain Barrier equal to ${pct([3,4,5,6,7],r)} Max Health. Internal cooldown: 10 seconds.`],
  'Recovery Surge': r => [`When you receive Healing while your Health before that heal was below 25%, also heal ${pct([0.5,1,1.5,2,2.5],r)} Max Health.`],
  'Survival Instinct': r => [`When Health damage leaves you below 10% Health, your next Defensive Spell gains +${pct([2,4,6,8,10],r)} Action Speed.`],
  'Living Bastion': () => ['While Barrier exists, 10% of effective Healing received is also added to Barrier, capped at 3% Max Health per healing event. Conversion-generated Barrier cannot trigger another conversion.'],
  'Layered Ward': r => [`Gaining Barrier from a non-conversion source also grants Barrier equal to ${pct([0.5,1,1.5,2,2.5],r)} Max Health. Internal cooldown: 3 seconds.`],
  'Ward Battery': r => [`When Barrier breaks, your next Healing action gains +${pct([1,2,3,4,5],r)} Action Speed. Consumed by that Healing action.`],
  'Bastion Cast': r => [`While Barrier exists, Defensive Spells cost ${pct([1,2,3,4,5],r)} less Mana.`],
  'Reinforced Recovery': r => [`When Barrier absorbs damage, gain +${pct([2,4,6,8,10],r)} Healing Received for 3 seconds. Reapplying refreshes the duration; it does not stack.`],
  Renewal: () => ['Every 12 seconds in combat: if below 50% Health, heal 4% Max Health; otherwise gain Barrier equal to 4% Max Health.'],
  'Regenerative Casting': r => [`A successful Defensive Spell heals ${pct([0.5,1,1.5,2,2.5],r)} Max Health. Internal cooldown: 2 seconds.`],
  'Healing Momentum': r => [`After effective Healing occurs, the next Defensive Spell gains +${pct([2,4,6,8,10],r)} Action Speed. Consumed on use.`],
  'Barrier Break Recovery': r => [`When Barrier breaks, heal ${pct([0.75,1.5,2.25,3,3.75],r)} Max Health.`],
  'Renewal Cycle': r => [`Healing or gaining Barrier prepares the next Defensive Spell with +${pct([1,2,3,4,5],r)} Action Speed. One prepared bonus at a time.`],
  'Refuse Death': () => ['The first time each encounter Health falls below 15%, gain Barrier equal to 10% Max Health. This does not negate lethal damage after the fact. Once per encounter.'],
  'Last Refuge': r => [`When Barrier breaks while you are below 15% Health, gain Barrier equal to ${pct([5,7.5,10,12.5,15],r)} Max Health. Once per encounter.`],
  'Defiant Casting': r => [`While below 35% Health, Defensive Spells gain +${pct([1,2,3,4,5],r)} Action Speed.`],
  'Pain Conversion': r => [`Taking Health damage restores Mana equal to ${pct([1,2,3,4,5],r)} of that Health damage. Internal cooldown: 1 second.`],
  Comeback: r => [`When Health rises from below 25% to at least 25%, the next Spell gains +${pct([2,4,6,8,10],r)} Action Speed. Internal cooldown: 5 seconds.`],
  Undying: () => ['Once per dungeon run, lethal damage instead leaves you at 1 Health, grants Barrier equal to 15% Max Health, and grants 40% Damage Reduction for 1.5 seconds.'],
  'Phoenix Pulse': r => [`The first time each encounter Health falls below 20%, heal ${pct([3,4,5,6,8],r)} Max Health.`],
  'Life Battery': r => [`Gaining Barrier stores ${pct([2,4,6,8,10],r)} of that Barrier amount. The stored amount is consumed by the next defensive conversion that can use it. Only one stored value at a time.`],
  'Unbroken Cycle': r => [`Gaining Barrier prepares the next Defensive Spell with +${pct([1,2,3,4,5],r)} Action Speed. Consumed on use.`],
  'Eternal Recovery': r => [`Effective Healing while below 50% Health also heals ${pct([0.5,1,1.5,2,2.5],r)} Max Health. Internal cooldown: 5 seconds.`],
  'Eternal Aegis': () => ['15% of effective Healing grants Barrier and 15% of effective Barrier gained heals you. Each conversion is capped at 3% Max Health per event. Conversion-generated effects cannot recursively trigger the opposite conversion.'],
}

const mana: ArcaneCoreMechanicDescriptorMap = {
  Conservation: r => [`Every 6th successful Spell restores ${manaValue([1,2,3,4,5],r)} after completion.`],
  'Emergency Flow': r => [`While below 25% Mana, gain +${pct([5,10,15,20,25],r)} Mana Regen.`],
  'Full Reservoir': r => [`While above 90% Mana, if you have not completed a Spell for 3 seconds, your next Spell costs ${pct([2,4,6,8,10],r)} less Mana. Consumed on use.`],
  'Quiet Mind': r => [`While below 30% Mana, restore ${pct([1,1.5,2,2.5,3],r)} Max Mana. Internal cooldown: 5 seconds.`],
  'Deep Breathing': () => ['The first time each encounter Mana falls below 25%, restore 10% Max Mana. Once per encounter. Does not grant a free cast.'],
  'Casting Harmony': r => [`Every 3rd AUTO Spell restores ${manaValue([1,2,3,4,5],r)}.`],
  'Manual Reservoir': r => [`A MANUAL Spell cast immediately after an AUTO Spell restores ${manaValue([1,2,3,4,5],r)}.`],
  'Alternating Mind': r => [`When cast mode changes between AUTO and MANUAL, the new cast gains +${pct([1,2,3,4,5],r)} Action Speed.`],
  'Efficient Queue': r => [`A MANUAL queued Spell costs ${pct([1,2,3,4,5],r)} less Mana.`],
  'Dual Mind': () => ['When AUTO resolves, the next MANUAL cast within 5 seconds gains 8% lower Mana Cost and +5% Action Speed. MANUAL applies the same prepared bonus to the next AUTO cast. Consumed on use; does not stack.'],
  'High Current': r => [`Above 70% Mana, damaging Spells deal +${pct([0.5,1,1.5,2,2.5],r)} Damage.`],
  'Low Tide': r => [`When a Spell leaves Mana below 30%, prepare the next Spell with +${pct([2,4,6,8,10],r)} Action Speed. One prepared bonus at a time.`],
  'Spell Cycle': r => [`Cast 3 different Spells in succession. When the third completes, restore ${manaValue([1,2,3,4,5],r)}. Repeating a Spell resets the sequence.`],
  'Prepared Slot': r => [`The first cast from each loadout slot in an encounter costs ${pct([1,2,3,4,5],r)} less Mana.`],
  'Arcane Recirculation': () => ['Every 10th successful Spell refunds 50% of its final Mana cost after completion. The Spell must still have enough Mana to begin normally.'],
  'Overflow Ward': r => [`Excess Mana restoration is converted to Barrier at ${pct([10,15,20,25,30],r,0)} conversion value, capped at 3% Max Health per cast.`],
  'Mana to Tempo': r => [`When a single effect restores at least 5% Max Mana, the next Spell gains +${pct([1,2,3,4,5],r)} Action Speed. One prepared bonus at a time.`],
  'Stable Reserve': r => [`While above 75% Mana, Spells cost ${pct([1,2,3,4,5],r)} less Mana.`],
  'Emergency Conversion': r => [`While below 20% Mana, your next Spell restores ${pct([1,2,3,4,5],r)} Max Mana after completion. Consumed on use.`],
  Transcendence: () => ['Excess Mana restoration becomes Barrier at 50% conversion value, capped at 5% Max Health per cast. It does not convert overflow into cooldown reduction.'],
  'Balanced Mind': r => [`If the active loadout contains at least 2 AUTO slots and 2 MANUAL slots, gain +${pct([0.5,1,1.5,2,2.5],r)} Action Speed.`],
  'Manual Battery': r => [`MANUAL Spells restore ${manaValue([1,2,3,4,5],r)} after completion.`],
  'Convergent Queue': r => [`MANUAL queued Spells gain +${pct([1,2,3,4,5],r)} Effectiveness to Damage, Healing and Barrier values.`],
  'Reservoir Cycle': r => [`After spending at least 20% Max Mana inside a rolling 4-second window, prepare the next AUTO Spell. That AUTO Spell restores ${pct([1,2,3,4,5],r)} Max Mana after completion. One prepared Reservoir Cycle at a time.`],
  'Deep Reservoir': () => ['The first Spell each encounter costs 0 Mana and still starts its normal cooldown.'],
  'Overchannel Recovery': r => [`While the Overchannel Major effect is active, each successful Spell restores ${manaValue([1,2,3,4,5],r)}.`],
  'Deep Draw': r => [`While below 20% Mana, Spells cost ${pct([1,2,3,4,5],r)} less Mana.`],
  'Arcane Return': r => [`Every successful completed Spell restores ${manaValue([1,2,3,4,5],r)}.`],
  'Reservoir Break': r => [`While above 80% Mana, damaging Spells deal +${pct([2,4,6,8,10],r)} Damage.`],
  'Overchannel:major': () => ['After spending at least 25% Max Mana within 4 seconds, enter Overchannel for 5 seconds: +10% Action Speed, +7.5% Damage/Healing/Barrier Effectiveness, and Mana Regen is disabled. Cannot stack with itself.'],
  'Astral Reserve': r => [`Above 75% Mana, damaging Spells deal +${pct([1,2,3,4,5],r)} Damage.`],
  'Astral Release': r => [`Below 25% Mana, the first Spell every 4 seconds gains +${pct([2,4,6,8,10],r)} Action Speed.`],
  'Astral Rotation': r => [`After casting from 3 different loadout slots in succession, refund ${pct([1,2,3,4,5],r)} of that Spell's final Mana cost.`],
  'Astral Cascade': r => [`After 3 consecutive AUTO casts, the next MANUAL Spell gains +${pct([2,4,6,8,10],r)} Action Speed. Consumed on that MANUAL Spell.`],
  'Astral Equilibrium': () => ['Above 75% Mana, gain +7.5% Damage/Healing/Barrier Effectiveness. Below 25% Mana, gain +7.5% Action Speed. Between 25% and 75% Mana, no bonus. Only one side applies.'],
  'Zero Point': r => [`Every 8th Spell costs ${pct([20,40,60,80,100],r,0)} less Mana. At Rank 5 the 8th Spell costs 0 Mana.`],
  'Event Horizon': r => [`Completing a Spell while at 100% Mana stores 1 Event Horizon charge, maximum ${atRank([1,2,3,4,5],r)} charges. While below 25% Mana, a successful Spell consumes 1 charge to restore 5% Max Mana.`],
  'Singularity Manual': r => [`Each AUTO Spell may prepare one Singularity charge. The next MANUAL Spell consumes it and refunds ${pct([2,4,6,8,10],r)} of that MANUAL Spell's final Mana cost. Maximum 1 prepared charge.`],
  'Mana Collapse': r => [`When Mana crosses from at least 25% to below 25%, prepare the next Spell with +${pct([2,4,6,8,10],r)} Action Speed. Internal cooldown: 5 seconds. One prepared bonus at a time.`],
  'Arcane Singularity': () => ['Once per encounter, when a Spell would leave Mana below 10%, set Mana to 50% Max Mana and enter Singularity for 5 seconds. During Singularity, Mana Costs are reduced by 40% and Mana Regen is disabled.'],
}

const control: ArcaneCoreMechanicDescriptorMap = {
  'Opening Control': r => [`The first Control-tagged Status applied each encounter delays the enemy current action by ${atRank([50,100,150,200,250],r)} ms.`],
  'Controlled Strike': r => [`Damaging Spells deal +${pct([1,2,3,4,5],r)} Damage against a Controlled enemy.`],
  'Recovery Window': r => [`When a Control Status expires naturally, reduce your longest remaining Spell cooldown by ${atRank([40,80,120,160,200],r)} ms.`],
  'Tempo Theft': r => [`When the enemy begins an action while Controlled, restore ${manaValue([1,2,3,4,5],r)}.`],
  'Controlled Tempo': () => ['The first Control-tagged Status applied each encounter delays the enemy current action by 150 ms and grants the next Spell +3% Action Speed. Once per encounter.'],
  'Layered Control': r => [`Applying a Control Status while the enemy has at least 2 Negative Statuses prepares the next damaging Spell with +${pct([1,2,3,4,5],r)} Damage. Consumed on use.`],
  'Controlled Flow': r => [`Applying a Control Status restores ${manaValue([1,2,3,4,5],r)}. Internal cooldown: 1 second.`],
  'Debuff Pressure': r => [`Against an enemy with at least 2 Negative Statuses, damaging Spells deal +${pct([1,2,3,4,5],r)} Damage.`],
  'Control Refresh': r => [`Applying a Control Status prepares the next Control Status with +${pct([1,2,3,4,5],r)} Status Duration. Consumed by the next Control Status.`],
  'Suppression Window': () => ['Applying a Control-tagged Status during the final 25% of the enemy action delays that action by 250 ms. Internal cooldown: 8 seconds.'],
  'Chain Control': r => [`After applying 2 Control Statuses, the next Control Status prepares the next damaging Spell with +${pct([1,2,3,4,5],r)} Damage. Consumed on use.`],
  'Status Echo': r => [`When a Control Status expires naturally, the next Control Status gains +${pct([2,4,6,8,10],r)} Duration. Consumed by the next Control Status.`],
  'Queued Dominion': r => [`A MANUAL queued Spell that applies a Negative Status gains +${pct([1,2,3,4,5],r)} Status Duration for its applied Statuses.`],
  'Suppressed Enemy': r => [`While the enemy has at least 2 Negative Statuses, it deals ${pct([1,2,3,4,5],r)} less Damage.`],
  'Temporal Flow': () => ['The first Control-tagged Status applied each encounter delays the enemy current action by 300 ms and grants the next Spell +5% Action Speed. Once per encounter.'],
  Aftershock: r => [`When a Control Status expires naturally, apply Chilled for ${atRank([1,2,3,4,5],r)} second${r === 1 ? '' : 's'}. Chilled reduces Action Speed and Basic Attack Speed by 20%.`],
  'Tremor Lock': r => [`Applying a Control Status delays the enemy current action by ${atRank([50,100,150,200,250],r)} ms.`],
  'Cold Precision': r => [`Applying a Control Status to an enemy that is already Controlled prepares the next damaging Spell with +${pct([1.5,3,4.5,6,7.5],r)} Damage. Consumed on use.`],
  'Control Conversion': r => [`When one of your Control Statuses is removed before natural expiry, restore ${manaValue([1,2,3,4,5],r)} and reduce your longest remaining Spell cooldown by ${atRank([100,200,300,400,500],r)} ms.`],
  'Perfect Timing': () => ['Applying a Control-tagged Status during the final 25% of the enemy action delays that action by 500 ms. Internal cooldown: 7 seconds.'],
  'Spell Interference': r => [`Applying a Control Status delays the enemy current action by ${atRank([50,100,150,200,250],r)} ms.`],
  'Status Fracture': r => [`Applying a Control Status while the enemy has at least 3 Negative Statuses delays the enemy current action by ${atRank([50,100,150,200,250],r)} ms.`],
  'Debuff Theft': r => [`Applying a Control Status restores ${manaValue([1,2,3,4,5],r)}.`],
  'Manual Disruption': r => [`A MANUAL Spell cast while the enemy has an active action timer deals +${pct([1,2,3,4,5],r)} Damage.`],
  Dominion: () => ['While the enemy has at least 3 Negative Statuses, its action timer progresses 10% slower and it takes +5% Damage from the player.'],
  'Prepared Cast': r => [`The first MANUAL Spell each encounter gains +${pct([2,4,6,8,10],r)} Action Speed.`],
  'Queued Precision': r => [`MANUAL queued Spells gain +${pct([1,2,3,4,5],r)} Effectiveness to Damage, Healing and Barrier values.`],
  'Temporal Refund': r => [`Applying a Control Status reduces your longest remaining Spell cooldown by ${atRank([40,80,120,160,200],r)} ms.`],
  'Chrono Cycle': r => [`Every 4th Control Status applied delays the enemy current action by ${atRank([100,200,300,400,500],r)} ms.`],
  'Temporal Fracture': () => ['Every 4th Control-tagged Status delays the enemy current action by 500 ms and reduces all remaining player Spell cooldowns by 300 ms. The effect does not count as another Status application.'],
  'Lockdown Delay': r => [`Applying a Control-tagged Status delays the enemy current action by ${atRank([75,150,225,300,375],r)} ms.`],
  'Control Cascade': r => [`Once the enemy has 3 different active Control Statuses, applying the third delays the enemy current action by ${atRank([100,200,300,400,500],r)} ms.`],
  'Controlled Target': r => [`Damaging Spells deal +${pct([2.5,5,7.5,10,12.5],r)} Damage against a Controlled enemy.`],
  'No Escape': r => [`When a Control Status expires naturally while the enemy is below 25% Health, delay the enemy current action by ${atRank([100,200,300,400,500],r)} ms.`],
  'Total Lockdown': () => ['While the enemy has at least 2 different active Control Statuses, its action timer progresses 10% slower, it deals 7.5% less Damage, and it takes 7.5% more Damage from the player.'],
  'Absolute Delay': r => [`Applying a Control-tagged Status delays the enemy current action by ${atRank([100,200,300,400,500],r)} ms.`],
  'Status Recursion': r => [`When a Control Status expires naturally, the next different Control Status gains +${pct([3,6,9,12,15],r)} Duration. Consumed by that Status application.`],
  'Timeline Theft': r => [`For every 1 second of enemy action time delayed by your Arcane Core effects, gain 1 Stolen Time stack, maximum 5. A MANUAL Spell consumes all stacks and gains +${pct([0.8,1.6,2.4,3.2,4],r)} Action Speed per stack, capped at +${pct([4,8,12,16,20],r)}.`],
  'Stasis Collapse': r => [`Every 5th Control Status applied pauses enemy action progress for ${atRank([0.25,0.5,0.75,1,1.25],r)} second${r === 1 ? '' : 's'}. This is not a Stun, applies no Status, and does not add delay credit toward Absolute Stasis.`],
  'Absolute Stasis': () => ['Once per encounter, after your effects accumulate 3 total seconds of enemy action delay, stop enemy action progress for 3 seconds. During Stasis, player Spells gain +15% Action Speed. Status ticking and cooldown recovery continue normally.'],
}

const describeArcaneCoreMechanic = (branch: ArcaneCoreBranchId, name: string, nodeType: ArcaneCoreNodeType, rank: number): string[] => {
  const descriptor = branch === 'power' ? power[name] : branch === 'vitality' ? vitality[name] : branch === 'mana' ? mana[`${name}:${nodeType}`] ?? mana[name] : control[name]
  if (!descriptor) throw new Error(`Missing Arcane Core presentation descriptor: ${branch}/${name}/${nodeType}`)
  return descriptor(Math.max(1, Math.floor(rank)))
}

const inferRuntimeKind = (node: ArcaneCoreNodeDefinition): ArcaneCoreMechanicRuntimeKind => {
  if (node.nodeType === 'major') return 'combat-event'
  if (node.branchId === 'control') return 'timeline'
  if (node.branchId === 'mana') return 'resource'
  if (node.branchId === 'vitality') return 'survival'
  return 'cast-modifier'
}

const definitions = ARCANE_CORE_NODES.flatMap((node) => {
  const marker = getMarker(node)
  if (!marker) return []
  const definition: ArcaneCoreMechanicDefinition = {
    mechanicId: marker.mechanicId,
    branch: node.branchId,
    ring: node.ring,
    slot: lastPart(marker.mechanicId) as `S${5 | 6 | 7 | 8}` | 'M',
    name: node.name,
    nodeId: node.id,
    nodeType: node.nodeType,
    // Executable coverage is validated against the system's real runtime
    // registrations, never against this metadata string or board geometry.
    runtime: { kind: inferRuntimeKind(node), handler: 'arcane-core-mechanic-adapter' },
    describeRank: (rank) => describeArcaneCoreMechanic(node.branchId, node.name, node.nodeType, rank),
  }
  return [definition]
})

export const ARCANE_CORE_MECHANICS = definitions
export const ARCANE_CORE_MECHANIC_REGISTRY = Object.fromEntries(definitions.map((definition) => [definition.mechanicId, definition])) as Record<string, ArcaneCoreMechanicDefinition>
export const ARCANE_CORE_MECHANIC_NAMES = new Set(definitions.map((definition) => definition.name))

export const validateArcaneCoreMechanicCoverage = () => {
  const errors: string[] = []
  const currentIds = new Set<string>()
  ARCANE_CORE_BRANCHES.forEach((branch) => branch.nodes.forEach((node) => {
    const marker = getMarker(node)
    if (!marker) return
    currentIds.add(marker.mechanicId)
    const definition = ARCANE_CORE_MECHANIC_REGISTRY[marker.mechanicId]
    if (!definition) errors.push(`${branch.id}/Ring ${node.ring}/${lastPart(marker.mechanicId)} ${node.name} has no Arcane Core runtime registry entry`)
    else {
      if (definition.nodeId !== node.id || definition.name !== node.name || !definition.runtime.handler) errors.push(`${branch.id}/Ring ${node.ring}/${lastPart(marker.mechanicId)} ${node.name} has a mismatched Arcane Core runtime registry entry`)
      for (const rank of [1, node.maxRank]) {
        try { if (!definition.describeRank(rank).some(Boolean)) errors.push(`${marker.mechanicId} has empty Rank ${rank} presentation`) }
        catch (error) { errors.push(`${marker.mechanicId} presentation failed: ${error instanceof Error ? error.message : String(error)}`) }
      }
    }
  }))
  Object.keys(ARCANE_CORE_MECHANIC_REGISTRY).filter((id) => !currentIds.has(id)).forEach((id) => errors.push(`orphan Arcane Core mechanic implementation ${id}`))
  return errors
}

import { createRing, linearStat, major, minor, modifier, perk, rankedModifier, v7Mechanic, v7MechanicWith } from './arcaneCoreNodeFactory'
import { debuffed, negativeStatuses, selfControlled, selfDebuffed, selfNegativeStatuses } from './arcaneCoreContentHelpers'

const mechanic = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, slot: `S${5 | 6 | 7 | 8}` | 'M', name: string) => v7Mechanic('control', ring, slot, name)
const enemyDamage = (perRank: number) => rankedModifier('damage-dealt-percent', perRank, selfDebuffed, 'enemy')
const controlledDamage = (perRank: number) => rankedModifier('damage-dealt-percent', perRank, debuffed)

const ring1 = createRing('control', 1, [
  minor('control-r1-cooldown-control', 'Cooldown Control', '+0.2% Cooldown Recovery per rank. Rank 5: +1%.', linearStat('cooldownRecoveryPct', 0.002)),
  minor('control-r1-status-mastery', 'Casting Rhythm', '+0.1% Action Speed per rank. Rank 5: +0.5%.', rankedModifier('action-speed-percent', 0.001)),
  minor('control-r1-combat-speed', 'Status Mastery', '+0.4% Status Duration per rank. Rank 5: +2%.', linearStat('statusDurationPct', 0.004)),
  minor('control-r1-status-pressure', 'Controlled Force', '+0.1% Damage vs controlled/debuffed enemies per rank. Rank 5: +0.5%.', controlledDamage(0.001)),
  perk('control-r1-suppression', 'Opening Control', 'The first control-tagged Status each encounter gives a small timing benefit.', mechanic(1, 'S5', 'Opening Control')),
  perk('control-r1-quick-recovery', 'Controlled Strike', 'Damaging Spells against controlled enemies gain a small bonus.', mechanic(1, 'S6', 'Controlled Strike')),
  perk('control-r1-control-pressure', 'Recovery Window', 'Applying a control Status briefly prepares a small recovery window.', mechanic(1, 'S7', 'Recovery Window')),
  perk('control-r1-debilitating-presence', 'Tempo Theft', 'A small amount of enemy timing is converted into a next-cast benefit.', mechanic(1, 'S8', 'Tempo Theft')),
  major('control-r1-temporal-flow', 'Controlled Tempo', 'The first control-tagged Status applied each encounter delays the enemy current action by 150 ms and grants +3% Action Speed to the next Spell. Once per encounter.', mechanic(1, 'M', 'Controlled Tempo')),
])

const ring2 = createRing('control', 2, [
  minor('control-r2-layered-control', 'Cooldown Control II', '+0.2% Cooldown Recovery per rank. Rank 5: +1%.', linearStat('cooldownRecoveryPct', 0.002)),
  minor('control-r2-fast-hands', 'Suppression Tempo', '+0.15% Action Speed per rank. Rank 5: +0.75%.', rankedModifier('action-speed-percent', 0.0015)),
  minor('control-r2-spell-momentum', 'Status Mastery II', '+0.4% Status Duration per rank. Rank 5: +2%.', linearStat('statusDurationPct', 0.004)),
  minor('control-r2-barrier-exploit', 'Suppression', 'Debuffed enemies deal -0.1% Damage per rank. Rank 5: -0.5%.', enemyDamage(-0.001)),
  perk('control-r2-vulnerability-exploit', 'Layered Control', 'Multiple negative Statuses provide a small controlled damage bonus.', mechanic(2, 'S5', 'Layered Control')),
  perk('control-r2-spell-feedback', 'Controlled Flow', 'A control Status restores a small amount of Mana with an internal cooldown.', mechanic(2, 'S6', 'Controlled Flow')),
  perk('control-r2-controlled-assault', 'Debuff Pressure', 'Debuffed enemies take a small bonus Damage from the player.', mechanic(2, 'S7', 'Debuff Pressure')),
  perk('control-r2-precision-timing', 'Control Refresh', 'A control Status refreshes a bounded amount of control duration.', mechanic(2, 'S8', 'Control Refresh')),
  major('control-r2-perfect-timing', 'Suppression Window', 'When a control-tagged Status is applied during the final 25% of the enemy action, delay it by 250 ms. Cooldown: 8 seconds.', mechanic(2, 'M', 'Suppression Window')),
])

const ring3 = createRing('control', 3, [
  minor('control-r3-rapid-cycle', 'Dominion Recovery', '+0.25% Cooldown Recovery per rank. Rank 5: +1.25%.', linearStat('cooldownRecoveryPct', 0.0025)),
  minor('control-r3-deep-status', 'Dominion Tempo', '+0.2% Action Speed per rank. Rank 5: +1%.', rankedModifier('action-speed-percent', 0.002)),
  minor('control-r3-multi-layered-control', 'Deep Status', '+0.5% Status Duration per rank. Rank 5: +2.5%.', linearStat('statusDurationPct', 0.005)),
  minor('control-r3-deep-suppression', 'Dominating Weakness', '+0.15% Damage vs controlled/debuffed enemies per rank. Rank 5: +0.75%.', controlledDamage(0.0015)),
  perk('control-r3-kill-momentum', 'Chain Control', 'Control-tagged Statuses build a bounded chain.', mechanic(3, 'S5', 'Chain Control')),
  perk('control-r3-controlled-flow', 'Status Echo', 'The next control Status gains a moderate duration benefit.', mechanic(3, 'S6', 'Status Echo')),
  perk('control-r3-cooldown-mastery', 'Queued Dominion', 'Queued Spells gain a bounded control-status benefit.', mechanic(3, 'S7', 'Queued Dominion')),
  perk('control-r3-debuff-execution', 'Suppressed Enemy', 'Enemies carrying multiple negative Statuses deal less Damage.', mechanic(3, 'S8', 'Suppressed Enemy')),
  major('control-r3-dominion', 'Temporal Flow', 'The first control-tagged Status applied each encounter delays the enemy by 300 ms and grants +5% Action Speed to the next Spell. Once per encounter.', mechanic(3, 'M', 'Temporal Flow')),
])

const ring4 = createRing('control', 4, [
  minor('control-r4-apex-cooldown', 'Apex Recovery', '+0.25% Cooldown Recovery per rank. Rank 5: +1.25%.', linearStat('cooldownRecoveryPct', 0.0025)),
  minor('control-r4-apex-status', 'Apex Status', '+0.5% Status Duration per rank. Rank 5: +2.5%.', linearStat('statusDurationPct', 0.005)),
  minor('control-r4-absolute-pressure', 'Apex Suppression', 'Debuffed enemies deal -0.15% Damage per rank. Rank 5: -0.75%.', enemyDamage(-0.0015)),
  minor('control-r4-absolute-suppression', 'Absolute Pressure', '+0.2% Damage vs controlled/debuffed enemies per rank. Rank 5: +1%.', controlledDamage(0.002)),
  perk('control-r4-perfect-rhythm', 'Aftershock', 'A control application produces a small secondary timing reaction.', mechanic(4, 'S5', 'Aftershock')),
  perk('control-r4-disruption-mastery', 'Tremor Lock', 'A control Status briefly delays the current enemy action.', mechanic(4, 'S6', 'Tremor Lock')),
  perk('control-r4-barrier-rupture', 'Cold Precision', 'Control against a vulnerable target improves the next Spell.', mechanic(4, 'S7', 'Cold Precision')),
  perk('control-r4-vulnerable-mastery', 'Control Conversion', 'A bounded amount of control delay becomes a player timing benefit.', mechanic(4, 'S8', 'Control Conversion')),
  major('control-r4-arcane-lock', 'Perfect Timing', 'Applying a control-tagged Status during the final 25% of enemy action delays it by 500 ms. Cooldown: 7 seconds.', mechanic(4, 'M', 'Perfect Timing')),
])

const ring5 = createRing('control', 5, [
  minor('control-r5-interference-recovery', 'Interference Tempo', '+0.2% Action Speed per rank. Rank 5: +1%.', rankedModifier('action-speed-percent', 0.002)),
  minor('control-r5-interference-duration', 'Interference Status', '+0.6% Status Duration per rank. Rank 5: +3%.', linearStat('statusDurationPct', 0.006)),
  minor('control-r5-interference-tempo', 'Interference Suppression', 'Debuffed enemies deal -0.2% Damage per rank. Rank 5: -1%.', enemyDamage(-0.002)),
  minor('control-r5-debuff-pressure', 'Interference Pressure', '+0.25% Damage vs controlled/debuffed enemies per rank. Rank 5: +1.25%.', controlledDamage(0.0025)),
  perk('control-r5-enemy-interference', 'Spell Interference', 'A control Status interferes with the enemy current action.', mechanic(5, 'S5', 'Spell Interference')),
  perk('control-r5-kill-interference', 'Status Fracture', 'A Status applied to an already controlled enemy creates a bounded fracture.', mechanic(5, 'S6', 'Status Fracture')),
  perk('control-r5-action-interference', 'Debuff Theft', 'A portion of enemy control timing becomes a player resource benefit.', mechanic(5, 'S7', 'Debuff Theft')),
  perk('control-r5-vulnerability-pressure', 'Manual Disruption', 'A MANUAL Spell timed during enemy action disruption gains a bounded payoff.', mechanic(5, 'S8', 'Manual Disruption')),
  major('control-r5-temporal-fracture', 'Dominion', 'While the enemy has 3+ negative Statuses, its action timer progresses 10% slower and it takes +5% Damage from the player.', v7MechanicWith('control', 5, 'M', 'Dominion', () => ({ modifiers: [modifier('action-speed-percent', -0.10, selfNegativeStatuses(3), 'enemy'), modifier('damage-dealt-percent', 0.05, negativeStatuses(3))] }))),
])

const ring6 = createRing('control', 6, [
  minor('control-r6-temporal-recovery', 'Temporal Recovery', '+0.3% Cooldown Recovery per rank. Rank 5: +1.5%.', linearStat('cooldownRecoveryPct', 0.003)),
  minor('control-r6-temporal-status', 'Temporal Speed', '+0.25% Action Speed per rank. Rank 5: +1.25%.', rankedModifier('action-speed-percent', 0.0025)),
  minor('control-r6-temporal-speed', 'Temporal Status', '+0.7% Status Duration per rank. Rank 5: +3.5%.', linearStat('statusDurationPct', 0.007)),
  minor('control-r6-temporal-hands', 'Temporal Pressure', '+0.35% Damage vs controlled/debuffed enemies per rank. Rank 5: +1.75%.', controlledDamage(0.0035)),
  perk('control-r6-temporal-momentum', 'Prepared Cast', 'A prepared Spell gains a bounded timing benefit.', mechanic(6, 'S5', 'Prepared Cast')),
  perk('control-r6-temporal-feedback', 'Queued Precision', 'A queued Spell gains a bounded effectiveness benefit.', mechanic(6, 'S6', 'Queued Precision')),
  perk('control-r6-layered-interference', 'Temporal Refund', 'A control event refunds a bounded amount of cooldown.', mechanic(6, 'S7', 'Temporal Refund')),
  perk('control-r6-temporal-suppression', 'Chrono Cycle', 'Every fourth control Status creates a bounded timing pulse.', mechanic(6, 'S8', 'Chrono Cycle')),
  major('control-r6-time-compression', 'Temporal Fracture', 'Every 4th control-tagged Status delays enemy action by 500 ms and reduces remaining player Spell cooldowns by 300 ms. The effect does not count as another Status application.', mechanic(6, 'M', 'Temporal Fracture')),
])

const ring7 = createRing('control', 7, [
  minor('control-r7-lockdown-recovery', 'Lockdown Recovery', '+0.35% Cooldown Recovery per rank. Rank 5: +1.75%.', linearStat('cooldownRecoveryPct', 0.0035)),
  minor('control-r7-lockdown-duration', 'Lockdown Tempo', '+0.3% Action Speed per rank. Rank 5: +1.5%.', rankedModifier('action-speed-percent', 0.003)),
  minor('control-r7-lockdown-delay', 'Lockdown Duration', '+0.9% Status Duration per rank. Rank 5: +4.5%.', linearStat('statusDurationPct', 0.009)),
  minor('control-r7-controlled-target', 'Controlled Suppression', 'Debuffed enemies deal -0.3% Damage per rank. Rank 5: -1.5%.', enemyDamage(-0.003)),
  perk('control-r7-controlled-suppression', 'Lockdown Delay', 'Applying a control-tagged Status delays the enemy by a bounded amount.', mechanic(7, 'S5', 'Lockdown Delay')),
  perk('control-r7-vulnerability-mastery', 'Control Cascade', 'Applying several different control Statuses creates a bounded cascade.', mechanic(7, 'S6', 'Control Cascade')),
  perk('control-r7-barrier-control', 'Controlled Target', 'Enemies with a control-tagged Status take more Damage from the player.', mechanic(7, 'S7', 'Controlled Target')),
  perk('control-r7-layered-lockdown', 'No Escape', 'A control Status expiring near low enemy Health creates a bounded delay.', mechanic(7, 'S8', 'No Escape')),
  major('control-r7-total-lockdown', 'Total Lockdown', 'While an enemy has at least two different control-tagged Statuses, its action timer progresses 10% slower, it deals 7.5% less Damage, and it takes 7.5% more Damage from the player.', v7MechanicWith('control', 7, 'M', 'Total Lockdown', () => ({ modifiers: [modifier('action-speed-percent', -0.10, selfControlled, 'enemy'), modifier('damage-dealt-percent', -0.075, selfControlled, 'enemy'), modifier('damage-dealt-percent', 0.075, selfControlled)] }))),
])

const ring8 = createRing('control', 8, [
  minor('control-r8-stasis-recovery', 'Stasis Recovery', '+0.45% Cooldown Recovery per rank. Rank 5: +2.25%.', linearStat('cooldownRecoveryPct', 0.0045)),
  minor('control-r8-stasis-duration', 'Stasis Tempo', '+0.4% Action Speed per rank. Rank 5: +2%.', rankedModifier('action-speed-percent', 0.004)),
  minor('control-r8-stasis-tempo', 'Absolute Suppression', 'Debuffed enemies deal -0.45% Damage per rank. Rank 5: -2.25%.', enemyDamage(-0.0045)),
  minor('control-r8-stasis-delay', 'Endless Pressure', '+0.55% Damage vs controlled/debuffed enemies per rank. Rank 5: +2.75%.', controlledDamage(0.0055)),
  perk('control-r8-stasis-suppression', 'Absolute Delay', 'Applying a control-tagged Status delays enemy action by a bounded amount.', mechanic(8, 'S5', 'Absolute Delay')),
  perk('control-r8-absolute-pressure', 'Status Recursion', 'A naturally expiring control Status prepares the next different control Status.', mechanic(8, 'S6', 'Status Recursion')),
  perk('control-r8-absolute-vulnerability', 'Timeline Theft', 'Enemy action time delayed by your effects creates capped Stolen Time stacks for a MANUAL Spell.', mechanic(8, 'S7', 'Timeline Theft')),
  perk('control-r8-stasis-recovery-pulse', 'Stasis Collapse', 'Every 5th control Status pauses enemy action progress for a bounded duration. It is not a Stun and applies no Status.', mechanic(8, 'S8', 'Stasis Collapse')),
  major('control-r8-absolute-stasis', 'Absolute Stasis', 'Once per encounter, after 3 total seconds of enemy action delay, stop enemy action progress for 3 seconds. During Stasis, Spells gain +15% Action Speed; Status ticking and cooldown recovery continue.', mechanic(8, 'M', 'Absolute Stasis')),
])

export const controlNodes = [ring1, ring2, ring3, ring4, ring5, ring6, ring7, ring8]

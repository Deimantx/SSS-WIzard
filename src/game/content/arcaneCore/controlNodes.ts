import { createRing, fixedEffects, linearStat, modifier, perk, minor, major, rankedModifier, rankValues, rule } from './arcaneCoreNodeFactory'
import { all, debuffed, negativeStatuses, targetBelowHp } from './arcaneCoreContentHelpers'

const controlStatus = { type: 'target-has-status-tag', tag: 'control' } as const
const ring1 = createRing('control', 1, [
  minor('control-r1-cooldown-control', 'Cooldown Control', '+1% Cooldown Recovery per rank.', linearStat('cooldownRecoveryPct', 0.01)),
  minor('control-r1-status-mastery', 'Status Mastery', '+3% Status Duration per rank.', linearStat('statusDurationPct', 0.03)),
  minor('control-r1-combat-speed', 'Combat Speed', '+1.5% Basic Attack Speed per rank.', linearStat('basicAttackSpeedPct', 0.015)),
  perk('control-r1-status-pressure', 'Status Pressure', 'Against debuffed enemies: +1% Damage per rank.', rankedModifier('damage-dealt-percent', 0.01, debuffed)),
  perk('control-r1-suppression', 'Suppression', 'Debuffed enemies deal -0.5% Damage per rank.', rankedModifier('damage-dealt-percent', -0.005, debuffed, 'enemy')),
  perk('control-r1-quick-recovery', 'Quick Recovery', 'A kill reduces Spell cooldowns by 50–250 ms.', (rank) => ({ rules: [rule('control-quick-recovery', 'on-kill', [{ type: 'modify-cooldown', target: 'self', amountMs: -rankValues(rank, [50, 100, 150, 200, 250]) }])] })),
  perk('control-r1-control-pressure', 'Control Pressure', 'Control-tagged Statuses delay enemy actions by 20–100 ms.', (rank) => ({ rules: [rule('control-control-pressure', 'on-status-applied', [{ type: 'modify-action-timer', target: 'opponent', amountMs: -rankValues(rank, [20, 40, 60, 80, 100]), action: 'current' }], controlStatus, { cooldownMs: 1000 })] })),
  perk('control-r1-debilitating-presence', 'Debilitating Presence', 'Control-tagged enemies deal -0.5% Damage per rank.', rankedModifier('damage-taken-percent', -0.005, controlStatus, 'enemy')),
  major('control-r1-temporal-flow', 'Temporal Flow', '+4% Cooldown Recovery; kills reduce cooldowns by 500 ms.', fixedEffects({ stats: { cooldownRecoveryPct: 0.04 }, rules: [rule('control-temporal-flow', 'on-kill', [{ type: 'modify-cooldown', target: 'self', amountMs: -500 }])] })),
])
const ring2 = createRing('control', 2, [
  perk('control-r2-layered-control', 'Layered Control', 'Against 2+ negative Statuses: +1% Damage per rank.', rankedModifier('damage-dealt-percent', 0.01, negativeStatuses(2))),
  perk('control-r2-fast-hands', 'Fast Hands', 'Basic Attack hit reduces Spell cooldowns by 20–100 ms.', (rank) => ({ rules: [rule('control-fast-hands', 'on-basic-attack-hit', [{ type: 'modify-cooldown', target: 'self', amountMs: -rankValues(rank, [20, 40, 60, 80, 100]) }])] })),
  perk('control-r2-spell-momentum', 'Spell Momentum', 'Damaging Spell advances the next Basic Attack by 20–100 ms.', (rank) => ({ rules: [rule('control-spell-momentum', 'on-spell-hit', [{ type: 'modify-action-timer', target: 'self', amountMs: -rankValues(rank, [20, 40, 60, 80, 100]), action: 'basic-attack' }])] })),
  perk('control-r2-barrier-exploit', 'Barrier Exploit', 'Against enemies with Barrier: +1% Damage per rank.', rankedModifier('damage-dealt-percent', 0.01, { type: 'target-has-barrier' })),
  perk('control-r2-vulnerability-exploit', 'Vulnerability Exploit', 'Against Vulnerable enemies: +1.6% Damage per rank.', rankedModifier('damage-dealt-percent', 0.016, { type: 'target-has-status', statusId: 'vulnerable' })),
  perk('control-r2-spell-feedback', 'Spell Feedback', 'Negative Statuses reduce Spell cooldowns by 40–200 ms.', (rank) => ({ rules: [rule('control-spell-feedback', 'on-status-applied', [{ type: 'modify-cooldown', target: 'self', amountMs: -rankValues(rank, [40, 80, 120, 160, 200]) }], { type: 'event-status-has-tag', tag: 'debuff' })] })),
  perk('control-r2-controlled-assault', 'Controlled Assault', 'Against control-status enemies: +1% Damage per rank.', rankedModifier('damage-dealt-percent', 0.01, controlStatus)),
  perk('control-r2-precision-timing', 'Precision Timing', '+0.5% Player Action Speed per rank.', linearStat('basicAttackSpeedPct', 0.005)),
  major('control-r2-perfect-timing', 'Perfect Timing', '+5% Player Action Speed.', fixedEffects({ modifiers: [modifier('action-speed-percent', 0.05)] })),
])
const ring3 = createRing('control', 3, [
  perk('control-r3-rapid-cycle', 'Rapid Cycle', 'Every tenth Spell reduces cooldowns by 100–500 ms.', (rank) => ({ special: [{ type: 'nth-spell-cooldown-pulse', every: 10, cooldownReductionMs: rankValues(rank, [100, 200, 300, 400, 500]) }] })),
  minor('control-r3-deep-status', 'Deep Status', '+4% Status Duration per rank.', linearStat('statusDurationPct', 0.04)),
  perk('control-r3-multi-layered-control', 'Multi-Layered Control', 'Against 3+ negative Statuses: +1.5% Damage per rank.', rankedModifier('damage-dealt-percent', 0.015, negativeStatuses(3))),
  perk('control-r3-deep-suppression', 'Deep Suppression', 'Against 2+ negative Statuses, enemy Damage Taken +0.75% per rank.', rankedModifier('damage-taken-percent', 0.0075, negativeStatuses(2), 'enemy')),
  perk('control-r3-kill-momentum', 'Kill Momentum', 'A kill advances the next Basic Attack by 50–250 ms.', (rank) => ({ rules: [rule('control-kill-momentum', 'on-kill', [{ type: 'modify-action-timer', target: 'self', amountMs: -rankValues(rank, [50, 100, 150, 200, 250]), action: 'basic-attack' }])] })),
  perk('control-r3-controlled-flow', 'Controlled Flow', 'A control Status restores 1–3 Mana.', (rank) => ({ rules: [rule('control-controlled-flow', 'on-status-applied', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: rankValues(rank, [1, 1, 2, 2, 3]) } }], controlStatus)] })),
  minor('control-r3-cooldown-mastery', 'Cooldown Mastery', '+1.25% Cooldown Recovery per rank.', linearStat('cooldownRecoveryPct', 0.0125)),
  perk('control-r3-debuff-execution', 'Debuff Execution', 'Against debuffed enemies below 50% Health: +1.5% Damage per rank.', rankedModifier('damage-dealt-percent', 0.015, all(debuffed, targetBelowHp(50)))),
  major('control-r3-dominion', 'Dominion', 'Enemies with 3+ negative Statuses take +10% and deal -5% Damage.', fixedEffects({ modifiers: [modifier('damage-taken-percent', 0.1, negativeStatuses(3), 'enemy'), modifier('damage-dealt-percent', -0.05, negativeStatuses(3), 'enemy')] })),
])
const ring4 = createRing('control', 4, [
  minor('control-r4-apex-cooldown', 'Apex Cooldown', '+1.5% Cooldown Recovery per rank.', linearStat('cooldownRecoveryPct', 0.015)),
  minor('control-r4-apex-status', 'Apex Status', '+5% Status Duration per rank.', linearStat('statusDurationPct', 0.05)),
  perk('control-r4-absolute-pressure', 'Absolute Pressure', 'Against 3+ negative Statuses: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, negativeStatuses(3))),
  perk('control-r4-absolute-suppression', 'Absolute Suppression', 'Against 3+ negative Statuses enemy Damage Taken +1% per rank.', rankedModifier('damage-taken-percent', 0.01, negativeStatuses(3), 'enemy')),
  minor('control-r4-perfect-rhythm', 'Perfect Rhythm', '+1% Action Speed per rank.', rankedModifier('action-speed-percent', 0.01)),
  perk('control-r4-disruption-mastery', 'Disruption Mastery', 'Control Statuses delay enemy actions by 25–125 ms.', (rank) => ({ rules: [rule('control-disruption-mastery', 'on-status-applied', [{ type: 'modify-action-timer', target: 'opponent', amountMs: -rankValues(rank, [25, 50, 75, 100, 125]), action: 'current' }], controlStatus)] })),
  perk('control-r4-barrier-rupture', 'Barrier Rupture', 'Against enemies with Barrier: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, { type: 'target-has-barrier' })),
  perk('control-r4-vulnerable-mastery', 'Vulnerable Mastery', 'Against Vulnerable enemies: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, { type: 'target-has-status', statusId: 'vulnerable' })),
  major('control-r4-arcane-lock', 'Arcane Lock', 'Control Statuses delay enemy actions and increase damage taken.', fixedEffects({ modifiers: [modifier('damage-dealt-percent', 0.1, controlStatus)] })),
])

export const controlNodes = [ring1, ring2, ring3, ring4]

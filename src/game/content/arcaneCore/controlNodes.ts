import { lane, minor, perk, major, modifier, rule } from './arcaneCoreNodeFactory'

const debuffed = { type: 'target-has-status-tag' as const, tag: 'debuff' as const }
const selfDebuffs = (count: number) => ({ type: 'self-negative-status-count-at-least' as const, count })
const targetDebuffs = (count: number) => ({ type: 'target-negative-status-count-at-least' as const, count })
const controlStatus = { type: 'event-status-has-tag' as const, tag: 'control' as const }

export const controlNodes = [
  lane('control', 'control-a', 0, [
    minor('control-a1', 'Cooldown Control I', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    minor('control-a2', 'Cooldown Control II', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    perk('control-a3', 'Quick Recovery', 'Killing an enemy reduces all remaining Spell cooldowns by 250 ms.', undefined, [rule('quick-recovery', 'on-kill', [{ type: 'modify-cooldown', target: 'self', amountMs: -250 }])]),
    minor('control-a4', 'Cooldown Control III', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    minor('control-a5', 'Cooldown Control IV', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    perk('control-a6', 'Spell Feedback', 'When a Spell applies a negative Status, reduce that Spell cooldown by 200 ms.', undefined, [rule('spell-feedback', 'on-status-applied', [{ type: 'modify-cooldown', target: 'self', amountMs: -200, spellId: 'source' }], { type: 'all', conditions: [{ type: 'event-status-has-tag', tag: 'debuff' }, { type: 'source-has-tag', tag: 'spell' }] })]),
    minor('control-a7', 'Cooldown Control V', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    minor('control-a8', 'Cooldown Control VI', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    perk('control-a9', 'Rapid Cycle', 'Every 10th Spell cast reduces all remaining Spell cooldowns by 500 ms.', undefined, undefined, [{ type: 'nth-spell-cooldown-pulse', every: 10, cooldownReductionMs: 500 }]),
    major('control-a10', 'Temporal Flow', '+4% Cooldown Recovery. Kills reduce all remaining Spell cooldowns by 500 ms.', { cooldownRecoveryPct: 0.04 }, undefined, [rule('temporal-flow', 'on-kill', [{ type: 'modify-cooldown', target: 'self', amountMs: -500 }])]),
  ]),
  lane('control', 'control-b', 1, [
    minor('control-b1', 'Status Mastery I', '+3% Status Duration', { statusDurationPct: 0.03 }),
    minor('control-b2', 'Status Mastery II', '+3% Status Duration', { statusDurationPct: 0.03 }),
    perk('control-b3', 'Status Pressure', 'Deal +4% Damage to enemies affected by any negative Status.', [modifier('damage-dealt-percent', 0.04, debuffed)]),
    minor('control-b4', 'Status Mastery III', '+3% Status Duration', { statusDurationPct: 0.03 }),
    minor('control-b5', 'Status Mastery IV', '+3% Status Duration', { statusDurationPct: 0.03 }),
    perk('control-b6', 'Suppression', 'Enemies affected by any negative Status deal 3% less Damage to the Wizard.', [modifier('damage-dealt-percent', -0.03, selfDebuffs(1), 'enemy')]),
    minor('control-b7', 'Status Mastery V', '+4% Status Duration', { statusDurationPct: 0.04 }),
    perk('control-b8', 'Layered Control', 'Enemies with at least 2 different negative Statuses take +5% Damage.', [modifier('damage-taken-percent', 0.05, selfDebuffs(2), 'enemy')]),
    minor('control-b9', 'Status Mastery VI', '+4% Status Duration', { statusDurationPct: 0.04 }),
    major('control-b10', 'Dominion', 'Enemies with at least 3 different negative Statuses take +10% Damage and deal -5% Damage.', undefined, [modifier('damage-taken-percent', 0.1, selfDebuffs(3), 'enemy'), modifier('damage-dealt-percent', -0.05, selfDebuffs(3), 'enemy')]),
  ]),
  lane('control', 'control-c', 2, [
    minor('control-c1', 'Combat Speed I', '+2% Basic Attack Speed', { basicAttackSpeedPct: 0.02 }),
    minor('control-c2', 'Combat Speed II', '+2% Basic Attack Speed', { basicAttackSpeedPct: 0.02 }),
    minor('control-c3', 'Timing Control I', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    perk('control-c4', 'Fast Hands', 'A successful Basic Attack hit reduces all remaining Spell cooldowns by 100 ms.', undefined, [rule('fast-hands', 'on-basic-attack-hit', [{ type: 'modify-cooldown', target: 'self', amountMs: -100 }])]),
    minor('control-c5', 'Combat Speed III', '+2% Basic Attack Speed', { basicAttackSpeedPct: 0.02 }),
    minor('control-c6', 'Combat Speed IV', '+2% Basic Attack Speed', { basicAttackSpeedPct: 0.02 }),
    perk('control-c7', 'Spell Momentum', 'A damaging Spell hit advances the next Basic Attack by 100 ms.', undefined, [rule('spell-momentum', 'on-spell-hit', [{ type: 'modify-action-timer', target: 'self', amountMs: -100, action: 'basic-attack' }], { type: 'source-has-tag', tag: 'spell' })]),
    minor('control-c8', 'Combat Speed V', '+2% Basic Attack Speed', { basicAttackSpeedPct: 0.02 }),
    minor('control-c9', 'Timing Control II', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    major('control-c10', 'Perfect Timing', '+5% Player Action Speed', undefined, [modifier('action-speed-percent', 0.05)]),
  ]),
  lane('control', 'control-d', 3, [
    minor('control-d1', 'Disruption I', '+3% Status Duration', { statusDurationPct: 0.03 }),
    minor('control-d2', 'Disruption Timing I', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    perk('control-d3', 'Control Pressure', 'Applying a control-tagged negative Status delays the enemy current Action by 100 ms.', undefined, [rule('control-pressure', 'on-status-applied', [{ type: 'modify-action-timer', target: 'opponent', amountMs: 100, action: 'current' }], controlStatus, { cooldownMs: 1_000 })]),
    minor('control-d4', 'Disruption II', '+3% Status Duration', { statusDurationPct: 0.03 }),
    perk('control-d5', 'Barrier Exploit', 'Deal +5% Damage to enemies that currently have Barrier.', [modifier('damage-dealt-percent', 0.05, { type: 'target-has-barrier' })]),
    minor('control-d6', 'Disruption Timing II', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    minor('control-d7', 'Disruption III', '+3% Status Duration', { statusDurationPct: 0.03 }),
    perk('control-d8', 'Vulnerability Exploit', 'Deal +8% Damage to enemies affected by Vulnerable.', [modifier('damage-dealt-percent', 0.08, { type: 'target-has-status', statusId: 'vulnerable' })]),
    minor('control-d9', 'Disruption Timing III', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    major('control-d10', 'Arcane Lock', 'Applying a control-tagged negative Status delays the enemy current Action by 250 ms.', undefined, undefined, [rule('arcane-lock', 'on-status-applied', [{ type: 'modify-action-timer', target: 'opponent', amountMs: 250, action: 'current' }], controlStatus, { cooldownMs: 5_000 })]),
  ]),
]

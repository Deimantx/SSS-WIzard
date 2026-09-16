import { lane, minor, perk, major, modifier, rule } from './arcaneCoreNodeFactory'

const barrier = { type: 'self-has-barrier' as const }
const noBarrier = { type: 'not' as const, condition: barrier }
const healthDamage = { type: 'event-health-damage-positive' as const }
const blocked = { type: 'event-was-blocked' as const }

export const vitalityNodes = [
  lane('vitality', 'vitality-a', 0, [
    minor('vitality-a1', 'Vitality I', '+10 Max Health', { maxHealth: 10 }),
    minor('vitality-a2', 'Vitality II', '+10 Max Health', { maxHealth: 10 }),
    minor('vitality-a3', 'Natural Recovery I', '+0.25 Health Regen', { healthRegen: 0.25 }),
    perk('vitality-a4', 'Second Wind', 'When Health falls below 30%, heal 5% Max Health.', undefined, [rule('second-wind', 'on-hp-threshold', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.05 } }], { type: 'self-hp-below-percent', percent: 30 }, { cooldownMs: 30_000 })]),
    minor('vitality-a5', 'Vitality III', '+15 Max Health', { maxHealth: 15 }),
    minor('vitality-a6', 'Natural Recovery II', '+0.25 Health Regen', { healthRegen: 0.25 }),
    minor('vitality-a7', 'Vitality IV', '+15 Max Health', { maxHealth: 15 }),
    perk('vitality-a8', 'Fortified Body', 'While above 80% Health: -3% Damage Taken.', [modifier('damage-taken-percent', -0.03, { type: 'self-hp-above-percent', percent: 80 })]),
    minor('vitality-a9', 'Vitality V', '+20 Max Health', { maxHealth: 20 }),
    major('vitality-a10', 'Survival Instinct', 'Once per dungeon run, lethal damage leaves the Wizard at 1 Health instead.', undefined, undefined, undefined, [{ type: 'lethal-survival', leaveAtHealth: 1, oncePerDungeonRun: true }]),
  ]),
  lane('vitality', 'vitality-b', 1, [
    minor('vitality-b1', 'Arcane Defense I', '+2 Defense', { defense: 2 }),
    minor('vitality-b2', 'Guard I', '+1% Block Chance', { blockChance: 0.01 }),
    minor('vitality-b3', 'Arcane Defense II', '+2 Defense', { defense: 2 }),
    perk('vitality-b4', 'Steady Guard', 'After successfully Blocking a hit, restore 1% Max Health.', undefined, [rule('steady-guard', 'on-damage-taken', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.01 } }], blocked, { cooldownMs: 2_000 })]),
    minor('vitality-b5', 'Guard II', '+1% Block Chance', { blockChance: 0.01 }),
    minor('vitality-b6', 'Arcane Defense III', '+3 Defense', { defense: 3 }),
    perk('vitality-b7', 'Stonewall', 'While the Wizard has Barrier: +4 Defense.', [modifier('defense-flat', 4, barrier)]),
    minor('vitality-b8', 'Guard III', '+1% Block Chance', { blockChance: 0.01 }),
    minor('vitality-b9', 'Arcane Defense IV', '+4 Defense', { defense: 4 }),
    major('vitality-b10', 'Unyielding', 'While below 50% Health: -6% Damage Taken.', undefined, [modifier('damage-taken-percent', -0.06, { type: 'self-hp-below-percent', percent: 50 })]),
  ]),
  lane('vitality', 'vitality-c', 2, [
    minor('vitality-c1', 'Barrier Power I', '+4% Barrier Power', { barrierPowerPct: 0.04 }),
    minor('vitality-c2', 'Barrier Power II', '+4% Barrier Power', { barrierPowerPct: 0.04 }),
    perk('vitality-c3', 'Ward Reinforcement', 'While the Wizard has Barrier: -4% Damage Taken.', [modifier('damage-taken-percent', -0.04, barrier)]),
    minor('vitality-c4', 'Barrier Power III', '+5% Barrier Power', { barrierPowerPct: 0.05 }),
    perk('vitality-c5', 'Reinforced Ward I', '+5 flat Barrier received.', [modifier('barrier-received-flat', 5)]),
    perk('vitality-c6', 'Ward Recovery', "When the Wizard's Barrier breaks, heal 3% Max Health.", undefined, [rule('ward-recovery', 'on-barrier-broken', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.03 } }])]),
    minor('vitality-c7', 'Barrier Power IV', '+5% Barrier Power', { barrierPowerPct: 0.05 }),
    perk('vitality-c8', 'Reinforced Ward II', '+5 flat Barrier received.', [modifier('barrier-received-flat', 5)]),
    perk('vitality-c9', 'Reactive Ward', 'When taking Health damage while no Barrier is active, gain Barrier equal to 3% Max Health.', undefined, [rule('reactive-ward', 'on-damage-taken', [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.03 } }], { type: 'all', conditions: [healthDamage, noBarrier] }, { cooldownMs: 10_000 })]),
    major('vitality-c10', 'Arcane Aegis', 'Whenever Barrier is gained, heal 2% Max Health.', undefined, undefined, [rule('arcane-aegis', 'on-barrier-gained', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.02 } }], undefined, { cooldownMs: 3_000 })]),
  ]),
  lane('vitality', 'vitality-d', 3, [
    minor('vitality-d1', 'Recovery I', '+0.25 Health Regen', { healthRegen: 0.25 }),
    minor('vitality-d2', 'Healing Mastery I', '+3% Healing Done', { healingDonePct: 0.03 }),
    perk('vitality-d3', 'Victory Recovery', 'Killing an enemy heals 2% Max Health.', undefined, [rule('victory-recovery', 'on-kill', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.02 } }])]),
    minor('vitality-d4', 'Recovery II', '+0.25 Health Regen', { healthRegen: 0.25 }),
    minor('vitality-d5', 'Healing Mastery II', '+3% Healing Done', { healingDonePct: 0.03 }),
    perk('vitality-d6', 'Resilient Flow', 'Taking Health damage restores 1 Mana.', undefined, [rule('resilient-flow', 'on-damage-taken', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 1 } }], healthDamage, { cooldownMs: 2_000 })]),
    minor('vitality-d7', 'Recovery III', '+0.5 Health Regen', { healthRegen: 0.5 }),
    minor('vitality-d8', 'Healing Mastery III', '+4% Healing Done', { healingDonePct: 0.04 }),
    perk('vitality-d9', 'Emergency Recovery', 'While below 25% Health: +15% Healing Received.', [modifier('healing-received-percent', 0.15, { type: 'self-hp-below-percent', percent: 25 })]),
    major('vitality-d10', 'Deep Recovery', '+1 Health Regen and +10% Healing Received.', { healthRegen: 1 }, [modifier('healing-received-percent', 0.1)]),
  ]),
]

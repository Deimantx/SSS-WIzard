import { createRing, fixedEffects, linearStat, modifier, perk, minor, major, rankedModifier, rankValues, rule } from './arcaneCoreNodeFactory'
import { belowHp, negativeStatuses } from './arcaneCoreContentHelpers'

const ring1 = createRing('vitality', 1, [
  minor('vitality-r1-vitality', 'Vitality', '+10 Max Health per rank.', linearStat('maxHealth', 10)),
  minor('vitality-r1-natural-recovery', 'Natural Recovery', '+0.2 Health Regen per rank.', linearStat('healthRegen', 0.2)),
  minor('vitality-r1-arcane-defense', 'Arcane Defense', '+1 Defense per rank.', linearStat('defense', 1)),
  minor('vitality-r1-guard', 'Guard', '+0.5% Block Chance per rank.', linearStat('blockChance', 0.005)),
  minor('vitality-r1-barrier-power', 'Barrier Power', '+2% Barrier Power per rank.', linearStat('barrierPowerPct', 0.02)),
  minor('vitality-r1-healing-mastery', 'Healing Mastery', '+2% Healing Done per rank.', linearStat('healingDonePct', 0.02)),
  perk('vitality-r1-fortified-body', 'Fortified Body', 'Above 80% Health: -0.5% Damage Taken per rank.', rankedModifier('damage-taken-percent', -0.005, { type: 'self-hp-above-percent', percent: 80 })),
  perk('vitality-r1-victory-recovery', 'Victory Recovery', 'A kill heals 0.4% Max Health per rank.', (rank) => ({ rules: [rule('vitality-victory-recovery', 'on-kill', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.004 * rank } }])] })),
  major('vitality-r1-deep-recovery', 'Deep Recovery', '+1 Health Regen and +10% Healing Received.', fixedEffects({ stats: { healthRegen: 1 }, modifiers: [modifier('healing-received-percent', 0.1)] })),
])
const ring2 = createRing('vitality', 2, [
  perk('vitality-r2-second-wind', 'Second Wind', 'Below 30% Health: heal 1–5% Max Health. Cooldown 30 sec.', (rank) => ({ rules: [rule('vitality-second-wind', 'on-hp-threshold', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: rankValues(rank, [0.01, 0.02, 0.03, 0.04, 0.05]) } }], belowHp(30), { cooldownMs: 30000 })] })),
  perk('vitality-r2-steady-guard', 'Steady Guard', 'A successful Block heals 0.25–1.25% Max Health.', (rank) => ({ rules: [rule('vitality-steady-guard', 'on-damage-taken', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: rankValues(rank, [0.0025, 0.005, 0.0075, 0.01, 0.0125]) } }], { type: 'event-was-blocked' }, { cooldownMs: 2000 })] })),
  perk('vitality-r2-stonewall', 'Stonewall', 'While Barrier exists: +1 Defense per rank.', rankedModifier('defense-flat', 1, { type: 'self-has-barrier' })),
  perk('vitality-r2-ward-reinforcement', 'Ward Reinforcement', 'While Barrier exists: -0.75% Damage Taken per rank.', rankedModifier('damage-taken-percent', -0.0075, { type: 'self-has-barrier' })),
  minor('vitality-r2-reinforced-ward', 'Reinforced Ward', '+2 flat Barrier received per rank.', rankedModifier('barrier-received-flat', 2)),
  perk('vitality-r2-ward-recovery', 'Ward Recovery', 'Barrier break heals 0.6% Max Health per rank.', (rank) => ({ rules: [rule('vitality-ward-recovery', 'on-barrier-broken', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.006 * rank } }])] })),
  perk('vitality-r2-resilient-flow', 'Resilient Flow', 'Taking Health damage restores 1–3 Mana.', (rank) => ({ rules: [rule('vitality-resilient-flow', 'on-damage-taken', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: rankValues(rank, [1, 1, 2, 2, 3]) } }], { type: 'event-health-damage-positive' }, { cooldownMs: 2000 })] })),
  perk('vitality-r2-emergency-recovery', 'Emergency Recovery', 'Below 25% Health: +3% Healing Received per rank.', rankedModifier('healing-received-percent', 0.03, belowHp(25))),
  major('vitality-r2-unyielding', 'Unyielding', 'Below 50% Health: -6% Damage Taken.', fixedEffects({ modifiers: [modifier('damage-taken-percent', -0.06, belowHp(50))] })),
])
const ring3 = createRing('vitality', 3, [
  perk('vitality-r3-reactive-ward', 'Reactive Ward', 'Taking Health damage without Barrier grants 0.6–3% Max Health Barrier.', (rank) => ({ rules: [rule('vitality-reactive-ward', 'on-damage-taken', [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: rankValues(rank, [0.006, 0.012, 0.018, 0.024, 0.03]) } }], { type: 'event-health-damage-positive' }, { cooldownMs: 10000 })] })),
  perk('vitality-r3-guarded-soul', 'Guarded Soul', 'While Barrier exists: +0.5% Block Chance per rank.', rankedModifier('block-chance', 0.005, { type: 'self-has-barrier' })),
  minor('vitality-r3-aegis-strength', 'Aegis Strength', '+3% Barrier Power per rank.', linearStat('barrierPowerPct', 0.03)),
  perk('vitality-r3-recovery-under-fire', 'Recovery Under Fire', 'Below 50% Health: +0.2 Health Regen per rank.', linearStat('healthRegen', 0.2)),
  perk('vitality-r3-defensive-flow', 'Defensive Flow', 'Successful Block reduces Spell cooldowns by 20–100 ms.', (rank) => ({ rules: [rule('vitality-defensive-flow', 'on-damage-taken', [{ type: 'modify-cooldown', target: 'self', amountMs: -rankValues(rank, [20, 40, 60, 80, 100]) }], { type: 'event-was-blocked' })] })),
  perk('vitality-r3-ward-renewal', 'Ward Renewal', 'Whenever Barrier is gained, heal 0.25% Max Health per rank.', (rank) => ({ rules: [rule('vitality-ward-renewal', 'on-barrier-gained', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.0025 * rank } }], undefined, { cooldownMs: 3000 })] })),
  perk('vitality-r3-lasting-guard', 'Lasting Guard', 'Below 40% Health: +1 Defense per rank.', rankedModifier('defense-flat', 1, belowHp(40))),
  perk('vitality-r3-battle-recovery', 'Battle Recovery', 'A kill heals 0.5% Max Health per rank.', (rank) => ({ rules: [rule('vitality-battle-recovery', 'on-kill', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.005 * rank } }])] })),
  major('vitality-r3-arcane-aegis', 'Arcane Aegis', 'Whenever Barrier is gained, heal 2% Max Health.', fixedEffects({ rules: [rule('vitality-arcane-aegis', 'on-barrier-gained', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.02 } }], undefined, { cooldownMs: 3000 })] })),
])
const ring4 = createRing('vitality', 4, [
  minor('vitality-r4-apex-vitality', 'Apex Vitality', '+20 Max Health per rank.', linearStat('maxHealth', 20)),
  minor('vitality-r4-immortal-recovery', 'Immortal Recovery', '+0.4 Health Regen per rank.', linearStat('healthRegen', 0.4)),
  perk('vitality-r4-iron-will', 'Iron Will', 'Below 30% Health: -1% Damage Taken per rank.', rankedModifier('damage-taken-percent', -0.01, belowHp(30))),
  perk('vitality-r4-last-bastion', 'Last Bastion', 'Below 30% Health: +3% Barrier Power per rank.', rankedModifier('barrier-power-percent', 0.03, belowHp(30))),
  minor('vitality-r4-absolute-guard', 'Absolute Guard', '+0.75% Block Chance per rank.', linearStat('blockChance', 0.0075)),
  minor('vitality-r4-deep-fortification', 'Deep Fortification', '+2 Defense per rank.', linearStat('defense', 2)),
  perk('vitality-r4-emergency-aegis', 'Emergency Aegis', 'Below 20% Health, gain 2–10% Max Health Barrier.', (rank) => ({ rules: [rule('vitality-emergency-aegis', 'on-hp-threshold', [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: rankValues(rank, [0.02, 0.04, 0.06, 0.08, 0.1]) } }], belowHp(20), { cooldownMs: 30000 })] })),
  perk('vitality-r4-recovery-mastery', 'Recovery Mastery', '+2% Healing Received per rank.', rankedModifier('healing-received-percent', 0.02)),
  major('vitality-r4-survival-instinct', 'Survival Instinct', 'Once per dungeon run, lethal damage leaves the Wizard at 1 Health.', fixedEffects({ special: [{ type: 'lethal-survival', leaveAtHealth: 1, oncePerDungeonRun: true }] })),
])

export const vitalityNodes = [ring1, ring2, ring3, ring4]

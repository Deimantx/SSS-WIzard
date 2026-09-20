import { createRing, fixedEffects, linearStat, modifier, perk, minor, major, rankedModifier, rankValues, rule } from './arcaneCoreNodeFactory'
import { all, belowHp, negativeStatuses } from './arcaneCoreContentHelpers'

const ring1 = createRing('vitality', 1, [
  minor('vitality-r1-vitality', 'Vitality', '+10 Max Health per rank.', linearStat('maxHealth', 10)),
  minor('vitality-r1-natural-recovery', 'Natural Recovery', '+0.2 Health Regen per rank.', linearStat('healthRegen', 0.2)),
  minor('vitality-r1-arcane-defense', 'Arcane Defense', '+1 Defense per rank.', linearStat('defense', 1)),
  minor('vitality-r1-guard', 'Guard', 'Legacy compatibility slot; V6 catalog owns this mechanic.', linearStat('defense', 0)),
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
  perk('vitality-r3-reactive-ward', 'Reactive Ward', 'Taking Health damage without Barrier grants 0.6–3% Max Health Barrier.', (rank) => ({ rules: [rule('vitality-reactive-ward', 'on-damage-taken', [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: rankValues(rank, [0.006, 0.012, 0.018, 0.024, 0.03]) } }], all({ type: 'event-health-damage-positive' }, { type: 'self-barrier-at-most', value: 0 }), { cooldownMs: 10000 })] })),
  perk('vitality-r3-guarded-soul', 'Guarded Soul', 'While Barrier exists: +0.5% Block Chance per rank.', rankedModifier('block-chance', 0.005, { type: 'self-has-barrier' })),
  minor('vitality-r3-aegis-strength', 'Aegis Strength', '+3% Barrier Power per rank.', linearStat('barrierPowerPct', 0.03)),
  perk('vitality-r3-recovery-under-fire', 'Recovery Under Fire', 'Below 50% Health: +0.2 Health Regen per rank.', rankedModifier('health-regen-flat', 0.2, belowHp(50))),
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
  minor('vitality-r4-absolute-guard', 'Absolute Guard', 'Legacy compatibility slot; V6 catalog owns this mechanic.', linearStat('defense', 0)),
  minor('vitality-r4-deep-fortification', 'Deep Fortification', '+2 Defense per rank.', linearStat('defense', 2)),
  perk('vitality-r4-emergency-aegis', 'Emergency Aegis', 'Below 20% Health, gain 2–10% Max Health Barrier.', (rank) => ({ rules: [rule('vitality-emergency-aegis', 'on-hp-threshold', [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: rankValues(rank, [0.02, 0.04, 0.06, 0.08, 0.1]) } }], belowHp(20), { cooldownMs: 30000 })] })),
  perk('vitality-r4-recovery-mastery', 'Recovery Mastery', '+2% Healing Received per rank.', rankedModifier('healing-received-percent', 0.02)),
  major('vitality-r4-survival-instinct', 'Survival Instinct', 'Once per dungeon run, lethal damage leaves the Wizard at 1 Health.', fixedEffects({ special: [{ type: 'lethal-survival', leaveAtHealth: 1, oncePerDungeonRun: true }] })),
])

const ring5 = createRing('vitality', 5, [
  minor('vitality-r5-bastion-heart', 'Bastion Heart', '+30 Max Health per rank.', linearStat('maxHealth', 30)),
  minor('vitality-r5-iron-recovery', 'Iron Recovery', '+0.5 Health Regen per rank.', linearStat('healthRegen', 0.5)),
  minor('vitality-r5-fortress-defense', 'Fortress Defense', '+3 Defense per rank.', linearStat('defense', 3)),
  minor('vitality-r5-bastion-guard', 'Bastion Guard', 'Legacy compatibility slot; V6 catalog owns this mechanic.', linearStat('defense', 0)),
  minor('vitality-r5-greater-barrier', 'Greater Barrier', '+4% Barrier Power per rank.', linearStat('barrierPowerPct', 0.04)),
  minor('vitality-r5-resilient-healing', 'Resilient Healing', '+3% Healing Received per rank.', rankedModifier('healing-received-percent', 0.03)),
  perk('vitality-r5-fortified-ward', 'Fortified Ward', 'While Barrier exists: -1% Damage Taken per rank.', rankedModifier('damage-taken-percent', -0.01, { type: 'self-has-barrier' })),
  perk('vitality-r5-bastion-recovery', 'Bastion Recovery', 'A kill heals 0.75% Max Health per rank.', (rank) => ({ rules: [rule('vitality-bastion-recovery', 'on-kill', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.0075 * rank } }])] })),
  major('vitality-r5-living-fortress', 'Living Fortress', 'While Barrier exists: -8% Damage Taken and +5 Defense.', fixedEffects({ modifiers: [modifier('damage-taken-percent', -0.08, { type: 'self-has-barrier' }), modifier('defense-flat', 5, { type: 'self-has-barrier' })] })),
])
const ring6 = createRing('vitality', 6, [
  minor('vitality-r6-greater-vitality', 'Greater Vitality', '+40 Max Health per rank.', linearStat('maxHealth', 40)),
  minor('vitality-r6-greater-recovery', 'Greater Recovery', '+0.6 Health Regen per rank.', linearStat('healthRegen', 0.6)),
  minor('vitality-r6-restoration-mastery', 'Restoration Mastery', '+4% Healing Done per rank.', linearStat('healingDonePct', 0.04)),
  minor('vitality-r6-rejuvenation', 'Rejuvenation', '+4% Healing Received per rank.', rankedModifier('healing-received-percent', 0.04)),
  perk('vitality-r6-ward-life', 'Ward Life', 'Whenever Barrier is gained, heal 0.4% Max Health per rank.', (rank) => ({ rules: [rule('vitality-ward-life', 'on-barrier-gained', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.004 * rank } }], undefined, { cooldownMs: 2000 })] })),
  perk('vitality-r6-barrier-renewal', 'Barrier Renewal', 'When Barrier breaks, heal 1% Max Health per rank.', (rank) => ({ rules: [rule('vitality-barrier-renewal', 'on-barrier-broken', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.01 * rank } }])] })),
  perk('vitality-r6-desperate-regeneration', 'Desperate Regeneration', 'Below 50% Health: +0.5 Health Regen per rank.', rankedModifier('health-regen-flat', 0.5, belowHp(50))),
  perk('vitality-r6-renewed-guard', 'Renewed Guard', 'A successful Block heals 0.4–2% Max Health.', (rank) => ({ rules: [rule('vitality-renewed-guard', 'on-damage-taken', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: rankValues(rank, [0.004, 0.008, 0.012, 0.016, 0.02]) } }], { type: 'event-was-blocked' }, { cooldownMs: 2000 })] })),
  major('vitality-r6-phoenix-ward', 'Phoenix Ward', 'Crossing below 20% Health grants Barrier and heals for 10% Max Health.', fixedEffects({ rules: [rule('vitality-phoenix-ward', 'on-hp-threshold', [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.15 } }, { type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.1 } }], belowHp(20), { cooldownMs: 30000 })] })),
])
const ring7 = createRing('vitality', 7, [
  minor('vitality-r7-undying-vitality', 'Undying Vitality', '+50 Max Health per rank.', linearStat('maxHealth', 50)),
  minor('vitality-r7-undying-defense', 'Undying Defense', '+4 Defense per rank.', linearStat('defense', 4)),
  minor('vitality-r7-undying-guard', 'Undying Guard', 'Legacy compatibility slot; V6 catalog owns this mechanic.', linearStat('defense', 0)),
  minor('vitality-r7-undying-ward', 'Undying Ward', '+5% Barrier Power per rank.', linearStat('barrierPowerPct', 0.05)),
  perk('vitality-r7-refuse-death', 'Refuse Death', 'Below 35% Health: -1.25% Damage Taken per rank.', rankedModifier('damage-taken-percent', -0.0125, belowHp(35))),
  perk('vitality-r7-barrier-armor', 'Barrier Armor', 'While Barrier exists: +2 Defense per rank.', rankedModifier('defense-flat', 2, { type: 'self-has-barrier' })),
  perk('vitality-r7-pain-to-mana', 'Pain to Mana', 'Taking positive Health damage restores 1–5 Mana.', (rank) => ({ rules: [rule('vitality-pain-to-mana', 'on-damage-taken', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: rank } }], { type: 'event-health-damage-positive' }, { cooldownMs: 2000 })] })),
  perk('vitality-r7-undying-recovery', 'Undying Recovery', 'A kill heals 1% Max Health per rank.', (rank) => ({ rules: [rule('vitality-undying-recovery', 'on-kill', [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.01 * rank } }])] })),
  major('vitality-r7-undying-will', 'Undying Will', 'Below 35% Health: -10% Damage Taken and +20% Healing Received.', fixedEffects({ modifiers: [modifier('damage-taken-percent', -0.1, belowHp(35)), modifier('healing-received-percent', 0.2, belowHp(35))] })),
])
const ring8 = createRing('vitality', 8, [
  minor('vitality-r8-eternal-vitality', 'Eternal Vitality', '+75 Max Health per rank.', linearStat('maxHealth', 75)),
  minor('vitality-r8-eternal-recovery', 'Eternal Recovery', '+1 Health Regen per rank.', linearStat('healthRegen', 1)),
  minor('vitality-r8-eternal-defense', 'Eternal Defense', '+5 Defense per rank.', linearStat('defense', 5)),
  minor('vitality-r8-eternal-guard', 'Eternal Guard', 'Legacy compatibility slot; V6 catalog owns this mechanic.', linearStat('defense', 0)),
  minor('vitality-r8-eternal-barrier', 'Eternal Barrier', '+6% Barrier Power per rank.', linearStat('barrierPowerPct', 0.06)),
  minor('vitality-r8-eternal-restoration', 'Eternal Restoration', '+5% Healing Done per rank.', linearStat('healingDonePct', 0.05)),
  perk('vitality-r8-eternal-ward', 'Eternal Ward', 'While Barrier exists: -1.5% Damage Taken per rank.', rankedModifier('damage-taken-percent', -0.015, { type: 'self-has-barrier' })),
  perk('vitality-r8-final-recovery', 'Final Recovery', 'Below 25% Health: +5% Healing Received per rank.', rankedModifier('healing-received-percent', 0.05, belowHp(25))),
  major('vitality-r8-eternal-aegis', 'Eternal Aegis', '+150 Max Health, +10 Defense, +10% Barrier Power, and +10% Healing Received.', fixedEffects({ stats: { maxHealth: 150, defense: 10, barrierPowerPct: 0.1 }, modifiers: [modifier('healing-received-percent', 0.1)] })),
])

export const vitalityNodes = [ring1, ring2, ring3, ring4, ring5, ring6, ring7, ring8]

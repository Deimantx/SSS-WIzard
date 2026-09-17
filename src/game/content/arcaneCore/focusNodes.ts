import { createRing, fixedEffects, linearStat, modifier, perk, minor, major, rankedModifier, rankValues, rule } from './arcaneCoreNodeFactory'
import { aboveMana, belowMana } from './arcaneCoreContentHelpers'

const ring1 = createRing('focus', 1, [
  minor('focus-r1-mana-reservoir', 'Mana Reservoir', '+10 Max Mana per rank.', linearStat('maxMana', 10)),
  minor('focus-r1-mana-flow', 'Mana Flow', '+0.25 Mana Regen/sec per rank.', linearStat('manaRegen', 0.25)),
  minor('focus-r1-mana-efficiency', 'Mana Efficiency', '-1% Spell Mana Cost per rank.', linearStat('manaCostReductionPct', 0.01)),
  minor('focus-r1-focus-capacity', 'Focus Capacity', '+1 Max Focus per rank.', linearStat('maxFocus', 1)),
  minor('focus-r1-auto-cast-efficiency', 'Auto-Cast Efficiency', '-1% combat Spell Auto-Cast Focus cost per rank.', linearStat('focusEfficiencyPct', 0.01)),
  minor('focus-r1-efficient-recovery', 'Efficient Recovery', '+1% Cooldown Recovery per rank.', linearStat('cooldownRecoveryPct', 0.01)),
  perk('focus-r1-deep-reserves', 'Deep Reserves', 'Above 80% Mana: +1% Spell Damage per rank.', rankedModifier('spell-damage-percent', 0.01, aboveMana(80))),
  perk('focus-r1-low-mana-recovery', 'Low Mana Recovery', 'Below 25% Mana: +5% Mana Regen per rank.', rankedModifier('mana-regen-percent', 0.05, belowMana(25))),
  major('focus-r1-bottomless-well', 'Bottomless Well', '+40 Max Mana and +10% Mana Regen.', fixedEffects({ stats: { maxMana: 40 }, modifiers: [modifier('mana-regen-percent', 0.1)] })),
])
const ring2 = createRing('focus', 2, [
  perk('focus-r2-mana-recovery', 'Mana Recovery', 'A kill restores 1–5 Mana.', (rank) => ({ rules: [rule('focus-mana-recovery', 'on-kill', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: rank } }])] })),
  perk('focus-r2-focused-casting', 'Focused Casting', 'Above 50% Mana: +0.5% Cooldown Recovery per rank.', rankedModifier('cooldown-recovery-percent', 0.005, aboveMana(50))),
  perk('focus-r2-controlled-expenditure', 'Controlled Expenditure', 'After spending Mana on a Spell, restore 1–3 Mana.', (rank) => ({ rules: [rule('focus-controlled-expenditure', 'on-spell-cast', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: rankValues(rank, [1, 1, 2, 2, 3]) } }], { type: 'event-amount-positive' }, { cooldownMs: 1000 })] })),
  perk('focus-r2-focused-power', 'Focused Power', '+0.05 Spell Power per Reserved Focus per rank.', (rank) => ({ special: [{ type: 'reserved-focus-spell-power', spellPowerPerReservedFocus: 0.05 * rank }] })),
  perk('focus-r2-clear-mind', 'Clear Mind', '+0.01 Mana Regen/sec per Free Focus per rank.', (rank) => ({ special: [{ type: 'free-focus-mana-regen', manaRegenPerFreeFocus: 0.01 * rank }] })),
  perk('focus-r2-reserve-shield', 'Reserve Shield', 'Above 80% Mana: -0.5% Damage Taken per rank.', rankedModifier('damage-taken-percent', -0.005, aboveMana(80))),
  minor('focus-r2-leyline-efficiency', 'Leyline Efficiency', '+2% Mana Regen per rank.', rankedModifier('mana-regen-percent', 0.02)),
  perk('focus-r2-emergency-channel', 'Emergency Channel', 'Below 10% Mana: +10% Mana Regen per rank.', rankedModifier('mana-regen-percent', 0.1, belowMana(10))),
  major('focus-r2-perfect-focus', 'Perfect Focus', '+2 Max Focus and +5% combat Auto-Cast Focus Efficiency.', fixedEffects({ stats: { maxFocus: 2, focusEfficiencyPct: 0.05 } })),
])
const ring3 = createRing('focus', 3, [
  minor('focus-r3-arcane-reservoir', 'Arcane Reservoir II', '+15 Max Mana per rank.', linearStat('maxMana', 15)),
  minor('focus-r3-mana-flow', 'Mana Flow II', '+0.35 Mana Regen/sec per rank.', linearStat('manaRegen', 0.35)),
  minor('focus-r3-spell-economy', 'Spell Economy', '-1% Spell Mana Cost per rank.', linearStat('manaCostReductionPct', 0.01)),
  minor('focus-r3-combat-focus', 'Combat Focus', '+1 Max Focus per rank.', linearStat('maxFocus', 1)),
  perk('focus-r3-high-mana-precision', 'High Mana Precision', 'Above 75% Mana: +0.5% Critical Chance per rank.', rankedModifier('crit-chance', 0.005, aboveMana(75))),
  perk('focus-r3-low-mana-haste', 'Low Mana Haste', 'Below 25% Mana: +1% Cooldown Recovery per rank.', rankedModifier('cooldown-recovery-percent', 0.01, belowMana(25))),
  perk('focus-r3-victory-channel', 'Victory Channel', 'A kill restores 2–10 Mana.', (rank) => ({ rules: [rule('focus-victory-channel', 'on-kill', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 2 * rank } }])] })),
  perk('focus-r3-resonant-power', 'Resonant Power', 'Above 70% Mana: +1.5% Spell Damage per rank.', rankedModifier('spell-damage-percent', 0.015, aboveMana(70))),
  major('focus-r3-mana-overflow', 'Mana Overflow', 'Mana generated above Max Mana becomes Barrier at 25% efficiency.', fixedEffects({ special: [{ type: 'mana-overflow-to-barrier', conversion: 0.25, maxHealthPercentPerSecondCap: 0.05 }] })),
])
const ring4 = createRing('focus', 4, [
  minor('focus-r4-apex-reservoir', 'Apex Reservoir', '+20 Max Mana per rank.', linearStat('maxMana', 20)),
  minor('focus-r4-apex-flow', 'Apex Flow', '+0.5 Mana Regen/sec per rank.', linearStat('manaRegen', 0.5)),
  minor('focus-r4-perfect-economy', 'Perfect Economy', '-1% Spell Mana Cost per rank.', linearStat('manaCostReductionPct', 0.01)),
  minor('focus-r4-perfect-focus-capacity', 'Perfect Focus Capacity', '+1 Max Focus per rank.', linearStat('maxFocus', 1)),
  minor('focus-r4-auto-cast-mastery', 'Auto-Cast Mastery', '-1.5% combat Spell Auto-Cast Focus cost per rank.', linearStat('focusEfficiencyPct', 0.015)),
  minor('focus-r4-arcane-readiness', 'Arcane Readiness', '+1.5% Cooldown Recovery per rank.', linearStat('cooldownRecoveryPct', 0.015)),
  perk('focus-r4-high-mana-dominion', 'High Mana Dominion', 'Above 80% Mana: +2% Spell Damage per rank.', rankedModifier('spell-damage-percent', 0.02, aboveMana(80))),
  perk('focus-r4-desperation-channel', 'Desperation Channel', 'Below 10% Mana: +15% Mana Regen per rank.', rankedModifier('mana-regen-percent', 0.15, belowMana(10))),
  major('focus-r4-arcane-efficiency', 'Arcane Efficiency', 'Every fifth successful Spell costs no Mana.', fixedEffects({ special: [{ type: 'nth-spell-free', every: 5 }] })),
])

const ring5 = createRing('focus', 5, [
  minor('focus-r5-convergent-reservoir', 'Convergent Reservoir', '+25 Max Mana per rank.', linearStat('maxMana', 25)),
  minor('focus-r5-convergent-flow', 'Convergent Flow', '+0.6 Mana Regen/sec per rank.', linearStat('manaRegen', 0.6)),
  minor('focus-r5-convergent-efficiency', 'Convergent Efficiency', '-1.5% Spell Mana Cost per rank.', linearStat('manaCostReductionPct', 0.015)),
  minor('focus-r5-expanded-focus', 'Expanded Focus', '+1 Max Focus per rank.', linearStat('maxFocus', 1)),
  minor('focus-r5-auto-cast-convergence', 'Auto-Cast Convergence', '-2% combat Spell Auto-Cast Focus cost per rank.', linearStat('focusEfficiencyPct', 0.02)),
  minor('focus-r5-convergent-recovery', 'Convergent Recovery', '+2% Cooldown Recovery per rank.', linearStat('cooldownRecoveryPct', 0.02)),
  perk('focus-r5-full-reservoir', 'Full Reservoir', 'Above 80% Mana: +2% Spell Damage per rank.', rankedModifier('spell-damage-percent', 0.02, aboveMana(80))),
  perk('focus-r5-empty-reservoir', 'Empty Reservoir', 'Below 20% Mana: +20% Mana Regen per rank.', rankedModifier('mana-regen-percent', 0.2, belowMana(20))),
  major('focus-r5-arcane-convergence', 'Arcane Convergence', '+75 Max Mana, +2 Max Focus, and +10% Spell Damage above 70% Mana.', fixedEffects({ stats: { maxMana: 75, maxFocus: 2 }, modifiers: [modifier('spell-damage-percent', 0.1, aboveMana(70))] })),
])
const ring6 = createRing('focus', 6, [
  minor('focus-r6-overchannel-reservoir', 'Overchannel Reservoir', '+30 Max Mana per rank.', linearStat('maxMana', 30)),
  minor('focus-r6-overchannel-flow', 'Overchannel Flow', '+0.75 Mana Regen/sec per rank.', linearStat('manaRegen', 0.75)),
  minor('focus-r6-overchannel-economy', 'Overchannel Economy', '-2% Spell Mana Cost per rank.', linearStat('manaCostReductionPct', 0.02)),
  minor('focus-r6-overchannel-focus', 'Overchannel Focus', '+1 Max Focus per rank.', linearStat('maxFocus', 1)),
  minor('focus-r6-auto-cast-overchannel', 'Auto-Cast Overchannel', '-2.5% combat Spell Auto-Cast Focus cost per rank.', linearStat('focusEfficiencyPct', 0.025)),
  perk('focus-r6-mana-rebound', 'Mana Rebound', 'After a paid Spell cast, restore 1–5 Mana.', (rank) => ({ rules: [rule('focus-mana-rebound', 'on-spell-cast', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: rank } }], { type: 'event-amount-positive' }, { cooldownMs: 1000 })] })),
  perk('focus-r6-low-mana-acceleration', 'Low Mana Acceleration', 'Below 25% Mana: +2% Cooldown Recovery per rank.', rankedModifier('cooldown-recovery-percent', 0.02, belowMana(25))),
  perk('focus-r6-high-mana-precision', 'High Mana Precision', 'Above 75% Mana: +0.75% Critical Chance per rank.', rankedModifier('crit-chance', 0.0075, aboveMana(75))),
  major('focus-r6-overchannel', 'Overchannel', 'Above 80% Mana: +10% Spell Damage and +8% Cooldown Recovery. Below 20% Mana: +50% Mana Regen.', fixedEffects({ modifiers: [modifier('spell-damage-percent', 0.1, aboveMana(80)), modifier('cooldown-recovery-percent', 0.08, aboveMana(80)), modifier('mana-regen-percent', 0.5, belowMana(20))] })),
])
const ring7 = createRing('focus', 7, [
  minor('focus-r7-astral-reservoir', 'Astral Reservoir', '+40 Max Mana per rank.', linearStat('maxMana', 40)),
  minor('focus-r7-astral-flow', 'Astral Flow', '+1 Mana Regen/sec per rank.', linearStat('manaRegen', 1)),
  minor('focus-r7-astral-economy', 'Astral Economy', '-2% Spell Mana Cost per rank.', linearStat('manaCostReductionPct', 0.02)),
  minor('focus-r7-astral-focus', 'Astral Focus', '+1 Max Focus per rank.', linearStat('maxFocus', 1)),
  minor('focus-r7-astral-auto-cast', 'Astral Auto-Cast', '-3% combat Spell Auto-Cast Focus cost per rank.', linearStat('focusEfficiencyPct', 0.03)),
  perk('focus-r7-focused-mind', 'Focused Mind', '+0.1 Spell Power per Reserved Focus per rank.', (rank) => ({ special: [{ type: 'reserved-focus-spell-power', spellPowerPerReservedFocus: 0.1 * rank }] })),
  perk('focus-r7-open-mind', 'Open Mind', '+0.02 Mana Regen/sec per Free Focus per rank.', (rank) => ({ special: [{ type: 'free-focus-mana-regen', manaRegenPerFreeFocus: 0.02 * rank }] })),
  perk('focus-r7-astral-victory', 'Astral Victory', 'A kill restores 4–20 Mana.', (rank) => ({ rules: [rule('focus-astral-victory', 'on-kill', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 4 * rank } }])] })),
  major('focus-r7-astral-mind', 'Astral Mind', '+4 Max Focus, +15% combat Auto-Cast Focus Efficiency, and +15% Mana Regen.', fixedEffects({ stats: { maxFocus: 4, focusEfficiencyPct: 0.15 }, modifiers: [modifier('mana-regen-percent', 0.15)] })),
])
const ring8 = createRing('focus', 8, [
  minor('focus-r8-singularity-reservoir', 'Singularity Reservoir', '+60 Max Mana per rank.', linearStat('maxMana', 60)),
  minor('focus-r8-singularity-flow', 'Singularity Flow', '+1.5 Mana Regen/sec per rank.', linearStat('manaRegen', 1.5)),
  minor('focus-r8-singularity-economy', 'Singularity Economy', '-2.5% Spell Mana Cost per rank.', linearStat('manaCostReductionPct', 0.025)),
  minor('focus-r8-singularity-focus', 'Singularity Focus', '+1 Max Focus per rank.', linearStat('maxFocus', 1)),
  minor('focus-r8-singularity-auto-cast', 'Singularity Auto-Cast', '-3.5% combat Spell Auto-Cast Focus cost per rank.', linearStat('focusEfficiencyPct', 0.035)),
  perk('focus-r8-singularity-power', 'Singularity Power', 'Above 80% Mana: +3% Spell Damage per rank.', rankedModifier('spell-damage-percent', 0.03, aboveMana(80))),
  perk('focus-r8-singularity-haste', 'Singularity Haste', 'Below 25% Mana: +3% Cooldown Recovery per rank.', rankedModifier('cooldown-recovery-percent', 0.03, belowMana(25))),
  perk('focus-r8-singularity-recovery', 'Singularity Recovery', 'Below 10% Mana: +25% Mana Regen per rank.', rankedModifier('mana-regen-percent', 0.25, belowMana(10))),
  major('focus-r8-arcane-singularity', 'Arcane Singularity', '+100 Max Mana, +20% Mana Regen, and +10% Cooldown Recovery.', fixedEffects({ stats: { maxMana: 100 }, modifiers: [modifier('mana-regen-percent', 0.2), modifier('cooldown-recovery-percent', 0.1)] })),
])

export const focusNodes = [ring1, ring2, ring3, ring4, ring5, ring6, ring7, ring8]

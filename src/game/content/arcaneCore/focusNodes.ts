import { createRing, linearStat, major, minor, perk, rankedModifier, v7Mechanic } from './arcaneCoreNodeFactory'

const mechanic = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, slot: `S${5 | 6 | 7 | 8}` | 'M', name: string) => v7Mechanic('focus', ring, slot, name)
const manaRegen = (perRank: number) => rankedModifier('mana-regen-percent', perRank)

const ring1 = createRing('focus', 1, [
  minor('focus-r1-mana-reservoir', 'Mana Reservoir', '+0.5% Max Mana per rank. Rank 5: +2.5%.', linearStat('maxManaPct', 0.005)),
  minor('focus-r1-mana-flow', 'Mana Flow', '+0.6% Mana Regen per rank. Rank 5: +3%.', manaRegen(0.006)),
  minor('focus-r1-mana-efficiency', 'Arcane Economy', '-0.2% Mana Cost per rank. Rank 5: -1%.', linearStat('manaCostReductionPct', 0.002)),
  minor('focus-r1-focus-capacity', 'Focused Capacity', '+0.4 Max Focus per rank. Rank 5: +2.', linearStat('maxFocus', 0.4)),
  perk('focus-r1-auto-cast-efficiency', 'Conservation', 'Occasionally restores a small amount of Mana after a completed Spell.', mechanic(1, 'S5', 'Conservation')),
  perk('focus-r1-efficient-recovery', 'Emergency Flow', 'Below 25% Mana, Mana regeneration receives a small bounded improvement.', mechanic(1, 'S6', 'Emergency Flow')),
  perk('focus-r1-deep-reserves', 'Full Reservoir', 'After maintaining high Mana, the next Spell receives a small cost reduction.', mechanic(1, 'S7', 'Full Reservoir')),
  perk('focus-r1-low-mana-recovery', 'Quiet Mind', 'Low-pressure moments provide a small resource benefit.', mechanic(1, 'S8', 'Quiet Mind')),
  major('focus-r1-bottomless-well', 'Deep Breathing', 'The first time each encounter Mana falls below 25%, restore 10% Max Mana. Once per encounter. No free cast.', mechanic(1, 'M', 'Deep Breathing')),
])

const ring2 = createRing('focus', 2, [
  minor('focus-r2-mana-recovery', 'Mana Reservoir II', '+0.6% Max Mana per rank. Rank 5: +3%.', linearStat('maxManaPct', 0.006)),
  minor('focus-r2-focused-casting', 'Mana Flow II', '+0.8% Mana Regen per rank. Rank 5: +4%.', manaRegen(0.008)),
  minor('focus-r2-controlled-expenditure', 'Focus Discipline', '+0.2% Focus Efficiency per rank. Rank 5: +1%.', linearStat('focusEfficiencyPct', 0.002)),
  minor('focus-r2-focused-power', 'Focused Capacity II', '+0.6 Max Focus per rank. Rank 5: +3.', linearStat('maxFocus', 0.6)),
  perk('focus-r2-clear-mind', 'Echo Harmony', 'Alternating cast modes restore a small amount of Mana.', mechanic(2, 'S5', 'Echo Harmony')),
  perk('focus-r2-reserve-shield', 'Manual Reservoir', 'A MANUAL cast after AUTO receives a small resource return.', mechanic(2, 'S6', 'Manual Reservoir')),
  perk('focus-r2-leyline-efficiency', 'Alternating Mind', 'Alternating AUTO and MANUAL casts gain a small Action Speed bonus.', mechanic(2, 'S7', 'Alternating Mind')),
  perk('focus-r2-emergency-channel', 'Efficient Queue', 'Queued casts gain a small Mana cost reduction.', mechanic(2, 'S8', 'Efficient Queue')),
  major('focus-r2-perfect-focus', 'Dual Mind', 'When AUTO resolves, the next MANUAL cast within 5 seconds gains 8% lower Mana Cost and +5% Action Speed; MANUAL applies the same to the next AUTO. Consumed on use and does not stack.', mechanic(2, 'M', 'Dual Mind')),
])

const ring3 = createRing('focus', 3, [
  minor('focus-r3-arcane-reservoir', 'Resonant Reservoir', '+0.6% Max Mana per rank. Rank 5: +3%.', linearStat('maxManaPct', 0.006)),
  minor('focus-r3-mana-flow', 'Arcane Economy II', '-0.25% Mana Cost per rank. Rank 5: -1.25%.', linearStat('manaCostReductionPct', 0.0025)),
  minor('focus-r3-spell-economy', 'Echo Efficiency', '+0.3% Focus Efficiency per rank. Rank 5: +1.5%.', linearStat('focusEfficiencyPct', 0.003)),
  minor('focus-r3-combat-focus', 'Resonant Focus', '+0.6 Max Focus per rank. Rank 5: +3.', linearStat('maxFocus', 0.6)),
  perk('focus-r3-high-mana-precision', 'Reserved Power', 'Reserved Focus improves a later Spell resource window.', mechanic(3, 'S5', 'Reserved Power')),
  perk('focus-r3-low-mana-haste', 'Free Mind', 'Free Focus improves a later cast window.', mechanic(3, 'S6', 'Free Mind')),
  perk('focus-r3-victory-channel', 'Resonant Cast', 'A successful Spell prepares a bounded resource resonance.', mechanic(3, 'S7', 'Resonant Cast')),
  perk('focus-r3-resonant-power', 'Prepared Slot', 'A fresh loadout slot receives a small cost benefit.', mechanic(3, 'S8', 'Prepared Slot')),
  major('focus-r3-mana-overflow', 'Resonance', 'Every 10th successful Spell refunds 50% of its final Mana cost after completion. The Spell must have enough Mana to begin normally.', mechanic(3, 'M', 'Resonance')),
])

const ring4 = createRing('focus', 4, [
  minor('focus-r4-apex-reservoir', 'Transcendent Reservoir', '+0.7% Max Mana per rank. Rank 5: +3.5%.', linearStat('maxManaPct', 0.007)),
  minor('focus-r4-apex-flow', 'Transcendent Flow', '+0.8% Mana Regen per rank. Rank 5: +4%.', manaRegen(0.008)),
  minor('focus-r4-perfect-economy', 'Arcane Economy III', '-0.3% Mana Cost per rank. Rank 5: -1.5%.', linearStat('manaCostReductionPct', 0.003)),
  minor('focus-r4-perfect-focus-capacity', 'Transcendent Efficiency', '+0.3% Focus Efficiency per rank. Rank 5: +1.5%.', linearStat('focusEfficiencyPct', 0.003)),
  perk('focus-r4-auto-cast-mastery', 'Overflow Ward', 'Excess Mana restoration creates a bounded defensive reserve.', mechanic(4, 'S5', 'Overflow Ward')),
  perk('focus-r4-arcane-readiness', 'Mana to Tempo', 'A meaningful Mana restoration briefly improves Action Speed.', mechanic(4, 'S6', 'Mana to Tempo')),
  perk('focus-r4-high-mana-dominion', 'Stable Reserve', 'Maintaining a reserve prevents a small amount of resource loss.', mechanic(4, 'S7', 'Stable Reserve')),
  perk('focus-r4-desperation-channel', 'Emergency Conversion', 'A low-Mana event converts a bounded resource amount into defense.', mechanic(4, 'S8', 'Emergency Conversion')),
  major('focus-r4-arcane-efficiency', 'Transcendence', 'Excess Mana restoration becomes Barrier at 50% conversion value, capped at 5% Max Health. No cooldown-reduction overflow conversion.', mechanic(4, 'M', 'Transcendence')),
])

const ring5 = createRing('focus', 5, [
  minor('focus-r5-convergent-reservoir', 'Convergent Reservoir', '+0.8% Max Mana per rank. Rank 5: +4%.', linearStat('maxManaPct', 0.008)),
  minor('focus-r5-convergent-flow', 'Convergent Flow', '+1% Mana Regen per rank. Rank 5: +5%.', manaRegen(0.01)),
  minor('focus-r5-convergent-efficiency', 'Convergent Focus', '+0.8 Max Focus per rank. Rank 5: +4.', linearStat('maxFocus', 0.8)),
  minor('focus-r5-expanded-focus', 'Convergent Efficiency', '+0.4% Focus Efficiency per rank. Rank 5: +2%.', linearStat('focusEfficiencyPct', 0.004)),
  perk('focus-r5-auto-cast-convergence', 'Balanced Mind', 'Mixed AUTO/MANUAL loadouts gain a small Action Speed benefit.', mechanic(5, 'S5', 'Balanced Mind')),
  perk('focus-r5-convergent-recovery', 'Manual Battery', 'MANUAL casting stores a bounded resource charge.', mechanic(5, 'S6', 'Manual Battery')),
  perk('focus-r5-full-reservoir', 'Convergent Queue', 'Queued casts interact with the stored resource charge.', mechanic(5, 'S7', 'Convergent Queue')),
  perk('focus-r5-empty-reservoir', 'Reserved Conversion', 'Reserved Focus supports a bounded AUTO resource return.', mechanic(5, 'S8', 'Reserved Conversion')),
  major('focus-r5-arcane-convergence', 'Deep Reservoir', 'The first Spell each encounter costs 0 Mana and still starts normal cooldown.', mechanic(5, 'M', 'Deep Reservoir')),
])

const ring6 = createRing('focus', 6, [
  minor('focus-r6-overchannel-reservoir', 'Overchannel Reservoir', '+0.8% Max Mana per rank. Rank 5: +4%.', linearStat('maxManaPct', 0.008)),
  minor('focus-r6-overchannel-flow', 'Deep Economy', '-0.35% Mana Cost per rank. Rank 5: -1.75%.', linearStat('manaCostReductionPct', 0.0035)),
  minor('focus-r6-overchannel-economy', 'Overchannel Focus', '+0.8 Max Focus per rank. Rank 5: +4.', linearStat('maxFocus', 0.8)),
  minor('focus-r6-overchannel-focus', 'Overchannel Efficiency', '+0.5% Focus Efficiency per rank. Rank 5: +2.5%.', linearStat('focusEfficiencyPct', 0.005)),
  perk('focus-r6-auto-cast-overchannel', 'Overchannel', 'A high-spend window temporarily improves resource output.', mechanic(6, 'S5', 'Overchannel')),
  perk('focus-r6-mana-rebound', 'Deep Draw', 'Low Mana reduces the next Spell cost by a bounded amount.', mechanic(6, 'S6', 'Deep Draw')),
  perk('focus-r6-low-mana-acceleration', 'Arcane Return', 'A completed Spell returns a bounded amount of Mana.', mechanic(6, 'S7', 'Arcane Return')),
  perk('focus-r6-high-mana-precision', 'Reservoir Break', 'Breaking a high reserve creates a bounded payoff.', mechanic(6, 'S8', 'Reservoir Break')),
  major('focus-r6-overchannel', 'Overchannel', 'After spending at least 25% Max Mana within 4 seconds, for 5 seconds gain +10% Action Speed and +7.5% Damage/Healing/Barrier effectiveness. Mana Regen is disabled and the effect cannot stack.', mechanic(6, 'M', 'Overchannel')),
])

const ring7 = createRing('focus', 7, [
  minor('focus-r7-astral-reservoir', 'Astral Reservoir', '+1% Max Mana per rank. Rank 5: +5%.', linearStat('maxManaPct', 0.01)),
  minor('focus-r7-astral-flow', 'Astral Flow', '+1.2% Mana Regen per rank. Rank 5: +6%.', manaRegen(0.012)),
  minor('focus-r7-astral-economy', 'Astral Economy', '-0.4% Mana Cost per rank. Rank 5: -2%.', linearStat('manaCostReductionPct', 0.004)),
  minor('focus-r7-astral-focus', 'Astral Efficiency', '+0.6% Focus Efficiency per rank. Rank 5: +3%.', linearStat('focusEfficiencyPct', 0.006)),
  perk('focus-r7-astral-auto-cast', 'Astral Reserved Power', 'Reserved Focus grants capped Spell Power.', mechanic(7, 'S5', 'Astral Reserved Power')),
  perk('focus-r7-focused-mind', 'Astral Open Mind', 'Free Focus grants capped Action Speed.', mechanic(7, 'S6', 'Astral Open Mind')),
  perk('focus-r7-open-mind', 'Astral Rotation', 'Rotating loadout slots creates a bounded resource return.', mechanic(7, 'S7', 'Astral Rotation')),
  perk('focus-r7-astral-victory', 'Echo Cascade', 'Repeated AUTO casts prepare a bounded MANUAL payoff.', mechanic(7, 'S8', 'Echo Cascade')),
  major('focus-r7-astral-mind', 'Astral Mind', 'Every 10 Reserved Focus grants +0.5% Spell Power and every 10 Free Focus grants +0.5% Action Speed, each capped at +7.5%.', mechanic(7, 'M', 'Astral Mind')),
])

const ring8 = createRing('focus', 8, [
  minor('focus-r8-singularity-reservoir', 'Singularity Flow', '+1.6% Mana Regen per rank. Rank 5: +8%.', manaRegen(0.016)),
  minor('focus-r8-singularity-flow', 'Singularity Economy', '-0.5% Mana Cost per rank. Rank 5: -2.5%.', linearStat('manaCostReductionPct', 0.005)),
  minor('focus-r8-singularity-economy', 'Singularity Focus', '+0.8 Max Focus per rank. Rank 5: +4.', linearStat('maxFocus', 0.8)),
  minor('focus-r8-singularity-focus', 'Singularity Efficiency', '+0.7% Focus Efficiency per rank. Rank 5: +3.5%.', linearStat('focusEfficiencyPct', 0.007)),
  perk('focus-r8-singularity-auto-cast', 'Zero Point', 'A rare late-game cast window sharply reduces Mana cost.', mechanic(8, 'S5', 'Zero Point')),
  perk('focus-r8-singularity-power', 'Event Horizon', 'Full-reserve Mana creates a bounded charge for a later cast.', mechanic(8, 'S6', 'Event Horizon')),
  perk('focus-r8-singularity-haste', 'Singularity Manual', 'A MANUAL cast can consume a prepared AUTO resource payoff.', mechanic(8, 'S7', 'Singularity Manual')),
  perk('focus-r8-singularity-recovery', 'Focus Collapse', 'A low-Mana event creates a bounded final resource payoff.', mechanic(8, 'S8', 'Focus Collapse')),
  major('focus-r8-arcane-singularity', 'Arcane Singularity', 'Once per encounter, when Mana would fall below 10%, set Mana to 50% Max Mana and enter Singularity for 5 seconds. Mana Costs are reduced by 40%; Mana Regen is disabled.', mechanic(8, 'M', 'Arcane Singularity')),
])

export const focusNodes = [ring1, ring2, ring3, ring4, ring5, ring6, ring7, ring8]

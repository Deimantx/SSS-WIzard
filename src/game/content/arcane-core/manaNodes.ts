import { createRing, linearStat, major, minor, perk, rankedModifier, arcaneCoreMechanic } from './arcaneCoreNodeFactory'

const mechanic = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, slot: `S${5 | 6 | 7 | 8}` | 'M', name: string) => arcaneCoreMechanic('mana', ring, slot, name)
const manaRegen = (perRank: number) => rankedModifier('mana-regen-percent', perRank)

const ring1 = createRing('mana', 1, [
  minor('mana-r1-mana-reservoir', 'Mana Reservoir', '+0.5% Max Mana per rank. Rank 5: +2.5%.', linearStat('maxManaPct', 0.005)),
  minor('mana-r1-mana-flow', 'Mana Flow', '+0.5% Mana Regen per rank. Rank 5: +2.5%.', manaRegen(0.005)),
  minor('mana-r1-mana-economy', 'Arcane Economy', '-0.15% Mana Cost per rank. Rank 5: -0.75%.', linearStat('manaCostReductionPct', 0.0015)),
  minor('mana-r1-deep-current', 'Deep Current', '+1 flat Max Mana per rank. Rank 5: +5.', linearStat('maxMana', 1)),
  perk('mana-r1-conservation', 'Conservation', 'Every 6th successful Spell restores 1/2/3/4/5 Mana after completion.', mechanic(1, 'S5', 'Conservation')),
  perk('mana-r1-emergency-flow', 'Emergency Flow', 'Below 25% Mana, gain +5/10/15/20/25% Mana Regen.', mechanic(1, 'S6', 'Emergency Flow')),
  perk('mana-r1-full-reservoir', 'Full Reservoir', 'Above 90% Mana, if no Spell has completed for 3 seconds, the next Spell costs 2/4/6/8/10% less Mana. Consumed on use.', mechanic(1, 'S7', 'Full Reservoir')),
  perk('mana-r1-quiet-mind', 'Quiet Mind', 'Below 30% Mana, restore 1/1.5/2/2.5/3% Max Mana. Internal cooldown: 5 seconds.', mechanic(1, 'S8', 'Quiet Mind')),
  major('mana-r1-deep-breathing', 'Deep Breathing', 'The first time each encounter Mana falls below 25%, restore 10% Max Mana. Once per encounter.', mechanic(1, 'M', 'Deep Breathing')),
])

const ring2 = createRing('mana', 2, [
  minor('mana-r2-mana-reservoir', 'Mana Reservoir II', '+0.6% Max Mana per rank. Rank 5: +3%.', linearStat('maxManaPct', 0.006)),
  minor('mana-r2-mana-flow', 'Mana Flow II', '+0.6% Mana Regen per rank. Rank 5: +3%.', manaRegen(0.006)),
  minor('mana-r2-efficient-casting', 'Efficient Casting', '-0.2% Mana Cost per rank. Rank 5: -1%.', linearStat('manaCostReductionPct', 0.002)),
  minor('mana-r2-steady-current', 'Steady Current', '+0.05 Mana/sec per rank. Rank 5: +0.25 Mana/sec.', linearStat('manaRegen', 0.05)),
  perk('mana-r2-casting-harmony', 'Casting Harmony', 'Every 3rd AUTO Spell restores 1/2/3/4/5 Mana.', mechanic(2, 'S5', 'Casting Harmony')),
  perk('mana-r2-manual-reservoir', 'Manual Reservoir', 'A MANUAL Spell immediately after an AUTO Spell restores 1/2/3/4/5 Mana.', mechanic(2, 'S6', 'Manual Reservoir')),
  perk('mana-r2-alternating-mind', 'Alternating Mind', 'When cast mode changes AUTO ↔ MANUAL, the new cast gains +1/2/3/4/5% Action Speed.', mechanic(2, 'S7', 'Alternating Mind')),
  perk('mana-r2-efficient-queue', 'Efficient Queue', 'MANUAL queued Spells cost 1/2/3/4/5% less Mana.', mechanic(2, 'S8', 'Efficient Queue')),
  major('mana-r2-dual-mind', 'Dual Mind', 'AUTO prepares the next MANUAL cast for 5 seconds with -8% Mana Cost and +5% Action Speed. MANUAL prepares the same bonus for AUTO. Consumed on use; does not stack.', mechanic(2, 'M', 'Dual Mind')),
])

const ring3 = createRing('mana', 3, [
  minor('mana-r3-arcane-reservoir', 'Arcane Reservoir', '+0.7% Max Mana per rank. Rank 5: +3.5%.', linearStat('maxManaPct', 0.007)),
  minor('mana-r3-arcane-economy', 'Arcane Economy II', '-0.2% Mana Cost per rank. Rank 5: -1%.', linearStat('manaCostReductionPct', 0.002)),
  minor('mana-r3-circulating-flow', 'Circulating Flow', '+0.7% Mana Regen per rank. Rank 5: +3.5%.', manaRegen(0.007)),
  minor('mana-r3-arcane-depth', 'Arcane Depth', '+1.5 flat Max Mana per rank. Rank 5: +7.5.', linearStat('maxMana', 1.5)),
  perk('mana-r3-high-current', 'High Current', 'Above 70% Mana, damaging Spells deal +0.5/1/1.5/2/2.5% Damage.', mechanic(3, 'S5', 'High Current')),
  perk('mana-r3-low-tide', 'Low Tide', 'When a Spell leaves Mana below 30%, prepare the next Spell with +2/4/6/8/10% Action Speed. One prepared bonus at a time.', mechanic(3, 'S6', 'Low Tide')),
  perk('mana-r3-spell-cycle', 'Spell Cycle', 'Cast 3 different Spells in succession. When the third completes, restore 1/2/3/4/5 Mana. Repeating a Spell resets the sequence.', mechanic(3, 'S7', 'Spell Cycle')),
  perk('mana-r3-prepared-slot', 'Prepared Slot', 'The first cast from each loadout slot per encounter costs 1/2/3/4/5% less Mana.', mechanic(3, 'S8', 'Prepared Slot')),
  major('mana-r3-arcane-recirculation', 'Arcane Recirculation', 'Every 10th successful Spell refunds 50% of its final Mana cost after completion. The Spell must still have enough Mana to begin normally.', mechanic(3, 'M', 'Arcane Recirculation')),
])

const ring4 = createRing('mana', 4, [
  minor('mana-r4-transcendent-reservoir', 'Transcendent Reservoir', '+0.8% Max Mana per rank. Rank 5: +4%.', linearStat('maxManaPct', 0.008)),
  minor('mana-r4-transcendent-flow', 'Transcendent Flow', '+0.8% Mana Regen per rank. Rank 5: +4%.', manaRegen(0.008)),
  minor('mana-r4-arcane-economy', 'Arcane Economy III', '-0.25% Mana Cost per rank. Rank 5: -1.25%.', linearStat('manaCostReductionPct', 0.0025)),
  minor('mana-r4-restorative-current', 'Restorative Current', '+0.1 Mana/sec per rank. Rank 5: +0.5 Mana/sec.', linearStat('manaRegen', 0.1)),
  perk('mana-r4-overflow-ward', 'Overflow Ward', 'Excess Mana restoration converts to Barrier at 10/15/20/25/30%. The Barrier is capped at 3% Max Health per cast.', mechanic(4, 'S5', 'Overflow Ward')),
  perk('mana-r4-mana-to-tempo', 'Mana to Tempo', 'When one effect restores at least 5% Max Mana, the next Spell gains +1/2/3/4/5% Action Speed. One prepared bonus at a time.', mechanic(4, 'S6', 'Mana to Tempo')),
  perk('mana-r4-stable-reserve', 'Stable Reserve', 'Above 75% Mana, Spells cost 1/2/3/4/5% less Mana.', mechanic(4, 'S7', 'Stable Reserve')),
  perk('mana-r4-emergency-conversion', 'Emergency Conversion', 'Below 20% Mana, the next Spell restores 1/2/3/4/5% Max Mana after completion.', mechanic(4, 'S8', 'Emergency Conversion')),
  major('mana-r4-transcendence', 'Transcendence', 'Excess Mana restoration becomes Barrier at 50% conversion. The Barrier is capped at 5% Max Health per cast. Cooldown-reduction overflow is not converted.', mechanic(4, 'M', 'Transcendence')),
])

const ring5 = createRing('mana', 5, [
  minor('mana-r5-convergent-reservoir', 'Convergent Reservoir', '+0.9% Max Mana per rank. Rank 5: +4.5%.', linearStat('maxManaPct', 0.009)),
  minor('mana-r5-convergent-flow', 'Convergent Flow', '+0.9% Mana Regen per rank. Rank 5: +4.5%.', manaRegen(0.009)),
  minor('mana-r5-convergent-economy', 'Convergent Economy', '-0.3% Mana Cost per rank. Rank 5: -1.5%.', linearStat('manaCostReductionPct', 0.003)),
  minor('mana-r5-convergent-depth', 'Convergent Depth', '+2 flat Max Mana per rank. Rank 5: +10.', linearStat('maxMana', 2)),
  perk('mana-r5-balanced-mind', 'Balanced Mind', 'If the active loadout has at least 2 AUTO slots and 2 MANUAL slots, gain +0.5/1/1.5/2/2.5% Action Speed.', mechanic(5, 'S5', 'Balanced Mind')),
  perk('mana-r5-manual-battery', 'Manual Battery', 'MANUAL Spells restore 1/2/3/4/5 Mana after completion.', mechanic(5, 'S6', 'Manual Battery')),
  perk('mana-r5-convergent-queue', 'Convergent Queue', 'MANUAL queued Spells gain +1/2/3/4/5% Effectiveness to Damage, Healing, and Barrier.', mechanic(5, 'S7', 'Convergent Queue')),
  perk('mana-r5-reservoir-cycle', 'Reservoir Cycle', 'After spending at least 20% Max Mana inside a rolling 4-second window, prepare the next AUTO Spell. It restores 1/2/3/4/5% Max Mana after completion. One prepared cycle at a time.', mechanic(5, 'S8', 'Reservoir Cycle')),
  major('mana-r5-deep-reservoir', 'Deep Reservoir', 'The first Spell each encounter costs 0 Mana and still starts normal cooldown.', mechanic(5, 'M', 'Deep Reservoir')),
])

const ring6 = createRing('mana', 6, [
  minor('mana-r6-overchannel-reservoir', 'Overchannel Reservoir', '+1% Max Mana per rank. Rank 5: +5%.', linearStat('maxManaPct', 0.01)),
  minor('mana-r6-deep-economy', 'Deep Economy', '-0.35% Mana Cost per rank. Rank 5: -1.75%.', linearStat('manaCostReductionPct', 0.0035)),
  minor('mana-r6-overchannel-flow', 'Overchannel Flow', '+1% Mana Regen per rank. Rank 5: +5%.', manaRegen(0.01)),
  minor('mana-r6-pressure-valve', 'Pressure Valve', '+0.15 Mana/sec per rank. Rank 5: +0.75 Mana/sec.', linearStat('manaRegen', 0.15)),
  perk('mana-r6-overchannel-recovery', 'Overchannel Recovery', 'While the Overchannel Major is active, each successful Spell restores 1/2/3/4/5 Mana.', mechanic(6, 'S5', 'Overchannel Recovery')),
  perk('mana-r6-deep-draw', 'Deep Draw', 'Below 20% Mana, Spells cost 1/2/3/4/5% less Mana.', mechanic(6, 'S6', 'Deep Draw')),
  perk('mana-r6-arcane-return', 'Arcane Return', 'Every successful completed Spell restores 1/2/3/4/5 Mana.', mechanic(6, 'S7', 'Arcane Return')),
  perk('mana-r6-reservoir-break', 'Reservoir Break', 'Above 80% Mana, damaging Spells deal +2/4/6/8/10% Damage.', mechanic(6, 'S8', 'Reservoir Break')),
  major('mana-r6-overchannel', 'Overchannel', 'After spending at least 25% Max Mana within 4 seconds, enter Overchannel for 5 seconds: +10% Action Speed and +7.5% Damage/Healing/Barrier Effectiveness. Mana Regen is disabled. Cannot stack.', mechanic(6, 'M', 'Overchannel')),
])

const ring7 = createRing('mana', 7, [
  minor('mana-r7-astral-reservoir', 'Astral Reservoir', '+1.1% Max Mana per rank. Rank 5: +5.5%.', linearStat('maxManaPct', 0.011)),
  minor('mana-r7-astral-flow', 'Astral Flow', '+1.1% Mana Regen per rank. Rank 5: +5.5%.', manaRegen(0.011)),
  minor('mana-r7-astral-economy', 'Astral Economy', '-0.4% Mana Cost per rank. Rank 5: -2%.', linearStat('manaCostReductionPct', 0.004)),
  minor('mana-r7-astral-depth', 'Astral Depth', '+2.5 flat Max Mana per rank. Rank 5: +12.5.', linearStat('maxMana', 2.5)),
  perk('mana-r7-astral-reserve', 'Astral Reserve', 'Above 75% Mana, damaging Spells deal +1/2/3/4/5% Damage.', mechanic(7, 'S5', 'Astral Reserve')),
  perk('mana-r7-astral-release', 'Astral Release', 'Below 25% Mana, the first Spell every 4 seconds gains +2/4/6/8/10% Action Speed.', mechanic(7, 'S6', 'Astral Release')),
  perk('mana-r7-astral-rotation', 'Astral Rotation', 'After casting from 3 different loadout slots in succession, refund 1/2/3/4/5% of that Spell’s final Mana cost.', mechanic(7, 'S7', 'Astral Rotation')),
  perk('mana-r7-astral-cascade', 'Astral Cascade', 'After 3 consecutive AUTO casts, the next MANUAL Spell gains +2/4/6/8/10% Action Speed. Consumed on that MANUAL Spell.', mechanic(7, 'S8', 'Astral Cascade')),
  major('mana-r7-astral-equilibrium', 'Astral Equilibrium', 'Above 75% Mana, gain +7.5% Damage/Healing/Barrier Effectiveness. Below 25% Mana, gain +7.5% Action Speed. Between 25% and 75%, no bonus. Only one side applies.', mechanic(7, 'M', 'Astral Equilibrium')),
])

const ring8 = createRing('mana', 8, [
  minor('mana-r8-singularity-reservoir', 'Singularity Reservoir', '+1.2% Max Mana per rank. Rank 5: +6%.', linearStat('maxManaPct', 0.012)),
  minor('mana-r8-singularity-flow', 'Singularity Flow', '+1.2% Mana Regen per rank. Rank 5: +6%.', manaRegen(0.012)),
  minor('mana-r8-singularity-economy', 'Singularity Economy', '-0.5% Mana Cost per rank. Rank 5: -2.5%.', linearStat('manaCostReductionPct', 0.005)),
  minor('mana-r8-zero-point-current', 'Zero-Point Current', '+0.2 Mana/sec per rank. Rank 5: +1 Mana/sec.', linearStat('manaRegen', 0.2)),
  perk('mana-r8-zero-point', 'Zero Point', 'Every 8th Spell costs 20/40/60/80/100% less Mana. At Rank 5, the 8th Spell costs 0 Mana.', mechanic(8, 'S5', 'Zero Point')),
  perk('mana-r8-event-horizon', 'Event Horizon', 'Complete a Spell at 100% Mana to store 1 charge, up to 1/2/3/4/5. Below 25% Mana, a successful Spell consumes 1 charge and restores 5% Max Mana.', mechanic(8, 'S6', 'Event Horizon')),
  perk('mana-r8-singularity-manual', 'Singularity Manual', 'An AUTO Spell may prepare 1 Singularity charge. The next MANUAL Spell consumes it and refunds 2/4/6/8/10% of final Mana cost. Maximum 1 prepared charge.', mechanic(8, 'S7', 'Singularity Manual')),
  perk('mana-r8-mana-collapse', 'Mana Collapse', 'When Mana crosses from at least 25% to below 25%, prepare the next Spell with +2/4/6/8/10% Action Speed. Internal cooldown: 5 seconds. One prepared bonus at a time.', mechanic(8, 'S8', 'Mana Collapse')),
  major('mana-r8-arcane-singularity', 'Arcane Singularity', 'Once per encounter, when a Spell would leave Mana below 10%, set Mana to 50% Max Mana and enter Singularity for 5 seconds. During Singularity, Mana Cost is reduced by 40% and Mana Regen is disabled.', mechanic(8, 'M', 'Arcane Singularity')),
])

export const manaNodes = [ring1, ring2, ring3, ring4, ring5, ring6, ring7, ring8]

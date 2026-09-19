# Arcane Core

Permanent specialization grows through combat-earned Arcane Points. Points are a capped wallet; node ranks are permanent and refund using their authored Ring cost.

## Branches

| Branch | ID | Purchasable nodes |
| --- | --- | --- |
| Power | power | 72 |
| Vitality | vitality | 72 |
| Focus | focus | 72 |
| Control | control | 72 |

## Progression

| Setting | Value |
| --- | --- |
| Starting Arcane Points | 0 |
| Maximum Arcane Points | 6864 |
| Cores | 4 |
| Rings per Core | 8 |
| Nodes per Ring | 9 |
| Total authored nodes | 288 |
| Full Core cost | 1716 |
| Full tree cost | 6864 |

## Ring costs and gates

| Ring | Standard rank cost | Major cost | Full Ring cost | Previous-Ring standard ranks | Major standard ranks |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | 4 | 44 | 0 | 30 |
| 2 | 2 | 8 | 88 | 20 | 35 |
| 3 | 3 | 12 | 132 | 25 | 35 |
| 4 | 4 | 16 | 176 | 30 | 40 |
| 5 | 5 | 20 | 220 | 32 | 40 |
| 6 | 6 | 24 | 264 | 34 | 40 |
| 7 | 8 | 32 | 352 | 36 | 40 |
| 8 | 10 | 40 | 440 | 38 | 40 |

## Node catalog

| Branch | Node | Ring | Slot | Name | Type | Max rank | Rank cost | Effect |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| power | power-r1-arcane-force | 1 | S1 | Arcane Scaling | [STAT] | 5 | 1 | +0.10% Spell Power / rank. Rank 5: +0.50%. |
| power | power-r1-forceful-strikes | 1 | S2 | Spell Impact | [STAT] | 5 | 1 | +0.25% Spell Damage / rank. Rank 5: +1.25%. |
| power | power-r1-critical-insight | 1 | S3 | Arcane Spark | [CYCLE] | 5 | 1 | Every 4th successful damaging Spell deals an extra 2/4/6/8/10% of its direct damage as Arcane damage. |
| power | power-r1-critical-force | 1 | S4 | Overcharge | [CONDITION] | 5 | 1 | A Spell whose Mana cost is at least 10% of Max Mana deals +2/4/6/8/10% Damage. |
| power | power-r1-spell-impact | 1 | S5 | Opportunist | [TRIGGER] | 5 | 1 | When you apply a new negative Status to an enemy, your next damaging Spell within 4 s deals +2/4/6/8/10% Damage. |
| power | power-r1-battle-rhythm | 1 | S6 | Finisher | [CONDITION] | 5 | 1 | Against enemies below 25% Health, damaging Spells deal +1/2/3/4/5% Damage. |
| power | power-r1-lingering-power | 1 | S7 | Opening Volley | [TRIGGER] | 5 | 1 | The first damaging Spell of each encounter deals +3/6/9/12/15% Damage. |
| power | power-r1-arcane-pressure | 1 | S8 | Mana Edge | [CONDITION] | 5 | 1 | Above 80% Mana, damaging Spells gain +0.5/1/1.5/2/2.5% Damage. |
| power | power-r1-overwhelming-force | 1 | M | Unstable Power | **MAJOR** | 1 | 4 | Every 5th successful damaging Spell deals +50% Damage, but that cast costs +25% Mana. If the Spell is free, the damage bonus still applies. |
| power | power-r2-opening-blast | 2 | S1 | Critical Insight | [STAT] | 5 | 2 | +0.15 percentage points Crit Chance / rank. Rank 5: +0.75 pp. |
| power | power-r2-finisher | 2 | S2 | Critical Force | [STAT] | 5 | 2 | +1.5% Crit Damage / rank. Rank 5: +7.5%. |
| power | power-r2-critical-feedback | 2 | S3 | Critical Feedback | [TRIGGER] | 5 | 2 | A direct Spell Crit reduces all other remaining Spell cooldowns by 30/60/90/120/150 ms. Internal cooldown 0.75 s. |
| power | power-r2-critical-recovery | 2 | S4 | Critical Recovery | [TRIGGER] | 5 | 2 | A direct Spell Crit restores 1/2/3/4/5 Mana. Internal cooldown 0.75 s. |
| power | power-r2-spell-weaving | 2 | S5 | Perfect Window | [CONDITION] | 5 | 2 | A Spell cast against an enemy above 90% Health gains +2/4/6/8/10% Crit Damage. |
| power | power-r2-arcane-recoil | 2 | S6 | Marked Precision | [CONDITION] | 5 | 2 | Against a debuffed enemy, gain +0.2/0.4/0.6/0.8/1.0 pp Crit Chance. |
| power | power-r2-exploit-weakness | 2 | S7 | Second Chance | [TRIGGER] | 5 | 2 | When a damaging Spell fails to Crit, your next damaging Spell gains +0.2/0.4/0.6/0.8/1.0 pp Crit Chance. Consumed on the next damaging Spell. |
| power | power-r2-relentless-execution | 2 | S8 | Critical Finish | [CONDITION] | 5 | 2 | Against enemies below 25% Health, Crits deal +2/4/6/8/10% additional Crit Damage. |
| power | power-r2-perfect-precision | 2 | M | Perfect Precision | **MAJOR** | 1 | 8 | After two consecutive damaging Spells fail to Crit, the third damaging Spell is guaranteed to Crit. Counter resets on a Crit. |
| power | power-r3-arcane-momentum | 3 | S1 | Arcane Scaling II | [STAT] | 5 | 3 | +0.20% Spell Power / rank. Rank 5: +1.00%. |
| power | power-r3-critical-tempo | 3 | S2 | Direct Force | [STAT] | 5 | 3 | +0.50% direct Spell Damage / rank. Rank 5: +2.50%. Does not affect DoT ticks. |
| power | power-r3-battle-hunger | 3 | S3 | Spell Sequence | [CYCLE] | 5 | 3 | Casting three different damaging Spells in succession causes the third to deal +3/6/9/12/15% Damage. Repeating the same Spell breaks the sequence. |
| power | power-r3-shatter-weakness | 3 | S4 | Arcane Momentum | [CYCLE] | 5 | 3 | Every 4th damaging Spell deals +3/6/9/12/15% Damage. |
| power | power-r3-spell-surge | 3 | S5 | Rapid Escalation | [TRIGGER] | 5 | 3 | If two damaging Spells successfully resolve within 3 s of each other, the second gains +2/4/6/8/10% Damage. |
| power | power-r3-lingering-execution | 3 | S6 | Heavy Follow-Up | [TRIGGER] | 5 | 3 | After casting a Spell costing at least 12% Max Mana, your next damaging Spell costing less than 8% Max Mana deals +3/6/9/12/15% Damage. |
| power | power-r3-aggressive-casting | 3 | S7 | Debuff Assault | [CONDITION] | 5 | 3 | Against enemies with at least 2 negative Statuses, +1/2/3/4/5% Damage Dealt. |
| power | power-r3-brutal-rhythm | 3 | S8 | Execution Chain | [TRIGGER] | 5 | 3 | Killing an enemy grants your first damaging Spell against the next enemy +3/6/9/12/15% Damage. |
| power | power-r3-arcane-overload | 3 | M | Arcane Overload | **MAJOR** | 1 | 12 | Every 6th successful damaging Spell repeats 25% of its direct damage as a second Arcane hit. The echo cannot Crit and does not count as another cast. |
| power | power-r4-apex-force | 4 | S1 | Relentless Casting | [STAT] | 5 | 4 | +0.50% Cooldown Recovery / rank. Rank 5: +2.50%. |
| power | power-r4-lethal-precision | 4 | S2 | Ascendant Power | [STAT] | 5 | 4 | +0.30% Spell Power / rank. Rank 5: +1.50%. |
| power | power-r4-cataclysmic-crit | 4 | S3 | Critical Cascade | [TRIGGER] | 5 | 4 | Direct Spell Crit reduces all other remaining Spell cooldowns by 50/100/150/200/250 ms. Internal cooldown 0.75 s. |
| power | power-r4-relentless-casting | 4 | S4 | Kill Surge | [TRIGGER] | 5 | 4 | A kill reduces all remaining Spell cooldowns by 100/200/300/400/500 ms. |
| power | power-r4-dot-mastery | 4 | S5 | Burst Window | [TRIGGER] | 5 | 4 | When any Spell cooldown reaches 0 naturally, your next damaging Spell within 2 s gains +2/4/6/8/10% Damage. |
| power | power-r4-crushing-pressure | 4 | S6 | Aggressive Rotation | [CYCLE] | 5 | 4 | Casting 4 different Spells without repeating grants +2/4/6/8/10% Action Speed to the next Spell only. |
| power | power-r4-execution-mastery | 4 | S7 | Rising Violence | [CONDITION] | 5 | 4 | For each 25% enemy Health already missing, gain +0.5/1/1.5/2/2.5% Damage Dealt. |
| power | power-r4-first-strike | 4 | S8 | Cooldown Punisher | [CONDITION] | 5 | 4 | If the Spell you are casting has a base cooldown of 20 s or more, it deals +2/4/6/8/10% Damage. |
| power | power-r4-perfect-execution | 4 | M | Perfect Execution | **MAJOR** | 1 | 16 | Damaging Spells against enemies below 20% Health gain +15% Damage. If such a Spell kills the enemy, reduce all remaining Spell cooldowns by 1 s. |
| power | power-r5-ruinous-force | 5 | S1 | Lingering Ruin | [STAT] | 5 | 5 | +1.5% Damage over Time / rank. Rank 5: +7.5%. |
| power | power-r5-brutal-strikes | 5 | S2 | Ruinous Power | [STAT] | 5 | 5 | +0.40% Spell Power / rank. Rank 5: +2.00%. |
| power | power-r5-keen-destruction | 5 | S3 | Burning Momentum | [TRIGGER] | 5 | 5 | When one of your DoTs ticks, gain 1 Ruin stack, max 5. Your next direct damaging Spell consumes all stacks for +1/2/3/4/5% Damage per stack. |
| power | power-r5-violent-criticals | 5 | S4 | Detonation Theory | [TRIGGER] | 5 | 5 | When you consume/detonate one of your own damaging Statuses, the detonation deals +3/6/9/12/15% Damage. |
| power | power-r5-ruinous-casting | 5 | S5 | Lingering Execution | [CONDITION] | 5 | 5 | Your DoTs deal +2/4/6/8/10% Damage against enemies below 35% Health. |
| power | power-r5-lingering-ruin | 5 | S6 | Ruin Transfer | [TRIGGER] | 5 | 5 | When an enemy dies while affected by one of your DoTs, your first DoT applied to the next enemy gains +3/6/9/12/15% total damage. |
| power | power-r5-predatory-opening | 5 | S7 | Corroded Defense | [CONDITION] | 5 | 5 | Enemies with 2+ negative Statuses take +1/2/3/4/5% direct Spell Damage from you. |
| power | power-r5-blooded-finish | 5 | S8 | Deep Wounds | [TRIGGER] | 5 | 5 | Applying a damaging periodic Status to an already debuffed enemy increases that Status's total authored damage by +2/4/6/8/10%. |
| power | power-r5-ruinous-surge | 5 | M | Chain Reaction | **MAJOR** | 1 | 20 | When one of your DoTs kills an enemy, your next successful damaging Spell against the next enemy repeats 40% of its direct damage as an Arcane echo. |
| power | power-r6-cataclysmic-power | 6 | S1 | Cataclysmic Power | [STAT] | 5 | 6 | +0.50% Spell Power / rank. Rank 5: +2.50%. |
| power | power-r6-spell-haste | 6 | S2 | Aggressive Rhythm | [STAT] | 5 | 6 | +0.50% Action Speed / rank. Rank 5: +2.50%. |
| power | power-r6-aggressive-rhythm | 6 | S3 | Overcast | [CONDITION] | 5 | 6 | Spells costing at least 15% Max Mana deal +3/6/9/12/15% Damage. |
| power | power-r6-critical-cascade | 6 | S4 | Mana Burn | [CONVERSION] | 5 | 6 | When a successful damaging Spell leaves you below 20% Mana, it deals an additional 2/4/6/8/10% direct damage. |
| power | power-r6-critical-reservoir | 6 | S5 | Cataclysmic Reserve | [TRIGGER] | 5 | 6 | Spending at least 15% Max Mana on one Spell grants +1/2/3/4/5% Crit Chance to your next damaging Spell. |
| power | power-r6-ravage-weakness | 6 | S6 | Critical Cataclysm | [TRIGGER] | 5 | 6 | A Crit from a Spell costing at least 15% Max Mana reduces that Spell's own cooldown by 0.2/0.4/0.6/0.8/1.0 s. |
| power | power-r6-dot-execution | 6 | S7 | Unstable Rotation | [CYCLE] | 5 | 6 | Casting a high-cost Spell then a low-cost Spell then a high-cost Spell grants the third cast +4/8/12/16/20% Damage. High = â‰¥12% Max Mana; low = <8%. |
| power | power-r6-kill-surge | 6 | S8 | Desperate Power | [CONDITION] | 5 | 6 | Below 20% Mana, damaging Spells deal +2/4/6/8/10% Damage. |
| power | power-r6-cataclysm | 6 | M | Cataclysm | **MAJOR** | 1 | 24 | The first Spell each encounter that costs at least 15% Max Mana is Overcharged: +40% Damage, +20% Mana Cost, and its cooldown begins 25% recovered. |
| power | power-r7-sovereign-force | 7 | S1 | Sovereign Power | [STAT] | 5 | 8 | +0.65% Spell Power / rank. Rank 5: +3.25%. |
| power | power-r7-critical-dominance | 7 | S2 | Devastating Criticals | [STAT] | 5 | 8 | +4% Crit Damage / rank. Rank 5: +20%. |
| power | power-r7-devastating-criticals | 7 | S3 | Sovereign Sequence | [CYCLE] | 5 | 8 | Casting 5 different Spells without repeating makes the fifth deal +4/8/12/16/20% Damage. |
| power | power-r7-unrelenting-spells | 7 | S4 | First Blood | [TRIGGER] | 5 | 8 | Your first damaging Spell against each enemy gains +4/8/12/16/20% Damage. |
| power | power-r7-broken-resistance | 7 | S5 | Last Word | [TRIGGER] | 5 | 8 | Your first damaging Spell to hit an enemy below 20% Health gains +4/8/12/16/20% Damage. Once per enemy. |
| power | power-r7-barrier-crusher | 7 | S6 | Dominating Weakness | [CONDITION] | 5 | 8 | Against enemies with 3+ negative Statuses, +2/4/6/8/10% Damage Dealt. |
| power | power-r7-sovereign-execution | 7 | S7 | Sovereign Crit | [TRIGGER] | 5 | 8 | After you Crit, your next non-Crit damaging Spell within 4 s gains +2/4/6/8/10% Damage. |
| power | power-r7-first-blood | 7 | S8 | Victory Momentum | [TRIGGER] | 5 | 8 | After a kill, gain +1/2/3/4/5% Action Speed for your first Spell against the next enemy. |
| power | power-r7-sovereign-casting | 7 | M | Sovereign Casting | **MAJOR** | 1 | 32 | Each encounter begins with 3 Sovereignty charges. A damaging Spell consumes 1 charge to gain +15% Damage. Crits do not consume a charge. |
| power | power-r8-apotheosis-force | 8 | S1 | Apotheosis Power | [STAT] | 5 | 10 | +0.80% Spell Power / rank. Rank 5: +4%. |
| power | power-r8-apotheosis-precision | 8 | S2 | Apotheosis Precision | [STAT] | 5 | 10 | +0.50 pp Crit Chance / rank. Rank 5: +2.50 pp. |
| power | power-r8-apotheosis-criticals | 8 | S3 | Perfect Cycle | [CYCLE] | 5 | 10 | Every 4th successful damaging Spell deals +6/12/18/24/30% Damage. |
| power | power-r8-apotheosis-tempo | 8 | S4 | Arcane Echo | [TRIGGER] | 5 | 10 | Every 6th successful damaging Spell repeats 5/10/15/20/25% of its direct damage as an Arcane echo. |
| power | power-r8-apotheosis-recovery | 8 | S5 | Apotheosis Execution | [CONDITION] | 5 | 10 | Against enemies below 20% Health, damaging Spells deal +3/6/9/12/15% Damage. |
| power | power-r8-apotheosis-dot | 8 | S6 | Apotheosis Ruin | [TRIGGER] | 5 | 10 | When one of your DoTs expires naturally, your next direct damaging Spell within 4 s gains +3/6/9/12/15% Damage. |
| power | power-r8-universal-pressure | 8 | S7 | Limit Break | [TRIGGER] | 5 | 10 | If a successful Spell costs at least 20% Max Mana, reduce all other remaining Spell cooldowns by 0.15/0.30/0.45/0.60/0.75 s. |
| power | power-r8-final-execution | 8 | S8 | Absolute Momentum | [TRIGGER] | 5 | 10 | After casting three different damaging Spells within 6 s, gain +2/4/6/8/10% Action Speed for the next Spell only. |
| power | power-r8-arcane-apotheosis | 8 | M | Arcane Apotheosis | **MAJOR** | 1 | 40 | Once per encounter, after you successfully cast 8 damaging Spells, enter Apotheosis for 6 s: damaging Spells deal +20% Damage, cost 15% less Mana, and gain 10% Action Speed. The effect cannot retrigger in the same encounter. |
| vitality | vitality-r1-vitality | 1 | S1 | Vitality | [STAT] | 5 | 1 | +0.50% Max Health / rank. Rank 5: +2.50%. |
| vitality | vitality-r1-natural-recovery | 1 | S2 | Steady Guard | [STAT] | 5 | 1 | +1 Defense / rank. Rank 5: +5 Defense. |
| vitality | vitality-r1-arcane-defense | 1 | S3 | Second Skin | [TRIGGER] | 5 | 1 | When your Barrier breaks, heal 0.25/0.50/0.75/1.00/1.25% Max Health. Cooldown 4 s. |
| vitality | vitality-r1-guard | 1 | S4 | Emergency Pulse | [TRIGGER] | 5 | 1 | The first time each encounter you fall below 30% Health, restore 1/2/3/4/5% Max Health. |
| vitality | vitality-r1-barrier-power | 1 | S5 | Protective Casting | [CONDITION] | 5 | 1 | While you have Barrier, gain +0.5/1/1.5/2/2.5% Action Speed for self-targeted Spells. |
| vitality | vitality-r1-healing-mastery | 1 | S6 | Recovery Window | [TRIGGER] | 5 | 1 | After taking no Health damage for 4 s, gain +0.2/0.4/0.6/0.8/1.0 Health Regen/sec until you take Health damage again. |
| vitality | vitality-r1-fortified-body | 1 | S7 | Overheal Ward | [CONVERSION] | 5 | 1 | 10/20/30/40/50% of Healing that would exceed Max Health is converted into Barrier, capped at 5% Max Health per heal. |
| vitality | vitality-r1-victory-recovery | 1 | S8 | Victory Recovery | [TRIGGER] | 5 | 1 | A kill heals 0.5/1/1.5/2/2.5% Max Health. |
| vitality | vitality-r1-deep-recovery | 1 | M | Refuse Death | **MAJOR** | 1 | 4 | The first time each encounter you would fall below 10% Health, gain Barrier equal to 10% Max Health. Cooldown: once per encounter. |
| vitality | vitality-r2-second-wind | 2 | S1 | Fortified Body | [STAT] | 5 | 2 | -0.25% Damage Taken / rank. Rank 5: -1.25%. |
| vitality | vitality-r2-steady-guard | 2 | S2 | Natural Recovery | [STAT] | 5 | 2 | +0.20 Health Regen/sec / rank. Rank 5: +1/sec. |
| vitality | vitality-r2-stonewall | 2 | S3 | Stonewall | [CONDITION] | 5 | 2 | While Barrier exists, gain +1/2/3/4/5 Defense. |
| vitality | vitality-r2-ward-reinforcement | 2 | S4 | Reinforced Ward | [CONDITION] | 5 | 2 | While Barrier exists, take 0.5/1/1.5/2/2.5% less Damage. |
| vitality | vitality-r2-reinforced-ward | 2 | S5 | Pain to Mana | [CONVERSION] | 5 | 2 | When you take Health damage, restore Mana equal to 1/2/3/4/5% of the Health damage taken. Internal cooldown 1 s. |
| vitality | vitality-r2-ward-recovery | 2 | S6 | Barrier Recovery | [TRIGGER] | 5 | 2 | Gaining Barrier while below 50% Health heals 0.25/0.50/0.75/1.00/1.25% Max Health. Cooldown 3 s. |
| vitality | vitality-r2-resilient-flow | 2 | S7 | Guarded Recovery | [CONDITION] | 5 | 2 | While above 80% Health, Health Regen is increased by 5/10/15/20/25%. |
| vitality | vitality-r2-emergency-recovery | 2 | S8 | Low Health Guard | [CONDITION] | 5 | 2 | Below 35% Health, gain +2/4/6/8/10 Defense. |
| vitality | vitality-r2-unyielding | 2 | M | Unyielding | **MAJOR** | 1 | 8 | While below 50% Health, incoming Health damage is reduced by 8%. This does not reduce damage absorbed by Barrier. |
| vitality | vitality-r3-reactive-ward | 3 | S1 | Barrier Power | [STAT] | 5 | 3 | +1% Barrier Power / rank. Rank 5: +5%. |
| vitality | vitality-r3-guarded-soul | 3 | S2 | Healing Mastery | [STAT] | 5 | 3 | +1% Healing Done / rank. Rank 5: +5%. |
| vitality | vitality-r3-aegis-strength | 3 | S3 | Reactive Ward | [TRIGGER] | 5 | 3 | Taking Health damage while you have no Barrier grants Barrier equal to 0.5/1/1.5/2/2.5% Max Health. Cooldown 8 s. |
| vitality | vitality-r3-recovery-under-fire | 3 | S4 | Ward Renewal | [TRIGGER] | 5 | 3 | Whenever you gain Barrier, heal 0.2/0.4/0.6/0.8/1.0% Max Health. Cooldown 3 s. |
| vitality | vitality-r3-defensive-flow | 3 | S5 | Barrier Memory | [TRIGGER] | 5 | 3 | When Barrier expires naturally instead of breaking, your next Barrier within 6 s gains +5/10/15/20/25% strength. |
| vitality | vitality-r3-ward-renewal | 3 | S6 | Aegis Momentum | [TRIGGER] | 5 | 3 | After gaining Barrier, your next self-targeted Spell within 4 s gains +2/4/6/8/10% Action Speed. |
| vitality | vitality-r3-lasting-guard | 3 | S7 | Stable Protection | [CONDITION] | 5 | 3 | If your Barrier is at least 10% Max Health, take 1/2/3/4/5% less Damage. |
| vitality | vitality-r3-battle-recovery | 3 | S8 | Barrier Pulse | [TRIGGER] | 5 | 3 | When Barrier breaks, reduce all remaining self-targeted Spell cooldowns by 0.2/0.4/0.6/0.8/1.0 s. |
| vitality | vitality-r3-arcane-aegis | 3 | M | Arcane Aegis | **MAJOR** | 1 | 12 | When a Barrier breaks, immediately gain a replacement Barrier equal to 25% of the broken Barrier's original value. Cooldown 8 s. |
| vitality | vitality-r4-apex-vitality | 4 | S1 | Vitality II | [STAT] | 5 | 4 | +1.25% Max Health / rank. Rank 5: +6.25%. |
| vitality | vitality-r4-immortal-recovery | 4 | S2 | Immortal Defense | [STAT] | 5 | 4 | +3 Defense / rank. Rank 5: +15 Defense. |
| vitality | vitality-r4-iron-will | 4 | S3 | Last Breath | [TRIGGER] | 5 | 4 | The first time each encounter you fall below 20% Health, your next Healing Spell gains +5/10/15/20/25% Action Speed and +5/10/15/20/25% Healing Done. |
| vitality | vitality-r4-last-bastion | 4 | S4 | Emergency Aegis | [TRIGGER] | 5 | 4 | The first time each encounter you fall below 20% Health, gain Barrier equal to 2/4/6/8/10% Max Health. |
| vitality | vitality-r4-absolute-guard | 4 | S5 | Crisis Conversion | [CONVERSION][NEW HOOK] | 5 | 4 | Below 15% Health, if you cannot afford a self-targeted Healing or Barrier Spell, up to 5/10/15/20/25% of its missing Mana may be paid with Health instead. Cannot reduce you below 1 Health. |
| vitality | vitality-r4-deep-fortification | 4 | S6 | Iron Will | [CONDITION] | 5 | 4 | Below 30% Health, take 1/2/3/4/5% less Damage. |
| vitality | vitality-r4-emergency-aegis | 4 | S7 | Recovery Surge | [TRIGGER] | 5 | 4 | Healing yourself while below 25% Health restores an additional 0.5/1/1.5/2/2.5% Max Health. |
| vitality | vitality-r4-recovery-mastery | 4 | S8 | Survival Instinct | [TRIGGER] | 5 | 4 | After surviving damage that leaves you below 10% Health, gain +2/4/6/8/10% Action Speed to your next self-targeted Spell. |
| vitality | vitality-r4-survival-instinct | 4 | M | Immortal Guard | **MAJOR** | 1 | 16 | Once per dungeon run, lethal damage leaves you at 1 Health, removes all cleanseable debuffs from you, and your next Healing Spell within 6 s becomes instant. The Spell still pays Mana and starts cooldown normally. |
| vitality | vitality-r5-bastion-heart | 5 | S1 | Bastion Defense | [STAT] | 5 | 5 | +2.5 Defense / rank. Rank 5: +12.5 Defense. |
| vitality | vitality-r5-iron-recovery | 5 | S2 | Bastion Ward | [STAT] | 5 | 5 | +1.5% Barrier Power / rank. Rank 5: +7.5%. |
| vitality | vitality-r5-fortress-defense | 5 | S3 | Fortress | [CONDITION] | 5 | 5 | While Barrier exists, take 1/2/3/4/5% less Damage. |
| vitality | vitality-r5-bastion-guard | 5 | S4 | Layered Ward | [TRIGGER] | 5 | 5 | Gaining Barrier while you already have Barrier increases the new Barrier's effective value by 2/4/6/8/10% before normal replace/add rules. |
| vitality | vitality-r5-greater-barrier | 5 | S5 | Ward Battery | [CONVERSION] | 5 | 5 | When Barrier absorbs damage, restore Mana equal to 1/2/3/4/5% of the absorbed amount. Internal cooldown 0.5 s. |
| vitality | vitality-r5-resilient-healing | 5 | S6 | Bastion Cast | [CONDITION] | 5 | 5 | While Barrier exists, self-targeted Spells cost 1/2/3/4/5% less Mana. |
| vitality | vitality-r5-fortified-ward | 5 | S7 | Reinforced Recovery | [TRIGGER] | 5 | 5 | When Barrier breaks, gain +0.5/1/1.5/2/2.5 Health Regen/sec for 6 s. |
| vitality | vitality-r5-bastion-recovery | 5 | S8 | Safe Offensive | [CONDITION] | 5 | 5 | While Barrier is at least 10% Max Health, damaging Spells gain +0.5/1/1.5/2/2.5% Damage. |
| vitality | vitality-r5-living-fortress | 5 | M | Living Bastion | **MAJOR** | 1 | 20 | While Barrier exists, 20% of Healing received is also added to Barrier, capped at 5% Max Health per heal. |
| vitality | vitality-r6-greater-vitality | 6 | S1 | Renewal Flow | [STAT] | 5 | 6 | +0.50 Health Regen/sec / rank. Rank 5: +2.50/sec. |
| vitality | vitality-r6-greater-recovery | 6 | S2 | Deep Recovery | [STAT] | 5 | 6 | +1.5% Healing Received / rank. Rank 5: +7.5%. |
| vitality | vitality-r6-restoration-mastery | 6 | S3 | Regenerative Casting | [TRIGGER] | 5 | 6 | Successfully casting a self-targeted Spell grants +0.1/0.2/0.3/0.4/0.5 Health Regen/sec for 5 s. Stacks up to 3. |
| vitality | vitality-r6-rejuvenation | 6 | S4 | Healing Momentum | [TRIGGER] | 5 | 6 | After you heal yourself, your next self-targeted Spell within 4 s gains +2/4/6/8/10% Action Speed. |
| vitality | vitality-r6-ward-life | 6 | S5 | Overflowing Life | [CONVERSION] | 5 | 6 | Overhealing converts 10/20/30/40/50% of the excess into Mana, capped at 2% Max Mana per heal. |
| vitality | vitality-r6-barrier-renewal | 6 | S6 | Barrier Break Recovery | [TRIGGER] | 5 | 6 | When Barrier breaks, heal 0.75/1.5/2.25/3/3.75% Max Health. |
| vitality | vitality-r6-desperate-regeneration | 6 | S7 | Renewal Cycle | [CYCLE] | 5 | 6 | Every 4th successful self-targeted Spell restores 1/2/3/4/5% Max Health. |
| vitality | vitality-r6-renewed-guard | 6 | S8 | Victory Renewal | [TRIGGER] | 5 | 6 | A kill grants +0.5/1/1.5/2/2.5 Health Regen/sec for 6 s. |
| vitality | vitality-r6-phoenix-ward | 6 | M | Renewal | **MAJOR** | 1 | 24 | Every 10 seconds in combat, if you are below 50% Health, heal 5% Max Health. If already above 50%, instead gain Barrier equal to 5% Max Health. |
| vitality | vitality-r7-undying-vitality | 7 | S1 | Vitality III | [STAT] | 5 | 8 | +2% Max Health / rank. Rank 5: +10%. |
| vitality | vitality-r7-undying-defense | 7 | S2 | Undying Recovery | [STAT] | 5 | 8 | +0.75 Health Regen/sec / rank. Rank 5: +3.75/sec. |
| vitality | vitality-r7-undying-guard | 7 | S3 | Last Refuge | [TRIGGER] | 5 | 8 | The first time each encounter you fall below 20% Health, gain Barrier equal to 3/6/9/12/15% Max Health. |
| vitality | vitality-r7-undying-ward | 7 | S4 | Defiant Casting | [CONDITION] | 5 | 8 | Below 35% Health, gain +1/2/3/4/5% Action Speed for Healing and Barrier Spells. |
| vitality | vitality-r7-refuse-death | 7 | S5 | Pain Conversion | [CONVERSION] | 5 | 8 | When you take Health damage below 35% Health, restore Mana equal to 2/4/6/8/10% of the Health damage taken. Internal cooldown 1 s. |
| vitality | vitality-r7-barrier-armor | 7 | S6 | Undying Will | [CONDITION] | 5 | 8 | Below 35% Health, take 1/2/3/4/5% less Damage. |
| vitality | vitality-r7-pain-to-mana | 7 | S7 | Comeback | [TRIGGER] | 5 | 8 | Healing from below 20% Health to above 35% Health reduces all remaining Spell cooldowns by 0.3/0.6/0.9/1.2/1.5 s. Once per encounter. |
| vitality | vitality-r7-undying-recovery | 7 | S8 | Victory Restoration | [TRIGGER] | 5 | 8 | A kill heals 2/4/6/8/10% Max Health. |
| vitality | vitality-r7-undying-will | 7 | M | Undying | **MAJOR** | 1 | 32 | Once per dungeon run, lethal damage leaves you at 1 Health, grants Barrier equal to 20% Max Health, and gives 50% Damage Reduction for 2 s. |
| vitality | vitality-r8-eternal-vitality | 8 | S1 | Eternal Defense | [STAT] | 5 | 10 | +4 Defense / rank. Rank 5: +20 Defense. |
| vitality | vitality-r8-eternal-recovery | 8 | S2 | Eternal Ward | [STAT] | 5 | 10 | +2% Barrier Power / rank. Rank 5: +10%. |
| vitality | vitality-r8-eternal-defense | 8 | S3 | Perfect Restoration | [TRIGGER] | 5 | 10 | A Healing Spell that restores at least 10% Max Health reduces its own cooldown by 0.2/0.4/0.6/0.8/1.0 s. |
| vitality | vitality-r8-eternal-guard | 8 | S4 | Eternal Fortress | [CONDITION] | 5 | 10 | While Barrier exists, take 1/2/3/4/5% less Damage. |
| vitality | vitality-r8-eternal-barrier | 8 | S5 | Phoenix Pulse | [TRIGGER] | 5 | 10 | The first time each encounter you fall below 15% Health, remove 1/2/3/4/5 cleanseable debuffs and grant +5/10/15/20/25% Action Speed to your next Healing Spell. |
| vitality | vitality-r8-eternal-restoration | 8 | S6 | Life Battery | [CONVERSION] | 5 | 10 | When you receive Healing at full Health, convert 10/20/30/40/50% of it into Barrier, then convert any excess Barrier gain into Mana at 25% efficiency. |
| vitality | vitality-r8-eternal-ward | 8 | S7 | Unbroken Cycle | [TRIGGER] | 5 | 10 | If a Barrier expires naturally, your next Barrier Spell within 6 s has 5/10/15/20/25% reduced cooldown. |
| vitality | vitality-r8-final-recovery | 8 | S8 | Eternal Recovery | [TRIGGER] | 5 | 10 | Whenever you cross upward through 50% Health, gain +1/2/3/4/5 Health Regen/sec for 5 s. Cooldown 10 s. |
| vitality | vitality-r8-eternal-aegis | 8 | M | Eternal Aegis | **MAJOR** | 1 | 40 | Your Healing and Barrier systems become linked: 25% of effective Healing also grants Barrier, and 25% of effective Barrier gained also heals you. Each conversion is capped at 5% Max Health per event. |
| focus | focus-r1-mana-reservoir | 1 | S1 | Mana Reservoir | [STAT] | 5 | 1 | +0.50% Max Mana / rank. Rank 5: +2.50%. |
| focus | focus-r1-mana-flow | 1 | S2 | Mana Flow | [STAT] | 5 | 1 | +1% Mana Regen / rank. Rank 5: +5%. |
| focus | focus-r1-mana-efficiency | 1 | S3 | Conservation | [TRIGGER] | 5 | 1 | Every 6th successful Spell refunds 1/2/3/4/5 Mana. |
| focus | focus-r1-focus-capacity | 1 | S4 | Emergency Flow | [CONDITION] | 5 | 1 | Below 25% Mana, Mana Regen is increased by 5/10/15/20/25%. |
| focus | focus-r1-auto-cast-efficiency | 1 | S5 | Full Reservoir | [CONDITION] | 5 | 1 | Above 90% Mana, the next Spell you cast after at least 3 s without casting costs 2/4/6/8/10% less Mana. |
| focus | focus-r1-efficient-recovery | 1 | S6 | Overflow Spark | [CONVERSION] | 5 | 1 | When Mana restoration would overflow Max Mana, 10/20/30/40/50% of the excess becomes Barrier, capped at 2% Max Health per event. |
| focus | focus-r1-deep-reserves | 1 | S7 | Focused Recovery | [TRIGGER] | 5 | 1 | A kill restores 2/4/6/8/10 Mana. |
| focus | focus-r1-low-mana-recovery | 1 | S8 | Quiet Mind | [CONDITION] | 5 | 1 | While no Spell is currently casting, gain +2/4/6/8/10% Mana Regen. |
| focus | focus-r1-bottomless-well | 1 | M | Deep Reservoir | **MAJOR** | 1 | 4 | The first Spell each encounter costs 0 Mana. It still starts its normal cooldown. |
| focus | focus-r2-mana-recovery | 2 | S1 | Arcane Economy | [STAT] | 5 | 2 | -0.35% Spell Mana Cost / rank. Rank 5: -1.75%. |
| focus | focus-r2-focused-casting | 2 | S2 | Focused Capacity | [STAT] | 5 | 2 | +1 Max Focus / rank. Rank 5: +5 Focus. |
| focus | focus-r2-controlled-expenditure | 2 | S3 | Echo Harmony | [LOADOUT][NEW HOOK] | 5 | 2 | If the active deck contains at least one AUTO Spell, every third AUTO cast grants +1/2/3/4/5 Mana. |
| focus | focus-r2-focused-power | 2 | S4 | Manual Reservoir | [MANUAL][NEW HOOK] | 5 | 2 | A manually initiated Spell restores 1/2/3/4/5 Mana if the previous successful Spell was AUTO. |
| focus | focus-r2-clear-mind | 2 | S5 | Alternating Mind | [LOADOUT][NEW HOOK] | 5 | 2 | Alternating AUTO â†’ MANUAL or MANUAL â†’ AUTO grants the second Spell +1/2/3/4/5% Action Speed. |
| focus | focus-r2-reserve-shield | 2 | S6 | Efficient Queue | [MANUAL][NEW HOOK] | 5 | 2 | A Spell that begins from the manual queue costs 1/2/3/4/5% less Mana. |
| focus | focus-r2-leyline-efficiency | 2 | S7 | Open Focus | [CONDITION][NEW HOOK] | 5 | 2 | For every 10 Free Focus, gain +1/2/3/4/5% Mana Regen. Re-evaluates dynamically. |
| focus | focus-r2-emergency-channel | 2 | S8 | Echo Discipline | [LOADOUT][NEW HOOK] | 5 | 2 | If at least half of your active deck is MANUAL, AUTO Spell Focus costs are reduced by 1/2/3/4/5%. |
| focus | focus-r2-perfect-focus | 2 | M | Dual Mind | **MAJOR** | 1 | 8 | AUTO casts empower MANUAL casts and MANUAL casts empower AUTO casts: after either type resolves, the next cast of the opposite type within 5 s costs 15% less Mana and gains 10% Action Speed. |
| focus | focus-r3-arcane-reservoir | 3 | S1 | Mana Reservoir II | [STAT] | 5 | 3 | +1% Max Mana / rank. Rank 5: +5%. |
| focus | focus-r3-mana-flow | 3 | S2 | Echo Efficiency | [STAT][LOADOUT] | 5 | 3 | Combat Spell AUTO Focus cost reduced by 1% / rank. Rank 5: -5%. |
| focus | focus-r3-spell-economy | 3 | S3 | Reserved Power | [LOADOUT][NEW HOOK] | 5 | 3 | For every 10 Reserved Focus, gain +0.1/0.2/0.3/0.4/0.5% Spell Power. |
| focus | focus-r3-combat-focus | 3 | S4 | Free Mind | [LOADOUT][NEW HOOK] | 5 | 3 | For every 10 Free Focus, gain +0.1/0.2/0.3/0.4/0.5 Mana Regen/sec. |
| focus | focus-r3-high-mana-precision | 3 | S5 | Resonant Cast | [CYCLE] | 5 | 3 | Every 8th successful Spell restores 1/2/3/4/5% Max Mana. |
| focus | focus-r3-low-mana-haste | 3 | S6 | Echo Battery | [LOADOUT][NEW HOOK] | 5 | 3 | Each AUTO cast grants 1 Echo Charge, max 3. A MANUAL cast consumes all charges for -1/2/3/4/5% Mana Cost per charge. |
| focus | focus-r3-victory-channel | 3 | S7 | Manual Charge | [MANUAL][NEW HOOK] | 5 | 3 | Each MANUAL cast grants 1 Manual Charge, max 3. The next AUTO cast consumes all charges for +1/2/3/4/5% Action Speed per charge. |
| focus | focus-r3-resonant-power | 3 | S8 | Prepared Slot | [LOADOUT][NEW HOOK] | 5 | 3 | The first time each unique loadout slot is successfully cast per encounter, it costs 1/2/3/4/5% less Mana. |
| focus | focus-r3-mana-overflow | 3 | M | Resonance | **MAJOR** | 1 | 12 | Every 10th successful Spell refunds 100% of its final Mana cost after completion. It still requires enough Mana to begin/complete normally. |
| focus | focus-r4-apex-reservoir | 4 | S1 | Mana Flow II | [STAT] | 5 | 4 | +2.5% Mana Regen / rank. Rank 5: +12.5%. |
| focus | focus-r4-apex-flow | 4 | S2 | Arcane Economy II | [STAT] | 5 | 4 | -0.65% Spell Mana Cost / rank. Rank 5: -3.25%. |
| focus | focus-r4-perfect-economy | 4 | S3 | Overflow Ward | [CONVERSION] | 5 | 4 | 50/60/70/80/100% of excess Mana restoration becomes Barrier, capped at 3% Max Health per second. |
| focus | focus-r4-perfect-focus-capacity | 4 | S4 | Mana to Tempo | [CONVERSION] | 5 | 4 | When Mana restoration overflows, your current/next Spell gains +1/2/3/4/5% Action Speed. Cooldown 2 s. |
| focus | focus-r4-auto-cast-mastery | 4 | S5 | Stable Reserve | [CONDITION] | 5 | 4 | Above 80% Mana, self-targeted Spells cost 1/2/3/4/5% less Mana. |
| focus | focus-r4-arcane-readiness | 4 | S6 | Empty Mind | [CONDITION] | 5 | 4 | Below 20% Mana, damaging Spells gain +1/2/3/4/5% Action Speed. |
| focus | focus-r4-high-mana-dominion | 4 | S7 | Emergency Conversion | [TRIGGER] | 5 | 4 | The first time each encounter Mana falls below 10%, immediately restore 2/4/6/8/10% Max Mana. |
| focus | focus-r4-desperation-channel | 4 | S8 | Focus Release | [LOADOUT][NEW HOOK] | 5 | 4 | If fewer than 25% of your Max Focus is Reserved, your next MANUAL Spell after a kill costs 2/4/6/8/10% less Mana. |
| focus | focus-r4-arcane-efficiency | 4 | M | Transcendence | **MAJOR** | 1 | 16 | Mana overflow can never be wasted: excess Mana restoration becomes Barrier at 100% value until the Barrier reaches 10% Max Health; further overflow reduces the cooldown of your longest-cooldown Spell by 100 ms per 1% Max Mana overflowed. |
| focus | focus-r5-convergent-reservoir | 5 | S1 | Focused Capacity II | [STAT] | 5 | 5 | +1 Max Focus / rank. Rank 5: +5 Focus. |
| focus | focus-r5-convergent-flow | 5 | S2 | Echo Efficiency II | [STAT][LOADOUT] | 5 | 5 | Combat Spell AUTO Focus cost reduced by 1.25% / rank. Rank 5: -6.25%. |
| focus | focus-r5-convergent-efficiency | 5 | S3 | Balanced Mind | [LOADOUT][NEW HOOK] | 5 | 5 | If the deck contains at least 2 AUTO and 2 MANUAL Spells, gain +1/2/3/4/5% Mana Regen and +0.5/1/1.5/2/2.5% Action Speed. |
| focus | focus-r5-expanded-focus | 5 | S4 | Echo Battery II | [LOADOUT][NEW HOOK] | 5 | 5 | AUTO casts build charges, max 5. A MANUAL cast consumes them to gain +1/2/3/4/5% Damage or Healing per charge, based on the Spell's effect. |
| focus | focus-r5-auto-cast-convergence | 5 | S5 | Manual Battery | [MANUAL][NEW HOOK] | 5 | 5 | MANUAL casts build charges, max 5. An AUTO cast consumes them to refund 1/2/3/4/5 Mana per charge. |
| focus | focus-r5-convergent-recovery | 5 | S6 | Convergent Queue | [MANUAL][NEW HOOK] | 5 | 5 | When a queued MANUAL Spell begins, reduce the cooldown of the last AUTO Spell cast by 0.1/0.2/0.3/0.4/0.5 s. |
| focus | focus-r5-full-reservoir | 5 | S7 | Reserved Conversion | [LOADOUT][NEW HOOK] | 5 | 5 | For every 20 Reserved Focus, the first AUTO Spell each encounter restores 1/2/3/4/5 Mana. |
| focus | focus-r5-empty-reservoir | 5 | S8 | Free Focus Surge | [LOADOUT][NEW HOOK] | 5 | 5 | For every 20 Free Focus, the first MANUAL Spell each encounter gains +1/2/3/4/5% Action Speed. |
| focus | focus-r5-arcane-convergence | 5 | M | Convergence | **MAJOR** | 1 | 20 | When you alternate between AUTO and MANUAL for 4 successful casts without breaking the pattern, the fourth cast costs 0 Mana and gains 20% Action Speed. Pattern then resets. |
| focus | focus-r6-overchannel-reservoir | 6 | S1 | Mana Reservoir III | [STAT] | 5 | 6 | +1.75% Max Mana / rank. Rank 5: +8.75%. |
| focus | focus-r6-overchannel-flow | 6 | S2 | Mana Flow III | [STAT] | 5 | 6 | +4% Mana Regen / rank. Rank 5: +20%. |
| focus | focus-r6-overchannel-economy | 6 | S3 | Overchannel | [CONDITION] | 5 | 6 | Above 80% Mana, Spells costing at least 10% Max Mana gain +2/4/6/8/10% Damage/Healing/Barrier Power. |
| focus | focus-r6-overchannel-focus | 6 | S4 | Deep Draw | [CONDITION] | 5 | 6 | Below 20% Mana, Spell Mana Cost is reduced by 1/2/3/4/5%. |
| focus | focus-r6-auto-cast-overchannel | 6 | S5 | Arcane Return | [TRIGGER] | 5 | 6 | A successful Spell restores 1/2/3/4/5 Mana. Internal cooldown 1 s. |
| focus | focus-r6-mana-rebound | 6 | S6 | Reservoir Break | [TRIGGER] | 5 | 6 | When a cast drops Mana from above 80% to below 50%, reduce that Spell's cooldown by 0.2/0.4/0.6/0.8/1.0 s. |
| focus | focus-r6-low-mana-acceleration | 6 | S7 | Overchannel Cycle | [CYCLE] | 5 | 6 | Spend at least 30% Max Mana across successful casts within 6 s to gain +2/4/6/8/10% Action Speed for the next Spell. |
| focus | focus-r6-high-mana-precision | 6 | S8 | Emergency Free Cast | [TRIGGER] | 5 | 6 | The first time each encounter Mana falls below 5%, your next Spell within 5 s refunds 20/40/60/80/100% of its Mana cost after completion. |
| focus | focus-r6-overchannel | 6 | M | Overchannel | **MAJOR** | 1 | 24 | For 5 s after spending at least 25% Max Mana within 4 s, Spells gain +15% Action Speed and +10% effectiveness (Damage/Healing/Barrier), but Mana Regen is disabled during the effect. |
| focus | focus-r7-astral-reservoir | 7 | S1 | Astral Focus | [STAT] | 5 | 8 | +1 Max Focus / rank. Rank 5: +5 Focus. |
| focus | focus-r7-astral-flow | 7 | S2 | Astral Economy | [STAT] | 5 | 8 | -1.25% Spell Mana Cost / rank. Rank 5: -6.25%. |
| focus | focus-r7-astral-economy | 7 | S3 | Astral Reserved Power | [LOADOUT][NEW HOOK] | 5 | 8 | For every 10 Reserved Focus, gain +0.2/0.4/0.6/0.8/1.0% Spell Power. |
| focus | focus-r7-astral-focus | 7 | S4 | Astral Open Mind | [LOADOUT][NEW HOOK] | 5 | 8 | For every 10 Free Focus, gain +0.2/0.4/0.6/0.8/1.0 Mana Regen/sec. |
| focus | focus-r7-astral-auto-cast | 7 | S5 | Astral Rotation | [LOADOUT][NEW HOOK] | 5 | 8 | Casting 3 different deck slots in succession refunds 1/2/3/4/5% Max Mana on the third cast. |
| focus | focus-r7-focused-mind | 7 | S6 | Echo Cascade | [LOADOUT][NEW HOOK] | 5 | 8 | After 3 consecutive AUTO casts, the next MANUAL cast gains +2/4/6/8/10% Action Speed and refunds 5% of its Mana cost. |
| focus | focus-r7-open-mind | 7 | S7 | Manual Cascade | [MANUAL][NEW HOOK] | 5 | 8 | After 3 consecutive MANUAL casts, the next AUTO cast gains +2/4/6/8/10% effectiveness. |
| focus | focus-r7-astral-victory | 7 | S8 | Astral Recovery | [TRIGGER] | 5 | 8 | A kill restores 1/2/3/4/5% Max Mana and reduces the cooldown of the next Spell you cast by 0.2/0.4/0.6/0.8/1.0 s. |
| focus | focus-r7-astral-mind | 7 | M | Astral Mind | **MAJOR** | 1 | 32 | Reserved and Free Focus both matter: every 10 Reserved Focus grants +0.5% Spell Power; every 10 Free Focus grants +0.5% Action Speed. Each side is capped at +10%. |
| focus | focus-r8-singularity-reservoir | 8 | S1 | Singularity Flow | [STAT] | 5 | 10 | +6% Mana Regen / rank. Rank 5: +30%. |
| focus | focus-r8-singularity-flow | 8 | S2 | Singularity Focus | [STAT] | 5 | 10 | +1 Max Focus / rank. Rank 5: +5 Focus. |
| focus | focus-r8-singularity-economy | 8 | S3 | Zero Point | [CYCLE] | 5 | 10 | Every 8th successful Spell costs 20/40/60/80/100% less Mana. |
| focus | focus-r8-singularity-focus | 8 | S4 | Event Horizon | [CONVERSION] | 5 | 10 | When Mana reaches 100%, store 1 Overflow Charge. Max 1/2/3/4/5 charges. A Spell cast below 25% Mana consumes one charge to restore 5% Max Mana. |
| focus | focus-r8-singularity-auto-cast | 8 | S5 | Singularity Echo | [LOADOUT][NEW HOOK] | 5 | 10 | An AUTO Spell cast at full Mana grants your next MANUAL Spell +3/6/9/12/15% effectiveness. |
| focus | focus-r8-singularity-power | 8 | S6 | Singularity Manual | [MANUAL][NEW HOOK] | 5 | 10 | A MANUAL Spell cast below 25% Mana causes the next AUTO Spell to refund 5/10/15/20/25% of its Mana cost. |
| focus | focus-r8-singularity-haste | 8 | S7 | Focus Collapse | [LOADOUT][NEW HOOK] | 5 | 10 | When Reserved Focus exceeds 75% Max Focus, AUTO Spells gain +1/2/3/4/5% Action Speed. When Reserved Focus is below 25%, MANUAL Spells gain the same bonus. |
| focus | focus-r8-singularity-recovery | 8 | S8 | Perfect Conservation | [TRIGGER] | 5 | 10 | If a Spell ends with exactly the same Mana percentage band you started in (0â€“25 / 25â€“50 / 50â€“75 / 75â€“100), reduce its cooldown by 0.2/0.4/0.6/0.8/1.0 s. |
| focus | focus-r8-arcane-singularity | 8 | M | Arcane Singularity | **MAJOR** | 1 | 40 | Once per encounter, when Mana would fall below 10%, set Mana to 50% Max Mana instead and enter Singularity for 5 s: Spell Mana costs are halved, but Mana Regen is disabled. Cannot trigger again that encounter. |
| control | control-r1-cooldown-control | 1 | S1 | Cooldown Control | [STAT] | 5 | 1 | +0.50% Cooldown Recovery / rank. Rank 5: +2.50%. |
| control | control-r1-status-mastery | 1 | S2 | Casting Rhythm | [STAT] | 5 | 1 | +0.25% Action Speed / rank. Rank 5: +1.25%. |
| control | control-r1-combat-speed | 1 | S3 | Delayed Fate | [TRIGGER] | 5 | 1 | Applying a control-tagged Status delays the enemy's current action by 20/40/60/80/100 ms. Internal cooldown 1 s. |
| control | control-r1-status-pressure | 1 | S4 | Opening Control | [TRIGGER] | 5 | 1 | The first control-tagged Status applied each encounter lasts 2/4/6/8/10% longer. |
| control | control-r1-suppression | 1 | S5 | Controlled Strike | [CONDITION] | 5 | 1 | Against enemies with a control-tagged Status, damaging Spells gain +1/2/3/4/5% Damage. |
| control | control-r1-quick-recovery | 1 | S6 | Recovery Window | [TRIGGER] | 5 | 1 | When a control-tagged Status expires naturally, reduce your longest remaining Spell cooldown by 0.1/0.2/0.3/0.4/0.5 s. |
| control | control-r1-control-pressure | 1 | S7 | Manual Timing | [MANUAL][NEW HOOK] | 5 | 1 | A MANUAL Spell begun while the enemy has less than 25% of its current action time remaining gains +2/4/6/8/10% Action Speed. |
| control | control-r1-debilitating-presence | 1 | S8 | Tempo Theft | [TRIGGER] | 5 | 1 | If the enemy begins an action while controlled, restore 1/2/3/4/5 Mana. |
| control | control-r1-temporal-flow | 1 | M | Temporal Flow | **MAJOR** | 1 | 4 | The first time each encounter you apply a control-tagged Status, delay the enemy current action by 500 ms and gain +10% Action Speed for your next Spell. |
| control | control-r2-layered-control | 2 | S1 | Status Mastery | [STAT] | 5 | 2 | +1.5% Status Duration dealt / rank. Rank 5: +7.5%. |
| control | control-r2-fast-hands | 2 | S2 | Suppression | [STAT] | 5 | 2 | Enemies with any negative Status deal 0.5/1/1.5/2/2.5% less Damage. |
| control | control-r2-spell-momentum | 2 | S3 | Layered Control | [TRIGGER] | 5 | 2 | Applying a different control-tagged Status to an already controlled enemy extends the older control Status by 1/2/3/4/5% of its original duration. |
| control | control-r2-barrier-exploit | 2 | S4 | Controlled Flow | [TRIGGER] | 5 | 2 | Applying a control-tagged Status restores 1/2/3/4/5 Mana. Internal cooldown 2 s. |
| control | control-r2-vulnerability-exploit | 2 | S5 | Debuff Pressure | [CONDITION] | 5 | 2 | Against enemies with 2+ negative Statuses, gain +1/2/3/4/5% Damage Dealt. |
| control | control-r2-spell-feedback | 2 | S6 | Slow Burn | [CONDITION] | 5 | 2 | Your DoTs tick for +1/2/3/4/5% Damage while the target has a control-tagged Status. |
| control | control-r2-controlled-assault | 2 | S7 | Suppression Window | [TRIGGER] | 5 | 2 | When an enemy action is delayed by any of your effects, your next Spell within 2 s gains +1/2/3/4/5% Action Speed. |
| control | control-r2-precision-timing | 2 | S8 | Control Refresh | [TRIGGER] | 5 | 2 | If you apply the same control Status while it still has less than 25% duration remaining, increase the refreshed duration by 2/4/6/8/10%. |
| control | control-r2-perfect-timing | 2 | M | Perfect Timing | **MAJOR** | 1 | 8 | Whenever you apply a control-tagged Status during the final 25% of the enemy's current action, delay that action by an additional 750 ms. Cooldown 5 s. |
| control | control-r3-rapid-cycle | 3 | S1 | Cooldown Control II | [STAT] | 5 | 3 | +1% Cooldown Recovery / rank. Rank 5: +5%. |
| control | control-r3-deep-status | 3 | S2 | Deep Status | [STAT] | 5 | 3 | +2% Status Duration dealt / rank. Rank 5: +10%. |
| control | control-r3-multi-layered-control | 3 | S3 | Chain Control | [TRIGGER] | 5 | 3 | Applying a third distinct negative Status to the same enemy causes all your current negative Statuses on that enemy to gain +1/2/3/4/5% remaining duration. |
| control | control-r3-deep-suppression | 3 | S4 | Dominating Weakness | [CONDITION] | 5 | 3 | Enemies with 3+ negative Statuses take +1/2/3/4/5% Damage from you. |
| control | control-r3-kill-momentum | 3 | S5 | Suppressed Enemy | [CONDITION] | 5 | 3 | Enemies with 3+ negative Statuses deal 1/2/3/4/5% less Damage. |
| control | control-r3-controlled-flow | 3 | S6 | Status Echo | [TRIGGER] | 5 | 3 | When one of your control Statuses expires naturally, your next control Status within 4 s gains +2/4/6/8/10% duration. |
| control | control-r3-cooldown-mastery | 3 | S7 | Queued Dominion | [MANUAL][NEW HOOK] | 5 | 3 | A Spell that begins from the manual queue gains +1/2/3/4/5% Status Duration if it applies a negative Status. |
| control | control-r3-debuff-execution | 3 | S8 | Timeline Break | [CYCLE] | 5 | 3 | Every 4th control-tagged Status you apply delays the enemy's current action by an extra 100/200/300/400/500 ms. |
| control | control-r3-dominion | 3 | M | Dominion | **MAJOR** | 1 | 12 | While an enemy has 3+ negative Statuses, its current action timer progresses 15% slower and it takes +8% Damage from you. |
| control | control-r4-apex-cooldown | 4 | S1 | Apex Timing | [STAT] | 5 | 4 | +0.60% Action Speed / rank. Rank 5: +3%. |
| control | control-r4-apex-status | 4 | S2 | Apex Status | [STAT] | 5 | 4 | +2.5% Status Duration dealt / rank. Rank 5: +12.5%. |
| control | control-r4-absolute-pressure | 4 | S3 | Aftershock | [TRIGGER][NEW HOOK] | 5 | 4 | When Freeze expires from an enemy, apply Chill for 1/2/3/4/5 s. If Chill is already present, refresh it instead. |
| control | control-r4-absolute-suppression | 4 | S4 | Tremor Lock | [TRIGGER] | 5 | 4 | Applying an Earth control Status to an already controlled enemy delays its current action by 50/100/150/200/250 ms. Cooldown 2 s. |
| control | control-r4-perfect-rhythm | 4 | S5 | Cold Precision | [TRIGGER] | 5 | 4 | Applying a Water control Status makes your next Spell within 3 s gain +1/2/3/4/5% Action Speed. |
| control | control-r4-disruption-mastery | 4 | S6 | Control Conversion | [CONVERSION] | 5 | 4 | When a control Status is cleansed/removed before expiry, restore 1/2/3/4/5 Mana and reduce your longest cooldown by 0.1/0.2/0.3/0.4/0.5 s. |
| control | control-r4-barrier-rupture | 4 | S7 | Absolute Pressure | [CONDITION] | 5 | 4 | Against enemies with 3+ negative Statuses, gain +1.5/3/4.5/6/7.5% Damage Dealt. |
| control | control-r4-vulnerable-mastery | 4 | S8 | Action Denial | [TRIGGER] | 5 | 4 | If a control Status causes the enemy action timer to be delayed while under 20% remaining, add another 25/50/75/100/125 ms. Cooldown 2 s. |
| control | control-r4-arcane-lock | 4 | M | Arcane Lock | **MAJOR** | 1 | 16 | The first time each encounter an enemy reaches the final 10% of an action while controlled, freeze that action timer for 1.5 s. This is timeline stasis, not a Stun Status. |
| control | control-r5-interference-recovery | 5 | S1 | Interference Recovery | [STAT] | 5 | 5 | +1.5% Cooldown Recovery / rank. Rank 5: +7.5%. |
| control | control-r5-interference-duration | 5 | S2 | Interference Tempo | [STAT] | 5 | 5 | +0.75% Action Speed / rank. Rank 5: +3.75%. |
| control | control-r5-interference-tempo | 5 | S3 | Spell Interference | [TRIGGER] | 5 | 5 | When a Spell applies a negative Status, reduce that Spell's own cooldown by 50/100/150/200/250 ms. |
| control | control-r5-debuff-pressure | 5 | S4 | Status Fracture | [TRIGGER] | 5 | 5 | Applying a negative Status to an enemy that already has 3+ negative Statuses delays its action by 50/100/150/200/250 ms. Cooldown 1 s. |
| control | control-r5-enemy-interference | 5 | S5 | Interference Pulse | [CYCLE] | 5 | 5 | Every 5th successful Spell cast against a debuffed enemy reduces all remaining cooldowns by 0.1/0.2/0.3/0.4/0.5 s. |
| control | control-r5-kill-interference | 5 | S6 | Debuff Theft | [TRIGGER] | 5 | 5 | When an enemy loses one of your negative Statuses, restore 1/2/3/4/5 Mana. Internal cooldown 1 s. |
| control | control-r5-action-interference | 5 | S7 | Manual Disruption | [MANUAL][NEW HOOK] | 5 | 5 | A MANUAL Spell begun while the enemy is casting/acting gains +1/2/3/4/5% effectiveness if it applies a debuff or control Status. |
| control | control-r5-vulnerability-pressure | 5 | S8 | Interference Chain | [TRIGGER] | 5 | 5 | After delaying an enemy action, your next different control Status within 4 s gains +2/4/6/8/10% duration. |
| control | control-r5-temporal-fracture | 5 | M | Temporal Fracture | **MAJOR** | 1 | 20 | Every 4th control-tagged Status applied creates a Temporal Fracture: delay the enemy action by 750 ms and reduce all your remaining Spell cooldowns by 500 ms. |
| control | control-r6-temporal-recovery | 6 | S1 | Temporal Recovery | [STAT] | 5 | 6 | +1.75% Cooldown Recovery / rank. Rank 5: +8.75%. |
| control | control-r6-temporal-status | 6 | S2 | Temporal Speed | [STAT] | 5 | 6 | +1% Action Speed / rank. Rank 5: +5%. |
| control | control-r6-temporal-speed | 6 | S3 | Prepared Cast | [MANUAL][NEW HOOK] | 5 | 6 | The first MANUAL Spell each encounter gains +2/4/6/8/10% Action Speed. |
| control | control-r6-temporal-hands | 6 | S4 | Queued Precision | [MANUAL][NEW HOOK] | 5 | 6 | A Spell that begins from the manual queue gains +1/2/3/4/5% Damage/Healing/Barrier effectiveness. |
| control | control-r6-temporal-momentum | 6 | S5 | Stolen Time | [TRIGGER][NEW HOOK] | 5 | 6 | When a control Status expires naturally, advance your current Spell Cast progress by 1/2/3/4/5% of its base Cast Time. |
| control | control-r6-temporal-feedback | 6 | S6 | Temporal Refund | [TRIGGER] | 5 | 6 | If an enemy action is delayed by at least 300 ms from one of your effects, restore 1/2/3/4/5 Mana. Cooldown 2 s. |
| control | control-r6-layered-interference | 6 | S7 | Precision Window | [MANUAL][NEW HOOK] | 5 | 6 | If a queued Spell begins within 1 s after an enemy action resolves, it gains +2/4/6/8/10% Action Speed. |
| control | control-r6-temporal-suppression | 6 | S8 | Chrono Cycle | [CYCLE] | 5 | 6 | Every 6th successful Spell reduces your longest remaining cooldown by 0.2/0.4/0.6/0.8/1.0 s. |
| control | control-r6-time-compression | 6 | M | Time Compression | **MAJOR** | 1 | 24 | After any MANUAL Spell successfully resolves, the next AUTO Spell within 4 s gains +20% Action Speed. After any AUTO Spell resolves, the next MANUAL Spell within 4 s gains +20% Action Speed. |
| control | control-r7-lockdown-recovery | 7 | S1 | Lockdown Duration | [STAT] | 5 | 8 | +5% Status Duration dealt / rank. Rank 5: +25%. |
| control | control-r7-lockdown-duration | 7 | S2 | Lockdown Tempo | [STAT] | 5 | 8 | +1.25% Action Speed / rank. Rank 5: +6.25%. |
| control | control-r7-lockdown-delay | 7 | S3 | Lockdown Delay | [TRIGGER] | 5 | 8 | Applying a control-tagged Status delays the enemy current action by 75/150/225/300/375 ms. Cooldown 1 s. |
| control | control-r7-controlled-target | 7 | S4 | Control Cascade | [CYCLE] | 5 | 8 | Applying 3 different control Statuses within 8 s causes the third to extend all active control Statuses by 2/4/6/8/10% remaining duration. |
| control | control-r7-controlled-suppression | 7 | S5 | Tactical Queue | [MANUAL][NEW HOOK] | 5 | 8 | When a queued MANUAL Spell begins, reduce all other remaining Spell cooldowns by 50/100/150/200/250 ms. |
| control | control-r7-vulnerability-mastery | 7 | S6 | Controlled Target | [CONDITION] | 5 | 8 | Enemies with a control-tagged Status take +2.5/5/7.5/10/12.5% Damage from your Spells. |
| control | control-r7-barrier-control | 7 | S7 | Controlled Suppression | [CONDITION] | 5 | 8 | Enemies with a control-tagged Status deal 1.25/2.5/3.75/5/6.25% less Damage. |
| control | control-r7-layered-lockdown | 7 | S8 | No Escape | [TRIGGER] | 5 | 8 | If a control Status expires while the enemy is below 25% Health, delay its current action by 100/200/300/400/500 ms. |
| control | control-r7-total-lockdown | 7 | M | Total Lockdown | **MAJOR** | 1 | 32 | While an enemy has at least two different control-tagged Statuses, its action timer progresses 20% slower, it deals 10% less Damage, and it takes 10% more Damage from you. |
| control | control-r8-stasis-recovery | 8 | S1 | Stasis Recovery | [STAT] | 5 | 10 | +2.5% Cooldown Recovery / rank. Rank 5: +12.5%. |
| control | control-r8-stasis-duration | 8 | S2 | Stasis Tempo | [STAT] | 5 | 10 | +1.5% Action Speed / rank. Rank 5: +7.5%. |
| control | control-r8-stasis-tempo | 8 | S3 | Absolute Delay | [TRIGGER] | 5 | 10 | Applying a control-tagged Status delays the enemy current action by 100/200/300/400/500 ms. Cooldown 1 s. |
| control | control-r8-stasis-delay | 8 | S4 | Status Recursion | [TRIGGER] | 5 | 10 | When a control Status expires naturally, your next different control Status within 5 s gains +3/6/9/12/15% duration and delays the enemy by 100 ms. |
| control | control-r8-stasis-suppression | 8 | S5 | Timeline Theft | [CONVERSION][NEW HOOK] | 5 | 10 | For every 1 second of enemy action time delayed by your effects, gain 1 stack of Stolen Time, max 5. Your next MANUAL Spell consumes stacks for +2/4/6/8/10% Action Speed per stack. |
| control | control-r8-absolute-pressure | 8 | S6 | Absolute Queue | [MANUAL][NEW HOOK] | 5 | 10 | A queued Spell that begins during the final 20% of an enemy action gains +3/6/9/12/15% effectiveness. |
| control | control-r8-absolute-vulnerability | 8 | S7 | Stasis Collapse | [CYCLE] | 5 | 10 | Every 5th control-tagged Status applied pauses enemy action progress for 0.25/0.5/0.75/1.0/1.25 s. This is not a Stun and does not apply a Status. |
| control | control-r8-stasis-recovery-pulse | 8 | S8 | Endless Pressure | [CONDITION] | 5 | 10 | Against enemies with 4+ negative Statuses, gain +3/6/9/12/15% Damage Dealt. |
| control | control-r8-absolute-stasis | 8 | M | Absolute Stasis | **MAJOR** | 1 | 40 | Once per encounter, after you have delayed a total of 3 seconds of enemy action time, stop enemy action progress for 3 seconds. During Stasis, your Spells gain +15% Action Speed. Stasis does not prevent Status ticking or cooldown recovery. |

## Combat rewards

| Dungeon | Normal kill points | Boss kill points |
| --- | --- | --- |
| Whispering Woods (whispering-woods) | 1 | 8 |
| Howling Den (howling-den) | 1 | 10 |
| Abandoned Catacombs (abandoned-catacombs) | 2 | 13 |
| Fractured Approach (fractured-approach) | 2 | 16 |
| Flooded Reliquary (flooded-reliquary) | 2 | 19 |
| Ashen Watch (ashen-watch) | 3 | 22 |
| Rootscar Hollow (rootscar-hollow) | 3 | 25 |
| Crossroads of Ruin (crossroads-of-ruin) | 4 | 28 |
| Graveglass Hollow (graveglass-hollow) | 4 | 31 |
| Stormvault Gallery (stormvault-gallery) | 4 | 34 |
| Starfallen Observatory (starfallen-observatory) | 5 | 38 |
| The Broken Meridian (broken-meridian) | 5 | 42 |
| Hall of Unbound Names (hall-of-unbound-names) | 6 | 46 |
| Vault of the Black Sigil (vault-of-the-black-sigil) | 6 | 50 |
| The Black Gate (black-gate) | 7 | 60 |

Normal and boss Arcane Point rewards are repeatable and resolved from centralized dungeon configuration through live Combat and Offline Bank.

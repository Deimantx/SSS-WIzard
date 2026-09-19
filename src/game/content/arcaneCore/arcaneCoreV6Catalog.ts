import type { ArcaneCoreBranchId, ArcaneCoreRingIndex } from '../../types'

export interface ArcaneCoreV6CatalogEntry {
  branch: ArcaneCoreBranchId
  ring: ArcaneCoreRingIndex
  slot: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'M'
  name: string
  type: string
  description: string
}

export const ARCANE_CORE_V6_CATALOG: Record<ArcaneCoreBranchId, Record<ArcaneCoreRingIndex, ArcaneCoreV6CatalogEntry[]>> = {
  "power": {
    "1": [
      {
        "branch": "power",
        "ring": 1,
        "slot": "S1",
        "name": "Arcane Scaling",
        "type": "[STAT]",
        "description": "+0.10% Spell Power / rank. Rank 5: +0.50%."
      },
      {
        "branch": "power",
        "ring": 1,
        "slot": "S2",
        "name": "Spell Impact",
        "type": "[STAT]",
        "description": "+0.25% Spell Damage / rank. Rank 5: +1.25%."
      },
      {
        "branch": "power",
        "ring": 1,
        "slot": "S3",
        "name": "Arcane Spark",
        "type": "[CYCLE]",
        "description": "Every 4th successful damaging Spell deals an extra 2/4/6/8/10% of its direct damage as Arcane damage."
      },
      {
        "branch": "power",
        "ring": 1,
        "slot": "S4",
        "name": "Overcharge",
        "type": "[CONDITION]",
        "description": "A Spell whose Mana cost is at least 10% of Max Mana deals +2/4/6/8/10% Damage."
      },
      {
        "branch": "power",
        "ring": 1,
        "slot": "S5",
        "name": "Opportunist",
        "type": "[TRIGGER]",
        "description": "When you apply a new negative Status to an enemy, your next damaging Spell within 4 s deals +2/4/6/8/10% Damage."
      },
      {
        "branch": "power",
        "ring": 1,
        "slot": "S6",
        "name": "Finisher",
        "type": "[CONDITION]",
        "description": "Against enemies below 25% Health, damaging Spells deal +1/2/3/4/5% Damage."
      },
      {
        "branch": "power",
        "ring": 1,
        "slot": "S7",
        "name": "Opening Volley",
        "type": "[TRIGGER]",
        "description": "The first damaging Spell of each encounter deals +3/6/9/12/15% Damage."
      },
      {
        "branch": "power",
        "ring": 1,
        "slot": "S8",
        "name": "Mana Edge",
        "type": "[CONDITION]",
        "description": "Above 80% Mana, damaging Spells gain +0.5/1/1.5/2/2.5% Damage."
      },
      {
        "branch": "power",
        "ring": 1,
        "slot": "M",
        "name": "Unstable Power",
        "type": "**MAJOR**",
        "description": "Every 5th successful damaging Spell deals +50% Damage, but that cast costs +25% Mana. If the Spell is free, the damage bonus still applies."
      }
    ],
    "2": [
      {
        "branch": "power",
        "ring": 2,
        "slot": "S1",
        "name": "Critical Insight",
        "type": "[STAT]",
        "description": "+0.15 percentage points Crit Chance / rank. Rank 5: +0.75 pp."
      },
      {
        "branch": "power",
        "ring": 2,
        "slot": "S2",
        "name": "Critical Force",
        "type": "[STAT]",
        "description": "+1.5% Crit Damage / rank. Rank 5: +7.5%."
      },
      {
        "branch": "power",
        "ring": 2,
        "slot": "S3",
        "name": "Critical Feedback",
        "type": "[TRIGGER]",
        "description": "A direct Spell Crit reduces all other remaining Spell cooldowns by 30/60/90/120/150 ms. Internal cooldown 0.75 s."
      },
      {
        "branch": "power",
        "ring": 2,
        "slot": "S4",
        "name": "Critical Recovery",
        "type": "[TRIGGER]",
        "description": "A direct Spell Crit restores 1/2/3/4/5 Mana. Internal cooldown 0.75 s."
      },
      {
        "branch": "power",
        "ring": 2,
        "slot": "S5",
        "name": "Perfect Window",
        "type": "[CONDITION]",
        "description": "A Spell cast against an enemy above 90% Health gains +2/4/6/8/10% Crit Damage."
      },
      {
        "branch": "power",
        "ring": 2,
        "slot": "S6",
        "name": "Marked Precision",
        "type": "[CONDITION]",
        "description": "Against a debuffed enemy, gain +0.2/0.4/0.6/0.8/1.0 pp Crit Chance."
      },
      {
        "branch": "power",
        "ring": 2,
        "slot": "S7",
        "name": "Second Chance",
        "type": "[TRIGGER]",
        "description": "When a damaging Spell fails to Crit, your next damaging Spell gains +0.2/0.4/0.6/0.8/1.0 pp Crit Chance. Consumed on the next damaging Spell."
      },
      {
        "branch": "power",
        "ring": 2,
        "slot": "S8",
        "name": "Critical Finish",
        "type": "[CONDITION]",
        "description": "Against enemies below 25% Health, Crits deal +2/4/6/8/10% additional Crit Damage."
      },
      {
        "branch": "power",
        "ring": 2,
        "slot": "M",
        "name": "Perfect Precision",
        "type": "**MAJOR**",
        "description": "After two consecutive damaging Spells fail to Crit, the third damaging Spell is guaranteed to Crit. Counter resets on a Crit."
      }
    ],
    "3": [
      {
        "branch": "power",
        "ring": 3,
        "slot": "S1",
        "name": "Arcane Scaling II",
        "type": "[STAT]",
        "description": "+0.20% Spell Power / rank. Rank 5: +1.00%."
      },
      {
        "branch": "power",
        "ring": 3,
        "slot": "S2",
        "name": "Direct Force",
        "type": "[STAT]",
        "description": "+0.50% direct Spell Damage / rank. Rank 5: +2.50%. Does not affect DoT ticks."
      },
      {
        "branch": "power",
        "ring": 3,
        "slot": "S3",
        "name": "Spell Sequence",
        "type": "[CYCLE]",
        "description": "Casting three different damaging Spells in succession causes the third to deal +3/6/9/12/15% Damage. Repeating the same Spell breaks the sequence."
      },
      {
        "branch": "power",
        "ring": 3,
        "slot": "S4",
        "name": "Arcane Momentum",
        "type": "[CYCLE]",
        "description": "Every 4th damaging Spell deals +3/6/9/12/15% Damage."
      },
      {
        "branch": "power",
        "ring": 3,
        "slot": "S5",
        "name": "Rapid Escalation",
        "type": "[TRIGGER]",
        "description": "If two damaging Spells successfully resolve within 3 s of each other, the second gains +2/4/6/8/10% Damage."
      },
      {
        "branch": "power",
        "ring": 3,
        "slot": "S6",
        "name": "Heavy Follow-Up",
        "type": "[TRIGGER]",
        "description": "After casting a Spell costing at least 12% Max Mana, your next damaging Spell costing less than 8% Max Mana deals +3/6/9/12/15% Damage."
      },
      {
        "branch": "power",
        "ring": 3,
        "slot": "S7",
        "name": "Debuff Assault",
        "type": "[CONDITION]",
        "description": "Against enemies with at least 2 negative Statuses, +1/2/3/4/5% Damage Dealt."
      },
      {
        "branch": "power",
        "ring": 3,
        "slot": "S8",
        "name": "Execution Chain",
        "type": "[TRIGGER]",
        "description": "Killing an enemy grants your first damaging Spell against the next enemy +3/6/9/12/15% Damage."
      },
      {
        "branch": "power",
        "ring": 3,
        "slot": "M",
        "name": "Arcane Overload",
        "type": "**MAJOR**",
        "description": "Every 6th successful damaging Spell repeats 25% of its direct damage as a second Arcane hit. The echo cannot Crit and does not count as another cast."
      }
    ],
    "4": [
      {
        "branch": "power",
        "ring": 4,
        "slot": "S1",
        "name": "Relentless Casting",
        "type": "[STAT]",
        "description": "+0.50% Cooldown Recovery / rank. Rank 5: +2.50%."
      },
      {
        "branch": "power",
        "ring": 4,
        "slot": "S2",
        "name": "Ascendant Power",
        "type": "[STAT]",
        "description": "+0.30% Spell Power / rank. Rank 5: +1.50%."
      },
      {
        "branch": "power",
        "ring": 4,
        "slot": "S3",
        "name": "Critical Cascade",
        "type": "[TRIGGER]",
        "description": "Direct Spell Crit reduces all other remaining Spell cooldowns by 50/100/150/200/250 ms. Internal cooldown 0.75 s."
      },
      {
        "branch": "power",
        "ring": 4,
        "slot": "S4",
        "name": "Kill Surge",
        "type": "[TRIGGER]",
        "description": "A kill reduces all remaining Spell cooldowns by 100/200/300/400/500 ms."
      },
      {
        "branch": "power",
        "ring": 4,
        "slot": "S5",
        "name": "Burst Window",
        "type": "[TRIGGER]",
        "description": "When any Spell cooldown reaches 0 naturally, your next damaging Spell within 2 s gains +2/4/6/8/10% Damage."
      },
      {
        "branch": "power",
        "ring": 4,
        "slot": "S6",
        "name": "Aggressive Rotation",
        "type": "[CYCLE]",
        "description": "Casting 4 different Spells without repeating grants +2/4/6/8/10% Action Speed to the next Spell only."
      },
      {
        "branch": "power",
        "ring": 4,
        "slot": "S7",
        "name": "Rising Violence",
        "type": "[CONDITION]",
        "description": "For each 25% enemy Health already missing, gain +0.5/1/1.5/2/2.5% Damage Dealt."
      },
      {
        "branch": "power",
        "ring": 4,
        "slot": "S8",
        "name": "Cooldown Punisher",
        "type": "[CONDITION]",
        "description": "If the Spell you are casting has a base cooldown of 20 s or more, it deals +2/4/6/8/10% Damage."
      },
      {
        "branch": "power",
        "ring": 4,
        "slot": "M",
        "name": "Perfect Execution",
        "type": "**MAJOR**",
        "description": "Damaging Spells against enemies below 20% Health gain +15% Damage. If such a Spell kills the enemy, reduce all remaining Spell cooldowns by 1 s."
      }
    ],
    "5": [
      {
        "branch": "power",
        "ring": 5,
        "slot": "S1",
        "name": "Lingering Ruin",
        "type": "[STAT]",
        "description": "+1.5% Damage over Time / rank. Rank 5: +7.5%."
      },
      {
        "branch": "power",
        "ring": 5,
        "slot": "S2",
        "name": "Ruinous Power",
        "type": "[STAT]",
        "description": "+0.40% Spell Power / rank. Rank 5: +2.00%."
      },
      {
        "branch": "power",
        "ring": 5,
        "slot": "S3",
        "name": "Burning Momentum",
        "type": "[TRIGGER]",
        "description": "When one of your DoTs ticks, gain 1 Ruin stack, max 5. Your next direct damaging Spell consumes all stacks for +1/2/3/4/5% Damage per stack."
      },
      {
        "branch": "power",
        "ring": 5,
        "slot": "S4",
        "name": "Detonation Theory",
        "type": "[TRIGGER]",
        "description": "When you consume/detonate one of your own damaging Statuses, the detonation deals +3/6/9/12/15% Damage."
      },
      {
        "branch": "power",
        "ring": 5,
        "slot": "S5",
        "name": "Lingering Execution",
        "type": "[CONDITION]",
        "description": "Your DoTs deal +2/4/6/8/10% Damage against enemies below 35% Health."
      },
      {
        "branch": "power",
        "ring": 5,
        "slot": "S6",
        "name": "Ruin Transfer",
        "type": "[TRIGGER]",
        "description": "When an enemy dies while affected by one of your DoTs, your first DoT applied to the next enemy gains +3/6/9/12/15% total damage."
      },
      {
        "branch": "power",
        "ring": 5,
        "slot": "S7",
        "name": "Corroded Defense",
        "type": "[CONDITION]",
        "description": "Enemies with 2+ negative Statuses take +1/2/3/4/5% direct Spell Damage from you."
      },
      {
        "branch": "power",
        "ring": 5,
        "slot": "S8",
        "name": "Deep Wounds",
        "type": "[TRIGGER]",
        "description": "Applying a damaging periodic Status to an already debuffed enemy increases that Status's total authored damage by +2/4/6/8/10%."
      },
      {
        "branch": "power",
        "ring": 5,
        "slot": "M",
        "name": "Chain Reaction",
        "type": "**MAJOR**",
        "description": "When one of your DoTs kills an enemy, your next successful damaging Spell against the next enemy repeats 40% of its direct damage as an Arcane echo."
      }
    ],
    "6": [
      {
        "branch": "power",
        "ring": 6,
        "slot": "S1",
        "name": "Cataclysmic Power",
        "type": "[STAT]",
        "description": "+0.50% Spell Power / rank. Rank 5: +2.50%."
      },
      {
        "branch": "power",
        "ring": 6,
        "slot": "S2",
        "name": "Aggressive Rhythm",
        "type": "[STAT]",
        "description": "+0.50% Action Speed / rank. Rank 5: +2.50%."
      },
      {
        "branch": "power",
        "ring": 6,
        "slot": "S3",
        "name": "Overcast",
        "type": "[CONDITION]",
        "description": "Spells costing at least 15% Max Mana deal +3/6/9/12/15% Damage."
      },
      {
        "branch": "power",
        "ring": 6,
        "slot": "S4",
        "name": "Mana Burn",
        "type": "[CONVERSION]",
        "description": "When a successful damaging Spell leaves you below 20% Mana, it deals an additional 2/4/6/8/10% direct damage."
      },
      {
        "branch": "power",
        "ring": 6,
        "slot": "S5",
        "name": "Cataclysmic Reserve",
        "type": "[TRIGGER]",
        "description": "Spending at least 15% Max Mana on one Spell grants +1/2/3/4/5% Crit Chance to your next damaging Spell."
      },
      {
        "branch": "power",
        "ring": 6,
        "slot": "S6",
        "name": "Critical Cataclysm",
        "type": "[TRIGGER]",
        "description": "A Crit from a Spell costing at least 15% Max Mana reduces that Spell's own cooldown by 0.2/0.4/0.6/0.8/1.0 s."
      },
      {
        "branch": "power",
        "ring": 6,
        "slot": "S7",
        "name": "Unstable Rotation",
        "type": "[CYCLE]",
        "description": "Casting a high-cost Spell then a low-cost Spell then a high-cost Spell grants the third cast +4/8/12/16/20% Damage. High = â‰¥12% Max Mana; low = <8%."
      },
      {
        "branch": "power",
        "ring": 6,
        "slot": "S8",
        "name": "Desperate Power",
        "type": "[CONDITION]",
        "description": "Below 20% Mana, damaging Spells deal +2/4/6/8/10% Damage."
      },
      {
        "branch": "power",
        "ring": 6,
        "slot": "M",
        "name": "Cataclysm",
        "type": "**MAJOR**",
        "description": "The first Spell each encounter that costs at least 15% Max Mana is Overcharged: +40% Damage, +20% Mana Cost, and its cooldown begins 25% recovered."
      }
    ],
    "7": [
      {
        "branch": "power",
        "ring": 7,
        "slot": "S1",
        "name": "Sovereign Power",
        "type": "[STAT]",
        "description": "+0.65% Spell Power / rank. Rank 5: +3.25%."
      },
      {
        "branch": "power",
        "ring": 7,
        "slot": "S2",
        "name": "Devastating Criticals",
        "type": "[STAT]",
        "description": "+4% Crit Damage / rank. Rank 5: +20%."
      },
      {
        "branch": "power",
        "ring": 7,
        "slot": "S3",
        "name": "Sovereign Sequence",
        "type": "[CYCLE]",
        "description": "Casting 5 different Spells without repeating makes the fifth deal +4/8/12/16/20% Damage."
      },
      {
        "branch": "power",
        "ring": 7,
        "slot": "S4",
        "name": "First Blood",
        "type": "[TRIGGER]",
        "description": "Your first damaging Spell against each enemy gains +4/8/12/16/20% Damage."
      },
      {
        "branch": "power",
        "ring": 7,
        "slot": "S5",
        "name": "Last Word",
        "type": "[TRIGGER]",
        "description": "Your first damaging Spell to hit an enemy below 20% Health gains +4/8/12/16/20% Damage. Once per enemy."
      },
      {
        "branch": "power",
        "ring": 7,
        "slot": "S6",
        "name": "Dominating Weakness",
        "type": "[CONDITION]",
        "description": "Against enemies with 3+ negative Statuses, +2/4/6/8/10% Damage Dealt."
      },
      {
        "branch": "power",
        "ring": 7,
        "slot": "S7",
        "name": "Sovereign Crit",
        "type": "[TRIGGER]",
        "description": "After you Crit, your next non-Crit damaging Spell within 4 s gains +2/4/6/8/10% Damage."
      },
      {
        "branch": "power",
        "ring": 7,
        "slot": "S8",
        "name": "Victory Momentum",
        "type": "[TRIGGER]",
        "description": "After a kill, gain +1/2/3/4/5% Action Speed for your first Spell against the next enemy."
      },
      {
        "branch": "power",
        "ring": 7,
        "slot": "M",
        "name": "Sovereign Casting",
        "type": "**MAJOR**",
        "description": "Each encounter begins with 3 Sovereignty charges. A damaging Spell consumes 1 charge to gain +15% Damage. Crits do not consume a charge."
      }
    ],
    "8": [
      {
        "branch": "power",
        "ring": 8,
        "slot": "S1",
        "name": "Apotheosis Power",
        "type": "[STAT]",
        "description": "+0.80% Spell Power / rank. Rank 5: +4%."
      },
      {
        "branch": "power",
        "ring": 8,
        "slot": "S2",
        "name": "Apotheosis Precision",
        "type": "[STAT]",
        "description": "+0.50 pp Crit Chance / rank. Rank 5: +2.50 pp."
      },
      {
        "branch": "power",
        "ring": 8,
        "slot": "S3",
        "name": "Perfect Cycle",
        "type": "[CYCLE]",
        "description": "Every 4th successful damaging Spell deals +6/12/18/24/30% Damage."
      },
      {
        "branch": "power",
        "ring": 8,
        "slot": "S4",
        "name": "Arcane Echo",
        "type": "[TRIGGER]",
        "description": "Every 6th successful damaging Spell repeats 5/10/15/20/25% of its direct damage as an Arcane echo."
      },
      {
        "branch": "power",
        "ring": 8,
        "slot": "S5",
        "name": "Apotheosis Execution",
        "type": "[CONDITION]",
        "description": "Against enemies below 20% Health, damaging Spells deal +3/6/9/12/15% Damage."
      },
      {
        "branch": "power",
        "ring": 8,
        "slot": "S6",
        "name": "Apotheosis Ruin",
        "type": "[TRIGGER]",
        "description": "When one of your DoTs expires naturally, your next direct damaging Spell within 4 s gains +3/6/9/12/15% Damage."
      },
      {
        "branch": "power",
        "ring": 8,
        "slot": "S7",
        "name": "Limit Break",
        "type": "[TRIGGER]",
        "description": "If a successful Spell costs at least 20% Max Mana, reduce all other remaining Spell cooldowns by 0.15/0.30/0.45/0.60/0.75 s."
      },
      {
        "branch": "power",
        "ring": 8,
        "slot": "S8",
        "name": "Absolute Momentum",
        "type": "[TRIGGER]",
        "description": "After casting three different damaging Spells within 6 s, gain +2/4/6/8/10% Action Speed for the next Spell only."
      },
      {
        "branch": "power",
        "ring": 8,
        "slot": "M",
        "name": "Arcane Apotheosis",
        "type": "**MAJOR**",
        "description": "Once per encounter, after you successfully cast 8 damaging Spells, enter Apotheosis for 6 s: damaging Spells deal +20% Damage, cost 15% less Mana, and gain 10% Action Speed. The effect cannot retrigger in the same encounter."
      }
    ]
  },
  "vitality": {
    "1": [
      {
        "branch": "vitality",
        "ring": 1,
        "slot": "S1",
        "name": "Vitality",
        "type": "[STAT]",
        "description": "+0.50% Max Health / rank. Rank 5: +2.50%."
      },
      {
        "branch": "vitality",
        "ring": 1,
        "slot": "S2",
        "name": "Steady Guard",
        "type": "[STAT]",
        "description": "+1 Defense / rank. Rank 5: +5 Defense."
      },
      {
        "branch": "vitality",
        "ring": 1,
        "slot": "S3",
        "name": "Second Skin",
        "type": "[TRIGGER]",
        "description": "When your Barrier breaks, heal 0.25/0.50/0.75/1.00/1.25% Max Health. Cooldown 4 s."
      },
      {
        "branch": "vitality",
        "ring": 1,
        "slot": "S4",
        "name": "Emergency Pulse",
        "type": "[TRIGGER]",
        "description": "The first time each encounter you fall below 30% Health, restore 1/2/3/4/5% Max Health."
      },
      {
        "branch": "vitality",
        "ring": 1,
        "slot": "S5",
        "name": "Protective Casting",
        "type": "[CONDITION]",
        "description": "While you have Barrier, gain +0.5/1/1.5/2/2.5% Action Speed for self-targeted Spells."
      },
      {
        "branch": "vitality",
        "ring": 1,
        "slot": "S6",
        "name": "Recovery Window",
        "type": "[TRIGGER]",
        "description": "After taking no Health damage for 4 s, gain +0.2/0.4/0.6/0.8/1.0 Health Regen/sec until you take Health damage again."
      },
      {
        "branch": "vitality",
        "ring": 1,
        "slot": "S7",
        "name": "Overheal Ward",
        "type": "[CONVERSION]",
        "description": "10/20/30/40/50% of Healing that would exceed Max Health is converted into Barrier, capped at 5% Max Health per heal."
      },
      {
        "branch": "vitality",
        "ring": 1,
        "slot": "S8",
        "name": "Victory Recovery",
        "type": "[TRIGGER]",
        "description": "A kill heals 0.5/1/1.5/2/2.5% Max Health."
      },
      {
        "branch": "vitality",
        "ring": 1,
        "slot": "M",
        "name": "Refuse Death",
        "type": "**MAJOR**",
        "description": "The first time each encounter you would fall below 10% Health, gain Barrier equal to 10% Max Health. Cooldown: once per encounter."
      }
    ],
    "2": [
      {
        "branch": "vitality",
        "ring": 2,
        "slot": "S1",
        "name": "Fortified Body",
        "type": "[STAT]",
        "description": "-0.25% Damage Taken / rank. Rank 5: -1.25%."
      },
      {
        "branch": "vitality",
        "ring": 2,
        "slot": "S2",
        "name": "Natural Recovery",
        "type": "[STAT]",
        "description": "+0.20 Health Regen/sec / rank. Rank 5: +1/sec."
      },
      {
        "branch": "vitality",
        "ring": 2,
        "slot": "S3",
        "name": "Stonewall",
        "type": "[CONDITION]",
        "description": "While Barrier exists, gain +1/2/3/4/5 Defense."
      },
      {
        "branch": "vitality",
        "ring": 2,
        "slot": "S4",
        "name": "Reinforced Ward",
        "type": "[CONDITION]",
        "description": "While Barrier exists, take 0.5/1/1.5/2/2.5% less Damage."
      },
      {
        "branch": "vitality",
        "ring": 2,
        "slot": "S5",
        "name": "Pain to Mana",
        "type": "[CONVERSION]",
        "description": "When you take Health damage, restore Mana equal to 1/2/3/4/5% of the Health damage taken. Internal cooldown 1 s."
      },
      {
        "branch": "vitality",
        "ring": 2,
        "slot": "S6",
        "name": "Barrier Recovery",
        "type": "[TRIGGER]",
        "description": "Gaining Barrier while below 50% Health heals 0.25/0.50/0.75/1.00/1.25% Max Health. Cooldown 3 s."
      },
      {
        "branch": "vitality",
        "ring": 2,
        "slot": "S7",
        "name": "Guarded Recovery",
        "type": "[CONDITION]",
        "description": "While above 80% Health, Health Regen is increased by 5/10/15/20/25%."
      },
      {
        "branch": "vitality",
        "ring": 2,
        "slot": "S8",
        "name": "Low Health Guard",
        "type": "[CONDITION]",
        "description": "Below 35% Health, gain +2/4/6/8/10 Defense."
      },
      {
        "branch": "vitality",
        "ring": 2,
        "slot": "M",
        "name": "Unyielding",
        "type": "**MAJOR**",
        "description": "While below 50% Health, incoming Health damage is reduced by 8%. This does not reduce damage absorbed by Barrier."
      }
    ],
    "3": [
      {
        "branch": "vitality",
        "ring": 3,
        "slot": "S1",
        "name": "Barrier Power",
        "type": "[STAT]",
        "description": "+1% Barrier Power / rank. Rank 5: +5%."
      },
      {
        "branch": "vitality",
        "ring": 3,
        "slot": "S2",
        "name": "Healing Mastery",
        "type": "[STAT]",
        "description": "+1% Healing Done / rank. Rank 5: +5%."
      },
      {
        "branch": "vitality",
        "ring": 3,
        "slot": "S3",
        "name": "Reactive Ward",
        "type": "[TRIGGER]",
        "description": "Taking Health damage while you have no Barrier grants Barrier equal to 0.5/1/1.5/2/2.5% Max Health. Cooldown 8 s."
      },
      {
        "branch": "vitality",
        "ring": 3,
        "slot": "S4",
        "name": "Ward Renewal",
        "type": "[TRIGGER]",
        "description": "Whenever you gain Barrier, heal 0.2/0.4/0.6/0.8/1.0% Max Health. Cooldown 3 s."
      },
      {
        "branch": "vitality",
        "ring": 3,
        "slot": "S5",
        "name": "Barrier Memory",
        "type": "[TRIGGER]",
        "description": "When Barrier expires naturally instead of breaking, your next Barrier within 6 s gains +5/10/15/20/25% strength."
      },
      {
        "branch": "vitality",
        "ring": 3,
        "slot": "S6",
        "name": "Aegis Momentum",
        "type": "[TRIGGER]",
        "description": "After gaining Barrier, your next self-targeted Spell within 4 s gains +2/4/6/8/10% Action Speed."
      },
      {
        "branch": "vitality",
        "ring": 3,
        "slot": "S7",
        "name": "Stable Protection",
        "type": "[CONDITION]",
        "description": "If your Barrier is at least 10% Max Health, take 1/2/3/4/5% less Damage."
      },
      {
        "branch": "vitality",
        "ring": 3,
        "slot": "S8",
        "name": "Barrier Pulse",
        "type": "[TRIGGER]",
        "description": "When Barrier breaks, reduce all remaining self-targeted Spell cooldowns by 0.2/0.4/0.6/0.8/1.0 s."
      },
      {
        "branch": "vitality",
        "ring": 3,
        "slot": "M",
        "name": "Arcane Aegis",
        "type": "**MAJOR**",
        "description": "When a Barrier breaks, immediately gain a replacement Barrier equal to 25% of the broken Barrier's original value. Cooldown 8 s."
      }
    ],
    "4": [
      {
        "branch": "vitality",
        "ring": 4,
        "slot": "S1",
        "name": "Vitality II",
        "type": "[STAT]",
        "description": "+1.25% Max Health / rank. Rank 5: +6.25%."
      },
      {
        "branch": "vitality",
        "ring": 4,
        "slot": "S2",
        "name": "Immortal Defense",
        "type": "[STAT]",
        "description": "+3 Defense / rank. Rank 5: +15 Defense."
      },
      {
        "branch": "vitality",
        "ring": 4,
        "slot": "S3",
        "name": "Last Breath",
        "type": "[TRIGGER]",
        "description": "The first time each encounter you fall below 20% Health, your next Healing Spell gains +5/10/15/20/25% Action Speed and +5/10/15/20/25% Healing Done."
      },
      {
        "branch": "vitality",
        "ring": 4,
        "slot": "S4",
        "name": "Emergency Aegis",
        "type": "[TRIGGER]",
        "description": "The first time each encounter you fall below 20% Health, gain Barrier equal to 2/4/6/8/10% Max Health."
      },
      {
        "branch": "vitality",
        "ring": 4,
        "slot": "S5",
        "name": "Crisis Conversion",
        "type": "[CONVERSION][NEW HOOK]",
        "description": "Below 15% Health, if you cannot afford a self-targeted Healing or Barrier Spell, up to 5/10/15/20/25% of its missing Mana may be paid with Health instead. Cannot reduce you below 1 Health."
      },
      {
        "branch": "vitality",
        "ring": 4,
        "slot": "S6",
        "name": "Iron Will",
        "type": "[CONDITION]",
        "description": "Below 30% Health, take 1/2/3/4/5% less Damage."
      },
      {
        "branch": "vitality",
        "ring": 4,
        "slot": "S7",
        "name": "Recovery Surge",
        "type": "[TRIGGER]",
        "description": "Healing yourself while below 25% Health restores an additional 0.5/1/1.5/2/2.5% Max Health."
      },
      {
        "branch": "vitality",
        "ring": 4,
        "slot": "S8",
        "name": "Survival Instinct",
        "type": "[TRIGGER]",
        "description": "After surviving damage that leaves you below 10% Health, gain +2/4/6/8/10% Action Speed to your next self-targeted Spell."
      },
      {
        "branch": "vitality",
        "ring": 4,
        "slot": "M",
        "name": "Immortal Guard",
        "type": "**MAJOR**",
        "description": "Once per dungeon run, lethal damage leaves you at 1 Health, removes all cleanseable debuffs from you, and your next Healing Spell within 6 s becomes instant. The Spell still pays Mana and starts cooldown normally."
      }
    ],
    "5": [
      {
        "branch": "vitality",
        "ring": 5,
        "slot": "S1",
        "name": "Bastion Defense",
        "type": "[STAT]",
        "description": "+2.5 Defense / rank. Rank 5: +12.5 Defense."
      },
      {
        "branch": "vitality",
        "ring": 5,
        "slot": "S2",
        "name": "Bastion Ward",
        "type": "[STAT]",
        "description": "+1.5% Barrier Power / rank. Rank 5: +7.5%."
      },
      {
        "branch": "vitality",
        "ring": 5,
        "slot": "S3",
        "name": "Fortress",
        "type": "[CONDITION]",
        "description": "While Barrier exists, take 1/2/3/4/5% less Damage."
      },
      {
        "branch": "vitality",
        "ring": 5,
        "slot": "S4",
        "name": "Layered Ward",
        "type": "[TRIGGER]",
        "description": "Gaining Barrier while you already have Barrier increases the new Barrier's effective value by 2/4/6/8/10% before normal replace/add rules."
      },
      {
        "branch": "vitality",
        "ring": 5,
        "slot": "S5",
        "name": "Ward Battery",
        "type": "[CONVERSION]",
        "description": "When Barrier absorbs damage, restore Mana equal to 1/2/3/4/5% of the absorbed amount. Internal cooldown 0.5 s."
      },
      {
        "branch": "vitality",
        "ring": 5,
        "slot": "S6",
        "name": "Bastion Cast",
        "type": "[CONDITION]",
        "description": "While Barrier exists, self-targeted Spells cost 1/2/3/4/5% less Mana."
      },
      {
        "branch": "vitality",
        "ring": 5,
        "slot": "S7",
        "name": "Reinforced Recovery",
        "type": "[TRIGGER]",
        "description": "When Barrier breaks, gain +0.5/1/1.5/2/2.5 Health Regen/sec for 6 s."
      },
      {
        "branch": "vitality",
        "ring": 5,
        "slot": "S8",
        "name": "Safe Offensive",
        "type": "[CONDITION]",
        "description": "While Barrier is at least 10% Max Health, damaging Spells gain +0.5/1/1.5/2/2.5% Damage."
      },
      {
        "branch": "vitality",
        "ring": 5,
        "slot": "M",
        "name": "Living Bastion",
        "type": "**MAJOR**",
        "description": "While Barrier exists, 20% of Healing received is also added to Barrier, capped at 5% Max Health per heal."
      }
    ],
    "6": [
      {
        "branch": "vitality",
        "ring": 6,
        "slot": "S1",
        "name": "Renewal Flow",
        "type": "[STAT]",
        "description": "+0.50 Health Regen/sec / rank. Rank 5: +2.50/sec."
      },
      {
        "branch": "vitality",
        "ring": 6,
        "slot": "S2",
        "name": "Deep Recovery",
        "type": "[STAT]",
        "description": "+1.5% Healing Received / rank. Rank 5: +7.5%."
      },
      {
        "branch": "vitality",
        "ring": 6,
        "slot": "S3",
        "name": "Regenerative Casting",
        "type": "[TRIGGER]",
        "description": "Successfully casting a self-targeted Spell grants +0.1/0.2/0.3/0.4/0.5 Health Regen/sec for 5 s. Stacks up to 3."
      },
      {
        "branch": "vitality",
        "ring": 6,
        "slot": "S4",
        "name": "Healing Momentum",
        "type": "[TRIGGER]",
        "description": "After you heal yourself, your next self-targeted Spell within 4 s gains +2/4/6/8/10% Action Speed."
      },
      {
        "branch": "vitality",
        "ring": 6,
        "slot": "S5",
        "name": "Overflowing Life",
        "type": "[CONVERSION]",
        "description": "Overhealing converts 10/20/30/40/50% of the excess into Mana, capped at 2% Max Mana per heal."
      },
      {
        "branch": "vitality",
        "ring": 6,
        "slot": "S6",
        "name": "Barrier Break Recovery",
        "type": "[TRIGGER]",
        "description": "When Barrier breaks, heal 0.75/1.5/2.25/3/3.75% Max Health."
      },
      {
        "branch": "vitality",
        "ring": 6,
        "slot": "S7",
        "name": "Renewal Cycle",
        "type": "[CYCLE]",
        "description": "Every 4th successful self-targeted Spell restores 1/2/3/4/5% Max Health."
      },
      {
        "branch": "vitality",
        "ring": 6,
        "slot": "S8",
        "name": "Victory Renewal",
        "type": "[TRIGGER]",
        "description": "A kill grants +0.5/1/1.5/2/2.5 Health Regen/sec for 6 s."
      },
      {
        "branch": "vitality",
        "ring": 6,
        "slot": "M",
        "name": "Renewal",
        "type": "**MAJOR**",
        "description": "Every 10 seconds in combat, if you are below 50% Health, heal 5% Max Health. If already above 50%, instead gain Barrier equal to 5% Max Health."
      }
    ],
    "7": [
      {
        "branch": "vitality",
        "ring": 7,
        "slot": "S1",
        "name": "Vitality III",
        "type": "[STAT]",
        "description": "+2% Max Health / rank. Rank 5: +10%."
      },
      {
        "branch": "vitality",
        "ring": 7,
        "slot": "S2",
        "name": "Undying Recovery",
        "type": "[STAT]",
        "description": "+0.75 Health Regen/sec / rank. Rank 5: +3.75/sec."
      },
      {
        "branch": "vitality",
        "ring": 7,
        "slot": "S3",
        "name": "Last Refuge",
        "type": "[TRIGGER]",
        "description": "The first time each encounter you fall below 20% Health, gain Barrier equal to 3/6/9/12/15% Max Health."
      },
      {
        "branch": "vitality",
        "ring": 7,
        "slot": "S4",
        "name": "Defiant Casting",
        "type": "[CONDITION]",
        "description": "Below 35% Health, gain +1/2/3/4/5% Action Speed for Healing and Barrier Spells."
      },
      {
        "branch": "vitality",
        "ring": 7,
        "slot": "S5",
        "name": "Pain Conversion",
        "type": "[CONVERSION]",
        "description": "When you take Health damage below 35% Health, restore Mana equal to 2/4/6/8/10% of the Health damage taken. Internal cooldown 1 s."
      },
      {
        "branch": "vitality",
        "ring": 7,
        "slot": "S6",
        "name": "Undying Will",
        "type": "[CONDITION]",
        "description": "Below 35% Health, take 1/2/3/4/5% less Damage."
      },
      {
        "branch": "vitality",
        "ring": 7,
        "slot": "S7",
        "name": "Comeback",
        "type": "[TRIGGER]",
        "description": "Healing from below 20% Health to above 35% Health reduces all remaining Spell cooldowns by 0.3/0.6/0.9/1.2/1.5 s. Once per encounter."
      },
      {
        "branch": "vitality",
        "ring": 7,
        "slot": "S8",
        "name": "Victory Restoration",
        "type": "[TRIGGER]",
        "description": "A kill heals 2/4/6/8/10% Max Health."
      },
      {
        "branch": "vitality",
        "ring": 7,
        "slot": "M",
        "name": "Undying",
        "type": "**MAJOR**",
        "description": "Once per dungeon run, lethal damage leaves you at 1 Health, grants Barrier equal to 20% Max Health, and gives 50% Damage Reduction for 2 s."
      }
    ],
    "8": [
      {
        "branch": "vitality",
        "ring": 8,
        "slot": "S1",
        "name": "Eternal Defense",
        "type": "[STAT]",
        "description": "+4 Defense / rank. Rank 5: +20 Defense."
      },
      {
        "branch": "vitality",
        "ring": 8,
        "slot": "S2",
        "name": "Eternal Ward",
        "type": "[STAT]",
        "description": "+2% Barrier Power / rank. Rank 5: +10%."
      },
      {
        "branch": "vitality",
        "ring": 8,
        "slot": "S3",
        "name": "Perfect Restoration",
        "type": "[TRIGGER]",
        "description": "A Healing Spell that restores at least 10% Max Health reduces its own cooldown by 0.2/0.4/0.6/0.8/1.0 s."
      },
      {
        "branch": "vitality",
        "ring": 8,
        "slot": "S4",
        "name": "Eternal Fortress",
        "type": "[CONDITION]",
        "description": "While Barrier exists, take 1/2/3/4/5% less Damage."
      },
      {
        "branch": "vitality",
        "ring": 8,
        "slot": "S5",
        "name": "Phoenix Pulse",
        "type": "[TRIGGER]",
        "description": "The first time each encounter you fall below 15% Health, remove 1/2/3/4/5 cleanseable debuffs and grant +5/10/15/20/25% Action Speed to your next Healing Spell."
      },
      {
        "branch": "vitality",
        "ring": 8,
        "slot": "S6",
        "name": "Life Battery",
        "type": "[CONVERSION]",
        "description": "When you receive Healing at full Health, convert 10/20/30/40/50% of it into Barrier, then convert any excess Barrier gain into Mana at 25% efficiency."
      },
      {
        "branch": "vitality",
        "ring": 8,
        "slot": "S7",
        "name": "Unbroken Cycle",
        "type": "[TRIGGER]",
        "description": "If a Barrier expires naturally, your next Barrier Spell within 6 s has 5/10/15/20/25% reduced cooldown."
      },
      {
        "branch": "vitality",
        "ring": 8,
        "slot": "S8",
        "name": "Eternal Recovery",
        "type": "[TRIGGER]",
        "description": "Whenever you cross upward through 50% Health, gain +1/2/3/4/5 Health Regen/sec for 5 s. Cooldown 10 s."
      },
      {
        "branch": "vitality",
        "ring": 8,
        "slot": "M",
        "name": "Eternal Aegis",
        "type": "**MAJOR**",
        "description": "Your Healing and Barrier systems become linked: 25% of effective Healing also grants Barrier, and 25% of effective Barrier gained also heals you. Each conversion is capped at 5% Max Health per event."
      }
    ]
  },
  "focus": {
    "1": [
      {
        "branch": "focus",
        "ring": 1,
        "slot": "S1",
        "name": "Mana Reservoir",
        "type": "[STAT]",
        "description": "+0.50% Max Mana / rank. Rank 5: +2.50%."
      },
      {
        "branch": "focus",
        "ring": 1,
        "slot": "S2",
        "name": "Mana Flow",
        "type": "[STAT]",
        "description": "+1% Mana Regen / rank. Rank 5: +5%."
      },
      {
        "branch": "focus",
        "ring": 1,
        "slot": "S3",
        "name": "Conservation",
        "type": "[TRIGGER]",
        "description": "Every 6th successful Spell refunds 1/2/3/4/5 Mana."
      },
      {
        "branch": "focus",
        "ring": 1,
        "slot": "S4",
        "name": "Emergency Flow",
        "type": "[CONDITION]",
        "description": "Below 25% Mana, Mana Regen is increased by 5/10/15/20/25%."
      },
      {
        "branch": "focus",
        "ring": 1,
        "slot": "S5",
        "name": "Full Reservoir",
        "type": "[CONDITION]",
        "description": "Above 90% Mana, the next Spell you cast after at least 3 s without casting costs 2/4/6/8/10% less Mana."
      },
      {
        "branch": "focus",
        "ring": 1,
        "slot": "S6",
        "name": "Overflow Spark",
        "type": "[CONVERSION]",
        "description": "When Mana restoration would overflow Max Mana, 10/20/30/40/50% of the excess becomes Barrier, capped at 2% Max Health per event."
      },
      {
        "branch": "focus",
        "ring": 1,
        "slot": "S7",
        "name": "Focused Recovery",
        "type": "[TRIGGER]",
        "description": "A kill restores 2/4/6/8/10 Mana."
      },
      {
        "branch": "focus",
        "ring": 1,
        "slot": "S8",
        "name": "Quiet Mind",
        "type": "[CONDITION]",
        "description": "While no Spell is currently casting, gain +2/4/6/8/10% Mana Regen."
      },
      {
        "branch": "focus",
        "ring": 1,
        "slot": "M",
        "name": "Deep Reservoir",
        "type": "**MAJOR**",
        "description": "The first Spell each encounter costs 0 Mana. It still starts its normal cooldown."
      }
    ],
    "2": [
      {
        "branch": "focus",
        "ring": 2,
        "slot": "S1",
        "name": "Arcane Economy",
        "type": "[STAT]",
        "description": "-0.35% Spell Mana Cost / rank. Rank 5: -1.75%."
      },
      {
        "branch": "focus",
        "ring": 2,
        "slot": "S2",
        "name": "Focused Capacity",
        "type": "[STAT]",
        "description": "+1 Max Focus / rank. Rank 5: +5 Focus."
      },
      {
        "branch": "focus",
        "ring": 2,
        "slot": "S3",
        "name": "Echo Harmony",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "If the active deck contains at least one AUTO Spell, every third AUTO cast grants +1/2/3/4/5 Mana."
      },
      {
        "branch": "focus",
        "ring": 2,
        "slot": "S4",
        "name": "Manual Reservoir",
        "type": "[MANUAL][NEW HOOK]",
        "description": "A manually initiated Spell restores 1/2/3/4/5 Mana if the previous successful Spell was AUTO."
      },
      {
        "branch": "focus",
        "ring": 2,
        "slot": "S5",
        "name": "Alternating Mind",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "Alternating AUTO â†’ MANUAL or MANUAL â†’ AUTO grants the second Spell +1/2/3/4/5% Action Speed."
      },
      {
        "branch": "focus",
        "ring": 2,
        "slot": "S6",
        "name": "Efficient Queue",
        "type": "[MANUAL][NEW HOOK]",
        "description": "A Spell that begins from the manual queue costs 1/2/3/4/5% less Mana."
      },
      {
        "branch": "focus",
        "ring": 2,
        "slot": "S7",
        "name": "Open Focus",
        "type": "[CONDITION][NEW HOOK]",
        "description": "For every 10 Free Focus, gain +1/2/3/4/5% Mana Regen. Re-evaluates dynamically."
      },
      {
        "branch": "focus",
        "ring": 2,
        "slot": "S8",
        "name": "Echo Discipline",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "If at least half of your active deck is MANUAL, AUTO Spell Focus costs are reduced by 1/2/3/4/5%."
      },
      {
        "branch": "focus",
        "ring": 2,
        "slot": "M",
        "name": "Dual Mind",
        "type": "**MAJOR**",
        "description": "AUTO casts empower MANUAL casts and MANUAL casts empower AUTO casts: after either type resolves, the next cast of the opposite type within 5 s costs 15% less Mana and gains 10% Action Speed."
      }
    ],
    "3": [
      {
        "branch": "focus",
        "ring": 3,
        "slot": "S1",
        "name": "Mana Reservoir II",
        "type": "[STAT]",
        "description": "+1% Max Mana / rank. Rank 5: +5%."
      },
      {
        "branch": "focus",
        "ring": 3,
        "slot": "S2",
        "name": "Echo Efficiency",
        "type": "[STAT][LOADOUT]",
        "description": "Combat Spell AUTO Focus cost reduced by 1% / rank. Rank 5: -5%."
      },
      {
        "branch": "focus",
        "ring": 3,
        "slot": "S3",
        "name": "Reserved Power",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "For every 10 Reserved Focus, gain +0.1/0.2/0.3/0.4/0.5% Spell Power."
      },
      {
        "branch": "focus",
        "ring": 3,
        "slot": "S4",
        "name": "Free Mind",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "For every 10 Free Focus, gain +0.1/0.2/0.3/0.4/0.5 Mana Regen/sec."
      },
      {
        "branch": "focus",
        "ring": 3,
        "slot": "S5",
        "name": "Resonant Cast",
        "type": "[CYCLE]",
        "description": "Every 8th successful Spell restores 1/2/3/4/5% Max Mana."
      },
      {
        "branch": "focus",
        "ring": 3,
        "slot": "S6",
        "name": "Echo Battery",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "Each AUTO cast grants 1 Echo Charge, max 3. A MANUAL cast consumes all charges for -1/2/3/4/5% Mana Cost per charge."
      },
      {
        "branch": "focus",
        "ring": 3,
        "slot": "S7",
        "name": "Manual Charge",
        "type": "[MANUAL][NEW HOOK]",
        "description": "Each MANUAL cast grants 1 Manual Charge, max 3. The next AUTO cast consumes all charges for +1/2/3/4/5% Action Speed per charge."
      },
      {
        "branch": "focus",
        "ring": 3,
        "slot": "S8",
        "name": "Prepared Slot",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "The first time each unique loadout slot is successfully cast per encounter, it costs 1/2/3/4/5% less Mana."
      },
      {
        "branch": "focus",
        "ring": 3,
        "slot": "M",
        "name": "Resonance",
        "type": "**MAJOR**",
        "description": "Every 10th successful Spell refunds 100% of its final Mana cost after completion. It still requires enough Mana to begin/complete normally."
      }
    ],
    "4": [
      {
        "branch": "focus",
        "ring": 4,
        "slot": "S1",
        "name": "Mana Flow II",
        "type": "[STAT]",
        "description": "+2.5% Mana Regen / rank. Rank 5: +12.5%."
      },
      {
        "branch": "focus",
        "ring": 4,
        "slot": "S2",
        "name": "Arcane Economy II",
        "type": "[STAT]",
        "description": "-0.65% Spell Mana Cost / rank. Rank 5: -3.25%."
      },
      {
        "branch": "focus",
        "ring": 4,
        "slot": "S3",
        "name": "Overflow Ward",
        "type": "[CONVERSION]",
        "description": "50/60/70/80/100% of excess Mana restoration becomes Barrier, capped at 3% Max Health per second."
      },
      {
        "branch": "focus",
        "ring": 4,
        "slot": "S4",
        "name": "Mana to Tempo",
        "type": "[CONVERSION]",
        "description": "When Mana restoration overflows, your current/next Spell gains +1/2/3/4/5% Action Speed. Cooldown 2 s."
      },
      {
        "branch": "focus",
        "ring": 4,
        "slot": "S5",
        "name": "Stable Reserve",
        "type": "[CONDITION]",
        "description": "Above 80% Mana, self-targeted Spells cost 1/2/3/4/5% less Mana."
      },
      {
        "branch": "focus",
        "ring": 4,
        "slot": "S6",
        "name": "Empty Mind",
        "type": "[CONDITION]",
        "description": "Below 20% Mana, damaging Spells gain +1/2/3/4/5% Action Speed."
      },
      {
        "branch": "focus",
        "ring": 4,
        "slot": "S7",
        "name": "Emergency Conversion",
        "type": "[TRIGGER]",
        "description": "The first time each encounter Mana falls below 10%, immediately restore 2/4/6/8/10% Max Mana."
      },
      {
        "branch": "focus",
        "ring": 4,
        "slot": "S8",
        "name": "Focus Release",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "If fewer than 25% of your Max Focus is Reserved, your next MANUAL Spell after a kill costs 2/4/6/8/10% less Mana."
      },
      {
        "branch": "focus",
        "ring": 4,
        "slot": "M",
        "name": "Transcendence",
        "type": "**MAJOR**",
        "description": "Mana overflow can never be wasted: excess Mana restoration becomes Barrier at 100% value until the Barrier reaches 10% Max Health; further overflow reduces the cooldown of your longest-cooldown Spell by 100 ms per 1% Max Mana overflowed."
      }
    ],
    "5": [
      {
        "branch": "focus",
        "ring": 5,
        "slot": "S1",
        "name": "Focused Capacity II",
        "type": "[STAT]",
        "description": "+1 Max Focus / rank. Rank 5: +5 Focus."
      },
      {
        "branch": "focus",
        "ring": 5,
        "slot": "S2",
        "name": "Echo Efficiency II",
        "type": "[STAT][LOADOUT]",
        "description": "Combat Spell AUTO Focus cost reduced by 1.25% / rank. Rank 5: -6.25%."
      },
      {
        "branch": "focus",
        "ring": 5,
        "slot": "S3",
        "name": "Balanced Mind",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "If the deck contains at least 2 AUTO and 2 MANUAL Spells, gain +1/2/3/4/5% Mana Regen and +0.5/1/1.5/2/2.5% Action Speed."
      },
      {
        "branch": "focus",
        "ring": 5,
        "slot": "S4",
        "name": "Echo Battery II",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "AUTO casts build charges, max 5. A MANUAL cast consumes them to gain +1/2/3/4/5% Damage or Healing per charge, based on the Spell's effect."
      },
      {
        "branch": "focus",
        "ring": 5,
        "slot": "S5",
        "name": "Manual Battery",
        "type": "[MANUAL][NEW HOOK]",
        "description": "MANUAL casts build charges, max 5. An AUTO cast consumes them to refund 1/2/3/4/5 Mana per charge."
      },
      {
        "branch": "focus",
        "ring": 5,
        "slot": "S6",
        "name": "Convergent Queue",
        "type": "[MANUAL][NEW HOOK]",
        "description": "When a queued MANUAL Spell begins, reduce the cooldown of the last AUTO Spell cast by 0.1/0.2/0.3/0.4/0.5 s."
      },
      {
        "branch": "focus",
        "ring": 5,
        "slot": "S7",
        "name": "Reserved Conversion",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "For every 20 Reserved Focus, the first AUTO Spell each encounter restores 1/2/3/4/5 Mana."
      },
      {
        "branch": "focus",
        "ring": 5,
        "slot": "S8",
        "name": "Free Focus Surge",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "For every 20 Free Focus, the first MANUAL Spell each encounter gains +1/2/3/4/5% Action Speed."
      },
      {
        "branch": "focus",
        "ring": 5,
        "slot": "M",
        "name": "Convergence",
        "type": "**MAJOR**",
        "description": "When you alternate between AUTO and MANUAL for 4 successful casts without breaking the pattern, the fourth cast costs 0 Mana and gains 20% Action Speed. Pattern then resets."
      }
    ],
    "6": [
      {
        "branch": "focus",
        "ring": 6,
        "slot": "S1",
        "name": "Mana Reservoir III",
        "type": "[STAT]",
        "description": "+1.75% Max Mana / rank. Rank 5: +8.75%."
      },
      {
        "branch": "focus",
        "ring": 6,
        "slot": "S2",
        "name": "Mana Flow III",
        "type": "[STAT]",
        "description": "+4% Mana Regen / rank. Rank 5: +20%."
      },
      {
        "branch": "focus",
        "ring": 6,
        "slot": "S3",
        "name": "Overchannel",
        "type": "[CONDITION]",
        "description": "Above 80% Mana, Spells costing at least 10% Max Mana gain +2/4/6/8/10% Damage/Healing/Barrier Power."
      },
      {
        "branch": "focus",
        "ring": 6,
        "slot": "S4",
        "name": "Deep Draw",
        "type": "[CONDITION]",
        "description": "Below 20% Mana, Spell Mana Cost is reduced by 1/2/3/4/5%."
      },
      {
        "branch": "focus",
        "ring": 6,
        "slot": "S5",
        "name": "Arcane Return",
        "type": "[TRIGGER]",
        "description": "A successful Spell restores 1/2/3/4/5 Mana. Internal cooldown 1 s."
      },
      {
        "branch": "focus",
        "ring": 6,
        "slot": "S6",
        "name": "Reservoir Break",
        "type": "[TRIGGER]",
        "description": "When a cast drops Mana from above 80% to below 50%, reduce that Spell's cooldown by 0.2/0.4/0.6/0.8/1.0 s."
      },
      {
        "branch": "focus",
        "ring": 6,
        "slot": "S7",
        "name": "Overchannel Cycle",
        "type": "[CYCLE]",
        "description": "Spend at least 30% Max Mana across successful casts within 6 s to gain +2/4/6/8/10% Action Speed for the next Spell."
      },
      {
        "branch": "focus",
        "ring": 6,
        "slot": "S8",
        "name": "Emergency Free Cast",
        "type": "[TRIGGER]",
        "description": "The first time each encounter Mana falls below 5%, your next Spell within 5 s refunds 20/40/60/80/100% of its Mana cost after completion."
      },
      {
        "branch": "focus",
        "ring": 6,
        "slot": "M",
        "name": "Overchannel",
        "type": "**MAJOR**",
        "description": "For 5 s after spending at least 25% Max Mana within 4 s, Spells gain +15% Action Speed and +10% effectiveness (Damage/Healing/Barrier), but Mana Regen is disabled during the effect."
      }
    ],
    "7": [
      {
        "branch": "focus",
        "ring": 7,
        "slot": "S1",
        "name": "Astral Focus",
        "type": "[STAT]",
        "description": "+1 Max Focus / rank. Rank 5: +5 Focus."
      },
      {
        "branch": "focus",
        "ring": 7,
        "slot": "S2",
        "name": "Astral Economy",
        "type": "[STAT]",
        "description": "-1.25% Spell Mana Cost / rank. Rank 5: -6.25%."
      },
      {
        "branch": "focus",
        "ring": 7,
        "slot": "S3",
        "name": "Astral Reserved Power",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "For every 10 Reserved Focus, gain +0.2/0.4/0.6/0.8/1.0% Spell Power."
      },
      {
        "branch": "focus",
        "ring": 7,
        "slot": "S4",
        "name": "Astral Open Mind",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "For every 10 Free Focus, gain +0.2/0.4/0.6/0.8/1.0 Mana Regen/sec."
      },
      {
        "branch": "focus",
        "ring": 7,
        "slot": "S5",
        "name": "Astral Rotation",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "Casting 3 different deck slots in succession refunds 1/2/3/4/5% Max Mana on the third cast."
      },
      {
        "branch": "focus",
        "ring": 7,
        "slot": "S6",
        "name": "Echo Cascade",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "After 3 consecutive AUTO casts, the next MANUAL cast gains +2/4/6/8/10% Action Speed and refunds 5% of its Mana cost."
      },
      {
        "branch": "focus",
        "ring": 7,
        "slot": "S7",
        "name": "Manual Cascade",
        "type": "[MANUAL][NEW HOOK]",
        "description": "After 3 consecutive MANUAL casts, the next AUTO cast gains +2/4/6/8/10% effectiveness."
      },
      {
        "branch": "focus",
        "ring": 7,
        "slot": "S8",
        "name": "Astral Recovery",
        "type": "[TRIGGER]",
        "description": "A kill restores 1/2/3/4/5% Max Mana and reduces the cooldown of the next Spell you cast by 0.2/0.4/0.6/0.8/1.0 s."
      },
      {
        "branch": "focus",
        "ring": 7,
        "slot": "M",
        "name": "Astral Mind",
        "type": "**MAJOR**",
        "description": "Reserved and Free Focus both matter: every 10 Reserved Focus grants +0.5% Spell Power; every 10 Free Focus grants +0.5% Action Speed. Each side is capped at +10%."
      }
    ],
    "8": [
      {
        "branch": "focus",
        "ring": 8,
        "slot": "S1",
        "name": "Singularity Flow",
        "type": "[STAT]",
        "description": "+6% Mana Regen / rank. Rank 5: +30%."
      },
      {
        "branch": "focus",
        "ring": 8,
        "slot": "S2",
        "name": "Singularity Focus",
        "type": "[STAT]",
        "description": "+1 Max Focus / rank. Rank 5: +5 Focus."
      },
      {
        "branch": "focus",
        "ring": 8,
        "slot": "S3",
        "name": "Zero Point",
        "type": "[CYCLE]",
        "description": "Every 8th successful Spell costs 20/40/60/80/100% less Mana."
      },
      {
        "branch": "focus",
        "ring": 8,
        "slot": "S4",
        "name": "Event Horizon",
        "type": "[CONVERSION]",
        "description": "When Mana reaches 100%, store 1 Overflow Charge. Max 1/2/3/4/5 charges. A Spell cast below 25% Mana consumes one charge to restore 5% Max Mana."
      },
      {
        "branch": "focus",
        "ring": 8,
        "slot": "S5",
        "name": "Singularity Echo",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "An AUTO Spell cast at full Mana grants your next MANUAL Spell +3/6/9/12/15% effectiveness."
      },
      {
        "branch": "focus",
        "ring": 8,
        "slot": "S6",
        "name": "Singularity Manual",
        "type": "[MANUAL][NEW HOOK]",
        "description": "A MANUAL Spell cast below 25% Mana causes the next AUTO Spell to refund 5/10/15/20/25% of its Mana cost."
      },
      {
        "branch": "focus",
        "ring": 8,
        "slot": "S7",
        "name": "Focus Collapse",
        "type": "[LOADOUT][NEW HOOK]",
        "description": "When Reserved Focus exceeds 75% Max Focus, AUTO Spells gain +1/2/3/4/5% Action Speed. When Reserved Focus is below 25%, MANUAL Spells gain the same bonus."
      },
      {
        "branch": "focus",
        "ring": 8,
        "slot": "S8",
        "name": "Perfect Conservation",
        "type": "[TRIGGER]",
        "description": "If a Spell ends with exactly the same Mana percentage band you started in (0â€“25 / 25â€“50 / 50â€“75 / 75â€“100), reduce its cooldown by 0.2/0.4/0.6/0.8/1.0 s."
      },
      {
        "branch": "focus",
        "ring": 8,
        "slot": "M",
        "name": "Arcane Singularity",
        "type": "**MAJOR**",
        "description": "Once per encounter, when Mana would fall below 10%, set Mana to 50% Max Mana instead and enter Singularity for 5 s: Spell Mana costs are halved, but Mana Regen is disabled. Cannot trigger again that encounter."
      }
    ]
  },
  "control": {
    "1": [
      {
        "branch": "control",
        "ring": 1,
        "slot": "S1",
        "name": "Cooldown Control",
        "type": "[STAT]",
        "description": "+0.50% Cooldown Recovery / rank. Rank 5: +2.50%."
      },
      {
        "branch": "control",
        "ring": 1,
        "slot": "S2",
        "name": "Casting Rhythm",
        "type": "[STAT]",
        "description": "+0.25% Action Speed / rank. Rank 5: +1.25%."
      },
      {
        "branch": "control",
        "ring": 1,
        "slot": "S3",
        "name": "Delayed Fate",
        "type": "[TRIGGER]",
        "description": "Applying a control-tagged Status delays the enemy's current action by 20/40/60/80/100 ms. Internal cooldown 1 s."
      },
      {
        "branch": "control",
        "ring": 1,
        "slot": "S4",
        "name": "Opening Control",
        "type": "[TRIGGER]",
        "description": "The first control-tagged Status applied each encounter lasts 2/4/6/8/10% longer."
      },
      {
        "branch": "control",
        "ring": 1,
        "slot": "S5",
        "name": "Controlled Strike",
        "type": "[CONDITION]",
        "description": "Against enemies with a control-tagged Status, damaging Spells gain +1/2/3/4/5% Damage."
      },
      {
        "branch": "control",
        "ring": 1,
        "slot": "S6",
        "name": "Recovery Window",
        "type": "[TRIGGER]",
        "description": "When a control-tagged Status expires naturally, reduce your longest remaining Spell cooldown by 0.1/0.2/0.3/0.4/0.5 s."
      },
      {
        "branch": "control",
        "ring": 1,
        "slot": "S7",
        "name": "Manual Timing",
        "type": "[MANUAL][NEW HOOK]",
        "description": "A MANUAL Spell begun while the enemy has less than 25% of its current action time remaining gains +2/4/6/8/10% Action Speed."
      },
      {
        "branch": "control",
        "ring": 1,
        "slot": "S8",
        "name": "Tempo Theft",
        "type": "[TRIGGER]",
        "description": "If the enemy begins an action while controlled, restore 1/2/3/4/5 Mana."
      },
      {
        "branch": "control",
        "ring": 1,
        "slot": "M",
        "name": "Temporal Flow",
        "type": "**MAJOR**",
        "description": "The first time each encounter you apply a control-tagged Status, delay the enemy current action by 500 ms and gain +10% Action Speed for your next Spell."
      }
    ],
    "2": [
      {
        "branch": "control",
        "ring": 2,
        "slot": "S1",
        "name": "Status Mastery",
        "type": "[STAT]",
        "description": "+1.5% Status Duration dealt / rank. Rank 5: +7.5%."
      },
      {
        "branch": "control",
        "ring": 2,
        "slot": "S2",
        "name": "Suppression",
        "type": "[STAT]",
        "description": "Enemies with any negative Status deal 0.5/1/1.5/2/2.5% less Damage."
      },
      {
        "branch": "control",
        "ring": 2,
        "slot": "S3",
        "name": "Layered Control",
        "type": "[TRIGGER]",
        "description": "Applying a different control-tagged Status to an already controlled enemy extends the older control Status by 1/2/3/4/5% of its original duration."
      },
      {
        "branch": "control",
        "ring": 2,
        "slot": "S4",
        "name": "Controlled Flow",
        "type": "[TRIGGER]",
        "description": "Applying a control-tagged Status restores 1/2/3/4/5 Mana. Internal cooldown 2 s."
      },
      {
        "branch": "control",
        "ring": 2,
        "slot": "S5",
        "name": "Debuff Pressure",
        "type": "[CONDITION]",
        "description": "Against enemies with 2+ negative Statuses, gain +1/2/3/4/5% Damage Dealt."
      },
      {
        "branch": "control",
        "ring": 2,
        "slot": "S6",
        "name": "Slow Burn",
        "type": "[CONDITION]",
        "description": "Your DoTs tick for +1/2/3/4/5% Damage while the target has a control-tagged Status."
      },
      {
        "branch": "control",
        "ring": 2,
        "slot": "S7",
        "name": "Suppression Window",
        "type": "[TRIGGER]",
        "description": "When an enemy action is delayed by any of your effects, your next Spell within 2 s gains +1/2/3/4/5% Action Speed."
      },
      {
        "branch": "control",
        "ring": 2,
        "slot": "S8",
        "name": "Control Refresh",
        "type": "[TRIGGER]",
        "description": "If you apply the same control Status while it still has less than 25% duration remaining, increase the refreshed duration by 2/4/6/8/10%."
      },
      {
        "branch": "control",
        "ring": 2,
        "slot": "M",
        "name": "Perfect Timing",
        "type": "**MAJOR**",
        "description": "Whenever you apply a control-tagged Status during the final 25% of the enemy's current action, delay that action by an additional 750 ms. Cooldown 5 s."
      }
    ],
    "3": [
      {
        "branch": "control",
        "ring": 3,
        "slot": "S1",
        "name": "Cooldown Control II",
        "type": "[STAT]",
        "description": "+1% Cooldown Recovery / rank. Rank 5: +5%."
      },
      {
        "branch": "control",
        "ring": 3,
        "slot": "S2",
        "name": "Deep Status",
        "type": "[STAT]",
        "description": "+2% Status Duration dealt / rank. Rank 5: +10%."
      },
      {
        "branch": "control",
        "ring": 3,
        "slot": "S3",
        "name": "Chain Control",
        "type": "[TRIGGER]",
        "description": "Applying a third distinct negative Status to the same enemy causes all your current negative Statuses on that enemy to gain +1/2/3/4/5% remaining duration."
      },
      {
        "branch": "control",
        "ring": 3,
        "slot": "S4",
        "name": "Dominating Weakness",
        "type": "[CONDITION]",
        "description": "Enemies with 3+ negative Statuses take +1/2/3/4/5% Damage from you."
      },
      {
        "branch": "control",
        "ring": 3,
        "slot": "S5",
        "name": "Suppressed Enemy",
        "type": "[CONDITION]",
        "description": "Enemies with 3+ negative Statuses deal 1/2/3/4/5% less Damage."
      },
      {
        "branch": "control",
        "ring": 3,
        "slot": "S6",
        "name": "Status Echo",
        "type": "[TRIGGER]",
        "description": "When one of your control Statuses expires naturally, your next control Status within 4 s gains +2/4/6/8/10% duration."
      },
      {
        "branch": "control",
        "ring": 3,
        "slot": "S7",
        "name": "Queued Dominion",
        "type": "[MANUAL][NEW HOOK]",
        "description": "A Spell that begins from the manual queue gains +1/2/3/4/5% Status Duration if it applies a negative Status."
      },
      {
        "branch": "control",
        "ring": 3,
        "slot": "S8",
        "name": "Timeline Break",
        "type": "[CYCLE]",
        "description": "Every 4th control-tagged Status you apply delays the enemy's current action by an extra 100/200/300/400/500 ms."
      },
      {
        "branch": "control",
        "ring": 3,
        "slot": "M",
        "name": "Dominion",
        "type": "**MAJOR**",
        "description": "While an enemy has 3+ negative Statuses, its current action timer progresses 15% slower and it takes +8% Damage from you."
      }
    ],
    "4": [
      {
        "branch": "control",
        "ring": 4,
        "slot": "S1",
        "name": "Apex Timing",
        "type": "[STAT]",
        "description": "+0.60% Action Speed / rank. Rank 5: +3%."
      },
      {
        "branch": "control",
        "ring": 4,
        "slot": "S2",
        "name": "Apex Status",
        "type": "[STAT]",
        "description": "+2.5% Status Duration dealt / rank. Rank 5: +12.5%."
      },
      {
        "branch": "control",
        "ring": 4,
        "slot": "S3",
        "name": "Aftershock",
        "type": "[TRIGGER][NEW HOOK]",
        "description": "When Freeze expires from an enemy, apply Chill for 1/2/3/4/5 s. If Chill is already present, refresh it instead."
      },
      {
        "branch": "control",
        "ring": 4,
        "slot": "S4",
        "name": "Tremor Lock",
        "type": "[TRIGGER]",
        "description": "Applying an Earth control Status to an already controlled enemy delays its current action by 50/100/150/200/250 ms. Cooldown 2 s."
      },
      {
        "branch": "control",
        "ring": 4,
        "slot": "S5",
        "name": "Cold Precision",
        "type": "[TRIGGER]",
        "description": "Applying a Water control Status makes your next Spell within 3 s gain +1/2/3/4/5% Action Speed."
      },
      {
        "branch": "control",
        "ring": 4,
        "slot": "S6",
        "name": "Control Conversion",
        "type": "[CONVERSION]",
        "description": "When a control Status is cleansed/removed before expiry, restore 1/2/3/4/5 Mana and reduce your longest cooldown by 0.1/0.2/0.3/0.4/0.5 s."
      },
      {
        "branch": "control",
        "ring": 4,
        "slot": "S7",
        "name": "Absolute Pressure",
        "type": "[CONDITION]",
        "description": "Against enemies with 3+ negative Statuses, gain +1.5/3/4.5/6/7.5% Damage Dealt."
      },
      {
        "branch": "control",
        "ring": 4,
        "slot": "S8",
        "name": "Action Denial",
        "type": "[TRIGGER]",
        "description": "If a control Status causes the enemy action timer to be delayed while under 20% remaining, add another 25/50/75/100/125 ms. Cooldown 2 s."
      },
      {
        "branch": "control",
        "ring": 4,
        "slot": "M",
        "name": "Arcane Lock",
        "type": "**MAJOR**",
        "description": "The first time each encounter an enemy reaches the final 10% of an action while controlled, freeze that action timer for 1.5 s. This is timeline stasis, not a Stun Status."
      }
    ],
    "5": [
      {
        "branch": "control",
        "ring": 5,
        "slot": "S1",
        "name": "Interference Recovery",
        "type": "[STAT]",
        "description": "+1.5% Cooldown Recovery / rank. Rank 5: +7.5%."
      },
      {
        "branch": "control",
        "ring": 5,
        "slot": "S2",
        "name": "Interference Tempo",
        "type": "[STAT]",
        "description": "+0.75% Action Speed / rank. Rank 5: +3.75%."
      },
      {
        "branch": "control",
        "ring": 5,
        "slot": "S3",
        "name": "Spell Interference",
        "type": "[TRIGGER]",
        "description": "When a Spell applies a negative Status, reduce that Spell's own cooldown by 50/100/150/200/250 ms."
      },
      {
        "branch": "control",
        "ring": 5,
        "slot": "S4",
        "name": "Status Fracture",
        "type": "[TRIGGER]",
        "description": "Applying a negative Status to an enemy that already has 3+ negative Statuses delays its action by 50/100/150/200/250 ms. Cooldown 1 s."
      },
      {
        "branch": "control",
        "ring": 5,
        "slot": "S5",
        "name": "Interference Pulse",
        "type": "[CYCLE]",
        "description": "Every 5th successful Spell cast against a debuffed enemy reduces all remaining cooldowns by 0.1/0.2/0.3/0.4/0.5 s."
      },
      {
        "branch": "control",
        "ring": 5,
        "slot": "S6",
        "name": "Debuff Theft",
        "type": "[TRIGGER]",
        "description": "When an enemy loses one of your negative Statuses, restore 1/2/3/4/5 Mana. Internal cooldown 1 s."
      },
      {
        "branch": "control",
        "ring": 5,
        "slot": "S7",
        "name": "Manual Disruption",
        "type": "[MANUAL][NEW HOOK]",
        "description": "A MANUAL Spell begun while the enemy is casting/acting gains +1/2/3/4/5% effectiveness if it applies a debuff or control Status."
      },
      {
        "branch": "control",
        "ring": 5,
        "slot": "S8",
        "name": "Interference Chain",
        "type": "[TRIGGER]",
        "description": "After delaying an enemy action, your next different control Status within 4 s gains +2/4/6/8/10% duration."
      },
      {
        "branch": "control",
        "ring": 5,
        "slot": "M",
        "name": "Temporal Fracture",
        "type": "**MAJOR**",
        "description": "Every 4th control-tagged Status applied creates a Temporal Fracture: delay the enemy action by 750 ms and reduce all your remaining Spell cooldowns by 500 ms."
      }
    ],
    "6": [
      {
        "branch": "control",
        "ring": 6,
        "slot": "S1",
        "name": "Temporal Recovery",
        "type": "[STAT]",
        "description": "+1.75% Cooldown Recovery / rank. Rank 5: +8.75%."
      },
      {
        "branch": "control",
        "ring": 6,
        "slot": "S2",
        "name": "Temporal Speed",
        "type": "[STAT]",
        "description": "+1% Action Speed / rank. Rank 5: +5%."
      },
      {
        "branch": "control",
        "ring": 6,
        "slot": "S3",
        "name": "Prepared Cast",
        "type": "[MANUAL][NEW HOOK]",
        "description": "The first MANUAL Spell each encounter gains +2/4/6/8/10% Action Speed."
      },
      {
        "branch": "control",
        "ring": 6,
        "slot": "S4",
        "name": "Queued Precision",
        "type": "[MANUAL][NEW HOOK]",
        "description": "A Spell that begins from the manual queue gains +1/2/3/4/5% Damage/Healing/Barrier effectiveness."
      },
      {
        "branch": "control",
        "ring": 6,
        "slot": "S5",
        "name": "Stolen Time",
        "type": "[TRIGGER][NEW HOOK]",
        "description": "When a control Status expires naturally, advance your current Spell Cast progress by 1/2/3/4/5% of its base Cast Time."
      },
      {
        "branch": "control",
        "ring": 6,
        "slot": "S6",
        "name": "Temporal Refund",
        "type": "[TRIGGER]",
        "description": "If an enemy action is delayed by at least 300 ms from one of your effects, restore 1/2/3/4/5 Mana. Cooldown 2 s."
      },
      {
        "branch": "control",
        "ring": 6,
        "slot": "S7",
        "name": "Precision Window",
        "type": "[MANUAL][NEW HOOK]",
        "description": "If a queued Spell begins within 1 s after an enemy action resolves, it gains +2/4/6/8/10% Action Speed."
      },
      {
        "branch": "control",
        "ring": 6,
        "slot": "S8",
        "name": "Chrono Cycle",
        "type": "[CYCLE]",
        "description": "Every 6th successful Spell reduces your longest remaining cooldown by 0.2/0.4/0.6/0.8/1.0 s."
      },
      {
        "branch": "control",
        "ring": 6,
        "slot": "M",
        "name": "Time Compression",
        "type": "**MAJOR**",
        "description": "After any MANUAL Spell successfully resolves, the next AUTO Spell within 4 s gains +20% Action Speed. After any AUTO Spell resolves, the next MANUAL Spell within 4 s gains +20% Action Speed."
      }
    ],
    "7": [
      {
        "branch": "control",
        "ring": 7,
        "slot": "S1",
        "name": "Lockdown Duration",
        "type": "[STAT]",
        "description": "+5% Status Duration dealt / rank. Rank 5: +25%."
      },
      {
        "branch": "control",
        "ring": 7,
        "slot": "S2",
        "name": "Lockdown Tempo",
        "type": "[STAT]",
        "description": "+1.25% Action Speed / rank. Rank 5: +6.25%."
      },
      {
        "branch": "control",
        "ring": 7,
        "slot": "S3",
        "name": "Lockdown Delay",
        "type": "[TRIGGER]",
        "description": "Applying a control-tagged Status delays the enemy current action by 75/150/225/300/375 ms. Cooldown 1 s."
      },
      {
        "branch": "control",
        "ring": 7,
        "slot": "S4",
        "name": "Control Cascade",
        "type": "[CYCLE]",
        "description": "Applying 3 different control Statuses within 8 s causes the third to extend all active control Statuses by 2/4/6/8/10% remaining duration."
      },
      {
        "branch": "control",
        "ring": 7,
        "slot": "S5",
        "name": "Tactical Queue",
        "type": "[MANUAL][NEW HOOK]",
        "description": "When a queued MANUAL Spell begins, reduce all other remaining Spell cooldowns by 50/100/150/200/250 ms."
      },
      {
        "branch": "control",
        "ring": 7,
        "slot": "S6",
        "name": "Controlled Target",
        "type": "[CONDITION]",
        "description": "Enemies with a control-tagged Status take +2.5/5/7.5/10/12.5% Damage from your Spells."
      },
      {
        "branch": "control",
        "ring": 7,
        "slot": "S7",
        "name": "Controlled Suppression",
        "type": "[CONDITION]",
        "description": "Enemies with a control-tagged Status deal 1.25/2.5/3.75/5/6.25% less Damage."
      },
      {
        "branch": "control",
        "ring": 7,
        "slot": "S8",
        "name": "No Escape",
        "type": "[TRIGGER]",
        "description": "If a control Status expires while the enemy is below 25% Health, delay its current action by 100/200/300/400/500 ms."
      },
      {
        "branch": "control",
        "ring": 7,
        "slot": "M",
        "name": "Total Lockdown",
        "type": "**MAJOR**",
        "description": "While an enemy has at least two different control-tagged Statuses, its action timer progresses 20% slower, it deals 10% less Damage, and it takes 10% more Damage from you."
      }
    ],
    "8": [
      {
        "branch": "control",
        "ring": 8,
        "slot": "S1",
        "name": "Stasis Recovery",
        "type": "[STAT]",
        "description": "+2.5% Cooldown Recovery / rank. Rank 5: +12.5%."
      },
      {
        "branch": "control",
        "ring": 8,
        "slot": "S2",
        "name": "Stasis Tempo",
        "type": "[STAT]",
        "description": "+1.5% Action Speed / rank. Rank 5: +7.5%."
      },
      {
        "branch": "control",
        "ring": 8,
        "slot": "S3",
        "name": "Absolute Delay",
        "type": "[TRIGGER]",
        "description": "Applying a control-tagged Status delays the enemy current action by 100/200/300/400/500 ms. Cooldown 1 s."
      },
      {
        "branch": "control",
        "ring": 8,
        "slot": "S4",
        "name": "Status Recursion",
        "type": "[TRIGGER]",
        "description": "When a control Status expires naturally, your next different control Status within 5 s gains +3/6/9/12/15% duration and delays the enemy by 100 ms."
      },
      {
        "branch": "control",
        "ring": 8,
        "slot": "S5",
        "name": "Timeline Theft",
        "type": "[CONVERSION][NEW HOOK]",
        "description": "For every 1 second of enemy action time delayed by your effects, gain 1 stack of Stolen Time, max 5. Your next MANUAL Spell consumes stacks for +2/4/6/8/10% Action Speed per stack."
      },
      {
        "branch": "control",
        "ring": 8,
        "slot": "S6",
        "name": "Absolute Queue",
        "type": "[MANUAL][NEW HOOK]",
        "description": "A queued Spell that begins during the final 20% of an enemy action gains +3/6/9/12/15% effectiveness."
      },
      {
        "branch": "control",
        "ring": 8,
        "slot": "S7",
        "name": "Stasis Collapse",
        "type": "[CYCLE]",
        "description": "Every 5th control-tagged Status applied pauses enemy action progress for 0.25/0.5/0.75/1.0/1.25 s. This is not a Stun and does not apply a Status."
      },
      {
        "branch": "control",
        "ring": 8,
        "slot": "S8",
        "name": "Endless Pressure",
        "type": "[CONDITION]",
        "description": "Against enemies with 4+ negative Statuses, gain +3/6/9/12/15% Damage Dealt."
      },
      {
        "branch": "control",
        "ring": 8,
        "slot": "M",
        "name": "Absolute Stasis",
        "type": "**MAJOR**",
        "description": "Once per encounter, after you have delayed a total of 3 seconds of enemy action time, stop enemy action progress for 3 seconds. During Stasis, your Spells gain +15% Action Speed. Stasis does not prevent Status ticking or cooldown recovery."
      }
    ]
  }
} as unknown as Record<ArcaneCoreBranchId, Record<ArcaneCoreRingIndex, ArcaneCoreV6CatalogEntry[]>>

export const getArcaneCoreV6CatalogEntry = (branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex, slot: number): ArcaneCoreV6CatalogEntry | undefined => {
  const entries = ARCANE_CORE_V6_CATALOG[branchId][ring]
  return entries[slot === 9 ? 8 : slot - 1]
}

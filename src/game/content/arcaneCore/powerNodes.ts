import { createRing, linearStat, major, minor, perk, rankedModifier, v7Mechanic } from './arcaneCoreNodeFactory'

const mechanic = (ring: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, slot: `S${5 | 6 | 7 | 8}` | 'M', name: string) => v7Mechanic('power', ring, slot, name)
const spellDamage = (perRank: number) => rankedModifier('spell-damage-percent', perRank)

const ring1 = createRing('power', 1, [
  minor('power-r1-arcane-force', 'Arcane Scaling', '+0.5% Spell Power per rank. Rank 5: +2.5%.', linearStat('spellPowerPct', 0.005)),
  minor('power-r1-forceful-strikes', 'Spell Impact', '+0.4% Spell Damage per rank. Rank 5: +2%.', spellDamage(0.004)),
  minor('power-r1-critical-insight', 'Critical Insight', '+0.3 percentage points Crit Chance per rank. Rank 5: +1.5 pp.', linearStat('critChance', 0.003)),
  minor('power-r1-critical-force', 'Critical Force', '+1.6% Crit Damage per rank. Rank 5: +8%.', linearStat('critDamage', 0.016)),
  perk('power-r1-spell-impact', 'Opportunist', 'The next damaging Spell after applying a negative Status gains a small damage bonus.', mechanic(1, 'S5', 'Opportunist')),
  perk('power-r1-battle-rhythm', 'Finisher', 'Damaging Spells deal a small bonus against enemies below 25% Health.', mechanic(1, 'S6', 'Finisher')),
  perk('power-r1-lingering-power', 'Opening Volley', 'The first damaging Spell of each encounter gains a small damage bonus.', mechanic(1, 'S7', 'Opening Volley')),
  perk('power-r1-arcane-pressure', 'Mana Edge', 'Above 80% Mana, damaging Spells gain a small damage bonus.', mechanic(1, 'S8', 'Mana Edge')),
  major('power-r1-overwhelming-force', 'Arcane Rhythm', 'Every 5th successful damaging Spell deals +10% Damage.', mechanic(1, 'M', 'Arcane Rhythm')),
])

const ring2 = createRing('power', 2, [
  minor('power-r2-opening-blast', 'Arcane Scaling II', '+0.6% Spell Power per rank. Rank 5: +3%.', linearStat('spellPowerPct', 0.006)),
  minor('power-r2-finisher', 'Direct Force', '+0.5% Spell Damage per rank. Rank 5: +2.5%.', spellDamage(0.005)),
  minor('power-r2-critical-feedback', 'Refined Precision', '+0.35 percentage points Crit Chance per rank. Rank 5: +1.75 pp.', linearStat('critChance', 0.0035)),
  minor('power-r2-critical-recovery', 'Refined Criticals', '+2% Crit Damage per rank. Rank 5: +10%.', linearStat('critDamage', 0.02)),
  perk('power-r2-spell-weaving', 'Critical Recovery', 'Direct Spell Crit restores a small amount of Mana. Internal cooldown applies.', mechanic(2, 'S5', 'Critical Recovery')),
  perk('power-r2-arcane-recoil', 'Marked Precision', 'Damaging Spells gain a small Crit Chance bonus against debuffed enemies.', mechanic(2, 'S6', 'Marked Precision')),
  perk('power-r2-exploit-weakness', 'Second Chance', 'After a damaging Spell fails to Crit, the next damaging Spell gains Crit Chance. It is not guaranteed.', mechanic(2, 'S7', 'Second Chance')),
  perk('power-r2-relentless-execution', 'Perfect Window', 'Spells against enemies above 90% Health gain a small Crit Damage bonus.', mechanic(2, 'S8', 'Perfect Window')),
  major('power-r2-perfect-precision', 'Perfect Precision', 'After two consecutive damaging Spells fail to Crit, the next gains +15 percentage points Crit Chance. It is not guaranteed to Crit.', mechanic(2, 'M', 'Perfect Precision')),
])

const ring3 = createRing('power', 3, [
  minor('power-r3-arcane-momentum', 'Assault Power', '+0.7% Spell Power per rank. Rank 5: +3.5%.', linearStat('spellPowerPct', 0.007)),
  minor('power-r3-critical-tempo', 'Arcane Force', '+0.6% Spell Damage per rank. Rank 5: +3%.', spellDamage(0.006)),
  minor('power-r3-battle-hunger', 'Assault Precision', '+0.4 percentage points Crit Chance per rank. Rank 5: +2 pp.', linearStat('critChance', 0.004)),
  minor('power-r3-shatter-weakness', 'Lingering Ruin', '+0.8% Damage over Time per rank. Rank 5: +4%.', linearStat('damageOverTimePct', 0.008)),
  perk('power-r3-spell-surge', 'Spell Sequence', 'Casting three different damaging Spells in succession empowers the third.', mechanic(3, 'S5', 'Spell Sequence')),
  perk('power-r3-lingering-execution', 'Arcane Momentum', 'Every 4th damaging Spell gains a moderate Damage bonus.', mechanic(3, 'S6', 'Arcane Momentum')),
  perk('power-r3-aggressive-casting', 'Rapid Escalation', 'Two damaging Spells resolving within 3 seconds empower the second.', mechanic(3, 'S7', 'Rapid Escalation')),
  perk('power-r3-brutal-rhythm', 'Debuff Assault', 'Against enemies with at least 2 negative Statuses, gain a moderate Damage bonus.', mechanic(3, 'S8', 'Debuff Assault')),
  major('power-r3-arcane-overload', 'Arcane Overload', 'Every 6th successful damaging Spell repeats 15% of its direct damage as a second Arcane hit. The echo cannot Crit, does not count as another cast, and cannot recursively trigger itself.', mechanic(3, 'M', 'Arcane Overload')),
])

const ring4 = createRing('power', 4, [
  minor('power-r4-apex-force', 'Ascendant Power', '+0.8% Spell Power per rank. Rank 5: +4%.', linearStat('spellPowerPct', 0.008)),
  minor('power-r4-lethal-precision', 'Ascendant Force', '+0.7% Spell Damage per rank. Rank 5: +3.5%.', spellDamage(0.007)),
  minor('power-r4-cataclysmic-crit', 'Ascendant Criticals', '+2.8% Crit Damage per rank. Rank 5: +14%.', linearStat('critDamage', 0.028)),
  minor('power-r4-relentless-casting', 'Relentless Casting', '+0.3% Cooldown Recovery per rank. Rank 5: +1.5%.', linearStat('cooldownRecoveryPct', 0.003)),
  perk('power-r4-dot-mastery', 'Kill Surge', 'A kill reduces remaining Spell cooldowns by a meaningful but bounded amount.', mechanic(4, 'S5', 'Kill Surge')),
  perk('power-r4-crushing-pressure', 'Burst Window', 'When a Spell cooldown completes naturally, the next damaging Spell gains Damage.', mechanic(4, 'S6', 'Burst Window')),
  perk('power-r4-execution-mastery', 'Aggressive Rotation', 'Casting four different Spells without repeating grants Action Speed to the next Spell only.', mechanic(4, 'S7', 'Aggressive Rotation')),
  perk('power-r4-first-strike', 'Cooldown Punisher', 'Spells with a base cooldown of at least 20 seconds gain Damage.', mechanic(4, 'S8', 'Cooldown Punisher')),
  major('power-r4-perfect-execution', 'Perfect Execution', 'Against enemies below 20% Health, damaging Spells gain +10% Damage. A killing Spell reduces remaining Spell cooldowns by 0.5 seconds.', mechanic(4, 'M', 'Perfect Execution')),
])

const ring5 = createRing('power', 5, [
  minor('power-r5-ruinous-force', 'Ruinous Power', '+0.9% Spell Power per rank. Rank 5: +4.5%.', linearStat('spellPowerPct', 0.009)),
  minor('power-r5-brutal-strikes', 'Ruinous Force', '+0.8% Spell Damage per rank. Rank 5: +4%.', spellDamage(0.008)),
  minor('power-r5-keen-destruction', 'Deep Ruin', '+1.2% Damage over Time per rank. Rank 5: +6%.', linearStat('damageOverTimePct', 0.012)),
  minor('power-r5-violent-criticals', 'Aggressive Rhythm', '+0.3% Action Speed per rank. Rank 5: +1.5%.', rankedModifier('action-speed-percent', 0.003)),
  perk('power-r5-ruinous-casting', 'Burning Momentum', 'DoT ticks build Ruin stacks for the next direct damaging Spell.', mechanic(5, 'S5', 'Burning Momentum')),
  perk('power-r5-lingering-ruin', 'Detonation Theory', 'Consuming or detonating your own damaging Status gains a Damage bonus.', mechanic(5, 'S6', 'Detonation Theory')),
  perk('power-r5-predatory-opening', 'Lingering Execution', 'Your DoTs deal more Damage against enemies below 35% Health.', mechanic(5, 'S7', 'Lingering Execution')),
  perk('power-r5-blooded-finish', 'Deep Wounds', 'Applying a damaging periodic Status to an already debuffed enemy improves its total authored damage.', mechanic(5, 'S8', 'Deep Wounds')),
  major('power-r5-ruinous-surge', 'Unstable Power', 'Every 5th successful damaging Spell gains +30% Damage and +15% final Mana cost. Free Spells still gain the Damage bonus.', mechanic(5, 'M', 'Unstable Power')),
])

const ring6 = createRing('power', 6, [
  minor('power-r6-cataclysmic-power', 'Cataclysmic Power', '+1% Spell Power per rank. Rank 5: +5%.', linearStat('spellPowerPct', 0.01)),
  minor('power-r6-spell-haste', 'Cataclysmic Precision', '+0.55 percentage points Crit Chance per rank. Rank 5: +2.75 pp.', linearStat('critChance', 0.0055)),
  minor('power-r6-aggressive-rhythm', 'Cataclysmic Criticals', '+3.6% Crit Damage per rank. Rank 5: +18%.', linearStat('critDamage', 0.036)),
  minor('power-r6-critical-cascade', 'Cataclysmic Recovery', '+0.4% Cooldown Recovery per rank. Rank 5: +2%.', linearStat('cooldownRecoveryPct', 0.004)),
  perk('power-r6-critical-reservoir', 'Overcast', 'Spells costing at least 15% Max Mana gain Damage.', mechanic(6, 'S5', 'Overcast')),
  perk('power-r6-ravage-weakness', 'Mana Burn', 'When a damaging Spell leaves you below 20% Mana, it deals additional direct Damage.', mechanic(6, 'S6', 'Mana Burn')),
  perk('power-r6-dot-execution', 'Cataclysmic Reserve', 'Spending at least 15% Max Mana empowers the next damaging Spell with Crit Chance.', mechanic(6, 'S7', 'Cataclysmic Reserve')),
  perk('power-r6-kill-surge', 'Critical Cataclysm', 'A Crit from a high-cost Spell recovers part of that Spell cooldown.', mechanic(6, 'S8', 'Critical Cataclysm')),
  major('power-r6-cataclysm', 'Cataclysm', 'The first Spell each encounter costing at least 15% Max Mana gains +30% Damage, +15% Mana Cost, and starts its cooldown 15% recovered.', mechanic(6, 'M', 'Cataclysm')),
])

const ring7 = createRing('power', 7, [
  minor('power-r7-sovereign-force', 'Sovereign Precision', '+0.8 percentage points Crit Chance per rank. Rank 5: +4 pp.', linearStat('critChance', 0.008)),
  minor('power-r7-critical-dominance', 'Devastating Criticals', '+4.4% Crit Damage per rank. Rank 5: +22%.', linearStat('critDamage', 0.044)),
  minor('power-r7-devastating-criticals', 'Sovereign Ruin', '+1.6% Damage over Time per rank. Rank 5: +8%.', linearStat('damageOverTimePct', 0.016)),
  minor('power-r7-unrelenting-spells', 'Sovereign Tempo', '+0.4% Action Speed per rank. Rank 5: +2%.', rankedModifier('action-speed-percent', 0.004)),
  perk('power-r7-broken-resistance', 'Sovereign Sequence', 'Casting five different Spells without repeating empowers the fifth.', mechanic(7, 'S5', 'Sovereign Sequence')),
  perk('power-r7-barrier-crusher', 'First Blood', 'The first damaging Spell against each enemy gains Damage.', mechanic(7, 'S6', 'First Blood')),
  perk('power-r7-sovereign-execution', 'Last Word', 'The first damaging Spell to hit an enemy below 20% Health gains Damage once per enemy.', mechanic(7, 'S7', 'Last Word')),
  perk('power-r7-first-blood', 'Dominating Weakness', 'Against enemies with 3+ negative Statuses, gain a strong Damage bonus.', mechanic(7, 'S8', 'Dominating Weakness')),
  major('power-r7-sovereign-casting', 'Sovereign Casting', 'Each encounter begins with 3 Sovereignty charges. A damaging Spell consumes one for +12% Damage; a direct Crit does not consume a charge.', mechanic(7, 'M', 'Sovereign Casting')),
])

const ring8 = createRing('power', 8, [
  minor('power-r8-apotheosis-force', 'Apotheosis Power', '+1.1% Spell Power per rank. Rank 5: +5.5%.', linearStat('spellPowerPct', 0.011)),
  minor('power-r8-apotheosis-precision', 'Apotheosis Criticals', '+5.6% Crit Damage per rank. Rank 5: +28%.', linearStat('critDamage', 0.056)),
  minor('power-r8-apotheosis-criticals', 'Apotheosis Recovery', '+0.5% Cooldown Recovery per rank. Rank 5: +2.5%.', linearStat('cooldownRecoveryPct', 0.005)),
  minor('power-r8-apotheosis-tempo', 'Apotheosis Tempo', '+0.5% Action Speed per rank. Rank 5: +2.5%.', rankedModifier('action-speed-percent', 0.005)),
  perk('power-r8-apotheosis-recovery', 'Perfect Cycle', 'A complete high-level Spell cycle empowers its next damaging Spell.', mechanic(8, 'S5', 'Perfect Cycle')),
  perk('power-r8-apotheosis-dot', 'Arcane Echo', 'Every 6th successful damaging Spell gains a controlled Arcane echo.', mechanic(8, 'S6', 'Arcane Echo')),
  perk('power-r8-universal-pressure', 'Apotheosis Execution', 'Damaging Spells gain Damage against enemies below 20% Health.', mechanic(8, 'S7', 'Apotheosis Execution')),
  perk('power-r8-final-execution', 'Limit Break', 'A rare high-cost Spell receives a late-game resource payoff.', mechanic(8, 'S8', 'Limit Break')),
  major('power-r8-arcane-apotheosis', 'Arcane Apotheosis', 'After 8 successful damaging Spells in one encounter, enter Apotheosis for 6 seconds: +20% Damage, -15% Mana Cost, and +10% Action Speed. Once per encounter.', mechanic(8, 'M', 'Arcane Apotheosis')),
])

export const powerNodes = [ring1, ring2, ring3, ring4, ring5, ring6, ring7, ring8]

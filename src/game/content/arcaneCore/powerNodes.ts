import { createRing, fixedEffects, linearStat, modifier, perk, minor, major, rankedModifier, rankValues, rule } from './arcaneCoreNodeFactory'
import { aboveHp, aboveMana, all, belowHp, debuffed, directSpellCrit, negativeStatuses, spell, targetAboveHp, targetBelowHp } from './arcaneCoreContentHelpers'

const damagingEvery = (every: number, values: readonly number[]) => (rank: number) => ({ special: [{ type: 'nth-damaging-spell-bonus' as const, every, damageMultiplier: 1 + rankValues(rank, values) }] })
const cooldownPulse = (id: string, values: readonly number[], cooldownMs = 500) => (rank: number) => ({ rules: [rule(id, 'on-spell-hit', [{ type: 'modify-cooldown', target: 'self', amountMs: -rankValues(rank, values) }], directSpellCrit, { cooldownMs })] })

const ring1 = createRing('power', 1, [
  minor('power-r1-arcane-force', 'Arcane Force', '+2 Spell Power per rank.', linearStat('spellPower', 2)),
  minor('power-r1-forceful-strikes', 'Forceful Strikes', 'Legacy compatibility slot; V6 catalog owns this mechanic.', linearStat('spellPowerPct', 0)),
  minor('power-r1-critical-insight', 'Critical Insight', '+0.5% Critical Chance per rank.', linearStat('critChance', 0.005)),
  minor('power-r1-critical-force', 'Critical Force', '+3% Critical Damage per rank.', linearStat('critDamage', 0.03)),
  minor('power-r1-spell-impact', 'Spell Impact', '+1% Spell Damage per rank.', rankedModifier('spell-damage-percent', 0.01)),
  minor('power-r1-battle-rhythm', 'Battle Rhythm', 'Legacy compatibility slot; V6 catalog owns this mechanic.', linearStat('cooldownRecoveryPct', 0)),
  minor('power-r1-lingering-power', 'Lingering Power', '+1.5% Damage over Time per rank.', linearStat('damageOverTimePct', 0.015)),
  perk('power-r1-arcane-pressure', 'Arcane Pressure', 'Above 80% Health: +1% Damage Dealt per rank.', rankedModifier('damage-dealt-percent', 0.01, aboveHp(80))),
  major('power-r1-overwhelming-force', 'Overwhelming Force', '+5% Damage Dealt.', fixedEffects({ modifiers: [modifier('damage-dealt-percent', 0.05)] })),
])
const ring2 = createRing('power', 2, [
  perk('power-r2-opening-blast', 'Opening Blast', 'Against enemies above 90% Health: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, targetAboveHp(90))),
  perk('power-r2-finisher', 'Finisher', 'Against enemies below 25% Health: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, targetBelowHp(25))),
  perk('power-r2-critical-feedback', 'Critical Feedback', 'Direct Spell Crit reduces remaining Spell cooldowns by 50–150 ms.', cooldownPulse('power-critical-feedback', [50, 75, 100, 125, 150])),
  perk('power-r2-critical-recovery', 'Critical Recovery', 'Direct Spell Crit restores 1–3 Mana.', (rank) => ({
    rules: [rule('power-critical-recovery', 'on-spell-hit', [{
      type: 'restore-resource', target: 'self', resource: 'mana',
      magnitude: { type: 'flat', value: rankValues(rank, [1, 1, 2, 2, 3]) },
    }], directSpellCrit, { cooldownMs: 750 })],
  })),
  perk('power-r2-spell-weaving', 'Spell Weaving', 'Basic Attack hit reduces Spell cooldowns by 40–120 ms.', (rank) => ({ rules: [rule('power-spell-weaving', 'on-basic-attack-hit', [{ type: 'modify-cooldown', target: 'self', amountMs: -rankValues(rank, [40, 60, 80, 100, 120]) }])] })),
  perk('power-r2-arcane-recoil', 'Arcane Recoil', 'Damaging Spell hit advances the next Basic Attack by 40–120 ms.', (rank) => ({ rules: [rule('power-arcane-recoil', 'on-spell-hit', [{ type: 'modify-action-timer', target: 'self', amountMs: -rankValues(rank, [40, 60, 80, 100, 120]), action: 'basic-attack' }], spell)] })),
  perk('power-r2-exploit-weakness', 'Exploit Weakness', 'Against any debuffed enemy: +1% Damage per rank.', rankedModifier('damage-dealt-percent', 0.01, debuffed)),
  perk('power-r2-relentless-execution', 'Relentless Execution', 'Against enemies below 50% Health: +1% Damage per rank.', rankedModifier('damage-dealt-percent', 0.01, targetBelowHp(50))),
  major('power-r2-perfect-precision', 'Perfect Precision', '+3% Critical Chance and +12% Critical Damage.', fixedEffects({ stats: { critChance: 0.03, critDamage: 0.12 } })),
])
const ring3 = createRing('power', 3, [
  perk('power-r3-arcane-momentum', 'Arcane Momentum', 'Every fourth damaging Spell deals +5–15% Damage.', damagingEvery(4, [0.05, 0.075, 0.1, 0.125, 0.15])),
  perk('power-r3-critical-tempo', 'Critical Tempo', 'Direct Spell Crit advances the next Basic Attack by 40–120 ms.', (rank) => ({ rules: [rule('power-critical-tempo', 'on-spell-hit', [{ type: 'modify-action-timer', target: 'self', amountMs: -rankValues(rank, [40, 60, 80, 100, 120]), action: 'basic-attack' }], directSpellCrit)] })),
  perk('power-r3-battle-hunger', 'Battle Hunger', 'A kill restores 1–5 Mana.', (rank) => ({ rules: [rule('power-battle-hunger', 'on-kill', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: rank } }])] })),
  perk('power-r3-shatter-weakness', 'Shatter Weakness', 'Against 2+ negative Statuses: +1.5% Damage per rank.', rankedModifier('damage-dealt-percent', 0.015, negativeStatuses(2))),
  perk('power-r3-spell-surge', 'Spell Surge', 'A kill reduces Spell cooldowns by 50–250 ms.', (rank) => ({ rules: [rule('power-spell-surge', 'on-kill', [{ type: 'modify-cooldown', target: 'self', amountMs: -rankValues(rank, [50, 100, 150, 200, 250]) }])] })),
  perk('power-r3-lingering-execution', 'Lingering Execution', 'DoT damage below 35% Health: +2% per rank.', rankedModifier('damage-over-time-percent', 0.02, targetBelowHp(35))),
  perk('power-r3-aggressive-casting', 'Aggressive Casting', 'Above 50% Mana: +1% Spell Damage per rank.', rankedModifier('spell-damage-percent', 0.01, aboveMana(50))),
  perk('power-r3-brutal-rhythm', 'Brutal Rhythm', 'Basic Attack damage against debuffed enemies: +2% per rank.', rankedModifier('basic-attack-damage-percent', 0.02, debuffed)),
  major('power-r3-arcane-overload', 'Arcane Overload', 'Every sixth damaging Spell deals +25% Damage.', damagingEvery(6, [0.25])),
])
const ring4 = createRing('power', 4, [
  minor('power-r4-apex-force', 'Apex Force', '+3 Spell Power per rank.', linearStat('spellPower', 3)),
  perk('power-r4-lethal-precision', 'Lethal Precision', 'Below 35% Health: +0.75% Crit Chance per rank.', rankedModifier('crit-chance', 0.0075, targetBelowHp(35))),
  minor('power-r4-cataclysmic-crit', 'Cataclysmic Crit', '+5% Critical Damage per rank.', linearStat('critDamage', 0.05)),
  minor('power-r4-relentless-casting', 'Relentless Casting', '+1.5% Cooldown Recovery per rank.', linearStat('cooldownRecoveryPct', 0.015)),
  minor('power-r4-dot-mastery', 'DoT Mastery', '+2% Damage over Time per rank.', linearStat('damageOverTimePct', 0.02)),
  perk('power-r4-crushing-pressure', 'Crushing Pressure', 'Against 3+ negative Statuses: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, negativeStatuses(3))),
  perk('power-r4-execution-mastery', 'Execution Mastery', 'Below 50% Health: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, targetBelowHp(50))),
  perk('power-r4-first-strike', 'First Strike', 'Against enemies above 90% Health: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, targetAboveHp(90))),
  major('power-r4-perfect-execution', 'Perfect Execution', 'Below 15% Health: +20% Damage.', fixedEffects({ modifiers: [modifier('damage-dealt-percent', 0.2, targetBelowHp(15))] })),
])

const ring5 = createRing('power', 5, [
  minor('power-r5-ruinous-force', 'Ruinous Force', '+4 Spell Power per rank.', linearStat('spellPower', 4)),
  minor('power-r5-brutal-strikes', 'Brutal Strikes', 'Legacy compatibility slot; V6 catalog owns this mechanic.', linearStat('spellPowerPct', 0)),
  minor('power-r5-keen-destruction', 'Keen Destruction', '+0.75% Critical Chance per rank.', linearStat('critChance', 0.0075)),
  minor('power-r5-violent-criticals', 'Violent Criticals', '+5% Critical Damage per rank.', linearStat('critDamage', 0.05)),
  minor('power-r5-ruinous-casting', 'Ruinous Casting', '+2% Spell Damage per rank.', rankedModifier('spell-damage-percent', 0.02)),
  minor('power-r5-lingering-ruin', 'Lingering Ruin', '+3% Damage over Time per rank.', linearStat('damageOverTimePct', 0.03)),
  perk('power-r5-predatory-opening', 'Predatory Opening', 'Against enemies above 75% Health: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, targetAboveHp(75))),
  perk('power-r5-blooded-finish', 'Blooded Finish', 'Against enemies below 35% Health: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, targetBelowHp(35))),
  major('power-r5-ruinous-surge', 'Ruinous Surge', 'Every fifth damaging Spell deals +40% Damage.', damagingEvery(5, [0.4])),
])
const ring6 = createRing('power', 6, [
  minor('power-r6-cataclysmic-power', 'Cataclysmic Power', '+5 Spell Power per rank.', linearStat('spellPower', 5)),
  minor('power-r6-spell-haste', 'Spell Haste', '+2% Cooldown Recovery per rank.', linearStat('cooldownRecoveryPct', 0.02)),
  minor('power-r6-aggressive-rhythm', 'Aggressive Rhythm', '+1% Action Speed per rank.', rankedModifier('action-speed-percent', 0.01)),
  perk('power-r6-critical-cascade', 'Critical Cascade', 'Direct Spell Crit reduces all Spell cooldowns by 100–300 ms.', cooldownPulse('power-critical-cascade', [100, 150, 200, 250, 300], 400)),
  perk('power-r6-critical-reservoir', 'Critical Reservoir', 'Direct Spell Crit restores 1–4 Mana.', (rank) => ({ rules: [rule('power-critical-reservoir', 'on-spell-hit', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: rankValues(rank, [1, 2, 2, 3, 4]) } }], directSpellCrit, { cooldownMs: 600 })] })),
  perk('power-r6-ravage-weakness', 'Ravage Weakness', 'Against debuffed enemies: +2% Damage per rank.', rankedModifier('damage-dealt-percent', 0.02, debuffed)),
  perk('power-r6-dot-execution', 'DoT Execution', 'Damage over Time against enemies below 50% Health: +3% per rank.', rankedModifier('damage-over-time-percent', 0.03, targetBelowHp(50))),
  perk('power-r6-kill-surge', 'Kill Surge', 'A kill reduces remaining Spell cooldowns by 100–500 ms.', (rank) => ({ rules: [rule('power-kill-surge', 'on-kill', [{ type: 'modify-cooldown', target: 'self', amountMs: -rankValues(rank, [100, 200, 300, 400, 500]) }])] })),
  major('power-r6-cataclysm', 'Cataclysm', '+8% Damage Dealt.', fixedEffects({ modifiers: [modifier('damage-dealt-percent', 0.08)] })),
])
const ring7 = createRing('power', 7, [
  minor('power-r7-sovereign-force', 'Sovereign Force', '+6 Spell Power per rank.', linearStat('spellPower', 6)),
  minor('power-r7-critical-dominance', 'Critical Dominance', '+1% Critical Chance per rank.', linearStat('critChance', 0.01)),
  minor('power-r7-devastating-criticals', 'Devastating Criticals', '+6% Critical Damage per rank.', linearStat('critDamage', 0.06)),
  minor('power-r7-unrelenting-spells', 'Unrelenting Spells', '+2.5% Spell Damage per rank.', rankedModifier('spell-damage-percent', 0.025)),
  perk('power-r7-broken-resistance', 'Broken Resistance', 'Against enemies with 2+ negative Statuses: +2.5% Damage per rank.', rankedModifier('damage-dealt-percent', 0.025, negativeStatuses(2))),
  perk('power-r7-barrier-crusher', 'Barrier Crusher', 'Against enemies with Barrier: +2.5% Damage per rank.', rankedModifier('damage-dealt-percent', 0.025, { type: 'target-has-barrier' })),
  perk('power-r7-sovereign-execution', 'Sovereign Execution', 'Against enemies below 25% Health: +3% Damage per rank.', rankedModifier('damage-dealt-percent', 0.03, targetBelowHp(25))),
  perk('power-r7-first-blood', 'First Blood', 'Against enemies above 90% Health: +3% Damage per rank.', rankedModifier('damage-dealt-percent', 0.03, targetAboveHp(90))),
  major('power-r7-sovereign-casting', 'Sovereign Casting', '+10% Spell Damage and +5% Cooldown Recovery.', fixedEffects({ modifiers: [modifier('spell-damage-percent', 0.1), modifier('cooldown-recovery-percent', 0.05)] })),
])
const ring8 = createRing('power', 8, [
  minor('power-r8-apotheosis-force', 'Apotheosis Force', '+8 Spell Power per rank.', linearStat('spellPower', 8)),
  minor('power-r8-apotheosis-precision', 'Apotheosis Precision', '+1.25% Critical Chance per rank.', linearStat('critChance', 0.0125)),
  minor('power-r8-apotheosis-criticals', 'Apotheosis Criticals', '+8% Critical Damage per rank.', linearStat('critDamage', 0.08)),
  minor('power-r8-apotheosis-tempo', 'Apotheosis Tempo', '+1.5% Action Speed per rank.', rankedModifier('action-speed-percent', 0.015)),
  minor('power-r8-apotheosis-recovery', 'Apotheosis Recovery', '+2.5% Cooldown Recovery per rank.', linearStat('cooldownRecoveryPct', 0.025)),
  minor('power-r8-apotheosis-dot', 'Apotheosis DoT', '+4% Damage over Time per rank.', linearStat('damageOverTimePct', 0.04)),
  perk('power-r8-universal-pressure', 'Universal Pressure', 'Against any debuffed enemy: +3% Damage per rank.', rankedModifier('damage-dealt-percent', 0.03, debuffed)),
  perk('power-r8-final-execution', 'Final Execution', 'Against enemies below 20% Health: +4% Damage per rank.', rankedModifier('damage-dealt-percent', 0.04, targetBelowHp(20))),
  major('power-r8-arcane-apotheosis', 'Arcane Apotheosis', '+10% Damage Dealt, +5% Critical Chance, and +20% Critical Damage.', fixedEffects({ stats: { critChance: 0.05, critDamage: 0.2 }, modifiers: [modifier('damage-dealt-percent', 0.1)] })),
])

export const powerNodes = [ring1, ring2, ring3, ring4, ring5, ring6, ring7, ring8]

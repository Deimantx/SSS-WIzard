import { lane, minor, perk, major, modifier, rule } from './arcaneCoreNodeFactory'

const all = (...conditions: Array<NonNullable<Parameters<typeof modifier>[2]>>) => ({ type: 'all' as const, conditions })
const spell = { type: 'source-has-tag' as const, tag: 'spell' as const }
const directSpell = all(spell, { type: 'event-is-critical' as const })
const below = (percent: number) => ({ type: 'target-hp-below-percent' as const, percent })
const above = (percent: number) => ({ type: 'target-hp-above-percent' as const, percent })
const debuffed = { type: 'target-has-status-tag' as const, tag: 'debuff' as const }

export const powerNodes = [
  lane('power', 'power-a', 0, [
    minor('power-a1', 'Arcane Force I', '+3 Spell Power', { spellPower: 3 }),
    minor('power-a2', 'Forceful Strikes', '+3 Basic Damage', { basicDamage: 3 }),
    minor('power-a3', 'Arcane Force II', '+3 Spell Power', { spellPower: 3 }),
    perk('power-a4', 'Arcane Pressure', 'While above 80% Health: +4% Damage Dealt.', [modifier('damage-dealt-percent', 0.04, { type: 'self-hp-above-percent', percent: 80 })]),
    minor('power-a5', 'Arcane Force III', '+4 Spell Power', { spellPower: 4 }),
    perk('power-a6', 'Spell Impact', '+3% Spell Damage.', [modifier('spell-damage-percent', 0.03)]),
    minor('power-a7', 'Forceful Strikes II', '+4 Basic Damage', { basicDamage: 4 }),
    perk('power-a8', 'Opening Blast', 'Deal +10% Damage to enemies above 90% Health.', [modifier('damage-dealt-percent', 0.1, above(90))]),
    minor('power-a9', 'Arcane Force IV', '+5 Spell Power', { spellPower: 5 }),
    major('power-a10', 'Overwhelming Force', '+6% Damage Dealt.', undefined, [modifier('damage-dealt-percent', 0.06)]),
  ]),
  lane('power', 'power-b', 1, [
    minor('power-b1', 'Critical Insight I', '+1% Critical Chance', { critChance: 0.01 }),
    minor('power-b2', 'Critical Force I', '+4% Critical Damage', { critDamage: 0.04 }),
    minor('power-b3', 'Critical Insight II', '+1% Critical Chance', { critChance: 0.01 }),
    perk('power-b4', 'Critical Feedback', 'A direct Spell Critical Hit reduces all remaining Spell cooldowns by 150 ms.', undefined, [rule('critical-feedback', 'on-spell-hit', [{ type: 'modify-cooldown', target: 'self', amountMs: -150 }], directSpell, { cooldownMs: 500 })]),
    minor('power-b5', 'Critical Force II', '+6% Critical Damage', { critDamage: 0.06 }),
    minor('power-b6', 'Critical Insight III', '+1% Critical Chance', { critChance: 0.01 }),
    perk('power-b7', 'Critical Recovery', 'A direct Spell Critical Hit restores 1 Mana.', undefined, [rule('critical-recovery', 'on-spell-hit', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 1 } }], directSpell, { cooldownMs: 750 })]),
    minor('power-b8', 'Critical Force III', '+8% Critical Damage', { critDamage: 0.08 }),
    minor('power-b9', 'Critical Insight IV', '+1% Critical Chance', { critChance: 0.01 }),
    major('power-b10', 'Perfect Precision', '+3% Critical Chance and +12% Critical Damage', { critChance: 0.03, critDamage: 0.12 }),
  ]),
  lane('power', 'power-c', 2, [
    minor('power-c1', 'Rapid Casting I', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    minor('power-c2', 'Battle Rhythm I', '+2% Basic Attack Speed', { basicAttackSpeedPct: 0.02 }),
    minor('power-c3', 'Arcane Rhythm I', '+3 Spell Power', { spellPower: 3 }),
    perk('power-c4', 'Spell Weaving', 'A successful Basic Attack hit reduces all remaining Spell cooldowns by 100 ms.', undefined, [rule('spell-weaving', 'on-basic-attack-hit', [{ type: 'modify-cooldown', target: 'self', amountMs: -100 }])]),
    minor('power-c5', 'Battle Rhythm II', '+2% Basic Attack Speed', { basicAttackSpeedPct: 0.02 }),
    minor('power-c6', 'Forceful Rhythm', '+3 Basic Damage', { basicDamage: 3 }),
    perk('power-c7', 'Arcane Recoil', 'A damaging Spell hit advances the next Basic Attack by 100 ms.', undefined, [rule('arcane-recoil', 'on-spell-hit', [{ type: 'modify-action-timer', target: 'self', amountMs: -100, action: 'basic-attack' }], spell)]),
    minor('power-c8', 'Rapid Casting II', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    minor('power-c9', 'Arcane Rhythm II', '+4 Spell Power', { spellPower: 4 }),
    major('power-c10', 'Arcane Overload', 'Every 6th damaging Spell deals +25% Damage.', undefined, undefined, undefined, [{ type: 'nth-damaging-spell-bonus', every: 6, damageMultiplier: 1.25 }]),
  ]),
  lane('power', 'power-d', 3, [
    minor('power-d1', 'Lingering Power I', '+2% Damage over Time', { damageOverTimePct: 0.02 }),
    minor('power-d2', 'Execution Power I', '+3 Spell Power', { spellPower: 3 }),
    perk('power-d3', 'Finisher', 'Deal +10% Damage to enemies below 25% Health.', [modifier('damage-dealt-percent', 0.1, below(25))]),
    minor('power-d4', 'Lingering Power II', '+2% Damage over Time', { damageOverTimePct: 0.02 }),
    perk('power-d5', 'Execution Force', '+3% Spell Damage.', [modifier('spell-damage-percent', 0.03)]),
    perk('power-d6', 'Exploit Weakness', 'Deal +5% Damage to enemies affected by any negative Status.', [modifier('damage-dealt-percent', 0.05, debuffed)]),
    minor('power-d7', 'Lingering Power III', '+3% Damage over Time', { damageOverTimePct: 0.03 }),
    minor('power-d8', 'Execution Power II', '+4 Spell Power', { spellPower: 4 }),
    perk('power-d9', 'Relentless Execution', 'Deal +3% Damage to enemies below 50% Health.', [modifier('damage-dealt-percent', 0.03, below(50))]),
    major('power-d10', 'Perfect Execution', 'Deal +20% Damage to enemies below 15% Health.', undefined, [modifier('damage-dealt-percent', 0.2, below(15))]),
  ]),
]

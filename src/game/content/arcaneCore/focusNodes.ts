import { lane, minor, perk, major, modifier, rule } from './arcaneCoreNodeFactory'

const highMana = { type: 'self-mana-above-percent' as const, percent: 80 }
const lowMana = (percent: number) => ({ type: 'self-mana-below-percent' as const, percent })

export const focusNodes = [
  lane('focus', 'focus-a', 0, [
    minor('focus-a1', 'Mana Reservoir I', '+10 Max Mana', { maxMana: 10 }),
    minor('focus-a2', 'Mana Reservoir II', '+10 Max Mana', { maxMana: 10 }),
    minor('focus-a3', 'Mana Reservoir III', '+10 Max Mana', { maxMana: 10 }),
    perk('focus-a4', 'Deep Reserves', 'While above 80% Mana: +3% Spell Damage.', [modifier('spell-damage-percent', 0.03, highMana)]),
    minor('focus-a5', 'Mana Reservoir IV', '+15 Max Mana', { maxMana: 15 }),
    minor('focus-a6', 'Mana Reservoir V', '+15 Max Mana', { maxMana: 15 }),
    perk('focus-a7', 'Reserve Shield', 'While above 80% Mana: -2% Damage Taken.', [modifier('damage-taken-percent', -0.02, highMana)]),
    minor('focus-a8', 'Mana Reservoir VI', '+20 Max Mana', { maxMana: 20 }),
    minor('focus-a9', 'Mana Reservoir VII', '+20 Max Mana', { maxMana: 20 }),
    major('focus-a10', 'Bottomless Well', '+40 Max Mana and +10% Mana Regen.', { maxMana: 40 }, [modifier('mana-regen-percent', 0.1)]),
  ]),
  lane('focus', 'focus-b', 1, [
    minor('focus-b1', 'Mana Flow I', '+0.25 Mana Regen / sec', { manaRegen: 0.25 }),
    minor('focus-b2', 'Mana Flow II', '+0.25 Mana Regen / sec', { manaRegen: 0.25 }),
    perk('focus-b3', 'Low Mana Recovery', 'While below 25% Mana: +25% Mana Regen.', [modifier('mana-regen-percent', 0.25, lowMana(25))]),
    minor('focus-b4', 'Mana Flow III', '+0.25 Mana Regen / sec', { manaRegen: 0.25 }),
    minor('focus-b5', 'Leyline Efficiency I', '+5% Mana Regen', undefined, [modifier('mana-regen-percent', 0.05)]),
    perk('focus-b6', 'Mana Recovery', 'Killing an enemy restores 3 Mana.', undefined, [rule('mana-recovery', 'on-kill', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 3 } }])]),
    minor('focus-b7', 'Mana Flow IV', '+0.5 Mana Regen / sec', { manaRegen: 0.5 }),
    minor('focus-b8', 'Leyline Efficiency II', '+5% Mana Regen', undefined, [modifier('mana-regen-percent', 0.05)]),
    perk('focus-b9', 'Emergency Channel', 'While below 10% Mana: +50% Mana Regen.', [modifier('mana-regen-percent', 0.5, lowMana(10))]),
    major('focus-b10', 'Mana Overflow', 'While in Combat, Mana generated above Max Mana becomes Barrier at 25% efficiency.', undefined, undefined, undefined, [{ type: 'mana-overflow-to-barrier', conversion: 0.25, maxHealthPercentPerSecondCap: 0.05 }]),
  ]),
  lane('focus', 'focus-c', 2, [
    minor('focus-c1', 'Mana Efficiency I', '-1% Mana Cost', { manaCostReductionPct: 0.01 }),
    minor('focus-c2', 'Mana Efficiency II', '-1% Mana Cost', { manaCostReductionPct: 0.01 }),
    minor('focus-c3', 'Efficient Reservoir', '+5 Max Mana', { maxMana: 5 }),
    perk('focus-c4', 'Focused Casting', 'While above 50% Mana: +2% Cooldown Recovery.', [modifier('cooldown-recovery-percent', 0.02, { type: 'self-mana-above-percent', percent: 50 })]),
    minor('focus-c5', 'Mana Efficiency III', '-1% Mana Cost', { manaCostReductionPct: 0.01 }),
    minor('focus-c6', 'Efficient Recovery', '+1% Cooldown Recovery', { cooldownRecoveryPct: 0.01 }),
    minor('focus-c7', 'Mana Efficiency IV', '-1% Mana Cost', { manaCostReductionPct: 0.01 }),
    perk('focus-c8', 'Controlled Expenditure', 'After spending Mana on a Spell, restore 1 Mana.', undefined, [rule('controlled-expenditure', 'on-spell-cast', [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 1 } }], { type: 'event-amount-positive' }, { cooldownMs: 1_000 })]),
    minor('focus-c9', 'Mana Efficiency V', '-1% Mana Cost', { manaCostReductionPct: 0.01 }),
    major('focus-c10', 'Arcane Efficiency', 'Every 5th Spell cast costs 0 Mana.', undefined, undefined, undefined, [{ type: 'nth-spell-free', every: 5 }]),
  ]),
  lane('focus', 'focus-d', 3, [
    minor('focus-d1', 'Focus Capacity I', '+1 Max Focus', { maxFocus: 1 }),
    minor('focus-d2', 'Focus Capacity II', '+1 Max Focus', { maxFocus: 1 }),
    perk('focus-d3', 'Focused Power', 'Gain +0.25 Spell Power for each currently Reserved Focus.', undefined, undefined, [{ type: 'reserved-focus-spell-power', spellPowerPerReservedFocus: 0.25 }]),
    minor('focus-d4', 'Focus Capacity III', '+1 Max Focus', { maxFocus: 1 }),
    minor('focus-d5', 'Focus Efficiency I', '+1% Focus Efficiency', { focusEfficiencyPct: 0.01 }),
    perk('focus-d6', 'Clear Mind', 'Gain +0.05 Mana Regen / sec for each currently Free Focus.', undefined, undefined, [{ type: 'free-focus-mana-regen', manaRegenPerFreeFocus: 0.05 }]),
    minor('focus-d7', 'Focus Capacity IV', '+1 Max Focus', { maxFocus: 1 }),
    minor('focus-d8', 'Focus Efficiency II', '+1% Focus Efficiency', { focusEfficiencyPct: 0.01 }),
    minor('focus-d9', 'Focus Capacity V', '+1 Max Focus', { maxFocus: 1 }),
    major('focus-d10', 'Perfect Focus', '+2 Max Focus and +5% Focus Efficiency.', { maxFocus: 2, focusEfficiencyPct: 0.05 }),
  ]),
]

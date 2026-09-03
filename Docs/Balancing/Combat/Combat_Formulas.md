# Combat formulas

These formulas describe the live combat order in designer language. The exact named settings are listed in the other Combat workbook pages.

## Player sheet

- Max Health = authored base Max Health + equipment Max Health.
- Max Mana = Channeling capacity after equipment and progression bonuses.
- Max Focus = authored capacity plus Focus improvements and other permanent bonuses.
- Spell Power = authored base Spell Power + equipment and combat modifiers.
- Basic Attack damage = authored base Basic Attack damage + equipment Basic Attack damage.
- Basic Attack speed multiplier = clamp(1 + speed modifiers, 0.1, 10).
- Basic Attack interval = authored Basic Attack interval / Basic Attack speed multiplier.
- Critical Strike chance = clamp(base chance + modifiers, 0, the Critical Strike cap).
- Critical Strike damage = clamp(base multiplier + modifiers, 1x, the Critical Strike damage cap).
- Defense = max(0, authored Defense + flat Defense modifiers).
- Defense reduction = min(the Defense reduction cap, Defense / (Defense + the Defense curve constant)).
- Mana cost = max(1, ceil(base cost x (1 - Mana cost reduction))).
- Focus cost = max(1, ceil(base cost x (1 - Focus efficiency))).

## Damage order

1. Resolve the authored magnitude.
2. Apply source damage modifiers.
3. Apply Basic Attack, Spell, Melee, Ranged, and Damage over Time modifiers that match.
4. Apply the direct-hit Critical Strike multiplier when the hit can critically strike.
5. Apply the opponent's damage-taken modifiers.
6. Apply Defense reduction to direct damage.
7. Apply resistance: max(0, amount x (1 - resistance)).
8. Apply Block reduction when the Block roll succeeds.
9. Absorb damage with Barrier, then apply the remainder to Health.

Damage over Time and other non-direct effects do not roll Critical Strike or Block. A multi-part direct hit shares one Critical Strike roll and one Block roll. Immunity is checked before damage is applied. Negative resistance increases damage through the same resistance expression.

## Timing and statuses

Authored action and status durations use milliseconds in code and are shown as seconds or minutes here. The simulation update interval is 100 ms. Status stacking, cleansing, dispelling, control, and periodic effects are listed in Status Effects.

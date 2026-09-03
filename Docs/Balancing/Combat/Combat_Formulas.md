# Combat formulas

These are short mechanic notes for rules that do not belong in an editable value sheet.

| Order | Calculation |
| --- | --- |
| 1 | Resolve the authored magnitude. |
| 2 | Apply matching source, attack, spell, school, and damage-over-time modifiers. |
| 3 | Apply direct-hit Crit when the hit can critically strike. |
| 4 | Apply the opponent damage-taken modifiers. |
| 5 | Apply Defense reduction, resistance, and Block. |
| 6 | Absorb damage with Barrier, then apply the remainder to Health. |

Damage over Time and other non-direct effects do not roll Crit or Block. A multi-part direct hit shares one Crit roll and one Block roll. Immunity is checked before damage is applied.

| Timing | Value |
| --- | --- |
| Simulation update interval | 100 ms |
| Basic Attack interval formula | Authored interval / final speed multiplier |
| Mana cost floor | 1 |
| Focus cost floor | 1 |

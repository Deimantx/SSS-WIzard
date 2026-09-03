# Howling Den enemies

## Core Combat Stats

| Enemy | Type | HP | Basic Dmg | Attack | DEF | Crit | Crit Dmg | Block | Phys Res | Arc Res | Fire Res | Water Res | Earth Res | Air Res | Damage Immune | Status Immune |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cavefang Wolf (cavefang-wolf) | Normal | 115 | 12 | 2.2 s | 10 | 5% | 150% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — | — |
| Razorclaw Lynx (razorclaw-lynx) | Normal | 130 | 11 | 1.9 s | 10 | 5% | 150% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — | — |
| Corrupted Dire Wolf (corrupted-dire-wolf) | Normal | 160 | 14 | 2.3 s | 10 | 5% | 150% | 0% | 0% | 0% | +10% | +10% | +10% | +10% | — | — |
| Corrupted Greatbear (corrupted-greatbear) | Boss | 900 | 22 | 2.8 s | 10 | 5% | 150% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — | — |

## Traits & Patterns

| Enemy | Trait 1 | Trait 2 | Phase / Trigger | Default Pattern | Alt Pattern |
| --- | --- | --- | --- | --- | --- |
| Cavefang Wolf (cavefang-wolf) | Predator Instinct: Deals 25% more damage while the target is at or below 35% HP.; +25% Damage dealt when the opponent's Health is below 35% | — | — | Basic Attack -> Basic Attack -> Pounce | — |
| Razorclaw Lynx (razorclaw-lynx) | Relentless Hunter: Deals 20% more damage to Bleeding targets.; +20% Damage dealt when the opponent has Bleeding | — | — | Basic Attack -> Rending Claws -> Basic Attack | — |
| Corrupted Dire Wolf (corrupted-dire-wolf) | Arcane Corruption: Corruption grants 10% resistance to Fire, Water, Earth, and Air. | — | — | Basic Attack -> Arcane Bite -> Basic Attack -> Basic Attack -> Corrupted Howl | — |
| Corrupted Greatbear (corrupted-greatbear) | Thick Hide: Basic Attack damage received is reduced by 20%.; -20% Damage taken from Basic Attack sources | Unstable Corruption: At 50% HP, gains Haste and shifts to the Corrupted Pattern once.; HP threshold when the caster's Health is below 50% -> Haste; Pattern: Corrupted (once/encounter) | HP threshold when the caster's Health is below 50% -> Haste; Pattern: Corrupted (once/encounter) | Basic Attack -> Basic Attack -> Crushing Maul -> Basic Attack -> Groundbreaker | Corrupted: Basic Attack -> Corrupted Roar -> Crushing Maul -> Basic Attack -> Basic Attack -> Arcane Rampage |

## Special Actions

| Enemy | Action | Cast | Damage | Damage Type | Status / Effect | Duration | Delay | Pattern Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cavefang Wolf (cavefang-wolf) | Pounce (pounce) | 1.4 s | 150% of Basic Attack damage Physical damage | Physical | +500 ms action time | — | — | Default: step 3 |
| Razorclaw Lynx (razorclaw-lynx) | Rending Claws (rending-claws) | 1.3 s | 125% of Basic Attack damage Physical damage | Physical | Bleeding (8 s); 36.25% of Basic Attack damage Physical damage | 8 s | — | Default: step 2 |
| Corrupted Dire Wolf (corrupted-dire-wolf) | Arcane Bite (arcane-bite) | 1.6 s | 70% of Basic Attack damage Physical damage + 70% of Basic Attack damage Arcane damage | Physical + Arcane | — | — | — | Default: step 2 |
| Corrupted Dire Wolf (corrupted-dire-wolf) | Corrupted Howl (corrupted-howl) | 1.8 s | — | — | Haste (6 s) | 6 s | — | Default: step 5 |
| Corrupted Greatbear (corrupted-greatbear) | Crushing Maul (crushing-maul) | 1.8 s | 155% of Basic Attack damage Physical damage | Physical | — | — | — | Default: step 3; Corrupted: step 3 |
| Corrupted Greatbear (corrupted-greatbear) | Groundbreaker (groundbreaker) | 2.5 s | 120% of Basic Attack damage Physical damage | Physical | +1.2 s action time | — | — | Default: step 5 |
| Corrupted Greatbear (corrupted-greatbear) | Corrupted Roar (corrupted-roar) | 2.2 s | — | — | Vulnerable | 6 s | — | Corrupted: step 2 |
| Corrupted Greatbear (corrupted-greatbear) | Arcane Rampage (arcane-rampage) | 3.5 s | 200% of Basic Attack damage Arcane damage | Arcane | — | — | — | Corrupted: step 6 |

## Loot

| Enemy | Item | Min | Max | Chance | Est. Qty / Kill |
| --- | --- | --- | --- | --- | --- |
| Cavefang Wolf (cavefang-wolf) | Predator Fang (predator-fang) | 1 | 1 | 55% | 0.55 |
| Cavefang Wolf (cavefang-wolf) | Predator Hide (predator-hide) | 1 | 1 | 30% | 0.3 |
| Cavefang Wolf (cavefang-wolf) | Life Essence (life-essence) | 1 | 3 | 100% | 2 |
| Razorclaw Lynx (razorclaw-lynx) | Predator Fang (predator-fang) | 1 | 1 | 45% | 0.45 |
| Razorclaw Lynx (razorclaw-lynx) | Predator Hide (predator-hide) | 1 | 1 | 45% | 0.45 |
| Razorclaw Lynx (razorclaw-lynx) | Life Essence (life-essence) | 1 | 3 | 100% | 2 |
| Corrupted Dire Wolf (corrupted-dire-wolf) | Corrupted Beast Essence (corrupted-beast-essence) | 1 | 1 | 35% | 0.35 |
| Corrupted Dire Wolf (corrupted-dire-wolf) | Predator Hide (predator-hide) | 1 | 1 | 30% | 0.3 |
| Corrupted Dire Wolf (corrupted-dire-wolf) | Predator Fang (predator-fang) | 1 | 1 | 25% | 0.25 |
| Corrupted Dire Wolf (corrupted-dire-wolf) | Life Essence (life-essence) | 1 | 3 | 100% | 2 |
| Corrupted Greatbear (corrupted-greatbear) | Predator Hide (predator-hide) | 2 | 4 | 100% | 3 |
| Corrupted Greatbear (corrupted-greatbear) | Corrupted Beast Essence (corrupted-beast-essence) | 1 | 2 | 100% | 1.5 |
| Corrupted Greatbear (corrupted-greatbear) | Greatbear Core (greatbear-core) | 1 | 1 | 35% | 0.35 |
| Corrupted Greatbear (corrupted-greatbear) | Greatbear Heartstone (greatbear-heartstone) | 1 | 1 | 5% | 0.05 |
| Corrupted Greatbear (corrupted-greatbear) | Life Essence (life-essence) | 1 | 3 | 100% | 2 |

Boss mechanics are represented by the Core Combat Stats, Traits & Patterns, and Special Actions sheets above.

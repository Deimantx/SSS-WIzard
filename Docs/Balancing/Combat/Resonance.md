# Resonance Harvest

Combat defeats can harvest Resonance into a dedicated persisted player resource. Resonance is not an Item, Arcane Points, Fragment, or Transmutation output.

## Categories

| Resonance type | Label |
| --- | --- |
| Fire (fire) | Fire Resonance |
| Water (water) | Water Resonance |
| Earth (earth) | Earth Resonance |
| Air (air) | Air Resonance |

## Storage and reward resolution

The player stores one whole, finite, non-negative balance per category. Enemy profiles are authored per enemy. Final reward is the authored base yield multiplied by the active encounter World Tier Resonance multiplier, then granted through the canonical combat finish path with saturation-safe deltas.

## Whispering Woods prototype profiles

| Enemy | Profile |
| --- | --- |
| Forest Wisp (forest-wisp) | 10 Air Resonance |
| Thornling (thornling) | 12 Earth Resonance |
| Stone Root (stone-root) | 20 Earth Resonance |
| Grove Sentinel (grove-sentinel) | 45 Earth Resonance |
| Forest Heart (forest-heart) | 80 Earth Resonance |

Unconverted enemies intentionally yield zero. These bootstrap values are not final balance. World Tier multipliers and unlock behavior are canonical in `Combat/World_Tiers.md`.

# Resonance Harvest

Phase 1 prototype status: Combat defeats can harvest Resonance into a dedicated persisted player resource. Resonance is not an Item, Arcane Points, Fragment, or Transmutation output.

## Categories

| Resonance type | Label |
| --- | --- |
| Fire (fire) | Fire Resonance |
| Water (water) | Water Resonance |
| Earth (earth) | Earth Resonance |
| Air (air) | Air Resonance |

## Storage and reward seam

The player stores one whole, finite, non-negative balance per Phase 1 category. Enemy profiles are authored per enemy. The Phase 1 reward resolver exposes World Tier 1 and a 1× multiplier as a compatibility seam; World Tier state is intentionally not implemented.

## Whispering Woods prototype profiles

| Enemy | Profile |
| --- | --- |
| Forest Wisp (forest-wisp) | 10 Air Resonance |
| Thornling (thornling) | 12 Earth Resonance |
| Stone Root (stone-root) | 20 Earth Resonance |
| Grove Sentinel (grove-sentinel) | 45 Earth Resonance |
| Forest Heart (forest-heart) | 80 Earth Resonance |

Unconverted enemies intentionally yield zero until a later content-conversion phase. These bootstrap values are not final balance. Phase 1 has no Resonance sinks, spending rules, Fragment conversion, or Arcane Resonance category.

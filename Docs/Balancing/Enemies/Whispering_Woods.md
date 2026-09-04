# Whispering Woods enemies

## Core Combat Stats

| Enemy | Type | HP | Basic Dmg | Attack | DEF | Crit | Crit Dmg | Block | Phys Res | Arc Res | Fire Res | Water Res | Earth Res | Air Res | Damage Immune | Status Immune |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest Wisp (forest-wisp) | Normal | 200 | 5 | 2.8 s | 8 | 5% | 150% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — | — |
| Thornling (thornling) | Normal | 240 | 8 | 2.5 s | 12 | 5% | 150% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — | — |
| Stone Root (stone-root) | Normal | 280 | 11 | 3.2 s | 12 | 5% | 150% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — | — |
| Grove Sentinel (grove-sentinel) | Normal | 320 | 15 | 2.6 s | 20 | 5% | 150% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — | — |
| Forest Heart (forest-heart) | Boss | 800 | 25 | 2.4 s | 30 | 5% | 150% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — | — |

## Traits & Patterns

| Enemy | Trait 1 | Trait 2 | Phase / Trigger | Default Pattern | Alt Pattern |
| --- | --- | --- | --- | --- | --- |
| Forest Wisp (forest-wisp) | Flicker: After Arc Spark resolves, gains Haste for 10 seconds.; Action resolves when the current action is Arc Spark -> Haste (10 s) | — | Action resolves when the current action is Arc Spark -> Haste (10 s) | Basic Attack -> Basic Attack -> Arc Spark | — |
| Thornling (thornling) | Barkskin: Basic Attack damage received is reduced by 15%.; -15% Damage taken from Basic Attack sources | — | — | Basic Attack -> Basic Attack -> Thorn Lash | — |
| Stone Root (stone-root) | Rooted Shell: Starts with Barrier equal to 15% max HP.; Combat start -> +15% of the caster's Max Health Barrier (once/encounter) | — | Combat start -> +15% of the caster's Max Health Barrier (once/encounter) | Basic Attack -> Basic Attack -> Basic Attack -> Root Slam | — |
| Grove Sentinel (grove-sentinel) | Ancient Growth: At 40% HP, gains a large Barrier once.; HP threshold when the caster's Health is below 40% -> +22.22% of the caster's Max Health Barrier (once/encounter) | — | HP threshold when the caster's Health is below 40% -> +22.22% of the caster's Max Health Barrier (once/encounter) | Basic Attack -> Basic Attack -> Root Crush -> Basic Attack -> Verdant Guard | — |
| Forest Heart (forest-heart) | Living Core: At 50% HP, gains 15% Action speed once.; HP threshold when the caster's Health is below 50% -> Haste (once/encounter) | — | HP threshold when the caster's Health is below 50% -> Haste (once/encounter) | Basic Attack -> Basic Attack -> Heart Pulse -> Basic Attack -> Basic Attack -> Root Prison -> Basic Attack -> Basic Attack -> Basic Attack -> Rejuvenating Sap | — |

## Special Actions

| Enemy | Action | Cast | Damage | Damage Type | Status / Effect | Duration | Delay | Pattern Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Forest Wisp (forest-wisp) | Arc Spark (arc-spark) | 2 s | 240% of Basic Attack damage Arcane damage | Arcane | — | — | — | Default: step 3 |
| Thornling (thornling) | Thorn Lash (thorn-lash) | 1.8 s | 125% of Basic Attack damage Physical damage | Physical | Thorn Wound (6 s); 37.5% of Basic Attack damage Physical damage | 6 s | — | Default: step 3 |
| Stone Root (stone-root) | Root Slam (root-slam) | 2.5 s | 165% of Basic Attack damage Physical damage | Physical | +700 ms action time | — | — | Default: step 4 |
| Grove Sentinel (grove-sentinel) | Root Crush (root-crush) | 2 s | 135% of Basic Attack damage Physical damage | Physical | — | — | — | Default: step 3 |
| Grove Sentinel (grove-sentinel) | Verdant Guard (verdant-guard) | 2.5 s | — | — | +16.67% of the caster's Max Health Barrier | — | — | Default: step 5 |
| Forest Heart (forest-heart) | Heart Pulse (heart-pulse) | 2 s | 120% of Basic Attack damage Physical damage | Physical | — | — | — | Default: step 3 |
| Forest Heart (forest-heart) | Root Prison (root-prison) | 2 s | 80% of Basic Attack damage Physical damage | Physical | +1 s action time | — | — | Default: step 6 |
| Forest Heart (forest-heart) | Rejuvenating Sap (rejuvenating-sap) | 3 s | — | — | +10% of the caster's Max Health Health | — | — | Default: step 10 |

## Loot

| Enemy | Item | Min | Max | Chance | Est. Qty / Kill |
| --- | --- | --- | --- | --- | --- |
| Forest Wisp (forest-wisp) | Wisp Essence (wisp-essence) | 1 | 2 | 20% | 0.3 |
| Forest Wisp (forest-wisp) | Life Essence (life-essence) | 1 | 3 | 100% | 2 |
| Thornling (thornling) | Wisp Essence (wisp-essence) | 1 | 2 | 20% | 0.3 |
| Thornling (thornling) | Life Essence (life-essence) | 1 | 3 | 100% | 2 |
| Stone Root (stone-root) | Wisp Essence (wisp-essence) | 1 | 3 | 20% | 0.4 |
| Stone Root (stone-root) | Life Essence (life-essence) | 1 | 3 | 20% | 0.4 |
| Grove Sentinel (grove-sentinel) | Grove Bark (grove-bark) | 1 | 3 | 20% | 0.4 |
| Grove Sentinel (grove-sentinel) | Wisp Essence (wisp-essence) | 2 | 4 | 30% | 0.9 |
| Grove Sentinel (grove-sentinel) | Life Essence (life-essence) | 2 | 5 | 100% | 3.5 |
| Forest Heart (forest-heart) | Heartseed (heartseed) | 1 | 1 | 100% | 1 |
| Forest Heart (forest-heart) | Life Essence (life-essence) | 10 | 18 | 100% | 14 |

Boss mechanics are represented by the Core Combat Stats, Traits & Patterns, and Special Actions sheets above.

# Traits and special attacks

## Traits

| Trait | Used By | Trigger | Threshold | Effect | Value | Cooldown | Once? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Flicker (forest-wisp-flicker) | Forest Wisp (forest-wisp) | Action resolves when the current action is Arc Spark -> Haste (3 s) | the current action is Arc Spark | After Arc Spark resolves, gains Haste for 3 seconds.; Haste (3 s) | Haste (3 s) | — | No |
| Barkskin (thornling-barkskin) | Thornling (thornling) | — | — | Basic Attack damage received is reduced by 15%. | -15% Damage taken from Basic Attack sources | — | No |
| Rooted Shell (stone-rooted-shell) | Stone Root (stone-root) | Combat start -> +15% of the caster's Max Health Barrier (once/encounter) | — | Starts with Barrier equal to 15% max HP.; +15% of the caster's Max Health Barrier | +15% of the caster's Max Health Barrier | — | Yes |
| Ancient Growth (grove-sentinel-ancient-growth) | Grove Sentinel (grove-sentinel) | HP threshold when the caster's Health is below 40% -> +22.22% of the caster's Max Health Barrier (once/encounter) | the caster's Health is below 40% | At 40% HP, gains a large Barrier once.; +22.22% of the caster's Max Health Barrier | +22.22% of the caster's Max Health Barrier | — | Yes |
| Living Core (forest-heart-living-core) | Forest Heart (forest-heart) | HP threshold when the caster's Health is below 50% -> Haste (once/encounter) | the caster's Health is below 50% | At 50% HP, gains 15% Action speed once.; Haste | Haste | — | Yes |
| Predator Instinct (cavefang-wolf-predator-instinct) | Cavefang Wolf (cavefang-wolf) | — | — | Deals 25% more damage while the target is at or below 35% HP. | +25% Damage dealt when the opponent's Health is below 35% | — | No |
| Relentless Hunter (razorclaw-lynx-relentless-hunter) | Razorclaw Lynx (razorclaw-lynx) | — | — | Deals 20% more damage to Bleeding targets. | +20% Damage dealt when the opponent has Bleeding | — | No |
| Arcane Corruption (corrupted-dire-wolf-arcane-corruption) | Corrupted Dire Wolf (corrupted-dire-wolf) | — | — | Corruption grants 10% resistance to Fire, Water, Earth, and Air. | — | — | No |
| Thick Hide (corrupted-greatbear-thick-hide) | Corrupted Greatbear (corrupted-greatbear) | — | — | Basic Attack damage received is reduced by 20%. | -20% Damage taken from Basic Attack sources | — | No |
| Unstable Corruption (corrupted-greatbear-unstable-corruption) | Corrupted Greatbear (corrupted-greatbear) | HP threshold when the caster's Health is below 50% -> Haste; Pattern: Corrupted (once/encounter) | the caster's Health is below 50% | At 50% HP, gains Haste and shifts to the Corrupted Pattern once.; Haste; Pattern: Corrupted | Haste; Pattern: Corrupted | — | Yes |
| Brittle Bones (restless-skeleton-brittle-bones) | Restless Skeleton (restless-skeleton) | — | — | Physical damage is reduced by 25%. | — | — | No |
| Ethereal Form (grave-wraith-ethereal-form) | Grave Wraith (grave-wraith) | — | — | Physical damage is reduced by 50%; Fire, Water, Earth, and Air damage are increased by 25%. | — | — | No |
| Grave Channeling (fallen-acolyte-grave-channeling) | Fallen Acolyte (fallen-acolyte) | — | — | Below 50% HP, healing done is increased by 50%. | +50% Healing done when the caster's Health is below 50% | — | No |
| Arcane Remnant (archmage-edrin-arcane-remnant) | Archmage Edrin's Shade (archmage-edrin-shade) | — | — | Resists Fire, Water, Earth, and Air damage by 15%. | — | — | No |
| Unbound Spirit (archmage-edrin-unbound-spirit) | Archmage Edrin's Shade (archmage-edrin-shade) | HP threshold when the caster's Health is below 50% -> Haste; Pattern: Unbound (once/encounter) | the caster's Health is below 50% | At 50% HP, gains Haste and shifts to the Unbound Pattern once.; Haste; Pattern: Unbound | Haste; Pattern: Unbound | — | Yes |

## Special Actions

| Action | Used By | Cast | Damage | Type | Status | Duration | Other Effect | Pattern Position |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arc Spark (arc-spark) | Forest Wisp (forest-wisp) | 2 s | 240% of Basic Attack damage Arcane damage | Arcane | — | — | — | Default: step 3 |
| Thorn Lash (thorn-lash) | Thornling (thornling) | 1.8 s | 125% of Basic Attack damage Physical damage | Physical | Thorn Wound (6 s); 37.5% of Basic Attack damage Physical damage | 6 s | Thorn Wound (6 s); 37.5% of Basic Attack damage Physical damage | Default: step 3 |
| Root Slam (root-slam) | Stone Root (stone-root) | 2.5 s | 165% of Basic Attack damage Physical damage | Physical | +700 ms action time | — | +700 ms action time | Default: step 4 |
| Root Crush (root-crush) | Grove Sentinel (grove-sentinel) | 2 s | 135% of Basic Attack damage Physical damage | Physical | — | — | — | Default: step 3 |
| Verdant Guard (verdant-guard) | Grove Sentinel (grove-sentinel) | 2.5 s | — | — | +16.67% of the caster's Max Health Barrier | — | +16.67% of the caster's Max Health Barrier | Default: step 5 |
| Heart Pulse (heart-pulse) | Forest Heart (forest-heart) | 2 s | 120% of Basic Attack damage Physical damage | Physical | — | — | — | Default: step 3 |
| Root Prison (root-prison) | Forest Heart (forest-heart) | 2 s | 80% of Basic Attack damage Physical damage | Physical | +1 s action time | — | +1 s action time | Default: step 6 |
| Rejuvenating Sap (rejuvenating-sap) | Forest Heart (forest-heart) | 3 s | — | — | +10% of the caster's Max Health Health | — | +10% of the caster's Max Health Health | Default: step 10 |
| Pounce (pounce) | Cavefang Wolf (cavefang-wolf) | 1.4 s | 150% of Basic Attack damage Physical damage | Physical | +500 ms action time | — | +500 ms action time | Default: step 3 |
| Rending Claws (rending-claws) | Razorclaw Lynx (razorclaw-lynx) | 1.3 s | 125% of Basic Attack damage Physical damage | Physical | Bleeding (8 s); 36.25% of Basic Attack damage Physical damage | 8 s | Bleeding (8 s); 36.25% of Basic Attack damage Physical damage | Default: step 2 |
| Arcane Bite (arcane-bite) | Corrupted Dire Wolf (corrupted-dire-wolf) | 1.6 s | 70% of Basic Attack damage Physical damage + 70% of Basic Attack damage Arcane damage | Physical + Arcane | — | — | — | Default: step 2 |
| Corrupted Howl (corrupted-howl) | Corrupted Dire Wolf (corrupted-dire-wolf) | 1.8 s | — | — | Haste (6 s) | 6 s | Haste (6 s) | Default: step 5 |
| Crushing Maul (crushing-maul) | Corrupted Greatbear (corrupted-greatbear) | 1.8 s | 155% of Basic Attack damage Physical damage | Physical | — | — | — | Default: step 3; Corrupted: step 3 |
| Groundbreaker (groundbreaker) | Corrupted Greatbear (corrupted-greatbear) | 2.5 s | 120% of Basic Attack damage Physical damage | Physical | +1.2 s action time | — | +1.2 s action time | Default: step 5 |
| Corrupted Roar (corrupted-roar) | Corrupted Greatbear (corrupted-greatbear) | 2.2 s | — | — | Vulnerable | 6 s | Vulnerable | Corrupted: step 2 |
| Arcane Rampage (arcane-rampage) | Corrupted Greatbear (corrupted-greatbear) | 3.5 s | 200% of Basic Attack damage Arcane damage | Arcane | — | — | — | Corrupted: step 6 |
| Bone Cleaver (bone-cleaver) | Restless Skeleton (restless-skeleton) | 2.2 s | 185% of Basic Attack damage Physical damage | Physical | — | — | — | Default: step 3 |
| Chilling Touch (chilling-touch) | Grave Wraith (grave-wraith) | 1.8 s | 130% of Basic Attack damage Water damage | Water | Chilled | 5 s | Chilled | Default: step 2 |
| Fade (fade) | Grave Wraith (grave-wraith) | 1.7 s | — | — | Spectral Fade (5 s) | 5 s | Spectral Fade (5 s) | Default: step 5 |
| Grave Bolt (grave-bolt) | Fallen Acolyte (fallen-acolyte) | 1.5 s | 150% of Basic Attack damage Arcane damage | Arcane | — | — | — | Default: step 1 |
| Soul Drain (soul-drain) | Fallen Acolyte (fallen-acolyte) | 2.2 s | 112.5% of Basic Attack damage Arcane damage | Arcane | +9% of the caster's Max Health Health | — | +9% of the caster's Max Health Health | Default: step 3 |
| Death Ward (death-ward) | Fallen Acolyte (fallen-acolyte) | 2 s | — | — | +20.5% of the caster's Max Health Barrier | — | +20.5% of the caster's Max Health Barrier | Default: step 6 |
| Gravefire (gravefire) | Archmage Edrin's Shade (archmage-edrin-shade) | 1.8 s | 140% of Basic Attack damage Fire damage | Fire | Burning (5 s); 25% of Basic Attack damage Fire damage | 5 s | Burning (5 s); 25% of Basic Attack damage Fire damage | Default: step 1; Unbound: step 2 |
| Frostbind (frostbind) | Archmage Edrin's Shade (archmage-edrin-shade) | 2 s | 120% of Basic Attack damage Water damage | Water | Chilled | 5 s | Chilled | Default: step 3; Unbound: step 3 |
| Arcane Ward (arcane-ward) | Archmage Edrin's Shade (archmage-edrin-shade) | 2.2 s | — | — | +5.4% of the caster's Max Health Barrier | — | +5.4% of the caster's Max Health Barrier | Default: step 4 |
| Soul Drain (soul-drain) | Archmage Edrin's Shade (archmage-edrin-shade) | 2.4 s | 120% of Basic Attack damage Arcane damage | Arcane | +2.3% of the caster's Max Health Health | — | +2.3% of the caster's Max Health Health | Default: step 6; Unbound: step 4 |
| Final Incantation (final-incantation) | Archmage Edrin's Shade (archmage-edrin-shade) | 4.5 s | 350% of Basic Attack damage Arcane damage | Arcane | — | — | — | Unbound: step 6 |

# Combat

Shared combat rules and authored combat values live here. Monster-specific values belong to dungeon pages.

## Values

| Setting | Value |
| --- | --- |
| Player: Max Health | 100 |
| Player: Health Regen Per Second | 1 |
| Player: Health Regen Interval Ms | 1000 |
| Player: Out Of Combat Regen Multiplier | 2 |
| Player: Basic Attack Damage | 5 |
| Player: Basic Attack Interval Ms | 2200 |
| Player: Base Spell Power | 50 |
| Player: Base Defense | 5 |
| Player: Base Crit Chance | 0.05 |
| Player: Base Crit Damage | 1.5 |
| Mana: Starting Mana | 0 |
| Mana: Max Mana | 100 |
| Channeling: Base Natural Regen Per Second | 0 |
| Channeling: Echo Focus Cost | 10 |
| Channeling: Echo Mana Per Second | 5 |
| Channeling: Max Echoes | 5 |
| Channeling: Discovery Echo Multiplier | 1.1 |
| Channeling: Stable Leyline Regen Bonus | 1 |
| Channeling: Stable Leyline Threshold | 2500 |
| Channeling: Echo Resonance Duration Ms | 120000 |
| Channeling: Deep Reservoir Threshold | 225 |
| Channeling: Deep Reservoir Capacity Bonus | 25 |
| Focus: Starting Max | 100 |
| Focus: Forest Heart Bonus | 10 |
| Focus: Guild Apprentice Bonus | 10 |
| Research: Max Prepared Slots | 4 |
| Research: Max Echoes | 5 |
| Research: Echo Focus Cost | 10 |
| Research: Mana Cost Per Item | 30 |
| Research: Duration Per Item Ms | 10000 |
| Research: Matching XP | 12 |
| Research: Non Matching XP | 8 |
| Transmutation: Echo Focus Cost | 10 |
| Transmutation: Max Echoes | 5 |
| Dungeon: Encounter Delay Ms | 5000 |
| Dungeon: Whispering Woods Threat Required | 20 |
| School Progression: Starting Cap | 20 |
| School Progression: Tutorial Complete Cap | 40 |

## Combat bounds

| Rule | Value | Notes |
| --- | --- | --- |
| Resistance floor | -100% | Shared rule |
| Resistance cap | +75% | Shared rule |
| Defense curve | 100 | Shared rule |

## Damage types

| Type | Meaning |
| --- | --- |
| Physical | Physical damage |
| Arcane | Arcane damage |
| Fire | Fire damage |
| Water | Water damage |
| Earth | Earth damage |
| Air | Air damage |

## Status effects

| Status | Class | Duration | Max stacks | Effects | Description |
| --- | --- | --- | --- | --- | --- |
| Burning (burning) | Debuff | 5 s | — | 5 Fire damage | Takes Fire damage over time. |
| Quickening (quickening) | Buff | 6 s | — | — | Basic Attacks resolve 25% faster. |
| Haste (haste) | Buff | Indefinite | — | — | Action speed increased by 15%. |
| Spectral Fade (spectral-fade) | Buff | 5 s | — | — | Damage taken is reduced by 25%. |
| Thorn Wound (thorn-wound) | Debuff | 6 s | — | 3 Physical damage | Thorns deal physical damage over time. |
| Bleeding (bleeding) | Debuff | 8 s | — | 4 Physical damage | Takes Physical damage over time. |
| Chilled (chilled) | Debuff | 5 s | — | — | Basic Attacks and Action cadence are 20% slower. |
| Regeneration (regeneration) | Buff | 6 s | — | +5 Health | Restores Health over time. |
| Fortified (fortified) | Buff | 8 s | — | — | Damage taken is reduced by 15%. |
| Shock (shock) | Debuff | 8 s | 5 | — | Each stack increases Air damage taken by 4%. |
| Staggered (staggered) | Debuff | 1 s | — | — | Recently suffered a stagger. |
| Vulnerable (vulnerable) | Debuff | 6 s | — | — | Damage taken is increased by 15%. |
| Purified (purified) | Buff | 4 s | — | — | Incoming control and debuff durations are reduced by 50%. |
| Stunned (stunned) | Debuff | 3 s | — | — | Cannot start or resolve normal actions. |

## Shared traits

| Trait | Description | Rules |
| --- | --- | --- |
| Flicker (forest-wisp-flicker) | After Arc Spark resolves, gains Haste for 10 seconds. | Action resolves when the current action is Arc Spark -> Haste (10 s) |
| Barkskin (thornling-barkskin) | Basic Attack damage received is reduced by 15%. | — |
| Rooted Shell (stone-rooted-shell) | Starts with Barrier equal to 15% max HP. | Combat start -> +15% of the caster's Max Health Barrier (once/encounter) |
| Ancient Growth (grove-sentinel-ancient-growth) | At 40% HP, gains a large Barrier once. | HP threshold when the caster's Health is below 40% -> +22.22% of the caster's Max Health Barrier (once/encounter) |
| Living Core (forest-heart-living-core) | At 50% HP, gains 15% Action speed once. | HP threshold when the caster's Health is below 50% -> Haste (once/encounter) |
| Predator Instinct (cavefang-wolf-predator-instinct) | Deals 25% more damage while the target is at or below 35% HP. | — |
| Relentless Hunter (razorclaw-lynx-relentless-hunter) | Deals 20% more damage to Bleeding targets. | — |
| Arcane Corruption (corrupted-dire-wolf-arcane-corruption) | Corruption grants 10% resistance to Fire, Water, Earth, and Air. | — |
| Thick Hide (corrupted-greatbear-thick-hide) | Basic Attack damage received is reduced by 20%. | — |
| Unstable Corruption (corrupted-greatbear-unstable-corruption) | At 50% HP, gains Haste and shifts to the Corrupted Pattern once. | HP threshold when the caster's Health is below 50% -> Haste; Pattern: Corrupted (once/encounter) |
| Brittle Bones (restless-skeleton-brittle-bones) | Physical damage is reduced by 25%. | — |
| Ethereal Form (grave-wraith-ethereal-form) | Physical damage is reduced by 50%; Fire, Water, Earth, and Air damage are increased by 25%. | — |
| Grave Channeling (fallen-acolyte-grave-channeling) | Below 50% HP, healing done is increased by 50%. | — |
| Arcane Remnant (archmage-edrin-arcane-remnant) | Resists Fire, Water, Earth, and Air damage by 15%. | — |
| Unbound Spirit (archmage-edrin-unbound-spirit) | At 50% HP, gains Haste and shifts to the Unbound Pattern once. | HP threshold when the caster's Health is below 50% -> Haste; Pattern: Unbound (once/encounter) |

## Formula notes

Direct damage resolves magnitude, modifiers, Crit, Defense, resistance, and Block before Barrier and Health. Damage over Time does not roll direct-hit Crit or Block.

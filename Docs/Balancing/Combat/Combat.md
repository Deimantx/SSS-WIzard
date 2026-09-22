# Combat

Shared combat rules and authored combat values live here. Monster-specific values belong to dungeon pages.

## Values

| Setting | Value |
| --- | --- |
| Player: Max Health | 100 |
| Player: Health Regen Per Second | 1 |
| Player: Health Regen Interval Ms | 1000 |
| Player: Out Of Combat Regen Multiplier | 2 |
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
| Dungeon: Whispering Woods Threat Required | 5000 |
| School Progression: Starting Cap | 20 |
| School Progression: Tutorial Complete Cap | 40 |

## Combat bounds

| Rule | Value | Notes |
| --- | --- | --- |
| Resistance floor | -100% | Shared rule |
| Resistance cap | +75% | Shared rule |
| Defense curve | 300 | Shared rule |

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
| Kindled (kindled) | Debuff | 18 s | — | — | Takes 25% more Fire damage. |
| Frozen (frozen) | Debuff | 4 s | — | — | All action speed is reduced by 50%. |
| Healing Tide (healing-tide) | Buff | 6 s | — | +5 Health | Restores Health over time. |
| Earth Fracture (earth-fracture) | Debuff | 3 s | — | 1 Earth damage | Takes Earth damage over time. |
| Stone Skin (stone-skin) | Buff | 10 s | — | — | Defense increased by 20%. |
| Hardened (hardened) | Buff | 5 s | — | — | Damage taken is reduced by 25%. |
| Rend Armor (rend-armor) | Debuff | 10 s | — | — | Defense reduced by 20%. |
| Tremored (tremored) | Debuff | 5 s | — | — | All enemy action speed is reduced by 25%. |
| Gust (gust) | Buff | 6 s | — | — | The next Spell cast resolves 30% faster. |
| Tailwind (tailwind) | Buff | 10 s | — | — | Action speed increased by 25%. |
| Static Charge (static) | Buff | 10 s | — | — | The next damaging Air Spell deals 75% more damage. |
| Eye of the Storm (eye-of-the-storm) | Buff | 10 s | — | — | Cooldown recovery, critical chance, and action speed increased by 10%. |
| Living Mountain (living-mountain) | Buff | 14 s | — | — | Defense increased by 25% and damage taken reduced by 30%. |
| Quickening (quickening) | Buff | 6 s | — | — | Basic Attacks resolve 25% faster. |
| Haste (haste) | Buff | Indefinite | — | — | All action cadence is increased by 15%. |
| Spectral Fade (spectral-fade) | Buff | 5 s | — | — | Damage taken is reduced by 25%. |
| Thorn Wound (thorn-wound) | Debuff | 6 s | — | 3 Physical damage | Thorns deal physical damage over time. |
| Bleeding (bleeding) | Debuff | 8 s | — | 4 Physical damage | Takes Physical damage over time. |
| Chilled (chilled) | Debuff | 5 s | — | — | Action cadence is reduced by 20%. |
| Regeneration (regeneration) | Buff | 6 s | — | +5 Health | Restores Health over time. |
| Fortified (fortified) | Buff | 8 s | — | — | Damage taken is reduced by 15%. |
| Shock (shock) | Debuff | 8 s | 5 | — | Each stack increases Air damage taken by 4%. |
| Staggered (staggered) | Debuff | 1 s | — | — | Recently suffered a stagger. |
| Vulnerable (vulnerable) | Debuff | 6 s | — | — | Damage taken is increased by 15%. |
| Purified (purified) | Buff | 4 s | — | — | Incoming control and debuff durations are reduced by 50%. |
| Stunned (stunned) | Debuff | 3 s | — | — | Cannot start or resolve normal actions. |
| Entangled (entangled) | Debuff | 5 s | — | — | Action cadence is reduced by 20%. |
| Poisoned (poisoned) | Debuff | 8 s | — | 5 Physical damage | Takes Physical damage over time. |
| Cursed (cursed) | Debuff | 8 s | — | — | Deals 10% less damage and receives 15% less healing. |
| Fragile (fragile) | Debuff | 6 s | — | — | Defense is reduced and damage taken is increased. |
| Silenced (silenced) | Debuff | 3 s | — | — | Cannot cast Spells. |
| Corruption (corruption) | Debuff | 10 s | 5 | — | Each stack increases damage taken by 3%. |
| Arcane Disruption (arcane-disruption) | Debuff | 6 s | — | — | Mana regeneration is reduced by 20% and cooldown recovery by 15%. |

## Shared traits

| Trait | Description | Rules |
| --- | --- | --- |
| Flickering Current (forest-wisp-flicker) | While Haste is active, deals 15% more Arcane damage. | — |
| Barkskin (thornling-barkskin) | Starts combat Fortified for 8 seconds. | Combat start -> Fortified (8 s) (once/encounter) |
| Rooted Shell (stone-rooted-shell) | Starts combat with Barrier equal to 15% max HP. | Combat start -> +15% of the caster's Max Health Barrier (once/encounter) |
| Ancient Growth (grove-sentinel-ancient-growth) | At 40% HP, gains a large Barrier once. | HP threshold when the caster's Health is below 40% -> +22.22% of the caster's Max Health Barrier (once/encounter) |
| Living Core (forest-heart-living-core) | At 50% Health, gains Haste and changes to the Overgrown Pattern. | HP threshold when the caster's Health is below 50% -> Haste; Pattern: Overgrown (once/encounter) |
| Predator Instinct (cavefang-wolf-predator-instinct) | Deals 25% more damage while the target is at or below 35% HP. | — |
| Relentless Hunter (razorclaw-lynx-relentless-hunter) | Deals 20% more damage to Bleeding targets. | — |
| Arcane Corruption (corrupted-dire-wolf-arcane-corruption) | Corruption grants 10% resistance to Fire, Water, Earth, and Air. | — |
| Thick Hide (corrupted-greatbear-thick-hide) | Takes 12% less damage while above 50% Health. | — |
| Unstable Corruption (corrupted-greatbear-unstable-corruption) | At 50% Health, gains Haste and switches to the Corrupted Pattern. | HP threshold when the caster's Health is below 50% -> Haste; Pattern: Corrupted (once/encounter) |
| Brittle Bones (restless-skeleton-brittle-bones) | Physical damage is reduced by 25%. | — |
| Ethereal Form (grave-wraith-ethereal-form) | Physical damage is reduced by 50%; Fire, Water, Earth, and Air damage are increased by 25%. | — |
| Grave Channeling (fallen-acolyte-grave-channeling) | Below 50% HP, healing done is increased by 50%. | — |
| Arcane Remnant (archmage-edrin-arcane-remnant) | Resists Fire, Water, Earth, and Air damage by 15%. | — |
| Unbound Spirit (archmage-edrin-unbound-spirit) | At 50% Health, gains Haste and shifts to the Unbound Pattern. | HP threshold when the caster's Health is below 50% -> Haste; Pattern: Unbound (once/encounter) |
| Drowned Devotion (drowned-acolyte-devotion) | Receives 10% more Barrier. | — |
| Reliquary Slime Engulf (reliquary-slime-engulf) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Mist Wraith Fade (mist-wraith-fade) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Rune Leech Siphon (rune-leech-siphon) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Cinder Hound Flameblood (cinder-hound-flameblood) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Ash Cultist Fan (ash-cultist-fan) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Fire Elemental Emberheart (fire-elemental-emberheart) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Lava Eel Molten Hide (lava-eel-molten-hide) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Thorn Maw Venom (thorn-maw-venom) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Rootbound Stalker Ambush (rootbound-stalker-ambush) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Briar Sprite Bloom (briar-sprite-bloom) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Moss Carapace Regrowth (moss-carapace-regrowth) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Ruin Pressure (remnant-marauder-pressure) | Deals 15% more damage to Vulnerable targets. | — |
| Arcane Binder Binding (arcane-binder-binding) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Broken Construct Ward (broken-construct-ward) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Rift Archer Precision (rift-archer-precision) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Graveglass Shade Cursed (graveglass-shade-cursed) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Bone Shardling Brittle (bone-shardling-brittle) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Last Mourning (silent-mourner-fade) | At 35% health, gains Spectral Fade once. | HP threshold when the caster's Health is below 35% -> Spectral Fade (once/encounter) |
| Crypt Guardian Ward (crypt-guardian-ward) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Volt Wisp Static (volt-wisp-static) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Static Armor Ward (static-armor-ward) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Gale Scribe Acceleration (gale-scribe-acceleration) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Charged Seeker Twin Arc (charged-seeker-twin-arc) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Starbound Eye Gaze (starbound-eye-gaze) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Astral Husk Weight (astral-husk-weight) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Orbiting Fragment Ward (orbiting-fragment-ward) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Lenskeeper Disruption (lenskeeper-disruption) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Meridian Warden Ward (meridian-warden-ward) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Fractured Channeler Split (fractured-channeler-split) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Arc Surge Vulnerability (arc-surge-vulnerability) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Linebreaker Disruption (linebreaker-disruption) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Name Eater Silence (name-eater-silence) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Bound Echo Repetition (bound-echo-repetition) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Hollow Liturgist Curse (hollow-liturgist-curse) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Whisper Archivist Erasure (whisper-archivist-erasure) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Sigil Guardian Ward (sigil-guardian-ward) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Black Seal Parasite Corruption (black-seal-parasite-corruption) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Vault Devourer Regrowth (vault-devourer-regrowth) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Inkbound Specter Curse (inkbound-specter-curse) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Gatebound Remnant Cleave (gatebound-remnant-cleave) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Black Rift Stalker Corruption (black-rift-stalker-corruption) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Portalbound Acolyte Mute (portalbound-acolyte-mute) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |
| Sealbreaker Construct Ward (sealbreaker-construct-ward) | A distinct Act 1 combat trait shaping this creature’s behavior. | — |

## Formula notes

Direct damage resolves magnitude, modifiers, Crit, Defense, resistance, and Block before Barrier and Health. Damage over Time does not roll direct-hit Crit or Block.

## World Tier loot rule

Monster and boss loot tables author the WT1/base material quantity and drop chance. World Tier does not change the authored chance; when a material drop succeeds, its rolled quantity is multiplied by the encounter World Tier material-loot multiplier. The canonical WT1-WT5 values and unlock policy are documented in [World Tiers](World_Tiers.md).

# Phase 5B — First Frontier Gameplay Rework

## Scope

Phase 5B makes the First Frontier's Howling Den and Abandoned Catacombs distinct gameplay surfaces while preserving Whispering Woods and existing authored loot/progression values.

## Howling Den

- Remains a targeted Elite Zone with six normal targets and the existing Corrupted Greatbear boss.
- Keeps the existing 25 Threat requirement and Auto Hunt Boss behavior.
- Adds Bonehide Boar, Moonblind Jackal, and Den Stalker with authored action patterns, resonance, and the shared Howling Den normal loot table.
- Adds the generic encounter-only Elite Zone Affixes Vicious, Frenzied, Warded, Armored, Relentless, and Regenerative. Howling Den owns the Frenzied Zone Affix globally for all normal encounters; it is supplied at the combat runtime boundary, shown in location/loot/enemy UI, and excluded from intrinsic Bestiary traits and Power V1.

## Abandoned Catacombs

- Uses the generic `sequence` encounter mode and deterministically runs Restless Skeleton, Grave Wraith, Fallen Acolyte, then Archmage Edrin's Shade.
- Threat, target selection, and Auto Hunt are not used. Player resources and encounter-local statuses/cooldowns carry between encounters.
- A successful Edrin clear performs the existing first-chapter progression: Black Portal Shard, Dark Portal, World Tier 2, Elemental Scar, and Magic School Cap Increase.
- Death and leave reset the sequence. Completion clears active combat and the sequence index while preserving player resources.

## Persistence and simulation

- Save version 42 adds nullable `combat.dungeonSequenceIndex`.
- Legacy active Catacombs saves infer the sequence step from the active enemy or legacy Threat; malformed indices are repaired and non-sequence dungeons clear the field.
- Live simulation, Offline Bank, and Fast Resolve share the same deterministic spawn/finish path and stop correctly at sequence completion.

## Explicit non-scope

No new items, no new loot tables, no final balance pass, no Phase 5C content, and no new Power V1 affix math were added.

# Phase 5B — First Frontier Gameplay Rework

## Scope

Phase 5B makes the First Frontier's Howling Den and Abandoned Catacombs distinct gameplay surfaces while preserving Whispering Woods and existing authored loot/progression values.

## Howling Den

- Remains a targeted Elite Zone with six normal targets and the existing Corrupted Greatbear boss.
- Uses a 10,000 WT1/base Threat requirement with Power-based Threat gain and the shared Auto Hunt Boss behavior. World Tier scales the requirement by the authored x1-x5 Boss Threat multiplier.
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

## Phase 5B.2 UI cleanup

- Consolidated Zone Boss identity, Power, Threat progress, remaining kills, and Auto Hunt into the World Navigation location inspector; the top Combat Run Bar now carries only current-run context and Leave.
- Compacted World Navigation spacing, Region controls, and the embedded WT1–WT5 row without changing gameplay, progression, or save data.

## Phase 5B.3 - Power-based Threat and scaled Boss access

- Finalized targeted Combat and Elite Zones award normal-kill Threat equal to the defeated enemy's current encounter World Tier Power. Target switching preserves the existing run meter; sequence Dungeons remain at zero Threat and unfinished random-pool Locations retain +1 Threat.
- Whispering Woods and Howling Den use WT1/base requirements of 5,000 and 10,000 Threat. The canonical requirement resolver applies World Tier Boss Threat multipliers of x1 through x5 for WT1 through WT5, while legacy/random-pool requirements remain static.
- Threat is capped at the resolved requirement. Boss readiness uses the `before < requirement && after >= requirement` crossing, so variable Power gains can overshoot safely and Auto Hunt queues on the same kill.
- Save schema v43 proportionally migrates active pre-v43 targeted runs from historical 20/25 kill-count thresholds into the new World Tier-resolved point thresholds; legacy random-pool and sequence state remains unchanged.

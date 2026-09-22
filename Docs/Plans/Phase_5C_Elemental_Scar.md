# Phase 5C - Elemental Scar Gameplay Rework

## Status

Implemented as the first full post-tutorial region pass. This phase stops before Phase 5D.

## Region structure

Elemental Scar now has no random-pool locations:

- Fractured Approach - sequence Dungeon: Rift Wolf, Arcane Scavenger, Withered Watcher, Warded Husk, then Corrupted Elemental Gatekeeper.
- Flooded Reliquary - targeted Combat Zone.
- Ashen Watch - targeted Combat Zone.
- Rootscar Hollow - targeted Combat Zone.
- Crossroads of Ruin - sequence Dungeon: Arcane Binder, Rift Archer, Remnant Marauder, Broken Construct, then Crossroads Keeper.

Fractured Approach previews Summoning, Flooded Reliquary, Ashen Watch, and Rootscar Hollow on first clear. Crossroads of Ruin previews Shattered Meridian.

## Targeted zone rules

Each elemental Combat Zone has exactly seven selectable normal targets, one boss, target-specific Loot and Bestiary data, Auto Hunt support, and World Tier scaling. The World Tier requirement is resolved centrally from the zone base of 20,000 Threat: WT1 20,000, WT2 40,000, WT3 60,000, WT4 80,000, and WT5 100,000.

Threat gained from a normal kill is the captured encounter-tier enemy Power. Sequence Dungeons grant no Threat. A targeted zone cannot start a normal encounter without a valid Hunt Target; it does not silently fall back to a random pool.

## New monsters

The nine new normal Monster IDs are authored through the existing Act 1 monster factory and use the existing generic Dungeon loot path:

- Water: tidefang-serpent, brinebound-sentinel, abyssal-archivist.
- Fire: emberwing-harrier, charred-warden, pyre-colossus.
- Earth: sporeback-brute, vinebound-reaver, scarwood-behemoth.

Each new normal has two special actions. No new item or monster-material IDs were added.

## Resonance

All seven normal targets and the boss in Flooded Reliquary yield Water Resonance. Ashen Watch yields Fire Resonance, and Rootscar Hollow yields Earth Resonance. Fractured Approach and Crossroads of Ruin do not gain Resonance additions.

## Persistence

Save version advances from v43 to v44. The migration preserves active Elemental Scar progress by converting legacy 40-kill Threat into the new World Tier-scaled point requirement, restores the valid target, and infers sequence position for the two converted Dungeons. v44 targeted runs preserve target and partial Threat; v44 sequence runs preserve sequence index.

## Validation

Focused coverage includes dungeon ownership and sequences, world navigation metadata, Resonance authoring, Power Threat, targeted spawn safety, structured Dungeons, and v43 save migration. Balancing documents are regenerated from runtime content and checked for coverage.

## Non-goals

This phase does not begin Phase 5D, add a new loot system, add new materials, add Elemental Zone Affixes, or replace the existing Act 1 monster factory.

# Phase 5A World Skeleton

This document describes the player-facing world organization introduced in Phase 5A. It is a navigation/content layer over the existing `DungeonId`, `DUNGEONS`, `enterDungeon()`, threat, and boss-progression systems. The legacy `act0` and `act1` source folders remain internal organization for now.

## Continent I

The current world has one continent and four ordered regions:

1. First Frontier — always available
2. Elemental Scar — unlocks after Archmage Edrin's Shade
3. Shattered Meridian — unlocks after Crossroads Keeper
4. Black Sigil Reach — unlocks after Meridian Splitter

Every current gameplay-backed location appears exactly once in these regions. Five locations are Combat Zones, five are Elite Zones, and five are Dungeons. Special Zone and Tower remain supported content types but have no current locations.

## Location classification

| Region | Location | Player-facing type |
| --- | --- | --- |
| First Frontier | Whispering Woods | Combat Zone |
| First Frontier | Howling Den | Elite Zone |
| First Frontier | Abandoned Catacombs | Dungeon |
| Elemental Scar | Fractured Approach | Dungeon |
| Elemental Scar | Flooded Reliquary | Combat Zone |
| Elemental Scar | Ashen Watch | Combat Zone |
| Elemental Scar | Rootscar Hollow | Combat Zone |
| Elemental Scar | Crossroads of Ruin | Dungeon |
| Shattered Meridian | Graveglass Hollow | Elite Zone |
| Shattered Meridian | Stormvault Gallery | Combat Zone |
| Shattered Meridian | Starfallen Observatory | Elite Zone |
| Shattered Meridian | The Broken Meridian | Dungeon |
| Black Sigil Reach | Hall of Unbound Names | Elite Zone |
| Black Sigil Reach | Vault of the Black Sigil | Elite Zone |
| Black Sigil Reach | The Black Gate | Dungeon |

Classification does not imply a new encounter implementation. Whispering Woods remains the targeted baseline. Reclassified locations retain their existing random-pool behavior until a later Region gameplay phase.

## Intended progression spine

The navigation skeleton records the intended major route without implementing future systems:

```text
Abandoned Catacombs → Archmage Edrin's Shade
  → Black Portal Shard I → Dark Portal → World Tier 2 → Elemental Scar
Fractured Approach → Corrupted Elemental Gatekeeper
Crossroads of Ruin → Crossroads Keeper → future Crystals milestone
The Broken Meridian → Meridian Splitter → future Alchemy milestone
The Black Gate → Black Gatekeeper → future progression / Portal Shard II / WT3 candidate
```

Crystals, Alchemy, Special Zones, Towers, new rosters, and final balance are intentionally outside Phase 5A.

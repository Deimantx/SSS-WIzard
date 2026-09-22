# Phase 5D - Shattered Meridian Gameplay Rework

## Status

Implemented. This phase completes the Shattered Meridian content pass and maps its progression into the existing World Navigation, Combat, Resonance, loot, Bestiary, and save systems.

## Region structure

Shattered Meridian is unlocked by Crossroads Keeper and contains:

| Location | Mode | Affix | Normal targets | Boss |
| --- | --- | --- | ---: | --- |
| Graveglass Hollow | Targeted Elite Zone | Warded | 7 | Graveglass Behemoth |
| Stormvault Gallery | Targeted Combat Zone | None | 7 | Storm Archivist |
| Starfallen Observatory | Targeted Elite Zone | Relentless | 7 | Fallen Astromancer |
| The Broken Meridian | Sequence Dungeon | None | 4 | Meridian Splitter |

The three targeted locations use the existing Hunt Target cards, Bestiary links, target Loot context, Auto Hunt behavior, and Elite Zone affix presentation. They do not fall back to random encounters. The Broken Meridian sequence is authored as:

```text
Meridian Warden -> Fractured Channeler -> Arc Surge Horror -> Linebreaker Shade -> Meridian Splitter
```

## New monsters and authored behavior

Exactly nine normal Monster IDs were added:

- Graveglass Hollow: `epitaph-weaver`, `tombglass-reaver`, `ossuary-oracle`.
- Stormvault Gallery: `thundercoil-serpent`, `stormbound-curator`, `tempest-engine`.
- Starfallen Observatory: `comet-wraith`, `voidglass-custodian`, `zenith-horror`.

Each uses the existing Act 1 monster factory, two authored special actions, and the generic `withDungeonLoot(dungeonId, 'normal')` path. Existing monsters, bosses, boss loot, materials, currencies, and equipment are preserved; no finished Equipment or new normal loot IDs were added.

## Resonance

Existing monsters and bosses keep their authored definitions while Shattered Meridian profiles are extended as follows:

- Graveglass Hollow progresses through Water and Earth Resonance, ending at boss yield Earth 90 / Water 70.
- Stormvault Gallery yields Air Resonance, ending at boss yield Air 150.
- Starfallen Observatory progresses through Air and Fire Resonance, ending at boss yield Fire 80 / Air 80.
- Broken Meridian normal and boss encounters remain Resonance-free.

World Tier reward scaling continues to use the canonical resolver.

## Threat and World Tier progression

The three targeted zones have a canonical `threatRequired` base of 30,000. The existing World Tier multiplier resolves requirements as:

```text
WT1 30,000 | WT2 60,000 | WT3 90,000 | WT4 120,000 | WT5 150,000
```

World Tier unlock evidence is centralized in `WORLD_TIER_UNLOCK_BOSS_BY_TIER`:

```text
WT2 Archmage Edrin's Shade
WT3 Crossroads Keeper
WT4 Meridian Splitter
WT5 Black Gatekeeper
```

Boss kills unlock a newly reached tier and emit one runtime notification. Migration only reconciles durable evidence and emits no notifications. Existing Black Sigil progression rules remain otherwise unchanged.

Crossroads of Ruin previews Shattered Meridian and WT3 on first clear. The Broken Meridian previews Black Sigil Reach, WT4, and Act 1 Artifact Levels 8-10.

## Persistence

Save version advances exactly once from v44 to v45. The migration:

- converts Broken Meridian to its authored sequence using the active normal enemy or final boss evidence, while an empty encounter starts at sequence index 0;
- clears sequence Threat, target, and pending-boss state without starting a new encounter;
- converts legacy Shattered targeted Threat from the old 50-point boss threshold into the current WT-resolved requirement, clamped to the new requirement;
- restores a valid active target for targeted Shattered runs, never a boss, and preserves a valid pending boss;
- reconciles World Tier from boss-kill evidence without lowering valid current/highest access;
- preserves Catacombs and previous sequence migration behavior.

## Validation

Focused coverage includes navigation metadata and first-clear previews, seven-target ownership, affixes, no-fallback and target repetition, Power Threat requirements and WT multipliers, Resonance, generic loot scaling, Broken Meridian sequence/offline parity, World Tier mapping/unlock behavior, and v44/v45 migration round trips. Balancing documentation is regenerated from runtime content and checked with balancing coverage.

## Non-goals

This phase does not add new normal loot IDs, a parallel loot/crafting path, bespoke Shattered UI, a new Elite Affix system, or a Black Sigil progression rewrite.

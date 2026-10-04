# Combat Progression Phase 01C Audit ? Final Structure

## Approved baseline

Phase 01C is the structural baseline for Phase 02. The authored build has **33 locations**, **220 monsters** (190 normals and 30 bosses), **20 Combat Zones**, **5 Hunting Grounds**, **5 primary Dungeons**, and **3 Specials**. Stormspire Monastery is the T5 Air Combat Zone; Scalding Rift is a T5 Special; Nullstone Archive remains the Arcane T5 Special. No Phase 02 numerical balancing is included here.

## Final T1-T5 matrix

| Tier | Fire | Earth | Air | Water | Hunting Ground | Primary Dungeon |
|---|---|---|---|---|---|---|
| T1 | Emberfall Basin | Stonewake Hollow | Galecrest Heights | Tideglass Caverns | Gloamridge | Abandoned Catacombs |
| T2 | Cinderwild Expanse | Whispering Woods | Skybreak Cliffs | Brineveil Marsh | Mistclaw Highlands | Fractured Approach |
| T3 | Ashen Watch | Rootscar Hollow | Runeblight Expanse | Flooded Reliquary | Cinderhex Barrens | Crossroads of Ruin |
| T4 | Starfallen Observatory | Graveglass Hollow | Stormvault Gallery | Hall of Unbound Names | Cinder Sepulcher | The Broken Meridian |
| T5 | Pyrehold Bastion | Vault of the Black Sigil | Stormspire Monastery | Abyssal Reservoir | Sunken Bell Grounds | The Black Gate |

## Specials

- **Howling Den** ? early optional elite encounter and Corrupted Greatbear milestone.
- **Scalding Rift** ? T5 Special with steam and pressure combat identity.
- **Nullstone Archive** ? Arcane sequence Special with the Closed Index boss.

## Phase 01C structural requirements

- Core T2-T5 Combat Zones have 5-8 normal enemies and at least 60% matching primary affinity.
- Core zone bosses match their lane affinity.
- T5 Specials use the T5 progression gate.
- Stormspire is sequence-to-targeted-zone save conversion remains supported.
- The location, monster, roster, and progression registries remain the runtime source of truth.

## Progression direction

The planned authored campaign progression is **T1-T10**. The current authored content ends at **T5**; no T6-T10 zones are authored in this phase.

After T10, the planned direction is an endless, Anomaly-style escalation that reuses existing locations at effective challenge T11 and beyond. That future escalation will be scoped to its activity/run context. It will not globally scale campaign locations and is not implemented here.

**World Tier has been removed.** Combat difficulty is defined by authored Combat Tier and location progression. Universal Loot Tier and Sigil Tier remain separate systems.

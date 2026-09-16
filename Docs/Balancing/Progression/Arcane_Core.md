# Arcane Core

Arcane Core is permanent combat progression. Combat awards Arcane Core XP; XP advances the Core Level; each level after Level 1 grants one Core Point for a purchased node.

## Branches

| Branch | ID | Nodes |
| --- | --- | ---: |
| Power | power | 40 |
| Vitality | vitality | 40 |
| Focus | focus | 40 |
| Control | control | 40 |

All 160 nodes cost 1 Core Point. Each lane is a sequential chain from its first node to its tenth node. The four lanes in every branch can all be completed.

## Progression

| Setting | Value |
| --- | ---: |
| Starting level | 1 |
| Starting XP | 0 |
| Core Points earned per level | 1 |
| Maximum level | 161 |
| Total authored nodes | 160 |

XP from Level L to Level L+1 is `round(100 × L^1.15)`. XP is integer-only, clamps at the maximum-level threshold, and does not create points beyond the authored node budget.

## Node catalog

Node IDs are stable authored IDs. `a` through `d` identify the four lanes; the number identifies the node's order in that lane. Node definitions in `src/game/content/arcaneCore/` own each name, description, type, stat, modifier, rule, and special effect.

### Power

| Lane | Authored node IDs |
| --- | --- |
| Arcane Force | power-a1, power-a2, power-a3, power-a4, power-a5, power-a6, power-a7, power-a8, power-a9, power-a10 |
| Critical Force | power-b1, power-b2, power-b3, power-b4, power-b5, power-b6, power-b7, power-b8, power-b9, power-b10 |
| Combat Rhythm | power-c1, power-c2, power-c3, power-c4, power-c5, power-c6, power-c7, power-c8, power-c9, power-c10 |
| Execution | power-d1, power-d2, power-d3, power-d4, power-d5, power-d6, power-d7, power-d8, power-d9, power-d10 |

### Vitality

| Lane | Authored node IDs |
| --- | --- |
| Vitality | vitality-a1, vitality-a2, vitality-a3, vitality-a4, vitality-a5, vitality-a6, vitality-a7, vitality-a8, vitality-a9, vitality-a10 |
| Arcane Defense | vitality-b1, vitality-b2, vitality-b3, vitality-b4, vitality-b5, vitality-b6, vitality-b7, vitality-b8, vitality-b9, vitality-b10 |
| Barrier | vitality-c1, vitality-c2, vitality-c3, vitality-c4, vitality-c5, vitality-c6, vitality-c7, vitality-c8, vitality-c9, vitality-c10 |
| Recovery | vitality-d1, vitality-d2, vitality-d3, vitality-d4, vitality-d5, vitality-d6, vitality-d7, vitality-d8, vitality-d9, vitality-d10 |

### Focus

| Lane | Authored node IDs |
| --- | --- |
| Mana Reservoir | focus-a1, focus-a2, focus-a3, focus-a4, focus-a5, focus-a6, focus-a7, focus-a8, focus-a9, focus-a10 |
| Mana Flow | focus-b1, focus-b2, focus-b3, focus-b4, focus-b5, focus-b6, focus-b7, focus-b8, focus-b9, focus-b10 |
| Mana Efficiency | focus-c1, focus-c2, focus-c3, focus-c4, focus-c5, focus-c6, focus-c7, focus-c8, focus-c9, focus-c10 |
| Focus Capacity | focus-d1, focus-d2, focus-d3, focus-d4, focus-d5, focus-d6, focus-d7, focus-d8, focus-d9, focus-d10 |

### Control

| Lane | Authored node IDs |
| --- | --- |
| Cooldown Control | control-a1, control-a2, control-a3, control-a4, control-a5, control-a6, control-a7, control-a8, control-a9, control-a10 |
| Status Mastery | control-b1, control-b2, control-b3, control-b4, control-b5, control-b6, control-b7, control-b8, control-b9, control-b10 |
| Combat Speed | control-c1, control-c2, control-c3, control-c4, control-c5, control-c6, control-c7, control-c8, control-c9, control-c10 |
| Disruption | control-d1, control-d2, control-d3, control-d4, control-d5, control-d6, control-d7, control-d8, control-d9, control-d10 |

## Combat XP rewards

| Dungeon | Normal kill XP | Boss kill XP |
| --- | ---: | ---: |
| Whispering Woods (whispering-woods) | 5 | 40 |
| Howling Den (howling-den) | 6 | 50 |
| Abandoned Catacombs (abandoned-catacombs) | 8 | 65 |
| Fractured Approach (fractured-approach) | 10 | 80 |
| Flooded Reliquary (flooded-reliquary) | 12 | 95 |
| Ashen Watch (ashen-watch) | 14 | 110 |
| Rootscar Hollow (rootscar-hollow) | 16 | 125 |
| Crossroads of Ruin (crossroads-of-ruin) | 18 | 140 |
| Graveglass Hollow (graveglass-hollow) | 20 | 155 |
| Stormvault Gallery (stormvault-gallery) | 22 | 170 |
| Starfallen Observatory (starfallen-observatory) | 24 | 190 |
| Broken Meridian (broken-meridian) | 26 | 210 |
| Hall of Unbound Names (hall-of-unbound-names) | 28 | 230 |
| Vault of the Black Sigil (vault-of-the-black-sigil) | 30 | 250 |
| Black Gate (black-gate) | 35 | 300 |

Normal and boss Arcane Core XP rewards are repeatable and use centralized dungeon configuration in live Combat and Offline Bank. Arcane Core progression does not consume inventory materials, Gold, or boss catalysts.

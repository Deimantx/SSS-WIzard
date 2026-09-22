# Balance Overview

Runtime TypeScript is the source of truth for all gameplay values.
This repository intentionally does not maintain a generated Markdown balancing workbook.

## Main source locations

| Area | Runtime source |
| --- | --- |
| Global combat/balance constants | `src/game/core/balance/` |
| Monsters | `src/game/content/monsters/` |
| Combat locations / dungeon definitions | `src/game/content/dungeons/` |
| World navigation / target metadata | `src/game/content/world-navigation/` |
| World Tier values | `src/game/content/world-tier/` |
| Items / equipment | `src/game/content/items/` |
| Artifacts | `src/game/content/artifacts/` |
| Spells | `src/game/content/spells/` |
| Statuses | `src/game/content/statuses/` |
| Traits | `src/game/content/traits/` |
| Recipes | `src/game/content/recipes/` |
| Guild progression | `src/game/content/guild/` |

When balancing is requested, inspect and edit the authoritative runtime source directly.
Do not create per-domain Markdown mirrors unless explicitly requested by the user.

# SSS Wizard balancing workbook

TypeScript runtime content is authoritative. Markdown is a human review surface and is never parsed by the game.

Edit one canonical page per value domain. Export with `npm run balancing:export -- --force --prune`, then run coverage.

## Workbook map

- Combat: shared formulas, statuses, traits, and damage types.
- Dungeons: each dungeon owns its monsters and loot.
- Items: materials and all equipment stats and sell values.
- Crafting: Artificing equipment recipes and Transmutation production recipes.
- Magic: schools, spells, and auto-cast behavior.
- Progression: progression systems and unlocks.
- Economy: derived activity timing summaries.

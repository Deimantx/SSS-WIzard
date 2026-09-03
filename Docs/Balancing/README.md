# SSS Wizard balancing workbook

This folder is a human-readable review surface for authored game values. It is organized by design topic so a designer can compare items, enemies, spells, progression, and economy without reading implementation data.

TypeScript remains the live game source. Markdown is never loaded by the game. To request a balance change, name the document, stable ID, field, proposed value, and reason. Keep stable IDs unchanged.

The export is manual. Use npm run balancing:export to create missing files. Use npm run balancing:export -- --force only when intentionally refreshing the snapshot. Technical provenance and coverage metadata live in the _System folder.

## Workbook map

- Combat: player values, global rules, formulas, statuses, traits, and damage types.
- Dungeons and enemies: progression, quick comparisons, and one readable file per dungeon.
- Items and production: item index, materials, equipment, drops, recipes, and crafting economy.
- Progression and magic: Research, Channeling, Focus, Guild, unlocks, schools, and spells.
- Economy: item values and current activity timings.

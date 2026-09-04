# SSS Wizard balancing workbook

This is a spreadsheet-oriented review surface for authored game values. Open a topic, compare rows in the first tables, and edit the canonical table named in the system manifest.

TypeScript remains the live game source. Markdown is never loaded by the game. Keep stable content IDs unchanged when proposing a balance edit.

Use npm run balancing:export to create missing files. Use npm run balancing:export -- --force only when intentionally refreshing the snapshot. Technical provenance, canonical locations, mirrors, and coverage live in the _System folder.

## Workbook map

- Combat: player values, formulas, statuses, traits, and damage types.
- Enemies: one comparison page per dungeon with combat, traits, actions, and loot sheets.
- Items and production: item index, materials, equipment, drops, recipes, and crafting economy.
- Progression and magic: Research, Channeling, Focus, Guild, unlocks, schools, and spells.
- Economy: item values and current activity timings.

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

## Prompt for Codex when editing balancing values myself

Apply the balancing edits I made in `Docs/Balancing`.

First classify the task:

- **Class A — Pure numeric balancing:** existing values only; no content IDs, formulas, schemas, registry shapes, ingredient structure, unlock-rule type, or system behavior changes.
- **Class B — Structural authored content:** adds, removes, or reshapes authored content.
- **Class C — System/formula/architecture:** changes runtime behavior, formulas, save shape, simulation, or architecture.

For Class A pure numeric balancing:

1. Inspect my modified balancing files and preserve my edits.
2. Apply only those intended values to the authoritative runtime TypeScript.
3. Update or regenerate only directly affected balancing mirrors.
4. Run `npm run balancing:coverage` once at the end.
5. Run targeted Vitest only if an existing test directly asserts the changed value or relevant formula boundary.
6. Do not run the full `npm run test:run`.
7. Do not run `npm run build`.
8. Do not audit or regenerate unrelated systems or balancing sections.

For Class B structural authored-content changes, run relevant targeted tests, update affected sheets and mirrors, and run `npm run balancing:coverage`. Run the build when TypeScript or content-registry structure can be affected. Use the full test suite only for broad or cross-system changes, insufficient targeted coverage, or an explicit request.

For Class C formula, system, or architecture changes, use the normal workflow: targeted tests while iterating, balancing coverage when applicable, then one full `npm run test:run` and one `npm run build` at final handoff.

Runtime TypeScript remains the live source. Markdown is never loaded by the game. Keep stable content IDs unchanged unless the requested edit explicitly changes content structure. Report the task class and explicitly state which validation commands were run or skipped. If a supposed Class A edit requires a structural or behavior change, reclassify it as Class B or C before continuing.

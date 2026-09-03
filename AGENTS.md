# SSS Wizard contributor notes

## Gameplay ownership

- Keep balance, recipe definitions, unlock conditions, and item metadata in `src/game/content` or the central balance modules. Screens and components may format these values, but must not duplicate gameplay constants or rules.
- Keep simulation and resource mutation in `src/game/systems` and store actions. Selectors are the shared read model for UI, telemetry, inventory flow, and offline simulation.
- Transmutation is the single item-creation system. New recipes belong in `src/game/content/recipes/recipes.ts`; do not add a second production queue.

## Loot, Equipment, and Transmutation

- Monster and boss loot tables may grant material items only. Never place finished `kind: equipment` items in monster loot.
- All finished Equipment is created through Transmutation. Every `kind: equipment` item must have exactly one Transmutation recipe.
- Rare boss/signature Equipment is represented through boss/signature crafting materials and a Transmutation recipe, never a direct finished-Equipment drop.
- Transmutation remains the single normal item-creation system. Do not add a second production/crafting path.

## Balancing documentation is part of content Definition of Done

`Docs/Balancing/` is the human-editable balancing workbook and must stay synchronized with authored gameplay content.

- Update/regenerate the affected balancing sheets when adding, removing, or changing items, materials, Equipment, monsters, loot, recipes, spells, statuses, traits, dungeons, Research, Channeling, Focus, Guild, economy, or progression values.
- Every authored item, material, Equipment, monster, recipe, spell, status, trait, and dungeon must appear in its corresponding balancing sheet and comparison mirrors.
- Every new Equipment item must appear in its dungeon Equipment sheet, `Transmutation/Recipes.md`, `Crafting_Economy.md`, and exactly one runtime Transmutation recipe.
- Runtime TypeScript remains executable source; do not duplicate authoritative gameplay values in UI or treat Markdown as runtime input.
- Preserve human edits: inspect and merge balancing-document conflicts before regenerating; do not blindly overwrite unapplied edits.
- For authored content work, run `npm run balancing:coverage` as part of final handoff validation. Unrelated UI-only work does not require balancing coverage.

## Tooltips are mandatory UI infrastructure

SSS Wizard uses the shared `GameTooltip` / `TooltipProvider` system.

Every game screen must provide contextual custom tooltips for UI elements whose meaning, state, icon, abbreviation, cost, restriction, stat, effect, or interaction is not immediately obvious.

Rules:

- Never use native browser `title` tooltips for game UI.
- Use the shared `GameTooltip` system.
- Default hover delay is 500 ms.
- Only one tooltip may be active at a time.
- Tooltips must follow the active game theme.
- Preserve keyboard-focus tooltip behavior where appropriate.
- Do not create local competing tooltip systems.
- Tooltip coverage is part of the Definition of Done for every new or redesigned screen.

Before completing a UI screen, audit:

1. Missing contextual tooltips.
2. Native `title=` usage.
3. Duplicate or nested tooltip triggers.
4. Tooltip overflow.
5. Keyboard focus behavior.

## Centralized gameplay definitions

Do not duplicate authoritative lists, costs, formulas, slot definitions, recipe definitions, or Focus calculations inside UI components.

UI must consume authoritative gameplay/data helpers.

When replacing a system, remove the obsolete implementation after migration rather than keeping parallel legacy behavior.

## Progression curve terminology

Never use ambiguous progression helpers such as `LEVEL_XP(level)` when the value could mean either per-level XP or cumulative XP.

For Magic Schools:

- `XP to Next Level` means the incremental XP required from the current level to the next.
- `Total XP to Reach This Level` means the cumulative absolute threshold at the start of that level.
- Runtime, Dev Tools, save migration, tests, and `Docs/Balancing` must use the same centralized School XP helpers/table.
- Do not hard-code School XP thresholds in fixtures, presets, UI, or tests.

## Tester-first Developer Tools

- Developer Tools is a tester workspace. The first/default section is Quick Setup; navigation is grouped as QUICK, PLAYER, MAGIC, COMBAT, and SYSTEM.
- Use only the explicit `workspace` and `docked` window modes. Workspace is centered with a backdrop and internal scrolling; docked is movable, resizable, clamped, and persists its own geometry. Do not reintroduce a minimized window mode.
- Persist the last mode, selected tab, Combat Lab tab, and docked geometry in developer-only local storage. Normalize legacy UI tab ids (`equipment` → `inventory`, `schools` → `spells`) without changing gameplay save migrations.
- Normal tester views must be human-readable: use shared pure presentation/read-model helpers for names, effects, conditions, percentages, and seconds. Keep raw identifiers, serialized state, provider/source metadata, event keys, and runtime implementation details inside collapsed Advanced sections or Advanced Diagnostics.
- Quick Setup fixtures and loadouts must reuse authored dungeon unlock conditions, explicit slot maps, central item acquisition, and existing store/system actions. Do not add parallel gameplay or crafting systems.
- Spells & Schools, Monsters, Statuses, Inventory & Equipment, Research, Channeling, Focus, and Transmutation screens must expose tester actions while preserving the authoritative content registries and runtime selectors.
- Every redesigned Dev Tools screen must use shared `GameTooltip` infrastructure and must not use native `title` tooltips.

## Developer Tools Definition of Done

- Add or update focused Vitest coverage for window modes and persistence, navigation normalization, Quick Setup fixtures/actions, and raw-vs-human presentation boundaries.
- Run targeted tests while iterating. At final handoff, run exactly one full `npm run test:run` and one `npm run build` after implementation is complete.
- UI-only Dev Tools changes do not require balancing workbook regeneration or `npm run balancing:coverage`; authored gameplay/content changes still do.

## UI and testing

- Keep the three Transmutation panels usable at narrow widths: recipe library, recipe detail, and Focus assignment must stack without horizontal overflow.
- Editable screen panels must never visually bleed into adjacent panels; fit defaults and minimum sizes to intended content, and use responsive reflow or an internal themed scroll area when content can exceed a panel.
- Add or update Vitest coverage when changing save migration, production payment, reservation, or offline-report behavior.
- Run `npm run test:run` and `npm run build` before handoff.

## Test execution workflow

- During implementation, run only targeted Vitest files relevant to the code currently being changed.
- Do not repeatedly run the full test suite or production build after individual edits.
- Reserve `npm run test:run` and `npm run build` for final handoff validation after implementation and targeted testing are complete.
- The final handoff should include one full `npm run test:run` and one `npm run build`.

## Archive ownership

## Transmutation presentation

- Keep recipe filtering, unlock visibility, material tiers, output inspection, equipment comparison, and item tooltip data on shared game read-model/content helpers. Transmutation screens may format these helpers but must not duplicate recipe IDs, unlock rules, item stats, equipment effects, or slot logic.
- The normal Transmutation library hides locked recipes. Developer-only reveal is inspection-only and must not bypass runtime unlock or crafting checks.

- Game/content/system modules must not import screen/UI modules; shared metadata belongs in game/content or system layers.
- New filter/category controls should reuse the established shared filter-button visual language rather than invent screen-specific variants.
- Collection is item-only; creature data belongs in Bestiary.
- Bestiary entries must be derived from authored `MONSTERS` data; screens must not hardcode creature ID lists.
- All positive item grants go through the central item-acquisition helper so Collection discovery remains correct.
- Monster discovery happens on encounter, not first kill.
- UI icons and ambiguous controls use the shared `GameTooltip` system, never browser `title` tooltips.

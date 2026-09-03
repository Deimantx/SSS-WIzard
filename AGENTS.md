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

- Game/content/system modules must not import screen/UI modules; shared metadata belongs in game/content or system layers.
- New filter/category controls should reuse the established shared filter-button visual language rather than invent screen-specific variants.
- Collection is item-only; creature data belongs in Bestiary.
- Bestiary entries must be derived from authored `MONSTERS` data; screens must not hardcode creature ID lists.
- All positive item grants go through the central item-acquisition helper so Collection discovery remains correct.
- Monster discovery happens on encounter, not first kill.
- UI icons and ambiguous controls use the shared `GameTooltip` system, never browser `title` tooltips.

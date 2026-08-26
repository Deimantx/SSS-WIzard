# SSS Wizard contributor notes

## Gameplay ownership

- Keep balance, recipe definitions, unlock conditions, and item metadata in `src/game/content` or the central balance modules. Screens and components may format these values, but must not duplicate gameplay constants or rules.
- Keep simulation and resource mutation in `src/game/systems` and store actions. Selectors are the shared read model for UI, telemetry, inventory flow, and offline simulation.
- Transmutation is the single item-creation system. New recipes belong in `src/game/content/recipes/recipes.ts`; do not add a second production queue.

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
- Add or update Vitest coverage when changing save migration, production payment, reservation, or offline-report behavior.
- Run `npm run test:run` and `npm run build` before handoff.

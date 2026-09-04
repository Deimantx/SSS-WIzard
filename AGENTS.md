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

## Balancing workflow

`Docs/Balancing/` is the human-editable balancing workbook and must remain synchronized with authoritative runtime content. Classify balancing work before validating it.

### Class A — Pure numeric balancing

Use this fast path when only existing authored numeric values change and no content IDs, formulas, schemas, registry shapes, ingredient topology, unlock-condition types, or system behavior change. This includes values such as damage, HP, Defence, costs, cooldowns, durations, XP, research values, drop quantities/chances, item values, craft durations, resource quantities, status magnitudes, trait coefficients, and numeric unlock thresholds.

- Apply only the intentionally edited values to authoritative runtime TypeScript.
- Update or regenerate only directly affected balancing sheets and mirrors.
- Run `npm run balancing:coverage` once at the end.
- Run targeted Vitest only when an existing test directly asserts the changed value or a relevant formula boundary.
- Do not run the full `npm run test:run`.
- Do not run `npm run build`.
- Do not audit unrelated systems, broaden the task, or regenerate unrelated balancing sections.

This Class A fast path overrides the generic final full-test/build rule elsewhere in `AGENTS.md`. If the task reveals a formula, schema, new ID, enum, registry-shape, or system-behavior change, explicitly reclassify it as Class B or Class C and explain why.

### Class B — Structural authored-content changes

Use this class when authored content topology changes, including adding or removing items, monsters, spells, recipes, ingredients, loot entries, traits, statuses, or actions; changing Equipment slots/categories, unlock-condition structure, recipe output identity, dungeon rosters, or authored registry object shape.

- Apply the requested content change and update affected balancing sheets and mirrors.
- Run relevant targeted tests during implementation.
- Run `npm run balancing:coverage` once at the end.
- Run `npm run build` when TypeScript or content-registry shape can be affected.
- Run the full `npm run test:run` only for broad or cross-system consequences, multiple touched invariants, insufficient targeted coverage, or an explicit user request.

Full-suite testing is not automatically mandatory merely because authored content changed.

### Class C — System, formula, or architecture changes

Use this class for changes to formulas, simulation or resource behavior, save schema, combat sequencing, loot resolution, progression logic, Transmutation behavior, or runtime architecture.

- Run targeted tests while iterating.
- Update balancing documentation when authored values are affected and run `npm run balancing:coverage` when applicable.
- Run one full `npm run test:run` and one `npm run build` at final handoff.

General balancing rules:

- Runtime TypeScript remains executable source; Markdown is never runtime input.
- Preserve human edits: inspect and merge balancing-document conflicts before regenerating mirrors; do not blindly overwrite unapplied edits.
- Update or regenerate affected balancing sheets and mirrors for authored changes to items, materials, Equipment, monsters, loot, recipes, spells, statuses, traits, dungeons, Research, Channeling, Focus, Guild, economy, or progression values, within the applicable task class.
- Every authored item, material, Equipment, monster, recipe, spell, status, trait, and dungeon must appear in its corresponding balancing sheet and comparison mirrors.
- Every new Equipment item must appear in its dungeon Equipment sheet, `Transmutation/Recipes.md`, `Crafting_Economy.md`, and exactly one runtime Transmutation recipe.
- Class A still requires all directly affected cross-sheet mirrors, but unrelated sheets remain untouched.
- Unrelated UI-only work does not require balancing coverage.
- Every balancing handoff must report its Class A/B/C classification and state which validation commands were run or intentionally skipped.

## Tooltips are mandatory UI infrastructure

SSS Wizard uses the shared `GameTooltip` / `TooltipProvider` system.

Every game screen must provide contextual custom tooltips for UI elements whose meaning, state, icon, abbreviation, cost, restriction, stat, effect, or interaction is not immediately obvious.

Rules:

- Never use native browser `title` tooltips for game UI.
- Use the shared `GameTooltip` system.
- Default hover delay is 500 ms.
- Only one tooltip may be active at a time.
- Tooltips must follow the active game theme.
- Shared item tooltips must remain compact and must not render unbounded relationship lists such as `Used In`; relationship browsing belongs in explicit `View` / dialog / inspector UI.
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

- All normal game screens must use the shared `screen-content` / `app-content-shell` outer width contract. Keep the standard desktop maximum centralized in `src/styles/layout/app-content.css`; screen-specific CSS may control internal grids, panels, dialogs, and text columns but must not create a different outer page width. Combat is not a width exception; its container-query behavior is internal.
- Keep all Transmutation panels usable at narrow widths: recipe library, recipe detail, Focus assignment, and output inspection must stack without horizontal overflow.
- Editable screen panels must never visually bleed into adjacent panels; fit defaults and minimum sizes to intended content, and use responsive reflow or an internal themed scroll area when content can exceed a panel.
- Add or update Vitest coverage when changing save migration, production payment, reservation, or offline-report behavior.
- Run `npm run test:run` and `npm run build` before handoff.

## Runtime feedback and offline timing

- Routine high-frequency production must not emit repetitive completion audio. Transmutation Material/Elemental output is silent; Equipment completion may use one shared craft cue after a successful Transmutation result.
- Generic item-acquisition Game Feel may remain visual, but reward audio belongs to a semantic source such as Combat Loot Reveal or meaningful Equipment crafting; do not make every acquisition globally audible.
- Offline Bank represents real time between game/profile sessions, not time while the same live document is hidden or minimized. Same-session visibility restoration must not credit Offline Bank.
- Offline Bank accrual has one authoritative lifecycle path and is credited exactly once per real absence. Live simulation ticks never generate Offline Bank.
- Performance fixes are measurement-driven. FPS may be smoothed for readability but must not falsify sustained frame loss; ambient WebGL may render at a lower rate than the browser UI when visually equivalent.

## Game Feel and motion

- Real bounded scroll owners use the shared smart-scroll state helper; CSS reads its overflow and direction data attributes, and scroll position must not enter React state.
- Master-detail identity changes use `InspectorTransition` with metadata-driven accents and optional fill mode; same-identity value updates must keep the transition node stable.
- Main screens must not clip their final content. Screen transition wrappers, shell containers, and decorative chrome must not own vertical sizing in a way that crops real content; each main screen needs a clear scroll owner and safe bottom padding.
- Decorative panel chrome must remain fully bounded by its host panel. Pseudo-elements and accent layers may not leak outside panel edges, overlap content unexpectedly, or create stray visual artifacts.
- Decorative motion is UI-only and must never delay or own gameplay state, timers, crafting, combat resolution, navigation, or saves.
- Reuse shared Game Feel primitives for screen transitions, interaction feedback, value pulses, progress motion, and short FX; do not create competing per-screen animation systems.
- Respect both the persisted Reduced Motion preference and `prefers-reduced-motion`.
- Persistent ambience uses the existing single `ArcaneAtmosphere` renderer; do not create additional permanent WebGL/canvas animation loops for individual screens.
- Short craft and unlock effects are transient UI state only, never persisted, pointer-transparent, and bounded/capped.
- Gameplay/content/system modules must not import Game Feel UI modules. Visual effects observe authoritative state/results from the UI/store boundary.
- Custom cursors use the native CSS cursor pipeline; do not replace the system cursor with a JavaScript mouse-following element.
- Perceptible feedback should stay semantic and bounded: action cursors remain accent-dominant, and craft/unlock/item/equipment/focus/error/success cues must correspond to real UI-visible results.
- Panel chrome is CSS paint only: it must not alter panel geometry or create a constant pulse or a per-panel animation loop.
- Pointer-reactive lighting uses direct CSS custom-property updates from one delegated listener; do not put pointer coordinates in React state or add 3D tilt.
- UI audio uses one lazy, shared Web Audio engine with a master volume; do not create AudioContexts per screen or attach one sound listener per button.
- Generic hover/click cues are delegated and rate-limited; stronger sounds belong to confirmations and semantic results, not every simulation tick.

## Test execution workflow

- During implementation, run only targeted Vitest files relevant to the code currently being changed.
- Do not repeatedly run the full test suite or production build after individual edits.
- For normal system/code tasks, reserve `npm run test:run` and `npm run build` for final handoff validation after implementation and targeted testing are complete.
- Pure numeric balancing tasks follow the Class A fast balancing workflow and do not require the full suite or production build.
- Structural authored-content tasks follow the Class B workflow.
- If a task-specific section defines a narrower validation workflow, that task-specific rule takes precedence over this generic section.

## Screen panel non-overlap contract

- Every visible normal screen panel rendered through `EditableGrid` must have a rectangle with zero intersection area against every sibling panel. Intentional portal/overlay layers such as tooltips, modals, popovers, Developer Tools, Layout Editor controls, and toasts are excluded.
- Normal panel content must not bleed outside its own panel into a sibling panel. Panel roots own clipping and narrow-width containment.
- A locked panel cannot be moved or resized by the user, but runtime auto-flow may shift its effective position to avoid overlap. Its saved position remains unchanged.
- Hidden panels do not reserve runtime space; they remain available only when the Layout Editor is showing hidden content.
- `bounded-scroll` panels must own an explicit internal scroll viewport; clipping overflow without a reachable themed scrollbar is invalid.
- `PanelDefinition.heightMode` is either `content` or `bounded-scroll`; content panels grow from measured natural content, while bounded-scroll panels keep their saved/minimum outer height and scroll internally.
- Saved `x`, `y`, `w`, and `h` are the user's base geometry and are the only geometry persisted. Runtime measurement, auto-flow, responsive stacking, and layout transforms must never write sibling shifts back to saved layouts.
- Natural content is measured through the shared `ResizeObserver` wrapper. Do not add polling or a global `MutationObserver` for panel sizing.
- Runtime panel placement must use the shared pure auto-flow solver and stable saved-order placement. Screen-specific transforms may prepare a layout but must not bypass the solver.
- Responsive narrow layouts must stack every visible panel at `x=0`, `w=12`, using effective heights, and must remain collision-free after width/reflow changes.
- Shared row/pixel conversion helpers own grid sizing math; do not duplicate magic row heights, margins, or pixel formulas in screens.
- Large relationship/reference lists such as `Used In` must stay compact in normal panels and move into a dedicated scrollable modal/dialog or bounded inspector.
- Transmutation recipe cards must prioritize readable identity and classification over maximum density. Use shared typography tokens; do not add one-off micro-font sizes for card metadata.
- Tier filtering for Elemental/Material Transmutation content is shared and metadata-driven; do not maintain per-category item-ID tier lists.
- Modal/dialog components must render through the shared portal layer and have a guaranteed contained overlay baseline.
- Filter controls must visually communicate their semantics: mutually exclusive category/context choices use tab/radio-style presentation, while combinable filters use toggle/checkbox-style presentation. Do not style both interaction models identically.


## Archive ownership

- Game/content/system modules must not import screen/UI modules; shared metadata belongs in game/content or system layers.
- New filter/category controls should reuse the established shared filter-button visual language rather than invent screen-specific variants.
- Collection is item-only; creature data belongs in Bestiary.
- Bestiary entries must be derived from authored `MONSTERS` data; screens must not hardcode creature ID lists.
- All positive item grants go through the central item-acquisition helper so Collection discovery remains correct.
- Monster discovery happens on encounter, not first kill.
- UI icons and ambiguous controls use the shared `GameTooltip` system, never browser `title` tooltips.

## Feedback and reward presentation

- Use the shared hierarchy: common live item rewards use Loot Reveal, meaningful progression unlocks use Milestone Banner, generic system information uses Toast, and short local reactions use Game Feel FX. Do not present one event redundantly through every layer.
- Loot and reward queues are transient UI state, bounded, source-aware, and coalesced for frequent farming. Never replay historical or offline acquisitions as a notification flood.
- Emit reward presentation from UI/store result boundaries after authoritative gameplay resolution succeeds; low-level gameplay and loot modules must not import reward UI.
- First-discovery markers use authoritative Collection, Bestiary, spell, and recipe truth. Presentation attention is profile-aware and never replaces progression state.
- Master-detail screens use the shared inspector transition for identity changes only; same-identity quantity or stat updates must not replay the full transition.
- Screen panel sequencing is screen-entry-only and must animate safe inner panel surfaces, never React Grid Layout root transforms.
- FPS is a UI preference and performance readout only; its sampler must not update React state every animation frame.

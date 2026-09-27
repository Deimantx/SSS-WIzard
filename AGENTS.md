# SSS Wizard contributor notes

## Gameplay ownership

- Keep balance, recipe definitions, unlock conditions, and item metadata in `src/game/content` or the central balance modules. Screens and components may format these values, but must not duplicate gameplay constants or rules.
- Keep simulation and resource mutation in `src/game/systems` and store actions. Selectors are the shared read model for UI, telemetry, inventory flow, and offline simulation.
- Transmutation is the elemental/material production system. Artificing is the Equipment crafting system; keep their recipes in the central recipe registries.

## Loot, Equipment, and Transmutation

- Monster and boss loot tables may grant material items only. Never place finished `kind: equipment` items in monster loot.
- All finished Equipment is created through Artificing. Every `kind: equipment` item must have exactly one Artificing recipe.
- Rare boss/signature Equipment is represented through boss/signature crafting materials and an Artificing recipe, never a direct finished-Equipment drop.
- Transmutation remains the elemental/material production system; do not add a parallel normal production path.

## Balance / authored values

- Runtime TypeScript is the only authoritative source for gameplay and balance values.
- Do not create or maintain generated balancing Markdown mirrors.
- `Docs/Balancing/BalanceOverview.md` is only a source-location guide.
- When balancing is requested, inspect the relevant runtime content/system files directly.
- Numeric-only changes should receive focused validation appropriate to the touched system.
- Structural/system/save changes follow the normal targeted tests + final `npm run test:run` / `npm run build` workflow.
- Do not create Phase plan Markdown files unless the user explicitly asks for permanent repository documentation.

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

## UI visual quality contract — hard Definition of Done

SSS Wizard is a custom game UI. A feature is **not complete merely because it functions**.

Any new or redesigned player-facing screen, modal, panel, popup, tooltip, context menu, Developer Tools surface, filter bar, form, or interactive control must visually belong to the existing SSS Wizard design system.

A working feature that visibly falls back to browser/default HTML styling is a **failed implementation** and must not be handed off as complete.

### Native/default browser controls are forbidden in feature screens

Feature code under normal game screens and Developer Tools must not directly introduce unthemed browser-native controls such as:

```text
<select>
default-looking <button>
unstyled <input>
native checkbox/radio presentation
browser title= tooltips
browser-default modal/dialog styling
```

Use the shared themed UI infrastructure instead.

Preferred shared components include:

```text
Button
SelectMenu
SearchInput
Tabs / FilterBar
GameTooltip
ModalPortal
Status
shared context menus
shared toggle / segmented / filter controls
```

A raw HTML element may exist inside the implementation of a shared primitive, but a feature screen must not use browser defaults as its final presentation.

If the required shared component does not exist:

```text
1. create or extend a reusable shared themed primitive;
2. use that primitive in the feature;
3. do not leave a raw browser control as the finished UI.
```

### Browser-default visual appearance is an automatic UI failure

The following visible results are not acceptable in finished SSS Wizard UI:

```text
white/default browser buttons
system-default select boxes
native select arrows
native blue checkbox/radio styling
default focus rings that conflict with the game theme
default system fonts
unstyled input fields
unstyled scrollbars where a themed bounded scroll owner is expected
raw text controls packed together without visual hierarchy
```

If any of these are visible in a screenshot of the finished feature, the task is not complete.

### Reuse the existing design language before inventing local styling

Before styling a new surface, inspect nearby production-quality SSS Wizard screens and shared components.

Match the established language for:

```text
panel surfaces
borders
radii
spacing
typography
accent hierarchy
button hierarchy
selected/hover/focus states
status chips
tooltips
modal chrome
scroll regions
empty states
inspectors
filter controls
```

Do not create a separate visual language for one feature.

Do not create one-off CSS that visually conflicts with:

```text
Equipment
Guild
Chronicles
Magic Schools
other current polished screens
```

### Shared design tokens are mandatory

Use the existing design tokens and CSS variables.

Do not introduce arbitrary local colors, fonts, shadows, or radii when an existing token already represents the concept.

Gameplay rarity/color systems may define dedicated semantic tokens, but they must be centralized and reused everywhere that rarity appears.

Example:

```text
Sigil Common / Refined / Perfect / Legendary
```

must use one shared quality-token definition across:

```text
Equipment
Loot Reveal
Artificing
Collection
Developer Tools
tooltips
```

Do not misuse generic UI semantics such as:

```text
success
warning
error
```

as item rarity colors.

### Modal quality contract

Every new modal must:

```text
render through the shared ModalPortal;
use the game theme;
have intentional header/body/action hierarchy;
have bounded internal scrolling;
fit common desktop resolutions;
have no browser-default controls;
have working focus trapping / Escape behavior;
have working GameTooltip coverage;
have clear selected / hover / focus states;
remain visually contained at narrow widths.
```

A large modal must not be a giant unstructured document.

For master-detail workflows, prefer:

```text
navigation / browser
content
inspector
```

or another explicit spatial hierarchy.

### Button hierarchy

Use shared `Button` variants or an equivalent shared themed primitive.

Every action group must have intentional hierarchy:

```text
primary action
secondary action
ghost/utility action
danger action
```

Do not render every action with equal visual weight.

Do not place many raw buttons in one uninterrupted row.

Group related actions into sections, menus, or local modes.

### Select/filter controls

Do not use native `<select>` as finished SSS Wizard UI.

Use:

```text
SelectMenu
FilterBar
segmented controls
chips
themed popovers
```

Choose the control based on interaction semantics:

```text
mutually exclusive context/category -> tabs/radio/segmented
combinable filters -> toggles/chips/checkbox-style controls
large option list -> SelectMenu/searchable picker
```

Do not expose seven dropdowns at once when the same workflow can be expressed with:

```text
primary chips
+
FILTERS popover
+
SORT control
```

### Checkbox/toggle contract

Do not show raw browser checkboxes in final game UI.

Boolean gameplay/settings controls must use a themed toggle, checkbox primitive, or clear button state.

The visible control must have:

```text
label
active/inactive state
hover state
focus state
disabled state where relevant
tooltip where meaning is not obvious
```

### Inspector quality contract

Inspectors must be human-readable.

Do not expose raw IDs or enum keys such as:

```text
critChance
maxHealthPct
critical-flow
sigil-set-id
```

when authored display labels exist.

Use presentation/read-model helpers.

Organize inspector information into meaningful sections rather than raw object dumps.

### Empty/loading/locked/error states are part of the design

Every redesigned workflow must intentionally handle:

```text
nothing selected
no owned content
no search matches
locked content
disabled action
loading where applicable
validation error
save error
```

Do not leave an empty panel or generic browser text.

### Tooltip coverage remains mandatory

Continue to follow the shared `GameTooltip` contract.

A visually polished screen with missing interaction explanation is still incomplete.

Tooltips are especially required for:

```text
icons
rarity/Tier abbreviations
lock state
slot restrictions
disabled actions
Set bonuses
Traits
costs
unfamiliar stats
compact buttons
```

### Developer Tools follow the same visual bar

Developer Tools may be denser and more technical than normal player UI, but they are **not exempt** from the design system.

Developer Tools must not use:

```text
white native buttons
raw native selects
raw native checkboxes
browser-like forms
unstructured walls of controls
```

Use the V4 shared developer UI and normal game UI primitives.

A Developer Tools screen that looks like an HTML debug page is not complete.

### No "functional now, polish later" handoff for requested UI work

When the user asks for a UI implementation or rework, visual integration is part of the same task.

Do not hand off:

```text
functional shell now
styling later
```

unless the user explicitly requested only a functional prototype.

If the user asked for:

```text
AAA UI
full rework
match our design
polished modal
production UI
```

then a visually unfinished version is a failed task.

### Screenshot sanity check is mandatory for UI changes

Before final handoff of a substantial UI task, inspect the rendered result.

At minimum verify the relevant screen/modal at a normal desktop size.

The implementation is not complete if the rendered result visibly contains:

```text
browser-default controls
broken spacing
overflow
overlap
unreadable text
wrong color language
unstyled empty states
missing selected states
missing hover/focus states
obviously unfinished placeholder sections
```

Where available, also verify a narrower layout.

Do not rely only on unit tests for visual completion.

### Changed-file UI audit before handoff

Before completing a UI task, review all changed `.tsx` feature files for newly introduced browser-native controls.

For changed feature files, explicitly search for:

```text
<select
type="checkbox"
type="radio"
title=
```

Any match must be one of:

```text
inside an approved shared UI primitive
or
explicitly justified and fully themed
```

Otherwise replace it with shared UI infrastructure.

Also review direct raw `<button>` usage in changed feature code. Prefer the shared `Button` primitive unless the element is implementing an established shared interaction pattern such as a custom tab, listbox option, card, or context-menu row with complete theme styling.

### UI Definition of Done

A UI task is complete only when all of the following are true:

```text
[ ] Functionality works.
[ ] The surface visually belongs to SSS Wizard.
[ ] No browser-default controls are visible.
[ ] Shared UI primitives are used where available.
[ ] Design tokens are used instead of arbitrary local styling.
[ ] Button/action hierarchy is clear.
[ ] Hover, selected, focus, disabled, and locked states are styled.
[ ] Tooltips are complete.
[ ] Empty/error states are intentional.
[ ] Modal/popover/dropdown layers render correctly.
[ ] No panel overlap or clipping exists.
[ ] Normal desktop rendering was visually inspected.
[ ] Relevant narrow layout was checked when the surface is responsive.
[ ] Focused tests pass.
[ ] Final build/test workflow required by the repository passes.
```

If any visual-quality item above is clearly false, do not report the UI task as complete.

---

## Additional recommended automated guard

Add a lightweight source-quality test or lint check for newly changed feature code that prevents accidental introduction of raw native `<select>` controls and native `title=` tooltips.

The automated guard should not blindly fail existing legacy code on day one.

Use either:

```text
an explicit legacy allowlist
```

or:

```text
changed-file-only enforcement
```

until legacy screens have been migrated.

The goal is to prevent new design debt while old debt is removed incrementally.

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
- UI-only Dev Tools changes do not require balancing documentation changes; authored gameplay/content changes still require appropriate focused validation.

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

- Every visible normal screen panel rendered through `ScreenGrid` must have a rectangle with zero intersection area against every sibling panel. Intentional portal/overlay layers such as tooltips, modals, popovers, Developer Tools, and toasts are excluded.
- Normal panel content must not bleed outside its own panel into a sibling panel. Panel roots own clipping and narrow-width containment.
- Static screen panel geometry is source-controlled in `ScreenGrid` and its screen CSS. Responsive rules must reflow panels without overlap and keep all content reachable.
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

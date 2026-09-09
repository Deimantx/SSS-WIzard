# SSS Wizard UI Anti-Patterns

These are failure modes to actively check for during implementation and review.

## 1. Generic SaaS Dashboard Drift

Avoid:

- huge page titles and marketing-like hero sections;
- grids of identical business-dashboard KPI cards;
- white/neutral admin-panel styling that ignores the game theme;
- generic rounded cards for every piece of information;
- enterprise-table aesthetics where a game catalog/inspector is more appropriate.

SSS Wizard should look like a dense arcane game interface, not analytics software.

## 2. Applying Low-Chrome 3D HUD Rules to This Game

SSS Wizard is primarily a screen-based incremental RPG UI. Do not remove useful panels or hide core information simply because a generic game-UI guideline says to keep 75–80% of a 3D playfield visible.

There usually is no live 3D playfield to protect on management screens.

Density is acceptable when hierarchy and readability are good.

## 3. One-Off Design Systems

Avoid screen-local replacements for:

- theme colors;
- typography scale;
- buttons;
- tabs;
- statuses;
- progress bars;
- tooltips;
- dropdowns;
- modal layering;
- scrollbars;
- game-feel feedback.

A visually special feature may extend the system, but it should still speak the same UI language.

## 4. Hardcoded Theme Colors

Do not implement a new screen using raw default-theme hex/rgb values when a `--ui-*`, resource, semantic, or component token exists.

Hardcoding breaks Dark/Light/Custom themes and makes future theme work expensive.

## 5. Micro-Font Compression

Do not fix an overflowing layout by repeatedly shrinking labels into unreadable custom font sizes.

Use:

- reflow;
- wrapping;
- better grouping;
- expandable details;
- a wider internal region where justified;
- a bounded scroll owner;
- a dialog/inspector for deep data.

## 6. Duplicate Global Information

Avoid large repeated versions of Topbar resources on every screen unless the local interaction genuinely needs a more detailed view.

Global context belongs in the persistent shell; local context belongs in the screen.

## 7. Panel Overlap or Bleed

Never accept:

- sibling `EditableGrid` panels intersecting;
- pseudo-elements crossing panel edges;
- absolutely positioned content bleeding into neighboring panels;
- hidden overflow that makes interactive content unreachable.

Use the shared layout/measurement/auto-flow model.

## 8. Screen-Specific Outer Width Hacks

Do not give one normal screen an arbitrary wider/narrower outer container to fix internal layout pressure.

The shared content-width contract is intentional. Fix the internal composition first.

## 9. Fake Scroll Areas

Bad pattern:

```text
overflow: hidden
fixed panel height
content disappears
```

A bounded-scroll panel needs a real reachable internal scroll viewport with themed scrollbar behavior.

## 10. Native Browser Tooltips

Never use `title="..."` as the game's tooltip solution.

Use `GameTooltip`.

## 11. Tooltip as Database Dump

Do not put large `Used In`, source, relationship, or diagnostics lists into hover tooltips.

Hover is for quick context. Deep browsing belongs in an inspector/dialog/View surface.

## 12. Competing Overlay Systems

Avoid local modal/dropdown/tooltip portals with random z-index values.

Use the established portal and z-layer system.

Do not solve a clipping bug with `z-index: 999999`.

## 13. Ambiguous Filter Semantics

Do not make exclusive tabs and multi-select filters use the same visual behavior.

The player should immediately understand whether clicking a second choice replaces or combines the first.

## 14. Excessive Equal-Weight Cards

Do not turn every stat/action/description into its own bordered card.

Use panel hierarchy, section labels, dividers, rows, compact groups, and one meaningful surface structure.

## 15. Excessive Decorative Motion

Avoid:

- constant panel pulsing;
- animated glow on every interactive element;
- continuous per-panel particle effects;
- 3D hover tilt;
- looping animation that competes with real progress/status motion.

Motion should reveal meaning.

## 16. React State for Pointer or Scroll Telemetry

Do not update React state every pointer move or scroll frame for purely visual effects.

Use the repository's delegated/direct CSS custom-property and smart-scroll patterns.

## 17. Per-Screen Permanent WebGL/Canvas Loops

Do not instantiate a second permanent ambience renderer because one screen needs extra atmosphere.

Reuse the shared `ArcaneAtmosphere`; use bounded transient effects when necessary.

## 18. Per-Component Audio Engines

Do not create one audio context or one generic sound listener per screen/button.

Use the shared audio infrastructure and semantic feedback hierarchy.

## 19. UI Owning Gameplay Timing

Animation completion callbacks must not become the authority for:

- combat resolution;
- crafting completion;
- resource payment;
- save timing;
- production ticks;
- navigation unlock state.

UI observes gameplay results; it does not become the simulation clock.

## 20. Hardcoded Gameplay Lists in Screens

Do not hardcode monster IDs, item IDs, recipe data, equipment slot definitions, costs, unlock conditions, or other authoritative content into UI components.

Consume the central registries/selectors/read models.

## 21. Duplicate Legacy Paths

When replacing a screen/component/system, do not leave the old implementation secretly active "just in case" if the migration is complete.

Parallel legacy implementations create visual and code drift.

## 22. Unrelated Drive-By Redesign

If the task asks to improve Research, do not redesign Sidebar, Combat, Settings, and the theme system without a dependency-driven reason.

Maintain consistency, but keep the scope controlled.

## 23. Default OS-Looking Controls in a Themed Surface

Avoid suddenly introducing visibly default Windows/browser controls where the game already has a themed equivalent, especially scrollbars, menus, selects, and interactive chrome.

Use native controls only when intentionally chosen and visually integrated.

## 24. Color-Only State

Do not rely only on red/green/violet differences to communicate selected, failed, locked, or active states.

Use text, iconography, shape/border, or labels as appropriate.

## 25. Missing Empty/Locked/Disabled States

A finished panel must not assume ideal populated state only.

Check:

- no items;
- no selection;
- locked content;
- insufficient resource;
- disabled action;
- active/running state;
- completed state;
- long names/high values;
- filtered-to-zero state.

## 26. Visual QA by Compilation Only

`npm run build` succeeding does not prove UI quality.

Open the actual screen and inspect it after meaningful layout/design work when browser/playtest tooling is available.

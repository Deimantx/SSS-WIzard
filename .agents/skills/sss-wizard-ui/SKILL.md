---
name: sss-wizard-ui
description: Design, modify, review, and visually validate UI for the SSS Wizard browser game. Use for screens, panels, shell, navigation, themes, responsive layout, Edit UI, tooltips, game-feel presentation, UI components, and visual consistency.
---

# SSS Wizard UI

## Purpose

Use this skill for UI work in **SSS Wizard**. It specializes the generic frontend/game UI skills for this repository's actual interface architecture.

SSS Wizard is an **information-dense, screen-based mage-only incremental RPG**, not a low-chrome 3D action game and not a SaaS dashboard. Persistent shell chrome, dense progression information, master-detail screens, editable panels, and contextual inspectors are intentional parts of the product.

If a generic UI skill conflicts with this skill, prefer this repository-specific skill for SSS Wizard design decisions. `AGENTS.md`, current runtime code, and the current Core Concept remain higher-priority sources of truth.

This skill was prepared from the repository state on **2026-09-09**. When the implementation has changed, inspect the current code before assuming an old detail is still true.

## Read Before Editing

For meaningful UI work, inspect only the relevant parts of these sources before coding:

1. `AGENTS.md` — mandatory repository rules and current Definition of Done.
2. `Docs/ARCHITECTURE.md` — feature ownership and shell/system boundaries.
3. The target screen in `src/screens/`.
4. The target screen's CSS under `src/styles/screens/`, `src/styles/tower-screens.css`, or the relevant shared style file.
5. `src/components/ui/index.tsx` and nearby shared components before creating a new primitive.
6. `src/styles/themes.css` and `src/styles/typography.css` before introducing visual tokens.
7. `src/ui/layout-editor/defaultLayouts.ts` and `layoutEditorTypes.ts` when the screen uses `EditableGrid`.
8. `src/app/GameShell.tsx` and `src/app/shell/` only when changing persistent shell UI.

Do not audit unrelated systems unless the task requires them.

## Core Product UI Model

Preserve the established hierarchy:

- persistent **left Sidebar** for primary navigation;
- persistent **Topbar** for global context/resources/utilities;
- one main scrollable screen surface;
- screen header / `TowerFrame` framing where appropriate;
- `EditableGrid` for normal editable screen panels;
- **Activity Monitor** as persistent ongoing-activity feedback;
- shared overlays for tooltips, menus, dialogs, toasts, rewards, Developer Tools, and Edit UI.

Do not replace this with a generic dashboard shell, route-local navigation chrome, or a canvas-only interface.

## Visual Direction

The default visual identity is **arcane dark fantasy**:

- near-black / midnight-violet background;
- layered dark violet panels;
- restrained violet magical accent;
- warm gold as secondary/progression emphasis;
- strong semantic resource colors for Health, Mana, Focus, status, and elemental damage;
- compact, information-dense typography;
- subtle magical atmosphere rather than ornamental clutter;
- crisp game-tool UI with restrained radii and bounded decorative chrome.

The game also supports Dark, Light, and Custom themes. Never make a feature visually correct only in the default theme.

Read `references/design-system.md` for the current system.

## UI Hierarchy Rules

Prioritize information in this order when relevant:

1. **Current actionable state** — what is running, selected, blocked, ready, or dangerous.
2. **Primary action / decision** — what the player can do next.
3. **Progress / cost / resource impact** — Mana, Focus, materials, timers, XP, caps, threat, etc.
4. **Build/detail information** — stats, modifiers, relationships, source details.
5. **Reference/diagnostic information** — keep deep detail behind inspectors, dialogs, advanced sections, or tooltips.

Do not make every statistic equal visual weight.

## Implementation Workflow

### 1. Inspect the existing UI

Before redesigning a screen:

- inspect the current screen composition;
- inspect one or two visually related screens;
- identify reusable shared components;
- identify its `EditableGrid` panel definitions/default layout;
- identify the screen's existing state/selectors/actions;
- identify the style file that currently owns the screen.

Do not redesign from memory when the repository already has an implementation.

### 2. Separate presentation from gameplay

A UI task must not silently move gameplay rules into components.

- Screens compose and present.
- Gameplay/content definitions stay in their authoritative game modules.
- Mutations use existing store/system actions.
- Reads should use current selectors/read models when available.
- UI preferences and layout state stay in UI infrastructure, not gameplay state.

If the requested visual change requires a gameplay behavior change, state that boundary explicitly before implementing it.

### 3. Reuse the design system

Before adding CSS values or primitives:

- use existing `--ui-*`, resource, semantic, typography, z-index, and content-width variables;
- reuse `Card`, `Button`, `Progress`, `Status`, `GameTooltip`, `SearchInput`, `Tabs`, `FilterBar`, `SelectMenu`, `ModalPortal`, and existing domain components where appropriate;
- reuse existing Game Feel primitives for feedback and transitions;
- reuse the themed scrollbar system for actual scroll owners.

Do not create a second design system inside one screen.

### 4. Respect the layout system

For normal editable screens:

- keep `EditableGrid` as the panel layout owner;
- maintain the 12-column model;
- register/change default geometry through the shared layout infrastructure;
- obey panel non-overlap, height-mode, and responsive stacking contracts;
- preserve saved user layouts unless a deliberate layout migration is required;
- keep the outer screen width under the shared `screen-content` / `app-content-shell` contract.

Read `references/layout-rules.md` before changing panel geometry.

### 5. Design dense UI intentionally

Information density is allowed and expected, but it must stay scannable.

Prefer:

- clear panel purpose;
- strong primary/secondary hierarchy;
- compact metadata rows;
- master-detail layouts for catalogs and inspectors;
- grouped controls with explicit semantics;
- progressive disclosure for long relationship lists and diagnostics;
- meaningful empty, locked, active, warning, and disabled states.

Avoid solving density by shrinking text below the shared typography system.

### 6. Tooltips and interaction states

The shared `GameTooltip` system is mandatory for contextual game UI.

- Never use native browser `title=` tooltips.
- Add tooltips to icons, abbreviations, costs, restrictions, non-obvious stats, and ambiguous actions.
- Keep item tooltips compact; large relationship lists belong in explicit View/dialog/inspector UI.
- Preserve keyboard focus behavior.
- Keep only one tooltip active at a time through the shared provider.

Every interactive element must have readable hover, active/selected, focus-visible, disabled, and locked states when applicable.

### 7. Motion and game feel

Use motion to communicate real state change, not to decorate every surface.

- Respect both persisted Reduced Motion and `prefers-reduced-motion`.
- Use shared screen/value/inspector/reward feedback infrastructure.
- Stronger motion belongs to milestones, rewards, danger, unlocks, crafting completion, and meaningful state changes.
- Same-identity value updates must not replay identity-change transitions.
- Decorative motion must never own or delay gameplay state.
- Do not add permanent per-screen WebGL/canvas loops; persistent ambience already has a shared owner.

### 8. Responsive and overflow pass

Before finishing, inspect at least:

- normal desktop;
- a narrower desktop/tablet-like width;
- narrow/mobile behavior when the screen supports it;
- increased text-size preference where the changed UI is text-dense.

Check:

- zero sibling panel overlap;
- no clipped final content;
- no accidental horizontal page overflow;
- internal scroll owners remain reachable and themed;
- dialogs/menus/tooltips remain contained in the viewport;
- long names and large values do not destroy geometry.

### 9. Visual validation

When available, use the existing `game-playtest` skill/browser workflow after meaningful visual changes.

Validation order:

1. run focused tests while iterating;
2. launch the game;
3. navigate to the changed screen/state;
4. inspect the actual rendered result;
5. test relevant theme/state/viewport variants;
6. fix visual defects found by inspection;
7. follow the current final validation rules in `AGENTS.md`.

A successful TypeScript build is not visual QA.

## Screen Design Patterns Already Established

Do not force every screen into the same arrangement. Reuse the pattern that fits the task:

- **master-detail:** Inventory, Collection, Bestiary, Schools, Artificing, parts of Research/Transmutation;
- **summary + working panels:** Channeling, Focus, Equipment, Settings;
- **stage + supporting strips:** Combat;
- **wide progression/summary + grouped work:** Home, Guild;
- **library + inspector + prepared/active work:** Research;
- **catalog/recipes + inspector + active production:** Transmutation/Artificing.

The current default panel geometry lives in `src/ui/layout-editor/defaultLayouts.ts`; treat that file, not this prose, as the exact source of truth.

## Definition of Done for UI Work

Before handoff, confirm:

- requested functionality is preserved unless explicitly changed;
- existing source-of-truth gameplay values were not duplicated into UI;
- shared components/tokens were reused where appropriate;
- the active theme system still works;
- contextual tooltips are complete;
- no native `title=` tooltip was introduced;
- panel overlap/clipping/overflow was checked;
- responsive behavior was checked;
- reduced-motion behavior was preserved;
- the visual result was inspected in the running game when tooling permits;
- targeted tests were added/updated when behavior changed;
- final validation follows `AGENTS.md`.

## References

Read these only when relevant to the task:

- `references/design-system.md` — colors, typography, theme, semantic styling, motion.
- `references/layout-rules.md` — shell, outer width, `EditableGrid`, panel and responsive contracts.
- `references/component-rules.md` — shared primitives and reuse decisions.
- `references/ui-antipatterns.md` — SSS Wizard-specific UI failure modes to avoid.

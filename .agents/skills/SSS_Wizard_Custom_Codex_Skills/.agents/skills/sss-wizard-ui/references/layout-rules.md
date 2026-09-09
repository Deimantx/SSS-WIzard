# SSS Wizard Layout Rules

This reference describes the current SSS Wizard screen/shell layout architecture. Exact runtime values in source code take precedence.

## 1. Persistent Shell

The persistent shell is owned by `src/app/GameShell.tsx` and `src/app/shell/`.

Core regions:

```text
GameShell
├── Sidebar
└── Main Area
    ├── Topbar
    ├── Screen scroll owner
    │   └── Screen content / screen frame
    ├── Activity Monitor
    └── overlays / transient feedback
```

Do not make individual screens recreate their own Sidebar, Topbar, Activity Monitor, or global resource header.

## 2. Sidebar

The Sidebar is persistent primary navigation and currently has a fixed desktop identity/width pattern.

Rules:

- navigation structure comes from shared app navigation, not hardcoded screen-local lists;
- active/hover states must stay theme-aware;
- avoid adding one-off links directly inside a screen when the destination belongs to primary navigation;
- narrow/mobile behavior must cooperate with the existing shell instead of creating a second navigation system.

## 3. Topbar

The Topbar is shared global context, not free screen-local space.

The current editable topbar regions are:

```text
topbar-breadcrumb
topbar-health
topbar-mana
topbar-focus
topbar-utilities
```

Topbar ordering/width customization is owned by layout infrastructure. Do not hardcode a second topbar layout inside screens.

Mana/Focus/Health information is globally meaningful. Keep global resource information concise and avoid duplicating the same readout prominently inside every screen unless local context genuinely requires it.

## 4. Main Scroll Ownership

The shell uses a dedicated `.screen-scroll` owner.

Main-screen wrappers, transition layers, and decoration must not crop real content.

Rules:

- final content must remain reachable;
- keep safe bottom padding;
- do not give decorative wrappers fixed heights that clip the screen;
- avoid nested page-level vertical scrollbars;
- bounded internal lists/panels may scroll when that is the intended panel contract.

## 5. Shared Outer Content Width

Normal game screens use the shared `.screen-content` / `.app-content-shell` width contract from:

`src/styles/layout/app-content.css`

Current model:

```text
base max width       1120px
wide max width       1520px at large desktop widths
ultrawide max width  1520px currently
shared gutters/padding controlled centrally
```

Do not create a screen-specific outer max-width just because a screen feels crowded. Improve its internal grid, responsive behavior, density, or panel composition first.

Combat is not an outer-width exception; its special responsiveness is internal.

## 6. EditableGrid Model

Normal editable screen panels use `src/ui/layout-editor/EditableGrid.tsx` and related infrastructure.

Current core grid constants in `layoutEditorTypes.ts`:

```text
columns:     12
row height:  30px
margin:      14px × 14px
```

These constants are source-owned. Do not duplicate them in screen math.

### Saved geometry

Only base user geometry is persisted:

```text
x
y
w
h
hidden?
locked?
```

Runtime measurement, reflow, auto-flow, and collision avoidance must not silently rewrite the user's saved geometry.

## 7. Panel Definition Contract

A panel definition can include:

```text
id
screen
label
defaultLayout
minW / minH
maxW / maxH
canHide
heightMode
```

Height modes are:

```text
content
bounded-scroll
```

Use `content` when the panel should naturally grow with its content.

Use `bounded-scroll` when the outer panel should remain bounded and an explicit internal viewport should scroll.

Never use clipped overflow as a fake bounded-scroll implementation.

## 8. Zero-Overlap Rule

Every visible normal sibling panel rendered through `EditableGrid` must have zero intersection area with other sibling panels.

Excluded overlay layers include:

- tooltips;
- modals/dialogs;
- popovers;
- Developer Tools;
- Layout Editor controls;
- toasts;
- other intentional portal layers.

Panel content also must not visually bleed into adjacent panel content.

Decorative pseudo-elements/chrome stay bounded to their host panel.

## 9. Locked and Hidden Panels

Locked means the player cannot manually move/resize the panel. It does **not** mean runtime collision handling may never reposition its effective layout.

Hidden panels:

- do not reserve normal runtime layout space;
- remain discoverable when Edit UI is explicitly showing hidden content.

Do not implement a second hide/lock state outside shared layout state.

## 10. Responsive Narrow Layout

The current layout contract stacks visible panels on narrow layouts.

Conceptually:

```text
x = 0
w = 12
panels stack vertically using effective height
```

Narrow layout must remain collision-free after content reflow and text-size changes.

For complex screens, internal content can also change from multi-column to stacked layouts. Do not preserve desktop micro-columns until they become unreadable.

## 11. Current Default Screen Patterns

Exact geometry lives in `src/ui/layout-editor/defaultLayouts.ts`. The important design patterns are:

### Home

```text
wide objective
wide school mastery
checklist + wizard split
wide arcane work
```

### Channeling

```text
Mana Core | Echoes
wide Pillars/progression
```

### Focus

```text
wide summary
reservations | improvement
```

### Research

```text
wide school mastery
library | inspector
wide prepared research
```

### Transmutation

```text
recipes/work column | detail/arrays column
focus/production supports the working flow
```

### Artificing

```text
catalog | detail/forge inspector
```

### Magic Schools

```text
browser | inspector
wide presets
```

### Combat

```text
wide combat stage
wide spell deck
wide analytics
```

### Inventory / Collection / Bestiary

Use master-detail browsing rather than dozens of independent equal-weight cards.

### Equipment

Use loadout/stats plus owned/inspector groupings.

### Guild

Use a wide banner/progression context, grouped request cards, then rank/progression.

### Settings

Use grouped sections; Appearance is a major area with separate preview, followed by save/layout/developer/info utilities.

## 12. Master-Detail Rules

Catalog + inspector is an established SSS Wizard pattern.

Use it when the player:

- browses many items/entities;
- selects one identity;
- needs richer details/actions for the selected identity.

Rules:

- selected state must be visually obvious;
- list/catalog remains usable while detail changes;
- same-identity numeric changes should not replay full inspector transition;
- long relationship data belongs in scrollable detail/dialog UI rather than bloating each list row;
- selection should survive reasonable filtering/state updates where the existing screen-state model supports it.

## 13. Screen Headers and Tower Screens

Tower screens use `TowerFrame` where established. Keep eyebrow/title/description framing consistent rather than inventing a new heading treatment per Tower destination.

Normal screen headers should remain informative but compact. SSS Wizard is not a marketing landing page; avoid giant hero sections that push gameplay below the fold.

## 14. Dialogs, Popovers, Menus

Use shared portal/layer infrastructure.

Rules:

- viewport containment is mandatory;
- background scrolling/focus behavior should follow the shared component;
- dropdown/select menus use the established layer contract;
- modals should not be rendered inside a clipping panel when a shared portal is available;
- do not repair a clipped overlay with arbitrary z-index escalation.

## 15. Layout Change Checklist

When changing a screen layout:

1. inspect the current default layout definition;
2. inspect its panel definitions/min sizes/height modes;
3. understand whether existing saved layouts require migration/version handling;
4. update the shared default/layout infrastructure rather than CSS-transforming panels around it;
5. test normal desktop;
6. test a narrow width;
7. test long content / large text where relevant;
8. verify zero overlap;
9. verify all scroll content is reachable;
10. verify Edit UI still selects/moves/resizes/hides/locks the intended panel surfaces.

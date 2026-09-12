# Screen Panel Layout Editing

## File map

Use the file that owns the kind of change you want to make:

| File | Responsibility |
| --- | --- |
| `src/ui/layout/screenPanelLayouts.ts` | Persistent source-controlled panel geometry: position, grid span, order, and base height. |
| `src/ui/config/uiTuning.ts` | Source-controlled visual defaults for panels, item cards, spell cards, stat rows, tooltips, and typography. |
| `src/ui/config/uiTuningSchema.ts` | The fields exposed by UI Tuning and their safe min/max/step limits. |
| `src/ui/config/uiTuningDraftStore.ts` | Temporary Developer Tools overrides, reset, import, and export. These values are in-memory only and never enter a player save. |
| `src/ui/config/uiTuningResolver.ts` | Combines base defaults, screen overrides, and the active tuning draft; also resolves panel geometry and CSS variables. |
| `src/components/layout/ScreenGrid.tsx` | Renders the resolved screen layout. Do not put screen-specific geometry constants here. |
| `src/app/GameShell.tsx` | Applies resolved tuning variables to the active screen shell and portaled tooltip root. |
| `src/styles/ui-tuning.css` | CSS-variable bridge for panel surfaces, cards, typography, stats, and tooltips. |
| `src/devtools/tabs/DeveloperUITuning.tsx` | Developer Tools → UI Tuning controls with immediate preview, reset, import, and export. |
| `src/devtools/developerToolsStore.ts` / `src/devtools/DeveloperToolTabs.tsx` | Registers and routes the UI Tuning Developer Tools tab. |
| `src/styles/developer-tools.css` | Styling for the UI Tuning controls themselves. |

For a permanent panel position or size change, edit
`screenPanelLayouts.ts`. For a quick visual experiment, use Developer Tools →
UI Tuning; its draft can later be exported or copied into the appropriate
source-controlled configuration.

The production geometry for screens that use `ScreenGrid` lives in one source
file:

```text
src/ui/layout/screenPanelLayouts.ts
```

This is the only file to edit when changing a screen panel's outer position or
size. Layout is static application configuration. It is not persisted in a
player save and it is not connected to the removed Edit UI/layout editor.

## Panel position

Each screen has a `panels` object. A panel entry uses a 12-column grid:

```ts
'example-panel': panel({
  order: 1,
  columnStart: 1,
  columnSpan: 7,
  rowStart: 1,
  minHeight: 420,
  preferredHeight: 620,
  label: 'Example panel',
}),
```

- `order` controls the layout order.
- `columnStart` is 1-based.
- `columnSpan` is the number of columns occupied.
- `rowStart` is an optional 1-based explicit row.
- `rowSpan` is an optional number of rows.

Keep sibling rectangles non-overlapping. For example, a 7-column panel at
`columnStart: 1` can sit beside a 5-column panel at `columnStart: 8`.

Common edits:

```ts
// Make an inspector wider.
columnStart: 7,
columnSpan: 6,

// Make a panel shorter while keeping a safe minimum.
minHeight: 320,
preferredHeight: 420,

// Place a panel after the other panels in its layout order.
order: 4,
```

## Panel size and behavior

Panel dimensions are CSS pixel values unless a percentage or `'auto'` is used.

- `minWidth`, `minHeight`: the smallest allowed outer panel size.
- `preferredWidth`, `preferredHeight`: the normal outer panel size.
- `maxWidth`, `maxHeight`: optional upper limits; use `null` for no limit.
- `alignSelf`, `justifySelf`: grid alignment (`stretch`, `start`, `center`, or
  `end`).
- `overflow`: outer panel overflow behavior (`visible`, `hidden`, or `auto`).

The screen-level `columnGap`, `rowGap`, `columns`, and alignment are in the
screen's `screen` block. Keep inner card padding, typography, content grids,
and scroll-body rules in the screen CSS instead of this file.

## Responsive layout

Responsive overrides are authored beside the screen configuration. The current
mobile convention stacks each panel across all 12 columns:

```ts
responsive: {
  mobile: {
    maxWidth: 760,
    panels: {
      'example-panel': {
        columnStart: 1,
        columnSpan: 12,
        rowStart: 'auto',
        preferredHeight: 'auto',
      },
    },
  },
},
```

Use a partial panel override when only a responsive property needs to change.
The production `ScreenGrid` merges it with the panel's base definition and
applies it through a scoped media rule.

When adding or renaming a `ScreenGrid` panel, update the corresponding entry in
this file at the same time. Missing entries use a safe full-width fallback and
produce a development warning; they should not be treated as the intended
layout.

# SSS Wizard — Central Screen Panel Layout Config
## Codex task — one editable file for all screen panel geometry

**Goal:** create ONE central file where I can manually edit every screen panel layout without touching screen components or scattered CSS.

---

# MAIN FILE I WILL EDIT

Create:

```text
src/config/screenPanelLayout.ts
```

This must be the **main human-editable file**.

It should contain every screen and every panel in one readable structure.

Example:

```ts
export const SCREEN_PANEL_LAYOUT = {
  schools: {
    gap: 12,
    columns: ['300px', '1fr', '260px'],

    panels: {
      'schools-browser': {
        order: 1,
        width: '300px',
        minWidth: '260px',
        maxWidth: '340px',
        height: '720px',
        minHeight: '600px',
        maxHeight: '850px',
        column: 1,
        row: 1,
        columnSpan: 1,
        rowSpan: 1,
      },
    },
  },
}
```

For every panel support:

```text
order
width
minWidth
maxWidth
height
minHeight
maxHeight
column
row
columnSpan
rowSpan
```

Optional:

```text
hidden
alignSelf
justifySelf
```

For each whole screen support:

```text
columns
rows
gap
columnGap
rowGap
```

Use readable CSS values:

```text
'280px'
'40%'
'1fr'
'2fr'
'auto'
'minmax(280px, 1fr)'
```

Organize the file by screen with clear comments.

---

# FILES AND WHAT THEY CONTROL

```text
src/config/screenPanelLayout.ts
→ MAIN FILE I EDIT
→ every panel width / height / min / max / order / row / column / span
```

```text
src/components/layout/ScreenGrid.tsx
→ layout renderer
→ reads screenPanelLayout.ts and applies the values
→ I should not need to edit this manually
```

```text
src/styles/layout/screen-grid.css
→ generic grid engine CSS only
→ display:grid, min-width, min-height, overflow, box-sizing
→ no per-screen hardcoded geometry
```

```text
src/screens/.../*Screen.tsx
→ defines which panels exist
→ stable panel IDs
→ panel content
→ NOT the place for manual width/height tuning
```

```text
src/styles/screens/*.css
→ internal panel styling
→ typography, buttons, cards, colors, inner spacing
→ NOT the place for panel geometry when it can live in the central config
```

Create also:

```text
Docs/UI_PANEL_LAYOUT_EDITING.md
```

Keep this guide very short. It should contain only a small table:

| What I want to change | File |
|---|---|
| Panel width / height / order | `src/config/screenPanelLayout.ts` |
| Add/remove panel content | relevant `src/screens/...Screen.tsx` |
| Global grid renderer | `src/components/layout/ScreenGrid.tsx` |
| Generic grid CSS | `src/styles/layout/screen-grid.css` |
| Internal visual design | relevant `src/styles/screens/*.css` |

And one tiny example.

---

# STABLE PANEL IDS

Every panel needs a stable ID.

Examples:

```text
inventory-vault
inventory-details

equipment-loadout
equipment-stats
equipment-armory
equipment-inspector

schools-browser
schools-inspector
schools-presets
```

Config keys must match these IDs exactly.

---

# IMPORTANT

Move scattered panel-geometry values into the central config where practical:

```text
grid-template-columns
grid-template-rows
fixed width
min/max width
fixed height
min/max height
panel order
row / column position
```

Keep only internal content styling in screen CSS.

This is NOT another runtime Edit UI tool.

No:
- drag/drop editor
- resize handles
- localStorage layout
- save-game layout
- runtime persistence

I only want ONE clean file I can edit in VS Code.

---

# EXPECTED RESULT

If I want to change Inventory:

```text
open:
src/config/screenPanelLayout.ts

find:
inventory

edit:
width
height
minHeight
maxHeight
order
column
row
```

Done.

Same for every other screen.

---

# COMPLETION REPORT

After implementation, report ONLY:

```text
src/config/screenPanelLayout.ts
→ main manual layout config

src/components/layout/ScreenGrid.tsx
→ renderer

src/styles/layout/screen-grid.css
→ generic grid CSS

Docs/UI_PANEL_LAYOUT_EDITING.md
→ quick reference

src/screens/.../*Screen.tsx
→ panel content + IDs

src/styles/screens/*.css
→ internal panel design
```

No long architecture explanation.

---

# EXECUTION

IMPLEMENT REQUESTED CHANGES → STOP.

No Vitest.
No npm test.
No browser automation.
No gameplay QA.
No unrelated redesign.

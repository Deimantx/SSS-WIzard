# SSS Wizard Component Rules

Use this document before creating new UI primitives or duplicating interaction logic.

## 1. Component Ownership

Current broad ownership:

```text
src/components/ui/       reusable generic game UI primitives
src/components/game/     reusable game-domain presentation
src/components/combat/   reusable combat presentation
src/components/spells/   reusable spell presentation
src/components/artifacts/ reusable artifact presentation
src/screens/<feature>/   screen-specific composition/components
src/ui/                  UI infrastructure and behavior
src/app/shell/           persistent shell UI
```

Put a component at the narrowest reusable ownership level that is correct.

Do not move gameplay simulation or authoritative content definitions into component folders.

## 2. Existing Shared UI Primitives

`src/components/ui/index.tsx` currently exposes/reuses important primitives including:

```text
Card
Button
Progress
Status
GameTooltip / Tooltip
SearchInput
Tabs
ArchiveProgressTile
FilterBar
SelectMenu
ModalPortal
EquipmentCombatDetails
GameValue
```

Before creating a component such as `MyButton`, `FancyPanel`, `LocalTooltip`, `CustomTabs`, `ScreenModal`, or `StyledSelect`, inspect the shared implementation first.

## 3. Card

Use `Card` for normal panel surface semantics when the screen pattern fits it.

It already provides the standard panel class and `data-game-panel` identity.

Do not wrap every small row/value in another card. Use internal grouping, separators, labels, and spacing before nesting multiple card surfaces.

## 4. Button

Use the shared `Button` variants when possible.

Available semantic variants currently include:

```text
primary
secondary
ghost
danger
success
```

The shared Button supports tooltip/accessibility and UI sound metadata.

Do not create screen-local click-sound listeners or a second button style system.

Icon-only buttons require a usable accessible label and normally a tooltip.

## 5. Progress and Game Values

Use shared progress/value primitives for common progress and changing numeric feedback.

Do not invent a new progress-bar DOM structure in every feature unless the visual/behavioral requirement is genuinely different.

Use semantic tones/colors. A Mana bar should not be hardcoded to an unrelated arbitrary blue when semantic Mana styling exists.

## 6. Status

Use shared status semantics for active/success/warning/locked/neutral state labels when suitable.

Do not create dozens of nearly identical badge classes with slightly different hardcoded colors.

## 7. Tooltips

`GameTooltip` is mandatory infrastructure for game context.

Rules:

- no native `title=`;
- no per-screen tooltip provider;
- no duplicate hover timers;
- one shared system owns placement/layering;
- preserve focus support;
- keep content bounded and concise.

Use explicit inspector/dialog views for large data sets.

## 8. Tabs and Filters

Use the existing interaction language consistently.

- one-of-many content mode/category → tabs/radio-style control;
- many independent filters → toggle/checkbox-style control;
- search → shared SearchInput when appropriate;
- common filter rows → inspect `FilterBar` before creating new filter chrome.

Do not style exclusive and combinable filters identically.

## 9. Select Menus

Inspect shared `SelectMenu` before using a raw/native select in a visually important game surface or building a local dropdown.

A new dropdown implementation must justify why the shared component cannot support the required behavior.

Do not create ad hoc body portals/layer math when the shared select/menu infrastructure already handles it.

## 10. ModalPortal

Use the shared modal portal for real dialogs.

Do not render modals as absolutely positioned descendants of an `EditableGrid` panel, because panel clipping/stacking can break them.

A dialog must:

- remain viewport-contained;
- use established overlay layers;
- have clear close semantics;
- preserve keyboard/focus behavior expected by the shared implementation;
- not leave body scrolling in a broken state.

## 11. Shared Game-Domain Components

Before reproducing a game concept, inspect `src/components/game/` and the relevant domain component folders.

Examples of established reusable concepts include school mastery and item/equipment details.

Rule of thumb:

- same game concept on multiple screens → shared domain component/read model;
- one screen's unique composition → screen-local component;
- authoritative mechanics/value → game/store layer, not component.

## 12. EditableGrid and Panel Registration

Do not bypass `EditableGrid` by absolutely positioning a normal screen panel on top of the grid.

When adding a new normal panel:

- give it a stable panel id;
- register default geometry through shared layout definitions;
- define sensible minimum sizing/height mode where necessary;
- ensure hidden/locked/edit behavior remains valid;
- account for layout version/migration if the shared infrastructure requires it.

## 13. Inspector Transitions

Master-detail identity changes should reuse the shared inspector-transition pattern where established.

Do not remount or replay the whole inspector effect for every quantity/timer/stat update of the same selected item/entity.

## 14. Rewards and Feedback

Use the established feedback hierarchy rather than announcing the same event everywhere:

```text
common live item rewards       → Loot Reveal
meaningful progression unlocks → Milestone Banner
generic system information     → Toast
short local reaction           → Game Feel FX
```

Do not emit the same result through a modal + toast + banner + sound + loot reveal unless the product intentionally calls for that exceptional emphasis.

## 15. Audio

UI audio has one shared lazy engine and delegated generic cues.

Do not:

- create an `AudioContext` per component/screen;
- attach sound handlers to every button independently;
- play completion audio for high-frequency routine production ticks.

Use stronger audio only for meaningful semantic results.

## 16. WebGL / Atmosphere

Persistent ambience has a shared `ArcaneAtmosphere` owner.

Do not create an additional permanent animation renderer for an individual screen.

Transient visual FX can exist when short, bounded, pointer-transparent, non-persistent, and controlled by the shared game-feel approach.

## 17. State Placement

Choose state ownership deliberately:

### Gameplay state

Lives in authoritative game/store systems and is persisted only through the save architecture.

### UI preference/layout state

Lives in UI preference/layout infrastructure.

### Navigation intent

Use the established navigation-intent infrastructure when one screen deep-links another screen into a selection/context.

### Transient visual state

Short effects, local open/closed state, hover/temporary presentation can stay in UI/component state when appropriate.

Do not persist purely decorative/transient state into the gameplay save.

## 18. CSS Ownership

Prefer the existing style organization:

```text
src/styles/components/
src/styles/screens/
src/styles/shell/
src/styles/tools/
src/styles/layout/
```

Do not keep growing a giant unrelated global selector block when a feature-specific stylesheet already has clear ownership.

When moving styles, update `src/styles/index.css` imports deliberately and remove obsolete duplicates.

## 19. Reuse Decision Checklist

Before creating a new UI component, answer:

1. Does a shared primitive already do this?
2. Does a domain component already present the same concept?
3. Can the existing component support one small, general extension?
4. Would extending it make the shared API confusing for unrelated consumers?
5. Is this truly screen-specific?

Prefer reuse/general extension when it stays conceptually clean. Prefer a local component when generalizing would create a bloated "god component".

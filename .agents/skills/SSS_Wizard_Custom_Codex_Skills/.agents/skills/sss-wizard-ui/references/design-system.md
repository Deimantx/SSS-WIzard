# SSS Wizard UI Design System Reference

This document captures the current visual system so new UI stays native to SSS Wizard. It is a **reference**, not a reason to duplicate constants. The runtime CSS/theme files remain authoritative.

## 1. Authoritative Sources

Before changing shared visual language, inspect:

- `src/styles/themes.css`
- `src/ui/theme/themePresets.ts`
- `src/styles/typography.css`
- `src/styles.css`
- `src/styles/scrollbars.css`
- `src/styles/index.css`
- `src/ui/preferences/`

Never copy a theme value into screen-local CSS when a semantic variable already exists.

## 2. Current Visual Identity

SSS Wizard uses a restrained **arcane dark-fantasy** interface rather than ornate medieval decoration or generic futuristic neon.

Desired character:

- mysterious;
- precise;
- compact;
- magical without being noisy;
- readable during long idle-management sessions;
- capable of displaying a lot of game state without feeling like business software.

The default theme currently centers on midnight backgrounds, violet magic, warm gold accents, pale text, and soft violet-grey borders.

## 3. Theme Tokens

Use semantic CSS variables instead of direct colors.

Primary surface/text variables include:

```text
--ui-bg
--ui-bg-elevated
--ui-sidebar
--ui-topbar
--ui-panel
--ui-panel-strong
--ui-panel-hover
--ui-border
--ui-border-strong
--ui-text
--ui-text-soft
--ui-text-muted
--ui-text-disabled
--ui-accent
--ui-accent-strong
--ui-accent-soft
--ui-secondary
--ui-gold
--ui-danger
--ui-success
--ui-warning
--ui-shadow
--ui-panel-gradient-start
--ui-panel-gradient-end
```

Resource variables include:

```text
--resource-health
--resource-mana
--resource-focus
```

Semantic combat/status variables include the existing `--semantic-*`, `--combat-*`, and details variables in `themes.css`.

### Current default-theme visual reference

These values describe the current direction and are useful for visual reasoning; **do not hardcode them into new screen CSS**:

```text
Background             ~ #090b13
Elevated background    ~ #111326
Panel                  ~ #141623 / translucent equivalent
Panel strong           ~ #17192a
Primary text           ~ #eceaf8
Muted text             ~ #aaa8bd
Violet accent          ~ #a894ff
Strong violet          ~ #7164c8
Gold / secondary       ~ #efbd77
Danger                 ~ #e87778
Success                ~ #70cda3
Warning                ~ #f09b70
```

The repository also supports `dark`, `light`, and `custom` themes. New UI must be based on variables so those themes remain coherent.

## 4. Semantic Color Rules

Color should communicate meaning, not merely decorate.

Use:

- Health semantic color for health/damage-to-health context;
- Mana semantic color for Mana flow/cost/current Mana context;
- Focus semantic color for Focus reservation/capacity context;
- violet accent for arcane/selected/primary magical emphasis;
- gold for important progression, valuable secondary emphasis, or established gold semantics;
- success/danger/warning tokens for their actual states;
- school/element colors only where element identity is meaningful.

Avoid inventing a new color for every panel or metric.

## 5. Typography

Authoritative file: `src/styles/typography.css`.

Current families:

```text
--font-sans  → Manrope with system fallbacks
--font-mono  → DM Mono with monospace fallbacks
```

Use sans for normal UI copy and mono selectively for compact technical/game readouts, labels, timers, values, resource details, codes, and established uppercase micro-labels.

Current size tokens:

```text
--text-micro
--text-xs
--text-sm
--text-base
--text-md
--text-lg
--text-xl
--text-2xl
--text-3xl
```

Responsive UI-specific tokens also exist:

```text
--ui-font-micro
--ui-font-small
--ui-font-body
--ui-font-label
--ui-font-title
```

### Typography rules

- Reuse tokens; do not add one-off 8px/9px microtext just to make a panel fit.
- Make layout reflow before sacrificing readability.
- Preserve the user's text-size preference.
- Headings should establish hierarchy, not consume huge vertical space.
- Dense metadata can be compact, but body/explanatory text must remain comfortably readable.
- Avoid excessive uppercase; reserve it for established micro-label/eyebrow/status language.

## 6. Surfaces, Borders, and Cards

Existing `Card` styling uses subtle layered gradients, restrained borders, and soft shadowing.

Desired behavior:

- panels should feel embedded in one game surface, not like isolated floating web cards;
- use border/contrast/spacing before adding heavy shadows;
- keep radii restrained and consistent with existing components;
- decorative chrome must be paint-only and stay inside its host panel;
- hover treatment should improve affordance without turning the panel into a glowing neon tile.

Do not create a new panel style for every screen.

## 7. Buttons and Controls

Use the shared `Button` variants where they fit:

```text
primary
secondary
ghost
danger
success
```

Primary actions should be visually scarce. If five controls all look primary, none is primary.

For filters:

- mutually exclusive choice → tabs/radio-like presentation;
- combinable choices → toggle/checkbox-like presentation.

Do not make those two interaction models look identical.

Use shared `SelectMenu` where a themed custom select is required instead of falling back to visually inconsistent native/default controls without reason.

## 8. Tooltips

Use shared `GameTooltip` / `TooltipProvider`.

Tooltip design should be:

- theme-aware;
- compact;
- contextual;
- bounded to viewport;
- readable by keyboard focus when appropriate.

Never use HTML `title=` as the game's tooltip implementation.

Do not place giant relationship lists in item tooltips. Use a modal, explicit View action, or inspector.

## 9. Icons

The repository uses Lucide plus game-specific asset/icon infrastructure.

Rules:

- use established icons for common actions before adding a new visual vocabulary;
- icon-only actions need an accessible name and contextual tooltip;
- do not mix arbitrary emoji into final game UI unless the screen intentionally uses that language;
- icon color should normally inherit semantic/contextual color rather than being uniquely colored for decoration.

## 10. Spacing and Density

SSS Wizard is intentionally denser than a marketing site or SaaS dashboard.

Use existing screen/component spacing as the baseline. The grid itself currently uses a 14px margin between panel cells.

Good density means:

- clear grouping;
- predictable alignment;
- enough space to scan;
- compact metadata;
- no accidental giant dead zones;
- no text crushed against borders.

Do not create a second arbitrary spacing scale in one feature.

## 11. Scrollbars and Overflow

The game has shared themed scrollbar styling.

For real bounded scroll areas:

- make the scroll owner explicit;
- use shared smart-scroll behavior when the existing pattern requires it;
- keep the scrollbar reachable;
- do not hide overflow when content becomes unreachable;
- do not introduce default-looking browser/OS scrollbars when the shared themed system applies.

## 12. Motion

Motion is semantic and bounded.

Use shared Game Feel infrastructure for:

- screen transitions;
- interaction feedback;
- value pulses;
- inspector identity transitions;
- progress motion;
- short success/error/craft/unlock effects;
- reward presentation.

Do not:

- animate every panel continuously;
- add 3D tilt;
- create pointer-coordinate React state;
- add per-screen permanent canvas/WebGL ambience;
- use motion as gameplay timing/state ownership.

Respect both:

- `prefers-reduced-motion`;
- the persisted Reduced Motion preference.

## 13. Layering

Shared z-index tokens already exist in `themes.css`, including normal, sticky, dropdown, context, tooltip, modal, modal-tooltip, and toast layers.

Use the established layer system. Do not solve overlay bugs with random values such as `z-index: 999999`.

## 14. Accessibility Baseline

At minimum:

- preserve `focus-visible` treatment;
- give icon-only controls accessible labels;
- preserve keyboard interaction for shared controls;
- do not communicate critical state with color alone;
- ensure light/dark/custom themes maintain readable contrast;
- test large/extra-large text when a change is layout-sensitive;
- preserve Reduced Motion.

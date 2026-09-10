---
name: sss-wizard-ui
description: Orchestrates all UI design, redesign, review, and visual validation work for the SSS Wizard browser game. Use for screens, panels, navigation, overlays, tooltips, responsive layout, Edit UI, game-feel, visual polish, and any premium/high-quality interface task. For major visual work, this skill MUST coordinate the repository's frontend-design, game-ui-frontend, and high-end-visual-design skills instead of replacing them.
---

# SSS Wizard UI — Repository UI Orchestrator

## 1. Purpose

Use this skill for all meaningful UI work in **SSS Wizard**.

SSS Wizard is an information-dense, screen-based mage-only incremental RPG. It is not:

- a SaaS dashboard,
- a generic website,
- a low-chrome 3D action game,
- or an Awwwards landing page.

Its established identity is:

- arcane dark fantasy,
- futuristic magical instrumentation,
- compact but readable information density,
- strong game-state hierarchy,
- persistent game shell,
- master-detail interaction,
- contextual inspectors,
- rich tooltips,
- restrained but high-quality game feel,
- premium motion for meaningful interactions.

This skill is the **repository-specific orchestration layer**.

It does NOT replace generic visual design skills.

For major visual work, it MUST explicitly use the other design skills described below.

---

# 2. Source-of-truth priority

When instructions conflict, use this priority:

1. User's current request
2. Current repository code and content
3. `AGENTS.md`
4. SSS Wizard architecture / design system
5. This `sss-wizard-ui` skill
6. Generic frontend/game/high-end design skills

Generic skills are used to improve design quality, not to override SSS Wizard's established product rules.

Example:

If `high-end-visual-design` says:

```text
never use Inter
```

but SSS Wizard's actual typography system uses Inter intentionally:

```text
KEEP THE SSS WIZARD TYPOGRAPHY SYSTEM
```

Do not blindly apply generic hard bans.

Likewise, do not force:
- huge landing-page whitespace,
- oversized marketing typography,
- giant pill buttons,
- massive rounded cards,
- blur-heavy surfaces,
- generic agency page structure,

when they conflict with the game's dense RPG interface.

---

# 3. REQUIRED SKILL ORCHESTRATION

## 3.1 Minor maintenance / bugfix UI task

Examples:
- overlap fix,
- wrong spacing,
- tooltip bug,
- one missing state,
- button alignment,
- small responsive fix.

Required skills:

```text
sss-wizard-ui
```

Also use:

```text
sss-wizard-code-quality
```

when code structure, cleanup, or architecture is involved.

Do not load every design skill for trivial fixes.

---

## 3.2 Major visual redesign / new screen / navigation system

This is mandatory for tasks such as:

- redesigning a whole screen,
- replacing a navigation system,
- creating a new major panel/workspace,
- creating campaign/Act navigation,
- designing map/tree progression,
- creating a new major modal,
- user asks for "premium",
- user asks for "high quality",
- user asks for "advanced game feel",
- user says current UI looks generic/cheap/bad,
- substantial layout/composition changes.

Before coding, MUST inspect and apply:

```text
../frontend-design/SKILL.md
../game-ui-frontend/SKILL.md
../high-end-visual-design/SKILL.md
```

Also inspect:

```text
../sss-wizard-code-quality/SKILL.md
```

when implementation touches architecture or introduces multiple components.

Use:

```text
../game-playtest/SKILL.md
```

for visual/runtime validation when that environment is available.

### HARD RULE

Do NOT skip these generic design skills merely because `sss-wizard-ui` is more specific.

For major visual tasks:

```text
sss-wizard-ui = constraints / game identity
frontend-design = distinctive visual concept
game-ui-frontend = game UX / interaction hierarchy
high-end-visual-design = premium finishing / motion / depth
```

They are complementary.

---

# 4. Major visual task workflow — mandatory

For any major visual redesign, follow this sequence.

## PHASE 1 — Inspect

Before editing:

- read `AGENTS.md`,
- inspect the actual target screen,
- inspect its owning CSS,
- inspect one or two visually related SSS Wizard screens,
- inspect shared UI primitives,
- inspect theme/typography tokens,
- inspect relevant layout-editor definitions,
- inspect the required design skills from Section 3.

Do not redesign from memory.

---

## PHASE 2 — Visual direction gate

Before writing JSX/CSS, explicitly determine the following internally:

### A. Visual concept
What is the screen supposed to feel like?

Examples:
- arcane campaign console,
- magical command chamber,
- dark ritual interface,
- enchanted progression map,
- scholar's research desk,
- tactical spell-control surface.

### B. Hero element
What is the single dominant visual/interactive element?

Examples:
- progression tree,
- spell deck,
- portal,
- map,
- selected equipment,
- selected research project.

### C. Hierarchy
Define:

```text
1. primary state
2. primary action
3. progression/cost
4. secondary detail
5. reference/diagnostic detail
```

### D. Spatial composition
Decide:
- master-detail,
- asymmetric split,
- stage + inspector,
- two-row workspace,
- compact selector + selected inspector,
- progression canvas + information rail,
- another intentional structure.

Do not automatically use a generic equal-card grid.

### E. Motion language
Define:
- what moves,
- why it moves,
- how strong the motion is,
- which state changes deserve stronger feedback.

### F. Distinctive feature
Every major screen redesign should have at least one memorable interaction or visual motif.

Examples:
- animated progression rail,
- selected-node energy propagation,
- portal resonance,
- arcane scanning line,
- meaningful active-route glow,
- contextual layered inspector transition.

If no clear answers exist, the design is not ready to code.

---

# 5. Anti-generic design rule

For major redesigns:

```text
FUNCTIONALLY CORRECT IS NOT ENOUGH.
```

The result must not look like:
- a generic admin dashboard,
- a CSS component gallery,
- a React-flow demo,
- a bootstrap card grid,
- "dark mode SaaS",
- random purple glowing rectangles,
- placeholder developer UI.

Before finishing, ask:

```text
Could this screenshot obviously belong to SSS Wizard?
```

If not, it needs another visual pass.

---

# 6. Reuse infrastructure, not weak composition

Existing code is not automatically good design.

For user-requested major redesigns:

```text
Reuse:
- game state,
- gameplay systems,
- shared primitives,
- theme tokens,
- accessibility patterns,
- tooltips,
- sound/game-feel infrastructure.

Do NOT automatically preserve:
- weak layout,
- generic panel composition,
- old spacing,
- redundant text,
- bad information hierarchy,
- legacy UI simply because it already exists.
```

If the user explicitly asks to replace the old composition, replace it.

---

# 7. SSS Wizard visual identity

Default SSS Wizard direction:

- near-black / midnight-violet background,
- layered dark violet/navy surfaces,
- restrained arcane violet accent,
- warm gold for milestones / bosses / progression,
- semantic resource colors for Mana / HP / Focus / damage,
- compact information-dense typography,
- crisp geometric instrumentation,
- subtle magical atmosphere,
- futuristic arcane detail,
- controlled glows,
- restrained radii,
- clear state borders,
- depth without excessive blur.

The game should feel like:

```text
an arcane RPG interface
+
a magical command system
+
a premium modern browser-game frontend
```

not a normal website.

---

# 8. Typography

Use the existing SSS Wizard typography system unless the user explicitly requests a typography redesign.

Do not apply generic skill font bans blindly.

Hierarchy should come from:
- weight,
- size,
- tracking,
- contrast,
- spacing,
- grouping,

not constant oversized headings.

Dense game UI must remain readable.

---

# 9. Icons

Use the existing icon system unless the task includes an icon-system redesign.

Do not blindly replace existing icons because a generic skill bans a library.

For important major visual surfaces:
- avoid visually heavy generic icons,
- prefer clean, light, precise glyphs,
- use existing game/domain icons where available,
- maintain consistent stroke weight.

---

# 10. Layout hierarchy

Prioritize information in this order:

1. Current actionable state
2. Primary action / decision
3. Progress / cost / resource impact
4. Build / system detail
5. Reference / diagnostic information

Do not make every statistic equal visual weight.

Use progressive disclosure for:
- formulas,
- provider breakdowns,
- source provenance,
- long relationship lists,
- developer diagnostics.

Normal player-facing screens must not look like DevTools.

---

# 11. Established SSS Wizard screen patterns

Use the pattern that fits the feature.

Examples:

```text
master-detail
Inventory
Collection
Bestiary
Schools
Artificing

summary + workspace
Channeling
Focus
Equipment

stage + support/inspector
Combat

library + inspector + active work
Research
Transmutation

progression canvas + inspector
Campaign / Act navigation
future large progression systems
```

Do not force every feature into the same panel layout.

---

# 12. Major progression / navigation screens

For:
- Combat Campaign,
- Act tree,
- progression maps,
- dungeon trees,
- Dark Portal progression,
- other large navigation systems,

prefer:

```text
one hero progression canvas/stage
+
one compact contextual inspector
+
one compact global selector / timeline
```

Avoid:
- many equal-weight panels,
- excessive tiny labels,
- admin-like metadata,
- repeated headers,
- unnecessary cards around every text block.

The central interactive progression surface should dominate.

---

# 13. Tooltips

Use the shared `GameTooltip`.

Never use native:

```html
title=""
```

Tooltips are required for:
- icons,
- abbreviations,
- costs,
- restrictions,
- unknown states,
- non-obvious mechanics,
- locked reasons,
- progression nodes.

But tooltips are supplemental.

Important information must also exist in the main inspector/state when needed.

---

# 14. Motion / advanced game feel

Use motion intentionally.

## Stronger motion belongs to:
- unlocks,
- milestones,
- rewards,
- boss-ready state,
- Act completion,
- major selection changes,
- new system reveals.

## Small motion belongs to:
- hover,
- selected-state change,
- node activation,
- buttons,
- inspector transitions.

Avoid constant visual noise.

Prefer:
- transform,
- opacity,
- subtle filter/lighting where performant,
- custom easing,
- short spring-like state feedback.

Respect:
- persisted Reduced Motion,
- `prefers-reduced-motion`.

No animation may delay gameplay state.

---

# 15. Premium finishing — selective use of high-end-visual-design

Use `high-end-visual-design` for:

- composition quality,
- depth,
- spacing rhythm,
- border layering,
- selected-state hierarchy,
- subtle material treatment,
- motion choreography,
- high-quality interaction feedback,
- anti-generic thinking.

Do NOT automatically apply:
- huge marketing whitespace,
- massive rounded pills everywhere,
- full landing-page archetypes,
- excessive backdrop blur,
- giant section padding,
- arbitrary font replacement,
- decorative gimmicks that hurt game density.

Translate premium design principles into SSS Wizard's game context.

---

# 16. Game UI principles — use game-ui-frontend

Use `game-ui-frontend` to ensure:

- interaction hierarchy is obvious,
- screen feels game-native,
- persistent UI does not become admin chrome,
- player actions remain clear,
- overlays/modal input boundaries are correct,
- map/tree drag does not fight buttons/tooltips,
- desktop and responsive behavior are considered.

For SSS Wizard, "protect playfield" means:

```text
protect the hero interaction/progression surface
```

not necessarily a 3D camera.

---

# 17. Distinctive frontend direction — use frontend-design

Use `frontend-design` for:

- choosing a strong visual concept,
- avoiding generic AI UI,
- creating an intentional composition,
- atmospheric background treatment,
- memorable interaction motif,
- visual differentiation.

Then constrain the result to SSS Wizard's existing:
- theme,
- typography,
- density,
- component system.

---

# 18. Responsive / overflow rules

Before finishing meaningful UI work, inspect:

- normal desktop,
- wide desktop,
- narrower desktop/tablet-like width,
- mobile/narrow if supported,
- increased text size when relevant.

Check:
- no sibling overlap,
- no clipped final content,
- no accidental page-level horizontal overflow,
- themed scroll owners,
- modals fit viewport,
- tooltips stay contained,
- long names do not break cards,
- values do not overlap badges,
- drag/pan remains usable.

---

# 19. Visual QA is mandatory for major redesigns

A TypeScript build is not visual QA.

For major visual tasks, when tooling permits:

```text
1. launch game
2. navigate to changed screen
3. inspect actual rendered UI
4. inspect requested gameplay state
5. capture/review screenshot if possible
6. compare against user feedback/mockup
7. fix visual problems
8. repeat focused visual pass
```

If live visual inspection is impossible:

```text
state that explicitly in the completion report.
```

Do NOT claim:

```text
looks good
pixel-perfect
premium
```

from code inspection alone.

---

# 20. Screenshot feedback rule

When the user provides a screenshot and says:

```text
node is too high
panel overlaps
spacing is wrong
text is lost
map feels empty
```

treat that visual feedback as ground truth.

Do not argue from CSS theory that the layout "should" be correct.

Fix the rendered result.

---

# 21. Major visual completion gate

Before saying a major redesign is complete, verify:

```text
VISUAL CONCEPT
- clear and intentional

HIERARCHY
- primary interaction obvious

COMPOSITION
- not generic

GAME FEEL
- meaningful hover/select/action feedback

SSS WIZARD IDENTITY
- unmistakable

FUNCTION
- gameplay wiring preserved

TOOLTIPS
- complete where needed

RESPONSIVE
- no overlap/clipping

RUNTIME VISUAL QA
- performed if tooling available
```

If one of these clearly fails, do another polish pass.

---

# 22. Code architecture

Separate:
- gameplay/content data,
- read models/selectors,
- UI state,
- presentation,
- interaction.

Do not:
- hardcode gameplay rules in JSX,
- duplicate canonical numbers into CSS/components,
- create a second tooltip system,
- create a second sound system,
- create a second theme system.

Reuse current infrastructure.

---

# 23. Layout editor

For screens using `EditableGrid`:

- keep the 12-column model,
- use `DEFAULT_LAYOUTS` as canonical geometry,
- obey content vs bounded-scroll behavior,
- no sibling overlap,
- no visual escape from bounded panels.

Project policy:

```text
when canonical screen geometry changes materially
→ update DEFAULT_LAYOUTS
→ bump LAYOUT_VERSION
→ old screen layouts reset
```

Do not reintroduce historical per-screen geometry migrations.

---

# 24. Testing policy

Follow the current task's explicit validation instructions first.

For this repository, broad test runs can be extremely expensive.

Do not automatically run the entire Vitest suite for UI work.

If the task explicitly says:

```text
NO VITEST
```

that instruction wins.

Prefer:
- focused reasoning,
- visual runtime inspection,
- targeted tests only when explicitly requested/appropriate,
- at most the requested build workflow.

---

# 25. Agent skill reporting

For meaningful UI work, completion report must include:

```text
SKILLS USED
```

with exact paths.

Example:

```text
SKILLS USED
- sss-wizard-ui — .agents/skills/sss-wizard-ui/SKILL.md
- frontend-design — .agents/skills/frontend-design/SKILL.md
- game-ui-frontend — .agents/skills/game-ui-frontend/SKILL.md
- high-end-visual-design — .agents/skills/high-end-visual-design/SKILL.md
- game-playtest — .agents/skills/game-playtest/SKILL.md
```

If a required skill could not be found/read:

```text
state that explicitly.
```

Do not silently omit it on a major visual redesign.

---

# 26. Major redesign anti-pattern checklist

A major UI redesign fails if it ends up as:

- generic equal cards,
- huge empty panel with tiny content,
- random node placements,
- excessive micro-labels,
- developer terminology visible to player,
- default browser-feeling controls,
- weak selected state,
- unclear primary action,
- flat dark rectangles with purple borders,
- motion everywhere with no purpose,
- copied agency website aesthetics that do not fit the game,
- preserved bad old layout just because it existed,
- "looks good" claimed without rendered inspection when inspection was possible.

---

# 27. Final definition of done

Before handoff, confirm:

- requested functionality is preserved unless intentionally changed;
- canonical gameplay data remains authoritative;
- required complementary design skills were actually read for major visual work;
- visual concept was chosen before coding;
- screen has a clear hero interaction;
- design is not generic dashboard UI;
- SSS Wizard identity is preserved;
- shared components/tokens are reused appropriately;
- tooltips are correct;
- hover/selected/focus/disabled/locked states exist;
- motion communicates state instead of adding noise;
- responsive/overflow behavior was checked;
- runtime visual inspection was performed when available;
- screenshot/user feedback was treated as source of truth;
- completion report lists exact skills used.


---
name: sss-wizard-code-quality
description: Preserve architecture, source-of-truth ownership, maintainability, tests, and refactor quality in the SSS Wizard codebase. Use for implementation, refactoring, cleanup, architecture review, bug fixes, cross-system changes, and spaghetti-code prevention.
---

# SSS Wizard Code Quality

## Purpose

Use this skill when changing or reviewing SSS Wizard code where maintainability, architecture, source ownership, state boundaries, testing, or cleanup matters.

This skill complements `AGENTS.md`; it does not replace it. **`AGENTS.md` is the current mandatory repository rulebook.** If this skill becomes stale, current code + `AGENTS.md` + `Docs/ARCHITECTURE.md` win.

Prepared from the repository state on **2026-09-09**.

## First Principle: Find the Owner Before Editing

Do not start by editing the first component that displays a value.

Determine which layer owns the concept:

```text
src/app/                 persistent shell and navigation composition
src/components/          reusable presentation components
src/devtools/            tester/developer workspace
src/game/core/           generic game primitives, types, balance foundations
src/game/content/        authoritative authored game definitions
src/game/data/           compatibility exports; not the home for new authored data
src/game/systems/        simulation and derived domain behavior
src/game/presentation/   shared presentation/read-model helpers where established
src/game/telemetry/      game telemetry/readout infrastructure
src/persistence/         save schema, migrations, profile serialization
src/profiles/            profile lifecycle/metadata
src/screens/             screen composition and feature-local presentation
src/store/               Zustand/Immer store composition
src/store/actions/       state mutations/domain actions
src/store/selectors/     reusable read models/selectors
src/ui/                  UI infrastructure/preferences/layout/navigation/game-feel
src/styles/              global, shell, component, screen, and tool styling
```

New code should reinforce those boundaries rather than inventing parallel ownership.

## 1. Source-of-Truth Discipline

Authoritative gameplay/content definitions belong in the central game content/balance modules.

Do not duplicate into screens/components:

- item or monster definitions;
- recipes;
- equipment slot/category rules;
- loot tables;
- costs;
- unlock conditions;
- formulas;
- progression thresholds;
- Focus calculations;
- dungeon rosters;
- spell/status/trait definitions.

UI may format and derive presentation from authoritative data, but must not become the second database.

When a concept already has a selector/helper/read model, reuse it instead of recomputing a slightly different version in multiple screens.

## 2. Dependency Direction

Protect the core dependency direction.

### Allowed intent

```text
content/core → systems → store actions/selectors → screens/components/UI
```

Presentation can observe authoritative gameplay results.

### Avoid

- game/content importing screen/UI modules;
- systems importing visual feedback components;
- low-level loot/combat/crafting modules emitting React UI;
- persistence depending on screen implementation;
- shared game rules importing Developer Tools.

If a lower layer needs metadata currently trapped in UI, move that metadata to an appropriate shared/game layer rather than creating a reverse dependency.

## 3. `game/content` vs `game/data`

`src/game/content` is the authoritative home for authored definitions.

`src/game/data` is compatibility territory for older imports.

Do not add new authored systems/data to `game/data` merely because an older file exists there.

When touching a compatibility export:

- preserve consumers deliberately;
- migrate imports when the task includes cleanup;
- do not create a second evolving implementation in the compatibility path.

## 4. Systems and Mutations

Simulation/resource mutation belongs in game systems and store/domain actions, not in presentation components.

Prefer:

- pure calculations in system/core helpers;
- explicit store actions for state mutations;
- selectors/read models for shared derived reads;
- deterministic functions that are testable without rendering React.

Avoid components that both render UI and directly implement domain algorithms.

## 5. State Boundary Rules

Classify new state before adding it.

### Gameplay/save state

Use only when the value is real progression/simulation state that must survive sessions.

### UI preference state

Use for theme, text size, Reduced Motion, screen selections/preferences, UI options, and other established UI settings.

### Layout state

Use shared layout-editor infrastructure for panel/topbar geometry and visibility/lock state.

### Navigation intent

Use the established navigation-intent path for contextual deep-linking between screens.

### Runtime debug/test override

Keep it runtime-only according to current debug architecture; normal profile serialization must not accidentally persist tester overrides.

### Transient visual state

Keep short-lived effects/animation/open-state in the UI layer; never turn visual FX into persistent gameplay data.

## 6. Preserve Domain Invariants

Before editing a game system, inspect the relevant `AGENTS.md` invariants.

Important current examples include:

- normal/boss monster loot grants materials, not finished Equipment;
- finished Equipment is produced through Artificing and has the required recipe ownership;
- Transmutation remains the elemental/material production path;
- Collection is item-focused and Bestiary is creature-focused;
- positive item grants go through the central acquisition path when required for discovery correctness;
- monster discovery follows encounter semantics;
- offline progress uses the authoritative simulation/lifecycle path;
- debug overrides must not leak into normal saved progression.

Do not weaken an invariant just to make one feature easier to implement.

## 7. Avoid Parallel Systems

A common source of spaghetti code is implementing a new path beside the old path.

When replacing behavior:

1. identify all callers of the old path;
2. migrate relevant callers;
3. update tests;
4. remove obsolete implementation when safe;
5. remove obsolete CSS/types/helpers/exports tied only to it;
6. verify no runtime path still depends on it.

Do not keep two recipe evaluators, two item-grant paths, two tooltip systems, two layout stores, two combat formulas, or two save paths without an explicit architecture reason.

## 8. Reuse Before Generalizing

Before writing a helper/component:

1. search for an existing implementation;
2. check whether the concept already has an authoritative module;
3. extend an existing abstraction only if the extension stays coherent;
4. create a new local abstraction when generalizing would make a shared "god helper/component".

Do not create abstractions merely to reduce line count. Create them to establish real ownership/reuse boundaries.

## 9. Feature Locality

Keep feature-specific files close to the feature where the repository already follows that pattern.

Examples:

```text
src/screens/tower/research/
src/screens/tower/transmutation/
src/screens/tower/artificing/
src/components/combat/
src/game/systems/combat/
```

A file that serves only Research should not automatically become a global utility.

A concept reused by multiple screens/systems should move to the narrowest legitimate shared layer.

## 10. Component Quality

Screens should primarily orchestrate:

- selecting state/read models;
- navigation intent;
- composing feature panels;
- calling domain actions.

Split a component when it clearly mixes several independent responsibilities such as:

- data transformation;
- stateful workflow;
- large visual subtrees;
- overlay logic;
- unrelated feature sections.

Do not split trivial code into dozens of one-use files. Optimize for understandable ownership, not maximum file count.

## 11. CSS Quality

Follow existing style ownership:

```text
src/styles/components/
src/styles/screens/
src/styles/shell/
src/styles/tools/
src/styles/layout/
```

Rules:

- use theme/typography/layout tokens;
- remove obsolete selectors when replacing markup;
- avoid contradictory duplicate selectors in global files;
- do not fix architecture/layout problems with escalating specificity or `!important` unless there is a documented compatibility reason;
- keep decorative CSS from changing gameplay/layout ownership;
- update `src/styles/index.css` imports when adding/removing owned style files.

## 12. Performance Discipline

Performance fixes should be measurement-driven.

Current architecture-specific constraints to preserve:

- do not push scroll position into React state;
- do not push pointer coordinates into React state for visual lighting;
- do not create a global `MutationObserver` or polling loop for panel sizing when shared ResizeObserver/layout infrastructure exists;
- do not create per-screen permanent WebGL/canvas render loops when shared ambience exists;
- do not create per-component AudioContexts;
- high-frequency simulation must not cause unnecessary high-frequency UI notifications/audio;
- UI animation does not own simulation timing.

When optimizing, preserve correctness first and measure the actual hot path.

## 13. Persistence and Migration Safety

Persistence changes are high-risk.

When changing saved gameplay state or UI-persisted schema:

- inspect the current schema/version in code rather than trusting an old document number;
- add/update migration logic deliberately;
- preserve old-profile loading when required;
- ensure runtime-only/debug/transient fields remain excluded as intended;
- add targeted migration/persistence tests;
- avoid silently changing semantics of an existing persisted field.

Do not delete legacy migration logic merely because the current save no longer writes that old shape unless the project's compatibility policy explicitly allows it.

## 14. Balancing Work Classification

Follow the current A/B/C balancing workflow in `AGENTS.md` exactly.

Do not run an expensive full-suite/build loop after every pure numeric change when the repository's Class A workflow explicitly forbids/avoids that.

Do not treat structural content or system/formula changes as "just balance" to skip required validation.

At handoff, report the classification when the task is balancing-related.

## 15. Testing Strategy

Testing should follow the change boundary.

During implementation:

- run focused Vitest files for the code being changed;
- add regression coverage for fixed bugs when feasible;
- prefer pure system tests for domain logic and Testing Library/component tests for UI behavior;
- do not repeatedly run the full suite/build after tiny edits.

At final handoff, follow the current task/class-specific validation rules in `AGENTS.md`.

Never claim a command passed unless it was actually run.

## 16. Refactor / Cleanup Workflow

For a requested cleanup or architecture refactor:

### Step 1 — Map ownership

Identify:

- current authoritative module;
- consumers/imports;
- tests;
- compatibility exports;
- persistence implications;
- UI/style dependencies.

### Step 2 — Define the target

State the intended final ownership before moving files/code.

### Step 3 — Migrate in one direction

Do not create circular compatibility between old and new paths.

### Step 4 — Remove obsolete code

After consumers move, delete task-related dead implementations, unused exports, stale styles, and redundant helpers.

### Step 5 — Validate

Run targeted tests, then the current final validation required by `AGENTS.md`.

## 17. Bug-Fix Workflow

For non-trivial bugs:

1. reproduce/identify the incorrect state transition or presentation path;
2. locate the authoritative owner of the behavior;
3. fix the owner rather than patching every symptom;
4. add a focused regression test;
5. check adjacent callers for the same assumption;
6. avoid broad unrelated cleanup unless requested.

A UI symptom may be caused by a selector/system bug; a gameplay symptom may be caused by duplicate UI mutation. Trace the ownership boundary first.

## 18. Code Review Checklist

Before declaring substantial work done, ask:

### Ownership

- Is every new rule/value in the correct layer?
- Did I duplicate an existing source of truth?
- Did I create a reverse dependency from game/system code into UI?

### State

- Is state persisted only when it should be?
- Are debug/transient values kept out of normal saves?
- Am I using existing actions/selectors/preferences/layout infrastructure?

### Duplication

- Did I leave the old implementation alive?
- Did I add a second helper/component/system for an existing concept?

### UI

- Did I reuse shared UI/theme/layout infrastructure?
- Did I introduce native `title=` tooltips or a competing overlay system?

### Performance

- Did I add high-frequency React state, event listeners, timers, observers, audio engines, or render loops unnecessarily?

### Tests

- Is there focused coverage for the changed behavior?
- Did I follow the current `AGENTS.md` validation workflow rather than inventing one?

### Scope

- Are all changes necessary for the requested task or its direct dependencies?
- Did I avoid unrelated drive-by refactors?

## 19. Handoff Quality

A good Codex handoff should briefly report:

- what changed;
- the important ownership/architecture decision;
- any migration or compatibility impact;
- tests/validation actually run;
- anything intentionally not changed;
- any remaining known risk.

Do not hide architecture compromises behind "works now" if a compromise remains.

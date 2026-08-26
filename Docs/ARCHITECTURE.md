# SSS Wizard architecture

The codebase is organized by feature ownership. `game/content` is the authoritative home for authored game definitions; the older `game/data` files are compatibility entry points only. `game/core` contains generic balance, types, and utilities, while `game/systems` owns simulation and derived domain behavior.

```text
src/
  app/                 shell and navigation composition
  components/          shared UI primitives and atmosphere
  game/
    core/               generic balance and shared primitives
      balance/          authoritative tuning values
    content/            authored items, monsters, spells, schools, dungeons, recipes, guild, Pillars, discoveries
    data/               compatibility exports for older imports
    systems/            gameplay ownership (channeling, activity telemetry, combat, loot, simulation, offline bank)
    engine.ts           shared derived-stat and cross-system calculations
  screens/
    tower/channeling/  Channeling panels and discoveries
    tower/focus/       Focus destination
    tower/research/    Research destination
    tower/transmutation/ Transmutation destination
  store/
    gameStore.ts       Zustand/Immer composition and persistence bridge
    actions/            domain actions (channeling, focus, tower activities, combat, inventory, equipment, guild, progression, persistence, debug)
    selectors/         feature selector entry points
  devtools/             Developer Tools window and domain tabs
  persistence/          Save V4 schema, migrations, and profile storage
  profiles/             profile lifecycle and metadata
  styles/               global styles plus screen/tool-owned additions
```

Combat lifecycle, damage, enemy actions, and encounter completion live in `game/systems/combat/combatRuntime.ts`. Monster drop resolution lives in `game/systems/loot/lootResolution.ts`. Live ticks and player-selected Offline Bank advances both call `game/systems/simulation/advanceGameState.ts` in one-second-safe steps. Routine banked notifications are suppressed while major unlocks and failures are retained.

Mana Flow is derived UI information: authoritative Channeling production minus active average consumption from Transmutation, Research, and estimated Auto-Cast demand. It is not persisted as a new stat. Activity cards consume `getActivityTelemetry(state)` and the shell owns only presentation and navigation.

The persistent shell is composed from `app/GameShell.tsx`, `app/shell/Topbar.tsx`, `Sidebar.tsx`, `ActivityMonitor.tsx`, `OfflineBankPopover.tsx`, and `ToastStack.tsx`. Developer overrides remain runtime-only; profile serializers strip them.

Developer overrides are runtime-only test controls kept under `GameState.debug`; profile serializers strip the field, so normal V8 progression never records temporary bonuses or cap toggles.

# SSS Wizard architecture

The codebase is organized by feature ownership. The older `src/game/data` and `src/game/engine` paths remain stable compatibility entry points while domain barrels under `content` and `systems` provide clearer homes for future work.

```text
src/
  app/                 shell and navigation composition
  components/          shared UI primitives and atmosphere
  game/
    content/           domain content barrels (items, monsters, spells, schools, dungeons, guild, channeling)
    data/               stable content source files used by the MVP
    systems/            gameplay ownership (channeling, focus, combat, loot, research, condensation)
    engine.ts           shared derived-stat and cross-system calculations
  screens/
    tower/channeling/  Channeling panels and discoveries
    tower/focus/       Focus destination
    tower/condensation/ Condensation destination
    tower/research/    Research destination
    tower/transmutation/ Transmutation destination
  store/
    gameStore.ts       Zustand/Immer composition and persistence bridge
    actions/            reusable debug/action helpers
    selectors/         feature selector entry points
  devtools/             Developer Tools window and domain tabs
  persistence/          Save V4 schema, migrations, and profile storage
  profiles/             profile lifecycle and metadata
  styles/               global styles plus screen/tool-owned additions
```

Combat lifecycle, damage, enemy actions, and encounter completion live in `game/systems/combat/combatRuntime.ts`. Monster drop resolution lives in `game/systems/loot/lootResolution.ts`. Channeling calculations remain authoritative in `game/engine/channelingEngine.ts` and are re-exported through `game/systems/channeling`.

Developer overrides are runtime-only test controls kept under `GameState.debug`; profile serializers strip the field, so normal Save V4 progression never records temporary bonuses or cap toggles.

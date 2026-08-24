
## Tech Stack

- React
- TypeScript
- Vite
- Zustand + Immer
- Three.js
- Vitest

## Requirements

Use a current Node.js LTS release. The current Vite toolchain supports Node 20.19+ or Node 22.12+.

## Getting Started

```bash
git clone https://github.com/Deimantx/SSS-WIzard.git
cd SSS-WIzard
npm install
npm run dev
```

Open the local Vite address shown in the terminal, normally `http://localhost:5173`.

## Tests and Production Build

```bash
npm run test:run
npm run build
```

## Development Test Mode

Open `Settings / Info`, enable `Show tools` under `Developer tools`, and use the clearly marked Developer Tools panel. Presets provide Fresh, Research, Combat, Boss, and Main Boss states without waiting through the full progression.

## Save Data

Save data is stored in browser `localStorage` under `sss-wizard-save-v1`. Clearing browser storage or using `Reset save` removes progress. There is no cloud account or backend. Save loading has a migration boundary and currently migrates v1 saves to v2.

## Project Structure

- `src/app` — shell, navigation, and global status UI
- `src/components` — reusable visual components and atmosphere
- `src/screens` — presentation for game screens
- `src/game` — typed models, data, utilities, and simulation rules
- `src/store` — centralized runtime state and actions
- `src/persistence` — save schema, migration, and storage management
- `Docs` — design source of truth

## Design Source

`Docs/SSS_Wizard_Core_Concept.md`

## Current Gameplay Loop

Mana → elemental materials → Research → Magic School progression → spells → Combat → loot → Transmutation → equipment → bosses → higher cap.

## Development Notes

This is an active prototype. Balance, content, and the first-chapter pacing remain provisional. Gameplay state is intentionally kept outside the current screen so Tower activities and Combat continue while navigating.

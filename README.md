
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

Open `Settings / Info` and use `Developer Tools`. Presets provide Fresh, Research, Combat, Boss, and Main Boss states without waiting through the full progression.

## Profiles and Save Data

SSS Wizard opens with three local profile slots. Each profile has an independent gameplay save with Default mode and Normal difficulty. Profiles are stored in this browser only; there is no cloud account or backend.

Appearance preferences and UI layouts are global to this browser, while gameplay progression is saved per profile. Existing development saves under the legacy `sss-wizard-save-v1` key are migrated into Profile 1 with a recovery backup during first boot. Clearing browser storage removes local profiles and preferences.

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

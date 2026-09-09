# SSS Wizard Custom Codex Skills — Install

This package adds two repository-specific skills:

```text
.agents/skills/sss-wizard-ui/
.agents/skills/sss-wizard-code-quality/
```

It is designed to sit beside the skills already present in the SSS Wizard repository, such as `game-ui-frontend`, `game-playtest`, `frontend-design`, `sprite-pipeline`, and `web-game-foundations`.

## Install

Extract/copy the **`.agents`** folder into the root of the SSS Wizard repository.

Expected result:

```text
SSS-WIzard/
├── .agents/
│   └── skills/
│       ├── frontend-design/
│       ├── game-playtest/
│       ├── game-ui-frontend/
│       ├── sprite-pipeline/
│       ├── web-game-foundations/
│       ├── sss-wizard-ui/
│       │   ├── SKILL.md
│       │   └── references/
│       │       ├── design-system.md
│       │       ├── layout-rules.md
│       │       ├── component-rules.md
│       │       └── ui-antipatterns.md
│       └── sss-wizard-code-quality/
│           └── SKILL.md
├── AGENTS.md
├── Docs/
├── src/
└── package.json
```

Do **not** put these folders under `src/`.

## Example Codex prompts

For UI work:

```text
Use $sss-wizard-ui and $game-playtest.
Redesign the Research screen without changing gameplay behavior.
Preserve Edit UI and visually validate the result in the running game.
```

For implementation/refactor work:

```text
Use $sss-wizard-code-quality.
Implement this change while preserving the repository architecture and removing obsolete task-related code after migration.
```

For a large UI refactor:

```text
Use $sss-wizard-ui, $sss-wizard-code-quality, and $game-playtest.
Rework the screen, preserve all current functionality, reuse shared UI infrastructure, and perform visual QA after implementation.
```

## Priority

These custom skills specialize behavior for SSS Wizard, but they do not replace repository instructions.

Priority should remain roughly:

1. user request;
2. `AGENTS.md` and current repository rules;
3. current implementation / architecture;
4. SSS Wizard custom skill;
5. generic third-party/game UI skill.

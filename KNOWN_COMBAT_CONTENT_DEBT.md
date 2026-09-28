# Known Combat Content Debt

This note records combat-content work intentionally outside the Arcane Guild and Hunter’s Order feature pass. It is a scope boundary for follow-up work, not a gameplay specification.

## Deferred reviews

- Review the `act0` / `act1` content naming and decide whether those names should remain internal authoring groups or become clearer progression-era names. Do not rename IDs as part of a wording cleanup: dungeon, monster, item, and save references may depend on them.
- Replace later-frontier templated monster families with individually authored combat identities where the game needs distinct mechanics, readable behavior, and bespoke progression hooks.
- Audit monster traits marked as placeholders or currently no-op. Each should either gain a documented runtime effect and focused test or be removed from the authored definition.
- Revisit monster identity and combat behavior as a dedicated content pass. The Hunter feature must consume the existing monster registry and combat resolution rather than add a second monster model.

## Current boundary

Gloamridge Hunting Ground is represented as the `hunters-ground` dungeon and a distinct combat location. Its dungeon, monster, and location IDs remain stable for existing saves. This feature pass adds Hunter-facing discovery and authorization presentation around that location; it does not rebalance monsters, boss combat, threat, or global encounter pacing.

Any future combat-content pass should start with the authored registries and runtime selectors, then add focused tests for the behaviors it changes. Avoid generated Markdown mirrors of runtime balance or content data.

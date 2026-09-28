# Progression Systems Freeze

This document records the current ownership boundaries for progression features. It is a design freeze against parallel implementations and accidental cross-system ownership, not a ban on extending the systems.

## Ownership

- **Arcane Guild:** authored ranks, commissions, chains, Registry sets, projects, and skill nodes live in `src/game/content/guild`. Runtime progression and resource mutation live in `src/game/systems/guild` and store actions. Guild points are earned and spent through the existing progression state and skill-tree actions.
- **Hunter’s Order:** ranks, contract tiers, target definitions, upgrades, and reward values live in `src/game/content/huntersOrder`. Contract generation, authorization, completion, and Hunter statistics are owned by `src/game/systems/huntersOrder`.
- **Chronicles:** objective definitions and rewards live in `src/game/content/chronicles`; condition evaluation, latching, and reward application live in `src/game/systems/chronicles`. Existing objective IDs are save-facing and must be preserved when editing their wording or conditions.
- **Combat locations and creatures:** dungeon and monster registries remain authoritative. Hunting Ground is a location classification layered on the existing dungeon identity; it is not a parallel combat or monster system.
- **Presentation:** screens render selectors and presentation helpers. They must not own progression constants, invent rewards, or mutate gameplay state outside store actions.

## Extension rules

- Keep rank gates, requirement quantities, quality weights, reward values, and unlock conditions in authored content or central balance definitions.
- Derive UI progress and labels from shared selectors/read models instead of copying formulas into components.
- Persist only state that cannot be derived from authored definitions. When persistence shape changes, add a migration and round-trip tests. Content-only metadata should not trigger a save schema version.
- Keep IDs stable when changing labels. For saved commission chains, preserve the meaning and order of already persisted stage indices; add new chains instead of reinterpreting an active chain.
- Add progression milestones without duplicating an existing objective condition. Acceptance and completion are separate events and should be represented separately.
- Add focused tests for rank gates, one-time rewards, repeat rewards, mixed objectives, and save compatibility whenever those behaviors change.

## Follow-up balance and content review

The current authored rank thresholds, commission probabilities and rewards, Registry set rewards, project bonuses, and Hunter contract rewards are initial tuning values. Rebalance them through the runtime TypeScript definitions with focused validation. Do not maintain a generated balance Markdown mirror.

Combat-content debt is tracked separately in [KNOWN_COMBAT_CONTENT_DEBT.md](./KNOWN_COMBAT_CONTENT_DEBT.md). Changes to monster identity, global combat pacing, or placeholder traits require their own scoped review and are not implied by this progression freeze.

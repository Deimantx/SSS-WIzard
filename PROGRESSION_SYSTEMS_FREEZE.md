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

## Final progression hardening audit

**Audit base:** `f9024e99114d910c70986ade17c18edc25a7ebfb`

**Verification:** complete on 2026-09-28. Full Vitest passed (276 files, 1,473 tests); `npm run build` succeeded. The build reports the existing >500 kB bundle advisory. The test run printed repeated jsdom CSS parsing warnings but no test failures.

**Verified source snapshot SHA-256 (excluding this document):** `5bb322ed85c189b41c20b0aedc38d26c3abbdd61e6ca33d4dae1af746bf94c18`

The verified changes remain uncommitted. `f9024e99114d910c70986ade17c18edc25a7ebfb` is the base commit, not the new source snapshot hash.

### Arcane Guild Advancement Point economy

All point awards below are one-time bounded sources. Repeating a Commission awards no Advancement Points, and repeating a completed Commission Chain awards no points.

| Source | Authored total |
| --- | ---: |
| Four Guild rank promotions × 10 | 40 |
| Five Registry Sets × 3 | 15 |
| Three Guild Projects × 1 | 3 |
| First-clear Commission Chains: 1 + 1 + 2 | 4 |
| **Maximum bounded total** | **62** |
| **Current Advancement Board point cost** | **62** |

Registry Sets have no Guild-rank gate, so the rank table treats all five set rewards as potentially earned once their item requirements are met. Actual set completion depends on item discovery and availability. Project and Chain values respect their authored minimum ranks.

| Guild rank | Cumulative authored point ceiling | Major thresholds buyable at this point ceiling* |
| --- | ---: | --- |
| Unregistered | 15 | 10 |
| Initiate | 16 | 10 |
| Apprentice | 27 | 10, 20 |
| Adept | 40 | 10, 20, 30 |
| Arcanist | 52 | 10, 20, 30, 40, 50 |
| Grand Magister | 62 | 10, 20, 30, 40, 50, 60 |

\*Each milestone also needs one unspent point after its invested-point threshold. The calculation uses threshold + 1 and is covered against the authored Board data by a test. The point ceiling is a cumulative authored-source ceiling, not a guarantee that every item-gated source is already available at that rank.

### Progression pacing reference

Hunter estimates use authored tier weights (75/20/5), tier gates, midpoint target sizes, three generated offers per board, and selection of the highest available tier. They assume no Hunter upgrades or rerolls. They are directional estimates; target eligibility and upgrade choices change an individual run.

| Hunter rank | Reputation gate | Expected completed contracts, cumulative | Expected Marks, cumulative |
| --- | ---: | ---: | ---: |
| Scout | 250 | 1.0 | 3.0 |
| Stalker | 800 | 2.5 | 9.8 |
| Warden | 1,800 | 3.9 | 16.0 |
| Veteran | 3,500 | 6.0 | 25.5 |
| Master Hunter | 6,500 | 9.4 | 44.5 |

Maxing every current Hunter upgrade costs **188 Hunter Marks**: Trail Kit 16, Marked Quarry 25, Extended Trails 16, Deep Pockets 34, Contract Portfolio 25, Negotiated Rerolls 34, and Order Privilege 38. The former 455-Mark catalog cost was roughly ten times the modeled Marks at Master Hunter. The rebalanced catalog is about 4.2 times the no-upgrade rank-path estimate and remains a long-term completion goal; Marked Quarry and Deep Pockets can increase later-path Marks when purchased.

For Guild reputation, the reference below uses 75 Reputation per regular Commission and rounds up. Registry Sets, Projects, and first-clear Chains are authored optional bonuses that reduce the Commission-equivalent count; actual mixes depend on inventory and unlock timing.

| Guild promotion | Reputation gate | Commission-only reference | Optional one-time Reputation available by that progression stage | Cumulative AP ceiling |
| --- | ---: | ---: | --- | ---: |
| Apprentice | 175 | ~3 | Registry Sets; Restore the Arcane Archive project | 27 |
| Adept | 600 | ~8 | Up to 315 from Sets; up to 400 from the first two Projects | 40 |
| Arcanist | 1,200 | ~16 | Up to 315 from Sets, 580 from all Projects, and Adept Chain first clears | 52 |
| Grand Magister | 2,000 | ~27 | Up to 315 from Sets, 580 from Projects, and all Chain first-clear rewards | 62 |

The Commission-only column is a comparison baseline, not a required route. Set, Project, and Chain rewards may replace several Commission equivalents.

### Correctness and compatibility decisions

- Production Chain progress now requires the authored item, and real replicated output quantity advances the stage by the amount produced.
- Commission templates remain distinct by authored ID; exact duplicate generated objectives are filtered after quality and quantity are applied. Efficient Procurement affects only Delivery targets, including Mixed Delivery components.
- Bestiary remains accessible from a fresh Hunter screen; the Order tabs stay locked until Corrupted Greatbear is defeated.
- Guild screen copy uses Arcane Guild and Advancement terminology. Chronicle track IDs and existing objective IDs remain save-compatible; the visible shared side-track label is Organizations. The Hunter Apex rank requirement is authored as Master Hunter rather than inferred from the last rank entry.
- Developer Tools expose seeded/forced Hunter and Guild fixtures through store actions, including project prerequisites, repeat Chain clears, bounded AP ceiling/spend, and Apex-ready Gloamridge threat.

Progression data and system ownership are frozen after this verification; future changes in this area should be bug fixes or balance tuning. Live visual inspection of Guild, Hunter, and Developer Tools screens could not be completed in this environment: headless Chrome rendered the profile launcher, but failed to create a WebGL context when entering the game, causing `ArcaneAtmosphere` to abort the shell render. This is an environment validation limitation, not a reported feature failure.

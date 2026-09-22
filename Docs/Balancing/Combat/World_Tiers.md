# World Tiers

World Tier is a global persisted combat setting. It is captured on enemy spawn so an active encounter remains stable if the profile setting changes later. Normal tier changes require no active combat; developer actions may force a tier for testing.

These WT1-WT5 values are Phase 4B prototype placeholders, not final combat balance. They are authored in `src/game/content/world-tier/worldTiers.ts` and must remain the runtime source of truth.

## Authored definitions

| Tier | Enemy health | Enemy damage | Enemy defense | Resonance rewards | Material loot quantity | Unlock |
| --- | --- | --- | --- | --- | --- | --- |
| WT1 (World Tier 1) | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 | Available by default |
| WT2 (World Tier 2) | x2.00 | x1.40 | x1.25 | x2.00 | x2.00 | First defeat of Archmage Edrin Shade |
| WT3 (World Tier 3) | x3.00 | x1.80 | x1.50 | x3.00 | x3.00 | Future progression; currently locked |
| WT4 (World Tier 4) | x4.00 | x2.20 | x1.75 | x4.00 | x4.00 | Future progression; currently locked |
| WT5 (World Tier 5) | x5.00 | x2.60 | x2.00 | x5.00 | x5.00 | Future progression; currently locked |

Resonance-specific presentation and reward notes cross-reference this page; this page owns the World Tier multiplier values.

## Runtime rules

- Enemy health is rounded at spawn with a minimum of 1.
- Enemy outgoing damage uses the shared single-application World Tier multiplier.
- Defense rating is scaled before the normal defense curve.
- Authored material drop chance is unchanged by World Tier.
- A successful authored base material quantity is multiplied by the encounter tier material loot quantity multiplier and rounded to the final granted quantity. Inventory, loot events, Combat Loot Reveal, and Offline Bank reports all consume that final quantity.
- Life Essence and Artifact Essence remain inventory material Items. Monster and boss loot remains material-only.
- Arcane Points, Threat, kill counts, request progress, boss flags, and other progression credit are not multiplied by World Tier.
- Offline Bank and Fast Resolve reuse the canonical combat and loot resolution path; they do not have separate World Tier formulas.
- The enemy captured `enemyWorldTier` is authoritative for both Resonance and item rewards until the encounter resolves. Abandoning an encounter still grants no rewards.
- WT2 unlocks on the first Archmage Edrin Shade defeat and does not auto-select WT2. WT3-WT5 have no temporary Act or Dungeon gate; their normal-profile copy is "Unlocks through future progression."

## Non-final scope

This page documents the architecture and prototype values only. It does not decide final Acts, Zones, Dungeons, enemy roles, or final World Tier balance.

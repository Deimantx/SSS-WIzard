# World Tiers

World Tier is a global persisted combat setting. It is captured on enemy spawn so an active encounter remains stable if the profile setting changes later. Normal tier changes require no active combat; developer actions may force a tier for testing.

## Authored definitions

| Tier | Enemy health | Enemy damage | Enemy defense | Resonance rewards | Unlock |
| --- | --- | --- | --- | --- | --- |
| WT1 (World Tier 1) | x1 | x1 | x1 | x1 | Available by default |
| WT2 (World Tier 2) | x2 | x1.4 | x1.25 | x2 | First defeat of Archmage Edrin Shade |

## Runtime rules

WT2 enemy health is rounded at spawn with a minimum of 1. Enemy outgoing damage is multiplied exactly once in the shared damage pipeline, covering basic attacks, authored flat and source-basic magnitudes, and periodic damage. Defense rating is scaled before the normal defense curve. Resistances, speed, action patterns, loot, Arcane Points, and Threat are unchanged. Unlocking WT2 never auto-selects it.

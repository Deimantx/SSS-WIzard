# Abandoned Catacombs enemies

## Core Combat Stats

| Enemy | Type | HP | Basic Dmg | Attack | DEF | Crit | Crit Dmg | Block | Phys Res | Arc Res | Fire Res | Water Res | Earth Res | Air Res | Damage Immune | Status Immune |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Restless Skeleton (restless-skeleton) | Normal | 180 | 15 | 2.7 s | 10 | 5% | 150% | 0% | +25% | 0% | 0% | 0% | 0% | 0% | — | — |
| Grave Wraith (grave-wraith) | Normal | 160 | 14 | 2.4 s | 10 | 5% | 150% | 0% | +50% | 0% | -25% | -25% | -25% | -25% | — | — |
| Fallen Acolyte (fallen-acolyte) | Normal | 220 | 16 | 2.6 s | 10 | 5% | 150% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | — | — |
| Archmage Edrin's Shade (archmage-edrin-shade) | Boss | 1300 | 20 | 2.5 s | 10 | 5% | 150% | 0% | 0% | 0% | +15% | +15% | +15% | +15% | — | — |

## Traits & Patterns

| Enemy | Trait 1 | Trait 2 | Phase / Trigger | Default Pattern | Alt Pattern |
| --- | --- | --- | --- | --- | --- |
| Restless Skeleton (restless-skeleton) | Brittle Bones: Physical damage is reduced by 25%. | — | — | Basic Attack -> Basic Attack -> Bone Cleaver | — |
| Grave Wraith (grave-wraith) | Ethereal Form: Physical damage is reduced by 50%; Fire, Water, Earth, and Air damage are increased by 25%. | — | — | Basic Attack -> Chilling Touch -> Basic Attack -> Basic Attack -> Fade | — |
| Fallen Acolyte (fallen-acolyte) | Grave Channeling: Below 50% HP, healing done is increased by 50%.; +50% Healing done when the caster's Health is below 50% | — | — | Grave Bolt -> Basic Attack -> Soul Drain -> Basic Attack -> Basic Attack -> Death Ward -> Basic Attack | — |
| Archmage Edrin's Shade (archmage-edrin-shade) | Arcane Remnant: Resists Fire, Water, Earth, and Air damage by 15%. | Unbound Spirit: At 50% HP, gains Haste and shifts to the Unbound Pattern once.; HP threshold when the caster's Health is below 50% -> Haste; Pattern: Unbound (once/encounter) | HP threshold when the caster's Health is below 50% -> Haste; Pattern: Unbound (once/encounter) | Gravefire -> Basic Attack -> Frostbind -> Arcane Ward -> Basic Attack -> Soul Drain | Unbound: Basic Attack -> Gravefire -> Frostbind -> Soul Drain -> Basic Attack -> Final Incantation |

## Special Actions

| Enemy | Action | Cast | Damage | Damage Type | Status / Effect | Duration | Delay | Pattern Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Restless Skeleton (restless-skeleton) | Bone Cleaver (bone-cleaver) | 2.2 s | 185% of Basic Attack damage Physical damage | Physical | — | — | — | Default: step 3 |
| Grave Wraith (grave-wraith) | Chilling Touch (chilling-touch) | 1.8 s | 130% of Basic Attack damage Water damage | Water | Chilled | 5 s | — | Default: step 2 |
| Grave Wraith (grave-wraith) | Fade (fade) | 1.7 s | — | — | Spectral Fade (5 s) | 5 s | — | Default: step 5 |
| Fallen Acolyte (fallen-acolyte) | Grave Bolt (grave-bolt) | 1.5 s | 150% of Basic Attack damage Arcane damage | Arcane | — | — | — | Default: step 1 |
| Fallen Acolyte (fallen-acolyte) | Soul Drain (soul-drain) | 2.2 s | 112.5% of Basic Attack damage Arcane damage | Arcane | +9% of the caster's Max Health Health | — | — | Default: step 3 |
| Fallen Acolyte (fallen-acolyte) | Death Ward (death-ward) | 2 s | — | — | +20.5% of the caster's Max Health Barrier | — | — | Default: step 6 |
| Archmage Edrin's Shade (archmage-edrin-shade) | Gravefire (gravefire) | 1.8 s | 140% of Basic Attack damage Fire damage | Fire | Burning (5 s); 25% of Basic Attack damage Fire damage | 5 s | — | Default: step 1; Unbound: step 2 |
| Archmage Edrin's Shade (archmage-edrin-shade) | Frostbind (frostbind) | 2 s | 120% of Basic Attack damage Water damage | Water | Chilled | 5 s | — | Default: step 3; Unbound: step 3 |
| Archmage Edrin's Shade (archmage-edrin-shade) | Arcane Ward (arcane-ward) | 2.2 s | — | — | +5.4% of the caster's Max Health Barrier | — | — | Default: step 4 |
| Archmage Edrin's Shade (archmage-edrin-shade) | Soul Drain (soul-drain) | 2.4 s | 120% of Basic Attack damage Arcane damage | Arcane | +2.3% of the caster's Max Health Health | — | — | Default: step 6; Unbound: step 4 |
| Archmage Edrin's Shade (archmage-edrin-shade) | Final Incantation (final-incantation) | 4.5 s | 350% of Basic Attack damage Arcane damage | Arcane | — | — | — | Unbound: step 6 |

## Loot

| Enemy | Item | Min | Max | Chance | Est. Qty / Kill |
| --- | --- | --- | --- | --- | --- |
| Restless Skeleton (restless-skeleton) | Ossuary Remnant (ossuary-remnant) | 1 | 1 | 20% | 0.2 |
| Restless Skeleton (restless-skeleton) | Graveglass Shard (graveglass-shard) | 1 | 1 | 5% | 0.05 |
| Restless Skeleton (restless-skeleton) | Life Essence (life-essence) | 4 | 8 | 100% | 6 |
| Grave Wraith (grave-wraith) | Soul Residue (soul-residue) | 1 | 1 | 15% | 0.15 |
| Grave Wraith (grave-wraith) | Graveglass Shard (graveglass-shard) | 1 | 1 | 10% | 0.1 |
| Grave Wraith (grave-wraith) | Life Essence (life-essence) | 4 | 8 | 100% | 6 |
| Fallen Acolyte (fallen-acolyte) | Graveglass Shard (graveglass-shard) | 1 | 1 | 10% | 0.1 |
| Fallen Acolyte (fallen-acolyte) | Soul Residue (soul-residue) | 1 | 1 | 20% | 0.2 |
| Fallen Acolyte (fallen-acolyte) | Ossuary Remnant (ossuary-remnant) | 1 | 1 | 10% | 0.1 |
| Fallen Acolyte (fallen-acolyte) | Life Essence (life-essence) | 5 | 10 | 100% | 7.5 |
| Archmage Edrin's Shade (archmage-edrin-shade) | Graveglass Shard (graveglass-shard) | 2 | 4 | 100% | 3 |
| Archmage Edrin's Shade (archmage-edrin-shade) | Soul Residue (soul-residue) | 2 | 3 | 100% | 2.5 |
| Archmage Edrin's Shade (archmage-edrin-shade) | Edrin Remnant (edrin-remnant) | 1 | 1 | 35% | 0.35 |
| Archmage Edrin's Shade (archmage-edrin-shade) | Life Essence (life-essence) | 21 | 48 | 100% | 34.5 |

Boss mechanics are represented by the Core Combat Stats, Traits & Patterns, and Special Actions sheets above.

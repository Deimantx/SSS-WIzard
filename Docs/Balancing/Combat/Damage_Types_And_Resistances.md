# Damage types and resistances

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

## Damage types

| Damage type ID | Runtime meaning |
| --- | --- |
| physical | Physical damage |
| arcane | Arcane damage |
| fire | Fire school damage |
| water | Water school damage |
| earth | Earth damage |
| air | Air school damage |

## Resistance rules

| Rule ID | Runtime value |
| --- | --- |
| MIN_RESISTANCE | -1 |
| MAX_RESISTANCE | 0.75 |
| Immunity | Authored separately as monster.damageImmunities; not a resistance value |
| Mitigation | max(0, resolved damage × (1 - resistance)) |

## Authored monster resistance overview

| Monster ID | Name | Physical | Arcane | Fire | Water | Earth | Air | Immunities |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| forest-wisp | Forest Wisp | 0 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| thornling | Thornling | 0 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| stone-root | Stone Root | 0 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| grove-sentinel | Grove Sentinel | 0 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| forest-heart | Forest Heart | 0 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| cavefang-wolf | Cavefang Wolf | 0 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| razorclaw-lynx | Razorclaw Lynx | 0 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| corrupted-dire-wolf | Corrupted Dire Wolf | 0 | 0 | 0.1 | 0.1 | 0.1 | 0.1 | [NOT DEFINED IN RUNTIME] |
| corrupted-greatbear | Corrupted Greatbear | 0 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| restless-skeleton | Restless Skeleton | 0.25 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| grave-wraith | Grave Wraith | 0.5 | 0 | -0.25 | -0.25 | -0.25 | -0.25 | [NOT DEFINED IN RUNTIME] |
| fallen-acolyte | Fallen Acolyte | 0 | 0 | 0 | 0 | 0 | 0 | [NOT DEFINED IN RUNTIME] |
| archmage-edrin-shade | Archmage Edrin's Shade | 0 | 0 | 0.15 | 0.15 | 0.15 | 0.15 | [NOT DEFINED IN RUNTIME] |

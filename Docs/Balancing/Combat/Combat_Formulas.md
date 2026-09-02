# Combat formulas

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

These formulas are documented from the current runtime systems. They are written for designers to understand; changing a formula requires a code change and targeted runtime tests.

## Player sheet

~~~text
Max Health = player.baseMaxHealth + equipment.maxHealth
Max Mana = channeling capacity total (including equipment and authored amplification)
Max Focus = Focus capacity breakdown total
Spell Power = base spell power + authored equipment/combat modifiers
Basic Attack Damage = BALANCE.player.basicAttackDamage + equipment.basicDamage
Basic Attack Speed Multiplier = clamp(1 + basicAttackSpeed modifiers, 0.1, 10)
Basic Attack Interval = BALANCE.player.basicAttackIntervalMs / Basic Attack Speed Multiplier
Crit Chance = clamp(base crit chance + modifiers, 0, MAX_CRIT_CHANCE)
Crit Damage Multiplier = clamp(base crit damage + modifiers, 1, MAX_CRIT_DAMAGE_MULTIPLIER)
Defense = max(0, base defense + defense-flat modifiers)
Defense Reduction = min(MAX_DEFENSE_REDUCTION, Defense / (Defense + DEFENSE_K))
Effective Mana Cost = max(1, ceil(base cost × (1 - manaCostReductionPct)))
Effective Focus Cost = max(1, ceil(base cost × (1 - focusEfficiencyPct)))
~~~

## Damage resolution order

~~~text
raw magnitude
→ source damage-dealt modifiers
→ Basic Attack / Spell / Melee / Ranged / DoT modifiers as applicable
→ critical multiplier for direct damage
→ target damage-taken modifiers
→ defense reduction for direct damage
→ resistance: max(0, amount × (1 - resistance))
→ block reduction for direct damage when the block roll succeeds
→ barrier absorption
→ remaining health damage
~~~

Runtime details: DoT and other non-direct effects do not roll crit or block; direct hits share one crit/block roll across multi-component hits. Immunity is resolved before damage is applied. Negative resistance increases damage through the same 1 - resistance expression.

## Timing and status rules

- Authored action and status durations are milliseconds. The simulation tick is 100 ms.
- Status periodic intervals and payloads are authored in [Status Effects](./Status_Effects.md); application can snapshot a source-specific periodic payload.
- Status duration, stacking, cleanse, dispel, and action prevention are defined per status and executed by the combat status runtime.
- A status with defaultDurationMs: null is indefinite until removed or replaced by runtime rules.

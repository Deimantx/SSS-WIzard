# SSS Wizard balancing data

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

This directory is the human-editable balancing interface for the current game content. It is a readable snapshot of authored runtime values, grouped by design domain so a non-programmer can review and request explicit changes.

## Runtime and document semantics

- TypeScript content and systems remain the executable runtime source of truth.
- The game never loads these Markdown files. There is no production Markdown parser.
- These files are a snapshot/editing surface, not a second runtime registry.
- Values are copied from runtime without rebalance or normalization. Fractions, percentages, milliseconds, counts, and formulas are labeled explicitly.
- IDs are stable cross-reference keys, not ordinary balance fields. Do not rename an ID as a balancing change; request an explicit content migration if an ID must change.
- Values shown as **[NOT DEFINED IN RUNTIME]** do not have an authored runtime value. Do not infer one.
- Derived values are marked with **> Derived** and must not be treated as authored constants.

Snapshot commit: 056705bee442836821b12edf1b1929aebded8f0e
Working tree was dirty when exported: **yes**

## Owner editing rules

Edit the value in the row whose first column is the stable ID. Keep the ID and table shape intact. Use the existing unit (for example, 5000 ms, 5 s, or a precise runtime fraction). Do not add invented items, spells, statuses, monsters, recipes, dungeons, traits, drops, or balance values. Formatting-only changes are welcome but do not represent gameplay changes.

## Future Codex apply workflow

1. Tell Codex which balancing files were edited and ask it to apply the explicit values.
2. Codex reads the edited tables and compares them with the current runtime registries and this snapshot commit.
3. Codex reports every requested change by stable ID and field before changing code.
4. Codex applies only explicit values to the authoritative runtime content/balance module; it does not invent missing values or silently rebalance related fields.
5. Codex runs targeted tests, then one final full test suite and one final build.

If the Markdown value, ID, unit, or table structure conflicts with runtime, Codex must stop that field and report:

> **BALANCE SYNC CONFLICT** — file / id / field

The report must explain the runtime value, document value, and exact decision needed. A conflict is never resolved by guessing. Runtime-only additions and removed IDs are also reported rather than silently deleted from the docs.

## Export and coverage

The exporter is manual only; it is never imported by gameplay, startup, tests, saves, or build. It protects existing human edits unless explicitly forced:

~~~text
npx vite-node scripts/export-balancing-docs.ts
npx vite-node scripts/export-balancing-docs.ts --force
npx vite-node scripts/check-balancing-doc-coverage.ts
~~~

The first command creates missing documents and refuses to overwrite an existing snapshot. --force is an intentional snapshot regeneration and may replace human edits. Coverage checks stable IDs in the first column of the relevant tables; it is deliberately a small check, not a general Markdown parser.

## Index

[Balance overview](./BALANCE_OVERVIEW.md)

- Combat: [player base stats](./Combat/Player_Base_Stats.md), [global values](./Combat/Global_Combat_Values.md), [formulas](./Combat/Combat_Formulas.md), [statuses](./Combat/Status_Effects.md), [traits and specials](./Combat/Traits_And_Special_Attacks.md)
- Dungeons: [progression](./Dungeons/Dungeon_Progression.md), plus one file per authored dungeon
- Enemies: [index](./Enemies/Enemy_Index.md), plus one file per dungeon
- Items: [index](./Items/Item_Index.md), [materials](./Items/Materials.md), [boss relics](./Items/Boss_Relics.md), plus one equipment file per dungeon
- Loot and Transmutation: [monster drops](./Loot/Monster_Drops.md), [boss drops](./Loot/Boss_Drops.md), [recipes](./Transmutation/Recipes.md), [crafting economy](./Transmutation/Crafting_Economy.md)
- Progression: [overview](./Progression/Progression_Overview.md), [Research XP](./Progression/Research_XP.md), [school XP](./Progression/Magic_School_XP.md), Channeling, Focus, Guild, and unlock rules
- Magic: [spell index](./Magic/Spell_Index.md), one file per school, and [Auto-Cast and Focus](./Magic/AutoCast_And_Focus.md)
- Economy: [item values](./Economy/Item_Values.md) and [progression timings](./Economy/Current_Progression_Timings.md)

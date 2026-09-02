# Balance overview

> Runtime snapshot: `056705bee442836821b12edf1b1929aebded8f0e`  
> Generated from current game data.  
> Human-editable balancing document.

Runtime snapshot: 056705bee442836821b12edf1b1929aebded8f0e  
The game does not read this Markdown at runtime.

## Authored registry coverage

| Registry | Runtime count | Documentation |
| --- | --- | --- |
| Items | 44 | [Item Index](./Items/Item_Index.md) |
| Equipment | 27 | [equipment files](./Items/) |
| Monsters | 13 | [Enemy Index](./Enemies/Enemy_Index.md) |
| Dungeons | 3 | [Dungeon Progression](./Dungeons/Dungeon_Progression.md) |
| Recipes | 29 | [Recipes](./Transmutation/Recipes.md) |
| Spells | 12 | [Spell Index](./Magic/Spell_Index.md) |
| Statuses | 14 | [Status Effects](./Combat/Status_Effects.md) |
| Traits | 15 | [Traits and Specials](./Combat/Traits_And_Special_Attacks.md) |

## Authoritative runtime modules

| Domain | Runtime source |
| --- | --- |
| Global/player/combat balance | src/game/core/balance |
| Items/equipment | src/game/content/items, src/game/content/equipment |
| Monsters/dungeons | src/game/content/monsters, src/game/content/dungeons |
| Spells/schools/statuses/traits | src/game/content and combat types |
| Recipes/research/channeling/focus/guild | src/game/content |
| Combat resolution | src/game/systems/combat |

> Derived: counts above are generated from the registries at export time. They are not tuning values.

## Balancing file map

### Combat
- [Player Base Stats](./Combat/Player_Base_Stats.md)
- [Global Combat Values](./Combat/Global_Combat_Values.md)
- [Combat Formulas](./Combat/Combat_Formulas.md)
- [Status Effects](./Combat/Status_Effects.md)
- [Traits and Special Attacks](./Combat/Traits_And_Special_Attacks.md)
- [Damage Types and Resistances](./Combat/Damage_Types_And_Resistances.md)

### Dungeons and Enemies
- [Dungeon Progression](./Dungeons/Dungeon_Progression.md)
- [Whispering Woods](./Dungeons/Whispering_Woods.md)
- [Howling Den](./Dungeons/Howling_Den.md)
- [Abandoned Catacombs](./Dungeons/Abandoned_Catacombs.md)
- [Enemy Index](./Enemies/Enemy_Index.md)
- [Whispering Woods enemies](./Enemies/Whispering_Woods.md)
- [Howling Den enemies](./Enemies/Howling_Den.md)
- [Abandoned Catacombs enemies](./Enemies/Abandoned_Catacombs.md)

### Items and production
- [Item Index](./Items/Item_Index.md)
- [Materials](./Items/Materials.md)
- [Boss Relics](./Items/Boss_Relics.md)
- [Whispering Woods Equipment](./Items/Equipment_Whispering_Woods.md)
- [Howling Den Equipment](./Items/Equipment_Howling_Den.md)
- [Abandoned Catacombs Equipment](./Items/Equipment_Abandoned_Catacombs.md)
- [Monster Drops](./Loot/Monster_Drops.md)
- [Boss Drops](./Loot/Boss_Drops.md)
- [Recipes](./Transmutation/Recipes.md)
- [Crafting Economy](./Transmutation/Crafting_Economy.md)

### Progression and Magic
- [Progression Overview](./Progression/Progression_Overview.md)
- [Research XP](./Progression/Research_XP.md)
- [Magic School XP](./Progression/Magic_School_XP.md)
- [Channeling](./Progression/Channeling.md)
- [Focus](./Progression/Focus.md)
- [Guild Progression](./Progression/Guild_Progression.md)
- [Unlock Progression](./Progression/Unlock_Progression.md)
- [Spell Index](./Magic/Spell_Index.md)
- [Fire Spells](./Magic/Fire_Spells.md)
- [Water Spells](./Magic/Water_Spells.md)
- [Earth Spells](./Magic/Earth_Spells.md)
- [Air Spells](./Magic/Air_Spells.md)
- [Magic Schools](./Magic/Magic_Schools.md)
- [Auto-Cast and Focus](./Magic/AutoCast_And_Focus.md)

### Economy
- [Item Values](./Economy/Item_Values.md)
- [Current Progression Timings](./Economy/Current_Progression_Timings.md)

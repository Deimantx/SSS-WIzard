# SSS Wizard — MY GAME EDITING GUIDE

> Personal quick-reference for editing the game directly in VS Code.
>
> This is **not** a second balancing database and should not copy every current value.
> Its job is only to tell me:
>
> - where a system/content value lives;
> - what I can safely change myself;
> - what syntax/pattern to follow;
> - when a change is large enough that I should give it to Codex.

Repository:

```text
https://github.com/Deimantx/SSS-WIzard
```

Guide checked against committed HEAD:

```text
adbdd415cbebcb6f7828162543621f6adc4271bb
```

---

# 1. HOW I SHOULD USE THIS FILE

In VS Code:

```text
Ctrl + P
```

then paste the path from this guide.

Example:

```text
src/game/content/items/items.ts
```

For most normal balancing I do **not** need to understand React, Zustand, Vite, or the whole codebase.

The main distinction is:

```text
CONTENT VALUE
= normally safe to edit directly

SYSTEM MECHANIC
= usually let Codex implement it
```

---

# 2. DIFFICULTY LEGEND

## 🟢 SAFE SIMPLE EDIT

Usually safe for me to change directly.

Examples:

```text
20 Health → 30 Health
25 Mana Cost → 30 Mana Cost
8s cooldown → 10s
monster HP 300 → 350
drop chance 0.20 → 0.25
recipe ingredient 24 → 30
```

If I follow an existing nearby example, the game normally picks the value up automatically.

---

## 🟡 CAREFUL EDIT

Still editable myself, but I should understand what the field means.

Examples:

```text
resistances
percent values
spell coefficients
monster action patterns
unlock conditions
special-effect numeric values
```

Usually safe if I am only changing a number inside an already-existing mechanic.

---

## 🔴 SYSTEM CHANGE — USE CODEX

A new concept that the game does not already support.

Examples:

```text
create a brand-new stat type
create Lifesteal when Lifesteal does not exist
new combat trigger
new effect type
new save state
new resource
new slot type
change core combat formula
change how Offline Bank simulates
new activity lifecycle
```

Example:

```text
healthRegen: 1 → 2
```

is now 🟢 because Health Regen already exists.

But before Health Regen existed, creating the entire `healthRegen` mechanic was 🔴.

---

# 3. FASTEST MAP — WHERE DO I GO?

| I want to edit | Main file |
| --- | --- |
| Item / Equipment stats | `src/game/content/items/items.ts` |
| Item descriptions / sell values / source metadata | `src/game/content/items/items.ts` |
| Allowed Equipment stat fields | `src/game/types.ts` |
| Artificing Equipment recipe costs | `src/game/content/recipes/artificingRecipes.ts` |
| Artificing unlock conditions | `src/game/content/recipes/artificingRecipes.ts` / `recipeUnlocks.ts` |
| Transmutation costs / Mana / time / ingredients | `src/game/content/recipes/transmutationRecipes.ts` |
| Whispering Woods monsters + loot | `src/game/content/monsters/whisperingWoods.ts` |
| Howling Den monsters + loot | `src/game/content/monsters/howlingDen.ts` |
| Abandoned Catacombs monsters + loot | `src/game/content/monsters/abandonedCatacombs.ts` |
| Monster helper/effect syntax | `src/game/content/monsters/monsterTypes.ts` |
| Dungeon pools / bosses / progression metadata | `src/game/content/dungeons/dungeons.ts` |
| Spell Mana / cooldown / unlock / effect numbers | `src/game/content/spells/spells.ts` |
| Magic School definitions | `src/game/content/schools/schools.ts` |
| Global base balance | `src/game/core/balance/balance.ts` |
| Mana Pillar upgrades | `src/game/content/channeling/manaPillars.ts` |
| Channeling discoveries | `src/game/content/channeling/channelingDiscoveries.ts` |
| Focus Improvement progression | `src/game/content/focus/focusImprovement.ts` |
| Guild request values | `src/game/content/guild/guildRequests.ts` |
| Research global values | `src/game/core/balance/balance.ts` |
| Research runtime mechanics | `src/game/systems/research/researchEngine.ts` |
| Research calculations/readouts | `src/game/systems/research/researchSelectors.ts` |
| Status definitions | `src/game/content/statuses/` |
| Equipment set definitions | `src/game/content/equipment/equipmentSets.ts` |
| Core type / ID registry | `src/game/types.ts` |

---

# 4. ITEMS + EQUIPMENT — MOST USEFUL FILE

## File

```text
src/game/content/items/items.ts
```

This is one of the most useful files for manual balancing.

It contains the authored registry for:

```text
materials
monster loot materials
boss materials
Equipment
Equipment stats
Equipment combat modifiers
Equipment special rules
descriptions
icons/colors
sell behavior after normalization
```

For normal Equipment stat balancing, this is usually the first place to go.

---

# 5. EQUIPMENT STATS I CAN ALREADY USE

The currently supported `EquipmentStats` fields are defined in:

```text
src/game/types.ts
```

Current supported fields include:

```ts
basicDamage?: number
spellPower?: number
maxHealth?: number
healthRegen?: number
maxMana?: number
manaRegen?: number
maxFocus?: number
defense?: number
critChance?: number
critDamage?: number
basicAttackSpeedPct?: number
blockChance?: number
cooldownRecoveryPct?: number
healingDonePct?: number
barrierPowerPct?: number
damageOverTimePct?: number
statusDurationPct?: number
manaCostReductionPct?: number
focusEfficiencyPct?: number
resistances?: { ... }
```

If the stat is already in this list, adding it to another Equipment item is normally 🟢.

If I want a stat that is **not** in this list, that is 🔴 until the system supports it.

---

# 6. SIMPLE EQUIPMENT EDIT EXAMPLE

Example shape:

```ts
'greatbear-heartstone': equipment({
  id: 'greatbear-heartstone',
  name: 'Greatbear Heartstone',
  description: 'A corrupted heartstone that refuses to yield.',
  icon: 'O',
  color: '#806b69',
  equipmentSlot: 'amulet',
  stats: {
    maxHealth: 25,
    healthRegen: 1,
    defense: 10,
    resistances: {
      fire: 0.05,
      water: 0.05,
      earth: 0.05,
      air: 0.05,
    },
  },
  ...
})
```

If I want:

```text
+25 HP → +35 HP
+1 Health Regen → +2
+10 Defense → +15
```

I can simply change:

```ts
maxHealth: 35,
healthRegen: 2,
defense: 15,
```

This is 🟢.

---

# 7. PERCENT VALUES — IMPORTANT

Most percentage values are authored as decimal fractions.

Examples:

```ts
0.05 = 5%
0.10 = 10%
0.15 = 15%
0.20 = 20%
0.50 = 50%
```

So:

```ts
critChance: 0.05
```

means:

```text
+5% Crit Chance
```

and:

```ts
manaCostReductionPct: 0.10
```

means:

```text
-10% Mana Cost
```

Do **not** write:

```ts
manaCostReductionPct: 10
```

unless I actually want 1000%.

---

# 8. RESISTANCES

Existing resistance syntax:

```ts
resistances: {
  physical: 0.10,
  fire: 0.05,
  water: 0.05,
  earth: 0.05,
  air: 0.05,
}
```

Examples:

```text
0.03 = 3%
0.05 = 5%
0.10 = 10%
```

Changing existing resistance numbers is 🟢.

Adding a resistance damage type that is already supported is usually 🟢/🟡.

Creating a totally new damage type is 🔴.

---

# 9. EQUIPMENT SLOT / WEAPON HANDS

Examples:

```ts
equipmentSlot: 'weapon',
weaponHands: 1,
```

or:

```ts
equipmentSlot: 'weapon',
weaponHands: 2,
```

Offhand:

```ts
equipmentSlot: 'offhand',
equipmentPresentation: 'focus',
```

or:

```ts
equipmentSlot: 'offhand',
equipmentPresentation: 'shield',
```

Other valid item slots currently:

```text
weapon
offhand
armor
helmet
cape
amulet
ring
```

Changing an existing item's slot is 🟡 because it can affect loadout behavior and balance.

Creating a new slot type is 🔴.

---

# 10. EQUIPMENT COMBAT MODIFIERS

Example:

```ts
combat: {
  modifiers: [
    {
      key: 'spell-damage-percent',
      value: 0.2,
      originSourceKinds: ['spell'],
      damageTypes: ['fire'],
    },
  ],
}
```

This means approximately:

```text
+20% Fire Spell Damage, including Burning applied by those spells
```

`originSourceKinds: ['spell']` includes damage over time whose original source is a spell. `sourceKinds: ['spell']` restricts the bonus to damage resolved directly by a spell and excludes Burning ticks. The Fire damage filter still applies.

Changing:

```ts
value: 0.2
```

to:

```ts
value: 0.25
```

is normally 🟡 but straightforward because the modifier already exists.

Do not invent new `key:` strings unless the system already supports them.

A new modifier key is 🔴.

---

# 11. EQUIPMENT SPECIAL EFFECTS

Example existing pattern:

```ts
rules: [
  {
    id: 'living-seed',
    event: 'on-hp-threshold',
    condition: {
      type: 'self-hp-below-percent',
      percent: 30,
    },
    oncePerEncounter: true,
    effects: [
      {
        type: 'gain-barrier',
        target: 'self',
        magnitude: {
          type: 'flat',
          value: 20,
        },
      },
    ],
    ui: {
      name: 'Living Seed',
    },
  },
]
```

Safe-ish numeric changes:

```text
percent: 30 → 25
value: 20 → 30
```

are 🟡.

Changing:

```text
oncePerEncounter
```

or an existing cooldown number is also 🟡 if I understand the intended mechanic.

Inventing a new:

```text
event
condition type
effect type
```

is 🔴.

---

# 12. IMPORTANT RULE WHEN ADDING A BRAND-NEW ITEM

Editing an **existing** item is simple.

Adding a completely new item is different.

The project currently uses explicit ID unions in:

```text
src/game/types.ts
```

such as:

```ts
export type ItemId =
  | 'fire-fragment'
  | ...
```

Therefore a new item can require updates in several places:

```text
ItemId
items.ts
recipe data
drop data
collection/content validation
possibly art/metadata
```

So:

```text
edit existing item
→ 🟢

create brand-new item
→ 🔴 / Codex recommended
```

---

# 13. ARTIFICING — EQUIPMENT CRAFT COSTS

## File

```text
src/game/content/recipes/artificingRecipes.ts
```

This file contains:

```text
Equipment recipes
ingredients
quantities
source dungeon
unlock condition
craft duration
```

Current recipe helper gives Equipment recipes:

```ts
baseDurationMs: 5000
```

unless later architecture changes it.

---

# 14. SIMPLE ARTIFICING COST EDIT

Example:

```ts
'heartseed-necklace': equipmentRecipe(
  'heartseed-necklace',
  'Heartseed Necklace',
  [
    { itemId: 'heartseed', quantity: 8 }
  ],
  'whispering-woods',
  { type: 'boss-kill', bossId: 'forest-heart' },
  'A living boss material shaped into a protective amulet.'
),
```

If I want:

```text
8 Heartseed → 10 Heartseed
```

I change only:

```ts
quantity: 10
```

That is 🟢.

---

# 15. MULTI-INGREDIENT ARTIFICING EXAMPLE

```ts
[
  { itemId: 'fire-fragment', quantity: 24 },
  { itemId: 'air-fragment', quantity: 24 },
  { itemId: 'wisp-essence', quantity: 18 },
  { itemId: 'grove-bark', quantity: 3 },
]
```

Changing only quantities is 🟢.

Changing an ingredient from one existing material to another is 🟡.

Changing unlock logic is 🟡/🔴 depending on complexity.

---

# 16. ARTIFICING UNLOCKS

Common existing patterns:

```ts
{ type: 'always' }
```

```ts
{ type: 'boss-kill', bossId: 'forest-heart' }
```

```ts
{
  type: 'dungeon-monster-kills',
  dungeonId: 'whispering-woods',
  count: 1,
}
```

Simple changes using an existing unlock type are 🟡.

Creating a brand-new unlock condition type is 🔴.

---

# 17. TRANSMUTATION

## File

```text
src/game/content/recipes/transmutationRecipes.ts
```

This is one of the easiest files to manually tune.

Each recipe currently supports:

```ts
output
category
baseDurationMs
manaCost
ingredients
unlock
```

---

# 18. TRANSMUTATION EXAMPLE

```ts
'prismatic-fragment': {
  id: 'prismatic-fragment',
  name: 'Prismatic Fragment',

  output: {
    itemId: 'prismatic-fragment',
    quantity: 1,
  },

  category: 'material',

  baseDurationMs: 24000,
  manaCost: 50,

  ingredients: [
    { itemId: 'fire-fragment', quantity: 6 },
    { itemId: 'water-fragment', quantity: 6 },
    { itemId: 'earth-fragment', quantity: 6 },
    { itemId: 'air-fragment', quantity: 6 },
    { itemId: 'life-essence', quantity: 10 },
  ],

  unlock: { type: 'always' },
}
```

Safe changes:

```text
24s → 20s
50 Mana → 60 Mana
6 fragments → 8
10 Life Essence → 12
output 1 → 2
```

are normally 🟢.

Remember:

```text
1000 ms = 1 second
8000 = 8 sec
24000 = 24 sec
```

---

# 19. MONSTERS — WHERE THEY LIVE

Monster content is split by dungeon:

```text
src/game/content/monsters/whisperingWoods.ts
src/game/content/monsters/howlingDen.ts
src/game/content/monsters/abandonedCatacombs.ts
```

This is excellent for manual balancing.

---

# 20. SIMPLE MONSTER STATS

Example:

```ts
'forest-wisp': {
  maxHealth: 200,
  basicAttackDamage: 10,
  basicAttackTimeMs: 2800,
  defense: 8,
  ...
}
```

Safe changes:

```text
HP
Basic Attack Damage
Basic Attack Time
Defense
```

are 🟢.

Example:

```ts
maxHealth: 250,
basicAttackDamage: 12,
basicAttackTimeMs: 3000,
defense: 10,
```

---

# 21. MONSTER ATTACK TIME

Milliseconds:

```text
1800 = 1.8s
2000 = 2.0s
2500 = 2.5s
3200 = 3.2s
```

Smaller number:

```text
faster attack
```

Larger number:

```text
slower attack
```

---

# 22. MONSTER LOOT

Loot is authored in the monster definition.

Example:

```ts
loot: withLifeEssence([
  {
    itemId: 'wisp-essence',
    min: 1,
    max: 2,
    chance: 0.2,
  },
]),
```

Meaning:

```text
20% chance
1–2 Wisp Essence
```

Safe changes:

```text
min
max
chance
```

are 🟢.

Percent reminder:

```text
0.2 = 20%
0.3 = 30%
1 = 100%
```

---

# 23. LIFE ESSENCE LOOT

The game uses:

```ts
withLifeEssence(...)
```

around dungeon loot.

Example:

```ts
withLifeEssence(
  [
    { itemId: 'grove-bark', min: 1, max: 3, chance: 0.2 },
  ],
  { min: 2, max: 5 }
)
```

The second argument is related to the Life Essence helper behavior.

Before changing the helper itself, open:

```text
src/game/content/monsters/monsterTypes.ts
```

Changing the already-authored `min/max/chance` on one monster is 🟢/🟡.

Changing how `withLifeEssence()` globally works is 🔴/system-wide.

---

# 24. MONSTER SPECIAL ACTIONS

Example:

```ts
'root-crush': {
  id: 'root-crush',
  name: 'Root Crush',
  actionTimeMs: 2000,
  effects: [
    scaledDirectDamage('physical', 1.35),
  ],
}
```

Changing:

```text
actionTimeMs
existing coefficient 1.35
```

is 🟡.

---

# 25. MONSTER DAMAGE COEFFICIENT

Example:

```ts
scaledDirectDamage('physical', 1.35)
```

The `1.35` is a multiplier/coefficient in the existing monster combat model.

Examples:

```text
1.0 → weaker
1.35 → current example
1.65 → stronger
2.4 → much stronger
```

Changing the number is 🟡.

Changing what `scaledDirectDamage()` means globally is 🔴.

---

# 26. MONSTER ACTION PATTERNS

Example:

```ts
steps: [
  basic('basic-1'),
  basic('basic-2'),
  action('root-crush-step', 'root-crush'),
]
```

This determines the order of actions.

Reordering existing steps is 🟡.

Adding another existing special into a pattern is 🟡.

Inventing a new action/effect mechanic is 🔴.

---

# 27. BOSS VALUES

Bosses are in the same dungeon monster file.

Example:

```ts
'forest-heart': {
  bestiaryCategory: 'boss',
  maxHealth: 900,
  basicAttackDamage: 35,
  basicAttackTimeMs: 2400,
  defense: 30,
  ...
}
```

Boss HP / Basic Damage / attack timing / existing loot numbers are just as editable as normal monsters.

🟢 for simple values.

---

# 28. DUNGEONS

## File

```text
src/game/content/dungeons/dungeons.ts
```

Use this when changing:

```text
monster pool membership
which boss belongs to a dungeon
dungeon metadata
unlock/progression relationships owned by dungeon content
```

This is more structural than changing monster HP.

Treat most dungeon membership/unlock changes as 🟡.

---

# 29. SPELLS

## File

```text
src/game/content/spells/spells.ts
```

Each spell currently contains things like:

```text
unlockLevel
manaCost
cooldownMs
type
effects
autoCondition
```

This is another good file for direct balancing.

---

# 30. SIMPLE SPELL EXAMPLE

```ts
'fire-bolt': {
  unlockLevel: 2,
  manaCost: 30,
  cooldownMs: 5000,
  type: 'damage',
  effects: [
    damage('fire', 0.6)
  ],
  autoCondition: {
    type: 'always'
  },
}
```

Safe:

```text
unlockLevel 2 → 3
Mana 30 → 35
cooldown 5000 → 6000
coefficient 0.6 → 0.7
```

mostly 🟢/🟡.

---

# 31. SPELL COOLDOWN

```text
5000  = 5 sec
7000  = 7 sec
12000 = 12 sec
30000 = 30 sec
```

---

# 32. SPELL DAMAGE

The helper:

```ts
damage('fire', 0.6)
```

uses Spell Power coefficient scaling.

Changing:

```text
0.6 → 0.7
```

is 🟡 but straightforward.

Do not rewrite the `damage()` helper unless I want to change the global formula.

That would be 🔴.

---

# 33. SPELL HEAL / BARRIER

Current helper examples:

```ts
heal(0.8)
barrier(0.7)
```

and direct barrier effects can contain:

```ts
coefficient: 1.3
```

Changing existing coefficients is 🟡.

Changing how healing/barrier formulas globally work is 🔴.

---

# 34. SPELL STATUS EFFECTS

Example:

```ts
{
  type: 'apply-status',
  target: 'opponent',
  statusId: 'chilled',
  tags: ['debuff', 'control'],
}
```

If I only change:

```text
which already-existing status a spell applies
```

that is 🟡.

Creating a new status should usually go through Codex because it may need:

```text
status definition
runtime behavior
UI
tooltip
combat telemetry
validation
```

🔴.

---

# 35. AUTO-CAST CONDITIONS

Existing examples:

```ts
{ type: 'always' }
```

```ts
{ type: 'health-below', percent: 70 }
```

```ts
{ type: 'barrier-below', value: 10 }
```

Changing:

```text
70% → 60%
barrier threshold 10 → 20
```

is 🟡.

Creating a new Auto-Cast condition type is 🔴.

---

# 36. GLOBAL BASE BALANCE

## File

```text
src/game/core/balance/balance.ts
```

This file currently contains shared/global tuning such as:

```text
simulation tick
base player HP
base Health Regen
Health Regen interval
out-of-combat regen multiplier
base Basic Attack
base Spell Power
base Defense
base Crit
Mana
Channeling global values
Focus global values
Research global values
Transmutation Echo values
Dungeon encounter delay
school level cap
```

This file is powerful.

Small number changes can affect the whole game.

Treat as 🟡 even when syntax is simple.

---

# 37. CURRENT GLOBAL BALANCE SHAPE

Example structure:

```ts
export const BALANCE = {
  tickMs: 100,

  player: {
    maxHealth: 100,
    healthRegenPerSecond: 1,
    healthRegenIntervalMs: 1000,
    outOfCombatRegenMultiplier: 2,
    basicAttackDamage: 5,
    basicAttackIntervalMs: 2200,
    baseSpellPower: 50,
    baseDefense: 5,
    baseCritChance: 0.05,
    baseCritDamage: 1.5,
  },

  mana: {
    startingMana: 0,
    maxMana: 100,
  },

  ...
}
```

Changing:

```text
base HP
base regen
base attack
base Spell Power
```

is technically easy but affects everything, so 🟡.

---

# 38. HEALTH REGEN

Current global base values live in:

```text
src/game/core/balance/balance.ts
```

Relevant fields:

```ts
healthRegenPerSecond
healthRegenIntervalMs
outOfCombatRegenMultiplier
```

Equipment bonus lives on individual items:

```ts
healthRegen: 1
```

in:

```text
src/game/content/items/items.ts
```

Changing an item's existing Health Regen:

```text
🟢
```

Changing global Health Regen values:

```text
🟡
```

Changing the Health Regen runtime mechanic/timing architecture:

```text
🔴
```

---

# 39. CHANNELING

Main content files:

```text
src/game/content/channeling/channeling.ts
src/game/content/channeling/channelingDiscoveries.ts
src/game/content/channeling/manaPillars.ts
```

Global Channeling values also exist in:

```text
src/game/core/balance/balance.ts
```

---

# 40. MANA PILLARS

## File

```text
src/game/content/channeling/manaPillars.ts
```

Use this for the authored Pillar upgrade progression.

If I am only changing an existing upgrade cost/value:

```text
🟢/🟡
```

Do not redesign Pillar progression structure manually unless I understand all consumers.

---

# 41. CHANNELING DISCOVERIES

## File

```text
src/game/content/channeling/channelingDiscoveries.ts
```

Use this for discovery definitions/unlocks/rewards.

Simple numeric threshold change:

```text
🟡
```

New discovery type/mechanic:

```text
🔴
```

---

# 42. FOCUS IMPROVEMENT

## File

```text
src/game/content/focus/focusImprovement.ts
```

Use this for Focus Improvement progression/cost data.

Existing numeric cost change:

```text
🟢
```

Changing how Focus itself is calculated/reserved:

```text
🔴
```

---

# 43. RESEARCH — SIMPLE VALUES

Global Research tuning currently lives partly in:

```text
src/game/core/balance/balance.ts
```

Current global fields include:

```ts
maxPreparedSlots
maxEchoes
echoFocusCost
manaCostPerItem
durationPerItemMs
matchingXp
nonMatchingXp
```

Changing these existing values is 🟡 because they affect the whole Research system, but syntax is simple.

---

# 44. RESEARCH — DO NOT CASUALLY EDIT ENGINE

Main runtime system:

```text
src/game/systems/research/researchEngine.ts
```

Read calculations / UI projections:

```text
src/game/systems/research/researchSelectors.ts
```

Reservation logic:

```text
src/game/systems/research/researchReservations.ts
```

If I want:

```text
Research Mana 30 → 35
Research time 10 sec → 12 sec
XP 12 → 15
```

edit the existing balance/content field.

If I want:

```text
change WHEN Mana is consumed
new Echo behavior
different pause/resume semantics
new batching logic
```

use Codex.

🔴.

---

# 45. GUILD

## File

```text
src/game/content/guild/guildRequests.ts
```

Use this for authored Guild request requirements/rewards where currently defined.

Simple number changes:

```text
🟢/🟡
```

Changing Guild rank architecture/unlock lifecycle:

```text
🔴
```

---

# 46. MAGIC SCHOOLS

## File

```text
src/game/content/schools/schools.ts
```

Use this for authored school definitions.

Spell-specific balancing belongs in:

```text
src/game/content/spells/spells.ts
```

Do not put spell balance into school definitions unless that is already how the field works.

---

# 47. STATUSES

Main content folder:

```text
src/game/content/statuses/
```

Before manually changing a status, inspect the existing definition and where it is used.

Changing:

```text
an existing duration/magnitude already authored in the status
```

may be 🟡.

Changing status semantics:

```text
stacking
tick behavior
new trigger
new modifier type
```

is 🔴.

---

# 48. EQUIPMENT SETS

## File

```text
src/game/content/equipment/equipmentSets.ts
```

Use this only for Equipment set/grouping logic actually authored there.

Individual Equipment stats remain in:

```text
src/game/content/items/items.ts
```

Do not move item stats into the set file.

---

# 49. TYPES.TS — VERY IMPORTANT BUT DO NOT RANDOMLY EDIT

## File

```text
src/game/types.ts
```

This defines many allowed IDs and data shapes:

```text
ItemId
SpellId
MonsterId
DungeonId
EquipmentStats
Equipment slots
Recipe IDs
Research state
Player state
Combat state
etc.
```

I should mainly open this file to answer:

```text
"What fields are already supported?"
```

Example:

```text
Is healthRegen supported?
→ check EquipmentStats
```

Editing a value on an existing item normally does **not** require editing `types.ts`.

Adding a completely new entity often does.

Therefore:

```text
read types.ts often
edit types.ts carefully
```

---

# 50. WHEN I CAN COPY AN EXISTING EXAMPLE

This is probably the easiest manual workflow.

If I want to give an item:

```text
Health Regen
```

search:

```text
healthRegen:
```

and copy the pattern from an existing item.

If I want:

```text
Fire resistance
```

search:

```text
resistances:
```

If I want:

```text
once-per-encounter Barrier
```

search:

```text
oncePerEncounter:
```

If I want:

```text
30s cooldown effect
```

search:

```text
cooldownMs:
```

If I want a monster DoT:

```text
scaledDot(
```

If I want a delayed Basic Attack:

```text
delayBasicAttack(
```

The project already contains many good examples.

---

# 51. VS CODE SEARCH WORKFLOW

Useful shortcuts:

```text
Ctrl + P
→ open exact file

Ctrl + Shift + F
→ search entire project

Ctrl + F
→ search current file
```

Examples:

```text
Ctrl + Shift + F
"greatbear-heartstone"

Ctrl + Shift + F
"healthRegen"

Ctrl + Shift + F
"manaCost:"

Ctrl + Shift + F
"cooldownMs:"

Ctrl + Shift + F
"forest-heart"
```

This is often faster than searching Docs.

---

# 52. SAFE DIRECT EDIT WORKFLOW

For a simple balance tweak:

```text
1. Open the one runtime content file.
2. Find the exact item/monster/spell/recipe.
3. Change only the number(s) I intend.
4. Save.
5. Check game in browser.
6. If it works, commit.
```

Do not use Codex for every:

```text
20 → 25
30 → 35
0.10 → 0.15
```

change.

---

# 53. GOOD EXAMPLES OF CHANGES I CAN DO MYSELF

## Equipment

```ts
maxHealth: 20
```

to:

```ts
maxHealth: 30
```

🟢

---

## Equipment Health Regen

```ts
healthRegen: 1
```

to:

```ts
healthRegen: 2
```

🟢

---

## Monster HP

```ts
maxHealth: 320
```

to:

```ts
maxHealth: 400
```

🟢

---

## Monster drop chance

```ts
chance: 0.2
```

to:

```ts
chance: 0.3
```

🟢

---

## Artificing cost

```ts
quantity: 24
```

to:

```ts
quantity: 30
```

🟢

---

## Transmutation Mana

```ts
manaCost: 50
```

to:

```ts
manaCost: 60
```

🟢

---

## Spell Mana

```ts
manaCost: 30
```

to:

```ts
manaCost: 35
```

🟢

---

## Spell cooldown

```ts
cooldownMs: 5000
```

to:

```ts
cooldownMs: 6000
```

🟢

---

## Existing spell damage coefficient

```ts
damage('fire', 0.6)
```

to:

```ts
damage('fire', 0.7)
```

🟡

---

# 54. CHANGES I SHOULD PROBABLY GIVE TO CODEX

```text
"Add Lifesteal as a new Equipment stat."

"Create Mana Shield as a new combat mechanic."

"Make a new Equipment slot."

"Create a new trigger that fires when Barrier breaks."

"Make bosses phase at 50% HP."

"Add a fifth Magic School."

"Create a new damage type."

"Change save schema."

"Change Offline Bank simulation."

"Create a new crafting system."

"Make Research consume Mana at a different event boundary."

"Add a brand-new item and wire it through all systems."
```

These are not just number edits.

---

# 55. IF TYPESCRIPT SHOWS RED ERROR AFTER MY EDIT

First check simple syntax.

Common mistakes:

```text
missing comma
missing }
wrong quote
misspelled ItemId
misspelled stat field
percentage written as 10 instead of 0.10
```

Example correct:

```ts
stats: {
  maxHealth: 20,
  manaRegen: 3,
  spellPower: 20,
},
```

If TypeScript says:

```text
Property 'lifeSteal' does not exist on type EquipmentStats
```

that means:

```text
the mechanic is not supported yet
```

Do not force it with `as any`.

That is a Codex/system change.

---

# 56. DO NOT USE `as any` TO FORCE NEW CONTENT

Bad:

```ts
stats: {
  lifeSteal: 0.10,
} as any
```

This only hides the TypeScript warning.

It does not magically create the runtime mechanic.

If the field is not supported:

```text
stop
give the feature to Codex
```

---

# 57. IF GAME DOES NOT UPDATE AFTER A SIMPLE VALUE CHANGE

Check:

```text
1. Did I save the file?
2. Is Vite dev server still running?
3. Did TypeScript/Vite show an error in terminal?
4. Did I edit the correct item/recipe?
5. Is there another derived value or special modifier overriding what I expect?
```

For basic authored content, Vite should normally hot-reload the change.

---

# 58. WHEN A NUMBER IS NOT THE FINAL NUMBER

Some fields are direct:

```text
maxHealth
manaCost
cooldownMs
recipe quantity
drop chance
```

Others are coefficients:

```text
spell damage coefficient
monster scaled damage coefficient
scaled heal
scaled barrier
```

A coefficient is not necessarily the final displayed damage.

Before changing one heavily, inspect how a nearby example behaves in-game.

---

# 59. UI CHANGES ARE A DIFFERENT AREA

This guide is mainly for game content / balance.

If I want:

```text
card width
panel spacing
font size
scrollbar
button location
```

that is UI code, usually under:

```text
src/screens/
src/styles/
src/components/ui/
```

Simple CSS tweaks can be edited manually.

But this guide intentionally does not attempt to map every UI component.

For larger UI reworks:

```text
use Codex
```

because layout-editor ownership and responsive behavior can make a "small" UI change affect multiple files.

---

# 60. QUICK UI SEARCH RULE

If I want to edit a visible screen:

```text
Inventory
Equipment
Combat
Research
Artificing
Transmutation
```

first search:

```text
src/screens/
```

for that screen name.

Then look in:

```text
src/styles/screens/
```

for its CSS.

Example pattern:

```text
EquipmentScreen.tsx
equipment.css
```

Use direct CSS editing only for obvious micro changes.

---

# 61. CONTENT VS SYSTEM RULE

A good rule:

```text
If I can point at one existing object and say
"only change this number"
→ I can probably do it myself.
```

If I say:

```text
"the game should now behave differently when X happens"
```

that is probably a system change.

---

# 62. MY PERSONAL EDITING TIERS

## Tier 1 — I edit myself

```text
Equipment ordinary stats
Item sell value
Recipe ingredient quantities
Transmutation Mana/time
Monster HP
Monster Basic damage
Monster Basic attack time
Monster Defense
Loot min/max/chance
Spell Mana
Spell cooldown
Spell unlock level
Global obvious balance number
```

---

## Tier 2 — I can edit by copying an existing pattern

```text
existing resistance
existing combat modifier
existing special-effect magnitude
existing special-effect threshold
existing cooldown
existing once-per-encounter setting
monster action coefficient
monster pattern order
spell coefficient
Auto-Cast threshold
```

---

## Tier 3 — Codex

```text
new stat type
new effect type
new trigger
new entity type
new progression system
new screen/system integration
save migration
simulation lifecycle
Offline Bank mechanics
telemetry architecture
new UI framework behavior
```

---

# 63. AFTER THE NEW DOCS/BALANCING REWORK

I can compare two workflows.

## Workflow A — Docs/Balancing

Good if I prefer:

```text
large readable overview
compare many items at once
compare all monsters
compare all recipes
edit a table
let Codex sync runtime
```

---

## Workflow B — This guide + runtime files

Good if I prefer:

```text
direct control
fast single edits
no generated/mirror confusion
edit exactly what the game executes
learn the project naturally
```

---

# 64. POSSIBLE FINAL HYBRID

The best long-term setup may be:

```text
THIS FILE
→ tells me where to edit

RUNTIME TS
→ where I make simple changes

Docs/Balancing
→ optional overview/comparison/reporting

CODEX
→ new mechanics / system changes / difficult refactors
```

The balancing documentation does not need to be my only editing surface.

---

# 65. FILES I SHOULD FAVORITE IN VS CODE

If I manually balance often, keep these near the top:

```text
src/game/content/items/items.ts
src/game/content/recipes/artificingRecipes.ts
src/game/content/recipes/transmutationRecipes.ts

src/game/content/monsters/whisperingWoods.ts
src/game/content/monsters/howlingDen.ts
src/game/content/monsters/abandonedCatacombs.ts

src/game/content/spells/spells.ts

src/game/core/balance/balance.ts

src/game/content/channeling/manaPillars.ts
src/game/content/focus/focusImprovement.ts

src/game/types.ts
```

These files cover a very large portion of day-to-day balance editing.

---

# 66. ULTRA-SHORT CHEAT SHEET

```text
ITEM / EQUIPMENT STATS
src/game/content/items/items.ts

WHAT STATS EXIST?
src/game/types.ts

ARTIFICING COSTS
src/game/content/recipes/artificingRecipes.ts

TRANSMUTATION
src/game/content/recipes/transmutationRecipes.ts

MONSTERS + LOOT
src/game/content/monsters/whisperingWoods.ts
src/game/content/monsters/howlingDen.ts
src/game/content/monsters/abandonedCatacombs.ts

DUNGEON POOLS
src/game/content/dungeons/dungeons.ts

SPELLS
src/game/content/spells/spells.ts

BASE PLAYER / GLOBAL BALANCE
src/game/core/balance/balance.ts

MANA PILLARS
src/game/content/channeling/manaPillars.ts

FOCUS UPGRADE
src/game/content/focus/focusImprovement.ts

RESEARCH SYSTEM
src/game/systems/research/

GUILD REQUESTS
src/game/content/guild/guildRequests.ts
```

---

# 67. FINAL RULE

Before manually editing something, ask:

```text
"Does the game already support this exact type of value/mechanic?"
```

If:

```text
YES
```

find an existing example and edit/copy the pattern.

If:

```text
NO
```

do not fake the field.

Give the mechanic to Codex.

That one rule prevents most dangerous manual edits.

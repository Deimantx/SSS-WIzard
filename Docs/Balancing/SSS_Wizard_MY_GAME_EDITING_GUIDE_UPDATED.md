# SSS Wizard — MY GAME EDITING GUIDE

> Personal quick-reference for editing the game directly in VS Code.


> Updated for the current Artifact / Equipment / Artificing / T1 material architecture.
>
> The guide remains a **navigation/editing reference**, not a second balance database. Exact current Artifact costs should be read from runtime content files.

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
f5c4a9d1f150f14be3e2a2dd69e7b65299e873eb
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

This is the most important section of this guide.

If I know **what I want to change**, start here instead of searching the whole repository.

| I want to edit | Go here first | Important |
| --- | --- | --- |
| Item / normal Equipment stats | `src/game/content/items/items.ts` | Main authored item registry |
| Item descriptions / source metadata / sell behavior | `src/game/content/items/items.ts` | Main item identity file |
| Allowed Equipment stat fields | `src/game/types.ts` | Check `EquipmentStats` before inventing a field |
| Equipment internal tier / player-facing tier mapping / build tags / budget profiles | `src/game/content/items/equipmentBalance.ts` | Internal `1.0 / 1.3 / 1.6` currently all display as player-facing `T1` through `Math.floor()` |
| Equipment slots / ring positions / Earring support | `src/game/types.ts` | Item slot uses `ring`; loadout uses `ring1` + `ring2`; `earring` is its own slot |
| Normal Artificing Equipment recipe costs | `src/game/content/recipes/artificingRecipes.ts` | For non-Artifact Equipment this is the recipe cost source |
| Artificing unlock conditions | `src/game/content/recipes/artificingRecipes.ts` + `src/game/content/recipes/recipeUnlocks.ts` | Existing unlock types are easier to tune than inventing new ones |
| Artificing Artifact-vs-Equipment / tier catalog UI | `src/screens/tower/artificing/EquipmentCatalog.tsx` | UI/filter behavior, not balance data |
| **Artifact base item identity / slot / build tags** | `src/game/content/items/items.ts` | Name, description, slot, color, tags; **not** Artifact level scaling |
| **Artifact forge ingredients — actual consumed cost** | `src/game/content/artifacts/artifacts.ts` | `ARTIFACTS[id].forge.ingredients` is the runtime source used by the Artificing engine |
| **Artifact forge recipe mirror / Artificing presentation** | `src/game/content/recipes/artificingRecipes.ts` | Must stay identical to the Artifact forge list |
| **Artifact stats at Lv1–10** | `src/game/content/artifacts/artifacts.ts` | Edit `coreStatsByLevel` |
| **Artifact Lv1→10 upgrade material costs** | `src/game/content/artifacts/artifacts.ts` | Edit the Artifact `upgrades` arrays here |
| **Artifact Path branches / nodes / point costs / catalysts / boss gates** | `src/game/content/artifacts/artifacts.ts` | Main authored Artifact Path content |
| **Artifact level caps / points / node eligibility / respec / effective stats** | `src/game/systems/artifacts/artifactProgression.ts` | Runtime/system logic; be more careful |
| **Artifact forge + level-up 5s job execution** | `src/game/systems/artificing/artificingEngine.ts` | Consumes costs, starts/cancels/completes Artifact jobs |
| **Player Artifact forge / upgrade UI in Artificing** | `src/screens/tower/artificing/ArtificingDetail.tsx` | Current player-facing Forge / Upgrade flow |
| **Artifact Path modal / header / side panel** | `src/components/artifacts/ArtifactPathModal.tsx` | Main Artifact Path shell |
| **Artifact tree nodes / connectors / drag-to-pan** | `src/components/artifacts/ArtifactTreeGraph.tsx` | Fixed tree presentation/interaction |
| **Artifact selected-node inspector** | `src/components/artifacts/ArtifactNodeInspector.tsx` | Effects, requirements, allocation action |
| **Artifact Path tree layout/read model** | `src/game/presentation/artifacts/artifactPathReadModel.ts` | Tree presentation structure, not gameplay balance |
| **Artifact node text/effect presentation** | `src/game/presentation/artifacts/artifactPresentation.ts` | Human-readable node effect text |
| **Artifact Path styling** | `src/styles/components/artifacts.css` | Visual/game-feel CSS |
| **Artifact DevTools main tab** | `src/devtools/tabs/DeveloperArtifacts.tsx` | Free levels, caps, points, forced nodes, overrides, batch tools |
| **Artifact Path small inline Dev panel** | `src/components/artifacts/ArtifactPathDevMiniPanel.tsx` | Only shown when enabled from DevTools |
| **Artifact debug state/actions** | `src/store/gameStore.ts` + `src/game/systems/artifacts/artifactProgression.ts` | Dev bypasses ultimately affect runtime state/eligibility |
| Transmutation costs / Mana / time / ingredients | `src/game/content/recipes/transmutationRecipes.ts` | Base fragments + Prismatic Fragment |
| Whispering Woods monsters + loot | `src/game/content/monsters/whisperingWoods.ts` | Wisp / Thorn / Rootstone / Grove + Heartseed boss |
| Howling Den monsters + loot | `src/game/content/monsters/howlingDen.ts` | Fang / Hide / Corrupted Essence / Sinew + Greatbear Core |
| Abandoned Catacombs monsters + loot | `src/game/content/monsters/abandonedCatacombs.ts` | Ossuary / Soul / Graveglass / Burial Cloth + Edrin Remnant |
| Monster helper/effect syntax | `src/game/content/monsters/monsterTypes.ts` | Includes `withLifeEssence()` |
| Dungeon pools / bosses / Threat requirements / encounter delay / unlock chain | `src/game/content/dungeons/dungeons.ts` | Current T1 dungeons are 20 / 25 / 30 Threat |
| Spell Mana / cooldown / unlock / effect numbers | `src/game/content/spells/spells.ts` | Main spell content |
| Magic School definitions | `src/game/content/schools/schools.ts` | School-authored content |
| Global base balance | `src/game/core/balance/balance.ts` | Powerful shared values |
| Mana Pillar upgrades | `src/game/content/channeling/manaPillars.ts` | Pillar progression |
| Channeling discoveries | `src/game/content/channeling/channelingDiscoveries.ts` | Discovery definitions |
| Focus Improvement progression | `src/game/content/focus/focusImprovement.ts` | Focus upgrade costs/progression |
| Guild request values | `src/game/content/guild/guildRequests.ts` | Request requirements/rewards |
| Research global values | `src/game/core/balance/balance.ts` | Shared Research tuning |
| Research runtime mechanics | `src/game/systems/research/researchEngine.ts` | Runtime behavior |
| Research calculations/readouts | `src/game/systems/research/researchSelectors.ts` | Derived values/UI projections |
| Status definitions | `src/game/content/statuses/` | Existing status content |
| Equipment set definitions | `src/game/content/equipment/equipmentSets.ts` | Set/grouping logic |
| Item right-click / context actions | `src/ui/context-menu/itemContextActions.ts` | Where-to-get / open systems / tracking actions |
| Core type / ID registry | `src/game/types.ts` | IDs, slots, state shapes, supported fields |

## Artifact quick rule

If I only remember one Artifact rule, remember this:

```text
Artifact item identity
→ items.ts

Artifact forge + Lv1–10 stats + upgrade costs + Path nodes
→ artifacts.ts

Artifact runtime rules / caps / points / respec
→ artifactProgression.ts

Artifact actual Forge / Upgrade job execution
→ artificingEngine.ts

Artifact player UI
→ ArtificingDetail.tsx + components/artifacts/

Artifact developer controls
→ DeveloperArtifacts.tsx
```

And the most important duplication rule:

```text
ARTIFACT FORGE COST
must match in BOTH:

src/game/content/artifacts/artifacts.ts
src/game/content/recipes/artificingRecipes.ts
```

The Artificing engine prefers the Artifact definition for actual Artifact forge consumption, so changing only the recipe mirror is **not enough**.

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


## Important recent Equipment tier rule

Equipment can have internal authored values such as:

```text
1.0
1.3
1.6
```

Those are **internal balancing sub-tiers**, not separate player-facing T1/T2/T3 tiers.

Current mapping lives in:

```text
src/game/content/items/equipmentBalance.ts
```

and is:

```ts
getPlayerEquipmentTier(internalTier) = Math.floor(internalTier)
```

Therefore:

```text
1.0 → T1
1.3 → T1
1.6 → T1
2.x → T2
3.x → T3
```

If I only want to change one item's internal authored power tier:

```text
src/game/content/items/items.ts
```

If I want to change what the **player-facing tier means globally**:

```text
src/game/content/items/equipmentBalance.ts
```

That global mapping is 🟡/🔴 because it changes UI/filter semantics across Equipment and Artificing.

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

# 9. EQUIPMENT SLOTS

Examples:

```ts
equipmentSlot: 'weapon',
```

Current **item metadata slots** are:

```text
weapon
armor
helmet
cape
amulet
earring
ring
```

Current **loadout positions** are:

```text
weapon
armor
helmet
cape
amulet
earring
ring1
ring2
```

Important:

```text
Equipment item:
equipmentSlot: 'ring'

Player loadout:
ring1 / ring2
```

So a Ring item does not author itself as `ring1` or `ring2`.

`earring` is now a real dedicated Equipment slot.

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
      sourceKinds: ['spell'],
      damageTypes: ['fire'],
    },
  ],
}
```

This means approximately:

```text
+20% Fire Spell Damage
```

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

This file contains the Artificing recipe catalog used for:

```text
normal Equipment recipes
Artifact recipe mirrors / presentation
ingredients
quantities
source dungeon
unlock condition
craft duration
```

Important distinction:

```text
NORMAL EQUIPMENT
actual cost → artificingRecipes.ts

ARTIFACT FORGE
actual consumed cost → artifacts.ts
recipe/display mirror → artificingRecipes.ts
```

The Artifact recipe mirror is intentionally validated against the Artifact forge ingredients.

So for an Artifact Forge cost change I must update **both files**.

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


# 17. ARTIFACTS — START HERE

Artifacts now have their own full progression system.

Current persistent Artifact set:

```text
Ember Staff
Tideglass Wand
Stoneheart Scepter
Windthread Wand
Prismatic Focus
Wispweave Robe
Wispveil Hood
```

All current Artifacts are T1 and have:

```text
Level 1 → 10
Artifact Points
Artifact Path nodes
two build branches
boss-gated/catalyst nodes
```

The most important thing is that Artifact data is split by responsibility.

## Artifact file ownership

```text
src/game/content/items/items.ts
→ item identity
→ name
→ description
→ slot
→ build tags
→ equipmentTier
```

```text
src/game/content/artifacts/artifacts.ts
→ Artifact forge ingredients
→ Level 1–10 core stats
→ Level 1–10 upgrade costs
→ branches
→ Path nodes
→ node point costs
→ node level requirements
→ catalysts
→ boss requirements
→ node stats/modifiers/rules
```

```text
src/game/systems/artifacts/artifactProgression.ts
→ current Artifact level
→ current level cap
→ earned/spent/available points
→ effective Artifact stats
→ upgrade eligibility
→ node eligibility
→ catalyst consumption
→ respec behavior
→ forge completion
```

```text
src/game/systems/artificing/artificingEngine.ts
→ starts Artifact forge
→ starts Artifact upgrade
→ consumes materials
→ 5-second Artificing job
→ cancel/refund
→ completion
```

This split is now important enough that I should not treat an Artifact like ordinary Equipment.

---

# 18. ARTIFACT FORGE COSTS — IMPORTANT DUPLICATION RULE

For normal Equipment, changing a recipe quantity in:

```text
src/game/content/recipes/artificingRecipes.ts
```

is normally enough.

For an **Artifact Forge**, it is different.

The Artificing engine resolves Artifact forge ingredients from:

```text
ARTIFACTS[id].forge.ingredients
```

inside:

```text
src/game/content/artifacts/artifacts.ts
```

The corresponding entry in:

```text
src/game/content/recipes/artificingRecipes.ts
```

is a synchronized recipe/presentation mirror.

Therefore:

```text
Artifact Forge cost change
→ edit artifacts.ts
→ edit matching artificingRecipes.ts entry
→ keep item order + quantities identical
```

Example shape:

```ts
'prismatic-focus': {
  ...
  forge: {
    ingredients: [
      material('prismatic-fragment', 2),
      material('wisp-essence', 5),
      ...
    ],
  },
}
```

and the same ingredients must exist in:

```ts
ARTIFICING_RECIPES['prismatic-focus']
```

Changing only `artificingRecipes.ts` can make the UI/data mirror disagree with the actual Artifact cost.

Treat Artifact Forge ingredient edits as 🟡 even though the numbers themselves are simple.

---

# 19. ARTIFACT LEVEL STATS + LEVEL-UP COSTS

## Main file

```text
src/game/content/artifacts/artifacts.ts
```

### Artifact stats by level

Example shape:

```ts
const emberStats: Record<number, EquipmentStats> = {
  1: { basicDamage: 5, spellPower: 16 },
  2: { basicDamage: 6, spellPower: 20 },
  ...
  10: { basicDamage: 17, spellPower: 75 },
}
```

If I want to change how strong an Artifact is at a specific existing level:

```text
coreStatsByLevel / the corresponding *Stats table
```

is the place to edit.

Changing an existing numeric stat at one level is usually 🟢/🟡.

Do **not** try to balance Artifact Lv5 by adding ordinary `stats:` to its `items.ts` entry.

Artifact effective core stats come from the Artifact progression definition.

### Artifact level-up material costs

The same file contains arrays like:

```ts
upgrade(4, [
  material('predator-hide', 15),
  material('predator-fang', 15),
  ...
])
```

Meaning:

```text
fromLevel 4
→ upgrade to Level 5
```

Changing an existing material quantity is usually 🟢/🟡.

Changing which existing material is used is 🟡.

Creating a new upgrade mechanic is 🔴.

### Prismatic Focus recent rule

Prismatic Focus was recently rebalanced so its own Prismatic Fragment progression cost is much lower.

Do not copy old Prismatic Focus numbers from old chats/docs.

Always use:

```text
src/game/content/artifacts/artifacts.ts
```

as the current source for its level-up costs.

Its Forge mirror must still match:

```text
src/game/content/recipes/artificingRecipes.ts
```

---

# 20. ARTIFACT LEVEL CAPS + POINTS

## Runtime file

```text
src/game/systems/artifacts/artifactProgression.ts
```

Current normal cap structure is:

```text
before Howling Den unlock
→ Level 4 cap

Howling Den unlocked
→ Level 7 cap

Abandoned Catacombs unlocked
→ Level 10 cap
```

Current normal Artifact Points are derived from:

```text
Artifact Level - 1
```

So normally:

```text
Lv1  = 0 points
Lv4  = 3 points
Lv7  = 6 points
Lv10 = 9 points
```

DevTools can add temporary bonus points, but that is not normal progression.

This file also owns:

```text
getArtifactLevelCap()
getArtifactTotalPoints()
getArtifactSpentPoints()
getArtifactAvailablePoints()
canUpgradeArtifact()
getArtifactNodeEligibility()
allocateArtifactNode()
respecArtifact()
```

Changing authored Artifact costs/stats:

```text
artifacts.ts
```

Changing **how Artifact progression works**:

```text
artifactProgression.ts
```

The second one is 🔴/Codex territory unless I intentionally understand the system impact.

---

# 21. ARTIFACT PATH NODES / CATALYSTS / RESPEC

## Main authored content

```text
src/game/content/artifacts/artifacts.ts
```

Current node shape contains fields such as:

```ts
{
  id: 'example-node',
  artifactId: 'ember-staff',
  name: 'Example Node',
  type: 'minor', // minor | major | capstone
  branch: 'burning',
  pointCost: 1,
  requiresLevel: 4,
  prerequisites: ['previous-node'],
  catalyst: {
    itemId: 'heartseed',
    quantity: 1,
  },
  requiresBossKill: 'forest-heart',
  stats: { ... },
  combat: {
    modifiers: [ ... ],
    rules: [ ... ],
  },
}
```

### Safe-ish edits

Changing an existing:

```text
pointCost
requiresLevel
catalyst quantity
existing stat number
existing modifier number
```

is 🟡.

Branch/name/description text is usually 🟢.

### System-level edits

Creating:

```text
new modifier key
new combat trigger type
new condition type
new node mechanic
new point system
new catalyst lifecycle
```

is 🔴.

### Important catalyst / Respec behavior

Normal allocation of a catalyst node consumes the catalyst only if that node has never been attuned before.

Artifact progress keeps both:

```text
allocatedNodeIds
attunedNodeIds
```

Current normal Respec:

```text
allocatedNodeIds = []
```

but **does not clear**:

```text
attunedNodeIds
```

Meaning:

> once a catalyst node has been attuned, normal Respec does not make me pay that catalyst again.

Do not manually change this behavior unless I intentionally want a system redesign.

---

# 22. ARTIFACT UI — WHERE TO CHANGE WHAT I SEE

Artifact player UI is now split into two main places.

## Player Forge / Level Upgrade presentation

```text
src/screens/tower/artificing/ArtificingDetail.tsx
```

This currently owns the player-facing Artifact Artificing detail flow:

```text
Forge Artifact
Upgrade Artifact
current Artifact level/cap state
next upgrade ingredients
required material rows
Artifact Path button
```

So if I am asking:

```text
"Where is the normal Artifact Forge / Upgrade UI?"
```

start here.

## Artifact Path UI

Main shell:

```text
src/components/artifacts/ArtifactPathModal.tsx
```

Tree:

```text
src/components/artifacts/ArtifactTreeGraph.tsx
```

Selected-node inspector:

```text
src/components/artifacts/ArtifactNodeInspector.tsx
```

Small inline dev panel:

```text
src/components/artifacts/ArtifactPathDevMiniPanel.tsx
```

Tree/read-model helpers:

```text
src/game/presentation/artifacts/artifactPathReadModel.ts
src/game/presentation/artifacts/artifactPresentation.ts
```

Styles:

```text
src/styles/components/artifacts.css
```

Simple visual CSS tweaks can be 🟢/🟡.

Changing the tree interaction model, layout architecture, selection model, drag behavior, or responsive structure is 🔴/Codex recommended.

---

# 23. ARTIFACT DEVTOOLS

The main Artifact developer panel now lives in:

```text
src/devtools/tabs/DeveloperArtifacts.tsx
```

It includes practical Artifact testing controls such as:

```text
select Artifact
set level
+1 level
max to current cap
max absolute
reset level

+1 temporary Path Point
refill points
respec path

normal node unlock
force selected node
lock selected node if safe
unlock non-capstones
unlock all nodes
force capstones

ignore dungeon / boss gates
ignore level cap
ignore node prerequisites
allow beyond normal limit
free upgrade mode

max all owned Artifacts
unlock all Artifact paths
reset all paths
grant Artifact materials
```

The small panel inside Artifact Path is:

```text
src/components/artifacts/ArtifactPathDevMiniPanel.tsx
```

and its visibility toggle is controlled from the main Artifact DevTools tab.

Developer overrides are for testing.

Do not rebalance normal gameplay by editing debug bypass behavior.

---


# 24. TRANSMUTATION

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

# 25. TRANSMUTATION EXAMPLE

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

# 26. MONSTERS — WHERE THEY LIVE

Monster content is split by dungeon:

```text
src/game/content/monsters/whisperingWoods.ts
src/game/content/monsters/howlingDen.ts
src/game/content/monsters/abandonedCatacombs.ts
```

This is excellent for manual balancing.

---

# 27. SIMPLE MONSTER STATS

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

# 28. MONSTER ATTACK TIME

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

# 29. MONSTER LOOT

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


## Current T1 dungeon material identity

The current economy is deliberately structured around **four regular materials + one boss signature** per dungeon.

```text
WHISPERING WOODS
Wisp Essence
Thorn Fiber
Rootstone Shard
Grove Bark
Boss: Heartseed
```

```text
HOWLING DEN
Predator Fang
Predator Hide
Corrupted Beast Essence
Predator Sinew
Boss: Greatbear Core
```

```text
ABANDONED CATACOMBS
Ossuary Remnant
Soul Residue
Graveglass Shard
Burial Cloth
Boss: Edrin Remnant
```

The four regular materials were recently rebalanced toward approximately equal long-term demand.

Therefore changing only one material's drop rate can now disturb a deliberately balanced 1:1-ish dungeon economy.

Simple drop-number edits are still technically 🟢, but broad loot/economy changes should be treated as 🟡.


Percent reminder:

```text
0.2 = 20%
0.3 = 30%
1 = 100%
```

---

# 30. LIFE ESSENCE LOOT

The game uses:

```ts
withLifeEssence(...)
```

around dungeon loot.

Example:

```ts
withLifeEssence(
  [
    { itemId: 'grove-bark', min: 1, max: 2, chance: 0.2 },
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

# 31. MONSTER SPECIAL ACTIONS

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

# 32. MONSTER DAMAGE COEFFICIENT

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

# 33. MONSTER ACTION PATTERNS

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

# 34. BOSS VALUES

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

# 35. DUNGEONS

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

# 36. SPELLS

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

# 37. SIMPLE SPELL EXAMPLE

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

# 38. SPELL COOLDOWN

```text
5000  = 5 sec
7000  = 7 sec
12000 = 12 sec
30000 = 30 sec
```

---

# 39. SPELL DAMAGE

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

# 40. SPELL HEAL / BARRIER

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

# 41. SPELL STATUS EFFECTS

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

# 42. AUTO-CAST CONDITIONS

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

# 43. GLOBAL BASE BALANCE

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

# 44. CURRENT GLOBAL BALANCE SHAPE

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

# 45. HEALTH REGEN

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

# 46. CHANNELING

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

# 47. MANA PILLARS

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

# 48. CHANNELING DISCOVERIES

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

# 49. FOCUS IMPROVEMENT

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

# 50. RESEARCH — SIMPLE VALUES

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

# 51. RESEARCH — DO NOT CASUALLY EDIT ENGINE

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

# 52. GUILD

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

# 53. MAGIC SCHOOLS

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

# 54. STATUSES

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

# 55. EQUIPMENT SETS

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

# 56. TYPES.TS — VERY IMPORTANT BUT DO NOT RANDOMLY EDIT

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

# 57. WHEN I CAN COPY AN EXISTING EXAMPLE

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

# 58. VS CODE SEARCH WORKFLOW

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

# 59. SAFE DIRECT EDIT WORKFLOW

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

# 60. GOOD EXAMPLES OF CHANGES I CAN DO MYSELF

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

# 61. CHANGES I SHOULD PROBABLY GIVE TO CODEX

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

# 62. IF TYPESCRIPT SHOWS RED ERROR AFTER MY EDIT

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

# 63. DO NOT USE `as any` TO FORCE NEW CONTENT

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

# 64. IF GAME DOES NOT UPDATE AFTER A SIMPLE VALUE CHANGE

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

# 65. WHEN A NUMBER IS NOT THE FINAL NUMBER

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

# 66. UI CHANGES ARE A DIFFERENT AREA

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

# 67. QUICK UI SEARCH RULE

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

# 68. CONTENT VS SYSTEM RULE

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

# 69. MY PERSONAL EDITING TIERS

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

# 70. AFTER THE NEW DOCS/BALANCING REWORK

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

# 71. POSSIBLE FINAL HYBRID

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

# 72. FILES I SHOULD FAVORITE IN VS CODE

If I manually balance often, keep these near the top:

```text
src/game/content/items/items.ts
src/game/content/items/equipmentBalance.ts
src/game/content/recipes/artificingRecipes.ts
src/game/content/recipes/transmutationRecipes.ts

src/game/content/artifacts/artifacts.ts
src/game/systems/artifacts/artifactProgression.ts

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

# 73. ULTRA-SHORT CHEAT SHEET

```text
ITEM / NORMAL EQUIPMENT STATS
src/game/content/items/items.ts

EQUIPMENT TIER MAPPING / BUILD TAGS / BUDGET PROFILES
src/game/content/items/equipmentBalance.ts

WHAT STATS / SLOTS / IDS EXIST?
src/game/types.ts

NORMAL ARTIFICING EQUIPMENT COSTS
src/game/content/recipes/artificingRecipes.ts

ARTIFACT ITEM IDENTITY
src/game/content/items/items.ts

ARTIFACT FORGE / LV1-10 STATS / LEVEL-UP COSTS / PATH NODES
src/game/content/artifacts/artifacts.ts

ARTIFACT FORGE MIRROR
src/game/content/recipes/artificingRecipes.ts

ARTIFACT CAPS / POINTS / NODE ELIGIBILITY / RESPEC
src/game/systems/artifacts/artifactProgression.ts

ARTIFACT FORGE + UPGRADE JOB RUNTIME
src/game/systems/artificing/artificingEngine.ts

ARTIFACT PLAYER FORGE / UPGRADE UI
src/screens/tower/artificing/ArtificingDetail.tsx

ARTIFACT PATH UI
src/components/artifacts/

ARTIFACT DEVTOOLS
src/devtools/tabs/DeveloperArtifacts.tsx

TRANSMUTATION
src/game/content/recipes/transmutationRecipes.ts

MONSTERS + LOOT
src/game/content/monsters/whisperingWoods.ts
src/game/content/monsters/howlingDen.ts
src/game/content/monsters/abandonedCatacombs.ts

DUNGEON POOLS / THREAT / BOSS
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

# 74. FINAL RULE

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

# SSS Wizard — Act 1 Dungeon Structure & Content Brainstorm
## Clean Editable Working Document — Option A Locked

**Project:** SSS Wizard  
**Document purpose:** Clean working document for reviewing, editing, and later continuing Act 1 dungeon design.  
**Status:** Act structure and progression model are now partly locked. Dungeon names, enemy rosters, bosses, loot identities, gimmicks, and exact feature unlock placement remain editable unless marked **LOCKED**.

---

# 1. LOCKED ACT 1 STRUCTURE

The current Act 1 route follows the campaign layout already established.

## Important Tier Rules — LOCKED

- There are intentionally **two different T2.11 dungeons**.
- They are parallel branches of the same tier.
- Both display as **T2.11** in the game UI.
- For internal design clarity only, this document calls them:
  - `T2.11-A`
  - `T2.11-B`
- The middle `T2.12` node is the **final dungeon of Act 1**.
- There is **no T2.13** in the current structure.

## Current Route

```text
T2
│
├─ T2.3
├─ T2.2
├─ T2.4
│
└─ T2.5
   │
   ├─ T2.8
   ├─ T2.7
   ├─ T2.6
   │
   └─ T2.10
      │
      ├─ T2.11-A
      ├─ T2.12   ← FINAL ACT 1 DUNGEON
      └─ T2.11-B
```

Conceptually:

```text
ACT ENTRY
   ↓
T2
   ↓
FIRST BRANCH CLUSTER
T2.2 / T2.3 / T2.4
   ↓
MIDPOINT
T2.5
   ↓
SECOND BRANCH CLUSTER
T2.6 / T2.7 / T2.8
   ↓
LATE-ACT GATE
T2.10
   ↓
TWO PRE-FINAL BRANCHES
T2.11 / T2.11
   ↓
FINAL ACT 1 DUNGEON
T2.12
```

---

# 2. PROGRESSION MODEL — OPTION A LOCKED

## LOCKED: Complete Every Branch

Act 1 uses **Option A**.

Every branch dungeon must be completed before the next convergence dungeon unlocks.

```text
T2 complete
→ unlock T2.2 / T2.3 / T2.4

T2.2 + T2.3 + T2.4 complete
→ unlock T2.5

T2.5 complete
→ unlock T2.6 / T2.7 / T2.8

T2.6 + T2.7 + T2.8 complete
→ unlock T2.10

T2.10 complete
→ unlock both T2.11 dungeons

both T2.11 dungeons complete
→ unlock T2.12

T2.12 complete
→ Act 1 complete / Act 2 progression
```

## Design Consequences

This means:

- every dungeon matters;
- no branch can be permanently skipped;
- branch choice is mainly about **clear order**, not whether content is optional;
- all dungeon rewards can be assumed to have been encountered before later progression gates;
- balance becomes easier because later dungeons can assume all earlier branch rewards were available;
- the campaign map still feels branched even though full Act completion requires clearing all branches.

---

# 3. ACT 1 HIGH-LEVEL IDENTITY

## Working Act Name

**Act 1 — The Shattered Frontier**

This name is still editable.

## Theme

Act 1 represents the Wizard moving beyond the safer early-game / tutorial territory into a wider unstable magical frontier.

The region should feel like:

- old magical roads;
- ruined waystations;
- shattered wards;
- corrupted wilderness;
- abandoned mage structures;
- broken ritual sites;
- elemental instability;
- spirits and magical remnants;
- early signs of deeper Dark Portal influence.

## Atmosphere

The tone should remain:

- dark fantasy;
- arcane;
- ruined;
- mysterious;
- dangerous but still readable as early-to-mid progression;
- more varied than the tutorial dungeons;
- less cosmic/apocalyptic than later Acts.

## Gameplay Purpose

Act 1 should:

- establish the full branching campaign structure;
- expand enemy variety;
- introduce stronger dungeon identities;
- introduce more specialized combat mechanics;
- begin stronger Artifact/build specialization;
- unlock new combat-support systems;
- widen loot and crafting progression;
- end with a meaningful final dungeon at T2.12.

---

# 4. ACT 1 SYSTEM UNLOCKS

The broader Act progression plan currently assigns these new mechanics to Act 1:

```text
Summoning Elemental Guardians
Crystals
Alchemy
```

These systems belong to Act 1, but their exact dungeon unlock locations are not all locked yet.

## 4.1 Summoning Elemental Guardians — ACT 1

### LOCKED CORE CONCEPT

- Guardians help in combat by:
  - dealing damage;
  - providing bonus traits to the Wizard.
- Four starting elements:
  - Fire;
  - Earth;
  - Water;
  - Air.
- Guardians are **not normal living combat entities**.
- They:
  - cannot be attacked;
  - cannot die;
  - have no HP;
  - have no Mana;
  - have no Defense.
- They require a significant Mana-per-second upkeep while active.
- If Wizard Mana reaches `0`, the Guardian despawns for that battle.
- It may return in a later battle if the Wizard begins with positive Mana.
- Guardians can be upgraded through:
  - Guardian Level;
  - Guardian Rank.
- Higher Level/Rank improves their combat contribution.

### Current Unlock Placement

**T2 — Fractured Approach** currently unlocks the **Summoning Elemental Guardians** feature.

This is currently treated as a locked working decision unless changed later.

---

## 4.2 Crystals — ACT 1

### Working Concept

Crystals are a long-term combat customization system inspired by the Black Desert crystal concept.

Current design:

- Crystals fit into dedicated Wizard crystal slots.
- They provide combat bonuses.
- Early bonuses should be simple, for example:
  - `+3 Spell Power`
  - `+5 Health`
- Later tiers can become much stronger, for example:
  - `+15 Spell Power`
  - `+50 HP`
  - `+3 HP per attack/spell cast`
- Crystal acquisition should be grindy and RNG-driven.
- Possible sources:
  - crystal lootboxes;
  - very low universal monster drop chance;
  - dungeon-specific sources;
  - later Acts dropping higher crystal tiers directly.
- Example universal drop concept:
  - around `0.1%` from eligible monsters.
- Crystal progression loop:
  - obtain low-tier crystals;
  - combine several crystals;
  - spend Crystal Dust;
  - create stronger crystal variants;
  - repeat into higher tiers.

### Open Question

Exact Act 1 unlock node is **TBD**.

Possible future placements:
- T2.5 midpoint;
- one of T2.6–T2.8;
- T2.10.

Do not lock yet.

---

## 4.3 Alchemy — ACT 1

### Working Concept

Alchemy provides reusable combat consumable systems.

Current item families:

- **Healing Potions**
  - restore HP;
- **Elixirs**
  - short duration;
  - stronger buffs;
- **Flasks**
  - long duration;
  - weaker buffs.

### Automation

Alchemy should support automation rules such as:

```text
Use Healing Potion when HP < X%
Use Elixir at Boss
Use Flask at dungeon start
```

Exact rules are TBD.

### Slots

- Starts with **3 Alchemy slots**.
- Slot count can later be upgraded.

### Consumable Philosophy

Potions / Elixirs / Flasks:

- do **not** permanently expire;
- are not permanently consumed from Inventory;
- instead have a limited number of uses during one full dungeon loop;
- use limits reset after the dungeon loop completes and the Boss dies.

### Open Question

Exact Act 1 unlock node is **TBD**.

---

# 5. ACT 1 DUNGEON OVERVIEW

| Tier | Working Dungeon Name | Role | Theme | Main Reward / Progression Identity |
|---|---|---|---|---|
| T2 | Fractured Approach | Act entry | Ruined frontier / broken wards / corrupted elementals | Armor + Helmet Artifacts, Summoning Guardians, new Artifact materials |
| T2.2 | Flooded Reliquary | Branch | Water / drowned ruins | Mana / Water / sustain |
| T2.3 | Ashen Watch | Branch | Fire / burned watchtower | Fire / Burn / direct damage |
| T2.4 | Rootscar Hollow | Branch | Earth / corrupted roots | Defense / HP / Earth |
| T2.5 | Crossroads of Ruin | Midpoint convergence | Ruined magical crossroads | Universal progression / possible system unlock |
| T2.6 | Graveglass Hollow | Branch | Spirit / crystal corruption | Crit / Spell Power / glass-cannon identity |
| T2.7 | Stormvault Gallery | Branch | Air / lightning facility | Speed / cooldown / Air |
| T2.8 | Starfallen Observatory | Branch | Arcane / astral ruin | Focus / Spell Power / Arcane |
| T2.10 | The Broken Meridian | Late-act convergence | Leyline rupture | Strong general late-act rewards |
| T2.11-A | Hall of Unbound Names | Pre-final branch | Soul / silence / names | Control / debuff / utility |
| T2.11-B | Vault of the Black Sigil | Pre-final branch | Dark seal / corruption | Barrier / corruption / Dark Portal |
| T2.12 | TBD Final Dungeon | FINAL ACT 1 | TBD | Major Act completion reward / Act 2 unlock |

Names remain editable unless specifically locked later.

---

# 6. T2 — FRACTURED APPROACH

## Role

Act 1 entry dungeon.

It should establish:

- the Act 1 threat level;
- new visual identity;
- the first major new enemy family;
- first meaningful increase in combat complexity;
- first major Act 1 feature unlock.

## Theme

A damaged magical frontier route protected by old broken warding structures and corrupted elemental defenses.

Possible visuals:

- shattered stone markers;
- dead grass;
- arcane cracks;
- collapsed road;
- broken ward pylons;
- abandoned carts/camps;
- unstable elemental effects;
- low-level magical corruption.

## Enemy Ideas

Working roster:

- Warded Husk
- Rift Wolf
- Arcane Scavenger
- Withered Watcher

These are not locked.

## Boss — Current Working Choice

**Corrupted Elemental Gatekeeper**

This replaces the previous generic Gatebreaker/Gatekeeper idea.

### Boss Identity

Possible direction:

- an old defensive construct or summoned elemental guardian corrupted by frontier instability;
- acts as the thematic bridge into the newly unlocked Guardian system;
- can demonstrate multiple elemental behaviors;
- should feel like a feature-unlock boss rather than just a stronger normal enemy.

Possible mechanics:

- elemental stance changes;
- Barrier;
- elemental resistance shifts;
- mixed physical + magical attacks;
- one telegraphed high-damage special.

## Combat Identity

Simple but stronger than the tutorial.

Potential mechanics:

- first meaningful Barrier usage;
- resistance differences;
- light debuff/dispel interaction;
- mixed physical + magical threats;
- early elemental identity.

## Reward / Unlock Identity — CURRENT WORKING DECISIONS

T2 should provide:

- **Summoning Elemental Guardians feature unlocked**
- **first new Armor Artifact**
- **first new Helmet Artifact**
- basic upgrade materials for the new Artifacts
- general Act 1 progression materials

### Armor Artifact

TBD.

### Helmet Artifact

TBD.

### Guardian Unlock

The system should become available after the appropriate T2 completion / Boss milestone.

Exact UI/tutorial presentation can be designed later.

---

# 7. T2.2 — FLOODED RELIQUARY

## Theme

An old magical reliquary partially flooded after its protective systems failed.

## Visual Identity

- blue-green light;
- flooded stone chambers;
- waterlogged manuscripts;
- moss;
- broken runes;
- submerged relics;
- mist.

## Enemy Ideas

- Drowned Acolyte
- Reliquary Slime
- Mist Wraith
- Rune Leech

## Boss

**The Sunken Curator**

Alternatives:

- Reliquary Warden
- The Drowned Keeper
- Keeper Beneath the Water

## Combat Gimmicks

Possible:

- Chill;
- Mana drain;
- reduced cast speed;
- water vulnerability interactions;
- periodic cleansing requirements.

## Reward Identity

Focus on:

- Water;
- Mana sustain;
- Mana regeneration;
- defensive magic;
- healing/recovery;
- utility.

---

# 8. T2.3 — ASHEN WATCH

## Theme

A frontier watchtower and surrounding outpost destroyed by uncontrolled magical fire.

## Visual Identity

- blackened stone;
- ash;
- ember particles;
- collapsed towers;
- burnt banners;
- glowing cracks.

## Enemy Ideas

- Cinder Hound
- Ash Cultist
- Soot Revenant
- Flamebound Crow

## Boss

**The Ember Sentinel**

Alternatives:

- Ashen Watchmaster
- Cinderbound Captain
- The Last Watchfire

## Combat Gimmicks

Possible:

- Burn;
- stacking fire damage;
- explosive attacks;
- short high-pressure damage windows;
- fire vulnerability/resistance checks.

## Reward Identity

Focus on:

- Fire;
- direct spell damage;
- Burn;
- offensive Artifact materials;
- aggressive equipment.

---

# 9. T2.4 — ROOTSCAR HOLLOW

## Theme

A corrupted grove and underground root network warped by unstable magic.

## Visual Identity

- massive roots;
- cracked earth;
- thorn growth;
- fungal light;
- old nature shrines;
- corrupted sap.

## Enemy Ideas

- Thorn Maw
- Rootbound Stalker
- Briar Sprite
- Moss Carapace

## Boss

**The Hollow Treant**

Alternatives:

- Rootscar Ancient
- Thornheart
- The Buried Elder

## Combat Gimmicks

Possible:

- Entangle;
- Poison;
- defensive shells;
- regeneration;
- delayed heavy attacks.

## Reward Identity

Focus on:

- Earth;
- defense;
- Health;
- Barrier;
- sustain;
- damage reduction.

---

# 10. T2.5 — CROSSROADS OF RUIN

## Role

First major Act midpoint and first branch-convergence dungeon.

## Unlock Requirement — LOCKED

Requires:

```text
T2.2 complete
T2.3 complete
T2.4 complete
```

All three are mandatory.

## Theme

A ruined magical crossroads where multiple frontier routes meet.

## Visual Identity

- large broken road hub;
- ruined guard post;
- waystones;
- multiple old magical paths;
- destroyed wagons;
- scattered relics.

## Enemy Ideas

- Remnant Marauder
- Arcane Binder
- Broken Construct
- Rift Archer

## Boss

**The Crossroads Keeper**

Alternatives:

- The Lost Waywarden
- The Roadless Knight
- Crossroad Sentinel

## Combat Identity

Mixed threats from the previous branches.

This can test:

- sustain;
- defense;
- burst control;
- elemental matchups.

## Reward Identity

Possible:

- universal Artifact component;
- strong all-purpose equipment;
- progression materials;
- **possible Crystal or Alchemy system unlock**.

Exact feature unlock here is TBD.

---

# 11. T2.6 — GRAVEGLASS HOLLOW

## Theme

A burial complex where magical crystal growth has fused with the dead.

## Visual Identity

- cracked tombs;
- dark translucent crystal;
- spirit mist;
- floating shards;
- broken grave markers.

## Enemy Ideas

- Graveglass Shade
- Bone Shardling
- Silent Mourner
- Crypt Mite

## Boss

**The Glass Mourner**

Alternatives:

- Graveglass Matron
- The Shattered Dead
- Crystal Ossuary Lord

## Combat Gimmicks

Possible:

- Curse;
- vulnerability/fragility effects;
- crit-oriented enemy attacks;
- shard bursts;
- delayed explosions.

## Reward Identity

Focus on:

- Critical Chance;
- Critical Damage;
- Spell Power;
- risky offensive builds;
- crystal/shard materials.

### System Connection Possibility

This dungeon is a natural candidate for introducing or expanding the **Crystal** system.

Not locked.

---

# 12. T2.7 — STORMVAULT GALLERY

## Theme

A magical gallery/research facility destabilized by Air and lightning magic.

## Visual Identity

- metallic runes;
- wind tunnels;
- floating debris;
- lightning arcs;
- broken conductors;
- vibrating machinery.

## Enemy Ideas

- Volt Wisp
- Static Armor
- Gale Scribe
- Charged Seeker

## Boss

**The Vault Conductor**

Alternatives:

- Storm Archivist
- The Living Conduit
- Gale Engine

## Combat Gimmicks

Possible:

- Shock;
- fast actions;
- haste;
- repeated smaller hits;
- action-speed pressure;
- interrupt windows.

## Reward Identity

Focus on:

- Air;
- cooldown recovery;
- action speed;
- cast tempo;
- faster spell rotations.

---

# 13. T2.8 — STARFALLEN OBSERVATORY

## Theme

An ancient observatory damaged by astral or Arcane energy.

## Visual Identity

- broken telescope;
- purple-blue magical light;
- star maps;
- floating fragments;
- warped sky effects;
- ruined lenses.

## Enemy Ideas

- Starbound Eye
- Astral Husk
- Orbiting Fragment
- Lenskeeper Remnant

## Boss

**The Fallen Astromancer**

Alternatives:

- The Broken Stargazer
- Astral Lensmaster
- Starless Scholar

## Combat Gimmicks

Possible:

- Arcane bursts;
- Focus disruption;
- spell anomalies;
- spell amplification;
- temporary school modifiers.

## Reward Identity

Focus on:

- Arcane;
- Focus;
- Spell Power;
- hybrid spell builds;
- general spell efficiency.

---

# 14. T2.10 — THE BROKEN MERIDIAN

## Role

Late-Act convergence dungeon.

## Unlock Requirement — LOCKED

Requires:

```text
T2.6 complete
T2.7 complete
T2.8 complete
```

All three are mandatory.

## Theme

A major leyline nexus has ruptured and is destabilizing the region.

## Visual Identity

- giant cracked arcane lines;
- unstable magical pillars;
- floating rock;
- bright magical fractures;
- twisted architecture.

## Enemy Ideas

- Meridian Warden
- Fractured Channeler
- Arc Surge Horror
- Linebreaker Shade

## Boss

**The Meridian Splitter**

Alternatives:

- Leybreaker
- Meridian Warden Prime
- The Severed Channel

## Combat Gimmicks

Possible:

- multi-school damage;
- strong Barrier interaction;
- spell interruption;
- alternating elemental phases;
- defensive checks.

## Reward Identity

Could provide:

- stronger equipment;
- universal upgrade material;
- final preparation components;
- access to both T2.11 dungeons;
- possible remaining Act 1 system unlock if Crystals or Alchemy has not been unlocked earlier.

---

# 15. T2.11-A — HALL OF UNBOUND NAMES

## Tier Rule — LOCKED

Displayed tier:

```text
T2.11
```

`T2.11-A` is only an internal document label.

## Theme

A ritual archive where names, identities, and souls have become detached.

## Visual Identity

- old library halls;
- hanging seals;
- ghost writing;
- erased names;
- broken ritual tablets;
- whispering spirits.

## Enemy Ideas

- Name-Eater
- Bound Echo
- Hollow Liturgist
- Whisper Archivist

## Boss

**The Unspoken Prelate**

Alternatives:

- The Nameless Archivist
- Voice Without Form
- The Erased Saint

## Combat Gimmicks

Possible:

- Silence;
- spell lockouts;
- debuff extension;
- Focus disruption;
- anti-casting windows.

## Reward Identity

Focus on:

- control;
- debuff resistance;
- status duration;
- utility;
- Focus management;
- silence/curse interactions.

---

# 16. T2.11-B — VAULT OF THE BLACK SIGIL

## Tier Rule — LOCKED

Displayed tier:

```text
T2.11
```

`T2.11-B` is only an internal document label.

## Theme

A sealed magical vault containing forbidden sigils, Dark Portal research, or corruption-related relics.

## Visual Identity

- black stone;
- sealed doors;
- dark violet runes;
- chained relics;
- corrupted wards;
- arcane containment chambers.

## Enemy Ideas

- Sigil Guardian
- Black Seal Parasite
- Vault Devourer
- Inkbound Specter

## Boss

**The Sigil Warden**

Alternatives:

- Keeper of the Black Seal
- The Bound Custodian
- Black Vault Sentinel

## Combat Gimmicks

Possible:

- Barrier;
- corruption stacks;
- shield phases;
- curse effects;
- defensive encounter structure;
- temporary immunity windows.

## Reward Identity

Focus on:

- Dark Portal lore/progression;
- defensive magic;
- corruption mechanics;
- Barrier;
- late-Act special materials.

## Dark Portal Rule

Portal Shards should continue using the permanent Dark Portal progression model.

They should not become normal retained Inventory resources.

---

# 17. T2.12 — FINAL ACT 1 DUNGEON

## Status — LOCKED

`T2.12` is the **final dungeon of Act 1**.

It unlocks only after:

```text
T2.11-A complete
+
T2.11-B complete
```

There is no later T2.13 node in the current Act.

## Current Name

**TBD**

The final identity should be decided after the Act story direction is clearer.

---

# 18. T2.12 FINAL DUNGEON DIRECTION OPTIONS

These are still brainstorm options.

## Option A — The Rift Crown

Theme:

A central rupture where the magical instability of the entire Act converges.

Possible Boss:

**The Rift Regent**

Identity:

- multi-element combat;
- final mastery check;
- magical instability.

---

## Option B — The Black Gate

Theme:

The first true major Dark Portal-related structure.

Possible Boss:

**The Black Gatekeeper**

Identity:

- corruption;
- Barrier;
- portal phases;
- strong link into later Acts.

---

## Option C — The Fallen Chapter

Theme:

A destroyed mage order/chapterhouse that reveals what happened to this region.

Possible Boss:

**The Unbound Magister**

Identity:

- spell-heavy duel;
- multiple schools;
- lore-heavy Act ending.

---

## Option D — The Hollow Star

Theme:

A fragment of astral corruption has become the center of regional instability.

Possible Boss:

**The Hollow Star**

Identity:

- Arcane/cosmic;
- Focus mechanics;
- phase-based combat.

---

# 19. T2.12 DESIGN PRINCIPLES

The final dungeon should:

- feel clearly larger and more important than T2.11;
- combine mechanics learned across Act 1;
- introduce at least one unique final mechanic;
- provide a major reward;
- complete Act 1;
- unlock Act 2;
- potentially advance Dark Portal progression;
- feel like a conclusion rather than another normal dungeon.

---

# 20. ENEMY COUNT PHILOSOPHY

Working recommendation:

```text
3–4 normal enemies
1 boss
```

To control content scope, a good default may be:

```text
3 normal monsters
1 boss
```

More important dungeons such as T2.5, T2.10, and T2.12 may justify larger rosters.

Still editable.

---

# 21. NORMAL ENEMY DESIGN RULE

Later, when rosters are locked, every normal monster should have at least:

```text
1 trait
1 special action
```

Later monsters can have more.

Bosses should have:

```text
multiple actions
at least one meaningful encounter gimmick
phase logic where appropriate
```

---

# 22. LOOT PHILOSOPHY

A useful baseline per dungeon:

```text
DUNGEON SHARED LOOT
→ all normal monsters can drop

ENEMY SIGNATURE DROP
→ each normal monster can have one unique identity drop

BOSS REWARD
→ boss-specific progression, equipment, catalyst, system unlock, or special material
```

Example:

```text
Ashen Watch Shared
- Cinder Ash
- Burnt Sigil
- Ember Fragment

Cinder Hound
- Cinder Fang

Ash Cultist
- Charred Robe Scrap

Boss
- Ember Sentinel Core
```

This keeps loot understandable while preserving monster identity.

---

# 23. REWARD IDENTITY SUMMARY

| Dungeon | Main Reward Identity |
|---|---|
| T2 | Armor Artifact + Helmet Artifact + Summoning Guardians |
| T2.2 | Water / Mana / sustain |
| T2.3 | Fire / Burn / direct damage |
| T2.4 | Earth / HP / defense |
| T2.5 | Universal progression / possible Act 1 system unlock |
| T2.6 | Crit / Spell Power / Crystals |
| T2.7 | Air / speed / cooldown |
| T2.8 | Arcane / Focus / hybrid magic |
| T2.10 | Strong late-Act general rewards |
| T2.11-A | Control / debuff / status utility |
| T2.11-B | Barrier / corruption / Dark Portal |
| T2.12 | Major Act completion / unique reward / Act 2 unlock |

---

# 24. BOSS REWARD PHILOSOPHY

Boss rewards should not all just be stronger versions of normal monster drops.

Possible reward categories:

- unique equipment;
- Artifact catalyst;
- permanent unlock;
- school-cap progression;
- special crafting component;
- Dark Portal progression;
- Act progression unlock;
- spell-related component;
- system unlock;
- Crystal-related progression;
- Alchemy progression;
- Guardian progression.

---

# 25. COMBAT IDENTITY SUMMARY

Each dungeon should have one main mechanical identity.

Suggested:

```text
T2      → elemental introduction / Barrier / mixed threats
T2.2    → Mana / Chill pressure
T2.3    → Burn pressure
T2.4    → sustain / defense / Entangle
T2.5    → mixed mastery check

T2.6    → crit / curse / fragility
T2.7    → speed / Shock
T2.8    → Arcane / Focus disruption
T2.10   → multi-school / Barrier / late-act check

T2.11-A → silence / control
T2.11-B → Barrier / corruption
T2.12   → combined mastery + unique final mechanic
```

---

# 26. CAMPAIGN MAP PRESENTATION RULES

The map should visually communicate:

```text
entry
↓
branch cluster
↓
convergence
↓
branch cluster
↓
convergence
↓
two pre-final branches
↓
final dungeon
```

Important:

- `T2.5` = first major convergence.
- `T2.10` = second major convergence / late-Act gate.
- both `T2.11` nodes = parallel mandatory pre-final branches.
- `T2.12` = centered final destination.

---

# 27. DISPLAYED NODE LABELS — LOCKED

```text
T2
T2.2
T2.3
T2.4
T2.5
T2.6
T2.7
T2.8
T2.10
T2.11
T2.11
T2.12
```

Do not automatically “fix” the duplicate T2.11.

It is intentional.

Internal data IDs can still be unique:

```text
act1-t2-11-upper
act1-t2-11-lower
```

while both UI labels display:

```text
T2.11
```

---

# 28. LOCKED DECISIONS SUMMARY

Currently locked:

1. Act 1 contains **12 dungeons**.
2. Two parallel nodes are both displayed as **T2.11**.
3. **T2.12 is the final Act 1 dungeon**.
4. Progression uses **Option A — Complete Every Branch**.
5. All three T2.2/T2.3/T2.4 must be completed before T2.5.
6. All three T2.6/T2.7/T2.8 must be completed before T2.10.
7. Both T2.11 dungeons must be completed before T2.12.
8. Act 1 introduces:
   - Summoning Elemental Guardians;
   - Crystals;
   - Alchemy.
9. T2 currently unlocks:
   - Summoning Elemental Guardians;
   - first Armor Artifact;
   - first Helmet Artifact.
10. T2 working boss is:
   - **Corrupted Elemental Gatekeeper**.
11. Portal Shards remain permanent Dark Portal progression, not normal Inventory resources.

Everything else may still be edited.

---

# 29. OPEN QUESTIONS FOR LATER

## Dungeon Names

Which working names stay?

## T2.12

What is the final dungeon?
What is its Boss?
How directly does it connect to the Dark Portal?

## Crystals

Where exactly do Crystals unlock?

Strong candidates:
- T2.5
- T2.6
- T2.10

## Alchemy

Where exactly does Alchemy unlock?

Strong candidates:
- T2.5
- another first/second branch Boss
- T2.10

## Guardians

- exact unlock tutorial;
- Guardian leveling curve;
- Guardian ranks;
- Mana/sec upkeep;
- active Guardian limits;
- whether only one Guardian can be active initially.

## Artifacts

- name/design of first Armor Artifact;
- name/design of first Helmet Artifact;
- upgrade materials;
- whether each Act branch upgrades specific Artifact types.

## Loot

- shared drop counts;
- signature drops;
- equipment distribution;
- Crystal Dust sources;
- Crystal lootbox sources.

## Boss Progression

- school-cap gates;
- permanent unlocks;
- Artifact catalysts;
- Dark Portal progression.

---

# 30. NEXT DESIGN PASS WHEN THIS FILE RETURNS

When the edited file is returned, continue from this exact version.

Recommended order:

## Step 1 — Lock Dungeon Names / Themes

Review every working dungeon name and theme.

## Step 2 — Place Act 1 Mechanics

Lock exact unlock point for:

```text
Crystals
Alchemy
```

Summoning Guardians is currently at T2.

## Step 3 — Lock Enemy Rosters

For every dungeon:

```text
3–4 normal monsters
1 boss
```

## Step 4 — Lock Combat Identity

Every normal monster:

```text
base stats
1+ trait
1+ special attack
```

Bosses:

```text
multiple actions
gimmick
phase logic where appropriate
```

## Step 5 — Lock Loot

For every dungeon:

```text
shared loot
enemy signature loot
boss reward
Artifact materials
Crystal materials where relevant
Alchemy materials where relevant
```

## Step 6 — Balance

Only then define:

```text
HP
damage
action speed
defense
resistances
drop chance
drop quantity
XP
unlock requirements
```

## Step 7 — Codex Implementation MD

Only after content is sufficiently locked.

---

# 31. ACT 1 COUNT SUMMARY

```text
T2       ×1
T2.2–4   ×3
T2.5     ×1
T2.6–8   ×3
T2.10    ×1
T2.11    ×2
T2.12    ×1
----------------
TOTAL    12
```

---

# 32. EDITING NOTE

This document is intentionally meant to be edited manually.

Feel free to:

- rename dungeons;
- replace themes;
- change enemies;
- replace bosses;
- leave comments;
- mark ideas rejected;
- change reward identities;
- decide Crystal unlock location;
- decide Alchemy unlock location;
- add Artifact ideas;
- add story/lore notes.

When this edited file is returned, continue from it rather than rebuilding the Act from memory.

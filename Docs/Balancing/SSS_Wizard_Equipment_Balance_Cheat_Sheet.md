# SSS Wizard — Equipment Balance Cheat Sheet

Personal reference for balancing `items.ts`.

---

## 1. Equipment Formula

Every Equipment item is designed as:

```text
EQUIPMENT TIER
      ↓
overall power band

SLOT CHASSIS
      ↓
mandatory Core stats

BUILD TAGS
      ↓
where the item is trying to push the build

SUBSTATS
      ↓
extra build-forming power

SIGNATURE EFFECT
      ↓
unique modifier / trigger / proc
```

Important:

```text
Tier does NOT auto-generate stats.
Build Tags do NOT auto-generate stats.
Budgets are balancing rules, not hidden stat injection.

Real values stay explicit in items.ts.
```

---

# 2. Current Tutorial Equipment Tiers

| Content | Equipment Tier |
|---|---:|
| Whispering Woods | **1.0** |
| Howling Den | **1.3** |
| Abandoned Catacombs | **1.6** |

`equipmentTier` = reward power band.

Dungeon difficulty will use a separate future system such as **Danger Rating**.

Do not use Equipment Tier as the dungeon difficulty rating.

---

# 3. Budget Profiles

| Profile | Core Budget | Substat Budget | Signature Budget | Total Allowance |
|---|---:|---:|---:|---:|
| **Standard** | 70% | 30% | 0% | 100% |
| **Signature** | 60% | 25% | 15% | 100% |
| **Boss** | 60% | 20% | 20% | **110%** |

### Standard

```text
Core chassis
+ ~2 substats
+ no signature effect
```

### Signature

```text
Core chassis
+ 1–3 substats
+ 1 meaningful signature effect
```

### Boss

```text
strong Core chassis
+ 2–3 substats
+ 1 strong signature effect
+ ~10% total premium
```

These percentages are design targets, not exact runtime math.

---

# 4. Core Stat Rules by Slot

| Slot | Mandatory Core |
|---|---|
| **Weapon** | Basic Damage + Spell Power |
| **Focus** | Max Mana + Spell Power |
| **Shield** | Max Health + Defense + Block Chance |
| **Armor** | Max Health + Defense |
| **Helmet** | Max Health + Defense |
| **Cape** | Max Health + Defense |
| **Amulet** | At least 2 from HP / Mana / Spell Power / Defense |
| **Ring** | At least 2 from HP / Mana / Spell Power / Mana Regen |

A stat can be Core on one slot and Substat on another.

Example:

```text
Focus:
Max Mana = Core

Armor:
Max Mana = Substat
```

For Amulet/Ring, the minimum required pair is the chassis. Extra normal stats consume Substat budget.

---

# 5. Weapon Direction

Every Weapon always has:

```text
Basic Damage
Spell Power
```

| Weapon Type | Basic Damage | Spell Power |
|---|---|---|
| Mage | lower | higher |
| Hybrid / Battlemage | medium | medium |
| Basic-Attack | higher | lower |

### 2H Rule

2H loses the Offhand slot.

Target roughly:

```text
2H core opportunity ≈ 1.55–1.70 × comparable 1H core opportunity
```

This is a manual balancing guide, not automatic scaling.

---

# 6. Substats

| Stat | Main Use |
|---|---|
| Max Mana | caster resource |
| Mana Regen | sustain |
| Health Regen | sustain / tank |
| Max Focus | automation |
| Focus Efficiency | automation efficiency |
| Crit Chance | Basic Attack / Crit |
| Crit Damage | Crit |
| Basic Attack Speed | Basic Attack |
| Cooldown Recovery | spell tempo |
| Mana Cost Reduction | spell efficiency |
| Healing Done | healing build |
| Barrier Power | Barrier build |
| Damage over Time | DoT build |
| Status Duration | status build |
| Physical Resistance | defense |
| Arcane Resistance | defense |
| Fire Resistance | defense |
| Water Resistance | defense |
| Earth Resistance | defense |
| Air Resistance | defense |

Good default:

```text
Normal item      → ~2 substats
Specialized      → 2–3 substats
Signature        → 1–3 substats + effect
Boss             → 2–3 substats + strong effect
```

Do not judge power only by number of lines. One strong stat can consume more budget than several small ones.

---

# 7. All Current EquipmentStats

Current code supports:

```text
basicDamage
spellPower

maxHealth
healthRegen

maxMana
manaRegen

maxFocus
focusEfficiencyPct

defense
blockChance

critChance
critDamage
basicAttackSpeedPct

cooldownRecoveryPct
manaCostReductionPct

healingDonePct
barrierPowerPct

damageOverTimePct
statusDurationPct

resistances:
  physical
  arcane
  fire
  water
  earth
  air
```

Percent values are decimals:

```text
0.02 = 2%
0.05 = 5%
0.10 = 10%
0.15 = 15%
```

---

# 8. Build Tags

Build Tags classify the item. They do **not** change gameplay by themselves.

## Combat direction

```text
spell
basic-attack
hybrid
```

## Build mechanics

```text
crit
status
dot
barrier
defense
sustain
mana
focus
healing
```

## Element identity

```text
fire
water
earth
air
```

Recommended:

```text
1–4 tags per Equipment item
```

Tags describe BUILD PURPOSE, not every stat on the item.

Examples:

```text
Ember Staff
spell, fire

Razorclaw Circlet
basic-attack, crit

Soulglass Amulet
spell, status, dot

Soulward Shield
defense, barrier, mana
```

---

# 9. Signature Effects

Signature effects live in Equipment `combat.modifiers` / `combat.rules`.

Examples already used:

```text
element-specific Spell Damage
Barrier modifier
flat Barrier bonus
hostile Debuff duration reduction
damage vs Debuffed target

Living Seed
Predator's Feast
Unyielding
Soul Release
Arcane Remnant
```

Rule of thumb:

```text
Standard  → no signature effect
Signature → 1 meaningful effect
Boss      → 1 strong effect + stronger total allowance
```

Do not stack several signature mechanics on every item.

---

# 10. Current Build Language

Main build directions currently supported:

```text
Pure Spell
Basic Attack
Hybrid / Battlemage

Crit
Status
DoT

Barrier
Defense
Sustain

Mana
Focus
Healing

Fire
Water
Earth
Air
```

This is enough for current content. Add new tags only when a genuinely new build direction appears.

---

# 11. Balancing Checklist

When adding/editing Equipment:

```text
1. What Equipment Tier is it?
2. What slot is it?
3. Does it satisfy that slot's Core chassis?
4. What are its 1–4 Build Tags?
5. Is it Standard / Signature / Boss?
6. How many Substats does it have?
7. Do the Substats support its Build Tags?
8. Is enough budget reserved for a Signature effect?
9. Does a 2H weapon compensate for losing Offhand?
10. Is newer-tier core power higher without deleting every older specialization?
```

Goal:

```text
SLOT tells the baseline.
TIER tells the power band.
BUILD TAGS tell the direction.
SUBSTATS shape the build.
SIGNATURE tells the item's personality.
```

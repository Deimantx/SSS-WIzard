# Howling Den enemies

## Quick comparison

| Enemy ID | Name | Role | Max Health | Basic Attack | Basic Attack time | Defense |
| --- | --- | --- | --- | --- | --- | --- |
| cavefang-wolf | Cavefang Wolf | Normal | 115 | 12 | 2.2 s | 10 |
| razorclaw-lynx | Razorclaw Lynx | Normal | 130 | 11 | 1.9 s | 10 |
| corrupted-dire-wolf | Corrupted Dire Wolf | Normal | 160 | 14 | 2.3 s | 10 |
| corrupted-greatbear | Corrupted Greatbear | Boss | 900 | 22 | 2.8 s | 10 |

## Enemy details

### Cavefang Wolf (cavefang-wolf)

A patient predator that waits for weakness

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 115 |
| Basic Attack damage | 12 |
| Basic Attack time | 2.2 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | None |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Predator Instinct: Deals 25% more damage while the target is at or below 35% HP.

### Action patterns

- **default:** Basic Attack -> Basic Attack -> Pounce

### Special actions

#### Pounce

**ID:** `pounce`

**Action time:** 1.4 s
**Tags:** Special, Physical, Melee, Control

The predator lunges at the target and delays the Player's Basic Attack.

**What it does:** 150% of Basic Attack damage Physical damage to the opponent; Delay the opponent's Basic Attack by 500 ms

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| predator-fang | Predator Fang | 1-1 | 55% |
| predator-hide | Predator Hide | 1-1 | 30% |
| life-essence | Life Essence | 1-3 | 100% |

### Razorclaw Lynx (razorclaw-lynx)

A blur of claws and hungry momentum

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 130 |
| Basic Attack damage | 11 |
| Basic Attack time | 1.9 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | None |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Relentless Hunter: Deals 20% more damage to Bleeding targets.

### Action patterns

- **default:** Basic Attack -> Rending Claws -> Basic Attack

### Special actions

#### Rending Claws

**ID:** `rending-claws`

**Action time:** 1.3 s
**Tags:** Special, Physical, Melee, Debuff

Raking claws cut the target and leave a lingering Bleeding wound.

**What it does:** 125% of Basic Attack damage Physical damage to the opponent; Apply Bleeding to the opponent for 8 s; periodic effect: 36.25% of Basic Attack damage Physical damage to the status holder

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| predator-fang | Predator Fang | 1-1 | 45% |
| predator-hide | Predator Hide | 1-1 | 45% |
| life-essence | Life Essence | 1-3 | 100% |

### Corrupted Dire Wolf (corrupted-dire-wolf)

A beast split between fang and sorcery

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 160 |
| Basic Attack damage | 14 |
| Basic Attack time | 2.3 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | Fire +10%, Water +10%, Earth +10%, Air +10% |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Arcane Corruption: Corruption grants 10% resistance to Fire, Water, Earth, and Air.

### Action patterns

- **default:** Basic Attack -> Arcane Bite -> Basic Attack -> Basic Attack -> Corrupted Howl

### Special actions

#### Arcane Bite

**ID:** `arcane-bite`

**Action time:** 1.6 s
**Tags:** Special, Physical, Arcane, Melee, Direct

A corrupted bite tears through both body and warding.

**What it does:** 70% of Basic Attack damage Physical damage to the opponent and 70% of Basic Attack damage Arcane damage to the opponent

#### Corrupted Howl

**ID:** `corrupted-howl`

**Action time:** 1.8 s
**Tags:** Special, Buff

The howl fills the Corrupted Dire Wolf with Haste.

**What it does:** Apply Haste to the caster for 6 s

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| corrupted-beast-essence | Corrupted Beast Essence | 1-1 | 35% |
| predator-hide | Predator Hide | 1-1 | 30% |
| predator-fang | Predator Fang | 1-1 | 25% |
| life-essence | Life Essence | 1-3 | 100% |

### Corrupted Greatbear (corrupted-greatbear)

A mountain of fur warped by hungry magic

### Stats

| Stat | Value |
| --- | --- |
| Role | Boss |
| Max Health | 900 |
| Basic Attack damage | 22 |
| Basic Attack time | 2.8 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | None |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Thick Hide: Basic Attack damage received is reduced by 20%.
- Unstable Corruption: At 50% HP, gains Haste and shifts to the Corrupted Pattern once.

### Action patterns

- **default:** Basic Attack -> Basic Attack -> Crushing Maul -> Basic Attack -> Groundbreaker
- **corrupted:** Basic Attack -> Corrupted Roar -> Crushing Maul -> Basic Attack -> Basic Attack -> Arcane Rampage

### Special actions

#### Crushing Maul

**ID:** `crushing-maul`

**Action time:** 1.8 s
**Tags:** Special, Physical, Melee, Direct

A brutal maul strike crashes into the target.

**What it does:** 155% of Basic Attack damage Physical damage to the opponent

#### Groundbreaker

**ID:** `groundbreaker`

**Action time:** 2.5 s
**Tags:** Special, Physical, Control

The Greatbear shakes the ground and delays the Player's Basic Attack.

**What it does:** 120% of Basic Attack damage Physical damage to the opponent; Delay the opponent's Basic Attack by 1.2 s

#### Corrupted Roar

**ID:** `corrupted-roar`

**Action time:** 2.2 s
**Tags:** Special, Debuff

Makes the target Vulnerable.

**What it does:** Apply Vulnerable to the opponent

#### Arcane Rampage

**ID:** `arcane-rampage`

**Action time:** 3.5 s
**Tags:** Special, Magic, Arcane, Direct

A heavy Arcane strike empowered by unstable corruption.

**What it does:** 200% of Basic Attack damage Arcane damage to the opponent

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| predator-hide | Predator Hide | 2-4 | 100% |
| corrupted-beast-essence | Corrupted Beast Essence | 1-2 | 100% |
| greatbear-core | Greatbear Core | 1-1 | 35% |
| greatbear-heartstone | Greatbear Heartstone | 1-1 | 5% |
| life-essence | Life Essence | 1-3 | 100% |

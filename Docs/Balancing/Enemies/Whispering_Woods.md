# Whispering Woods enemies

## Quick comparison

| Enemy ID | Name | Role | Max Health | Basic Attack | Basic Attack time | Defense |
| --- | --- | --- | --- | --- | --- | --- |
| forest-wisp | Forest Wisp | Normal | 44 | 5 | 2.8 s | 10 |
| thornling | Thornling | Normal | 64 | 8 | 2.5 s | 10 |
| stone-root | Stone Root | Normal | 92 | 11 | 3.2 s | 10 |
| grove-sentinel | Grove Sentinel | Normal | 360 | 15 | 2.6 s | 10 |
| forest-heart | Forest Heart | Boss | 600 | 20 | 2.4 s | 10 |

## Enemy details

### Forest Wisp (forest-wisp)

A curious lantern of the undergrowth

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 44 |
| Basic Attack damage | 5 |
| Basic Attack time | 2.8 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | None |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Flicker: After Arc Spark resolves, gains Haste for 3 seconds.

### Action patterns

- **default:** Basic Attack -> Basic Attack -> Arc Spark

### Special actions

#### Arc Spark

**ID:** `arc-spark`

**Action time:** 2 s
**Tags:** Special, Magic, Arcane, Direct

A bright Arcane spark lashes the target.

**What it does:** 240% of Basic Attack damage Arcane damage to the opponent

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| wisp-essence | Wisp Essence | 1-2 | 100% |
| life-essence | Life Essence | 1-3 | 100% |

### Thornling (thornling)

A knot of spite and briars

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 64 |
| Basic Attack damage | 8 |
| Basic Attack time | 2.5 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | None |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Barkskin: Basic Attack damage received is reduced by 15%.

### Action patterns

- **default:** Basic Attack -> Basic Attack -> Thorn Lash

### Special actions

#### Thorn Lash

**ID:** `thorn-lash`

**Action time:** 1.8 s
**Tags:** Special, Physical, Debuff

A thorned lash cuts the target and leaves a lingering Thorn Wound.

**What it does:** 125% of Basic Attack damage Physical damage to the opponent; Apply Thorn Wound to the opponent for 6 s; periodic effect: 37.5% of Basic Attack damage Physical damage to the status holder

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| wisp-essence | Wisp Essence | 1-2 | 100% |
| life-essence | Life Essence | 1-3 | 100% |

### Stone Root (stone-root)

The forest floor given a heartbeat

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 92 |
| Basic Attack damage | 11 |
| Basic Attack time | 3.2 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | None |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Rooted Shell: Starts with Barrier equal to 15% max HP.

### Action patterns

- **default:** Basic Attack -> Basic Attack -> Basic Attack -> Root Slam

### Special actions

#### Root Slam

**ID:** `root-slam`

**Action time:** 2.5 s
**Tags:** Special, Physical, Control

A crushing root strike disrupts the Player's Basic Attack rhythm.

**What it does:** 165% of Basic Attack damage Physical damage to the opponent; Delay the opponent's Basic Attack by 700 ms

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| wisp-essence | Wisp Essence | 1-3 | 100% |
| life-essence | Life Essence | 1-3 | 100% |

### Grove Sentinel (grove-sentinel)

An ancient guardian of the inner grove

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 360 |
| Basic Attack damage | 15 |
| Basic Attack time | 2.6 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | None |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Ancient Growth: At 40% HP, gains a large Barrier once.

### Action patterns

- **default:** Basic Attack -> Basic Attack -> Root Crush -> Basic Attack -> Verdant Guard

### Special actions

#### Root Crush

**ID:** `root-crush`

**Action time:** 2 s
**Tags:** Special, Physical, Direct

The guardian brings its roots down with crushing force.

**What it does:** 135% of Basic Attack damage Physical damage to the opponent

#### Verdant Guard

**ID:** `verdant-guard`

**Action time:** 2.5 s
**Tags:** Special, Barrier

The guardian gathers living energy into a protective Barrier.

**What it does:** Grant 16.67% of the caster's Max Health Barrier to the caster

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| grove-bark | Grove Bark | 2-3 | 100% |
| wisp-essence | Wisp Essence | 4-6 | 100% |
| life-essence | Life Essence | 1-3 | 100% |

### Forest Heart (forest-heart)

The pulse beneath the roots

### Stats

| Stat | Value |
| --- | --- |
| Role | Boss |
| Max Health | 600 |
| Basic Attack damage | 20 |
| Basic Attack time | 2.4 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | None |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Living Core: At 50% HP, gains 15% Action speed once.

### Action patterns

- **default:** Basic Attack -> Basic Attack -> Heart Pulse -> Basic Attack -> Basic Attack -> Root Prison -> Basic Attack -> Basic Attack -> Basic Attack -> Rejuvenating Sap

### Special actions

#### Heart Pulse

**ID:** `heart-pulse`

**Action time:** 2 s
**Tags:** Special, Physical, Direct

The Forest Heart releases a crushing pulse through the roots.

**What it does:** 120% of Basic Attack damage Physical damage to the opponent

#### Root Prison

**ID:** `root-prison`

**Action time:** 2 s
**Tags:** Special, Physical, Control

Roots crush the target and delay the Player's next Basic Attack.

**What it does:** 80% of Basic Attack damage Physical damage to the opponent; Delay the opponent's Basic Attack by 1 s

#### Rejuvenating Sap

**ID:** `rejuvenating-sap`

**Action time:** 3 s
**Tags:** Special, Heal, Direct

The Heart draws restorative sap inward to recover Health.

**What it does:** Restore 10% of the caster's Max Health Health to the caster

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| heartseed | Heartseed | 1-1 | 100% |
| heartseed-necklace | Heartseed Necklace | 1-1 | 5% |
| life-essence | Life Essence | 1-3 | 100% |

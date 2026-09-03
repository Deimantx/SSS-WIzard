# Abandoned Catacombs enemies

## Quick comparison

| Enemy ID | Name | Role | Max Health | Basic Attack | Basic Attack time | Defense |
| --- | --- | --- | --- | --- | --- | --- |
| restless-skeleton | Restless Skeleton | Normal | 180 | 15 | 2.7 s | 10 |
| grave-wraith | Grave Wraith | Normal | 160 | 14 | 2.4 s | 10 |
| fallen-acolyte | Fallen Acolyte | Normal | 220 | 16 | 2.6 s | 10 |
| archmage-edrin-shade | Archmage Edrin's Shade | Boss | 1300 | 20 | 2.5 s | 10 |

## Enemy details

### Restless Skeleton (restless-skeleton)

Bones animated by the last command they heard

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 180 |
| Basic Attack damage | 15 |
| Basic Attack time | 2.7 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | Physical +25% |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Brittle Bones: Physical damage is reduced by 25%.

### Action patterns

- **default:** Basic Attack -> Basic Attack -> Bone Cleaver

### Special actions

#### Bone Cleaver

**ID:** `bone-cleaver`

**Action time:** 2.2 s
**Tags:** Special, Physical, Melee, Direct

A heavy cleaver blow splits through the target.

**What it does:** 185% of Basic Attack damage Physical damage to the opponent

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| ossuary-remnant | Ossuary Remnant | 1-1 | 55% |
| graveglass-shard | Graveglass Shard | 1-1 | 15% |
| life-essence | Life Essence | 1-3 | 100% |

### Grave Wraith (grave-wraith)

A cold memory refusing to fade

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 160 |
| Basic Attack damage | 14 |
| Basic Attack time | 2.4 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | Physical +50%, Fire -25%, Water -25%, Earth -25%, Air -25% |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Ethereal Form: Physical damage is reduced by 50%; Fire, Water, Earth, and Air damage are increased by 25%.

### Action patterns

- **default:** Basic Attack -> Chilling Touch -> Basic Attack -> Basic Attack -> Fade

### Special actions

#### Chilling Touch

**ID:** `chilling-touch`

**Action time:** 1.8 s
**Tags:** Special, Water, Magic, Debuff

A cold touch damages the target and leaves it Chilled.

**What it does:** 130% of Basic Attack damage Water damage to the opponent; Apply Chilled to the opponent

#### Fade

**ID:** `fade`

**Action time:** 1.7 s
**Tags:** Special, Buff

The Grave Wraith slips into Spectral Fade.

**What it does:** Apply Spectral Fade to the caster for 5 s

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| soul-residue | Soul Residue | 1-1 | 50% |
| graveglass-shard | Graveglass Shard | 1-1 | 30% |
| life-essence | Life Essence | 1-3 | 100% |

### Fallen Acolyte (fallen-acolyte)

A ritualist still serving a forgotten master

### Stats

| Stat | Value |
| --- | --- |
| Role | Normal |
| Max Health | 220 |
| Basic Attack damage | 16 |
| Basic Attack time | 2.6 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | None |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Grave Channeling: Below 50% HP, healing done is increased by 50%.

### Action patterns

- **default:** Grave Bolt -> Basic Attack -> Soul Drain -> Basic Attack -> Basic Attack -> Death Ward -> Basic Attack

### Special actions

#### Grave Bolt

**ID:** `grave-bolt`

**Action time:** 1.5 s
**Tags:** Special, Arcane, Magic, Direct

A focused Arcane bolt tears through the target.

**What it does:** 150% of Basic Attack damage Arcane damage to the opponent

#### Soul Drain

**ID:** `soul-drain`

**Action time:** 2.2 s
**Tags:** Special, Arcane, Magic, Heal, Direct

Arcane force tears at the target and restores the caster's Health.

**What it does:** 112.5% of Basic Attack damage Arcane damage to the opponent; Restore 9% of the caster's Max Health Health to the caster

#### Death Ward

**ID:** `death-ward`

**Action time:** 2 s
**Tags:** Special, Barrier

A deathly ward gathers a protective Barrier around the caster.

**What it does:** Grant 20.5% of the caster's Max Health Barrier to the caster

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| graveglass-shard | Graveglass Shard | 1-1 | 35% |
| soul-residue | Soul Residue | 1-1 | 30% |
| ossuary-remnant | Ossuary Remnant | 1-1 | 20% |
| life-essence | Life Essence | 1-3 | 100% |

### Archmage Edrin's Shade (archmage-edrin-shade)

The last spell of a wizard who would not rest

### Stats

| Stat | Value |
| --- | --- |
| Role | Boss |
| Max Health | 1300 |
| Basic Attack damage | 20 |
| Basic Attack time | 2.5 s |
| Defense | 10 |
| Critical Strike chance | 5% |
| Critical Strike damage | 1.5x |
| Block chance | 0% |
| Resistances | Fire +15%, Water +15%, Earth +15%, Air +15% |
| Damage immunities | None |
| Status immunities | None |

### Traits

- Arcane Remnant: Resists Fire, Water, Earth, and Air damage by 15%.
- Unbound Spirit: At 50% HP, gains Haste and shifts to the Unbound Pattern once.

### Action patterns

- **default:** Gravefire -> Basic Attack -> Frostbind -> Arcane Ward -> Basic Attack -> Soul Drain
- **unbound:** Basic Attack -> Gravefire -> Frostbind -> Soul Drain -> Basic Attack -> Final Incantation

### Special actions

#### Gravefire

**ID:** `gravefire`

**Action time:** 1.8 s
**Tags:** Special, Fire, Magic, Debuff

Flame erupts across the target and leaves it Burning.

**What it does:** 140% of Basic Attack damage Fire damage to the opponent; Apply Burning to the opponent for 5 s; periodic effect: 25% of Basic Attack damage Fire damage to the status holder

#### Frostbind

**ID:** `frostbind`

**Action time:** 2 s
**Tags:** Special, Water, Magic, Debuff

A freezing surge damages the target and leaves it Chilled.

**What it does:** 120% of Basic Attack damage Water damage to the opponent; Apply Chilled to the opponent

#### Arcane Ward

**ID:** `arcane-ward`

**Action time:** 2.2 s
**Tags:** Special, Arcane, Barrier

Edrin shapes an Arcane ward into a protective Barrier.

**What it does:** Grant 5.4% of the caster's Max Health Barrier to the caster

#### Soul Drain

**ID:** `soul-drain`

**Action time:** 2.4 s
**Tags:** Special, Arcane, Magic, Heal, Direct

Arcane force tears at the target and restores the caster's Health.

**What it does:** 120% of Basic Attack damage Arcane damage to the opponent; Restore 2.3% of the caster's Max Health Health to the caster

#### Final Incantation

**ID:** `final-incantation`

**Action time:** 4.5 s
**Tags:** Special, Arcane, Magic, Direct

Edrin unleashes a devastating Arcane incantation.

**What it does:** 350% of Basic Attack damage Arcane damage to the opponent

### Loot

| Item ID | Item | Quantity | Chance |
| --- | --- | --- | --- |
| graveglass-shard | Graveglass Shard | 2-4 | 100% |
| soul-residue | Soul Residue | 2-3 | 100% |
| edrin-remnant | Edrin Remnant | 1-1 | 35% |
| edrins-signet | Edrin's Signet | 1-1 | 5% |
| life-essence | Life Essence | 1-3 | 100% |

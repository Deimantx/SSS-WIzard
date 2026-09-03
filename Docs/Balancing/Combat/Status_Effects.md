# Status effects

Each authored status is expanded below so a designer can review its duration, stacking, flags, modifiers, and periodic work.

## Burning

**ID:** `burning`

**Classification:** Debuff
**Tags:** Debuff, Dot, Fire
**Default duration:** 5 s
**Stacking:** Refresh
**Cleanseable:** Yes
**Dispellable:** No
**Prevents normal actions:** No

Takes Fire damage over time.

### Modifiers

- None

### Periodic work

Every 1 s: 5 Fire damage to the status holder

### Trigger rules

- None
## Quickening

**ID:** `quickening`

**Classification:** Buff
**Tags:** Buff, Air
**Default duration:** 6 s
**Stacking:** Refresh
**Cleanseable:** No
**Dispellable:** Yes
**Prevents normal actions:** No

Basic Attacks resolve 25% faster.

### Modifiers

- +25% Basic Attack speed

### Periodic work

None

### Trigger rules

- None
## Haste

**ID:** `haste`

**Classification:** Buff
**Tags:** Buff
**Default duration:** Indefinite
**Stacking:** Refresh
**Cleanseable:** No
**Dispellable:** Yes
**Prevents normal actions:** No

Action speed increased by 15%.

### Modifiers

- +15% Action speed

### Periodic work

None

### Trigger rules

- None
## Spectral Fade

**ID:** `spectral-fade`

**Classification:** Buff
**Tags:** Buff
**Default duration:** 5 s
**Stacking:** Strongest
**Cleanseable:** No
**Dispellable:** Yes
**Prevents normal actions:** No

Damage taken is reduced by 25%.

### Modifiers

- -25% Damage taken

### Periodic work

None

### Trigger rules

- None
## Thorn Wound

**ID:** `thorn-wound`

**Classification:** Debuff
**Tags:** Debuff, Dot
**Default duration:** 6 s
**Stacking:** Refresh
**Cleanseable:** Yes
**Dispellable:** No
**Prevents normal actions:** No

Thorns deal physical damage over time.

### Modifiers

- None

### Periodic work

Every 2 s: 3 Physical damage to the status holder

### Trigger rules

- None
## Bleeding

**ID:** `bleeding`

**Classification:** Debuff
**Tags:** Debuff, Dot, Physical
**Default duration:** 8 s
**Stacking:** Refresh
**Cleanseable:** Yes
**Dispellable:** No
**Prevents normal actions:** No

Takes Physical damage over time.

### Modifiers

- None

### Periodic work

Every 2 s: 4 Physical damage to the status holder

### Trigger rules

- None
## Chilled

**ID:** `chilled`

**Classification:** Debuff
**Tags:** Debuff, Control, Water
**Default duration:** 5 s
**Stacking:** Strongest
**Cleanseable:** Yes
**Dispellable:** No
**Prevents normal actions:** No

Basic Attacks and Action cadence are 20% slower.

### Modifiers

- -20% Basic Attack speed
- -20% Action speed

### Periodic work

None

### Trigger rules

- None
## Regeneration

**ID:** `regeneration`

**Classification:** Buff
**Tags:** Buff, Hot, Water
**Default duration:** 6 s
**Stacking:** Refresh
**Cleanseable:** No
**Dispellable:** Yes
**Prevents normal actions:** No

Restores Health over time.

### Modifiers

- None

### Periodic work

Every 1 s: Restore 5 Health to the status holder

### Trigger rules

- None
## Fortified

**ID:** `fortified`

**Classification:** Buff
**Tags:** Buff, Earth
**Default duration:** 8 s
**Stacking:** Strongest
**Cleanseable:** No
**Dispellable:** Yes
**Prevents normal actions:** No

Damage taken is reduced by 15%.

### Modifiers

- -15% Damage taken

### Periodic work

None

### Trigger rules

- None
## Shock

**ID:** `shock`

**Classification:** Debuff
**Tags:** Debuff, Air
**Default duration:** 8 s
**Stacking:** Stacks, up to 5 stacks
**Cleanseable:** Yes
**Dispellable:** No
**Prevents normal actions:** No

Each stack increases Air damage taken by 4%.

### Modifiers

- +4% Damage taken for Air damage per stack

### Periodic work

None

### Trigger rules

- None
## Staggered

**ID:** `staggered`

**Classification:** Debuff
**Tags:** Debuff, Control, Earth
**Default duration:** 1 s
**Stacking:** Refresh
**Cleanseable:** Yes
**Dispellable:** No
**Prevents normal actions:** No

Recently suffered a stagger.

### Modifiers

- None

### Periodic work

None

### Trigger rules

- None
## Vulnerable

**ID:** `vulnerable`

**Classification:** Debuff
**Tags:** Debuff
**Default duration:** 6 s
**Stacking:** Strongest
**Cleanseable:** Yes
**Dispellable:** No
**Prevents normal actions:** No

Damage taken is increased by 15%.

### Modifiers

- +15% Damage taken

### Periodic work

None

### Trigger rules

- None
## Purified

**ID:** `purified`

**Classification:** Buff
**Tags:** Buff, Water
**Default duration:** 4 s
**Stacking:** Refresh
**Cleanseable:** No
**Dispellable:** Yes
**Prevents normal actions:** No

Incoming control and debuff durations are reduced by 50%.

### Modifiers

- -50% Status duration received for Debuff statuses

### Periodic work

None

### Trigger rules

- None
## Stunned

**ID:** `stunned`

**Classification:** Debuff
**Tags:** Debuff, Control
**Default duration:** 3 s
**Stacking:** Refresh
**Cleanseable:** Yes
**Dispellable:** No
**Prevents normal actions:** Yes

Cannot start or resolve normal actions.

### Modifiers

- None

### Periodic work

None

### Trigger rules

- None

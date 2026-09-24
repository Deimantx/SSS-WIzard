# SSS Wizard — Artifact Progression V5
## Baseline Stats + Rank-Based Nodes + Automatic Major Milestones — 50% Node Power Nerf

Šitas dokumentas pakeičia ankstesnį Artifact progression draftą ir įveda svarbiausią naują taisyklę: **kiekvienas Artifact turi Rank 0 baseline stats**, kuriuos playeris gauna iš karto vien užsidėjęs/pasigaminęs Artifactą.

Tikslas: naujas, aukštesnės kartos Artifactas neturi būti baudžiamas vien todėl, kad senajame playeris jau investavo 50 rankų. Naujas Artifactas turi turėti pakankamai aukštą baseline ir didesnį progression ceiling, kad būtų realus equipment upgrade.

### V5 balance change

Šitame passe:

- **Rank 0 baseline stats NENerfinami.**
- **Visi Minor Node skaitiniai bonusai sumažinti 50%.**
- **Visi Major Node skaitiniai bonusai sumažinti 50%.**
- Major signature efektų skaitinė galia taip pat sumažinta maždaug 50%, bet jų triggeriai / cooldown / milestone pointai paliekami tie patys.
- **Cost'ai visiškai nekeičiami.**
- Water Artifactuose **Barrier Power pilnai pakeistas į Healing Done %**.
- Water Major signature efektai taip pat perkelti iš Barrier fantasy į Healing fantasy.

Tikslas: palikti baseline pakankamai stiprų gear replacement sistemai, bet sumažinti ilgalaikio 50/60-rank investment galią, kad Artifact scaling nebūtų per agresyvus.


---

## 1. Locked-in progression rules

- **Minor Nodes = circles.**
- **Major Nodes = squares.**
- Major Nodes niekada neperkami — jie atrakinti automatiškai pagal total invested ranks.
- Kiekvienas Minor Node turi **10 ranks**.
- Kiekvienas kitas rankas yra brangesnis už ankstesnį.
- Kiekvieno ranko bonusas taip pat palaipsniui didėja — nėra +5 / +5 / +5 per visus 10 rankų.
- Kai Artifactas jau atrakintas ir pagamintas per Artificing, **jokių papildomų boss gate progresijai nėra**.
- Act 0 Artifactai šiame drafe turi **5 Minor Nodes = 50 max points = 5 Major Nodes**.
- Act 1 replacement Artifactai turi **6 Minor Nodes = 60 max points = 6 Major Nodes**.
- Major Nodes auto-unlock ties 10 / 20 / 30 / 40 / 50 pointų; Act 1 papildomai Major 6 ties 60 pointų.
- **Rank 0 baseline stats** veikia iš karto ir nereikalauja jokio investment.
- Weapon Artifactai: Artifact Essence + matching Element Fragment + matching Element Resonance.
- Armor/Helmet: Artifact Essence + Prismatic Fragment + multiple Resonances.

### 1.1 Replacement rule

Šiame drafe naudoju tokį principą:

> **Naujos kartos Artifact Rank 0 primary baseline turi būti maždaug lygus arba truputį aukštesnis už ankstesnės kartos pilnai užmaxinto Artifact primary raw statą.**

Tai reiškia, kad playeris, gavęs naują tos pačios šeimos Artifactą, turi priežastį jį apsimauti iš karto, o ne laikyti seną 50/50 vien dėl sunkiai sukaupto investment.

Senas Artifactas vis tiek gali turėti stiprių side bonusų ar specifinę sinergiją, bet naujo Artifacto:
- baseline yra aukštesnis;
- Minor rank ceiling yra didesnis;
- Major rewards yra stipresni;
- Act 1 turi papildomą 6-ą Minor Node ir 6-ą Major milestone.

Tai sąmoningai kuria **gear replacement ladder**, o ne sistemą, kur pirmas Artifactas lieka geriausias amžinai.

---

## 2. Cost profiles

### 2.1 ACT 0 elemental weapon cost — pagal tavo redaguotą Ember Staff

| Rank | Artifact Essence | Matching Element Fragment | Matching Resonance |
|---:|---:|---:|---:|
| 1 | 15 | 50 | 50 |
| 2 | 25 | 80 | 100 |
| 3 | 40 | 120 | 150 |
| 4 | 60 | 170 | 225 |
| 5 | 90 | 240 | 350 |
| 6 | 130 | 330 | 500 |
| 7 | 185 | 450 | 685 |
| 8 | 260 | 600 | 885 |
| 9 | 360 | 800 | 1125 |
| 10 | 500 | 1050 | 1500 |

**1 pilnas Minor Node (10 ranks):** 1665 Artifact Essence / 3890 Fragment / 5570 Resonance.
**5 pilni Minor Nodes:** 8325 Artifact Essence / 19450 Fragment / 27850 Resonance.

> Pastaba: tavo redaguotame Ember faile apačioje buvo likęs senas Resonance total. Pagal tavo naują rank cost lentelę tikras vieno node Resonance total yra **5,570**, ne 1,935.

### 2.2 ACT 0 Prismatic Armor / Helmet cost

Kiekvienas rankas naudoja **du konkrečius Resonance tipus**. Lentelės Resonance skaičius yra **kiekvienam tipui atskirai**.

| Rank | Artifact Essence | Prismatic Fragment | EACH required Resonance |
|---:|---:|---:|---:|
| 1 | 15 | 5 | 35 |
| 2 | 25 | 8 | 70 |
| 3 | 40 | 12 | 105 |
| 4 | 60 | 17 | 160 |
| 5 | 90 | 24 | 250 |
| 6 | 130 | 33 | 360 |
| 7 | 185 | 45 | 500 |
| 8 | 260 | 60 | 650 |
| 9 | 360 | 80 | 825 |
| 10 | 500 | 105 | 1100 |

**1 pilnas Minor Node:** 1665 Artifact Essence / 389 Prismatic Fragment / 4055 EACH of 2 Resonances = 8110 combined Resonance.

### 2.3 ACT 1 elemental weapon cost

| Rank | Artifact Essence | Matching Element Fragment | Matching Resonance |
|---:|---:|---:|---:|
| 1 | 25 | 100 | 100 |
| 2 | 40 | 160 | 200 |
| 3 | 65 | 240 | 300 |
| 4 | 100 | 350 | 450 |
| 5 | 150 | 500 | 700 |
| 6 | 225 | 700 | 1000 |
| 7 | 320 | 950 | 1370 |
| 8 | 450 | 1250 | 1770 |
| 9 | 650 | 1650 | 2250 |
| 10 | 900 | 2200 | 3000 |

**1 pilnas Minor Node:** 2925 Artifact Essence / 8100 Fragment / 11140 Resonance.
**6 pilni Minor Nodes:** 17550 Artifact Essence / 48600 Fragment / 66840 Resonance.

### 2.4 ACT 1 Prismatic Armor / Helmet cost

Convergence Robe ir Waystone Circlet yra cross-element vėlesnės kartos Artifactai, todėl kiekvienas rankas naudoja **Fire + Water + Earth + Air Resonance**.

| Rank | Artifact Essence | Prismatic Fragment | EACH of 4 Resonances |
|---:|---:|---:|---:|
| 1 | 25 | 8 | 30 |
| 2 | 40 | 12 | 60 |
| 3 | 65 | 18 | 90 |
| 4 | 100 | 26 | 140 |
| 5 | 150 | 36 | 220 |
| 6 | 225 | 50 | 320 |
| 7 | 320 | 68 | 440 |
| 8 | 450 | 90 | 570 |
| 9 | 650 | 120 | 725 |
| 10 | 900 | 160 | 950 |

**1 pilnas Minor Node:** 2925 Artifact Essence / 588 Prismatic Fragment / 3545 EACH Resonance = 14180 combined Resonance.

---

## 3. Artifact generation ladder

| Earlier Artifact | Later replacement | Structural upgrade |
|---|---|---|
| Windthread Wand | **Galeshard Staff** | 5→6 Minor Nodes, 50→60 points, stronger baseline + stronger Major milestones |
| Tideglass Wand | **Reliquary Scepter** | 5→6 Minor Nodes, 50→60 points, stronger baseline + stronger Major milestones |
| Ember Staff | **Pyrebound Staff** | 5→6 Minor Nodes, 50→60 points, stronger baseline + stronger Major milestones |
| Stoneheart Scepter | **Rootheart Scepter** | 5→6 Minor Nodes, 50→60 points, stronger baseline + stronger Major milestones |
| Wispweave Robe | **Convergence Robe** | 5→6 Minor Nodes, 50→60 points, stronger baseline + stronger Major milestones |
| Wispveil Hood | **Waystone Circlet** | 5→6 Minor Nodes, 50→60 points, stronger baseline + stronger Major milestones |

---

## 4. Ember Staff — ACT 0 Weapon

**Identity:** Fire / Burning / Direct Fire / Cast tempo  
**Craft / unlock:** Starter Artificing recipe — available immediately.  
**Max investment:** 50 points  

> Tai tavo Ember Staff pavyzdys su tavo pakeistu ramping rank gain ir tavo padidintu Resonance cost. Senajame faile likę cumulative summary skaičiai buvo nesuderinti su naujais per-rank gain, todėl čia totalai perskaičiuojami iš tikrųjų rank gain.

### Rank 0 baseline stats

- **+15 Spell Power**

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Arcane Embers** | Spell Power | 10 |
| 2 | **Lingering Flame** | Burn Duration | 10 |
| 3 | **Feeding Fire** | Burn Damage | 10 |
| 4 | **Flame Impact** | Direct Fire Spell Damage | 10 |
| 5 | **Quickkindle** | Fire Spell Cast Time | 10 |

#### Minor 1 — Arcane Embers

**Stat:** Spell Power  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+1.5** | **+1.5** |
| 2 | **+1.5** | **+3** |
| 3 | **+2** | **+5** |
| 4 | **+2.5** | **+7.5** |
| 5 | **+3** | **+10.5** |
| 6 | **+3.5** | **+14** |
| 7 | **+4** | **+18** |
| 8 | **+5** | **+23** |
| 9 | **+6** | **+29** |
| 10 | **+7.5** | **+36.5** |

**Rank 10 cumulative:** **+73 Spell Power**

#### Minor 2 — Lingering Flame

**Stat:** Burn Duration  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Burn Duration |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1%** | **+2%** |
| 3 | **+1%** | **+3%** |
| 4 | **+1.5%** | **+4.5%** |
| 5 | **+1.5%** | **+6%** |
| 6 | **+1.5%** | **+7.5%** |
| 7 | **+2%** | **+9.5%** |
| 8 | **+2%** | **+11.5%** |
| 9 | **+2.5%** | **+14%** |
| 10 | **+3%** | **+17%** |

**Rank 10 cumulative:** **+34% Burn Duration**

#### Minor 3 — Feeding Fire

**Stat:** Burn Damage  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Burn Damage |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1%** | **+2%** |
| 3 | **+1.5%** | **+3.5%** |
| 4 | **+1.5%** | **+5%** |
| 5 | **+2%** | **+7%** |
| 6 | **+2%** | **+9%** |
| 7 | **+2.5%** | **+11.5%** |
| 8 | **+2.5%** | **+14%** |
| 9 | **+3%** | **+17%** |
| 10 | **+3.5%** | **+20.5%** |

**Rank 10 cumulative:** **+41% Burn Damage**

#### Minor 4 — Flame Impact

**Stat:** Direct Fire Spell Damage  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Direct Fire Spell Damage |
|---:|---:|---:|
| 1 | **+0.5%** | **+0.5%** |
| 2 | **+1%** | **+1.5%** |
| 3 | **+1%** | **+2.5%** |
| 4 | **+1.5%** | **+4%** |
| 5 | **+1.5%** | **+5.5%** |
| 6 | **+2%** | **+7.5%** |
| 7 | **+2.5%** | **+10%** |
| 8 | **+3%** | **+13%** |
| 9 | **+3.5%** | **+16.5%** |
| 10 | **+4%** | **+20.5%** |

**Rank 10 cumulative:** **+41% Direct Fire Spell Damage**

#### Minor 5 — Quickkindle

**Stat:** Fire Spell Cast Time  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Fire Spell Cast Time |
|---:|---:|---:|
| 1 | **-0.125%** | **-0.125%** |
| 2 | **-0.25%** | **-0.375%** |
| 3 | **-0.375%** | **-0.75%** |
| 4 | **-0.5%** | **-1.25%** |
| 5 | **-0.625%** | **-1.875%** |
| 6 | **-0.75%** | **-2.625%** |
| 7 | **-0.875%** | **-3.5%** |
| 8 | **-1%** | **-4.5%** |
| 9 | **-1.25%** | **-5.75%** |
| 10 | **-1.5%** | **-7.25%** |

**Rank 10 cumulative:** **-14.5% Fire Spell Cast Time**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Kindle Sigil** | 10 total points | **+7.5 Spell Power**; **+2.5% Burn Duration** |
| **Heartfire Seal** | 20 total points | **+5% Burn Damage**; **+10 Spell Power** |
| **Furnace Core** | 30 total points | **+12.5 Spell Power**; **+5% Burn Duration** |
| **Blackflame Crest** | 40 total points | **+5% Direct Fire Spell Damage**; **-2.5% Fire Spell Cast Time**; **+15 Spell Power** |
| **Edrin's Inferno** | 50 total points | **+22.5 Spell Power**; **+7.5% Burn Damage**; **+5% Direct Fire Spell Damage** |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+119** |
| Burn Damage | **+33%** |
| Burn Duration | **+24.5%** |
| Direct Fire Spell Damage | **+30.5%** |
| Fire Spell Cast Time | **-9.75%** |

---

## 5. Tideglass Wand — ACT 0 Weapon

**Identity:** Water / Healing / Chill / Mana  
**Craft / unlock:** Starter Artificing recipe — available immediately.  
**Max investment:** 50 points  

### Rank 0 baseline stats

- **+15 Spell Power**
- **+10 Maximum Mana**

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Arcane Current** | Spell Power | 10 |
| 2 | **Deep Reservoir** | Maximum Mana | 10 |
| 3 | **Mending Current** | Healing Done | 10 |
| 4 | **Frosted Surge** | Direct Water Spell Damage | 10 |
| 5 | **Lingering Chill** | Chilled Duration | 10 |

#### Minor 1 — Arcane Current

**Stat:** Spell Power  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+1.5** | **+1.5** |
| 2 | **+1.5** | **+3** |
| 3 | **+2** | **+5** |
| 4 | **+2.5** | **+7.5** |
| 5 | **+3** | **+10.5** |
| 6 | **+3.5** | **+14** |
| 7 | **+4** | **+18** |
| 8 | **+5** | **+23** |
| 9 | **+6** | **+29** |
| 10 | **+7.5** | **+36.5** |

**Rank 10 cumulative:** **+73 Spell Power**

#### Minor 2 — Deep Reservoir

**Stat:** Maximum Mana  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Mana |
|---:|---:|---:|
| 1 | **+1** | **+1** |
| 2 | **+1.5** | **+2.5** |
| 3 | **+2** | **+4.5** |
| 4 | **+2.5** | **+7** |
| 5 | **+3** | **+10** |
| 6 | **+4** | **+14** |
| 7 | **+5** | **+19** |
| 8 | **+6** | **+25** |
| 9 | **+7.5** | **+32.5** |
| 10 | **+10** | **+42.5** |

**Rank 10 cumulative:** **+85 Maximum Mana**

#### Minor 3 — Mending Current

**Stat:** Healing Done  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Healing Done |
|---:|---:|---:|
| 1 | **+0.5%** | **+0.5%** |
| 2 | **+1%** | **+1.5%** |
| 3 | **+1%** | **+2.5%** |
| 4 | **+1.5%** | **+4%** |
| 5 | **+1.5%** | **+5.5%** |
| 6 | **+2%** | **+7.5%** |
| 7 | **+2.5%** | **+10%** |
| 8 | **+3%** | **+13%** |
| 9 | **+3.5%** | **+16.5%** |
| 10 | **+4%** | **+20.5%** |

**Rank 10 cumulative:** **+41% Healing Done**

#### Minor 4 — Frosted Surge

**Stat:** Direct Water Spell Damage  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Direct Water Spell Damage |
|---:|---:|---:|
| 1 | **+0.5%** | **+0.5%** |
| 2 | **+1%** | **+1.5%** |
| 3 | **+1%** | **+2.5%** |
| 4 | **+1.5%** | **+4%** |
| 5 | **+1.5%** | **+5.5%** |
| 6 | **+2%** | **+7.5%** |
| 7 | **+2.5%** | **+10%** |
| 8 | **+3%** | **+13%** |
| 9 | **+3.5%** | **+16.5%** |
| 10 | **+4%** | **+20.5%** |

**Rank 10 cumulative:** **+41% Direct Water Spell Damage**

#### Minor 5 — Lingering Chill

**Stat:** Chilled Duration  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Chilled Duration |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1%** | **+2%** |
| 3 | **+1%** | **+3%** |
| 4 | **+1.5%** | **+4.5%** |
| 5 | **+1.5%** | **+6%** |
| 6 | **+1.5%** | **+7.5%** |
| 7 | **+2%** | **+9.5%** |
| 8 | **+2%** | **+11.5%** |
| 9 | **+2.5%** | **+14%** |
| 10 | **+3%** | **+17%** |

**Rank 10 cumulative:** **+34% Chilled Duration**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Tideglass Sigil** | 10 total points | **+7.5 Spell Power**; **+5 Maximum Mana** |
| **Deepwater Seal** | 20 total points | **+10 Spell Power**; **+5% Healing Done** |
| **Frozen Grace** | 30 total points | **+12.5 Spell Power**; **+5% Chilled Duration** |
| **Abyssal Current** | 40 total points | **+15 Spell Power**; **+5% Direct Water Spell Damage**; **+7.5 Maximum Mana** |
| **Edrin's Tidal Grace** | 50 total points | **+22.5 Spell Power**; **+7.5% Healing Done**; **+5% Direct Water Spell Damage**; **Signature:** The first time each encounter HP falls below 35%, instantly heal 10% Max HP. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+119** |
| Maximum Mana | **+65** |
| Healing Done | **+33%** |
| Direct Water Spell Damage | **+30.5%** |
| Chilled Duration | **+22%** |

**Signature Major effects:**
- **50 points — Edrin's Tidal Grace:** The first time each encounter HP falls below 35%, instantly heal 10% Max HP.

---

## 6. Stoneheart Scepter — ACT 0 Weapon

**Identity:** Earth / Defense / Barrier / Health  
**Craft / unlock:** Starter Artificing recipe — available immediately.  
**Max investment:** 50 points  

### Rank 0 baseline stats

- **+15 Spell Power**
- **+3 Defense**

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Stonebound Arcana** | Spell Power | 10 |
| 2 | **Earthen Force** | Direct Earth Spell Damage | 10 |
| 3 | **Granite Skin** | Defense | 10 |
| 4 | **Living Bulwark** | Barrier Power | 10 |
| 5 | **Rooted Vitality** | Maximum Health | 10 |

#### Minor 1 — Stonebound Arcana

**Stat:** Spell Power  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+1.5** | **+1.5** |
| 2 | **+1.5** | **+3** |
| 3 | **+2** | **+5** |
| 4 | **+2.5** | **+7.5** |
| 5 | **+3** | **+10.5** |
| 6 | **+3.5** | **+14** |
| 7 | **+4** | **+18** |
| 8 | **+5** | **+23** |
| 9 | **+6** | **+29** |
| 10 | **+7.5** | **+36.5** |

**Rank 10 cumulative:** **+73 Spell Power**

#### Minor 2 — Earthen Force

**Stat:** Direct Earth Spell Damage  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Direct Earth Spell Damage |
|---:|---:|---:|
| 1 | **+0.5%** | **+0.5%** |
| 2 | **+1%** | **+1.5%** |
| 3 | **+1%** | **+2.5%** |
| 4 | **+1.5%** | **+4%** |
| 5 | **+1.5%** | **+5.5%** |
| 6 | **+2%** | **+7.5%** |
| 7 | **+2.5%** | **+10%** |
| 8 | **+3%** | **+13%** |
| 9 | **+3.5%** | **+16.5%** |
| 10 | **+4%** | **+20.5%** |

**Rank 10 cumulative:** **+41% Direct Earth Spell Damage**

#### Minor 3 — Granite Skin

**Stat:** Defense  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Defense |
|---:|---:|---:|
| 1 | **+0.5** | **+0.5** |
| 2 | **+0.5** | **+1** |
| 3 | **+0.5** | **+1.5** |
| 4 | **+1** | **+2.5** |
| 5 | **+1** | **+3.5** |
| 6 | **+1.5** | **+5** |
| 7 | **+1.5** | **+6.5** |
| 8 | **+2** | **+8.5** |
| 9 | **+2.5** | **+11** |
| 10 | **+3** | **+14** |

**Rank 10 cumulative:** **+28 Defense**

#### Minor 4 — Living Bulwark

**Stat:** Barrier Power  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Barrier Power |
|---:|---:|---:|
| 1 | **+0.5%** | **+0.5%** |
| 2 | **+1%** | **+1.5%** |
| 3 | **+1%** | **+2.5%** |
| 4 | **+1.5%** | **+4%** |
| 5 | **+1.5%** | **+5.5%** |
| 6 | **+2%** | **+7.5%** |
| 7 | **+2.5%** | **+10%** |
| 8 | **+3%** | **+13%** |
| 9 | **+3.5%** | **+16.5%** |
| 10 | **+4%** | **+20.5%** |

**Rank 10 cumulative:** **+41% Barrier Power**

#### Minor 5 — Rooted Vitality

**Stat:** Maximum Health  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Health |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+2.5** | **+5** |
| 3 | **+4** | **+9** |
| 4 | **+5** | **+14** |
| 5 | **+6** | **+20** |
| 6 | **+7.5** | **+27.5** |
| 7 | **+10** | **+37.5** |
| 8 | **+12.5** | **+50** |
| 9 | **+15** | **+65** |
| 10 | **+20** | **+85** |

**Rank 10 cumulative:** **+170 Maximum Health**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Stone Sigil** | 10 total points | **+7.5 Spell Power**; **+1.5 Defense** |
| **Deepcore Seal** | 20 total points | **+10 Spell Power**; **+15 Maximum Health** |
| **Mountain Heart** | 30 total points | **+12.5 Spell Power**; **+5% Barrier Power** |
| **Colossus Ward** | 40 total points | **+15 Spell Power**; **+5% Direct Earth Spell Damage**; **+2.5 Defense** |
| **Edrin's Worldstone** | 50 total points | **+22.5 Spell Power**; **+7.5% Barrier Power**; **+30 Maximum Health**; **Signature:** While a Barrier is active, take 4% less damage. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+119** |
| Maximum Health | **+130** |
| Defense | **+21** |
| Barrier Power | **+33%** |
| Direct Earth Spell Damage | **+25.5%** |

**Signature Major effects:**
- **50 points — Edrin's Worldstone:** While a Barrier is active, take 4% less damage.

---

## 7. Windthread Wand — ACT 0 Weapon

**Identity:** Air / Critical strikes / Direct damage / Tempo  
**Craft / unlock:** Starter Artificing recipe — available immediately.  
**Max investment:** 50 points  

### Rank 0 baseline stats

- **+15 Spell Power**
- **+1% Spell Critical Chance**

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Arcane Draft** | Spell Power | 10 |
| 2 | **Razorwind** | Direct Air Spell Damage | 10 |
| 3 | **Eye of the Gale** | Spell Critical Chance | 10 |
| 4 | **Storm Edge** | Spell Critical Damage | 10 |
| 5 | **Windstep** | Air Spell Cooldown Time | 10 |

#### Minor 1 — Arcane Draft

**Stat:** Spell Power  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+1.5** | **+1.5** |
| 2 | **+1.5** | **+3** |
| 3 | **+2** | **+5** |
| 4 | **+2.5** | **+7.5** |
| 5 | **+3** | **+10.5** |
| 6 | **+3.5** | **+14** |
| 7 | **+4** | **+18** |
| 8 | **+5** | **+23** |
| 9 | **+6** | **+29** |
| 10 | **+7.5** | **+36.5** |

**Rank 10 cumulative:** **+73 Spell Power**

#### Minor 2 — Razorwind

**Stat:** Direct Air Spell Damage  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Direct Air Spell Damage |
|---:|---:|---:|
| 1 | **+0.5%** | **+0.5%** |
| 2 | **+1%** | **+1.5%** |
| 3 | **+1%** | **+2.5%** |
| 4 | **+1.5%** | **+4%** |
| 5 | **+1.5%** | **+5.5%** |
| 6 | **+2%** | **+7.5%** |
| 7 | **+2.5%** | **+10%** |
| 8 | **+3%** | **+13%** |
| 9 | **+3.5%** | **+16.5%** |
| 10 | **+4%** | **+20.5%** |

**Rank 10 cumulative:** **+41% Direct Air Spell Damage**

#### Minor 3 — Eye of the Gale

**Stat:** Spell Critical Chance  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Critical Chance |
|---:|---:|---:|
| 1 | **+0.125%** | **+0.125%** |
| 2 | **+0.125%** | **+0.25%** |
| 3 | **+0.25%** | **+0.5%** |
| 4 | **+0.25%** | **+0.75%** |
| 5 | **+0.375%** | **+1.125%** |
| 6 | **+0.375%** | **+1.5%** |
| 7 | **+0.5%** | **+2%** |
| 8 | **+0.625%** | **+2.625%** |
| 9 | **+0.75%** | **+3.375%** |
| 10 | **+1%** | **+4.375%** |

**Rank 10 cumulative:** **+8.75% Spell Critical Chance**

#### Minor 4 — Storm Edge

**Stat:** Spell Critical Damage  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Critical Damage |
|---:|---:|---:|
| 1 | **+0.5%** | **+0.5%** |
| 2 | **+0.5%** | **+1%** |
| 3 | **+1%** | **+2%** |
| 4 | **+1%** | **+3%** |
| 5 | **+1.5%** | **+4.5%** |
| 6 | **+1.5%** | **+6%** |
| 7 | **+2%** | **+8%** |
| 8 | **+2.5%** | **+10.5%** |
| 9 | **+3%** | **+13.5%** |
| 10 | **+4%** | **+17.5%** |

**Rank 10 cumulative:** **+35% Spell Critical Damage**

#### Minor 5 — Windstep

**Stat:** Air Spell Cooldown Time  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Air Spell Cooldown Time |
|---:|---:|---:|
| 1 | **-0.125%** | **-0.125%** |
| 2 | **-0.25%** | **-0.375%** |
| 3 | **-0.375%** | **-0.75%** |
| 4 | **-0.5%** | **-1.25%** |
| 5 | **-0.625%** | **-1.875%** |
| 6 | **-0.75%** | **-2.625%** |
| 7 | **-0.875%** | **-3.5%** |
| 8 | **-1%** | **-4.5%** |
| 9 | **-1.25%** | **-5.75%** |
| 10 | **-1.5%** | **-7.25%** |

**Rank 10 cumulative:** **-14.5% Air Spell Cooldown Time**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Gale Sigil** | 10 total points | **+7.5 Spell Power**; **+0.75% Spell Critical Chance** |
| **Storm Focus** | 20 total points | **+10 Spell Power**; **+4% Spell Critical Damage** |
| **Tempest Rhythm** | 30 total points | **+12.5 Spell Power**; **-1.5% Air Spell Cooldown Time** |
| **Skybreaker Crest** | 40 total points | **+15 Spell Power**; **+5% Direct Air Spell Damage**; **+1% Spell Critical Chance** |
| **Edrin's Tempest** | 50 total points | **+22.5 Spell Power**; **+7.5% Direct Air Spell Damage**; **+6% Spell Critical Damage**; **Signature:** Air spell Critical Hits reduce the next Air spell cooldown by an additional 5%. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+119** |
| Direct Air Spell Damage | **+33%** |
| Spell Critical Chance | **+7.125%** |
| Spell Critical Damage | **+27.5%** |
| Air Spell Cooldown Time | **-8.75%** |

**Signature Major effects:**
- **50 points — Edrin's Tempest:** Air spell Critical Hits reduce the next Air spell cooldown by an additional 5%.

---

## 8. Wispweave Robe — ACT 0 Armor

**Identity:** Defense / Barrier / Health / Mana / Elemental resistance  
**Craft / unlock:** Starter Artificing recipe — available immediately.  
**Max investment:** 50 points  

### Rank 0 baseline stats

- **+40 Maximum Health**
- **+4 Defense**

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Spiritwoven Vitality** | Maximum Health — Resonance: Earth + Water | 10 |
| 2 | **Wispguard Weave** | Defense — Resonance: Earth + Fire | 10 |
| 3 | **Arcane Mesh** | Barrier Power — Resonance: Water + Earth | 10 |
| 4 | **Deep Thread** | Maximum Mana — Resonance: Water + Air | 10 |
| 5 | **Elemental Weave** | All Element Resistance — Resonance: Fire + Air | 10 |

#### Minor 1 — Spiritwoven Vitality

**Stat:** Maximum Health  
**Resonance:** Earth Resonance + Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Health |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+2.5** | **+5** |
| 3 | **+4** | **+9** |
| 4 | **+5** | **+14** |
| 5 | **+6** | **+20** |
| 6 | **+7.5** | **+27.5** |
| 7 | **+10** | **+37.5** |
| 8 | **+12.5** | **+50** |
| 9 | **+15** | **+65** |
| 10 | **+20** | **+85** |

**Rank 10 cumulative:** **+170 Maximum Health**

#### Minor 2 — Wispguard Weave

**Stat:** Defense  
**Resonance:** Earth Resonance + Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Defense |
|---:|---:|---:|
| 1 | **+0.5** | **+0.5** |
| 2 | **+0.5** | **+1** |
| 3 | **+0.5** | **+1.5** |
| 4 | **+1** | **+2.5** |
| 5 | **+1** | **+3.5** |
| 6 | **+1.5** | **+5** |
| 7 | **+1.5** | **+6.5** |
| 8 | **+2** | **+8.5** |
| 9 | **+2.5** | **+11** |
| 10 | **+3** | **+14** |

**Rank 10 cumulative:** **+28 Defense**

#### Minor 3 — Arcane Mesh

**Stat:** Barrier Power  
**Resonance:** Water Resonance + Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Barrier Power |
|---:|---:|---:|
| 1 | **+0.5%** | **+0.5%** |
| 2 | **+1%** | **+1.5%** |
| 3 | **+1%** | **+2.5%** |
| 4 | **+1.5%** | **+4%** |
| 5 | **+1.5%** | **+5.5%** |
| 6 | **+2%** | **+7.5%** |
| 7 | **+2.5%** | **+10%** |
| 8 | **+3%** | **+13%** |
| 9 | **+3.5%** | **+16.5%** |
| 10 | **+4%** | **+20.5%** |

**Rank 10 cumulative:** **+41% Barrier Power**

#### Minor 4 — Deep Thread

**Stat:** Maximum Mana  
**Resonance:** Water Resonance + Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Mana |
|---:|---:|---:|
| 1 | **+1** | **+1** |
| 2 | **+1.5** | **+2.5** |
| 3 | **+2** | **+4.5** |
| 4 | **+2.5** | **+7** |
| 5 | **+3** | **+10** |
| 6 | **+4** | **+14** |
| 7 | **+5** | **+19** |
| 8 | **+6** | **+25** |
| 9 | **+7.5** | **+32.5** |
| 10 | **+10** | **+42.5** |

**Rank 10 cumulative:** **+85 Maximum Mana**

#### Minor 5 — Elemental Weave

**Stat:** All Element Resistance  
**Resonance:** Fire Resonance + Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative All Element Resistance |
|---:|---:|---:|
| 1 | **+0.125%** | **+0.125%** |
| 2 | **+0.125%** | **+0.25%** |
| 3 | **+0.25%** | **+0.5%** |
| 4 | **+0.25%** | **+0.75%** |
| 5 | **+0.375%** | **+1.125%** |
| 6 | **+0.375%** | **+1.5%** |
| 7 | **+0.5%** | **+2%** |
| 8 | **+0.5%** | **+2.5%** |
| 9 | **+0.625%** | **+3.125%** |
| 10 | **+0.75%** | **+3.875%** |

**Rank 10 cumulative:** **+7.75% All Element Resistance**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Wisp Knot** | 10 total points | **+20 Maximum Health**; **+1.5 Defense** |
| **Spirit Mantle** | 20 total points | **+30 Maximum Health**; **+5% Barrier Power** |
| **Arcane Loom** | 30 total points | **+40 Maximum Health**; **+10 Maximum Mana** |
| **Deathless Weave** | 40 total points | **+50 Maximum Health**; **+2.5 Defense**; **+1.5% All Element Resistance** |
| **Edrin's Ghostweave** | 50 total points | **+75 Maximum Health**; **+4 Defense**; **+7.5% Barrier Power**; **Signature:** Once per encounter, lethal damage instead leaves the player at 1 HP and grants a Barrier equal to 10% Max HP. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Maximum Health | **+340** |
| Defense | **+26** |
| Maximum Mana | **+52.5** |
| Barrier Power | **+33%** |
| All Element Resistance | **+5.375%** |

**Signature Major effects:**
- **50 points — Edrin's Ghostweave:** Once per encounter, lethal damage instead leaves the player at 1 HP and grants a Barrier equal to 10% Max HP.

---

## 9. Wispveil Hood — ACT 0 Helmet

**Identity:** Spell / Mana / Crit / Status / Tempo  
**Craft / unlock:** Starter Artificing recipe — available immediately.  
**Max investment:** 50 points  

### Rank 0 baseline stats

- **+15 Spell Power**
- **+10 Maximum Mana**

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Veiled Intellect** | Spell Power — Resonance: Fire + Air | 10 |
| 2 | **Spirit Reservoir** | Maximum Mana — Resonance: Water + Air | 10 |
| 3 | **Arcane Precision** | Spell Critical Chance — Resonance: Fire + Air | 10 |
| 4 | **Veil Tempo** | Spell Cooldown Time — Resonance: Air + Water | 10 |
| 5 | **Wisp Clarity** | Spell Status Duration — Resonance: Water + Earth | 10 |

#### Minor 1 — Veiled Intellect

**Stat:** Spell Power  
**Resonance:** Fire Resonance + Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+1.5** | **+1.5** |
| 2 | **+1.5** | **+3** |
| 3 | **+2** | **+5** |
| 4 | **+2.5** | **+7.5** |
| 5 | **+3** | **+10.5** |
| 6 | **+3.5** | **+14** |
| 7 | **+4** | **+18** |
| 8 | **+5** | **+23** |
| 9 | **+6** | **+29** |
| 10 | **+7.5** | **+36.5** |

**Rank 10 cumulative:** **+73 Spell Power**

#### Minor 2 — Spirit Reservoir

**Stat:** Maximum Mana  
**Resonance:** Water Resonance + Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Mana |
|---:|---:|---:|
| 1 | **+1** | **+1** |
| 2 | **+1.5** | **+2.5** |
| 3 | **+2** | **+4.5** |
| 4 | **+2.5** | **+7** |
| 5 | **+3** | **+10** |
| 6 | **+4** | **+14** |
| 7 | **+5** | **+19** |
| 8 | **+6** | **+25** |
| 9 | **+7.5** | **+32.5** |
| 10 | **+10** | **+42.5** |

**Rank 10 cumulative:** **+85 Maximum Mana**

#### Minor 3 — Arcane Precision

**Stat:** Spell Critical Chance  
**Resonance:** Fire Resonance + Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Critical Chance |
|---:|---:|---:|
| 1 | **+0.125%** | **+0.125%** |
| 2 | **+0.125%** | **+0.25%** |
| 3 | **+0.25%** | **+0.5%** |
| 4 | **+0.25%** | **+0.75%** |
| 5 | **+0.375%** | **+1.125%** |
| 6 | **+0.375%** | **+1.5%** |
| 7 | **+0.5%** | **+2%** |
| 8 | **+0.625%** | **+2.625%** |
| 9 | **+0.75%** | **+3.375%** |
| 10 | **+1%** | **+4.375%** |

**Rank 10 cumulative:** **+8.75% Spell Critical Chance**

#### Minor 4 — Veil Tempo

**Stat:** Spell Cooldown Time  
**Resonance:** Air Resonance + Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Cooldown Time |
|---:|---:|---:|
| 1 | **-0.125%** | **-0.125%** |
| 2 | **-0.25%** | **-0.375%** |
| 3 | **-0.375%** | **-0.75%** |
| 4 | **-0.5%** | **-1.25%** |
| 5 | **-0.625%** | **-1.875%** |
| 6 | **-0.75%** | **-2.625%** |
| 7 | **-0.875%** | **-3.5%** |
| 8 | **-1%** | **-4.5%** |
| 9 | **-1.25%** | **-5.75%** |
| 10 | **-1.5%** | **-7.25%** |

**Rank 10 cumulative:** **-14.5% Spell Cooldown Time**

#### Minor 5 — Wisp Clarity

**Stat:** Spell Status Duration  
**Resonance:** Water Resonance + Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Status Duration |
|---:|---:|---:|
| 1 | **+0.5%** | **+0.5%** |
| 2 | **+0.5%** | **+1%** |
| 3 | **+1%** | **+2%** |
| 4 | **+1%** | **+3%** |
| 5 | **+1.5%** | **+4.5%** |
| 6 | **+1.5%** | **+6%** |
| 7 | **+2%** | **+8%** |
| 8 | **+2%** | **+10%** |
| 9 | **+2.5%** | **+12.5%** |
| 10 | **+3%** | **+15.5%** |

**Rank 10 cumulative:** **+31% Spell Status Duration**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Wispmark** | 10 total points | **+7.5 Spell Power**; **+5 Maximum Mana** |
| **Thought Veil** | 20 total points | **+10 Spell Power**; **+0.75% Spell Critical Chance** |
| **Arcane Sight** | 30 total points | **+12.5 Spell Power**; **+2.5% Spell Status Duration** |
| **Phantom Tempo** | 40 total points | **+15 Spell Power**; **-1.5% Spell Cooldown Time**; **+7.5 Maximum Mana** |
| **Edrin's Veil** | 50 total points | **+22.5 Spell Power**; **+1% Spell Critical Chance**; **+4% Spell Status Duration**; **Signature:** The first spell cast after 5 seconds without casting has 10% increased damage. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+119** |
| Maximum Mana | **+65** |
| Spell Critical Chance | **+6.125%** |
| Spell Cooldown Time | **-8.75%** |
| Spell Status Duration | **+22%** |

**Signature Major effects:**
- **50 points — Edrin's Veil:** The first spell cast after 5 seconds without casting has 10% increased damage.

---

## 10. Galeshard Staff — ACT 1 Weapon

**Identity:** Advanced Air / Critical strikes / High tempo / Burst  
**Craft / unlock:** Current content unlock: Corrupted Elemental Gatekeeper → craft through Artificing. After crafting, rank progression has NO boss gate.  
**Replaces:** Windthread Wand  
**Max investment:** 60 points  

### Rank 0 baseline stats

- **+245 Spell Power**
- **+4% Spell Critical Chance**

**Replacement check:** Windthread Wand fully maxed po V5 nerfo raw **Spell Power ≈ 119**, o Galeshard Staff gauna **245 Spell Power jau Rank 0**.

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Fractured Arcana** | Spell Power | 10 |
| 2 | **Razorstorm** | Direct Air Spell Damage | 10 |
| 3 | **Storm Eye** | Spell Critical Chance | 10 |
| 4 | **Shatter Edge** | Spell Critical Damage | 10 |
| 5 | **Gale Tempo** | Air Spell Cooldown Time | 10 |
| 6 | **Pressure Break** | Air Resistance Ignored | 10 |

#### Minor 1 — Fractured Arcana

**Stat:** Spell Power  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+3** | **+5.5** |
| 3 | **+3.5** | **+9** |
| 4 | **+4** | **+13** |
| 5 | **+5** | **+18** |
| 6 | **+6** | **+24** |
| 7 | **+7.5** | **+31.5** |
| 8 | **+9** | **+40.5** |
| 9 | **+11** | **+51.5** |
| 10 | **+14** | **+65.5** |

**Rank 10 cumulative:** **+131 Spell Power**

#### Minor 2 — Razorstorm

**Stat:** Direct Air Spell Damage  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Direct Air Spell Damage |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2.5%** | **+8.5%** |
| 6 | **+3%** | **+11.5%** |
| 7 | **+3.5%** | **+15%** |
| 8 | **+4.5%** | **+19.5%** |
| 9 | **+5.5%** | **+25%** |
| 10 | **+7%** | **+32%** |

**Rank 10 cumulative:** **+64% Direct Air Spell Damage**

#### Minor 3 — Storm Eye

**Stat:** Spell Critical Chance  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Critical Chance |
|---:|---:|---:|
| 1 | **+0.25%** | **+0.25%** |
| 2 | **+0.25%** | **+0.5%** |
| 3 | **+0.375%** | **+0.875%** |
| 4 | **+0.375%** | **+1.25%** |
| 5 | **+0.5%** | **+1.75%** |
| 6 | **+0.625%** | **+2.375%** |
| 7 | **+0.75%** | **+3.125%** |
| 8 | **+0.875%** | **+4%** |
| 9 | **+1.125%** | **+5.125%** |
| 10 | **+1.5%** | **+6.625%** |

**Rank 10 cumulative:** **+13.25% Spell Critical Chance**

#### Minor 4 — Shatter Edge

**Stat:** Spell Critical Damage  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Critical Damage |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1%** | **+2%** |
| 3 | **+1.5%** | **+3.5%** |
| 4 | **+1.5%** | **+5%** |
| 5 | **+2%** | **+7%** |
| 6 | **+2.5%** | **+9.5%** |
| 7 | **+3%** | **+12.5%** |
| 8 | **+3.5%** | **+16%** |
| 9 | **+4%** | **+20%** |
| 10 | **+5%** | **+25%** |

**Rank 10 cumulative:** **+50% Spell Critical Damage**

#### Minor 5 — Gale Tempo

**Stat:** Air Spell Cooldown Time  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Air Spell Cooldown Time |
|---:|---:|---:|
| 1 | **-0.25%** | **-0.25%** |
| 2 | **-0.375%** | **-0.625%** |
| 3 | **-0.5%** | **-1.125%** |
| 4 | **-0.625%** | **-1.75%** |
| 5 | **-0.75%** | **-2.5%** |
| 6 | **-0.875%** | **-3.375%** |
| 7 | **-1%** | **-4.375%** |
| 8 | **-1.25%** | **-5.625%** |
| 9 | **-1.5%** | **-7.125%** |
| 10 | **-2%** | **-9.125%** |

**Rank 10 cumulative:** **-18.25% Air Spell Cooldown Time**

#### Minor 6 — Pressure Break

**Stat:** Air Resistance Ignored  
**Resonance:** Air Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Air Resistance Ignored |
|---:|---:|---:|
| 1 | **+0.25%** | **+0.25%** |
| 2 | **+0.25%** | **+0.5%** |
| 3 | **+0.375%** | **+0.875%** |
| 4 | **+0.375%** | **+1.25%** |
| 5 | **+0.5%** | **+1.75%** |
| 6 | **+0.625%** | **+2.375%** |
| 7 | **+0.75%** | **+3.125%** |
| 8 | **+1%** | **+4.125%** |
| 9 | **+1.25%** | **+5.375%** |
| 10 | **+1.5%** | **+6.875%** |

**Rank 10 cumulative:** **+13.75% Air Resistance Ignored**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Gatewind Sigil** | 10 total points | **+15 Spell Power**; **+1% Spell Critical Chance** |
| **Shardstorm Seal** | 20 total points | **+20 Spell Power**; **+5% Spell Critical Damage** |
| **Tempest Core** | 30 total points | **+27.5 Spell Power**; **-2.5% Air Spell Cooldown Time** |
| **Meridian Break** | 40 total points | **+35 Spell Power**; **+7.5% Direct Air Spell Damage**; **+2.5% Air Resistance Ignored** |
| **Skyfracture Crown** | 50 total points | **+45 Spell Power**; **+2% Spell Critical Chance**; **+7.5% Spell Critical Damage**; **Signature:** Air Critical Hits deal an additional 7.5% of the hit as Air damage. |
| **Eye of the Gale** | 60 total points | **+60 Spell Power**; **+10% Direct Air Spell Damage**; **-3.75% Air Spell Cooldown Time**; **+5% Air Resistance Ignored**; **Signature:** Every 5th Air spell is cast again at 20% effectiveness without additional Mana cost. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+513** |
| Direct Air Spell Damage | **+49.5%** |
| Spell Critical Chance | **+13.625%** |
| Spell Critical Damage | **+37.5%** |
| Air Spell Cooldown Time | **-15.375%** |
| Air Resistance Ignored | **+14.375%** |

**Signature Major effects:**
- **50 points — Skyfracture Crown:** Air Critical Hits deal an additional 7.5% of the hit as Air damage.
- **60 points — Eye of the Gale:** Every 5th Air spell is cast again at 20% effectiveness without additional Mana cost.

---

## 11. Reliquary Scepter — ACT 1 Weapon

**Identity:** Advanced Water / Healing / Chill / Mana / Control  
**Craft / unlock:** Current content unlock: Drowned Keeper → craft through Artificing. After crafting, rank progression has NO boss gate.  
**Replaces:** Tideglass Wand  
**Max investment:** 60 points  

### Rank 0 baseline stats

- **+235 Spell Power**
- **+60 Maximum Mana**
- **+10% Healing Done**

**Replacement check:** Tideglass Wand fully maxed po V5 nerfo raw **Spell Power ≈ 119**, o Reliquary Scepter gauna **235 Spell Power jau Rank 0**.

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Drowned Arcana** | Spell Power | 10 |
| 2 | **Reliquary Current** | Direct Water Spell Damage | 10 |
| 3 | **Drowned Grace** | Healing Done | 10 |
| 4 | **Deep Reservoir** | Maximum Mana | 10 |
| 5 | **Frozen Memory** | Chilled Duration | 10 |
| 6 | **Cold Tempo** | Water Spell Cast Time | 10 |

#### Minor 1 — Drowned Arcana

**Stat:** Spell Power  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+3** | **+5.5** |
| 3 | **+3.5** | **+9** |
| 4 | **+4** | **+13** |
| 5 | **+5** | **+18** |
| 6 | **+6** | **+24** |
| 7 | **+7.5** | **+31.5** |
| 8 | **+9** | **+40.5** |
| 9 | **+11** | **+51.5** |
| 10 | **+14** | **+65.5** |

**Rank 10 cumulative:** **+131 Spell Power**

#### Minor 2 — Reliquary Current

**Stat:** Direct Water Spell Damage  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Direct Water Spell Damage |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2.5%** | **+8.5%** |
| 6 | **+3%** | **+11.5%** |
| 7 | **+3.5%** | **+15%** |
| 8 | **+4.5%** | **+19.5%** |
| 9 | **+5.5%** | **+25%** |
| 10 | **+7%** | **+32%** |

**Rank 10 cumulative:** **+64% Direct Water Spell Damage**

#### Minor 3 — Drowned Grace

**Stat:** Healing Done  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Healing Done |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2.5%** | **+8.5%** |
| 6 | **+3%** | **+11.5%** |
| 7 | **+3.5%** | **+15%** |
| 8 | **+4.5%** | **+19.5%** |
| 9 | **+5.5%** | **+25%** |
| 10 | **+7%** | **+32%** |

**Rank 10 cumulative:** **+64% Healing Done**

#### Minor 4 — Deep Reservoir

**Stat:** Maximum Mana  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Mana |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+3** | **+5.5** |
| 3 | **+4** | **+9.5** |
| 4 | **+5** | **+14.5** |
| 5 | **+6** | **+20.5** |
| 6 | **+7.5** | **+28** |
| 7 | **+10** | **+38** |
| 8 | **+12.5** | **+50.5** |
| 9 | **+15** | **+65.5** |
| 10 | **+20** | **+85.5** |

**Rank 10 cumulative:** **+171 Maximum Mana**

#### Minor 5 — Frozen Memory

**Stat:** Chilled Duration  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Chilled Duration |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2%** | **+8%** |
| 6 | **+2.5%** | **+10.5%** |
| 7 | **+3%** | **+13.5%** |
| 8 | **+3.5%** | **+17%** |
| 9 | **+4%** | **+21%** |
| 10 | **+5%** | **+26%** |

**Rank 10 cumulative:** **+52% Chilled Duration**

#### Minor 6 — Cold Tempo

**Stat:** Water Spell Cast Time  
**Resonance:** Water Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Water Spell Cast Time |
|---:|---:|---:|
| 1 | **-0.25%** | **-0.25%** |
| 2 | **-0.375%** | **-0.625%** |
| 3 | **-0.5%** | **-1.125%** |
| 4 | **-0.625%** | **-1.75%** |
| 5 | **-0.75%** | **-2.5%** |
| 6 | **-0.875%** | **-3.375%** |
| 7 | **-1%** | **-4.375%** |
| 8 | **-1.25%** | **-5.625%** |
| 9 | **-1.5%** | **-7.125%** |
| 10 | **-2%** | **-9.125%** |

**Rank 10 cumulative:** **-18.25% Water Spell Cast Time**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Drowned Sigil** | 10 total points | **+15 Spell Power**; **+10 Maximum Mana** |
| **Reliquary Seal** | 20 total points | **+20 Spell Power**; **+6% Healing Done** |
| **Undertow Grace** | 30 total points | **+27.5 Spell Power**; **+6% Chilled Duration** |
| **Abyssal Reliquary** | 40 total points | **+35 Spell Power**; **+7.5% Direct Water Spell Damage**; **+15 Maximum Mana** |
| **Frozen Benediction** | 50 total points | **+45 Spell Power**; **+9% Healing Done**; **-2.5% Water Spell Cast Time**; **Signature:** After you heal, your next Water spell deals 10% increased Direct damage. |
| **Crown of the Deep** | 60 total points | **+60 Spell Power**; **+12.5% Healing Done**; **+30 Maximum Mana**; **+10% Direct Water Spell Damage**; **Signature:** The first time each encounter HP falls below 35%, instantly heal 15% Max HP and restore 7.5% Max Mana. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+503** |
| Maximum Mana | **+200.5** |
| Healing Done | **+69.5%** |
| Direct Water Spell Damage | **+49.5%** |
| Chilled Duration | **+32%** |
| Water Spell Cast Time | **-11.625%** |

**Signature Major effects:**
- **50 points — Frozen Benediction:** After you heal, your next Water spell deals 10% increased Direct damage.
- **60 points — Crown of the Deep:** The first time each encounter HP falls below 35%, instantly heal 15% Max HP and restore 7.5% Max Mana.

---

## 12. Pyrebound Staff — ACT 1 Weapon

**Identity:** Advanced Fire / Heavy Burning / Ash / Detonation  
**Craft / unlock:** Current content unlock: Flamebound Revenant → craft through Artificing. After crafting, rank progression has NO boss gate.  
**Replaces:** Ember Staff  
**Max investment:** 60 points  

### Rank 0 baseline stats

- **+240 Spell Power**
- **+10% Burn Damage**

**Replacement check:** Ember Staff fully maxed po V5 nerfo raw **Spell Power ≈ 119**, o Pyrebound Staff gauna **240 Spell Power jau Rank 0**.

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Pyre Arcana** | Spell Power | 10 |
| 2 | **Bound Flame** | Burn Damage | 10 |
| 3 | **Ashen Memory** | Burn Duration | 10 |
| 4 | **Watchfire Impact** | Direct Fire Spell Damage | 10 |
| 5 | **Cinder Tempo** | Fire Spell Cast Time | 10 |
| 6 | **Scorching Depth** | Fire Resistance Ignored | 10 |

#### Minor 1 — Pyre Arcana

**Stat:** Spell Power  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+3** | **+5.5** |
| 3 | **+3.5** | **+9** |
| 4 | **+4** | **+13** |
| 5 | **+5** | **+18** |
| 6 | **+6** | **+24** |
| 7 | **+7.5** | **+31.5** |
| 8 | **+9** | **+40.5** |
| 9 | **+11** | **+51.5** |
| 10 | **+14** | **+65.5** |

**Rank 10 cumulative:** **+131 Spell Power**

#### Minor 2 — Bound Flame

**Stat:** Burn Damage  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Burn Damage |
|---:|---:|---:|
| 1 | **+1.5%** | **+1.5%** |
| 2 | **+1.5%** | **+3%** |
| 3 | **+2%** | **+5%** |
| 4 | **+2%** | **+7%** |
| 5 | **+2.5%** | **+9.5%** |
| 6 | **+3%** | **+12.5%** |
| 7 | **+3.5%** | **+16%** |
| 8 | **+4%** | **+20%** |
| 9 | **+5%** | **+25%** |
| 10 | **+6.5%** | **+31.5%** |

**Rank 10 cumulative:** **+63% Burn Damage**

#### Minor 3 — Ashen Memory

**Stat:** Burn Duration  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Burn Duration |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2%** | **+8%** |
| 6 | **+2.5%** | **+10.5%** |
| 7 | **+3%** | **+13.5%** |
| 8 | **+3.5%** | **+17%** |
| 9 | **+4%** | **+21%** |
| 10 | **+5%** | **+26%** |

**Rank 10 cumulative:** **+52% Burn Duration**

#### Minor 4 — Watchfire Impact

**Stat:** Direct Fire Spell Damage  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Direct Fire Spell Damage |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2.5%** | **+8.5%** |
| 6 | **+3%** | **+11.5%** |
| 7 | **+3.5%** | **+15%** |
| 8 | **+4.5%** | **+19.5%** |
| 9 | **+5.5%** | **+25%** |
| 10 | **+7%** | **+32%** |

**Rank 10 cumulative:** **+64% Direct Fire Spell Damage**

#### Minor 5 — Cinder Tempo

**Stat:** Fire Spell Cast Time  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Fire Spell Cast Time |
|---:|---:|---:|
| 1 | **-0.25%** | **-0.25%** |
| 2 | **-0.375%** | **-0.625%** |
| 3 | **-0.5%** | **-1.125%** |
| 4 | **-0.625%** | **-1.75%** |
| 5 | **-0.75%** | **-2.5%** |
| 6 | **-0.875%** | **-3.375%** |
| 7 | **-1%** | **-4.375%** |
| 8 | **-1.25%** | **-5.625%** |
| 9 | **-1.5%** | **-7.125%** |
| 10 | **-2%** | **-9.125%** |

**Rank 10 cumulative:** **-18.25% Fire Spell Cast Time**

#### Minor 6 — Scorching Depth

**Stat:** Fire Resistance Ignored  
**Resonance:** Fire Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Fire Resistance Ignored |
|---:|---:|---:|
| 1 | **+0.25%** | **+0.25%** |
| 2 | **+0.25%** | **+0.5%** |
| 3 | **+0.375%** | **+0.875%** |
| 4 | **+0.375%** | **+1.25%** |
| 5 | **+0.5%** | **+1.75%** |
| 6 | **+0.625%** | **+2.375%** |
| 7 | **+0.75%** | **+3.125%** |
| 8 | **+1%** | **+4.125%** |
| 9 | **+1.25%** | **+5.375%** |
| 10 | **+1.5%** | **+6.875%** |

**Rank 10 cumulative:** **+13.75% Fire Resistance Ignored**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Watchfire Sigil** | 10 total points | **+15 Spell Power**; **+6% Burn Damage** |
| **Pyre Seal** | 20 total points | **+20 Spell Power**; **+6% Burn Duration** |
| **Ashen Furnace** | 30 total points | **+27.5 Spell Power**; **+9% Burn Damage** |
| **Revenant Flame** | 40 total points | **+35 Spell Power**; **+7.5% Direct Fire Spell Damage**; **+2.5% Fire Resistance Ignored** |
| **Black Pyre** | 50 total points | **+45 Spell Power**; **+11% Burn Damage**; **-2.5% Fire Spell Cast Time**; **Signature:** Refreshing Burning immediately deals 7.5% of the target's remaining Burning damage. |
| **Pyrebound Inferno** | 60 total points | **+60 Spell Power**; **+15% Burn Damage**; **+10% Direct Fire Spell Damage**; **+5% Fire Resistance Ignored**; **Signature:** Refreshing Burning immediately deals 12.5% of remaining Burning damage instead of 7.5%. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+508** |
| Burn Damage | **+82.5%** |
| Burn Duration | **+32%** |
| Direct Fire Spell Damage | **+49.5%** |
| Fire Spell Cast Time | **-11.625%** |
| Fire Resistance Ignored | **+14.375%** |

**Signature Major effects:**
- **50 points — Black Pyre:** Refreshing Burning immediately deals 7.5% of the target's remaining Burning damage.
- **60 points — Pyrebound Inferno:** Refreshing Burning immediately deals 12.5% of remaining Burning damage instead of 7.5%.

---

## 13. Rootheart Scepter — ACT 1 Weapon

**Identity:** Advanced Earth / Heavy defense / Barrier / Vitality  
**Craft / unlock:** Current content unlock: Rootscar Ancient → craft through Artificing. After crafting, rank progression has NO boss gate.  
**Replaces:** Stoneheart Scepter  
**Max investment:** 60 points  

### Rank 0 baseline stats

- **+230 Spell Power**
- **+50 Defense**
- **+150 Maximum Health**
- **+10% Barrier Power**

**Replacement check:** Stoneheart Scepter fully maxed po V5 nerfo raw **Spell Power ≈ 119**, o Rootheart Scepter gauna **230 Spell Power jau Rank 0**.

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Rooted Arcana** | Spell Power | 10 |
| 2 | **Earthen Pulse** | Direct Earth Spell Damage | 10 |
| 3 | **Barkbound Guard** | Defense | 10 |
| 4 | **Root Ward** | Barrier Power | 10 |
| 5 | **Ancient Vitality** | Maximum Health | 10 |
| 6 | **Stonebound Endurance** | Damage Reduction | 10 |

#### Minor 1 — Rooted Arcana

**Stat:** Spell Power  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+3** | **+5.5** |
| 3 | **+3.5** | **+9** |
| 4 | **+4** | **+13** |
| 5 | **+5** | **+18** |
| 6 | **+6** | **+24** |
| 7 | **+7.5** | **+31.5** |
| 8 | **+9** | **+40.5** |
| 9 | **+11** | **+51.5** |
| 10 | **+14** | **+65.5** |

**Rank 10 cumulative:** **+131 Spell Power**

#### Minor 2 — Earthen Pulse

**Stat:** Direct Earth Spell Damage  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Direct Earth Spell Damage |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2.5%** | **+8.5%** |
| 6 | **+3%** | **+11.5%** |
| 7 | **+3.5%** | **+15%** |
| 8 | **+4.5%** | **+19.5%** |
| 9 | **+5.5%** | **+25%** |
| 10 | **+7%** | **+32%** |

**Rank 10 cumulative:** **+64% Direct Earth Spell Damage**

#### Minor 3 — Barkbound Guard

**Stat:** Defense  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Defense |
|---:|---:|---:|
| 1 | **+1** | **+1** |
| 2 | **+1** | **+2** |
| 3 | **+1.5** | **+3.5** |
| 4 | **+1.5** | **+5** |
| 5 | **+2** | **+7** |
| 6 | **+2.5** | **+9.5** |
| 7 | **+3** | **+12.5** |
| 8 | **+4** | **+16.5** |
| 9 | **+5** | **+21.5** |
| 10 | **+6** | **+27.5** |

**Rank 10 cumulative:** **+55 Defense**

#### Minor 4 — Root Ward

**Stat:** Barrier Power  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Barrier Power |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2.5%** | **+8.5%** |
| 6 | **+3%** | **+11.5%** |
| 7 | **+3.5%** | **+15%** |
| 8 | **+4.5%** | **+19.5%** |
| 9 | **+5.5%** | **+25%** |
| 10 | **+7%** | **+32%** |

**Rank 10 cumulative:** **+64% Barrier Power**

#### Minor 5 — Ancient Vitality

**Stat:** Maximum Health  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Health |
|---:|---:|---:|
| 1 | **+5** | **+5** |
| 2 | **+6** | **+11** |
| 3 | **+7.5** | **+18.5** |
| 4 | **+10** | **+28.5** |
| 5 | **+12.5** | **+41** |
| 6 | **+17.5** | **+58.5** |
| 7 | **+22.5** | **+81** |
| 8 | **+30** | **+111** |
| 9 | **+40** | **+151** |
| 10 | **+55** | **+206** |

**Rank 10 cumulative:** **+412 Maximum Health**

#### Minor 6 — Stonebound Endurance

**Stat:** Damage Reduction  
**Resonance:** Earth Resonance  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Damage Reduction |
|---:|---:|---:|
| 1 | **+0.125%** | **+0.125%** |
| 2 | **+0.125%** | **+0.25%** |
| 3 | **+0.25%** | **+0.5%** |
| 4 | **+0.25%** | **+0.75%** |
| 5 | **+0.375%** | **+1.125%** |
| 6 | **+0.375%** | **+1.5%** |
| 7 | **+0.5%** | **+2%** |
| 8 | **+0.625%** | **+2.625%** |
| 9 | **+0.75%** | **+3.375%** |
| 10 | **+1%** | **+4.375%** |

**Rank 10 cumulative:** **+8.75% Damage Reduction**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Root Sigil** | 10 total points | **+15 Spell Power**; **+4 Defense** |
| **Deepwood Seal** | 20 total points | **+20 Spell Power**; **+37.5 Maximum Health** |
| **Ancient Core** | 30 total points | **+27.5 Spell Power**; **+6% Barrier Power** |
| **Hollow Guardian** | 40 total points | **+35 Spell Power**; **+7.5% Direct Earth Spell Damage**; **+6 Defense** |
| **Living Bastion** | 50 total points | **+45 Spell Power**; **+62.5 Maximum Health**; **+2.5% Damage Reduction**; **Signature:** While above 70% HP, Barrier Power is increased by an additional 10%. |
| **Rootheart Colossus** | 60 total points | **+60 Spell Power**; **+12.5% Barrier Power**; **+100 Maximum Health**; **+4% Damage Reduction**; **Signature:** When a Barrier breaks, gain a new Barrier equal to 7.5% Max HP. 12s cooldown. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+498** |
| Maximum Health | **+556** |
| Defense | **+87.5** |
| Barrier Power | **+60.5%** |
| Direct Earth Spell Damage | **+39.5%** |
| Damage Reduction | **+10.875%** |

**Signature Major effects:**
- **50 points — Living Bastion:** While above 70% HP, Barrier Power is increased by an additional 10%.
- **60 points — Rootheart Colossus:** When a Barrier breaks, gain a new Barrier equal to 7.5% Max HP. 12s cooldown.

---

## 14. Convergence Robe — ACT 1 Armor

**Identity:** Advanced armor / Health / Defense / Barrier / Four-element mitigation  
**Craft / unlock:** Current content unlock: Crossroads Keeper → craft through Artificing. After crafting, rank progression has NO boss gate.  
**Replaces:** Wispweave Robe  
**Max investment:** 60 points  

### Rank 0 baseline stats

- **+700 Maximum Health**
- **+60 Defense**
- **+5% All Element Resistance**

**Replacement check:** Wispweave Robe fully maxed po V5 nerfo raw **Maximum Health ≈ 340**, o Convergence Robe gauna **700 Maximum Health jau Rank 0**.

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Convergent Vitality** | Maximum Health | 10 |
| 2 | **Crossroad Weave** | Defense | 10 |
| 3 | **Meridian Barrier** | Barrier Power | 10 |
| 4 | **Convergence Reserve** | Maximum Mana | 10 |
| 5 | **Fourfold Ward** | All Element Resistance | 10 |
| 6 | **Perfect Weave** | Damage Reduction | 10 |

#### Minor 1 — Convergent Vitality

**Stat:** Maximum Health  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Health |
|---:|---:|---:|
| 1 | **+5** | **+5** |
| 2 | **+6** | **+11** |
| 3 | **+7.5** | **+18.5** |
| 4 | **+10** | **+28.5** |
| 5 | **+12.5** | **+41** |
| 6 | **+17.5** | **+58.5** |
| 7 | **+22.5** | **+81** |
| 8 | **+30** | **+111** |
| 9 | **+40** | **+151** |
| 10 | **+55** | **+206** |

**Rank 10 cumulative:** **+412 Maximum Health**

#### Minor 2 — Crossroad Weave

**Stat:** Defense  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Defense |
|---:|---:|---:|
| 1 | **+1** | **+1** |
| 2 | **+1** | **+2** |
| 3 | **+1.5** | **+3.5** |
| 4 | **+1.5** | **+5** |
| 5 | **+2** | **+7** |
| 6 | **+2.5** | **+9.5** |
| 7 | **+3** | **+12.5** |
| 8 | **+4** | **+16.5** |
| 9 | **+5** | **+21.5** |
| 10 | **+6** | **+27.5** |

**Rank 10 cumulative:** **+55 Defense**

#### Minor 3 — Meridian Barrier

**Stat:** Barrier Power  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Barrier Power |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2.5%** | **+8.5%** |
| 6 | **+3%** | **+11.5%** |
| 7 | **+3.5%** | **+15%** |
| 8 | **+4.5%** | **+19.5%** |
| 9 | **+5.5%** | **+25%** |
| 10 | **+7%** | **+32%** |

**Rank 10 cumulative:** **+64% Barrier Power**

#### Minor 4 — Convergence Reserve

**Stat:** Maximum Mana  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Mana |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+3** | **+5.5** |
| 3 | **+4** | **+9.5** |
| 4 | **+5** | **+14.5** |
| 5 | **+6** | **+20.5** |
| 6 | **+7.5** | **+28** |
| 7 | **+10** | **+38** |
| 8 | **+12.5** | **+50.5** |
| 9 | **+15** | **+65.5** |
| 10 | **+20** | **+85.5** |

**Rank 10 cumulative:** **+171 Maximum Mana**

#### Minor 5 — Fourfold Ward

**Stat:** All Element Resistance  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative All Element Resistance |
|---:|---:|---:|
| 1 | **+0.25%** | **+0.25%** |
| 2 | **+0.375%** | **+0.625%** |
| 3 | **+0.375%** | **+1%** |
| 4 | **+0.5%** | **+1.5%** |
| 5 | **+0.625%** | **+2.125%** |
| 6 | **+0.75%** | **+2.875%** |
| 7 | **+1%** | **+3.875%** |
| 8 | **+1.25%** | **+5.125%** |
| 9 | **+1.5%** | **+6.625%** |
| 10 | **+2%** | **+8.625%** |

**Rank 10 cumulative:** **+17.25% All Element Resistance**

#### Minor 6 — Perfect Weave

**Stat:** Damage Reduction  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Damage Reduction |
|---:|---:|---:|
| 1 | **+0.125%** | **+0.125%** |
| 2 | **+0.125%** | **+0.25%** |
| 3 | **+0.25%** | **+0.5%** |
| 4 | **+0.25%** | **+0.75%** |
| 5 | **+0.375%** | **+1.125%** |
| 6 | **+0.375%** | **+1.5%** |
| 7 | **+0.5%** | **+2%** |
| 8 | **+0.625%** | **+2.625%** |
| 9 | **+0.75%** | **+3.375%** |
| 10 | **+1%** | **+4.375%** |

**Rank 10 cumulative:** **+8.75% Damage Reduction**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **First Convergence** | 10 total points | **+50 Maximum Health**; **+4 Defense** |
| **Crossroads Mantle** | 20 total points | **+75 Maximum Health**; **+6% Barrier Power** |
| **Meridian Loom** | 30 total points | **+100 Maximum Health**; **+20 Maximum Mana** |
| **Fourfold Aegis** | 40 total points | **+125 Maximum Health**; **+7.5 Defense**; **+2.5% All Element Resistance** |
| **Stable Convergence** | 50 total points | **+175 Maximum Health**; **+10% Barrier Power**; **+3% Damage Reduction**; **Signature:** Whenever a Barrier is gained, restore 2.5% Max Mana. 5s cooldown. |
| **Perfect Convergence** | 60 total points | **+250 Maximum Health**; **+12.5 Defense**; **+4% All Element Resistance**; **+5% Damage Reduction**; **Signature:** The first time each encounter HP falls below 30%, gain a Barrier equal to 17.5% Max HP and become immune to status application for 3 seconds. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Maximum Health | **+1681** |
| Defense | **+111.5** |
| Maximum Mana | **+105.5** |
| Barrier Power | **+48%** |
| Damage Reduction | **+12.375%** |
| All Element Resistance | **+20.125%** |

**Signature Major effects:**
- **50 points — Stable Convergence:** Whenever a Barrier is gained, restore 2.5% Max Mana. 5s cooldown.
- **60 points — Perfect Convergence:** The first time each encounter HP falls below 30%, gain a Barrier equal to 17.5% Max HP and become immune to status application for 3 seconds.

---

## 15. Waystone Circlet — ACT 1 Helmet

**Identity:** Advanced spell helmet / Mana / Focus / Tempo / Stability  
**Craft / unlock:** Current content unlock: Crossroads Keeper → craft through Artificing. After crafting, rank progression has NO boss gate.  
**Replaces:** Wispveil Hood  
**Max investment:** 60 points  

### Rank 0 baseline stats

- **+240 Spell Power**
- **+120 Maximum Mana**
- **+3% Spell Critical Chance**

**Replacement check:** Wispveil Hood fully maxed po V5 nerfo raw **Spell Power ≈ 119**, o Waystone Circlet gauna **240 Spell Power jau Rank 0**.

### Minor Nodes

| # | Node | Single responsibility | Max Rank |
|---:|---|---|---:|
| 1 | **Waystone Intellect** | Spell Power | 10 |
| 2 | **Meridian Reservoir** | Maximum Mana | 10 |
| 3 | **Focus Anchor** | Focus Cost | 10 |
| 4 | **Waystep Tempo** | Spell Cooldown Time | 10 |
| 5 | **Stabilized Incantation** | Spell Status Duration | 10 |
| 6 | **Waystone Precision** | Spell Critical Chance | 10 |

#### Minor 1 — Waystone Intellect

**Stat:** Spell Power  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Power |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+3** | **+5.5** |
| 3 | **+3.5** | **+9** |
| 4 | **+4** | **+13** |
| 5 | **+5** | **+18** |
| 6 | **+6** | **+24** |
| 7 | **+7.5** | **+31.5** |
| 8 | **+9** | **+40.5** |
| 9 | **+11** | **+51.5** |
| 10 | **+14** | **+65.5** |

**Rank 10 cumulative:** **+131 Spell Power**

#### Minor 2 — Meridian Reservoir

**Stat:** Maximum Mana  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Maximum Mana |
|---:|---:|---:|
| 1 | **+2.5** | **+2.5** |
| 2 | **+3** | **+5.5** |
| 3 | **+4** | **+9.5** |
| 4 | **+5** | **+14.5** |
| 5 | **+6** | **+20.5** |
| 6 | **+7.5** | **+28** |
| 7 | **+10** | **+38** |
| 8 | **+12.5** | **+50.5** |
| 9 | **+15** | **+65.5** |
| 10 | **+20** | **+85.5** |

**Rank 10 cumulative:** **+171 Maximum Mana**

#### Minor 3 — Focus Anchor

**Stat:** Focus Cost  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Focus Cost |
|---:|---:|---:|
| 1 | **-0.125%** | **-0.125%** |
| 2 | **-0.25%** | **-0.375%** |
| 3 | **-0.25%** | **-0.625%** |
| 4 | **-0.375%** | **-1%** |
| 5 | **-0.5%** | **-1.5%** |
| 6 | **-0.625%** | **-2.125%** |
| 7 | **-0.75%** | **-2.875%** |
| 8 | **-1%** | **-3.875%** |
| 9 | **-1.25%** | **-5.125%** |
| 10 | **-1.75%** | **-6.875%** |

**Rank 10 cumulative:** **-13.75% Focus Cost**

#### Minor 4 — Waystep Tempo

**Stat:** Spell Cooldown Time  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Cooldown Time |
|---:|---:|---:|
| 1 | **-0.25%** | **-0.25%** |
| 2 | **-0.375%** | **-0.625%** |
| 3 | **-0.5%** | **-1.125%** |
| 4 | **-0.625%** | **-1.75%** |
| 5 | **-0.75%** | **-2.5%** |
| 6 | **-0.875%** | **-3.375%** |
| 7 | **-1%** | **-4.375%** |
| 8 | **-1.25%** | **-5.625%** |
| 9 | **-1.5%** | **-7.125%** |
| 10 | **-2%** | **-9.125%** |

**Rank 10 cumulative:** **-18.25% Spell Cooldown Time**

#### Minor 5 — Stabilized Incantation

**Stat:** Spell Status Duration  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Status Duration |
|---:|---:|---:|
| 1 | **+1%** | **+1%** |
| 2 | **+1.5%** | **+2.5%** |
| 3 | **+1.5%** | **+4%** |
| 4 | **+2%** | **+6%** |
| 5 | **+2.5%** | **+8.5%** |
| 6 | **+3%** | **+11.5%** |
| 7 | **+3.5%** | **+15%** |
| 8 | **+4.5%** | **+19.5%** |
| 9 | **+5.5%** | **+25%** |
| 10 | **+7%** | **+32%** |

**Rank 10 cumulative:** **+64% Spell Status Duration**

#### Minor 6 — Waystone Precision

**Stat:** Spell Critical Chance  
**Resonance:** Fire + Water + Earth + Air  
**Max Rank:** 10

| Rank | Gain at this rank | Cumulative Spell Critical Chance |
|---:|---:|---:|
| 1 | **+0.25%** | **+0.25%** |
| 2 | **+0.25%** | **+0.5%** |
| 3 | **+0.375%** | **+0.875%** |
| 4 | **+0.375%** | **+1.25%** |
| 5 | **+0.5%** | **+1.75%** |
| 6 | **+0.625%** | **+2.375%** |
| 7 | **+0.75%** | **+3.125%** |
| 8 | **+0.875%** | **+4%** |
| 9 | **+1.125%** | **+5.125%** |
| 10 | **+1.5%** | **+6.625%** |

**Rank 10 cumulative:** **+13.25% Spell Critical Chance**

### Major Nodes — automatically unlocked

| Major | Unlock | Exact automatic reward |
|---|---:|---|
| **Waymark** | 10 total points | **+15 Spell Power**; **+10 Maximum Mana** |
| **Focus Seal** | 20 total points | **+20 Spell Power**; **-1.5% Focus Cost** |
| **Meridian Crown** | 30 total points | **+27.5 Spell Power**; **+5% Spell Status Duration** |
| **Stable Path** | 40 total points | **+35 Spell Power**; **-2.5% Spell Cooldown Time**; **+15 Maximum Mana** |
| **Convergent Sight** | 50 total points | **+45 Spell Power**; **+2% Spell Critical Chance**; **-2% Focus Cost**; **Signature:** The first spell after changing or reassigning Focus costs 12.5% less Mana. |
| **Perfect Waystone** | 60 total points | **+60 Spell Power**; **+30 Maximum Mana**; **-3.75% Spell Cooldown Time**; **-3% Focus Cost**; **Signature:** Every 10th spell cast refunds 50% of its Focus cost and 25% of its Mana cost. |

### Fully maxed raw stat package

> Šitie totalai sumuoja Rank 0 baseline + visus Minor ranks + visus skaitinius Major bonusus. Signature mechanics pateikiami atskirai.

| Stat | Final total from this Artifact |
|---|---:|
| Spell Power | **+508** |
| Maximum Mana | **+260.5** |
| Spell Critical Chance | **+11.625%** |
| Spell Cooldown Time | **-15.375%** |
| Spell Status Duration | **+37%** |
| Focus Cost | **-13.375%** |

**Signature Major effects:**
- **50 points — Convergent Sight:** The first spell after changing or reassigning Focus costs 12.5% less Mana.
- **60 points — Perfect Waystone:** Every 10th spell cast refunds 50% of its Focus cost and 25% of its Mana cost.

---


### Water Artifact direction — V5

Water weapon Artifactai nuo šiol **nenaudoja Barrier Power kaip savo pagrindinės scaling krypties**.

- Tideglass Wand: Barrier Power node pakeistas į **Healing Done**.
- Reliquary Scepter: Barrier Power baseline/node/Major bonusai pakeisti į **Healing Done**.
- Water signature efektai perkelti į healing / self-heal / heal-to-offense sąveikas.
- Earth ir Armor Artifactai Barrier Power vis dar gali naudoti — tai lieka jų defensive identity.

## Final review notes

Šitame variante svarbiausia jau yra ne tik kiek procentų duoda kiekvienas node, bet ir **Artifact generation hierarchy**:

- ACT 0 = pirmos kartos Artifactai, 5×10 ranks, 50 points.
- ACT 1 = tiesioginiai replacement Artifactai, 6×10 ranks, 60 points.
- Naujas Artifactas turi daug stipresnį Rank 0 baseline.
- Naujas Artifactas turi papildomą Minor Node ir papildomą Major milestone.
- Majorai vėlesnėje kartoje gauna ne tik didesnius skaičius, bet ir signature mechanics.
- Resonance cost paliktas aukštas ir vėlesnėje kartoje dar labiau kyla.

### Ką siūlau tau editinti pirmiausia

1. Rank 0 baseline skaičius — ypač ACT 1 replacement power jump.
2. Ar ACT 1 tikrai norim 6 Minor Nodes / 60 points visiems Artifactams.
3. Kiek agresyviai turi kilti Resonance cost ACT 1.
4. Ar patinka kiekvieno Artifacto 6-to Minor Node tema.
5. Ar Major 50/60-point signature mechanics tinka, ar nori paprastesnių stat bonusų.
6. Armor Rank 0 HP/Defense skaičius, nes jie sąmoningai dideli, kad naujas armor pakeistų pilnai investuotą seną.

Tik po šito design pass verta rašyti Codex implementation MD.
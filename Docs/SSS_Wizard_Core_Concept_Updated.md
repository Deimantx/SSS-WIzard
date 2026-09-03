# SSS Wizard — Core Concept

> **Pagrindinis projekto source of truth.**
>
> Dabartinis darbinis pavadinimas: **SSS Wizard**.
>
> Atnaujinta pagal realią žaidimo kryptį ir dabartinę implementaciją: **2026-08-28**.
>
> Šį failą galima pateikti naujame ChatGPT / Codex pokalbyje prieš projektuojant naują sistemą. Nauja sistema pirmiausia turi būti tikrinama prieš šiame dokumente aprašytas patvirtintas taisykles, o ne tyliai jas pakeisti.

---

# 1. Dokumento paskirtis

Šio dokumento tikslas — vienoje vietoje laikyti:

- pagrindinę **SSS Wizard** žaidimo viziją;
- jau patvirtintas dizaino taisykles;
- realiai implementuotas dabartinio MVP sistemas;
- dabartinius provisional balance skaičius, kai jie svarbūs sistemų supratimui;
- aiškiai atskirtas dar atviras vietas;
- ateities sistemas, kurių dar nereikia implementuoti;
- svarbiausias UI/UX taisykles;
- ryšius tarp sistemų.

Šis dokumentas **nėra programavimo instrukcija**.

Techniniai implementation planai Codex turi būti kuriami atskiruose `.md` failuose.

---

## 1.1. Kaip naudoti šį failą naujame pokalbyje

Rekomenduojama pradžia:

> Naudok prisegtą `SSS_Wizard_Core_Concept.md` kaip pagrindinį source of truth apie projektą.  
> Nauja idėja neturi tyliai pakeisti jau patvirtintos arba implementuotos sistemos.  
> Jeigu siūlomas sprendimas prieštarauja Core Concept, aiškiai parodyk konfliktą ir pasiūlyk variantus prieš keičiant kryptį.

Svarbu:

- seni mockupai nėra aukščiau už naujausią Core Concept;
- seni Codex promptai nėra aukščiau už naujausią Core Concept;
- provisional balance skaičiai gali keistis;
- patvirtintos sistemos taisyklės neturi būti keičiamos vien dėl patogesnio programavimo.

---

## 1.2. Dokumento žymos

- **[IMPLEMENTUOTA]** — sistema arba taisyklė jau egzistuoja dabartiniame žaidime.
- **[PATVIRTINTA]** — dizaino kryptis sutarta ir turi būti laikoma source of truth.
- **[PATVIRTINTA KRYPTIS]** — pagrindinė sistemos idėja sutarta, nors vėliau gali būti plečiama.
- **[BALANSAS]** — sistema sutarta, bet konkretūs skaičiai yra provisional ir gali būti keičiami.
- **[SIŪLOMA]** — logiška kryptis, tačiau dar nėra galutinai patvirtinta.
- **[ATVIRA]** — sprendimas dar nepriimtas.
- **[ATEIČIAI]** — sistema ar gylis, kurio dabartiniam MVP nereikia.
- **[KITAS DIZAINO ETAPAS]** — artimiausia sritis, kurią planuojama detaliai projektuoti, bet jos dar nereikia laikyti galutinai nuspręsta.

---

# 2. Greitas projekto kontekstas

| Sritis | Dabartinė kryptis |
|---|---|
| Darbinis pavadinimas | **SSS Wizard** |
| Žanras | Mage-only incremental RPG / semi-automatic combat |
| Pagrindinis veikėjas | Vienas magas su savo Wizard Tower |
| Pradinės Magic Schools | Fire, Water, Earth, Air |
| Pagrindinis energijos resursas | Mana |
| Paralelinių veiklų limitas | Focus |
| Paralelinių veiklų vykdytojai | Arcane Echoes |
| Pagrindinis crafting | Transmutation |
| Magic School XP | Research / Arcane Crucible sunaikinant daiktus |
| Pagrindinis power gate | Main Boss keliami Magic School level cap |
| Antra progreso ašis | Guild Requests / Guild Rank |
| Combat progresas | Dungeon → Threat Cleared → Dungeon Boss → Main Boss |
| Item archyvas | Collection |
| Monster archyvas | Bestiary |
| Offline progresas | Offline Bank ir pasirenkama simuliacija |
| Prestige / Retirement | **Nėra** |
| Pagrindinis UI modelis | Persistent shell + atskiri ekranai + Activity Monitor |
| UI pritaikymas | Edit UI |
| Developer testing | Platus Dev Tools |

---

# 3. Current Implementation Snapshot

## [IMPLEMENTUOTA] Dabartinis playable content

Ši sekcija nėra pažadas, kad toks turinio kiekis liks visam laikui.

Ji egzistuoja tam, kad naujame pokalbyje būtų iškart aišku, **kas jau realiai yra projekte**.

### Magic Schools

- Fire
- Water
- Earth
- Air

### Dabartiniai starter spells

**Fire**
- Fire Bolt
- Ignite

**Water**
- Water Ward
- Flow Mend

**Earth**
- Earth Spike
- Stoneguard

**Air**
- Air Lance
- Quickening

Tai yra pirmas dabartinis spell content rinkinys, o ne galutinis spell tree.

### Dabartinis dungeon

- **Whispering Woods**

### Normal monsters

- Forest Wisp
- Thornling
- Stone Root

### Dungeon Boss

- Grove Sentinel

### Main / Special Boss

- Forest Heart

### Dabartiniai pagrindiniai materialai

- Fire Fragment
- Water Fragment
- Earth Fragment
- Air Fragment
- Prismatic Fragment
- Life Essence
- Wisp Essence
- Grove Bark
- Heartseed

### Dabartinis equipment

- Apprentice Wand
- Ember Staff
- Tide Focus
- Stoneweave Robe
- Windthread Charm

### Dabartiniai pagrindiniai ekranai

- Overview
- Combat
- Magic Schools
- Inventory
- Equipment
- Collection
- Bestiary
- Channeling
- Focus
- Transmutation
- Research
- Guild
- Settings / Info

### Sisteminiai UI įrankiai

- Offline Bank
- Activity Monitor
- Dev Tools
- Edit UI
- custom tooltip system

---

# 4. Bendra žaidimo vizija

## [PATVIRTINTA] Pagrindinė fantazija

Žaidėjas valdo **vieną magą**, kuris palaipsniui tampa vis galingesnis ir vis geriau geba vienu metu valdyti daugybę magiškų procesų.

Tai nėra:

- party RPG;
- kelių herojų rosteris;
- magų akademijos management žaidimas;
- kareivių arba armijos valdymas.

Pagrindinis veikėjas visada yra tas pats magas.

Jo galios augimas turi būti jaučiamas ne tik per didesnius damage skaičius, bet ir per tai, kad jis gali vienu metu:

- generuoti Maną;
- palaikyti Arcane Echoes;
- vykdyti Research;
- Transmutation būdu gaminti kelis skirtingus daiktus;
- automatiškai naudoti kelis burtus;
- kovoti dungeon;
- palaipsniui automatizuoti vis daugiau veiksmų;
- naudoti vis sudėtingesnius buildus;
- tobulinti Wizard Tower;
- vykdyti Guild tikslus.

---

## [PATVIRTINTA] Nėra Prestige / Retirement

Žaidime nėra klasikinės prestige sistemos, kuri:

- ištrina didžiąją progreso dalį;
- grąžina veikėją į pradžią;
- verčia tą patį turinį kartoti nuo nulio dėl multiplier.

Progresas yra:

- nuolatinis;
- horizontaliai ir vertikaliai plečiamas;
- etapais atveriamas per bosus, Guild ir Tower sistemas.

Laikinai resetinamas tik konkretaus dungeon run progresas, o ne visas veikėjas.

---

# 5. Pagrindiniai dizaino principai

## 5.1. Visos svarbios sistemos turi būti susijusios

Sistema neturėtų egzistuoti tik todėl, kad jai galima pridėti atskirą XP barą.

Pagrindinės sistemos turi maitinti viena kitą.

Pavyzdinis dabartinis ryšys:

```text
Channeling
    ↓
Mana
    ↓
Transmutation
    ↓
Materials / Equipment
    ↓
Research + Combat + Tower Upgrades + Guild
    ↓
Magic School progression / stronger build
    ↓
Dungeon + Bosses
    ↓
new loot / cap / progression
```

---

## 5.2. Combat negali tapti nereikalingas

Tower viduje galima gaminti bazinius elementinius fragmentus.

Tačiau aukštesnis progresas turi vis dažniau reikalauti:

- monster loot;
- dungeon medžiagų;
- boss medžiagų;
- specialių catalyst;
- regioninių komponentų;
- Guild progresijos.

Negalima sukurti uždaro optimalaus ciklo:

```text
Mana → fragmentas → Research → daugiau galios
```

kuris leistų praktiškai ignoruoti Combat.

---

## 5.3. Tas pats item gali turėti kelis prasmingus panaudojimus

Vienas materialas gali konkuruoti tarp:

- Research;
- Transmutation;
- Tower upgrade;
- Guild donation;
- equipment crafting;
- specialios progresijos;
- pardavimo.

Tai turi sukurti sprendimus, tačiau ne nuolatinį varginantį mikromanagementą.

---

## 5.4. Basic Combat visada išlieka įmanomas

Basic Attack:

- vyksta automatiškai;
- Focus nenaudoja;
- turi išlikti naudingas farmingui;
- leidžia visą Focus skirti Tower veikloms.

Sunkesni priešai turi skatinti:

- naudoti spells;
- kurti geresnį buildą;
- keisti Focus paskirstymą;
- reaguoti į special attacks;
- naudoti defensive / sustain sprendimus.

---

## 5.5. Automatizacija kainuoja ribotą kontrolės talpą

Automatizacija nėra nemokamas QoL.

Arcane Echoes ir auto-cast konkuruoja dėl Focus.

Žaidėjas nuolat sprendžia:

> Kur šiuo metu verta skirti ribotą mano mago dėmesį?

---

# 6. Pagrindinis gameplay loop

## [PATVIRTINTA]

Atnaujintas pagrindinis ciklas:

```text
Channeling
→ Mana
→ Transmutation
→ Materials
→ Research
→ Magic School XP
→ Spells / Recipes / Power
→ Equipment & Combat preparation
→ Dungeon
→ Dungeon Boss
→ Main Boss
→ higher Magic School cap / new content
```

Lygiagrečiai:

```text
Combat / Crafting / Donations / Boss kills
→ Guild Requests
→ Guild Reputation
→ Guild Rank
→ Focus / systems / permanent progression
```

---

## 6.1. Svarbus pakeitimas — Condensation nebėra atskira sistema

## [PATVIRTINTA / IMPLEMENTUOTA]

**Condensation kaip atskiras crafting ekranas ar gameplay sistema panaikinta.**

Elementinių fragmentų gamyba dabar yra **Transmutation** dalis.

Transmutation apima:

```text
Mana → matter
materials → processed materials
Mana + materials → advanced items
materials + materials → equipment / catalysts / special items
```

Todėl ateities dokumentuose nereikia kurti atskiros `Condensation` profesijos ar screen.

---

# 7. Mana

## [PATVIRTINTA]

Mana yra pagrindinė magiška energija.

Ji naudojama:

- Transmutation;
- Research;
- combat spells;
- auto-cast spells;
- ateities maintained spells;
- galimiems summons;
- daliai Tower sistemų.

Mana turi:

- current Mana;
- Max Mana;
- passive Mana regeneration;
- Echo-generated Mana;
- aktyvų consumption/demand;
- derived net Mana Flow.

---

## 7.1. Mana Flow

## [IMPLEMENTUOTA]

Mana Flow nėra atskiras permanentinis stat.

Tai derived informacija:

```text
Mana production
-
average active Mana demand
=
net Mana flow
```

UI turi aiškiai rodyti:

- **SURPLUS**, kai gamyba didesnė už demand;
- **DEFICIT**, kai demand didesnis;
- apytikslį laiką iki full;
- apytikslį laiką iki empty.

Mana header turi likti viena svarbiausių globalių UI dalių.

---

# 8. Channeling

## [PATVIRTINTA / IMPLEMENTUOTA]

Channeling yra pagrindinis Mana infrastruktūros ekranas.

Jis nebėra pagrindinis fragmentų crafting ekranas.

Channeling dabar atsakingas už:

- pasyvią Mana generaciją;
- Arcane Echo Mana generaciją;
- Mana capacity progresiją;
- Mana regeneration progresiją;
- Mana infrastruktūros permanentinius upgrade;
- Arcane Discoveries.

---

## 8.1. Dabartinė bazinė Channeling ekonomika

## [IMPLEMENTUOTA / BALANSAS]

Fresh profile:

- bazinė passive Mana generation: **+5 Mana/s**;
- galima skirti iki **5 Arcane Echoes** Channeling;
- vienas Echo rezervuoja **10 Focus**;
- vienas Echo bazėje prideda **+5 Mana/s**.

Todėl be kitų modifier:

```text
0 Echo = +5 Mana/s
1 Echo = +10 Mana/s
5 Echo = +30 Mana/s
```

Šie skaičiai yra provisional balance.

---

# 9. Pillars of Mana

## [IMPLEMENTUOTA]

Channeling Chamber turi penkis dabartinius permanentinius Mana Pillars.

Visi:

- prasideda Rank I;
- turi Level 0 / 10;
- Level 10 laikomas Rank I Mastery;
- Rank II kol kas tik future placeholder.

---

## 9.1. Leyline Conduit

Paskirtis:

- stiprinti passive Mana regeneration.

Dabartinis efektas:

- **+1 Mana/s per level**.

---

## 9.2. Arcane Reservoir

Paskirtis:

- didinti Max Mana.

Dabartinis efektas:

- **+25 Max Mana per level**.

---

## 9.3. Mana Resonance

Paskirtis:

- procentiškai stiprinti passive non-Echo Mana regeneration.

Dabartinis efektas:

- **+5% per level**.

---

## 9.4. Astral Expansion

Paskirtis:

- procentiškai stiprinti galutinį Max Mana pool.

Dabartinis efektas:

- **+5% per level**.

---

## 9.5. Echo Attunement

Paskirtis:

- stiprinti Mana, generuojamą Arcane Echoes.

Dabartinis efektas:

- **+5% Echo Mana per level**.

---

## 9.6. Rank I upgrade curve

## [IMPLEMENTUOTA / BALANSAS]

Bendra Rank I primary material curve:

```text
Level 1   → 5
Level 2   → 10
Level 3   → 15
Level 4   → 25
Level 5   → 40
Level 6   → 60
Level 7   → 90
Level 8   → 130
Level 9   → 180
Level 10  → 250
```

Mana Pillars papildomai naudoja Life Essence pagal dabartinę Tower upgrade curve.

Konkretaus Pillar elementiniai fragmentai priklauso nuo jo temos.

---

# 10. Arcane Discoveries

## [IMPLEMENTUOTA KRYPTIS]

Arcane Discoveries yra permanentiniai Channeling principai, atrakinami pasiekus tam tikras sąlygas.

Dabartiniai:

- Stable Leyline;
- Echo Resonance;
- Deep Reservoir.

Ateityje Discoveries gali būti daugiau.

Jos neturėtų tapti dar viena nuolat spaudžiama skill tree valiuta.

---

# 11. Arcane Echoes

## [PATVIRTINTA]

Arcane Echoes yra magiškos pagrindinio mago projekcijos.

Jos paaiškina, kaip vienas magas vienu metu gali:

- Channeling;
- Research;
- Transmutation;
- Combat;
- auto-cast;
- vėlesnes Tower veiklas.

---

## 11.1. Echo nėra atskiras herojus

Arcane Echo neturi turėti:

- savo inventory;
- savo equipment loadout;
- atskiros ilgos character stat sistemos;
- individualaus leveling tree;
- nuolatinio micro-management.

Echo yra **darbo paskyrimo vienetas**, o ne papildomas RPG veikėjas.

---

## 11.2. Echo ir Focus ryšys

Svarbi taisyklė:

```text
Focus = capacity
Echo assignment = kaip ta capacity panaudojama
```

Focus pats savaime proceso nepagreitina.

Procesą pagreitina daugiau tam procesui paskirtų Echo, o kiekvienas Echo rezervuoja Focus.

---

# 12. Focus

## [PATVIRTINTA]

Focus yra pagrindinio mago gebėjimo kontroliuoti paralelines automatines sistemas talpa.

Focus nėra:

- Mana;
- sunaudojama valiuta;
- regeneruojama stamina;
- combat damage stat.

Focus yra **rezervuojama capacity**.

Pavyzdys:

```text
Max Focus: 100
Reserved: 70
Free: 30
```

---

## 12.1. Veiklos, kurioms Focus nereikia

- Basic Attack;
- UI navigacija;
- Inventory management;
- Equipment management;
- momentiniai manual UI veiksmai;
- manual spell cast pagal dabartinę kryptį.

---

## 12.2. Veiklos, kurios rezervuoja Focus

- Channeling Echoes;
- Research Echoes;
- Transmutation Echoes;
- combat auto-cast spells;
- ateities automation.

---

## 12.3. Focus Screen paskirtis

## [IMPLEMENTUOTA KRYPTIS]

Focus Screen yra globalus allocation / diagnostics ekranas.

Jis turi parodyti:

- Max Focus;
- Reserved Focus;
- Free Focus;
- utilization;
- capacity sources;
- visas Focus naudojančias sistemas;
- kiek kiekviena sistema rezervuoja;
- active / waiting / paused būsenas;
- navigacijos linką į konkretų activity screen.

---

# 13. Focus Improvement

## [IMPLEMENTUOTA]

Focus turi atskirą permanentinį Tower upgrade:

**Focus Capacity**

Dabartinis:

- Rank I;
- 10 levels;
- **+5 Max Focus per level**;
- pilnas Rank I = **+50 Max Focus**.

---

## 13.1. Focus Improvement kaina

Focus Capacity upgrade **nenaudoja Life Essence tiesiogiai**.

Jis naudoja:

- **Prismatic Fragments**.

Dabartinė per-level primary kaina naudoja tą pačią Rank I curve:

```text
5
10
15
25
40
60
90
130
180
250
```

---

# 14. Prismatic Fragment

## [IMPLEMENTUOTA / BALANSAS]

Prismatic Fragment yra bendras keturių pradinių elementų harmonizuotas materialas.

Dabartinis Transmutation recipe:

```text
2 Fire Fragment
2 Water Fragment
2 Earth Fragment
2 Air Fragment
10 Life Essence
→
1 Prismatic Fragment
```

Base duration:

```text
18 seconds
```

Prismatic Fragment šiuo metu yra pagrindinis Focus Capacity upgrade materialas.

---

# 15. Life Essence

## [IMPLEMENTUOTA]

Life Essence yra universalus monster materialas.

Dabartiniai visi current enemies, įskaitant bosses, gauna Life Essence drop.

Paskirtis:

- Mana Pillars;
- Prismatic Fragment crafting;
- ateities bendri Tower upgrades.

Svarbu:

- Life Essence nėra dabartinis Research materialas;
- Focus Capacity jo tiesiogiai nenaudoja;
- jis jau yra Transmutation economy dalis per Prismatic Fragment recipe.

---

# 16. Transmutation

## [PATVIRTINTA / IMPLEMENTUOTA]

Transmutation yra **vienintelė pagrindinė crafting sistema**.

Ji gali konvertuoti:

```text
Mana → material
material → material
materials → processed material
materials + Mana → item
materials → equipment
```

Ateityje tuo pačiu modeliu gali veikti:

- ores → bars;
- fragments → crystals;
- crystals → orbs;
- boss materials → equipment;
- catalysts;
- potions;
- runes;
- special progression items.

---

## 16.1. Echo Assignment

## [IMPLEMENTUOTA]

Transmutation turi bendrą iki **5 Echo** assignment fondą.

Kiekvienas Echo:

- rezervuoja **10 Focus**;
- prideda vieną bazinį recipe processing greičio vienetą.

Todėl:

```text
1 Echo vienam recipe = 1× processing speed
5 Echo vienam recipe = 5× processing speed
```

arba galima paskirstyti:

```text
Recipe A → 2 Echo
Recipe B → 1 Echo
Recipe C → 1 Echo
Recipe D → 1 Echo
```

Tai leidžia pasirinkti tarp:

- vieno greito craft;
- kelių lėtesnių paralelinių craft.

---

## 16.2. Svarbi crafting laiko taisyklė

## [PATVIRTINTA / IMPLEMENTUOTA]

Output **negali atsirasti iškart pradėjus recipe**.

Recipe turi realiai užbaigti savo funded progress.

Dabartinis modelis:

1. sistema apskaičiuoja, kiek work gali būti atlikta;
2. Mana finansuoja to tick progress;
3. progress juda tik tiek, kiek realiai finansuota;
4. tik pasiekus pilną cycle:
   - sunaudojami discrete ingredientai;
   - sukuriamas output;
5. partial progress išlieka.

Tai apsaugo nuo seno „instant craft“ bug modelio.

---

## 16.3. Mana-only elemental recipes

## [IMPLEMENTUOTA / BALANSAS]

Dabartiniai keturi baziniai fragmentai:

| Recipe | Mana | Base time | Output |
|---|---:|---:|---|
| Fire Fragment | 15 | 6 s | ×1 |
| Water Fragment | 15 | 6 s | ×1 |
| Earth Fragment | 15 | 6 s | ×1 |
| Air Fragment | 15 | 6 s | ×1 |

---

## 16.4. Dabartiniai equipment recipes

Po Grove Sentinel progresijos dabartiniame MVP egzistuoja:

- Ember Staff;
- Tide Focus;
- Stoneweave Robe;
- Windthread Charm.

Tai nėra galutinis equipment content.

---

## 16.5. Protected item taisyklė

Protected / locked item:

- negali būti sunaudojamas Transmutation;
- negali būti Research;
- negali būti Guild donation;
- negali būti Destroy veiksmu sunaikintas.

Equipped item taip pat turi būti apsaugotas nuo automatinio consumption.

---

# 17. Research / Arcane Crucible

## [PATVIRTINTA / IMPLEMENTUOTA]

Research yra Magic School XP gavimo sistema.

Pagrindinė fantazija:

> magas sunaikina materialo magišką struktūrą ir jo essence nukreipia į pasirinktą Magic School.

---

## 17.1. Research flow

Žaidėjas:

1. pasirenka researchable item;
2. pasirenka target Magic School;
3. pasirenka quantity;
4. paspaudžia Prepare;
5. partija patenka į Prepared Research;
6. paskiria 0–5 Echo;
7. Echo pradeda naikinti itemus po vieną;
8. už kiekvieną pilną cycle:
   - sunaudojamas 1 item;
   - sunaudojama Mana;
   - target school gauna XP.

---

## 17.2. Research capacity

## [IMPLEMENTUOTA]

MVP:

- iki **4 prepared Research slots**;
- bendras **5 Research Echo pool**;
- galima vienu metu researchinti kelis skirtingus itemus;
- galima vienu metu kelti kelias Magic Schools;
- batch su `0 Echo` lieka prepared, bet neprogresuoja.

---

## 17.3. Research Echo cost

## [IMPLEMENTUOTA / BALANSAS]

Vienas Research Echo:

```text
10 Focus
```

Maksimalus 5 Echo Research pool:

```text
50 Focus
```

---

## 17.4. Current Research base balance

## [IMPLEMENTUOTA / BALANSAS]

Dabartinis bazinis researchable fragment:

```text
5 seconds / item
5 Mana / item
```

Affinity:

```text
matching school = 12 XP / item
non-matching school = 8 XP / item
```

Dabartiniame MVP nėra papildomų opposite-element 6 XP baudų.

Jeigu ateityje kuriama gilesnė elemental relationship sistema, šis modelis gali būti peržiūrėtas.

---

## 17.5. Research level cap safety

## [PATVIRTINTA / IMPLEMENTUOTA KRYPTIS]

Pasiekus target Magic School dabartinį cap:

- Research batch sustoja;
- kitas item nėra sunaikinamas;
- quantity išlieka;
- progress saugiai išlieka;
- Focus neturi būti be reikalo užrakintas kaip aktyviai dirbantis procesas;
- pakėlus cap batch gali būti tęsiamas.

XP negali tyliai dingti.

---

## 17.6. Item protection

Research negali sunaikinti:

- protected item;
- equipped item;
- item, kurio realiai nėra laisvo quantity.

---

# 18. Magic Schools

## [PATVIRTINTA]

Žaidimo pradžioje yra:

1. Fire
2. Water
3. Earth
4. Air

Jos turi:

- atskirą XP;
- atskirą level;
- bendrą current chapter level cap;
- savo spells;
- ateityje savo deeper identities ir build interactions.

---

## 18.1. Fire identity

Pagrindinė kryptis:

- direct damage;
- burn / DoT;
- aggression;
- burst;
- offensive scaling.

---

## 18.2. Water identity

Pagrindinė kryptis:

- healing;
- barriers / adaptive defense;
- ice / slow;
- sustain;
- control.

---

## 18.3. Earth identity

Pagrindinė kryptis:

- armor;
- barrier;
- Max Health;
- stagger / delay;
- tanky build.

---

## 18.4. Air identity

Pagrindinė kryptis:

- speed;
- cooldown;
- Basic Attack acceleration;
- evasion / mobility;
- chain / fast spell behavior.

---

## 18.5. Primary element pasirinkimas

## [ATVIRA]

Dar nenuspręsta, ar žaidimo pradžioje reikalingas vienas „main element“.

Visi keturi schools bet kuriuo atveju turi likti levelinami.

---

## 18.6. Future schools

## [PATVIRTINTA KRYPTIS]

Vėliau Main Boss progresija gali atrakinti papildomas Magic Schools.

Viena svarstoma kryptis:

- Summoning.

Galutinis sąrašas dar nėra patvirtintas.

---

# 19. Magic School level cap

## [PATVIRTINTA]

Magic Schools negali būti levelinamos be chapter progression.

Dabartinis start:

```text
Level cap 10
```

Pirmasis Main Boss:

```text
cap 10 → 20
```

Ilgalaikė pageidaujama kryptis:

- apie 15 Main Bosses;
- galutinis cap maždaug 300.

Skaičių tempas yra **[BALANSAS]**.

---

# 20. Spell sistema

## [PATVIRTINTA KRYPTIS]

Spells neturi būti tik keturių spalvų damage variantai.

Spell gali būti:

- direct damage;
- DoT;
- healing;
- barrier;
- buff;
- debuff;
- attack speed modifier;
- action delay;
- cooldown effect;
- Mana utility;
- status effect;
- ateities sustained effect.

---

## 20.1. Dabartiniai starter spell examples

## [IMPLEMENTUOTA / BALANSAS]

### Fire Bolt

- direct damage;
- Level 2;
- Mana cost;
- cooldown;
- Auto-Cast Focus.

### Ignite

- DoT / Burning;
- Level 4.

### Water Ward

- barrier;
- conditional auto-cast pagal barrier.

### Flow Mend

- heal;
- conditional auto-cast pagal HP.

### Earth Spike

- direct damage.

### Stoneguard

- stronger barrier.

### Air Lance

- direct damage starter spell.

### Quickening

- temporary Basic Attack speed buff.

Šie spells yra dabartinis pirmas implementation slice.

Jie nėra galutinė Magic School spell progression.

---

## 20.2. Manual vs Auto-Cast

## [PATVIRTINTA KRYPTIS]

Manual cast:

- naudoja Mana;
- laikosi cooldown;
- Focus nerezervuoja.

Auto-Cast:

- naudoja tą patį spell;
- naudoja Mana;
- laikosi cooldown;
- rezervuoja spell-specific Focus.

---

## 20.3. Auto-Cast sąlygos

Dabartiniame starter modelyje jau gali egzistuoti paprastos sąlygos:

- always;
- HP below threshold;
- Barrier below threshold.

Sudėtingesnė rule engine lieka ateičiai.

---

# 21. Equipment

## [PATVIRTINTA / IMPLEMENTUOTA]

MVP turi **8 explicit loadout positions**.

1. **Weapon**
   - one-handed arba two-handed.

2. **Offhand**
   - shield;
   - magical focus;
   - panašūs daiktai;
   - negalima naudoti, kai Weapon yra two-handed.

3. **Armor**

4. **Helmet**

5. **Cape**

6. **Amulet**

7. **Ring 1**

8. **Ring 2**

Ring 1 ir Ring 2 yra du loadout positions tam pačiam `ring` item type.

---

## 21.1. MVP slotai dabar laikomi fiksuoti

Dabartiniam MVP **Earrings nėra**.

Jeigu ateityje prireiks daugiau slotų, jie gali būti pridėti atskiru dizaino sprendimu.

---

## 21.2. Equipment paskirtis

Equipment turi formuoti buildą.

Galimos savybės:

- Basic Attack damage;
- Max Health;
- Max Mana;
- Max Focus;
- Mana regeneration;
- konkretaus element damage;
- barrier power;
- healing;
- status effect synergy;
- resistances;
- ateities Focus efficiency.

Ne kiekvienas equipment item turi būti vien didesnis generic DPS.

---

### Equipment Acquisition

- Enemies and bosses drop crafting materials only.
- Finished Equipment never drops directly from combat.
- All finished Equipment is created through Transmutation.
- Boss-signature Equipment uses boss/signature materials in its Transmutation recipe.
- Rare chase rewards may use rare material drops or high material requirements, but final Equipment still comes from Transmutation.

---

# 22. Inventory, Collection ir Bestiary turi skirtingas paskirtis

## [PATVIRTINTA / IMPLEMENTUOTA]

Šios trys sistemos neturi būti sumaišytos.

---

# 23. Inventory — current ownership

Inventory rodo **tik tai, ką žaidėjas šiuo metu turi**.

Inventory paskirtis:

- matyti owned quantity;
- filtruoti;
- rūšiuoti;
- inspect item;
- matyti source;
- matyti `Used In`;
- matyti current needs;
- matyti current production / consumption flow;
- Protect;
- Sell;
- Destroy;
- Equip.

---

## 23.1. Inventory kategorijos

### Materials

Visi crafting / processing / upgrade materialai.

Material subcategories:

- Elemental
- Creature
- Ore
- Refined
- Arcane

### Loot

Specialesni non-equipment combat drops / progression loot.

### Equipment

Uždedami daiktai.

### Special

Ateities special progression / quest tipo items.

---

## 23.2. Sell / Destroy / Protect

Inventory turi:

- quantity selector;
- Sell;
- Destroy;
- Protect / Unlock.

Protected item negali būti netyčia sunaudotas kitose sistemose.

---

# 24. Collection — item archive

## [PATVIRTINTA / IMPLEMENTUOTA]

Collection yra **item-only discovery archive**.

Monster informacija čia nebeturi būti laikoma.

Item tampa discovered:

```text
kai žaidėjas jį bent kartą gauna
```

Discovery išlieka net jeigu vėliau item:

- sunaudojamas;
- parduodamas;
- sunaikinamas;
- quantity tampa 0.

---

## 24.1. Collection paskirtis

Collection rodo:

- visus authored item entries;
- discovered / undiscovered būseną;
- category completion;
- item details;
- source;
- research value;
- uses;
- equipment stats;
- kitą contextual info.

Tai nėra antras Inventory.

---

# 25. Bestiary — creature archive

## [PATVIRTINTA / IMPLEMENTUOTA]

Bestiary yra atskiras monster knowledge archive.

Kategorijos:

- Monsters
- Bosses
- Special Bosses

---

## 25.1. Monster discovery

Monster tampa discovered:

```text
pirmą kartą jį SUTIKUS
```

Nereikia pirmiausia jo nužudyti.

---

## 25.2. Bestiary turi būti tiesiogiai susietas su Combat data

Bestiary neturi turėti atskiros dubliuotos monster mechanikų kopijos.

Jis turi skaityti tą pačią authored monster informaciją, kurią naudoja Combat.

Kai ateityje Combat gauna naujus:

- traits;
- buffs;
- debuffs;
- resistances;
- special attacks;
- status effects;
- phases;
- telegraph rules;

Bestiary turi rodyti atitinkamą žaidėjui skirtą informaciją iš to paties source.

---

## 25.3. Discovered creature dossier

Bestiary turi galėti parodyti:

- monster name;
- category;
- location;
- defeat count;
- Max Health;
- Basic Attack damage;
- attack interval;
- traits;
- special attacks;
- telegraph times;
- attack sequence;
- loot table;
- collected / not collected loot status;
- ateities resistances ir status info.

---

# 26. Combat

## [PATVIRTINTA KRYPTIS]

Combat yra semi-automatic.

- Basic Attack automatinis.
- Manual spells galimi.
- Auto-Cast galimas per Focus.
- Equipment ir spell loadout formuoja buildą.
- Tower activities gali tęstis kovos metu, jeigu joms lieka Focus.

---

## 26.1. Player Basic Attack

## [IMPLEMENTUOTA / BALANSAS]

Dabartinis starter balance:

- base damage: 8;
- base interval: 2.2 s.

Šie skaičiai nėra galutiniai.

---

# 27. Monster action sequences

## [PATVIRTINTA / IMPLEMENTUOTA FOUNDATION]

Monster nėra tik vienas repeating auto-attack.

Monster turi authored:

- Basic actions;
- Special actions;
- repeating action sequence.

Pavyzdys:

```text
Basic
Basic
Special
repeat
```

Boss gali turėti:

```text
Basic
Basic
Special A
Basic
Special B
repeat
```

---

## 27.1. Telegraph

Special Attack turi galėti turėti telegraph time.

Žaidėjas turi:

- matyti, kas artėja;
- suprasti, kada action resolve;
- turėti galimybę pasiruošti;
- naudoti barrier / healing / defensive spell;
- ateityje galbūt counter / interrupt.

Combat neturi būti paslėptų random taisyklių spėjimas.

---

# 28. Monster Traits

## [PATVIRTINTA / IMPLEMENTUOTA FOUNDATION]

Trait yra passive arba conditional monster rule.

Pavyzdžiai dabartiniame content:

- damage reduction;
- start-of-fight Barrier;
- HP threshold Barrier;
- attack speed change;
- special action telegraph behavior.

Trait turi:

- būti authored monster data;
- veikti Combat;
- būti rodomas Bestiary;
- turėti aiškų player-facing description.

---

# 29. Dabartinis Whispering Woods combat content

## [IMPLEMENTUOTA / BALANSAS]

### Forest Wisp

Sequence:

```text
Basic
Basic
Arc Spark
repeat
```

Arc Spark:

- telegraphed;
- direct damage.

---

### Thornling

Trait:

- Barkskin.

Sequence:

```text
Basic
Basic
Thorn Lash
repeat
```

Thorn Lash:

- damage;
- delayed Thorn Wound effect.

---

### Stone Root

Trait:

- Rooted Shell;
- start-of-combat Barrier.

Sequence:

```text
Basic
Basic
Basic
Root Slam
repeat
```

Root Slam:

- damage;
- delays player Basic Attack.

---

### Grove Sentinel

Category:

- Dungeon Boss.

Trait:

- Ancient Growth.

Has multiple special attacks.

---

### Forest Heart

Category:

- Special Boss / current Main Boss.

Trait:

- Living Core.

Has multiple special attacks including:

- damage;
- delay;
- self-heal.

---

# 30. Status Effects, Buffs, Debuffs ir Resistances

## [KITAS DIZAINO ETAPAS]

Tai yra viena svarbiausių sričių prieš rimtai plečiant Combat.

Dabartinis žaidimas jau turi pirmus konkrečius efektus:

- Burning / DoT;
- Barrier;
- Heal;
- Quickening;
- delayed damage;
- attack delay;
- monster threshold effects.

Tačiau **bendras universalus Combat status modelis dar turi būti detaliai suprojektuotas**.

Naujame Combat dizaino etape reikia apsispręsti dėl:

- buff tipo;
- debuff tipo;
- DoT;
- HoT;
- Barrier;
- Stun / stagger;
- Slow;
- attack delay;
- cooldown modification;
- elemental resistance;
- weakness;
- immunity;
- duration;
- stack taisyklių;
- refresh taisyklių;
- source;
- dispel / cleanse;
- UI presentation;
- Bestiary presentation.

Šiame Core Concept sąmoningai nefiksuojamos tikslios formulės, kol Combat sistema nebus atskirai išdiskutuota.

---

# 31. Combat architektūrinė kryptis kitam etapui

## [KITAS DIZAINO ETAPAS]

Kuriant gilesnį Combat, source of truth turėtų būti data-driven.

Rekomenduojama konceptuali kryptis:

```text
Monster Definition
├─ base stats
├─ traits
├─ action sequence
├─ special attacks
├─ resistances
├─ loot
└─ Bestiary presentation metadata
```

ir:

```text
Spell Definition
├─ school
├─ Mana cost
├─ cooldown
├─ Focus auto-cast cost
├─ effect
├─ status application
└─ auto-cast condition
```

Bestiary ir Combat turi naudoti tą pačią data.

---

# 32. Dungeon struktūra

## [PATVIRTINTA]

Kiekvienas dungeon turi:

- normal monster pool;
- current `Threat Cleared`;
- Threat requirement;
- Dungeon Boss;
- optional future special content.

---

## 32.1. Normal encounter selection

Normal monster:

- žaidėjas pats nepasirenka;
- atsitiktinai parenkamas iš dungeon pool.

Kiekvienas normal kill:

```text
+1 Threat Cleared
```

---

## 32.2. Threat Cleared

Pavyzdys:

```text
Threat Cleared: 14 / 20
```

Dabartiniame Whispering Woods:

```text
Boss requirement = 20
```

---

## 32.3. Threat gali viršyti requirement

Jeigu Auto Hunt Boss OFF:

```text
Threat gali būti 21 / 20
100 / 20
14850 / 20
```

Bosas lieka available.

Normal farming neturi sustoti ties 20.

---

## 32.4. Threat reset

Reset, kai:

- Dungeon Boss nužudomas;
- player miršta;
- Leave Dungeon;
- įeinama į kitą dungeon.

Nereset, kai:

- Inventory;
- Equipment;
- Research;
- Transmutation;
- Focus;
- Collection;
- Bestiary;
- kitas UI screen.

Combat gali tęstis fone.

---

# 33. Encounter recovery

## [PATVIRTINTA / IMPLEMENTUOTA KRYPTIS]

Tarp normal encounters pradinis tarpas:

```text
5 seconds
```

Out-of-combat HP regeneration:

```text
5× normal Health regeneration
```

Mirtis:

- HP → 0;
- Threat reset;
- nėra Gold penalty;
- nėra item loss;
- nėra Magic School level loss.

---

# 34. Dungeon Boss

Dungeon Boss:

- atrakinamas per Threat;
- turi repeatable loot;
- gali būti farmamas;
- gali būti Guild Request target;
- po kill resetina Threat.

---

# 35. Auto Hunt Boss

## [PATVIRTINTA]

Kiekvienas dungeon gali turėti:

```text
Auto Hunt Boss
```

Taisyklė:

- pirmą kartą boss turi būti nugalėtas manual;
- po to galima įjungti Auto Hunt;
- pasiekus Threat requirement, kitas tinkamas encounter tampa Boss;
- live normal enemy neturi būti vidury kovos pakeistas boss.

---

# 36. Main Boss

## [PATVIRTINTA]

Main Boss yra chapter / region progression gate.

Pirmasis Main Boss kill:

- visada kelia atitinkamų pagrindinių Magic Schools level cap;
- gali atrakinti naują regioną;
- gali atrakinti naują item tier;
- gali duoti permanent Focus;
- gali atrakinti Tower / Guild progresą.

Dabartinis Forest Heart:

```text
Magic School cap 10 → 20
```

Dabartinis provisional permanent Focus reward:

```text
+10 Max Focus
```

---

# 37. Guild

## [PATVIRTINTA KRYPTIS]

Guild yra antroji ilgalaikė progreso ašis.

Ji turi:

- Requests;
- Reputation;
- Rank;
- permanent rewards;
- future unlocks.

---

## 37.1. Dabartiniai starter Guild Requests

## [IMPLEMENTUOTA / BALANSAS]

### Arcane Supply

- donate 20 Fire Fragments;
- reward 50 Reputation.

### Clear the Woods

- kill 30 normal Whispering Woods monsters;
- reward 50 Reputation.

### Sentinel Breaker

- defeat Grove Sentinel 2 times;
- reward 75 Reputation.

---

## 37.2. Donation safety

Protected item:

- negali būti donated.

Partial donations turi išlikti.

Reward turi būti claiminamas vieną kartą.

---

## 37.3. Kill counters yra skirtingi

Žaidime gali egzistuoti:

1. current dungeon Threat;
2. Guild Request kill progress;
3. lifetime defeats / Bestiary count.

Jie neturi būti maišomi.

---

# 38. Dvi ilgalaikės progreso ašys

## [PATVIRTINTA]

### Main Boss progression

Atsako į:

> Koks gali būti mano mago power ceiling šiame chapter?

Ji valdo:

- Magic School cap;
- regionus;
- item/spell tiers;
- story progression.

### Guild progression

Atsako į:

> Kiek sistemų ir automation mano magas gali patogiai kontroliuoti?

Ji valdo:

- Focus;
- automation;
- Tower conveniences;
- future systems.

---

# 39. Offline Bank

## [PATVIRTINTA / IMPLEMENTUOTA FOUNDATION]

Offline laikas nėra automatiškai konvertuojamas į visų sistemų reward.

Jis kaupiamas:

```text
Offline Bank
```

Žaidėjas pats nusprendžia, kada jį panaudoti.

---

## 39.1. Dabartinis manual spend

## [IMPLEMENTUOTA]

Dabartiniai quick controls:

- 1m
- 5m
- 15m
- 1h

Vienas spend action šiuo metu maksimaliai simuliuoja:

```text
1 hour
```

---

## 39.2. Shared simulation

Offline Bank turi naudoti tą pačią gameplay logiką kaip live simulation.

Negalima turėti dviejų skirtingų reward sistemų:

```text
live logic
offline fake shortcut
```

Tai svarbu dėl:

- Mana;
- Transmutation;
- Research;
- Combat;
- Focus;
- death risk.

---

## 39.3. Offline Result Summary

## [IMPLEMENTUOTA KRYPTIS]

Po time skip turi būti parodyta rezultatų santrauka.

Ji gali apimti:

- kills;
- loot;
- crafted items;
- consumed materials;
- Research XP;
- school progression;
- boss/progression events;
- kitus reikšmingus pokyčius.

Tai yra transient report, ne permanent save data.

---

## 39.4. Offline Combat risk

## [PATVIRTINTA KRYPTIS]

Jeigu Combat simuliacijos metu player miršta:

- tai simuliacijai skirtas laikas sunaudojamas;
- Threat reset;
- planuotas Combat reward už nesėkmingą simuliaciją neturi būti garantuotas.

Tikslus ilgalaikis offline Combat modelis dar gali būti balansuojamas.

---

# 40. Collection / Bestiary progression philosophy

Collection ir Bestiary nėra tik kosmetiniai checklist.

Jie turi tapti naudingu knowledge layer.

### Collection

Padeda suprasti:

- ką jau radai;
- iš kur item gaunamas;
- kur jis naudojamas.

### Bestiary

Padeda suprasti:

- ką priešas daro;
- kokios jo traits;
- kokia jo attack sequence;
- ką jis dropina;
- kaip ruoštis kitai kovai.

---

# 41. Persistent UI shell

## [PATVIRTINTA KRYPTIS]

Žaidimas yra UI-first.

React DOM/CSS turi nešti pagrindinę sąveiką.

Three.js naudojamas:

- atmosferiniam background;
- lengviems efektams;
- vizualinei magijos atmosferai.

Jis neturi versti viso interface būti 3D.

---

# 42. Global Header

## [IMPLEMENTUOTA KRYPTIS]

Persistent header turi greitai parodyti:

### Mana

Svarbiausias resource widget.

- current / max;
- ilgesnis progress bar;
- Mana Flow;
- surplus / deficit;
- mėlynas Mana identity nepriklausomai nuo bendros theme.

### HP

- current / max;
- aiškus full-width progress bar savo widget viduje.

### Focus

- free;
- reserved;
- max;
- kompaktiškesnis už Mana.

### Top-right controls

- Offline Bank;
- Dev Tools;
- Edit UI;
- Settings / utility.

---

# 43. Activity Monitor

## [PATVIRTINTA / IMPLEMENTUOTA KRYPTIS]

Activity Monitor yra persistent floating activity overview.

Jis neturi uždengti pagrindinių screen panels.

Pageidaujama forma:

- prisiglaudęs prie dešinės;
- vertikalesnis / kylantis į viršų, o ne milžiniškas horizontalus blokas apačioje;
- collapsible.

---

## 43.1. Activity Monitor turinys

Jis turi rodyti realiai naudingą informaciją.

### Combat

- player HP;
- enemy HP;
- Threat;
- current / next enemy action;
- encounter status.

### Transmutation

- active recipes;
- Echo count;
- progress;
- output/hour;
- Mana demand;
- Focus.

### Research

- batches;
- target school;
- Echoes;
- items/hour;
- XP/hour;
- Mana demand;
- remaining ETA.

Lifetime kills Activity Monitor nereikalingi.

---

# 44. Tooltip sistema

## [PATVIRTINTA / IMPLEMENTUOTA]

Browser default `title` tooltip neturi būti naudojamas player-facing gameplay informacijai.

GameTooltip:

- theme-aware;
- maždaug **0.5 s hover delay**;
- vienu metu turi būti tik vienas active tooltip;
- neturi dubliuotis;
- neturi overlapinti kitų tooltip copies.

Tooltip naudojamas:

- items;
- monsters;
- spells;
- statuses;
- ambiguous controls;
- upgrade requirements.

---

# 45. Edit UI

## [PATVIRTINTA / IMPLEMENTUOTA KRYPTIS]

Desktop Edit UI leidžia:

- drag major panels;
- resize major panels;
- saugoti geometry per screen;
- Reset Current Layout;
- Reset All;
- redaguoti header resource widget proportions / positions ten, kur tai palaikoma.

Svarbiausia taisyklė:

> default layout turi atrodyti gerai ir be rankinio Edit UI.

Edit UI nėra pasiteisinimas blogiems defaultams.

---

# 46. UI consistency

Visi pagrindiniai screenai turi naudoti bendrą:

- content width;
- panel language;
- borders;
- filter button language;
- tooltips;
- typography;
- spacing;
- themed scrollbars.

New screen neturi išradinėti savo atsitiktinio UI stiliaus.

---

# 47. Inventory / Research / Transmutation UI pattern

Dabartinė naudinga UI kryptis:

```text
left:
library / selectable cards / filters

right:
inspection / detail / configuration

bottom or secondary:
active work / assignments / queue
```

Šis pattern gali būti naudojamas ir ateities sistemose, kai tinka.

Jis nėra privalomas visiems ekranams.

---

# 48. Save / Profiles

## [IMPLEMENTUOTA KRYPTIS]

Žaidimas turi local persistent save.

Svarbios taisyklės:

- normal update negali resetinti owned items;
- normal update negali resetinti school levels;
- schema changes turi turėti migration;
- autosave;
- save visibility / profile switching;
- gameplay state neturi priklausyti nuo transient UI state.

---

## 48.1. UI state

Tokie dalykai kaip:

- panel collapsed state;
- layout geometry;
- UI preferences;

turi išlikti pagal jų paskirtį, o ne restartinti kiekvieną kartą pakeitus screen.

---

# 49. Developer Tools

## [PATVIRTINTA / IMPLEMENTUOTA KRYPTIS]

Dev Tools yra svarbus nuolatinis development įrankis.

Jis turi leisti testuoti sistemas nelaukiant realaus grind.

---

## 49.1. Player resources

Developer turi galėti:

- keisti HP;
- keisti Mana;
- keisti Max Mana;
- pridėti Mana regen bonus;
- keisti Max Focus;
- pridėti Focus bonus;
- leisti testinį Mana over-cap;
- leisti testinį Focus over-reservation;
- God Mode.

---

## 49.2. Channeling

Developer gali:

- nustatyti Channeling Echo count;
- keisti Mana Pillar levels;
- testuoti Mana generation;
- testuoti discoveries.

---

## 49.3. Magic Schools / Research

Developer gali:

- nustatyti school level;
- pridėti / atimti XP;
- testuoti cap;
- kurti prepared research;
- keisti Echo assignment.

---

## 49.4. Inventory / Crafting

Developer gali:

- pridėti bet kokį item;
- pašalinti item;
- nustatyti quantity;
- unlock recipes;
- testuoti Transmutation;
- testuoti protected behavior.

---

## 49.5. Combat

Developer turi leisti:

- spawn konkretų monster;
- spawn boss;
- kill current enemy;
- nustatyti enemy HP;
- nustatyti Threat;
- testuoti traits;
- testuoti special attack sequence;
- clear statuses;
- ateityje tiesiogiai pridėti buff/debuff.

---

## 49.6. Debug taisyklė

Debug mode gali sąmoningai leisti invalid state testavimui.

Tačiau debug override:

- neturi tyliai pakeisti normal gameplay rule;
- turi būti aiškiai pažymėtas;
- neturi būti normal balance dalis.

---

# 50. Architecture / content organization

## [PATVIRTINTA KRYPTIS]

Projektas turi būti organizuotas taip, kad žmogui būtų lengva rasti turinį.

Pagrindinės grupės turi turėti savo folderius:

```text
screens/
  combat/
  inventory/
  equipment/
  collection/
  bestiary/
  tower/
  ...

game/content/
  monsters/
  spells/
  items/
  recipes/
  dungeons/
  guild/
  channeling/
  focus/
  ...
```

Monster data, spell data ir item data neturi būti sumesta į vieną milžinišką generic failą, kai content plečiasi.

---

## 50.1. Domain dependency taisyklė

Game / content / system sluoksniai neturi importuoti konkrečių Screen/UI implementacijų.

Shared metadata turi gyventi:

- game/content;
- game/systems;
- shared UI;
- kitame neutraliame sluoksnyje.

---

# 51. Current Item Archive architecture

## [IMPLEMENTUOTA]

Positive item grant turi eiti per bendrą acquisition logic, kad:

```text
inventory gain
+
Collection discovery
```

visada būtų sinchronizuoti.

Collection discovery neturi būti rankiniu būdu dubliuojamas kiekvienoje reward sistemoje.

---

# 52. Current Bestiary architecture

## [IMPLEMENTUOTA]

Bestiary entries yra derived iš authored `MONSTERS` data.

Screen neturi hardcodinti atskiro monster ID sąrašo.

Tai bus ypač svarbu plečiant Combat.

---

# 53. Pirmojo chapter pacing kryptis

## [SIŪLOMA / BALANSAS]

Pirmajame chapter sistemos turėtų atsirasti palaipsniui.

Apytikslė logika:

1. Mana / Channeling;
2. Transmutation fragmentai;
3. Research;
4. pirmi spells;
5. Focus;
6. Combat;
7. equipment;
8. Dungeon Boss;
9. Guild;
10. Main Boss.

Tikslus minučių pacing nėra source-of-truth.

Svarbesnė taisyklė:

> žaidėjas turi spėti suprasti vieną sistemą prieš gaudamas kitą didelę sistemą.

---

# 54. Art direction / asset philosophy

## [PATVIRTINTA KRYPTIS]

UI turi būti asset-efficient.

Svarbiausi individualūs assets:

- monster sprites / portraits;
- item icons;
- boss art;
- svarbūs world / region visuals.

Likęs interface gali būti kuriamas per:

- typography;
- borders;
- panels;
- gradients;
- subtle effects;
- shared icons;
- progress bars.

Nereikia didelės unikalios iliustracijos kiekvienam UI panel.

---

# 55. Open decisions

Šiame sąraše turi likti tik tai, ko tikrai dar nenusprendėme.

- [ ] Galutinis žaidimo pavadinimas.
- [ ] Pasaulio pavadinimas.
- [ ] Pagrindinio mago lore / istorija.
- [ ] Galutinis Main Boss ir regionų skaičius.
- [ ] Ar startuojant pasirenkamas „primary element“.
- [ ] Galutinė elemental resistance / weakness sistema.
- [ ] Pilnas buff / debuff / status effect modelis.
- [ ] Stack / refresh / cleanse taisyklės.
- [ ] Ar Combat turės interrupts / counters.
- [ ] Ar bosai turės formalias phases, ar tik sequence + traits.
- [ ] Galutinė spell progression per 300 levels.
- [ ] Vėliau atrakinamos Magic Schools.
- [ ] Summoning modelis.
- [ ] Galutinis material tier skaičius.
- [ ] Rank II+ Mana Pillars.
- [ ] Rank II+ Focus Improvement.
- [ ] Papildomi equipment slotai po MVP, jeigu jų reikės.
- [ ] Multiple saved equipment loadouts.
- [ ] Galutinė potion sistema ir charge reset taisyklės.
- [ ] Elite monster sistema.
- [ ] Galutiniai Guild Ranks.
- [ ] Guild Shop.
- [ ] Maksimali Offline Bank talpa.
- [ ] Galutinis Offline Combat risk modelis.
- [ ] Endgame struktūra.

---

# 56. Dalykai, kurie NEBĖRA open

Naujame pokalbyje šių klausimų nereikia iš naujo atidarinėti be aiškios priežasties.

### Research

- 4 prepared slots;
- 5 Research Echo pool;
- keli item batches vienu metu;
- kelios Magic Schools vienu metu;
- matching affinity 12 XP;
- current non-matching 8 XP.

### Transmutation

- Condensation atskiro screen nėra;
- Transmutation yra main crafting;
- iki 5 Echo;
- daugiau Echo = greitesnis recipe processing;
- Echo galima skirstyti per kelis recipes.

### Equipment

MVP 8 positions:

- Weapon;
- Offhand;
- Armor;
- Helmet;
- Cape;
- Amulet;
- Ring 1;
- Ring 2.

### Archive

- Collection = items;
- Bestiary = creatures.

### Focus Improvement

- Rank I = 10 levels;
- +5 Focus per level;
- Prismatic Fragment only.

---

# 57. Ateities sistemos

## [ATEIČIAI]

Šių sistemų nereikia implementuoti vien tam, kad projektas atrodytų didesnis.

- advanced auto-cast rule editor;
- Focus presets;
- many saved combat loadouts;
- high-tier Ritual Hall;
- elemental hybrid schools;
- combo spells;
- challenge dungeons;
- world events;
- expanded Summoning;
- extra Magic Schools;
- deep endgame Tower rooms;
- cosmetic Tower decoration;
- complex crafting quality system;
- random affix equipment system, nebent vėliau sąmoningai nuspręsta.

---

# 58. Artimiausias didelis dizaino darbas

## [KITAS DIZAINO ETAPAS] Combat

Prieš kuriant daug naujų monsters arba regionų verta pirmiausia užbaigti bendrą Combat foundation.

Rekomenduojama kitame atskirame Combat design dokumente nuspręsti:

1. universal Status Effect model;
2. buffs;
3. debuffs;
4. DoT / HoT;
5. Barrier;
6. resistances;
7. weaknesses;
8. immunity;
9. stacking;
10. duration / refresh;
11. trait trigger schema;
12. special attack effect schema;
13. player reaction / telegraph model;
14. auto-cast interaction;
15. boss phases arba jų nebuvimas;
16. death / recovery edge cases;
17. Bestiary display mapping;
18. Developer Combat tools;
19. combat log readability;
20. offline combat simulation interaction.

Svarbiausia:

> Combat mechanika ir Bestiary neturi būti kuriami kaip dvi atskiros duomenų sistemos.

---

# 59. Dabartinis Core Loop vienu sakiniu

> **SSS Wizard** yra mage-only incremental RPG apie vieną magą, kuris per Channeling kuria Mana infrastruktūrą, per Transmutation paverčia Maną ir lootą materialais bei equipmentu, per Research sunaikina pasirinktus materialus dėl Fire, Water, Earth arba Air XP, o ribotą Focus paskirsto Arcane Echoes ir auto-cast automatizacijai. Combat vyksta semi-automatic dungeon ciklais: monsteriai turi authored traits, special attacks ir kartojamas sekas, o normal kills didina `Threat Cleared` iki Dungeon Boss. Main Boss progresija kelia Magic School level cap, Guild suteikia antrą permanent progression ašį, Collection archyvuoja items, Bestiary archyvuoja creatures, o offline laikas kaupiamas pasirinktinai naudojamame Offline Bank. Viso progreso prestige reset nėra.

---

# 60. Taisyklė naujiems sistemų dokumentams

Prieš projektuojant naują sistemą:

1. patikrinti šį Core Concept;
2. patikrinti dabartinę GitHub implementaciją;
3. aiškiai išvardyti, ką sistema naudoja iš esamų mechanics;
4. vengti dubliuoti jau esamą resource ar progression axis;
5. nenaikinti senos sistemos tyliai;
6. jei reikia pakeisti Core Concept taisyklę — tai turi būti sąmoningas dizaino sprendimas;
7. po didelio patvirtinto pakeitimo atnaujinti šį Core Concept.

---

# 61. Trumpas source-of-truth checklist

- [x] Mage-only.
- [x] Vienas pagrindinis magas.
- [x] Wizard Tower.
- [x] Fire / Water / Earth / Air.
- [x] Mana yra pagrindinė energija.
- [x] Focus yra rezervuojama automation capacity.
- [x] Arcane Echoes atlieka paralelinį darbą.
- [x] Channeling daugiausia valdo Mana infrastruktūrą.
- [x] Condensation nebėra atskira sistema.
- [x] Transmutation yra main crafting.
- [x] Research sunaikina items dėl pasirinktos Magic School XP.
- [x] Research turi 4 prepared slots ir 5 Echo pool.
- [x] Transmutation turi 5 Echo pool.
- [x] Basic Attack Focus nenaudoja.
- [x] Manual spell pagal dabartinę kryptį Focus nenaudoja.
- [x] Auto-Cast rezervuoja Focus.
- [x] Combat gali vykti kartu su Tower veiklomis.
- [x] Monsteriai turi traits ir action sequences.
- [x] Special Attacks turi telegraphs.
- [x] Dungeon normal monster parenkamas iš pool.
- [x] Normal kill = +1 Threat.
- [x] Threat gali viršyti boss requirement.
- [x] Auto Hunt Boss atrakinamas po pirmo manual boss kill.
- [x] Main Boss kelia Magic School cap.
- [x] Collection yra item archive.
- [x] Bestiary yra creature archive.
- [x] Inventory yra current ownership.
- [x] 8 MVP equipment positions.
- [x] Offline Bank yra manual selectable simulation.
- [x] Offline spend turi results summary.
- [x] Persistent custom tooltip system.
- [x] Edit UI.
- [x] Developer Tools.
- [x] Nėra Prestige / Retirement.
- [ ] Pilnas Combat status/buff/debuff/resistance modelis — kitas didelis design etapas.

---

# 62. Vieta būsimiems patvirtintiems papildymams

Kai nauja sistema pilnai išdiskutuota ir priimta:

- jos pagrindinės taisyklės turi būti perkeltos į tinkamą šio dokumento sekciją;
- nepalikti svarbiausių taisyklių vien istoriniame „Phase X“ append;
- seną prieštaraujančią taisyklę pašalinti;
- provisional skaičius pažymėti `[BALANSAS]`;
- realiai veikiančius svarbius sprendimus galima pažymėti `[IMPLEMENTUOTA]`.

---

**END OF CURRENT CORE CONCEPT**

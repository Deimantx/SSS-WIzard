# SSS Wizard — Core Concept

> Pagrindinis redaguojamas žaidimo vizijos ir sistemų dokumentas.
>
> Dabartinis darbinis žaidimo pavadinimas: **SSS Wizard**.
>
> Šį failą galima pateikti naujame pokalbyje kaip pagrindinį projekto kontekstą. Jame aprašyta žaidimo tapatybė, sutartos taisyklės, dar derinamos vietos ir svarbiausi UI poreikiai. Jame sąmoningai nėra nereikalingų programavimo detalių.

| Greitas kontekstas | Dabartinė kryptis |
|---|---|
| Darbinis pavadinimas | **SSS Wizard** |
| Žanras | Mage-only incremental RPG / semi-automatic combat |
| Pagrindinis veikėjas | Vienas magas su savo Wizard Tower |
| Pradinės mokyklos | Fire, Water, Earth ir Air |
| Paralelinės veiklos | Valdomos per ribotą Focus ir Arcane Echoes |
| Pagrindinis progreso vartas | Main Boss keliami Magic School level cap |
| Papildoma progresija | Guild Requests ir Guild Rank |
| Prestige / Retirement | Nėra |
| Offline progresas | Kaupiamas Offline Bank ir pasirenkama simuliacija |

---

## 1. Dokumento paskirtis

Šio dokumento tikslas — vienoje vietoje išsaugoti dabartinę **SSS Wizard** mage-only incremental RPG kryptį, kad ją būtų galima:

- ramiai perskaityti kaip vientisą žaidimo koncepciją;
- redaguoti ir papildyti naujomis mintimis;
- pažymėti nepatinkančias arba dar neaiškias vietas;
- vėliau naudoti kuriant išsamesnius atskirų sistemų dokumentus;
- apsaugoti projektą nuo prieštaringų sprendimų ir bereikalingo sistemų išsiplėtimo.

### Kaip šį dokumentą naudoti kituose pokalbiuose

Pradedant naują pokalbį galima pridėti šį failą ir paprašyti jį laikyti pagrindiniu `source of truth` apie **SSS Wizard**. Naujos idėjos neturėtų tyliai pakeisti jau patvirtintų taisyklių. Jei nauja mintis prieštarauja dokumentui, pirmiausia reikia aiškiai parodyti prieštaravimą ir nuspręsti, kuri kryptis lieka.

Dokumente naudojamos žymos:

- **[PATVIRTINTA]** — kryptis jau aiškiai sutarta.
- **[SIŪLOMA]** — logiškas dabartinės krypties papildymas, bet dar galima keisti.
- **[BALANSAS]** — pati sistema sutarta, tačiau skaičiai ir tempas bus nustatomi vėliau.
- **[ATVIRA]** — sprendimas dar nepriimtas.
- **[ATEIČIAI]** — sistema, kurios pradinei žaidimo versijai nereikia.

---

## 2. Bendra žaidimo vizija

### [PATVIRTINTA] Pagrindinė fantazija

Žaidėjas valdo vieną vis galingesnį magą, turintį savo Wizard Tower.

Tai nėra žaidimas apie karių, skirtingų herojų ar didelės magų akademijos valdymą. Pagrindinis veikėjas visada yra tas pats magas. Progresuodamas jis:

- žaidimo pradžioje mokosi keturių pagrindinių elementinių magijos mokyklų;
- po tam tikrų pagrindinių bosų atrakina papildomas, vėlesnio žaidimo magijos mokyklas;
- plečia savo Wizard Tower;
- išmoksta kurti magiškas savo sąmonės projekcijas arba klonus;
- vis daugiau procesų valdo vienu metu;
- gamina ir naikina magiškus daiktus;
- kuria burtus, equipmentą ir kitus magiškus įrankius;
- tyrinėja pasaulį per kovines zonas ir dungeon;
- vykdo Guild Requests;
- kyla Guild Rank sistemoje;
- nugali pagrindinius bosus ir taip atrakina aukštesnius magijos lygius.

Žaidimo galios fantazija nėra vien didesni damage skaičiai. Žaidėjas turi jausti, kad jo magas tampa pajėgus vienu metu:

- kovoti;
- automatiškai naudoti kelis burtus;
- tyrinėti magiją;
- gaminti elementines medžiagas;
- transmutuoti equipmentą;
- vykdyti kelias Tower veiklas.

### [PATVIRTINTA] Žaidimas neturi Retirement sistemos

Žaidime nebus klasikinio prestige arba Retirement, kuris panaikina didžiąją dalį progreso ir priverčia viską pradėti iš naujo.

Progresas yra vientisas ir nuolatinis. Naują progreso etapą atrakina:

1. pagrindinio boso nugalėjimas;
2. magijos mokyklų maksimalaus lygio pakėlimas;
3. naujo regiono ar dungeon atrakinimas;
4. Guild Rank pakėlimas;
5. naujų Wizard Tower sistemų atrakinimas;
6. didesnė Focus talpa ir daugiau paralelinių veiklų.

Laikinai resetinamas tik konkretaus dungeon dabartinio bandymo kill count, o ne bendras žaidėjo progresas.

---

## 3. Pagrindiniai žaidimo dizaino principai

### 3.1. Visos sistemos turi būti susijusios

Kiekviena svarbi sistema turi maitinti bent vieną kitą sistemą:

- Channeling suteikia Maną;
- Mana naudojama daiktų gamybai, Research, Transmutation, burtams ir summons;
- sukurti arba rasti daiktai gali būti sunaikinti dėl magijos XP;
- magijos lygiai atrakina burtus ir receptus;
- Transmutation sukuria kovinį equipmentą;
- Combat suteikia retas medžiagas ir progresą;
- bosai pakelia magijos mokyklų level cap;
- Guild Requests sunaudoja farmintus daiktus ir kill count;
- Guild Rank atrakina didesnį Focus ir naujas sistemas.

Sistema neturėtų egzistuoti vien tam, kad turėtų atskirą XP juostą.

### 3.2. Žaidėjas nuolat renkasi tarp dabartinės galios ir ilgalaikio progreso

Tas pats resursas arba daiktas dažnai turėtų turėti kelis panaudojimus.

Pavyzdžiui, retą `Flame Orb` galima:

- sunaikinti dėl didelio Fire XP kiekio;
- panaudoti kuriant stiprią Fire lazdą;
- atiduoti Guild Request;
- išsaugoti vėlesniam Tower patobulinimui.

Tokie pasirinkimai turi būti aiškūs ir prasmingi, bet neturi reikalauti nuolatinio mikromanagemento.

### 3.3. Basic Combat visada įmanomas

Žaidėjas gali kovoti naudodamas basic attack ir neskirti Focus automatiniams burtams.

Tai leidžia visą Focus skirti:

- Research;
- elementinių daiktų gamybai;
- Transmutation;
- kitoms Tower veikloms.

Kai priešai tampa sunkesni, žaidėjas gali perkelti dalį arba visą Focus į combat auto-cast burtus.

### 3.4. Automatizacija yra pasirinkimas, o ne nemokamas patogumas

Rankinis combat burto panaudojimas gali būti atliekamas be rezervuoto Focus, tačiau to burto auto-cast rezervuoja dalį mago Focus. Ilgai trunkančios Tower veiklos, tokios kaip Research, elementinių daiktų gamyba ir Transmutation, taip pat rezervuoja Focus tol, kol jos vyksta.

Tai sukuria natūralią aktyvaus ir idle žaidimo pusiausvyrą:

- aktyvus žaidėjas gali rankiniu būdu panaudoti svarbius burtus;
- idle žaidėjas gali tą patį automatizuoti;
- automatizacija sumažina Focus, liekantį kitoms veikloms.

### 3.5. Pagrindiniai bosai yra tikri progreso vartai

Pagrindiniai bosai neturėtų būti tik dar vienas loot šaltinis. Pirmasis jų nugalėjimas:

- pakelia visų pagrindinių magijos mokyklų level cap;
- atrakina naują žaidimo etapą;
- gali atverti naują regioną;
- gali atrakinti naują Tower kambarį;
- gali padidinti maksimalų Focus;
- gali atrakinti naują daiktų arba burtų tier.

---

## 4. Pagrindinis žaidimo ciklas

### [PATVIRTINTA] Bendras ciklas

**Channeling → elementinių daiktų gamyba → daiktų naikinimas dėl Magic XP → nauji burtai ir receptai → Transmutation → Combat → bosas → aukštesnis level cap → naujas turinys**

Šalia šio ciklo nuolat veikia Guild progresija:

**Item donations / monster kills / boss kills / crafting užduotys → Guild Reputation → Guild Rank → permanentiniai bonusai ir naujos sistemos**

### Žaidimo ciklo paaiškinimas

1. Magas generuoja Maną per Channeling.
2. Magas arba jo klonai naudoja Maną elementinėms medžiagoms gaminti.
3. Medžiagos dedamos į specialų Wizard Tower Research kambarį.
4. Daiktai sunaikinami ir suteikia XP pasirinktai magijos mokyklai.
5. Magijos lygiai atrakina naujus burtus, receptus ir pasyvius efektus.
6. Per Transmutation kuriamas equipmentas ir kiti naudingi daiktai.
7. Žaidėjas eina į dungeon, žudo monstrus ir renka lootą.
8. Surinkus reikiamą dungeon kill count, galima iškviesti bosą.
9. Nugalėjus bosą gaunamas retas lootas, o dungeon kill count resetinamas.
10. Pirmą kartą nugalėjus pagrindinį bosą pakyla Magic School level cap.
11. Farminti daiktai ir kill count taip pat naudojami Guild Requests.
12. Aukštesnis Guild Rank atrakina daugiau Focus, automatizacijos ir žaidimo sistemų.

---

## 5. Pagrindiniai resursai

### 5.1. Mana

### [PATVIRTINTA KRYPTIS]

Mana yra pagrindinė magiška energija. Ji naudojama:

- aktyviems burtams;
- auto-cast burtams;
- elementinių fragmentų gamybai;
- Research procesams;
- Transmutation;
- daliai Tower patobulinimų;
- Summons palaikymui kovos metu;
- kai kuriems Guild Requests arba specialiems ritualams.

Mana turi:

- dabartinį kiekį;
- maksimalią talpą;
- regeneraciją per sekundę;
- galimus laikinus ir permanentinius bonusus.

### 5.2. Channeling

### [SIŪLOMA]

Channeling yra pagrindinis Mana gavimo ir magiškų medžiagų formavimo procesas.

Pradžioje Channeling gali būti paprastas aktyvus veiksmas. Labai greitai turi atsirasti galimybė jį automatizuoti, nes žaidimo esmė nėra nuolatinis vieno mygtuko spaudinėjimas.

Galimos Channeling kryptys:

- tiesioginis Mana generavimas;
- Mana regeneration didinimas;
- Mana capacity didinimas;
- neutralaus Arcane resurso gamyba;
- elementinių fragmentų kondensavimas;
- geresnis klonų ir Focus efektyvumas.

### 5.3. Neutralios magiškos medžiagos

### [ATVIRA]

Be elementinių medžiagų gali egzistuoti neutralūs resursai, pavyzdžiui:

- Arcane Essence;
- Raw Mana;
- Magic Dust;
- Unstable Energy;
- Pure Crystal.

Jie galėtų būti naudojami visuose elementuose, bendruose Tower patobulinimuose ir kaip jungiamasis Transmutation komponentas.

Galutinis neutralių resursų sąrašas dar nenuspręstas.

---

## 6. Keturios pradinės magijos mokyklos

### [PATVIRTINTA]

Žaidimo pradžioje egzistuoja keturios pagrindinės elementinės magijos mokyklos:

1. Fire;
2. Water;
3. Earth;
4. Air.

`Evocation`, `Warding` ir `Transmutation` nėra keturioms elementinėms mokykloms lygiaverčiai pradiniai pasirinkimai. Transmutation yra atskira daiktų kūrimo sistema, o puolimo, gynybos ir utility burtai paskirstomi tarp keturių elementų.

Šios keturios mokyklos yra early-game pagrindas, o ne būtinai visas galutinis magijos sąrašas. Papildomos mokyklos atrakinamos progresuojant ir nugalint nustatytus pagrindinius bosus.

### 6.1. Fire

Pagrindinės kryptys:

- didelis tiesioginis damage;
- burning ir damage over time;
- agresyvūs damage buffai;
- sprogimai ir kelių priešų atakos;
- rizikingi burtai, keičiantys gynybą į damage;
- Fire equipment ir Fire auto-cast buildai.

### 6.2. Water

Pagrindinės kryptys:

- healing;
- ice ir freeze efektai;
- priešų sulėtinimas;
- apsauga nuo Fire;
- prisitaikanti gynyba ir ilgesnės kovos.

Water mokykla gali apimti tiek vandenį, tiek ledą, kad nereikėtų atskiros penktos Ice mokyklos.

### 6.3. Earth

Pagrindinės kryptys:

- armor;
- barriers ir shields;
- maksimalus Health;
- fizinis atsparumas;
- stagger arba stun;
- lėtesni, bet stiprūs smūgiai;
- defensive ir tank buildai.

### 6.4. Air

Pagrindinės kryptys:

- attack speed;
- spell cooldown mažinimas;
- dodge ir evasion;
- chain attacks;
- kritiniai smūgiai;
- greitas, bet mažiau atsparus buildas;
- efektyvesnė auto-cast rotacija.

### 6.5. Pagrindinio elemento pasirinkimas

### [ATVIRA]

Galimas variantas: žaidimo pradžioje žaidėjas pasirenka pagrindinį elementą, tačiau visi keturi skillai vis tiek gali būti keliami.

Pagrindinis elementas galėtų suteikti:

- pirmą nemokamą to elemento burtą;
- nedidelį XP bonusą;
- mažesnes Mana sąnaudas;
- ankstyvą specialų receptą;
- kosmetinę Wizard Tower arba mago išvaizdos kryptį.

Dar nepatvirtinta, ar pagrindinis elementas apskritai reikalingas ir ar jį vėliau būtų galima pakeisti.

### 6.6. Vėliau atrakinamos magijos mokyklos

### [PATVIRTINTA KRYPTIS]

Po tam tikrų pagrindinių bosų žaidėjas atrakina papildomas magijos mokyklas. Jos neturi pakeisti keturių pradinių elementų, bet turi atverti naujus buildus, veiklas ir combat galimybes.

Viena svarstoma vėlesnė kryptis yra **Summoning**. Ji leistų iškviesti ir Mana palaikyti kovinius summons. Galutiniai papildomų mokyklų pavadinimai, jų skaičius ir atrakinimo tvarka dar nenustatyti.

---

## 7. Magic School XP ir level cap

### [PATVIRTINTA]

Fire, Water, Earth ir Air turi atskirus lygius bei XP.

Šių skillų negalima kelti be galo. Dabartinį maksimalų jų lygį nustato pagrindinės istorijos bosai.

### [BALANSAS] Pavyzdinė level cap struktūra

| Progreso etapas | Fire | Water | Earth | Air |
|---|---:|---:|---:|---:|
| Žaidimo pradžia | 10 | 10 | 10 | 10 |
| Pirmas pagrindinis bosas | 20 | 20 | 20 | 20 |
| Antras pagrindinis bosas | 40 | 40 | 40 | 40 |
| Trečias pagrindinis bosas | 60 | 60 | 60 | 60 |
| Ketvirtas pagrindinis bosas | 80 | 80 | 80 | 80 |
| Toliau | +20 už kiekvieną Main Boss | +20 | +20 | +20 |
| Penkioliktas pagrindinis bosas | 300 | 300 | 300 | 300 |

### [DABARTINIS TIKSLAS / BALANSAS]

Planuojama turėti maždaug **15 pagrindinių bosų** ir galutinį **300 Magic School level cap**. Dabartinė loginė seka: žaidimas prasideda su 10 lygių cap, pirmasis Main Boss pakelia jį iki 20, o kiekvienas kitas pagrindinis bosas — dar 20 lygių. Tikslus tempas galės būti koreguojamas balansuojant turinį.

### Level cap taisyklės

- Pasiekus dabartinį level cap, Research tam skillui turi automatiškai sustoti.
- Daiktas, kuris turėjo būti sunaikintas, neturi būti prarastas.
- Research eilė turi išlikti ir galėti tęstis pakėlus level cap.
- UI turi aiškiai parodyti, kodėl progresas sustojo.
- UI turi nurodyti, kurį pagrindinį bosą reikia nugalėti.
- Jau surinktas XP negali būti tyliai prarastas.

Pavyzdinis pranešimas:

> **Fire Level 10/10 — Level Cap Reached**  
> Nugalėk `Forest Heart`, kad visų Magic Schools maksimalus lygis padidėtų iki 20.

### [ATVIRA] XP ties dabartiniu cap

Galimi variantai:

1. XP visai negaunamas, o Research automatiškai sustoja;
2. dalis XP gali būti sukaupiama iki kito cap;
3. sukaupti galima tik ribotą kiekį XP.

Šiuo metu siūlomas saugiausias variantas — Research sustoja ir daiktų nenaikina.

---

## 8. Wizard Tower

### [PATVIRTINTA KRYPTIS]

Wizard Tower yra pagrindinė ne combat erdvė, kurioje magas valdo:

- Research;
- elementinių medžiagų gamybą;
- Transmutation;
- klonus arba Arcane Echoes;
- Focus paskirstymą;
- Tower patobulinimus;
- vėliau atrakinamas papildomas sistemas.

Tower neturi būti vien dekoratyvus meniu. Žaidėjas turi aiškiai suprasti, kuriame kambaryje vyksta kiekviena veikla.

### 8.1. Pradinis Research kambarys

Pagrindinė kambario funkcija — sunaikinti daiktus ir iš jų gauti XP pasirinktai magijos mokyklai.

Galimi pavadinimai:

- Arcane Crucible;
- Dissolution Chamber;
- Essence Extractor;
- Research Furnace.

Darbinis dokumento pavadinimas: **Arcane Crucible**.

### 8.2. Galimi vėlesni Tower kambariai

### [SIŪLOMA]

- **Channeling Chamber** — Mana ir elementinių medžiagų gamyba.
- **Arcane Crucible** — daiktų naikinimas dėl Magic XP.
- **Transmutation Laboratory** — equipmento ir kitų daiktų gamyba.
- **Mirror Chamber** — klonai, Arcane Echoes ir Focus patobulinimai.
- **Vault** — svarbių daiktų saugojimas ir apsauga nuo automatinio sunaikinimo.
- **Ritual Hall** — aukšto lygio ritualai ir specialūs atrakinimai.

Pradinei žaidimo versijai nereikia visų kambarių. Jie gali atsirasti palaipsniui per pagrindinių bosų ir Guild Rank progresiją.

---

## 9. Arcane Crucible Research sistema

### [PATVIRTINTA]

Research nevyksta vien todėl, kad magas laukia arba yra paskyręs paprastą tyrėją.

Žaidėjas:

1. pasirenka daiktą;
2. pasirenka norimą Magic School;
3. įdeda pasirinktą daiktų kiekį į Research eilę;
4. daiktas tam tikrą laiką naikinamas;
5. pasibaigus procesui daiktas dingsta;
6. pasirinkta magijos mokykla gauna XP.

### Paprastas pavyzdys

| Laukas | Reikšmė |
|---|---|
| Daiktas | Fire Fragment |
| Kiekis | 1 |
| Pasirinktas skillas | Fire |
| Trukmė | 5 sekundės |
| Rezultatas | 10 Fire XP |

Jeigu įdedama 12 fragmentų, eilė gali trukti 60 sekundžių ir sunaikinti juos po vieną.

### Research eilės taisyklės

- Žaidėjas pasirenka tikslų sunaikinamų daiktų kiekį.
- Užrakinti arba favoritu pažymėti daiktai negali būti sunaikinti.
- Equipmentas, kuris šiuo metu uždėtas, negali būti sunaikintas.
- Pasiekus level cap, eilė pristabdoma.
- Praradus Research skirtą Focus, progresas pristabdomas, bet neresetinamas.
- Grąžinus Focus, Research tęsiamas nuo tos pačios vietos.
- UI turi rodyti likusį laiką, sunaikinamų daiktų kiekį ir bendrą gaunamą XP.

### 9.1. Elemental Affinity

### [SIŪLOMA]

Bet kurį magišką daiktą galima nukreipti pasirinktos mokyklos XP, tačiau tinkamo elemento daiktas suteikia geresnį rezultatą.

Pavyzdys:

| Daiktas | Fire XP | Water XP | Earth XP | Air XP |
|---|---:|---:|---:|---:|
| Fire Fragment | 12 | 6 | 8 | 8 |
| Water / Ice Fragment | 6 | 12 | 8 | 8 |
| Earth Fragment | 8 | 8 | 12 | 6 |
| Air Fragment | 8 | 8 | 6 | 12 |
| Neutral Arcane Orb | 15 | 15 | 15 | 15 |

Tai leistų žaidėjui turėti pasirinkimą, bet skatintų naudoti tinkamo elemento medžiagas.

### [ATVIRA]

Reikia nuspręsti:

- ar priešingo elemento daiktai turi duoti mažiau XP;
- ar egzistuos elementų draugystės ir priešpriešos;
- ar visi nemagiški daiktai taip pat galės būti sunaikinti;
- ar equipmentas duos daug daugiau XP nei paprastos medžiagos;
- ar pirmą kartą sunaikintas unikalus daiktas suteiks papildomą Discovery bonusą.

---

## 10. Elementinių daiktų gamyba

### [PATVIRTINTA KRYPTIS]

Magas ir jo klonai gali gaminti elementines medžiagas, panašias į:

- Fire Fragments;
- Water arba Ice Fragments;
- Earth Fragments;
- Air Fragments;
- vėlesnius Crystals;
- vėlesnius Orbs;
- aukšto lygio Cores ir kitas retas medžiagas.

Ši gamyba naudoja Maną, laiką ir Focus.

### Pavyzdinis pradinis veiksmas

| Veiksmas | Mana | Trukmė | Rezultatas |
|---|---:|---:|---|
| Condense Fire Fragment | 15 | 6 s | 1 Fire Fragment |
| Condense Water Fragment | 15 | 6 s | 1 Water Fragment |
| Condense Earth Fragment | 15 | 6 s | 1 Earth Fragment |
| Condense Air Fragment | 15 | 6 s | 1 Air Fragment |

Visi skaičiai yra **[BALANSAS]**.

### 10.1. Siūloma medžiagų tier progresija

| Tier | Bendra forma | Fire pavyzdys | Water pavyzdys |
|---|---|---|---|
| T1 | Fragment | Fire Fragment | Water Fragment |
| T2 | Crystal | Ember Crystal | Ice Crystal |
| T3 | Orb | Flame Orb | Frost Orb |
| T4 | Core | Inferno Core | Glacial Core |
| T5 | Primordial Material | Primordial Flame | Primordial Tide |

Aukštesnio tier daiktai gali:

- suteikti daugiau Research XP;
- būti naudojami stipresniam equipmentui;
- būti reikalingi Guild Rank misijoms;
- būti reikalingi Tower patobulinimams;
- reikalauti dungeon arba boss komponentų.

### 10.2. Apsauga nuo uždaro automatinio XP ciklo

Jeigu žaidėjas gali be apribojimų gaminti fragmentus ir iš karto juos naikinti dėl XP, visa sistema gali tapti per daug automatinė ir prarasti Combat reikšmę.

Todėl aukštesniems tier turi reikėti bent vieno iš šių dalykų:

- dungeon medžiagų;
- boss catalyst;
- Guild medžiagų;
- specifinio monster drop;
- naujame regione randamo komponento.

Paprastus fragmentus galima gaminti Tower viduje, bet geriausias progresas turi reikalauti Combat.

---

## 11. Focus sistema

### [PATVIRTINTA]

Focus reiškia, kiek sudėtingų automatinių veiksmų magas gali kontroliuoti vienu metu.

Focus nėra:

- Mana;
- sunaudojamas resursas;
- energija, kuri lėtai atsistato;
- atskiras combat damage skaičius.

Focus yra rezervuojama talpa.

Jeigu magas turi 100 maksimalaus Focus ir aktyvios veiklos rezervuoja 75, lieka 25 laisvo Focus.

### 11.1. Veiklos, kurioms Focus nereikia

- basic attack;
- judėjimas tarp UI ekranų;
- inventory ir equipment valdymas;
- rankinis daikto pasirinkimas;
- rankinis combat burto panaudojimas, jeigu paliekama siūloma taisyklė;
- neautomatiniai momentiniai veiksmai.

### 11.2. Veiklos, kurios rezervuoja Focus

- kiekvienas aktyvus combat auto-cast burtas;
- automatinis Research;
- elementinių medžiagų gamyba;
- Transmutation procesai;
- automatinis Channeling;
- klonų atliekamos užduotys;
- vėlesnės automation taisyklės.

### 11.3. Pradinė taisyklė

### [PATVIRTINTA]

Nuo pat žaidimo pradžios galima vienu metu kovoti ir vykdyti bent vieną kitą veiklą.

Basic attack Focus nenaudoja. Todėl žaidėjas gali:

- basic attacku farminti silpnus monstrus;
- visą Focus skirti Research ir crafting;
- dalį Focus perkelti į auto-cast, kai priešai tampa stipresni;
- prieš bosą sustabdyti kitas veiklas ir visą Focus skirti combat automatizacijai.

### 11.4. Pavyzdinis Focus paskirstymas

### [BALANSAS]

| Veikla | Rezervuotas Focus |
|---|---:|
| Fire Bolt auto-cast | 10 |
| Healing Wave auto-cast | 25 |
| Ice Barrier auto-cast | 20 |
| Fire Research | 25 |
| Transmutation | 20 |
| Iš viso | 100 |

Tikslūs Focus skaičiai bus nustatomi vėliau.

### 11.5. Focus paskirstymo tipai

#### Farming paskirstymas

- basic attack;
- daug Focus Research;
- elementinių medžiagų gamyba;
- Transmutation;
- minimalus arba joks auto-cast.

#### Sunkaus dungeon paskirstymas

- keli combat auto-cast burtai;
- vienas gydymo arba apsaugos burtas;
- dalis Research tęsiama lėčiau;
- Transmutation gali būti pristabdyta.

#### Boss paskirstymas

- beveik visas Focus skiriamas combat;
- Research ir crafting laikinai sustabdomi;
- aktyvuojamas pilnas puolimo, gydymo ir gynybos burtų rinkinys.

### 11.6. Rankinis spell casting

### [SIŪLOMA]

Rankinis burto panaudojimas:

- naudoja Maną;
- laikosi įprasto cooldown;
- nerezervuoja Focus.

To paties burto auto-cast:

- naudoja tokią pačią Maną;
- laikosi to paties cooldown;
- rezervuoja Focus tol, kol auto-cast įjungtas.

Tai suteikia aktyviam žaidėjui pranašumą, tačiau vėliau tą patį veiksmą galima automatizuoti didinant Focus.

### 11.7. Focus didinimas

Focus gali būti gaunamas iš:

- pagrindinių bosų;
- Guild Rank;
- Mirror Chamber patobulinimų;
- retų quest rewardų;
- specialaus equipment;
- aukšto lygio magijos gebėjimų.

### [ATVIRA]

Reikia nuspręsti, ar Focus equipment:

- tiesiogiai didins maksimalų Focus;
- mažins konkrečių auto-cast burtų Focus kainą;
- gerins tik Research arba crafting automatizaciją;
- konkuruos su tiesioginiu combat equipmentu.

### [PAGEIDAUJAMA KRYPTIS]

Paprasčiausia ir šiuo metu labiausiai pageidaujama Focus equipment taisyklė — toks equipmentas tiesiogiai didina maksimalų Focus. Sudėtingesni Focus kainos mažinimo efektai gali atsirasti vėliau ant retesnių daiktų, jeigu jų reikės buildų įvairovei.

---

## 12. Klonai ir Arcane Echoes

### [PATVIRTINTA KRYPTIS]

Pats magas vienu metu atlieka daug skirtingų veiklų pasitelkdamas magiškus savo klonus, projekcijas arba sąmonės atvaizdus.

Galimi pavadinimai:

- Arcane Echoes;
- Mirror Clones;
- Astral Projections;
- Thought Forms;
- Arcane Copies.

Darbinis pavadinimas: **Arcane Echoes**.

### Klonų paskirtis

Klonai paaiškina, kaip pagrindinis magas tuo pačiu metu gali:

- kovoti;
- Research kambaryje naikinti daiktus;
- Channeling kambaryje gaminti fragmentus;
- Transmutation Laboratory gaminti equipmentą;
- valdyti automatinius burtus.

### Svarbus supaprastinimas

### [SIŪLOMA]

Klonai neturėtų tapti atskirais veikėjais su savo:

- inventory;
- equipmentu;
- ilgomis individualiomis skill sistemomis;
- nuolatine priežiūra;
- dideliu atskirų statistikos skaičių kiekiu.

Pagrindinis valdymo mechanizmas lieka Focus. Klonai yra aiškus pasaulio paaiškinimas ir vizualus aktyvių užduočių atvaizdavimas.

### Galimi klonų patobulinimai

- daugiau maksimalaus Focus;
- papildoma paralelinė veikla;
- mažesnė Research Focus kaina;
- mažesnė Transmutation Focus kaina;
- greitesnė elementinių fragmentų gamyba;
- galimybė automatiškai pakeisti užduotį;
- galimybė palaikyti daugiau auto-cast burtų.

---

## 13. Burtų sistema

### [PATVIRTINTA KRYPTIS]

Burtai atrakinami keliant Fire, Water, Earth ir Air lygius.

Burtai neturi būti vien tiesiog skirtingos spalvos damage atakos. Jie gali būti:

- tiesioginės atakos;
- damage over time;
- healing;
- barriers;
- buffs;
- debuffs;
- cooldown kontrolė;
- status efektai;
- Mana valdymas;
- fragmentų arba kitų daiktų gamyba;
- Tower veiklų sustiprinimas.

### Burtų panaudojimo būdai

1. **Basic attack** — automatinis, Focus nereikalaujantis pagrindinis puolimas.
2. **Rankinis cast** — žaidėjas pats paspaudžia burtą.
3. **Auto-cast** — burtas naudojamas automatiškai ir rezervuoja Focus.
4. **Palaikomas burtas** — veikia nuolat, kol pakanka Mana ir Focus.
5. **Utility burtas** — veikia už Combat ribų, pavyzdžiui, gamina fragmentus.

### Auto-cast valdymas

UI turi leisti:

- įjungti ir išjungti konkretų burtą;
- matyti jo Focus kainą;
- matyti Mana kainą;
- matyti cooldown;
- nustatyti paprastą prioritetą;
- matyti, kodėl burtas šiuo metu nepanaudojamas.

### [ATEIČIAI] Išplėstinės auto-cast sąlygos

Vėliau galėtų būti atrakinamos taisyklės:

- gydyti tik tada, kai Health mažiau nei 50%;
- naudoti barrier tik tada, kai jis neaktyvus;
- taupyti Maną, kai jos mažiau nei 25%;
- naudoti stiprų burtą tik prieš elite arba boss;
- sustabdyti utility auto-cast Combat pradžioje.

Pradžioje užtenka paprasto įjungimo, išjungimo ir prioritetų.

---

## 14. Transmutation ir daiktų kūrimas

### [PATVIRTINTA KRYPTIS]

Transmutation yra magiškas craftingas. Ji naudoja:

- elementines medžiagas;
- neutralias magiškas medžiagas;
- monster loot;
- boss loot;
- Maną;
- laiką;
- rezervuotą Focus.

### Transmutation paskirtis

- kurti combat equipmentą;
- kurti Tower patobulinimų komponentus;
- jungti žemesnio tier medžiagas į aukštesnes;
- gaminti Guild Requests reikalingus daiktus;
- kurti potions, runes, catalysts ir kitus build elementus.

### Svarbios taisyklės

- Praradus Transmutation skirtą Focus, procesas pristabdomas, o ne resetinamas.
- Žaidėjas turi matyti, kiek daiktų bus pagaminta ir kiek resursų bus sunaudota.
- Favoritu pažymėti daiktai negali būti automatiškai sunaudojami.
- Receptai turi aiškiai rodyti, iš kur gaunamas kiekvienas komponentas.
- Kai trūksta resurso, UI turi nurodyti jo šaltinį.

### 14.1. Reusable potions

### [SIŪLOMA]

Potions nėra visam laikui sunaudojamos. Jos yra equipment arba combat loadout dalis su ribotu panaudojimų skaičiumi per visą dungeon loop, o ne per kiekvieną atskirą monster encounter.

Pavyzdys:

| Daiktas | Efektas | Panaudojimai |
|---|---|---:|
| Healing Elixir | Atkuria Health | 5 per dungeon loop |

Sėkmingas dungeon loop užbaigiamas nužudžius bosą. Po boso mirties potion charges atsistato kitam loop.

Tai apsaugo žaidėją nuo noro kaupti consumables ir niekada jų nenaudoti.

### [ATVIRA]

Dar reikia nuspręsti, ar potion charges taip pat pilnai atsistato po nesėkmingo loop, kai žaidėjas miršta arba pats palieka dungeon.

---

## 15. Equipment ir buildai

### [SIŪLOMA KRYPTIS]

Equipmentas turi keisti žaidimo stilių, o ne vien suteikti daugiau bendro damage.

Galimos equipment savybės:

- konkretaus elemento damage;
- healing power;
- Mana regeneration;
- Mana capacity;
- auto-cast Focus kainos mažinimas;
- Research Focus kainos mažinimas;
- didesnis fragmentų gamybos greitis;
- papildomi status efektai;
- resistance konkrečiam elementui;
- basic attack sustiprinimas;
- konkretaus burto pakeitimas.

### Galimi buildų pavyzdžiai

- Fire burst build;
- Water sustain build;
- Earth barrier build;
- Air speed build;
- basic attack farming build;
- low-Focus manual casting build;
- high-Focus full automation build;
- Research farming build.

### [ATVIRA]

Reikia vėliau nuspręsti:

- galutinius equipment slotus;
- ar bus atskiri wand ir focus daiktai;
- ar armor turės elementinius tipus;
- ar žaidėjas galės išsaugoti kelis loadout;
- ar equipmentą bus galima sunaikinti Arcane Crucible;
- kaip dažnai daiktai turėtų būti keičiami.

---

## 16. Combat sistema

### [PATVIRTINTA KRYPTIS]

Combat yra pusiau automatinis:

- pagrindinis basic attack vyksta automatiškai;
- burtus galima naudoti rankiniu būdu;
- burtus galima automatizuoti skiriant Focus;
- equipmentas ir pasirinktų burtų rinkinys formuoja buildą;
- žaidėjas gali tęsti Research ir crafting Combat metu, jeigu tam palieka Focus.

### Pagrindinis combat pasirinkimas

Kiekvienoje situacijoje žaidėjas sprendžia:

> Ar noriu greičiau ir saugiau nugalėti priešą, ar dalį savo Focus palikti ilgalaikiam progresui?

### Basic attack reikšmė

Basic attack turi išlikti naudingas:

- silpnų priešų farmingui;
- mažo dėmesio Combat;
- buildams, kurie visą Focus skiria Tower veikloms;
- situacijoms, kai trūksta Mana.

Tačiau sunkūs priešai ir bosai turi skatinti naudoti magiją, gynybinius burtus bei tinkamą buildą.

### 16.1. Monster basic ir special attacks

### [PATVIRTINTA]

Monstrai nekovoja vien tik vienodu basic attack. Kiekvienas monster gali turėti nustatytą veiksmų seką, kuri kartojasi visos kovos metu.

Paprasto monstro su viena special attack sekos pavyzdys:

> 2 basic attacks → 1 special attack → sekos pradžia

Pažangesnio monstro su dviem special attacks sekos pavyzdys:

> 2 basic attacks → special attack A → 3 basic attacks → special attack B → sekos pradžia

Paprasti early-game monstrai paprastai turi vieną special attack. Bosai turi turėti bent dvi skirtingas special attacks, o vėlesni ir svarbesni bosai gali turėti dar sudėtingesnes sekas.

Žaidėjas turi galėti išmokti priešo seką, matyti artėjančią special attack ir pagal ją pasirinkti gydymą, barrier, resistance arba kitą atsaką.

### 16.2. Monster traits

### [PATVIRTINTA KRYPTIS]

Be veiksmų sekos monstrai gali turėti pasyvius arba sąlyginius traits. Trait nėra atskiras nuolat spaudžiamas veiksmas — tai taisyklė, keičianti monstro kovą.

Pavyzdžiai:

- kiekviena sėkminga monstro ataka turi 50% tikimybę uždėti 10 sekundžių `Burn` damage-over-time efektą;
- kai monstro Health pirmą kartą nukrenta iki 40% arba mažiau, jis vieną kartą per kovą gauna absorb shield, lygų 30% jo maksimalaus Health;
- monster turi padidintą atsparumą vienam elementui;
- monster sustiprėja po nustatyto basic attack skaičiaus.

Traits ir special attacks turi būti matomi monster informacijoje bei tooltip, kad kovos būtų buildų ir pasiruošimo užduotys, o ne paslėptų taisyklių spėliojimas.

### 16.3. Combat informacijos išankstinis parodymas

Combat UI turi rodyti:

- žaidėjo basic attack progresą;
- priešo basic attack progresą;
- priešo artėjančios special attack progresą;
- dabartinę priešo veiksmų sekos vietą;
- aktyvius status efektus ir likusią jų trukmę.

### Mirtis

### [PATVIRTINTA DALIS]

Mirus dungeon viduje:

- dabartinis dungeon kill count resetinamas;
- boss readiness prarandamas;
- bendras monster kill count ir Collection progresas išlieka;
- permanentiniai daiktai ar magijos lygiai neprarandami.

### [PATVIRTINTA] Mirties ir recovery taisyklės

- Mirties momentu Health nukrenta iki 0.
- Pasibaigus kovai Health regeneruojasi penkis kartus greičiau už bazinę Health regeneration, kol nepradedama kita combat activity.
- Tarp įprastų combat encounters pradžioje yra 5 sekundžių tarpas, per kurį pasirodo naujas priešas. Šį laiką vėliau galima trumpinti patobulinimais.
- Žaidėjas gali įjungti automatinį endless dungeon loop kartojimą.
- Mirtis neturi papildomos Gold, daiktų arba ilgalaikio progreso bausmės.
- Pagrindinė mirties bausmė yra prarastas dabartinio dungeon bandymo `Threat Cleared` progresas.
- Jeigu Combat simuliuojamas naudojant Offline Bank ir simuliacijos metu žaidėjas miršta, visas tai simuliacijai skirtas laikas prarandamas be atlygio.

---

## 17. Dungeon struktūra

### [PATVIRTINTA]

Kiekvienas dungeon turi laikiną dabartinio bandymo kill count. Žaidėjas turi nužudyti nustatytą kiekį monstrų, kad galėtų iškviesti bosą.

### Pavyzdinis ciklas

1. Žaidėjas įeina į dungeon.
2. Dungeon progresas prasideda nuo `0/20`.
3. Kitas priešas atsitiktinai parenkamas iš to dungeon monster pool.
4. Kiekvienas nužudytas tinkamas monstras didina dabartinio bandymo count.
5. Pasiekus `20/20`, atsirakina `Engage Boss`.
6. Pirmą kartą bosą žaidėjas pradeda rankiniu būdu; jau nugalėtam bosui galima įjungti `Auto Hunt Boss`.
7. Nugalėjus bosą gaunamas boss lootas.
8. Dungeon kill count grįžta į `0/20`.
9. Ciklą galima kartoti ir dar kartą farminti bosą.

### Kill count resetinamas, kai:

- nužudomas bosas;
- žaidėjas miršta nuo paprasto monstro;
- žaidėjas miršta nuo boso;
- žaidėjas pasirenka `Leave Dungeon`;
- žaidėjas pereina į kitą dungeon.

### Kill count neresetinamas, kai:

- žaidėjas atidaro Inventory;
- žaidėjas atidaro Equipment;
- žaidėjas atidaro Wizard Tower;
- žaidėjas peržiūri Research;
- žaidėjas pakeičia Focus paskirstymą;
- žaidėjas pakeičia auto-cast nustatymus;
- žaidėjas tiesiog pakeičia UI ekraną, bet nepalieka dungeon.

Combat turi galėti tęstis fone, kol žaidėjas valdo kitas savo mago sistemas.

### 17.1. Dungeon Progress pavadinimas

### [PATVIRTINTA]

Dungeon bandymo progresas vadinamas **Threat Cleared**. UI kartu turi rodyti aiškų skaitinį kill count, pavyzdžiui:

> **Threat Cleared: 14 / 20**

### 17.2. Ar visi monstrai duoda vienodą dungeon progresą?

### [PATVIRTINTA]

- Kiekvienas dungeon monstras suteikia `+1 Threat Cleared`.
- Stipresni įprasti monstrai nesuteikia daugiau progreso.
- Bosui atrakinti nereikia nužudyti konkretaus kiekio kiekvieno monster tipo.
- Žaidėjas pats nesirenka kito įprasto priešo.
- Kiekvienas dungeon turi savo monster pool, iš kurio priešai parenkami atsitiktinai.
- Vėliau monster pool gali turėti rečiau pasirodančius elite priešus, tačiau elite sistema nėra būtina pradinei versijai.

### 17.3. Threat Cleared virš reikalavimo

### [PATVIRTINTA]

Pasiekus boso reikalavimą, kill count nesustoja ties nustatyta riba. Jeigu `Auto Hunt Boss` išjungtas, žaidėjas gali toliau farminti įprastus monstrus, pavyzdžiui, pasiekti `14 850 / 20 Threat Cleared`. Bosas lieka paruoštas ir gali būti iškviestas vėliau.

---

## 18. Bosų sistema

### 18.1. Dungeon Boss

Dungeon Boss:

- atrakinamas surinkus reikiamą dungeon kill count;
- turi pakartotiną loot table;
- gali būti farmamas daug kartų;
- suteikia retas Transmutation medžiagas;
- gali būti Guild Request tikslas;
- po kiekvieno nužudymo resetina dungeon kill count.

### 18.2. Main Boss

Main Boss yra svarbus regiono arba chapter bosas.

Pirmasis jo nugalėjimas gali:

- visada pakelia visų tuo metu level cap naudojančių pagrindinių Magic Schools level cap;
- atrakinti naują regioną;
- duoti permanentinį Focus bonusą;
- atrakinti naują Tower kambarį;
- atrakinti aukštesnį daiktų tier;
- atrakinti naują Guild Rank etapą;
- tęsti pagrindinę istoriją.

Po pirmojo nugalėjimo Main Boss taip pat gali būti farmamas dėl jo unikalaus looto.

### 18.3. Boss loot

### [SIŪLOMA]

Boss lootas gali turėti:

- garantuotą pirmo nužudymo reward;
- bendrą pakartotiną loot table;
- retą unikalų daiktą;
- boss catalyst;
- equipmentą;
- Tower upgrade komponentą;
- Guild Reputation arba specialų token.

Svarbu, kad pirmasis kill visada jaustųsi reikšmingas, net jei retas equipmentas neiškrenta.

### 18.4. Boss auto-engage

### [PATVIRTINTA]

- Kiekvienas dungeon turi `Auto Hunt Boss` jungiklį.
- Automatinio boso medžiojimo funkcija nereikalauja aukšto Guild Rank ir yra prieinama nuo pirmojo boso.
- Konkretaus dungeon `Auto Hunt Boss` galima įjungti tik tada, kai to dungeon bosas bent kartą nugalėtas rankiniu būdu.
- Įjungus `Auto Hunt Boss`, sistema automatiškai pradeda boso kovą vos surinkus reikalingą `Threat Cleared` kiekį.
- Jeigu funkcija išjungta, įprastų monstrų farmingas tęsiasi ir pasiekus boso reikalavimą.
- Žaidimas neprivalo sustoti ties `Boss Ready` būsena.

---

## 19. Guild sistema

### [PATVIRTINTA KRYPTIS]

Vietoje paslėptų Storylines pagrindinė papildoma progresija yra Guild Missions ir Guild Requests.

Guild suteikia:

- aiškius tikslus;
- farmintų daiktų sunaudojimo būdą;
- ilgalaikį monster kill progresą;
- permanentinius rewardus;
- Guild Rank;
- naujų sistemų atrakinimus.

### 19.1. Guild Requests

Guild Requests yra mažesnės arba kartojamos užduotys.

Pavyzdžiai:

- atiduoti 100 Fire Fragments;
- nužudyti 100 Forest Wisps;
- pagaminti 25 Apprentice Wands;
- nugalėti konkretų dungeon bosą 5 kartus;
- surinkti 10 Beast Cores;
- atiduoti 5 Flame Orbs;
- panaudoti Water magiją prieš konkretų priešą;
- užbaigti dungeon nė karto nemirus.

Galimi rewardai:

- Gold;
- Guild Reputation;
- Guild Tokens;
- Focus;
- retos medžiagos;
- receptai;
- Tower upgrade dalys;
- kosmetiniai rewardai.

### 19.2. Item donation taisyklės

### [SIŪLOMA]

- Atiduoti daiktai išnyksta.
- Favoritu pažymėti daiktai automatiškai neatiduodami.
- Žaidėjas aiškiai mato, kiek dar trūksta.
- Galima atiduoti po dalį, nereikia turėti visko vienu metu.
- Request neturėtų pasibaigti be įspėjimo ir panaikinti jau atiduotą progresą.
- UI turi parodyti, kur geriausia gauti prašomą daiktą.

### 19.3. Monster kill Requests

Guild Request kill count yra atskiras nuo laikino dungeon kill count.

Pavyzdžiui:

- dungeon bandymo progresas gali resetintis mirus;
- `Kill 100 Forest Wisps` Guild Request progresas išlieka;
- bendras Collection arba lifetime kill count taip pat išlieka.

Taigi žaidime gali būti trys skirtingi kill count:

1. dabartinio dungeon bandymo count;
2. aktyvaus Guild Request count;
3. bendras viso žaidimo monster kill count.

UI turi juos aiškiai atskirti.

### 19.4. Guild Rank Missions

Guild Rank Missions yra vienkartiniai svarbūs tikslai.

Pavyzdys:

> **Rank II reikalavimai**
>
> - įvykdyti 5 Guild Requests;
> - nužudyti 500 monstrų;
> - nugalėti 3 skirtingus dungeon bosus;
> - atiduoti 1 Elemental Orb.

Pakėlus Rank gaunamas didelis permanentinis bonusas arba atrakinama nauja sistema.

### 19.5. Pavyzdiniai Guild Ranks

### [BALANSAS / ATVIRA]

| Rank | Pavyzdinis atrakinimas |
|---|---|
| Initiate | Guild Requests |
| Apprentice | Guild Shop ir papildomas Focus |
| Adept | Antra Research eilė arba geresnis klonas |
| Expert | Pakartotinio dungeon farming automatizacija |
| Master | Išplėstinės auto-cast taisyklės |
| Archmage | Aukšto tier Tower ir endgame sistemos |

Rank pavadinimai, jų skaičius ir konkretūs rewardai dar nenuspręsti.

### 19.6. Guild Shop

### [ATVIRA]

Galima Guild Tokens panaudojimo vieta:

- retos neutralios medžiagos;
- trūkstami fragmentai;
- specialūs receptai;
- Focus upgrade komponentai;
- kosmetika;
- sunkiai gaunamų boss medžiagų ribotas kiekis.

Guild Shop neturėtų visiškai pakeisti Combat farming, bet gali suteikti apsaugą nuo labai blogo loot atsitiktinumo.

---

## 20. Dvi ilgalaikės progreso ašys

### [PATVIRTINTA KRYPTIS]

Žaidimo ilgalaikis progresas dalinamas į dvi pagrindines kryptis.

| Progreso kryptis | Pagrindinė paskirtis |
|---|---|
| Main Boss progresas | Magic School level cap, regionai, burtų ir item tier |
| Guild Rank progresas | Focus, automatizacija, Tower sistemos, patogumo atrakinimai |

Main Boss progresas atsako į klausimą:

> Kiek galingas gali tapti mano magas šiame žaidimo etape?

Guild Rank progresas atsako į klausimą:

> Kiek sudėtingų procesų ir automatizacijos mano magas gali valdyti?

Šios dvi kryptys neturi viena kitos visiškai pakeisti. Norint patogiai progresuoti reikia tiek nugalėti bosus, tiek vykdyti Guild veiklas.

---

## 21. Offline Bank

### [PATVIRTINTA KRYPTIS]

Laikas, kurį žaidėjas praleidžia nežaisdamas, kaupiamas į **Offline Bank**. Sugrįžęs žaidėjas gali pats pasirinkti, kuriai veiklai ir kiek sukaupto laiko panaudoti.

Offline Bank nėra tiesiog automatinis visų sistemų reward langas. Jis leidžia sąmoningai praleisti laiką ir simuliuoti, kas būtų įvykę pasirinktoje veikloje.

### Pagrindinės taisyklės

- Nežaidžiant sukauptas laikas pridedamas prie Offline Bank.
- Žaidėjas pasirenka veiklą, kuriai nori panaudoti banko laiką.
- Galima pasirinkti, kiek laiko simuliuoti, o ne privalomai sunaudoti visą banką.
- Simuliacija turi naudoti dabartinį buildą, Focus paskirstymą, auto-cast, Mana balansą ir kitus tuo metu aktyvius nustatymus.
- Prieš patvirtinant simuliaciją UI turi aiškiai parodyti pasirinktą veiklą, naudojamą laiką ir pagrindines rizikas.
- Tower veiklos gali būti simuliuojamos pagal jų gamybos, Research arba Transmutation greitį.
- Combat simuliacija turi atsižvelgti į realią mirties galimybę.

### Combat simuliacijos rizika

Jeigu Offline Bank Combat simuliacijos metu magas miršta:

- visas tai konkrečiai simuliacijai skirtas Offline Bank laikas laikomas sunaudotu;
- už tą simuliaciją negaunamas planuotas Combat atlygis;
- dabartinis dungeon `Threat Cleared` progresas resetinamas pagal įprastas mirties taisykles.

Tai skatina prieš leidžiant ilgą Combat simuliaciją pasirinkti pakankamai saugų dungeon ir patikimą buildą.

### [ATVIRA]

Dar reikia nuspręsti:

- maksimalų Offline Bank laiką;
- ar visas realus offline laikas konvertuojamas santykiu 1:1;
- ar galima prieš simuliaciją pamatyti apytikslę išgyvenimo tikimybę;
- ar Offline Bank gali automatiškai sustoti ties paruoštu bosu.

---

## 22. Loot ir daiktų pasirinkimai

### [PATVIRTINTA KRYPTIS]

Combat lootas neturėtų būti skirtas tik parduoti arba automatiškai išmesti.

Daiktas gali turėti kelis vaidmenis:

- equipment;
- Transmutation komponentas;
- Research XP šaltinis;
- Guild donation;
- Tower upgrade komponentas;
- Collection įrašas;
- quest arba rank reikalavimas.

### Daiktų apsaugos UI

Kad žaidėjas netyčia neprarastų svarbių daiktų, reikalinga:

- `Favorite` arba `Lock` funkcija;
- įspėjimas naikinant unikalų daiktą;
- įspėjimas atiduodant paskutinį receptui reikalingą daiktą;
- galimybė nustatyti minimalų paliekamą kiekį;
- aiškus naudojimo būdų sąrašas daikto informacijoje.

Pavyzdys:

> **Flame Orb**
>
> - 150 Fire Research XP;
> - naudojamas 4 receptuose;
> - reikalingas 1 aktyviam Guild Request;
> - turimas kiekis: 3;
> - užrakintas kiekis: 1.

---

## 23. Siūloma pirmojo žaidimo etapo eiga

Ši dalis yra **[SIŪLOMA / BALANSAS]** ir skirta parodyti, kaip visos sistemos galėtų atsiskleisti naujam žaidėjui.

### 0–10 minučių

- Pristatomas pagrindinis magas ir Wizard Tower.
- Žaidėjas išmoksta generuoti Maną.
- Parodoma Mana talpa ir regeneracija.
- Atrakintas pirmas elementinio fragmento gamybos veiksmas.
- Basic attack dar neprivalo būti prieinamas iš karto, jeigu reikia trumpo Tower tutorial.

### 10–20 minučių

- Atrakintas Arcane Crucible.
- Žaidėjas sunaikina pirmą elementinį fragmentą.
- Pasirenka, kuri Magic School gauna XP.
- Atrakina pirmą tikrą elementinį burtą.
- Parodomas Focus paskirstymas.

### 20–35 minutės

- Atrakinta pirmoji Combat zona arba dungeon.
- Žaidėjas pradeda kovoti basic attacku.
- Gali rankiniu būdu naudoti pirmą burtą.
- Gali skirti Focus jo auto-cast.
- Tuo pačiu metu Research arba fragmentų gamyba tęsiasi fone.

### 35–50 minučių

- Atrakinta Transmutation.
- Pagaminamas pirmas elementinis equipmentas.
- Surenkamas pirmo dungeon reikalaujamas kill count.
- Atrakinamas pirmas dungeon bosas.

### 50–75 minutės

- Nugalimas pirmas dungeon bosas.
- Gaunama pirma reta boss medžiaga.
- Atrakinta Guild arba pirmi Guild Requests.
- Atsiranda aiškus tikslas ruoštis pirmajam Main Boss.

### Vėlesnis pirmas chapter

- Žaidėjas pasiekia pradinį Magic School level cap.
- UI aiškiai parodo reikiamą Main Boss.
- Žaidėjas sustiprina buildą, vykdo Guild Requests ir farmina dungeon bosus.
- Nugalėjus Main Boss, visų keturių mokyklų cap pakyla.
- Atrakintas naujas regionas ir kitas medžiagų tier.

### Pacing principas

Nauja sistema neturėtų būti atrakinama kas minutę. Žaidėjui reikia laiko:

- suprasti ką tik atrastą sistemą;
- bent kartą ja pasinaudoti;
- pajusti jos naudą;
- tik tada gauti kitą svarbų atrakinimą.

---

## 24. Svarbiausi UI reikalavimai

Ši dalis aprašo tik žaidimo naudojimui svarbius UI principus, o ne techninį jų įgyvendinimą.

### 24.1. Nuolat matoma viršutinė būsenos juosta

Rekomenduojama nuolat rodyti:

- dabartinę ir maksimalią Maną;
- dabartinę Mana regeneration;
- aiškų grynąjį Mana balansą: ar aktyvios sistemos palieka teigiamą regeneraciją, ar sukuria Mana deficitą;
- panaudotą ir maksimalų Focus;
- dabartinę Combat būseną;
- ar veikėjas gyvas, miręs arba laukia boso;
- svarbiausios aktyvios veiklos progresą.

### 24.2. Nuolat pasiekiama pagrindinė navigacija

Pagrindinės kategorijos galėtų būti:

- Home;
- Wizard Tower;
- Magic Schools;
- Combat;
- Equipment;
- Inventory;
- Guild;
- Collection;
- Settings / Info.

Konkreti navigacijos struktūra dar gali keistis, tačiau Combat turi tęstis atidarius kitą ekraną.

### 24.3. Focus ekranas

Focus UI turi aiškiai parodyti:

- maksimalų Focus;
- panaudotą Focus;
- laisvą Focus;
- visas Focus rezervuojančias veiklas;
- kiek kainuoja kiekvienas auto-cast;
- kurios veiklos pristabdytos;
- kodėl veikla negali prasidėti.

Žaidėjas turi galėti greitai:

- išjungti auto-cast;
- pristabdyti Research;
- pristabdyti Transmutation;
- perkelti Focus prieš bosą;
- grįžti prie ankstesnio paskirstymo.

### [SIŪLOMA] Focus presetai

Vėliau būtų naudingi išsaugomi presetai:

- Farming;
- Research;
- Dungeon;
- Boss;
- Custom.

Preseto pakeitimas neturi resetinti Research ar crafting progreso — tik pristabdyti arba tęsti veiklas.

### 24.4. Combat ekranas

Combat ekrane svarbiausia rodyti:

- žaidėjo ir priešo Health;
- žaidėjo basic attack progress bar;
- priešo basic attack progress bar;
- aktyvius burtus;
- monstro special attack progress bar, parodantį, kada bus atlikta kita special attack;
- auto-cast burtus ir jų prioritetus;
- Mana bei Focus būseną;
- dabartinio dungeon bandymo kill count;
- Guild Request kill progresą, jei jis susijęs su dabartiniu monstru;
- boss readiness;
- aiškų `Engage Boss` mygtuką;
- aiškų `Leave Dungeon` mygtuką su įspėjimu apie kill count reset.

### 24.5. Dungeon išėjimo patvirtinimas

Jeigu žaidėjas bando palikti dungeon turėdamas dalį kill count, UI turi parodyti:

> Išėjus iš dungeon dabartinis progresas `14/20` bus prarastas. Bendras kill count ir Guild Request progresas išliks.

Mygtukai:

- `Stay in Dungeon`;
- `Leave and Reset`.

### 24.6. Arcane Crucible ekranas

Turi rodyti:

- pasirinktą daiktą;
- turimą kiekį;
- sunaikinamą kiekį;
- pasirinktą Magic School;
- XP vienam daiktui;
- bendrą gaunamą XP;
- bendrą proceso laiką;
- Focus kainą;
- Research eilę;
- level cap būseną;
- įspėjimus dėl receptų, Guild Requests ir unikalių daiktų.

### 24.7. Guild ekranas

Guild UI turi aiškiai atskirti:

- aktyvius Requests;
- galimus naujus Requests;
- užbaigtus Requests;
- Guild Reputation;
- dabartinį Rank;
- kito Rank reikalavimus;
- Rank rewardus;
- Guild Shop, jeigu jis bus naudojamas.

### 24.8. Skirtingų kill count atskyrimas

Kad nekiltų painiava, UI turi naudoti skirtingus pavadinimus ir vietas:

| Kill count | Ar resetinamas? | Kur rodomas? |
|---|---|---|
| Dungeon Run Kills | Taip | Combat / dungeon centre |
| Guild Request Kills | Ne | Quest tracker ir Guild |
| Lifetime Monster Kills | Ne | Monster informacijoje ir Collection |

### 24.9. Mobilus ir desktop naudojimas

### [SIŪLOMA]

Kadangi žaidimas yra daugiausia UI pagrindu:

- svarbiausi mygtukai turi būti pakankamai dideli telefonui;
- ilgi tooltip neturi būti vienintelis informacijos šaltinis;
- skaičiai ir būsenos turi būti skaitomi be priartinimo;
- dažniausi veiksmai neturi būti paslėpti po daug meniu lygių;
- desktop gali rodyti daugiau panelių vienu metu;
- mobile gali tas pačias paneles rodyti kortelėmis arba tabais.

### 24.10. Tooltip sistema

### [PATVIRTINTA]

- Užvedus pelę, tooltip pasirodo po maždaug 0,5 sekundės.
- Tooltip naudojamas daiktams, monstrams, burtams, status efektams ir kitoms informacijos turinčioms UI dalims.
- Tooltip leidžia taupyti vietą, tačiau svarbios kovos būsenos negali būti paslėptos tik tooltip viduje.
- Monster tooltip turi rodyti jo traits, special attacks ir svarbiausius atsparumus.
- Item tooltip turi rodyti jo statistiką, Research vertę, receptų panaudojimą ir susijusius Guild Requests.
- Spell tooltip turi rodyti Mana kainą, Focus kainą auto-cast režime, cooldown ir pilną efektą.

### 24.11. UI redagavimo įrankis

### [PATVIRTINTA KRYPTIS]

Žaidime turi būti UI Edit režimas, leidžiantis žaidėjui pritaikyti pagrindinių panelių išdėstymą.

Jis turi leisti:

- pele pertempti panelę į kitą vietą;
- keisti panelės dydį tempiant jos apatinį dešinį kampą;
- išsaugoti skirtingų ekranų išdėstymą;
- grąžinti numatytąjį konkretaus ekrano arba viso UI išdėstymą;
- apsaugoti paneles nuo netyčinio judinimo išėjus iš UI Edit režimo.

### 24.12. Vienodas ekranų plotas

### [PATVIRTINTA KRYPTIS]

- Combat, Wizard Tower, Guild, Equipment ir kiti pagrindiniai ekranai turi naudoti tą patį bendrą turinio plotą.
- Skirtinguose ekranuose neturi jaustis, kad vienas dirbtinai mažesnis ar suspaustas.
- Desktop versijoje turi būti išnaudojama didžioji prieinama ekrano dalis.
- Ekranų panelės gali skirtis, bet bendras jų mastelis ir išorinės ribos turi likti nuoseklūs.

### 24.13. Asset poreikio mažinimas

### [PATVIRTINTA KRYPTIS]

UI turi būti kuriamas taip, kad žaidimui nereikėtų milžiniško atskirų grafinių assetų kiekio.

- Unikalūs monster atvaizdai ir item icons išlieka svarbūs.
- Likęs UI gali remtis kokybiškomis panelėmis, spalvomis, tipografija, būsenų juostomis, paprastais simboliais ir pakartotinai naudojamais elementais.
- Nereikia kurti atskiros didelės iliustracijos kiekvienai paprastai sistemai ar ekranui.
- Vizualinis taupumas neturi mažinti informacijos aiškumo arba dark-fantasy mago atmosferos.

---

## 25. Pavyzdinė reali žaidimo situacija

Žaidėjas nori kelti Fire magiją ir pasiruošti `Forest Heart` bosui.

1. Pagrindinis magas kovoja `Whispering Woods` dungeon.
2. Basic attack Focus nenaudoja.
3. Vienas Arcane Echo naudoja Focus ir gamina Fire Fragments.
4. Kitas Echo Arcane Crucible kambaryje naikina tuos fragmentus.
5. Fire lygis kyla ir atrakina `Fireball`.
6. Žaidėjas įjungia Fireball auto-cast, todėl dalis Focus atimama iš Research.
7. Nuo monstro iškrenta `Smouldering Beast Core`.
8. Žaidėjas renkasi:
   - sunaikinti Core dėl Fire XP;
   - pasigaminti `Ember Staff`;
   - atiduoti aktyviam Guild Request;
   - išsaugoti Tower patobulinimui.
9. Žaidėjas pasirenka Ember Staff ir pagerina combat buildą.
10. Surinkęs dungeon kill count, jis atrakina dungeon bosą.
11. Prieš bosą Research ir Transmutation sustabdomi.
12. Atlaisvintas Focus skiriamas gydymo, barrier ir Fireball auto-cast.
13. Nugalėjus bosą gaunamas retas loot, o dungeon kill count grįžta į nulį.
14. Vėliau nugalėjus regiono Main Boss, Fire, Water, Earth ir Air cap pakyla nuo 10 iki 20.

Šis pavyzdys parodo, kaip Focus, Research, crafting ir Combat veikia kaip viena bendra sistema.

---

## 26. Patvirtintų sprendimų santrauka

- [x] Žaidėjas valdo vieną pagrindinį magą.
- [x] Magas turi Wizard Tower.
- [x] Keturios pradinės magijos mokyklos yra Fire, Water, Earth ir Air.
- [x] Vėlesnės magijos mokyklos atrakinamos po nustatytų pagrindinių bosų.
- [x] Research vyksta sunaikinant daiktus specialiame Tower kambaryje.
- [x] Žaidėjas pasirenka, kuri magijos mokykla gauna XP.
- [x] Magas arba jo klonai gali gaminti elementinius fragmentus ir vėlesnius aukštesnio tier daiktus.
- [x] Focus yra automatizacijos ir paralelinių veiklų talpa.
- [x] Basic attack Focus nenaudoja.
- [x] Combat ir bent viena kita veikla gali vykti vienu metu nuo žaidimo pradžios.
- [x] Combat auto-cast burtai rezervuoja Focus.
- [x] Research, crafting ir kitos automatizuotos veiklos taip pat rezervuoja Focus.
- [x] Klonai arba Arcane Echoes paaiškina, kaip magas vienu metu atlieka daug veiklų.
- [x] Retirement arba viso progreso resetinimo nėra.
- [x] Magic School level cap keliamas nugalint pagrindinius bosus.
- [x] Dabartinis tikslas — apie 15 pagrindinių bosų ir iki 300 Magic School lygio.
- [x] Dungeon bosui atrakinti reikia surinkti laikiną kill count.
- [x] Dungeon progresas vadinamas `Threat Cleared`.
- [x] Visi įprasti dungeon monstrai atsitiktinai parenkami iš monster pool ir duoda po `+1 Threat Cleared`.
- [x] Nugalėjus bosą dungeon kill count resetinamas.
- [x] Mirus arba palikus dungeon dabartinis dungeon kill count resetinamas.
- [x] UI ekrano pakeitimas nėra dungeon palikimas.
- [x] Jau bent kartą rankiniu būdu nugalėtam bosui galima įjungti `Auto Hunt Boss`.
- [x] Monster gali turėti basic ir special attack sekas bei traits.
- [x] Bosai turi bent dvi special attacks, o vėlesni bosai gali turėti daugiau.
- [x] Potions turi ribotus charges visam dungeon loop, o ne vienam monster encounter.
- [x] Guild Requests apima item donations, monster kills, crafting ir boss tikslus.
- [x] Guild turi kelis Rank.
- [x] Aukštesni Rank suteikia didelius bonusus arba atrakina naujas sistemas.
- [x] Nežaidžiant kaupiamas Offline Bank laikas, kurį galima skirti pasirinktai simuliacijai.
- [x] UI turi tooltip sistemą ir redaguojamą panelių išdėstymą.

---

## 27. Dar nepatvirtinti sprendimai

- [ ] Galutinis žaidimo pavadinimas; dabartinis darbinis pavadinimas yra `SSS Wizard`.
- [ ] Pasaulio pavadinimas.
- [ ] Pagrindinio mago istorija ir galutinis tikslas.
- [ ] Ar žaidimo pradžioje pasirenkamas pagrindinis elementas.
- [ ] Tikslūs keturių elementų vaidmenys ir jų tarpusavio silpnybės.
- [ ] Vėliau atrakinamų magijos mokyklų sąrašas ir jų bosų vartai.
- [ ] Galutinės Summoning ir summon palaikymo taisyklės.
- [ ] Neutralūs magiški resursai.
- [ ] Galutinis elementinių medžiagų tier skaičius.
- [ ] Arcane Crucible galutinis pavadinimas.
- [ ] Klonų galutinis pavadinimas.
- [ ] Pradinis ir maksimalus Focus kiekis.
- [ ] Kiek Focus kainuoja atskiri auto-cast burtai.
- [ ] Ar rankiniai burtai tikrai visada nenaudoja Focus.
- [ ] Ar papildomas Focus pagreitina vieną veiklą, ar tik leidžia aktyvuoti daugiau veiklų.
- [ ] Kiek Research eilių galima turėti vienu metu.
- [ ] Ar galima vienu metu kelti kelias magijos mokyklas.
- [ ] Ar bet kuris daiktas gali būti sunaikintas dėl bet kurios mokyklos XP.
- [ ] Kaip veikia Elemental Affinity XP bonusai.
- [ ] Galutiniai equipment slotai.
- [ ] Ar potion charges atsistato po mirties arba savanoriško dungeon palikimo.
- [ ] Kiek nužudymų reikia kiekvienam bosui.
- [ ] Elite monster dažnis, taisyklės ir rewardai.
- [ ] Guild Rank pavadinimai ir kiekis.
- [ ] Guild Shop paskirtis.
- [ ] Maksimali Offline Bank talpa ir laiko konvertavimo santykis.
- [ ] Ar Offline Bank simuliacija gali automatiškai pradėti jau nugalėtą bosą.
- [ ] Pagrindinės istorijos pabaiga ir endgame struktūra.

---

## 28. Galimos ateities sistemos

Šios sistemos neturėtų būti kuriamos, kol pagrindinis ciklas nėra pilnai įdomus:

- išplėstinės auto-cast sąlygos;
- Focus presetai;
- keli išsaugomi equipment loadout;
- aukšto lygio Ritual Hall;
- elementų hibridai;
- kombinuoti burtai;
- challenge dungeon;
- specialūs Guild Contracts;
- world events;
- išplėsta Summoning ir summons sistema;
- papildomų magijos mokyklų detalus turinys;
- labai aukšto tier Tower kambariai;
- kosmetinis Tower dekoravimas.

Papildomos sistemos neturi būti dedamos vien dėl didesnio funkcijų skaičiaus. Kiekviena jų turi sustiprinti pagrindinį Focus, Research, Combat arba Guild ciklą.

---

## 29. Vidinis testavimo įrankis

### [PATVIRTINTA KRYPTIS]

Žaidimo kūrimo ir balansavimo metu reikalingas platus vidinis Debug / Testing įrankis. Jis nėra įprasta žaidėjo progreso sistema, bet turi leisti greitai patikrinti beveik bet kurią situaciją nelaukiant natūralaus progreso.

Reikalingos galimybės:

- pasirinktinai pakelti arba sumažinti bet kurios Magic School lygį;
- pridėti arba pašalinti XP;
- keisti žaidėjo Health, Mana, Focus ir kitus svarbius skaičius;
- įjungti ir išjungti nemirtingumą;
- iš karto pradėti pasirinktą monster arba boss kovą;
- akimirksniu nužudyti dabartinį priešą arba bosą;
- keisti monster lygį ir svarbiausius jo parametrus;
- keisti `Threat Cleared` kiekį;
- atrakinti arba užrakinti regionus, dungeon, bosus, burtus, receptus, Tower kambarius ir Guild Rank;
- pridėti arba pašalinti bet kokį daiktą bei nurodyti jo kiekį;
- užbaigti arba resetinti Guild Requests;
- valdyti Offline Bank laiką ir paleisti testinę simuliaciją;
- kurti, išsaugoti ir įkelti skirtingas testines žaidimo būsenas;
- grąžinti atskiras sistemas į numatytąją būseną nepažeidžiant viso save.

Testavimo įrankio veiksmai turi būti aiškiai atskirti nuo normalaus žaidimo, kad jie nebūtų netyčia naudojami įprastame save.

---

## 30. Pagrindinė dabartinės koncepcijos formulė

> **SSS Wizard** žaidėjas valdo vieną magą, kuris plečia savo sąmonę ir Wizard Tower. Jis naudoja Maną kurdamas elementines medžiagas, sunaikina jas dėl Fire, Water, Earth arba Air XP, atrakina burtus, vėlesnes magijos mokyklas ir Transmutation receptus, o tada ruošia buildą dungeon kovoms. Basic attack leidžia kovoti nenaudojant Focus, tačiau automatiniai burtai, Research ir crafting konkuruoja dėl ribotos Focus talpos. Dungeon priešai atsitiktinai parenkami iš monster pool, turi special attack sekas bei traits ir didina `Threat Cleared`. Surinkus reikalaujamą kiekį galima iškviesti bosą, o jau nugalėtam bosui įjungti `Auto Hunt Boss`. Pagrindiniai bosai kelia magijos mokyklų level cap, o Guild Requests ir Guild Rank suteikia permanentinius bonusus, didesnį Focus bei naujas sistemas. Nežaidžiant kaupiamas Offline Bank, o viso žaidimo progreso resetinimo nėra.

---

## 31. Vieta papildomoms mintims

Ši dalis palikta būsimiems papildymams.

### Pasaulis ir istorija

- 

### Magijos mokyklos ir burtai

- 

### Wizard Tower

- 

### Focus ir klonai

- 

### Combat ir dungeon

- 

### Guild Requests ir Rank

- 

### Daiktai, crafting ir loot

- 

### UI idėjos

- 

### Kitos pastabos

- 

### Channeling Chamber V2 (Phase 2.4)

The Channeling Chamber uses passive Mana generation rather than a manual Channel button. Fresh profiles begin at **+5 Mana/s** and may assign **0–5 Arcane Echoes**, reserving **10 Focus** and adding **+5 Mana/s** per Echo. Five Echoes therefore reserve 50 Focus and produce **+30 Mana/s** total with starting infrastructure.

Channeling infrastructure is permanent progression:

- Mana Reservoir, Rank 0–5, adds +25 Max Mana per rank and consumes Earth + Water Fragments.
- Leyline Conduit, Rank 0–5, adds +1 Natural Mana/s per rank and consumes Water + Air Fragments.
- Both upgrade families use costs 9 / 18 / 50 / 160 / 250 of each required Fragment.

Arcane Discoveries are permanent condition-based principles: Stable Leyline, Echo Resonance, and Deep Reservoir. Future discoveries remain hidden placeholders until implemented.

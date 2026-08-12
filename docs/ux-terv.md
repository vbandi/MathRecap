# MathRecap — UX-terv

> **Állapot:** a helyi, egyfelhasználós POC megvalósult. A tartalmi fa (190 készség) kész, lásd [README.md](../README.md).
>
> **Hatókör:** egyfelhasználós POC, asztali böngésző. Ez a dokumentum a **felülettel** foglalkozik — mit lát a diák és mit tud csinálni —, nem az architektúrával.
>
> **Mire való a fa:** hogy lásd, mivel hogy állsz, és hogy eldöntsd, mivel foglalkozz legközelebb. A **gyakorlófeladatok külön felületen élnek** (8. pont).

---

## Megvalósult POC-döntések

- **Egy helyi felhasználó:** nincs fiók, szinkron vagy megosztott előzmény. A profil, a kiválasztott OpenRouter-modell, az onboarding állapota és az önértékelt tudásszintek verziózott böngészőbeli `localStorage`-ban maradnak.
- **Tudásszint:** mindig kézi önértékelés. A feladatlap elkészítése, kinyomtatása vagy megoldása nem emel és nem javasol automatikus szintet; a zárolás csak a mentett előfeltétel-szintekből számítódik.
- **AI-beállítás:** az OpenRouter modellkatalógusa a helyi szerveren keresztül tölthető be, a választott modell az előbbi helyi állapot része. Modell csak AI-művelethez szükséges.
- **Feladatlap-kérés:** a készséghez egyetlen, szabadon szerkeszthető magyar kérésmező tartozik. Nincs darabszám-, nehézség-, idő- vagy előfeltétel-kapcsoló.
- **Feladatlap és nyomtatás:** a tanulói **Feladatlap** és a **Megoldókulcs** külön HTML-nézet, külön nyomtatási paranccsal. Új generálás új feladatlapot cserél le; nincs generált feladatlap-előzmény.

---

## 1. Mérési alapadatok

A terv nem feltételezésekre, hanem a tényleges gráf méréseire épül:

| Mérőszám | Érték | Következmény a felületre |
|---|---|---|
| Csomópont | 190 | Egy vászonra zsúfolva olvashatatlan |
| Él | 281 | Ritka gráf, átlag 1,48 előfeltétel / készség |
| Ágak közti él | 35 (**12%**) | Az ágak majdnem függetlenek → önálló ágsávok működnek |
| Legnagyobb bemenő fok | 4 (`GEO-54`) | Nincs áttekinthetetlen csomópont |
| Legnagyobb kimenő fok | 6 (`FUG-09`, `GEO-01`) | Kevés hub, tiszta szerkezet |
| Mélység (leghosszabb út) | 0–14, **15 réteg** | Sekély és **széles**, nem mély |
| Legszélesebb réteg | 23 csomópont | Teljes fa ≈ **4600 × 1400 px** |
| Kapunode (⭐) | 43 | Épp jó méret egy áttekintő nézethez |

**A két legfontosabb tanulság:**

1. **A teljes fa széles, nem mély.** ~4600 × 1400 px — ez zoom és pan mellett teljesen kezelhető (a Path of Exile fája nagyságrendekkel nagyobb), de csak akkor, ha távoli nagyításban nem próbáljuk mind a 190 feliratot kiolvashatóvá tenni (3.2).
2. **Az ágak 88%-ban önállóak.** Ezért érdemes a hat ágat elkülönült sávokba rendezni: a 35 keresztbe futó él így nem káosz, hanem információ — pontosan azok a helyek, ahol a geometria algebrát kér.

---

## 2. Felhasználó és feladatok

**Elsődleges felhasználó:** 12. évfolyamos diák érettségi előtt, aki a 190 készségből nagyjából 140-et tud — de nem tudja, *melyik* 50 hiányzik.

Ebből következik, hogy a termék nem tantervböngésző. Tankönyve már van. Amit nem tud megvenni sehol:

| Feladat | Kérdés a diák fejében | Válaszoló funkció |
|---|---|---|
| **Diagnózis** | „Nem megy a logaritmus. Miért?" | Visszafelé bejárás → hiányzó alapok |
| **Tervezés** | „Mit tanuljak ehhez, milyen sorrendben?" | Útvonaltervező |
| **Orientáció** | „Most mit érdemes elkezdeni?" | Következő lépések, hasznosság szerint rangsorolva |
| **Számonkérés** | „Hol tartok?" | Ágankénti haladás |

**Nem cél:** videók, tanítás, több felhasználó, tanári felület, közösségi funkciók — és **a gyakorlás sem**, az külön felület.

### 2.1 Felhasználói profil

A panel „miért jó neked" blokkja (7. pont) a diák érdeklődéséhez igazodik, ezért kell egy minimális profil. Szándékosan rövid — három kérdés az onboardingban:

| Mező | Példa | Mire használjuk |
|---|---|---|
| `erdeklodes` | zene, gaming, foci, autók, biológia | a feladatok témakerete |
| `sajat` (szabad szöveg) | „elektronikus zenét készítek FL Studióban" | konkrét, személyes példák |
| `cel` | informatika szak / egészségügy / még nem tudom | miért számít hosszú távon |

**Nevet, iskolát, életkort nem kérünk** — a profil kimegy az LLM-hez, így minden mező kockázat. Az érdeklődési kör önmagában nem azonosít.

---

## 3. A vászon — zoom és pan

**Egy vászon, nem öt nézet.** Mind a 190 készség egyetlen koordinátarendszerben él; amit korábban külön „nézetnek" hívtam, az valójában csak **kameraállás** ugyanazon a vásznon. Ez egyszerűbb is: nincs állapotmásolás nézetek között, és minden átmenet animálható, tehát a diák nem veszti el a kontextust.

Egyetlen kivétel a **Lista** (3.5), ami nem kameraállás, hanem a gráf akadálymentes és mobilos párja.

### 3.1 Elrendezés

Ágak függőleges sávokban, mélység lefelé. A vászon fix ~4600 × 1400 px, az elrendezés egyszer számítódik és gyorsítótárazódik.

### 3.2 Egyetlen zoom-küszöb

Itt eredetileg négyszintű szemantikus nagyítás állt. Az valóban túlbonyolítás — egyetlen szabály elég:

> **A felirat akkor jelenik meg, amikor elfér.**

| Nagyítás | Mit látsz |
|---|---|
| Távol (kb. 0,5 alatt) | a csomópontok alakja, színe és tudásszint-gyűrűje; felirat csak a kapunode-okon |
| Közel (kb. 0,5 fölött) | minden felirat |

A csomópont maga **soha nem változik**: ugyanaz a forma, szín és gyűrű végig, csak a szöveg jön-megy. Ez egy küszöb, nem részletességi rendszer.

Az elrejtés nem stílusdöntés, hanem kényszer: 0,3-as nagyításnál 190 felirat olvashatatlan szövegleves. A kapunode-ok nevét viszont meghagyjuk, mert ezek adják a tájékozódási pontokat — enélkül a kicsinyített nézet arctalan pöttyhalmaz.

### 3.3 Navigáció

| Bevitel | Művelet |
|---|---|
| Görgő / pinch | nagyítás **a kurzorra**, nem a középpontra |
| Húzás | pásztázás |
| Dupla kattintás csomóponton | odarepülés, `z ≈ 1,3`, a csomópont környezetére illesztve |
| Ágcsempe a fejlécben | animált kameraugrás az ág köré (ez váltja ki a korábbi „Ág nézetet") |
| `F` | teljes fa a képernyőre |
| `Esc` | vissza az előző kameraállásba |

Két dolog, ami nélkül a zoom & pan eltévedéssé válik:

- **Minitérkép** jobb alul, benne a nézetablak téglalapja; kattintással ugorható.
- **Kamera-előzmény** (vissza/előre). Egy nagy vásznon a véletlen görgetés visszavonhatósága alapkövetelmény.

A címsor tartalmazza az aktuális csomópontot (`#SZA-33`), így a nézet megosztható és könyvjelzőzhető.

### 3.4 Kameraállások

**Gerinc** — a belépő kép. A 43 kapunode, mind a hat ág.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ MathRecap   [🔍 keresés…]   ●LOG ●SZA ●ALG ●FUG ●GEO ●ESE       ◐43%   ⚙  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│    LOGIKA        SZÁMOK        ALGEBRA      FÜGGVÉNY   GEOMETRIA    ESÉLY  │
│  ─────────────────────────────────────────────────────────────────────────│
│   ▣ LOG-01      ▣ SZA-01                              ▣ GEO-01    ▣ ESE-01│
│      │             │                                     │           │     │
│   ▣ LOG-06      ▣ SZA-03 ───────▶ ▣ ALG-08            ▣ GEO-04    ▣ ESE-04│
│      │             │                  │                  │           │     │
│   ◫ LOG-14      ▣ SZA-08           ◫ ALG-13           ▣ GEO-07    ◫ ESE-22│
│                    │                  │                  │           │     │
│                 ▣ SZA-12           ◻ ALG-16           ◻ GEO-23    ◻ ESE-24│
│                    │                  │                  │                 │
│                 ◻ SZA-24 ────────▶ ◻ ALG-17           ░ GEO-36           │
│                    │                  │                                    │
│                 ░ SZA-33           ░ ALG-24 ◀──── ◻ FUG-09   ┌──────────┐ │
│                                                              │ minitérkép│ │
└──────────────────────────────────────────────────────────────┴──────────┴─┘
```

Kattintás egy kapunode-ra → a kamera odarepül, csempe szintre nagyítva.

**Ág** — a munkakamera. Ide tölti a diák az idő 80%-át. A vászon nem változik, csak a nézetablak szűkül egy ágsávra; a többi ág halványan ott marad a széleken, hogy ne vesszen el a térérzet.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ← Gerinc          ● SZÁMOK ÉS SZÁMELMÉLET      33 készség · 21 kész  ▓▓▓░ │
├──────────────────────────────────────────────────┬─────────────────────────┤
│                                                  │  SZA-24            ⭐   │
│ ┌ előfeltételek más ágakból ───────────────────┐ │  Irracionális számok,   │
│ │  ⟨LOG-01 Halmaz⟩   ⟨ALG-08 Betűs kifejezés⟩  │ │  valós számok           │
│ └──────────────────────────────────────────────┘ │  ─────────────────────  │
│                                                  │  Számok ága · kapunode  │
│  ▣ SZA-01 ⭐         ▣ SZA-02                    │                         │
│      │                  │                        │  A racionális számok…   │
│      ├──────────────────┤                        │                         │
│  ▣ SZA-03 ⭐         ▣ SZA-11                    │  ELŐFELTÉTELEK          │
│      │                                           │  ✓ SZA-22 Négyzetgyök   │
│      ├─── ▣ SZA-08 ⭐ ─── ▣ SZA-12 ⭐            │  ⚠ SZA-21 Végtelen tiz. │
│      │                        │                  │                         │
│      └─── ▣ SZA-20 ⭐    ▣ SZA-18 ⭐             │  EZT NYITJA MEG (4)     │
│                │              │                  │  SZA-26 · SZA-27 ·      │
│           ▣ SZA-22       ◻ SZA-21                │  SZA-29 · FUG-09        │
│                │              │                  │                         │
│                └──── ◻ SZA-24 ⭐ ◀───────────────│  [ Ezt akarom tanulni ] │
│                           │                      │  Tudásszint: ●●○○○      │
│                       ░ SZA-33 ⭐                │                         │
└──────────────────────────────────────────────────┴─────────────────────────┘
```

Amikor egy ágra szűkül a kamera, a más ágból érkező előfeltételek egy **rögzített sávba** kerülnek a nézetablak tetejére — nem tűnnek el csak azért, mert kifutottak a képből. Kattintásra a kamera átvisz a saját águkba.

**Fókusz** — az ego-hálózat, a diagnózis kamerája. Egyetlen készség környezete: fölötte az összes előfeltétel, alatta amit megnyit. A többi csomópont 8%-ra halványul, de a helyén marad.

```
              ▣ SZA-25        ◻ SZA-31        ← közvetlen előfeltételek
                  └───────┬───────┘
                     ◻ SZA-32
                         │
                  ┌─── ★ SZA-33 ───┐          ← a fókuszált készség
                  │                │
              ░ ALG-28         ░ FUG-18        ← ezt nyitja meg
```

Szűkíthető „csak a hiányzó előfeltételek" változatra.

### 3.5 Lista — az egyetlen nem-kamera felület

Lapos táblázat: szűrés ág / tudásszint / réteg szerint, rendezés név vagy hasznosság szerint. Ez a gráf teljes értékű, képernyőolvasóval bejárható párja (13. pont) és a mobilnézet alapja (12. pont) — nem másodrendű alternatíva.

---

## 4. Vizuális nyelv

### 4.1 Két csatorna, két jelentés

Az alapszabály: **az ág a színárnyalatot viszi, a tudásszint a kitöltést és az átlátszóságot.** Egy csatorna soha nem hordoz két jelentést.

| Ág | Szín | Betűszín kitöltve |
|---|---|---|
| `LOG` Logika | `#6C5CE7` ibolya | fehér |
| `SZA` Számok | `#0B84D6` kék | fehér |
| `ALG` Algebra | `#00A085` zöldeskék | fehér |
| `FUG` Függvények | `#E8A33D` borostyán | **sötét** `#2B2B2B` |
| `GEO` Geometria | `#D94F45` piros | fehér |
| `ESE` Esély | `#C2559E` magenta | fehér |

### 4.2 Tudásszint a csomóponton

A tudásszint (6. pont) **öt szegmensű gyűrű** a csomópont körül; a kitöltés a belső felület:

| Jel | Szint | Megjelenés |
|---|---|---|
| `░` | **zárolt** | 25% átlátszó, szürke, gyűrű nélkül |
| `◻` | 0 — nem ismerem | fehér kitöltés, üres gyűrű, ágszínű keret |
| `◔` | 1 — hallottam róla | gyűrű 1/5 |
| `◑` | 2 — értem | gyűrű 2/5, halvány ágszínű kitöltés |
| `◕` | 3 — megy | gyűrű 3/5, 60% kitöltés |
| `▣` | 4 — biztos tudom | teli gyűrű, 100% kitöltés, ✓ jelvény |

A *zárolt* mindig számított: nem lehet olyan állapotba kerülni, ami ellentmond a gráfnak. Egy csomópont akkor nyílik meg, ha minden előfeltétele legalább **2. szinten** van.

A **kapunode** 1,4× méretű, 3px keret, ⭐ jelvény — ugyanaz a logika, mint a Path of Exile notable-jeinél.

### 4.3 Színtévesztés

A piros (`GEO`) és zöldeskék (`ALG`) párosítás a klasszikus kockázat. Három egymást erősítő védelem:

1. Az `ID`-előtag (`GEO-`, `ALG-`) **mindig** látszik.
2. Ág-kameraállásban az ág amúgy is egynemű.
3. Kapcsoló: „színtévesztő paletta" → luminancia szerint rendezett séma + mintázatkitöltés.

---

## 5. A csomópont-panel

Kattintásra jobb oldalt panel nyílik. Ez a fa egyetlen „részletes" felülete.

```
┌ SZA-33  Logaritmus ──────────────────────── ⭐ ─┐
│ Számok ága                                      │
│ ●●●○○  3 — Megy                                 │
│ ─────────────────────────────────────────────── │
│ MI EZ                                           │
│ A logaritmus a hatványozás inverz művelete:     │
│ log_a b az a kitevő, amelyre a-t emelve b-t…    │
│                                                 │
│ MIÉRT JÓ NEKED                          ✨ AI   │
│ Mivel FL Studióban zenélsz: a decibel skála     │
│ logaritmikus, ezért hangzik a +6 dB mindig      │
│ „kétszer akkorának", akár halkról, akár…        │
│                                   [ mást kérek ]│
│                                                 │
│ ELŐFELTÉTELEK                                   │
│ ●●●●● SZA-32  Racionális kitevőjű hatvány       │
│ ●●○○○ SZA-25  Hatványozás azonosságai      ⚠    │
│                                                 │
│ EZT NYITJA MEG (2)                              │
│ ░ ALG-28  ·  ░ FUG-18                           │
│ ─────────────────────────────────────────────── │
│ Mennyire tudod?                                 │
│    ○────●────○────○────○                        │
│    0    1    2    3    4                        │
│                                                 │
│ [ Ezt akarom tanulni ]       [ Gyakorlás → ]    │
└─────────────────────────────────────────────────┘
```

Két dolog, ami miatt ez a panel működik:

- **Az előfeltételek saját tudásszintjükkel jelennek meg.** Egy pillantásból látszik, melyik a gyenge láncszem — itt az `SZA-25`. Ez a diagnózis a panelen belül, külön nézet nélkül.
- **A tudásszint csúszka, nem gomb.** Az állítás egy mozdulat, nem menü. Ez a leggyakoribb művelet a fában, tehát a legolcsóbbnak kell lennie.

---

## 6. Tudásszint

A „mennyire tudja" nem bináris, de nem is mérés — **önértékelés**, öt fokozattal. A trükk az, hogy minden szinthez konkrét, viselkedéses horgony tartozik, nem elvont címke:

| Szint | Név | „Ez vagyok, ha…" |
|---|---|---|
| 0 | Nem ismerem | nem tudom, mi ez |
| 1 | Hallottam róla | rémlik, de nem tudnám elmagyarázni |
| 2 | Értem | el tudom magyarázni, de feladatnál elakadok |
| 3 | Megy | megoldom, ha van rá időm |
| 4 | Biztos tudom | dolgozatban is menne, segítség nélkül |

A horgonyok nélkül az önértékelés használhatatlan: mindenki a „közepesen tudom" környékére kattint. A konkrét mondatokkal viszont a diák meg tudja mondani, melyik igaz rá.

**Egy csomópont akkor nyílik meg, ha minden előfeltétele legalább 2. szinten van.** A zárolt állapot mindig ebből számítódik — nem lehet olyan szintet beállítani, ami ellentmond a gráfnak.

---

## 7. „Miért jó neked"

A panel egyetlen AI-generált blokkja: 2–4 mondat, ami a készséget a diák érdeklődéséhez köti.

Ez nem tananyag, hanem **motiváció** — és pont ezért jó helye az AI-nak. Ha téved egy árnyalatot abban, hogyan működik a decibel-skála, az nem okoz kárt; ha viszont eltalálja, hogy a diák miért törődjön a logaritmussal, az többet ér, mint három bekezdés tankönyvi szöveg.

- **„Mást kérek"** — újragenerálás másik szempontból. Az első próbálkozás gyakran közhelyes lesz.
- **Ha nincs AI**, a blokk egy semleges, előre megírt mondattal jelenik meg. A fa AI nélkül is teljesen használható; ez a blokk a hab.

---

## 8. Kapcsolat a gyakorlóval

**A gyakorlófeladatok nem a fában élnek.** A fa dolga megmutatni, hol tartok és mivel foglalkozzam legközelebb — a gyakorlás ettől külön felület.

A kapcsolat mindössze ennyi:

- A panelen egy **`Gyakorlás →`** gomb átad a gyakorlónak, a csomópont azonosítójával.
- Visszafelé a fa annyit mutat, hogy volt-e itt gyakorlás — de a tudásszintet **a diák állítja**, nem a gyakorló írja felül.

Ez a POC-ban szándékosan laza kapcsolat. Hogy a gyakorló eredménye később automatikusan emelje-e a szintet, nyitott kérdés (14. pont) — de a fa attól még önmagában is teljes.

---

## 9. Interakciók

### 9.1 Rámutatás (hover)

A legfontosabb egyetlen interakció. Rámutatásra három csoportra bomlik a gráf:

- **előfeltételek** (fölfelé, tranzitívan) — teljes fedettség, kiemelt élek
- **a csomópont maga** — teljes fedettség + halo
- **amit megnyit** (lefelé, tranzitívan) — teljes fedettség, borostyán élek
- **minden más** — 8% átlátszóság

Átmenet 120 ms. 190 csomópontnál ez nem díszítés, hanem a használhatóság feltétele.

### 9.2 Útvonaltervező

Az „Ezt akarom tanulni" gomb a termék legerősebb funkciója. A gráf lecsupaszodik a célhoz vezető, **még hiányzó** láncra.

Valós példa — `SZA-33` (logaritmus) teljes előfeltétel-lánca 20 készség, de ha a diák már `SZA-24`-ig eljutott, csak négy hiányzik:

```
┌ ÚTVONAL ─────────────────────────────────────────────────┐
│ Cél:  SZA-33  Logaritmus fogalma és azonosságai    [✕]  │
│ 4 készség hiányzik · 2 kezdhető most                     │
│                                                          │
│   1  ◻ SZA-25  Hatványozás azonosságai        ▶ most    │
│   2  ◻ SZA-27  Négyzetgyök azonosságai        ▶ most    │
│   3  ◻ SZA-31  n-edik gyök                              │
│   4  ◻ SZA-32  Racionális kitevőjű hatvány              │
│   ★  SZA-33  Logaritmus                                 │
└──────────────────────────────────────────────────────────┘
```

**Sorrendezés:** topologikus rendezés, holtversenyben (1) kevesebb hátralévő előfeltétel, (2) kisebb réteg, (3) azonos ág egyben tartása — hogy ne kelljen témát váltogatni.

### 9.3 Következő lépések

Az útvonaltervező inverze. Nem „mi kell X-hez", hanem „amit most tudok, abból mi indítható, és melyik éri meg legjobban".

**Rangsor:** minden *elérhető* készségre `pontszám = |tranzitív leszármazottak| + (kapunode ? 8 : 0)`. Felső 12 megjelenítve.

### 9.4 Billentyűzet

| Billentyű | Művelet |
|---|---|
| `/` | keresőmező |
| `F` | teljes fa a képernyőre |
| `+` / `−` | nagyítás |
| `1`–`6` | kameraugrás az adott ágra |
| `Esc` | vissza az előző kameraállásba / panel bezárása |
| `Tab` | következő csomópont (topologikus sorrendben) |
| `Space` | a fókuszált csomópont paneljének megnyitása |
| `G` | csak kapunode-ok ki/be |

---

## 10. Onboarding — a legkritikusabb képernyő

190 bejelöletlen jelölőnégyzet láttán a diák bezárja a lapot. A megoldás:

**A „tudom" jelölés tranzitívan visszafelé terjed.** Ha valaki bejelöli az `SZA-33`-at, azzal 20 előfeltétel is bejelölődik. Ehhez nem kell új metaadat, csak a meglévő gráf.

**Folyamat:**

1. **Üdvözlés** — mit tud az app, három mondatban.
2. **Profil** — a 2.1 pont három kérdése. Átugorható; ennélkül a semleges, előre megírt tartalom megy.
3. **Kalibráció** — „Jelöld be, amit biztosan tudsz." 12 jól diszkrimináló készség kártyaként, ágakon átívelve, nehézség szerint növekvő sorrendben:
   `SZA-24` · `ALG-13` · `GEO-36` · `FUG-10` · `ESE-25` · `LOG-14` · `ALG-24` · `GEO-40` · `FUG-16` · `SZA-33` · `GEO-54` · `ESE-19`

   Tizenegy közülük kapunode; az `ESE-19` (szórás) nem az, de a statisztika-ág végén ül, ezért jól jelzi, meddig jutott a diák.
4. **Visszajelzés** — „127 készség bejelölve. [Átnézem]" — a tranzitív jelölés visszavonható, ha túllőtt.
5. **Landolás** — egyenesen a *Következő lépések* panelre.

Öt-hat koppintással a diák ~70%-ban feltérképezve van.

**Fontos korlát:** a tranzitív jelölés **2. szintre** („értem") állítja az előfeltételeket, nem 4-re. Attól, hogy valaki tudja a logaritmust, még nem érettségi-biztos mind a 20 alapja. A 3–4. szintet a diáknak külön kell állítania — így az onboarding gyors marad, de nem hazudik fölé.

---

## 11. Gamifikáció — mértékkel

Az RPG-metafora látsszon, de a felület maradjon komoly eszköz. Érettségi előtt álló diáknak a badge-gyűjtögetés inkább bosszantó.

**Ami belekerül:**

- **XP:** `10 × (réteg + 1) × (tudásszint / 4)`, kapunode kétszeres — tehát a 2. szint félig számít, és a mélyebb készségek többet érnek. A teljes fa így ~14 000 XP.
- **Ágszint:** áganként 1–10, az adott ág teljesítettségéből.
- **Feloldás-visszajelzés:** amikor egy jelöléstől új készségek válnak elérhetővé, azok egyszer felvillannak, és egy rövid értesítés jelzi: „3 új készség nyílt meg."
- **Ágankénti haladássávok** a fejlécben.

**Ami kimarad:** streakek, napi célok, hangeffektek, jelvénygyűjtemény, ranglista.

---

## 12. Mobil

A POC-ban a fa asztali felület. 900 px alatt a gráf eltűnik — egy 190 csomópontos DAG telefonon nem menthető meg pásztázással —, helyette a **Lista** és a **Kereső** marad, a csomópont-panel pedig teljes képernyős lapként nyílik.

---

## 13. Akadálymentesség

- Minden tudásszint szövegesen **és** ikonnal is kódolt, nem csak színnel — a gyűrű mellé mindig jár `aria-label` („3. szint — megy").
- A **Lista** a gráf teljes értékű, képernyőolvasóval bejárható párja — nem másodrendű alternatíva. Zoom és pan billentyűzettel nem kikenyőszeríthető élmény, ezért a Lista nem opció, hanem követelmény.
- Látható fókuszgyűrű; a `Tab`-sorrend a topologikus sorrendet követi, tehát értelmes tanulási sorrendet ad.
- `prefers-reduced-motion` esetén a kamera-átmenetek, felvillanások azonnali ugrássá válnak.
- Minden csomópontszöveg WCAG AA kontraszton (ezért kap a `FUG` borostyán sötét betűt).
- A generált szövegek is a felület többi részével azonos kontraszt- és betűméret-szabályt követik — az „AI-doboz" nem lehet halványszurke apróbetűs.

---

## 14. Nyitott kérdések

1. **Kell-e fakulás?** Egy régen érintett készség gyűrűje kifakulhatna, jelezve az ismétlés igényét. Ez viszont dátumkezelést hoz be, és a POC-ban nélküle is működik minden.
2. **Emelt szint.** Jelenleg középszintű érettségire szabott. Az emelt többlet külön jelöléssel beilleszthető, de bővíti a fát.
3. **A README gerinc-ábrája** 24 kapunode-ot mutat a 43-ból — szándékos kurátori válogatás. Ha a Gerinc kameraállás mind a 43-at hozza, érdemes a kettőt összehangolni vagy a különbséget kiírni.
4. **Elég-e a hat ág színkódja?** Hat szín plusz öt tudásszint-fokozat egyszerre sok. Lehet, hogy közeli nagyításban az ágszín visszavehető halványabbra.

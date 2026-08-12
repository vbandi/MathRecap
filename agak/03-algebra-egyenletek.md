# 3. ág — Algebra és egyenletek

> „Az Absztrakció ága" · kód: `ALG` · 28 csomópont

Ez az ág írja le azt az utat, ahogyan a konkrét számolásból **szimbólumkezelés** lesz.
Két, egymást erősítő szál fut benne:

- **arányosság és százalék** – a mindennapi matematika gerince
- **betűs kifejezések → egyenletek → egyenlőtlenségek** – az érettségi feladatsorok motorja

A `ALG-13` (mérlegelv) és az `ALG-17` (nevezetes azonosságok) a két legfontosabb kapunode:
előbbi nélkül nincs egyenletmegoldás, utóbbi nélkül nincs másodfokú egyenlet.

## Függőségi gráf — arányosság és százalék

```mermaid
graph TD
    SZA12(["SZA-12<br/>Közönséges tört"])
    SZA14(["SZA-14<br/>Tizedes tört"])
    SZA04(["SZA-04<br/>Műveleti sorrend"])

    ALG01["ALG-01<br/>Arány, aránypár"]
    ALG02["ALG-02<br/>Szöveges feladatok:<br/>modellalkotás"]
    ALG03["ALG-03 ⭐<br/>Egyenes arányosság"]
    ALG04["ALG-04<br/>Mértékegységek<br/>és átváltásuk"]
    ALG05["ALG-05<br/>Fordított arányosság"]
    ALG06["ALG-06<br/>A százalék fogalma"]
    ALG07["ALG-07<br/>Százalékszámítás:<br/>alap, érték, láb, pont"]
    ALG10["ALG-10<br/>Pénzügyi alapszámítások"]

    SZA12 --> ALG01
    SZA04 --> ALG02
    ALG01 --> ALG03
    ALG01 --> ALG04
    SZA14 --> ALG04
    ALG03 --> ALG05
    ALG01 --> ALG06
    SZA14 --> ALG06
    ALG06 --> ALG07 --> ALG10
    ALG03 --> ALG07

    classDef fo fill:#c55a11,stroke:#843c0c,color:#fff;
    classDef kulso fill:#f0f0f0,stroke:#aaa,stroke-dasharray:4 3,color:#666;
    class ALG03 fo;
    class SZA12,SZA14,SZA04 kulso;
```

## Függőségi gráf — kifejezésektől az egyenletekig

```mermaid
graph TD
    SZA05(["SZA-05<br/>Műveleti tulajdonságok"])
    FUG10(["FUG-10<br/>Lineáris függvény"])
    FUG12(["FUG-12<br/>Másodfokú függvény"])
    FUG16(["FUG-16<br/>Függvény-<br/>transzformációk"])
    SZA33(["SZA-33<br/>Logaritmus"])

    ALG08["ALG-08 ⭐<br/>Betűs kifejezés,<br/>helyettesítési érték"]
    ALG09["ALG-09<br/>Egynemű kifejezések<br/>összevonása"]
    ALG11["ALG-11<br/>Szorzás számmal,<br/>kiemelés"]
    ALG12["ALG-12<br/>Elsőfokú egyenlet<br/>lebontogatással"]
    ALG13["ALG-13 ⭐<br/>Mérlegelv"]
    ALG14["ALG-14<br/>Műveletek algebrai<br/>kifejezésekkel, polinomok"]
    ALG15["ALG-15<br/>Szöveges feladat<br/>egyenlettel"]
    ALG16["ALG-16 ⭐<br/>Alaphalmaz, megoldáshalmaz,<br/>ekvivalens átalakítás"]
    ALG17["ALG-17 ⭐<br/>Nevezetes azonosságok"]
    ALG18["ALG-18<br/>Elsőfokú<br/>egyenlőtlenségek"]
    ALG19["ALG-19<br/>Elsőfokú kétismeretlenes<br/>egyenletrendszer"]
    ALG20["ALG-20<br/>Teljes négyzetté<br/>alakítás"]
    ALG21["ALG-21<br/>Szorzattá alakítás"]
    ALG22["ALG-22<br/>Grafikus<br/>egyenletmegoldás"]
    ALG23["ALG-23<br/>Másodfokú egyenlet:<br/>szorzat- és teljesnégyzet-alak"]
    ALG24["ALG-24 ⭐<br/>Megoldóképlet,<br/>diszkrimináns"]
    ALG25["ALG-25<br/>Gyöktényezős alak"]
    ALG26["ALG-26<br/>Másodfokúra<br/>visszavezethető egyenletek"]
    ALG27["ALG-27<br/>Másodfokú<br/>egyenlőtlenség"]
    ALG28["ALG-28<br/>Exponenciális és<br/>logaritmusos egyenletek"]
    ALG02(["ALG-02<br/>Modellalkotás"])

    SZA05 --> ALG08
    ALG08 --> ALG09 --> ALG11 --> ALG14
    ALG08 --> ALG12 --> ALG13
    ALG13 --> ALG15
    ALG02 --> ALG15
    ALG13 --> ALG16
    ALG14 --> ALG17
    ALG16 --> ALG18
    ALG16 --> ALG19
    ALG17 --> ALG20
    ALG17 --> ALG21
    ALG11 --> ALG21
    ALG16 --> ALG22
    FUG10 --> ALG22
    ALG20 --> ALG23
    ALG21 --> ALG23
    ALG16 --> ALG23
    ALG23 --> ALG24
    ALG24 --> ALG25
    ALG24 --> ALG26
    ALG24 --> ALG27
    FUG12 --> ALG27
    SZA33 --> ALG28
    ALG16 --> ALG28
    FUG16 --> ALG28

    classDef fo fill:#c55a11,stroke:#843c0c,color:#fff;
    classDef kulso fill:#f0f0f0,stroke:#aaa,stroke-dasharray:4 3,color:#666;
    class ALG08,ALG13,ALG16,ALG17,ALG24 fo;
    class SZA05,FUG10,FUG12,FUG16,SZA33,ALG02 kulso;
```

## Csomópontok

### I. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-01** | Arány, aránypár | Két mennyiség viszonyának kifejezése hányadossal; aránypár felírása és olvasása. A tört fogalmának „relációs" olvasata. | *SZA-12* |
| **ALG-02** | Egyszerű szöveges feladatok: modellalkotás, következtetés | Szövegből a matematikai tartalom kiemelése; megoldás szakaszos ábrázolással, visszafelé gondolkodással, táblázattal. Az ellenőrzés a szövegbe visszahelyettesítéssel. | *SZA-04* |

### II. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-03** ⭐ | Egyenes arányosság | Két mennyiség együtt változása állandó hányadossal; felismerés hétköznapi helyzetekben; következtetés egyről többre és többről egyre; arányos osztás (adott mennyiség felosztása megadott arányban). | ALG-01 |
| **ALG-04** | Mértékegységek és átváltásuk | Hosszúság, tömeg, idő, terület, térfogat, űrtartalom szabványegységei; átváltás helyiértékes gondolkodással; származtatott mértékegységek (sebesség, sűrűség). | ALG-01, *SZA-14* |
| **ALG-06** | A százalék fogalma | A százalék mint századrész; kapcsolat a törttel és a tizedes törttel; százalékos adatok értelmezése a hétköznapokban. | ALG-01, *SZA-14* |

### III. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-05** | Fordított arányosság | Két mennyiség együtt változása állandó szorzattal; felismerés munkavégzési, mozgási és mérési helyzetekben. | ALG-03 |
| **ALG-07** | Százalékszámítás: alap, érték, láb, pont | A három alapfeladat (érték, alap, láb keresése); a százalékpont és a százalék megkülönböztetése; egymást követő százalékos változások. | ALG-06, ALG-03 |

### IV. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-08** ⭐ | Betűs kifejezés, változó, együttható, helyettesítési érték | Betűk használata ismeretlen vagy változó mennyiség jelölésére; egytagú és többtagú kifejezés; helyettesítési érték számolása. | *SZA-05* |

### V. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-09** | Egynemű kifejezések összevonása | Az egynemű tagok felismerése és összevonása; a rendezés mint a kifejezés egyszerűbb alakra hozása. | ALG-08 |
| **ALG-10** | Pénzügyi alapszámítások | Áremelés és leárazás, egyszerű kamat, keverési feladatok; banki ajánlatok, díjak összehasonlítása; bevétel–kiadás egyensúly. | ALG-07 |
| **ALG-12** | Elsőfokú egyenlet megoldása lebontogatással | A műveletsor „visszafejtése" az ismeretlen felszabadításáig. Intuitív, de csak egyszerű szerkezetű egyenletekre működik. | ALG-08 |

### VI. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-11** | Szorzás számmal, közös tényező kiemelése | Kéttagú kifejezés szorzása számmal (disztributivitás); a művelet megfordítása: közös tényező kiemelése. | ALG-09 |
| **ALG-13** ⭐ | Mérlegelv | Az egyenlet mint egyensúly; mindkét oldalon azonos átalakítás végzése. Az egyetemes egyenletmegoldó módszer, amely tetszőleges szerkezetre működik. | ALG-12 |

### VII. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-14** | Műveletek algebrai kifejezésekkel, polinomok | Összeadás, kivonás, szorzás, osztás algebrai kifejezésekkel; egytagú kifejezés hatványa; a polinom fogalma és foka. | ALG-11 |
| **ALG-15** | Szöveges feladat megoldása egyenlettel | Az ismeretlen megválasztása, egyenlet felírása, megoldás, majd értelmezés és ellenőrzés az eredeti szövegben. Út–idő–sebesség, közös munkavégzés, keverés, pénzügyi feladatok. | ALG-13, ALG-02 |
| **ALG-16** ⭐ | Alaphalmaz, megoldáshalmaz, ekvivalens átalakítás | Annak tudatosítása, hogy a megoldáshalmaz az alaphalmaztól függ; ekvivalens és nem ekvivalens lépések megkülönböztetése; hamis gyök és gyökvesztés. | ALG-13 |
| **ALG-17** ⭐ | Nevezetes azonosságok | `(a+b)²`, `(a−b)²`, `(a+b)(a−b)` ismerete, geometriai szemléltetése és kétirányú alkalmazása (kifejtés és szorzattá alakítás). | ALG-14 |

### VIII. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-18** | Elsőfokú egyenlőtlenségek | Megoldás mérlegelvvel; a negatív számmal való szorzás relációfordító hatása; a megoldáshalmaz megadása intervallummal. | ALG-16 |
| **ALG-19** | Elsőfokú kétismeretlenes egyenletrendszer | Megoldás behelyettesítéssel, egyenlő együtthatók módszerével és grafikusan; a megoldások számának geometriai jelentése. | ALG-16 |
| **ALG-20** | Teljes négyzetté alakítás | Másodfokú kifejezés `a(x+p)² + q` alakra hozása. A másodfokú függvény ábrázolásának és a megoldóképlet levezetésének közös eszköze. | ALG-17 |
| **ALG-21** | Szorzattá alakítás | Kiemelés és nevezetes azonosságok kombinált alkalmazása; a szorzat nulla voltára vonatkozó elv (`ab = 0 ⇔ a = 0 vagy b = 0`). | ALG-17, ALG-11 |
| **ALG-22** | Grafikus egyenletmegoldás | Az egyenlet két oldalának függvényként való ábrázolása; a metszéspontok mint megoldások; közelítő megoldás digitális eszközzel. | ALG-16, *FUG-10* |

### IX. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-23** | Másodfokú egyenlet: szorzattá alakítás és teljes négyzetté kiegészítés | A két „kézi" megoldási módszer; annak felismerése, melyik egyenletnél melyik gazdaságosabb. | ALG-20, ALG-21, ALG-16 |

### X. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-24** ⭐ | Megoldóképlet és diszkrimináns | A megoldóképlet levezetése teljes négyzetté alakítással; a diszkrimináns előjele és a valós gyökök száma közti kapcsolat. | ALG-23 |

### XI. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-25** | Gyöktényezős alak | `a(x−x₁)(x−x₂)` felírása; a gyökök és az együtthatók közti összefüggés; alkalmazás szorzattá alakításnál és szöveges feladatoknál. | ALG-24 |
| **ALG-26** | Másodfokúra visszavezethető egyenletek | Új ismeretlen bevezetése (helyettesítés); a kapott gyökök visszahelyettesítése és ellenőrzése. | ALG-24 |
| **ALG-27** | Másodfokú egyenlőtlenség | Megoldás a parabola grafikonja alapján; előjelvizsgálat a gyöktényezős alakkal; a megoldáshalmaz megadása intervallumokkal. | ALG-24, *FUG-12* |

### XII. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ALG-28** | Exponenciális és logaritmusos egyenletek, egyenlőtlenségek | Azonos alapra hozás, a definíció alkalmazása, logaritmusvétel; az értelmezési tartomány és a monotonitás figyelembevétele egyenlőtlenségeknél. | *SZA-33*, ALG-16, *FUG-16* |

## Kapcsolódás a többi ághoz

| Innen indul | Ide vezet | Miért |
|---|---|---|
| ALG-03, ALG-05 | FUG-06, FUG-07 | Az arányosságok az első „igazi" függvények. |
| ALG-03 | GEO-21, GEO-22 | A középponti szög egyenesen arányos a körívvel és a körcikk területével. |
| ALG-04 | GEO-15 | Mérés nélkül nincs kerület- és területszámítás. |
| ALG-19 | GEO-60 | Két egyenes metszéspontja egyenletrendszer megoldása. |
| ALG-20 | FUG-12, GEO-61 | Parabola csúcspontja és a kör egyenletének teljes négyzetté alakítása. |
| ALG-10 | FUG-23 | Kamatos kamat = mértani sorozat. |

# 5. ág — Geometria

> „A Tér ága" · kód: `GEO` · 61 csomópont

A legnagyobb ág, öt jól elkülönülő szakasszal:

| Szakasz | Csomópontok | Mi történik itt |
|---|---|---|
| **Alapok és síkidomok** | `GEO-01`–`GEO-14` | Fogalomépítés: térelemek, szögek, háromszögek, négyszögek, kör |
| **Mérés** | `GEO-15`–`GEO-22` | Kerület és terület; az átdarabolás mint univerzális módszer |
| **Transzformációk** | `GEO-23`–`GEO-35` | Egybevágóság és hasonlóság; vektorok |
| **Nevezetes tételek és trigonometria** | `GEO-36`–`GEO-45` | Pitagorasz, Thalész, szögfüggvények, szinusz- és koszinusztétel |
| **Tér- és koordinátageometria** | `GEO-46`–`GEO-61` | Testek, felszín, térfogat; a geometria algebrai leírása |

## Függőségi gráf — alapok, síkidomok, mérés

```mermaid
graph TD
    ALG04(["ALG-04<br/>Mértékegységek"])
    ALG03(["ALG-03<br/>Egyenes arányosság"])
    GEO23x(["GEO-23<br/>Egybevágóság"])
    GEO13x(["GEO-13<br/>Szabályos sokszög"])

    GEO01["GEO-01 ⭐<br/>Térelemek"]
    GEO02["GEO-02<br/>Szög, szögmérés"]
    GEO03["GEO-03<br/>Párhuzamosság,<br/>merőlegesség"]
    GEO04["GEO-04 ⭐<br/>Alapszerkesztések"]
    GEO05["GEO-05<br/>Nevezetes szögpárok"]
    GEO06["GEO-06<br/>Sokszög, konvex,<br/>konkáv, átló"]
    GEO07["GEO-07 ⭐<br/>Háromszög szögei,<br/>háromszög-egyenlőtlenség"]
    GEO08["GEO-08<br/>Háromszögek<br/>osztályozása"]
    GEO09["GEO-09<br/>Háromszög<br/>külső szögei"]
    GEO10["GEO-10<br/>Négyszögek szögösszege"]
    GEO11["GEO-11<br/>Speciális négyszögek"]
    GEO12["GEO-12<br/>Konvex sokszög<br/>átlói és szögei"]
    GEO13["GEO-13<br/>Szabályos sokszög"]
    GEO14["GEO-14<br/>A kör és részei"]

    GEO15["GEO-15<br/>Kerület és terület<br/>fogalma"]
    GEO16["GEO-16<br/>Téglalap, négyzet<br/>kerülete, területe"]
    GEO17["GEO-17 ⭐<br/>Átdarabolás elve"]
    GEO18["GEO-18<br/>Háromszög területe"]
    GEO19["GEO-19<br/>Speciális négyszögek<br/>területe"]
    GEO20["GEO-20<br/>Sokszögek területe"]
    GEO21["GEO-21<br/>Kör kerülete, területe"]
    GEO22["GEO-22<br/>Körcikk, körgyűrű,<br/>körszelet"]

    GEO01 --> GEO02
    GEO01 --> GEO03
    GEO02 --> GEO04
    GEO03 --> GEO04
    GEO02 --> GEO05
    GEO03 --> GEO05
    GEO01 --> GEO06
    GEO06 --> GEO07
    GEO05 --> GEO07
    GEO07 --> GEO08
    GEO07 --> GEO09
    GEO06 --> GEO10
    GEO07 --> GEO10
    GEO10 --> GEO11
    GEO23x -.-> GEO11
    GEO10 --> GEO12
    GEO12 --> GEO13
    GEO01 --> GEO14
    GEO02 --> GEO14

    ALG04 -.-> GEO15
    GEO15 --> GEO16
    GEO06 --> GEO16
    GEO16 --> GEO17
    GEO17 --> GEO18
    GEO08 --> GEO18
    GEO17 --> GEO19
    GEO11 --> GEO19
    GEO19 --> GEO20
    GEO13x -.-> GEO20
    GEO14 --> GEO21
    ALG03 -.-> GEO21
    GEO21 --> GEO22

    classDef fo fill:#c55a11,stroke:#843c0c,color:#fff;
    classDef kulso fill:#f0f0f0,stroke:#aaa,stroke-dasharray:4 3,color:#666;
    class GEO01,GEO04,GEO07,GEO17 fo;
    class ALG04,ALG03,GEO23x,GEO13x kulso;
```

## Függőségi gráf — transzformációk és nevezetes tételek

```mermaid
graph TD
    GEO01x(["GEO-01<br/>Térelemek"])
    GEO04x(["GEO-04<br/>Alapszerkesztések"])
    GEO08x(["GEO-08<br/>Háromszögfajták"])
    GEO14x(["GEO-14<br/>A kör"])
    GEO18x(["GEO-18<br/>Háromszög területe"])
    GEO20x(["GEO-20<br/>Sokszögek területe"])
    SZA22(["SZA-22<br/>Négyzetgyök"])
    LOG14(["LOG-14<br/>Tétel, bizonyítás"])

    GEO23["GEO-23 ⭐<br/>Egybevágóság,<br/>síkbeli mozgások"]
    GEO24["GEO-24<br/>Tengelyes tükrözés"]
    GEO25["GEO-25<br/>Középpontos tükrözés"]
    GEO26["GEO-26<br/>Pont körüli forgatás"]
    GEO27["GEO-27<br/>Párhuzamos eltolás"]
    GEO28["GEO-28 ⭐<br/>Vektor, vektorműveletek"]
    GEO29["GEO-29<br/>Egybevágósági<br/>transzformációk rendszere"]
    GEO30["GEO-30<br/>Háromszögek egybevágóságának<br/>alapesetei"]
    GEO31["GEO-31<br/>Kicsinyítés, nagyítás"]
    GEO32["GEO-32<br/>Középpontos hasonlóság"]
    GEO33["GEO-33 ⭐<br/>Hasonló háromszögek"]
    GEO34["GEO-34<br/>Hasonló síkidomok<br/>kerület- és területaránya"]
    GEO35["GEO-35<br/>Szerkesztési feladatok,<br/>diszkusszió"]

    GEO36["GEO-36 ⭐<br/>Pitagorasz-tétel"]
    GEO37["GEO-37<br/>Thalész-tétel"]
    GEO38["GEO-38<br/>Nevezetes vonalak"]
    GEO39["GEO-39<br/>Nevezetes pontok<br/>és körök"]
    GEO40["GEO-40 ⭐<br/>Hegyesszögek<br/>szögfüggvényei"]
    GEO41["GEO-41<br/>Tompaszögek szögfüggvényei,<br/>összefüggések"]
    GEO42["GEO-42<br/>Szög meghatározása<br/>szögfüggvényből"]
    GEO43["GEO-43<br/>Terület két oldalból<br/>és közbezárt szögből"]
    GEO44["GEO-44<br/>Szinusztétel"]
    GEO45["GEO-45<br/>Koszinusztétel"]

    GEO01x --> GEO23
    GEO23 --> GEO24
    GEO04x --> GEO24
    GEO24 --> GEO25 --> GEO26
    GEO23 --> GEO27 --> GEO28
    GEO24 --> GEO29
    GEO26 --> GEO29
    GEO27 --> GEO29
    GEO29 --> GEO30
    GEO08x --> GEO30
    GEO23 --> GEO31 --> GEO32
    GEO29 --> GEO32 --> GEO33
    GEO30 --> GEO33 --> GEO34
    GEO20x --> GEO34
    GEO04x --> GEO35
    GEO29 --> GEO35

    GEO18x --> GEO36
    SZA22 --> GEO36
    GEO14x --> GEO37
    GEO08x --> GEO37
    LOG14 --> GEO37
    GEO04x --> GEO38
    GEO08x --> GEO38 --> GEO39
    GEO36 --> GEO40
    GEO33 --> GEO40
    GEO40 --> GEO41
    GEO40 --> GEO42
    GEO41 --> GEO43
    GEO18x --> GEO43
    GEO43 --> GEO44
    GEO43 --> GEO45
    GEO36 --> GEO45

    classDef fo fill:#c55a11,stroke:#843c0c,color:#fff;
    classDef kulso fill:#f0f0f0,stroke:#aaa,stroke-dasharray:4 3,color:#666;
    class GEO23,GEO28,GEO33,GEO36,GEO40 fo;
    class GEO01x,GEO04x,GEO08x,GEO14x,GEO18x,GEO20x,SZA22,LOG14 kulso;
```

## Függőségi gráf — tér- és koordinátageometria

```mermaid
graph TD
    GEO01y(["GEO-01<br/>Térelemek"])
    GEO06y(["GEO-06<br/>Sokszög"])
    GEO14y(["GEO-14<br/>A kör"])
    GEO16y(["GEO-16<br/>Téglalap területe"])
    GEO19y(["GEO-19<br/>Négyszögek területe"])
    GEO22y(["GEO-22<br/>Körcikk, körszelet"])
    GEO03y(["GEO-03<br/>Párhuzamosság,<br/>merőlegesség"])
    GEO05y(["GEO-05<br/>Szögpárok"])
    GEO34y(["GEO-34<br/>Hasonló síkidomok aránya"])
    GEO40y(["GEO-40<br/>Szögfüggvények"])
    GEO28y(["GEO-28<br/>Vektorok"])
    GEO36y(["GEO-36<br/>Pitagorasz-tétel"])
    FUG03(["FUG-03<br/>Koordináta-rendszer"])
    FUG10(["FUG-10<br/>Lineáris függvény"])
    ALG19(["ALG-19<br/>Egyenletrendszer"])
    ALG20(["ALG-20<br/>Teljes négyzet"])

    GEO46["GEO-46 ⭐<br/>Kocka, téglatest,<br/>lap, él, csúcs, testátló"]
    GEO47["GEO-47<br/>Nézetek, alaprajz,<br/>háló, testépítés"]
    GEO48["GEO-48<br/>Hasáb és gúla"]
    GEO49["GEO-49<br/>A gömb"]
    GEO50["GEO-50<br/>Téglatest, kocka<br/>felszíne, térfogata"]
    GEO51["GEO-51<br/>Egyenes hasáb<br/>felszíne, térfogata"]
    GEO52["GEO-52<br/>Térelemek helyzete,<br/>távolsága, hajlásszöge"]
    GEO53["GEO-53<br/>Henger, kúp,<br/>csonkatestek"]
    GEO54["GEO-54 ⭐<br/>Speciális testek<br/>felszíne, térfogata"]
    GEO55["GEO-55<br/>Hasonló testek<br/>felszín- és térfogataránya"]

    GEO56["GEO-56 ⭐<br/>Pont és vektor<br/>koordinátái"]
    GEO57["GEO-57<br/>Távolság,<br/>szakaszfelező pont"]
    GEO58["GEO-58<br/>Vektorműveletek<br/>koordinátákkal"]
    GEO59["GEO-59<br/>Az egyenes egyenlete,<br/>meredekség"]
    GEO60["GEO-60<br/>Egyenesek helyzete,<br/>metszéspontja"]
    GEO61["GEO-61<br/>A kör egyenlete"]

    GEO01y --> GEO46 --> GEO47
    GEO46 --> GEO48
    GEO06y --> GEO48
    GEO46 --> GEO49
    GEO14y --> GEO49
    GEO46 --> GEO50
    GEO16y --> GEO50
    GEO50 --> GEO51
    GEO48 --> GEO51
    GEO19y --> GEO51
    GEO03y --> GEO52
    GEO05y --> GEO52
    GEO48 --> GEO52
    GEO48 --> GEO53
    GEO49 --> GEO53
    GEO53 --> GEO54
    GEO51 --> GEO54
    GEO22y --> GEO54
    GEO40y --> GEO54
    GEO54 --> GEO55
    GEO34y --> GEO55

    GEO28y --> GEO56
    FUG03 --> GEO56
    GEO56 --> GEO57
    GEO36y --> GEO57
    GEO56 --> GEO58 --> GEO59
    FUG10 --> GEO59 --> GEO60
    ALG19 --> GEO60
    GEO57 --> GEO61
    ALG20 --> GEO61

    classDef fo fill:#c55a11,stroke:#843c0c,color:#fff;
    classDef kulso fill:#f0f0f0,stroke:#aaa,stroke-dasharray:4 3,color:#666;
    class GEO46,GEO54,GEO56 fo;
    class GEO01y,GEO06y,GEO14y,GEO16y,GEO19y,GEO22y,GEO03y,GEO05y,GEO34y,GEO40y,GEO28y,GEO36y,FUG03,FUG10,ALG19,ALG20 kulso;
```

---

## Csomópontok — Alapok és síkidomok

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **GEO-01** ⭐ | Térelemek: pont, egyenes, sík; szakasz, félegyenes | A geometria alapfogalmai; egyenes, félegyenes és szakasz megkülönböztetése; illeszkedés. | — |
| **GEO-02** | Szög, szögmérés, szögfajták | A szögtartomány mint síkrész; mérés fokban (és szögpercben); hegyes-, derék-, tompa-, egyenes-, homorú- és teljesszög. | GEO-01 |
| **GEO-03** | Párhuzamosság és merőlegesség | Egyenesek kölcsönös helyzete a síkban; két pont, pont és egyenes, két párhuzamos egyenes távolsága. | GEO-01 |
| **GEO-04** ⭐ | Alapszerkesztések | Szakaszfelező merőleges, szögfelező, merőleges és párhuzamos egyenes szerkesztése, szögmásolás – körzővel és egyélű vonalzóval, illetve dinamikus geometriai szoftverrel. Ezek a további szerkesztések „építőkockái". | GEO-02, GEO-03 |
| **GEO-05** | Nevezetes szögpárok | Pótszögek, mellékszögek, kiegészítő szögek, csúcsszögek, egyállású szögek, váltószögek – és a párhuzamos szelők tulajdonságai. | GEO-02, GEO-03 |
| **GEO-06** | Sokszög; konvex és konkáv; átló | Zárt töröttvonal által határolt síkidom; a konvexitás szemléletes és pontos jelentése; az átló fogalma. | GEO-01 |
| **GEO-07** ⭐ | Háromszög szögei, háromszög-egyenlőtlenség | A belső szögek összege 180°, és ennek bizonyítása párhuzamos szelőkkel; annak feltétele, hogy három szakaszból háromszög szerkeszthető. | GEO-06, GEO-05 |
| **GEO-08** | Háromszögek osztályozása | Csoportosítás szögek szerint (hegyes-, derék-, tompaszögű) és oldalak szerint (általános, egyenlő szárú, szabályos); a tengelyesen szimmetrikus háromszögek. | GEO-07 |
| **GEO-09** | A háromszög külső szögei | A külső szög és a nem mellette fekvő belső szögek kapcsolata; a külső szögek összege 360°. | GEO-07 |
| **GEO-10** | Négyszögek: belső és külső szögösszeg | A 360°-os belső szögösszeg levezetése átlóval való háromszögekre bontással; konvex és konkáv négyszögek. | GEO-06, GEO-07 |
| **GEO-11** | Speciális négyszögek és halmazábrájuk | Trapéz, húrtrapéz, paralelogramma, deltoid, rombusz, téglalap, négyzet tulajdonságai (oldalak, szögek, átlók, szimmetriák) és tartalmazási viszonyaik. | GEO-10, GEO-23 |
| **GEO-12** | Konvex sokszög átlói és szögösszege | Az `n(n−3)/2` átlószám és az `(n−2)·180°` belső szögösszeg tétele, bizonyítással. | GEO-10 |
| **GEO-13** | Szabályos sokszög | Egyenlő oldalak és egyenlő szögek; a középponti szög, a körülírt és a beírt kör. | GEO-12 |
| **GEO-14** | A kör és részei | Körvonal és körlap; középpont, sugár, húr, átmérő, szelő, érintő, körív, körcikk, körszelet; a középponti szög. | GEO-01, GEO-02 |

## Csomópontok — Mérés: kerület és terület

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **GEO-15** | Kerület és terület fogalma, mérése | A mérés alapelve: egységválasztás és összehasonlítás; a terület mint lefedés egységnégyzetekkel; alkalmi és szabványegységek. | *ALG-04* |
| **GEO-16** | Téglalap és négyzet kerülete, területe | Az `a · b` területképlet megalapozása; a kerület és a terület független változása azonos alakzatcsaládon belül. | GEO-15, GEO-06 |
| **GEO-17** ⭐ | Az átdarabolás elve | Annak felismerése, hogy egy alakzat darabokra vágva és átrendezve ugyanakkora területű. Ez az elv adja meg szinte az összes további területképletet. | GEO-16 |
| **GEO-18** | A háromszög területe | Az `a · mₐ / 2` képlet levezetése átdarabolással vagy paralelogrammából; a magasság megválasztásának szabadsága. | GEO-17, GEO-08 |
| **GEO-19** | Speciális négyszögek területe | Paralelogramma, trapéz, deltoid, rombusz területképletei, mindegyik átdarabolással megalapozva. | GEO-17, GEO-11 |
| **GEO-20** | Sokszögek területe | Tetszőleges sokszög területének meghatározása háromszögekre bontással vagy átdarabolással; szabályos sokszög területe. | GEO-19, GEO-13 |
| **GEO-21** | A kör kerülete és területe | A π mint állandó arány; a `2rπ` és az `r²π` képlet szemléletes megalapozása; a kör mint sokszögek határhelyzete. | GEO-14, *ALG-03* |
| **GEO-22** | Körív, körcikk, körgyűrű, körszelet | Annak alkalmazása, hogy a középponti szög egyenesen arányos az ívhosszal és a körcikk területével; összetett síkidomok kerülete és területe. | GEO-21, *ALG-03* |

## Csomópontok — Transzformációk

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **GEO-23** ⭐ | Egybevágóság, síkbeli mozgások | Az „ugyanolyan alakú és méretű" viszony; egybevágó alakzatok felismerése; a mozgatás mint alakzatokat átvivő leképezés. | GEO-01 |
| **GEO-24** | Tengelyes tükrözés és tengelyes szimmetria | A transzformáció tulajdonságai (távolság- és szögtartás, körüljárási irány megfordítása); tükörkép szerkesztése; szimmetriatengely keresése. | GEO-23, GEO-04 |
| **GEO-25** | Középpontos tükrözés és középpontos szimmetria | A 180°-os elforgatásként is felfogható tükrözés; tulajdonságai és szerkesztése; középpontosan szimmetrikus alakzatok. | GEO-24 |
| **GEO-26** | Pont körüli forgatás | Forgásközéppont és forgásszög; a forgatás mint két tengelyes tükrözés egymásutánja; forgásszimmetria. | GEO-25 |
| **GEO-27** | Párhuzamos eltolás | Irány, irányítás és nagyság megadása; az eltolás mint két párhuzamos tengelyű tükrözés eredője. | GEO-23 |
| **GEO-28** ⭐ | Vektor, vektorműveletek | A vektor fogalmának kialakítása az eltolásból; abszolút érték, nullvektor, ellentett vektor, helyvektor; összeadás, kivonás, számmal való szorzás. | GEO-27 |
| **GEO-29** | Az egybevágósági transzformációk rendszere | A négy alaptranszformáció összehasonlítása és egymás utáni végrehajtása; alkalmazásuk feladatmegoldásban és bizonyításban; parkettázás. | GEO-24, GEO-26, GEO-27 |
| **GEO-30** | Háromszögek egybevágóságának alapesetei | Az SSS, SAS, ASA és SsA esetek; alkalmazásuk szerkesztéseknél és bizonyításoknál. | GEO-29, GEO-08 |
| **GEO-31** | Kicsinyítés és nagyítás | Az alakhű méretváltoztatás felismerése hétköznapi helyzetekben: térkép, makett, fénykép, tervrajz. | GEO-23 |
| **GEO-32** | Középpontos hasonlóság és hasonlósági transzformáció | Hasonlósági középpont és arány; a transzformáció tulajdonságai; a hasonlóság mint középpontos hasonlóság és egybevágóság egymásutánja. | GEO-31, GEO-29 |
| **GEO-33** ⭐ | Hasonló háromszögek | A hasonlóság alapesetei; párhuzamos szelők tétele; alkalmazás magasság- és távolságmérésre („Thalész-módszer"). | GEO-32, GEO-30 |
| **GEO-34** | Hasonló síkidomok kerületének és területének aránya | A kerület aránya `λ`, a területé `λ²` – és annak megértése, miért nem ugyanaz a kettő. | GEO-33, GEO-20 |
| **GEO-35** | Szerkesztési feladatok, diszkusszió | Több feltételnek megfelelő ábra szerkesztése: elemzés, szerkesztés, bizonyítás, diszkusszió. A megoldások számának vizsgálata. | GEO-04, GEO-29 |

## Csomópontok — Nevezetes tételek és trigonometria

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **GEO-36** ⭐ | Pitagorasz-tétel és megfordítása | `a² + b² = c²` derékszögű háromszögben; bizonyítás átdarabolással; a megfordítás használata a derékszögűség igazolására; pitagoraszi számhármasok. | GEO-18, *SZA-22* |
| **GEO-37** | Thalész-tétel és megfordítása | A kör átmérője fölé rajzolt kerületi szög derékszög; bizonyítás egyenlő szárú háromszögekkel; alkalmazás érintőszerkesztésnél. | GEO-14, GEO-08, *LOG-14* |
| **GEO-38** | A háromszög nevezetes vonalai | Oldalfelező merőleges, szögfelező, magasságvonal, súlyvonal, középvonal – definícióik és alaptulajdonságaik. | GEO-04, GEO-08 |
| **GEO-39** | A háromszög nevezetes pontjai és körei | Az oldalfelező merőlegesek és a belső szögfelezők metszéspontjára vonatkozó tétel bizonyítása; körülírt és beírt kör; súlypont, magasságpont. | GEO-38 |
| **GEO-40** ⭐ | Hegyesszögek szögfüggvényei | Szinusz, koszinusz, tangens definíciója derékszögű háromszögben; a definíció jogosságának hasonlóságon alapuló indoklása; számítások gyakorlati helyzetekben. | GEO-36, GEO-33 |
| **GEO-41** | Tompaszögek szögfüggvényei, összefüggések | A szögfüggvények kiterjesztése tompaszögre; a pitagoraszi összefüggés (`sin²α + cos²α = 1`), a pótszögek és mellékszögek szögfüggvényei; `tg α = sin α / cos α`. | GEO-40 |
| **GEO-42** | Szög meghatározása szögfüggvény értékéből | Az inverz szögfüggvények használata számológéppel; a több lehetséges megoldás mérlegelése a feladat kontextusában. | GEO-40 |
| **GEO-43** | Háromszög területe két oldalból és a közbezárt szögből | A `T = (a·b·sin γ)/2` képlet levezetése és alkalmazása; négyszögek és szabályos sokszögek területe szögfüggvényekkel. | GEO-41, GEO-18 |
| **GEO-44** | Szinusztétel | `a / sin α = b / sin β = c / sin γ = 2R`; a tétel bizonyítása; alkalmazása háromszög hiányzó adatainak meghatározására. | GEO-43 |
| **GEO-45** | Koszinusztétel | `c² = a² + b² − 2ab·cos γ` mint a Pitagorasz-tétel általánosítása; alkalmazása, ha két oldal és a közbezárt szög, vagy mindhárom oldal ismert. | GEO-43, GEO-36 |

## Csomópontok — Térgeometria

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **GEO-46** ⭐ | Kocka és téglatest; lap, él, csúcs, lapátló, testátló | A testek elemeinek megnevezése és megszámlálása; a határoló lapok egymáshoz viszonyított helyzete. | GEO-01 |
| **GEO-47** | Nézetek, alaprajz, háló, testépítés | Test és síkbeli ábrázolása közti oda-vissza fordítás; háló készítése és hálóból való építés. A térszemlélet alapgyakorlata. | GEO-46 |
| **GEO-48** | Hasáb és gúla | Alaplap, oldallap, alapél, oldalél, testmagasság; egyenes és ferde hasáb; szabályos gúla, tetraéder. | GEO-46, GEO-06 |
| **GEO-49** | A gömb | A gömb mint adott ponttól egyenlő távolságra lévő pontok halmaza; síkmetszetei; a gömb mint a Föld modellje (hosszúsági és szélességi körök). | GEO-46, GEO-14 |
| **GEO-50** | Téglatest és kocka felszíne, térfogata | A felszín mint a háló területe; a térfogat mint egységkockákkal való kitöltés; az `a·b·c` képlet megalapozása. | GEO-46, GEO-16 |
| **GEO-51** | Egyenes hasáb felszíne és térfogata | `A = 2T_alap + P_alap · m` és `V = T_alap · m`; a képleteket megalapozó összefüggések megértése. | GEO-50, GEO-48, GEO-19 |
| **GEO-52** | Térelemek kölcsönös helyzete, távolsága, hajlásszöge | Egyenesek és síkok illeszkedése, párhuzamossága, kitérő helyzete; pont–sík és egyenes–sík távolság; lapszög. | GEO-03, GEO-05, GEO-48 |
| **GEO-53** | Forgástestek és csonkatestek | Henger, kúp, csonkagúla, csonkakúp; alkotó, palást, forgástengely; síkidomok forgatásával keletkező testek. | GEO-48, GEO-49 |
| **GEO-54** ⭐ | Speciális testek felszíne és térfogata | Hasáb, henger, gúla, kúp, gömb, csonkagúla, csonkakúp felszíne és térfogata; összetett testek és a mindennapi élet tárgyainak számításai. | GEO-53, GEO-51, GEO-22, GEO-40 |
| **GEO-55** | Hasonló testek felszínének és térfogatának aránya | A felszín aránya `λ²`, a térfogaté `λ³`; alkalmazás modellek és makettek méretezésénél. | GEO-54, GEO-34 |

## Csomópontok — Koordinátageometria

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **GEO-56** ⭐ | Pont és vektor koordinátái | Pont és helyvektor megadása számpárral; annak felismerése, hogy ettől kezdve a geometriai állítások algebrai számolássá alakíthatók. | GEO-28, *FUG-03* |
| **GEO-57** | Két pont távolsága, szakaszfelező pont | A távolságképlet levezetése a Pitagorasz-tételből; a felezőpont koordinátái a végpontokból. | GEO-56, *GEO-36* |
| **GEO-58** | Vektorműveletek koordinátákkal | Összeg, különbség és számszoros koordinátái; a vektor abszolút értéke; alkalmazás geometriai feladatokban. | GEO-56 |
| **GEO-59** | Az egyenes egyenlete, meredekség | Az `y = mx + b` és az `x = c` alak; a meredekség geometriai jelentése; egyenesek merőlegességének és párhuzamosságának feltétele a meredekségekkel. | GEO-58, *FUG-10* |
| **GEO-60** | Egyenesek kölcsönös helyzete, metszéspontja | A metszéspont meghatározása egyenletrendszer megoldásával; a megoldások száma és a geometriai helyzet kapcsolata. | GEO-59, *ALG-19* |
| **GEO-61** | A kör egyenlete | `(x − u)² + (y − v)² = r²` felírása és értelmezése; a középpont és a sugár kiolvasása teljes négyzetté alakítással. | GEO-57, *ALG-20* |

## Kapcsolódás a többi ághoz

| Innen indul | Ide vezet | Miért |
|---|---|---|
| GEO-20 | ESE-28 | A geometriai valószínűség területarányokon alapul. |
| GEO-28 | FUG — | A vektor a fizikai és geometriai modellezés közös nyelve. |
| GEO-36 | SZA-24 | A √2 mint egységnégyzet átlója: itt jelenik meg először irracionális szám geometriailag. |
| GEO-17 | ALG-17 | A nevezetes azonosságok geometriai megjelenítése ugyanaz az átdarabolási gondolat. |

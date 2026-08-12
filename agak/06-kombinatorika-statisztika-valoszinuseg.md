# 6. ág — Kombinatorika, statisztika és valószínűség

> „Az Esély ága" · kód: `ESE` · 29 csomópont

Ez az ág a **bizonytalanság kezeléséről** szól. Három, sokáig párhuzamosan futó szála van,
amelyek a valószínűség fogalmánál kapcsolódnak össze:

- **kombinatorika és gráfok** – hányféleképpen lehetséges?
- **leíró statisztika** – mit mondanak a már megtörtént adatok?
- **valószínűség** – mire számíthatunk?

A `ESE-25` (klasszikus valószínűségi modell) az a pont, ahol a kombinatorika és a valószínűség
egyetlen eszközzé olvad össze: a „kedvező / összes" hányadoshoz össze kell tudni számolni
mindkettőt.

## Függőségi gráf — kombinatorika és gráfok

```mermaid
graph TD
    LOG01(["LOG-01<br/>Halmaz, elem"])

    ESE01["ESE-01 ⭐<br/>Rendszerezett összeszámlálás:<br/>táblázat, ágrajz"]
    ESE02["ESE-02<br/>Sorbarendezési feladatok"]
    ESE03["ESE-03<br/>Kiválasztási feladatok"]
    ESE04["ESE-04 ⭐<br/>Szorzási elv,<br/>esetszétválasztás"]
    ESE05["ESE-05<br/>Faktoriális, permutációk"]
    ESE06["ESE-06<br/>Binomiális együttható,<br/>kombinációk"]
    ESE07["ESE-07<br/>Pascal-háromszög"]
    ESE08["ESE-08<br/>Mintavétel visszatevéssel<br/>és anélkül"]
    ESE09["ESE-09<br/>Gráf: csúcs, él"]
    ESE10["ESE-10<br/>Gráfok mint modellek"]
    ESE11["ESE-11<br/>Fokszám,<br/>fokszámösszeg-tétel"]

    LOG01 --> ESE01
    ESE01 --> ESE02 --> ESE03 --> ESE04 --> ESE05 --> ESE06
    ESE06 --> ESE07
    ESE06 --> ESE08
    ESE01 --> ESE09 --> ESE10 --> ESE11

    classDef fo fill:#c55a11,stroke:#843c0c,color:#fff;
    classDef kulso fill:#f0f0f0,stroke:#aaa,stroke-dasharray:4 3,color:#666;
    class ESE01,ESE04 fo;
    class LOG01 kulso;
```

## Függőségi gráf — statisztika és valószínűség

```mermaid
graph TD
    LOG06(["LOG-06<br/>Metszet, unió"])
    ESE04x(["ESE-04<br/>Szorzási elv"])
    ESE08x(["ESE-08<br/>Mintavétel"])
    GEO20(["GEO-20<br/>Sokszögek területe"])

    ESE12["ESE-12 ⭐<br/>Adat, adatgyűjtés,<br/>táblázatba rendezés"]
    ESE13["ESE-13<br/>Diagramtípusok"]
    ESE14["ESE-14<br/>Diagramok olvasása,<br/>következtetések"]
    ESE15["ESE-15<br/>Átlag"]
    ESE16["ESE-16<br/>Módusz és medián"]
    ESE17["ESE-17<br/>Grafikus manipulációk<br/>felismerése"]
    ESE18["ESE-18<br/>Tudatos adatgyűjtés,<br/>reprezentatív minta"]
    ESE19["ESE-19<br/>Terjedelem, kvartilisek,<br/>szórás"]
    ESE20["ESE-20<br/>Sodrófa (box-plot)"]

    ESE21["ESE-21<br/>Valószínűségi kísérlet,<br/>biztos / lehetetlen esemény"]
    ESE22["ESE-22 ⭐<br/>Gyakoriság,<br/>relatív gyakoriság"]
    ESE23["ESE-23<br/>Esemény, eseménytér,<br/>elemi esemény"]
    ESE24["ESE-24 ⭐<br/>A valószínűség fogalma"]
    ESE25["ESE-25 ⭐<br/>Klasszikus modell,<br/>Laplace-képlet"]
    ESE26["ESE-26<br/>Kizáró és<br/>független események"]
    ESE27["ESE-27<br/>Valószínűség<br/>mintavételnél"]
    ESE28["ESE-28<br/>Geometriai valószínűség"]
    ESE29["ESE-29<br/>Diszkrét<br/>valószínűség-eloszlás"]

    ESE12 --> ESE13 --> ESE14
    ESE12 --> ESE15 --> ESE16
    ESE14 --> ESE17
    ESE14 --> ESE18
    ESE16 --> ESE19 --> ESE20
    ESE12 --> ESE21 --> ESE22
    ESE15 --> ESE22
    ESE22 --> ESE23
    LOG06 --> ESE23
    ESE22 --> ESE24 --> ESE25
    ESE04x --> ESE25
    ESE23 --> ESE26
    ESE25 --> ESE26
    ESE25 --> ESE27
    ESE08x --> ESE27
    ESE25 --> ESE28
    GEO20 --> ESE28
    ESE24 --> ESE29
    ESE13 --> ESE29

    classDef fo fill:#c55a11,stroke:#843c0c,color:#fff;
    classDef kulso fill:#f0f0f0,stroke:#aaa,stroke-dasharray:4 3,color:#666;
    class ESE12,ESE22,ESE24,ESE25 fo;
    class LOG06,ESE04x,ESE08x,GEO20 kulso;
```

---

## Csomópontok — Kombinatorika

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ESE-01** ⭐ | Rendszerezett összeszámlálás: táblázat, ágrajz | Az összes eset áttekintése rendszerezési sémákkal; annak biztosítása, hogy semmi ne maradjon ki és semmit ne számoljunk kétszer. | *LOG-01* |
| **ESE-02** | Sorbarendezési feladatok | Kis elemszámú halmaz elemeinek sorba rendezése, egyenes mentén és kör mentén is; azonos elemeket tartalmazó esetek. | ESE-01 |
| **ESE-03** | Kiválasztási feladatok | Adott elemszámú részhalmaz kiválasztása a sorrend figyelembevételével és anélkül; a két eset megkülönböztetése. | ESE-02 |
| **ESE-04** ⭐ | Szorzási elv, esetszétválasztás | Független döntéssorozat lehetőségeinek összeszorzása; kizáró esetek lehetőségeinek összeadása. A kombinatorika két alapelve. | ESE-03 |
| **ESE-05** | Faktoriális, permutációk | Az `n!` jelentése és kiszámítása; `n` különböző elem sorrendjeinek száma; ismétléses permutáció egyszerű esetekben. | ESE-04 |
| **ESE-06** | Binomiális együttható, kombinációk | Az `n alatt a k` fogalma és értékének kiszámítása; `k` elem kiválasztása `n` elemből sorrend nélkül. | ESE-05 |
| **ESE-07** | Pascal-háromszög | A háromszög felépítése és tulajdonságai; kapcsolata a binomiális együtthatókkal és a kéttagú összeg hatványaival. | ESE-06 |
| **ESE-08** | Mintavétel visszatevéssel és visszatevés nélkül | A két mintavételi eljárás megkülönböztetése; annak felismerése, melyik feladatszöveg melyiket írja le. | ESE-06 |

## Csomópontok — Gráfok

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ESE-09** | Gráf: csúcs, él | A gráf mint kapcsolatok ábrázolása; csúcsok és élek; egyszerű gráf, teljes gráf. | ESE-01 |
| **ESE-10** | Gráfok mint modellek | Kézfogások, körmérkőzések, ismeretségek, családfák, útvonalak szemléltetése és feladatok megoldása gráffal; esetszétválasztás áttekintése fagráffal. | ESE-09 |
| **ESE-11** | Fokszám, fokszámösszeg-tétel | Egy csúcs fokszáma; annak felismerése és alkalmazása, hogy a fokszámok összege az élek számának kétszerese. | ESE-10 |

## Csomópontok — Leíró statisztika

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ESE-12** ⭐ | Adat, adatgyűjtés, táblázatba rendezés | Adatok gyűjtése hagyományos és digitális forrásból; rendszerezés táblázatba; az adatsokaság fogalma. | — |
| **ESE-13** | Diagramtípusok | Oszlop-, kör-, vonal- és pontdiagram készítése és olvasása; a megfelelő ábrázolási mód kiválasztása az adatok és a kérdés jellege alapján. | ESE-12 |
| **ESE-14** | Diagramok olvasása, megfeleltetése, következtetések | Adatok kigyűjtése táblázatból és diagramról adott szempont szerint; különböző típusú diagramok megfeleltetése egymásnak; következtetések megfogalmazása. | ESE-13 |
| **ESE-15** | Átlag | A számtani közép kiszámítása és értelmezése; annak felismerése, mikor félrevezető. | ESE-12 |
| **ESE-16** | Módusz és medián | A leggyakoribb és a középső adat meghatározása; a három középérték összehasonlítása ugyanazon adatsoron; melyik mit mond el. | ESE-15 |
| **ESE-17** | Grafikus manipulációk felismerése | Csonkolt tengely, torzított lépték, félrevezető területarányok felismerése és a diagram javítása. Adatműveltségi alapkészség. | ESE-14 |
| **ESE-18** | Tudatos adatgyűjtés, reprezentatív minta | Az adatgyűjtés megtervezése adott cél érdekében; a reprezentativitás szemléletes fogalma; példák reprezentatív és nem reprezentatív mintára. | ESE-14 |
| **ESE-19** | Terjedelem, kvartilisek, szórás | Szóródási mutatók: minimum, maximum, terjedelem, alsó és felső kvartilis, szórás; a kiugró adat kezelése. | ESE-16 |
| **ESE-20** | Sodrófa (box-plot) diagram | A doboz-ábra elkészítése és olvasása; adathalmazok gyors összehasonlítása több box-plot egymás mellé helyezésével. | ESE-19 |

## Csomópontok — Valószínűség

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **ESE-21** | Valószínűségi kísérlet; biztos, lehetséges, lehetetlen esemény | Kísérletek végzése dobókockával, pénzérmével, golyókkal; a három eseménytípus megkülönböztetése; intuitív esélylatolgatás. | ESE-12 |
| **ESE-22** ⭐ | Gyakoriság és relatív gyakoriság | Egy esemény bekövetkezéseinek száma és aránya; annak megfigyelése, hogy a relatív gyakoriság nagy elemszámnál stabilizálódik. | ESE-21, ESE-15 |
| **ESE-23** | Esemény, eseménytér, elemi esemény | Az összes lehetséges kimenetel halmaza; az esemény mint az eseménytér részhalmaza; összetett események leírása halmazműveletekkel. | ESE-22, *LOG-06* |
| **ESE-24** ⭐ | A valószínűség fogalma | A valószínűség bevezetése statisztikai alapon: az az érték, amely köré a relatív gyakoriság stabilizálódik. A valószínűség tulajdonságai. | ESE-22 |
| **ESE-25** ⭐ | Klasszikus valószínűségi modell, Laplace-képlet | Egyenlő esélyű elemi események esetén `P = kedvező / összes`; a modell alkalmazhatóságának feltétele; a számláló és a nevező összeszámlálása kombinatorikával. | ESE-24, *ESE-04* |
| **ESE-26** | Egymást kizáró és független események | A két fogalom megkülönböztetése (és annak felismerése, hogy nem ugyanaz); az összeg- és a szorzatszabály egyszerű alkalmazása. | ESE-23, ESE-25 |
| **ESE-27** | Valószínűség mintavételnél | Valószínűség meghatározása visszatevéses és visszatevés nélküli mintavétel esetén; a két eset eltérő összeszámlálása. | ESE-25, ESE-08 |
| **ESE-28** | Geometriai valószínűség | Valószínűség hossz-, terület- vagy térfogatarányként, ha a kimenetelek nem megszámlálhatóak. | ESE-25, *GEO-20* |
| **ESE-29** | Diszkrét valószínűség-eloszlás | A lehetséges értékek és a hozzájuk tartozó valószínűségek táblázata; ábrázolás oszlopdiagrammal; annak ellenőrzése, hogy a valószínűségek összege 1. | ESE-24, ESE-13 |

## Kapcsolódás a többi ághoz

| Innen indul | Ide vezet | Miért |
|---|---|---|
| ESE-01 | LOG-13 | A logikai szita rendszerezett összeszámlálás halmazokra. |
| ESE-04 | ESE-25 | A Laplace-képlet nevezőjének kiszámításához szorzási elv kell. |
| ESE-15 | FUG-05 | Az átlag és a grafikonolvasás közös adatszemlélete. |
| ESE-13 | FUG-04 | A diagram és a függvénygrafikon ugyanazon ábrázolási kultúra része. |

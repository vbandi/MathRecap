# 1. ág — Halmazok, logika és bizonyítás

> „A Gondolkodás ága" · kód: `LOG` · 16 csomópont

Ez a legrövidebb, de a legmélyebbre ható ág. Nem önmagában értékes: a halmazszemlélet és a
logikai pontosság az összes többi ág **nyelvezetét** adja. A `LOG-14` (tétel és bizonyítás)
az a pont, ahonnan a matematika „iskolai számolásból" deduktív tudománnyá válik.

## Függőségi gráf

```mermaid
graph TD
    subgraph S1["I. szint — Kiindulópontok"]
        LOG01["LOG-01 ⭐<br/>Halmaz, elem"]
        LOG02["LOG-02<br/>Igaz és hamis állítás"]
    end

    subgraph S2["II. szint"]
        LOG03["LOG-03<br/>Részhalmaz, üres halmaz"]
        LOG04["LOG-04<br/>Halmazábra (Venn)"]
        LOG05["LOG-05<br/>Nyitott mondat,<br/>igazsághalmaz"]
    end

    subgraph S3["III. szint"]
        LOG06["LOG-06 ⭐<br/>Metszet és unió"]
        LOG07["LOG-07<br/>nem, és, vagy"]
    end

    subgraph S4["IV. szint"]
        LOG08["LOG-08<br/>Komplementer, különbség,<br/>alaphalmaz"]
        LOG09["LOG-09<br/>minden, van olyan"]
    end

    subgraph S5["V. szint"]
        LOG10["LOG-10<br/>Halmazmegadás,<br/>osztályozás"]
        LOG11["LOG-11<br/>Implikáció,<br/>ekvivalencia"]
    end

    subgraph S6["VI. szint"]
        LOG12["LOG-12<br/>Megfordítás, tagadás"]
        LOG13["LOG-13<br/>Elemszám, logikai szita"]
    end

    subgraph S7["VII. szint — Mesterfok"]
        LOG14["LOG-14 ⭐<br/>Tétel és bizonyítás"]
        LOG15["LOG-15<br/>Halmaz- és logikai<br/>műveletek kapcsolata"]
        LOG16["LOG-16<br/>Bizonyítási módszerek"]
    end

    ESE01(["ESE-01<br/>Rendszerezett<br/>összeszámlálás"])

    LOG01 --> LOG03
    LOG01 --> LOG04
    LOG01 --> LOG05
    LOG02 --> LOG05
    LOG03 --> LOG06
    LOG04 --> LOG06
    LOG05 --> LOG07
    LOG06 --> LOG08
    LOG07 --> LOG09
    LOG08 --> LOG10
    LOG09 --> LOG11
    LOG11 --> LOG12
    LOG10 --> LOG13
    ESE01 -.-> LOG13
    LOG12 --> LOG14
    LOG08 --> LOG15
    LOG11 --> LOG15
    LOG14 --> LOG16

    classDef kulso fill:#f0f0f0,stroke:#aaa,stroke-dasharray:4 3,color:#666;
    class ESE01 kulso;
```

## Csomópontok

### I. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **LOG-01** ⭐ | Halmaz, elem, halmazba rendezés | Elemek válogatása egy vagy több tulajdonság szerint; annak felismerése, hogy egy halmazt a tagjai határoznak meg. A „hova tartozik?" kérdés matematikai formája. | — |
| **LOG-02** | Igaz és hamis állítás | Egy kijelentés logikai értékének megállapítása; igaz és hamis állítások önálló megfogalmazása, cáfolat ellenpéldával. | — |

### II. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **LOG-03** | Részhalmaz, üres halmaz, halmazok egyenlősége | A „minden eleme egyben eleme a másiknak" viszony; valódi részhalmaz, üres halmaz, két halmaz egyenlőségének feltétele. | LOG-01 |
| **LOG-04** | Halmazábra (Venn-diagram) | Halmazok és viszonyaik vizuális ábrázolása; az ábra olvasása és készítése. A későbbi halmazműveletek szemléleti alapja. | LOG-01 |
| **LOG-05** | Nyitott mondat, igazsághalmaz | Változót tartalmazó állítás; azon behelyettesítések halmaza, amelyek igazzá teszik. Az egyenlet fogalmának logikai előképe. | LOG-01, LOG-02 |

### III. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **LOG-06** ⭐ | Metszet és unió | Két halmaz közös részének és egyesítésének képzése, ábrázolása, elemeinek felsorolása. | LOG-03, LOG-04 |
| **LOG-07** | Logikai műveletek: „nem", „és", „vagy" | A tagadás, a konjunkció, valamint a megengedő és a kizáró „vagy" jelentése és helyes használata. | LOG-05 |

### IV. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **LOG-08** | Komplementer, különbség, alaphalmaz | Kiegészítő halmaz képzése adott alaphalmazra nézve; két halmaz különbsége. Annak megértése, hogy a komplementer csak alaphalmazzal együtt értelmes. | LOG-06 |
| **LOG-09** | Kvantorok: „minden", „van olyan" | Univerzális és egzisztenciális állítások megkülönböztetése, logikai értékük eldöntése és indoklása. | LOG-07 |

### V. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **LOG-10** | Halmazmegadási módok, diszjunkt felbontás, osztályozás | Halmaz megadása elemek felsorolásával és tulajdonsággal; halmaz felbontása közös elem nélküli részhalmazokra; osztályozás mint modellezési eszköz. | LOG-08 |
| **LOG-11** | Implikáció és ekvivalencia | A „ha…, akkor…" és az „akkor és csak akkor" típusú állítások jelentése, logikai értéke; a szükséges és az elégséges feltétel megkülönböztetése. | LOG-09 |

### VI. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **LOG-12** | Állítás megfordítása és tagadása | Adott implikáció megfordításának megfogalmazása, és annak felismerése, hogy a megfordítás nem feltétlenül igaz; összetett állítások tagadása. | LOG-11 |
| **LOG-13** | Halmaz elemszáma, logikai szita | Véges halmazok elemszámának meghatározása; két-három halmaz uniójának elemszáma a szita-formulával. | LOG-10, *ESE-01* |

### VII. szint

| ID | Készség | Leírás | Előfeltétel |
|----|---------|--------|-------------|
| **LOG-14** ⭐ | Tétel és bizonyítás | A matematikai bizonyítás fogalma: definíció, tétel, bizonyítás elkülönítése. Néhány lépéses bizonyítási gondolatsor megértése és önálló összeállítása. | LOG-12 |
| **LOG-15** | Halmazműveletek és logikai műveletek kapcsolata | Annak felismerése, hogy a metszet ↔ „és", az unió ↔ „vagy", a komplementer ↔ „nem" megfeleltetés strukturális; igazságtáblázat használata. | LOG-08, LOG-11 |
| **LOG-16** | Bizonyítási módszerek | Direkt bizonyítás, indirekt bizonyítás, esetszétválasztás, ellenpélda. A stratégia tudatos megválasztása az állítás szerkezete alapján. | LOG-14 |

## Kapcsolódás a többi ághoz

| Innen indul | Ide vezet | Miért |
|---|---|---|
| LOG-01 | ESE-01 | Az összeszámlálás mindig egy halmaz elemeinek számbavétele. |
| LOG-06 | ESE-23 | Az eseménytér és az események halmazműveletekkel épülnek. |
| LOG-05 | ALG-16 | Az alaphalmaz–megoldáshalmaz páros a nyitott mondat fogalmán nyugszik. |
| LOG-14 | GEO-37, GEO-36 | A Pitagorasz- és Thalész-tétel az első „igazi" bizonyítások. |
| LOG-16 | SZA-24 | A √2 irracionalitása klasszikus indirekt bizonyítás. |

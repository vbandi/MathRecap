// Generált fájl - ne szerkeszd. Forrás: agak/*.md, generátor: poc/build-data.mjs
window.TREE_NODES = [
 {
  "id": "LOG-01",
  "ag": "LOG",
  "nev": "Halmaz, elem, halmazba rendezés",
  "leiras": "Elemek válogatása egy vagy több tulajdonság szerint; annak felismerése, hogy egy halmazt a tagjai határoznak meg. A \"hova tartozik?\" kérdés matematikai formája.",
  "kapu": true,
  "elofeltetel": []
 },
 {
  "id": "LOG-02",
  "ag": "LOG",
  "nev": "Igaz és hamis állítás",
  "leiras": "Egy kijelentés logikai értékének megállapítása; igaz és hamis állítások önálló megfogalmazása, cáfolat ellenpéldával.",
  "kapu": false,
  "elofeltetel": []
 },
 {
  "id": "LOG-03",
  "ag": "LOG",
  "nev": "Részhalmaz, üres halmaz, halmazok egyenlősége",
  "leiras": "A \"minden eleme egyben eleme a másiknak\" viszony; valódi részhalmaz, üres halmaz, két halmaz egyenlőségének feltétele.",
  "kapu": false,
  "elofeltetel": [
   "LOG-01"
  ]
 },
 {
  "id": "LOG-04",
  "ag": "LOG",
  "nev": "Halmazábra (Venn-diagram)",
  "leiras": "Halmazok és viszonyaik vizuális ábrázolása; az ábra olvasása és készítése. A későbbi halmazműveletek szemléleti alapja.",
  "kapu": false,
  "elofeltetel": [
   "LOG-01"
  ]
 },
 {
  "id": "LOG-05",
  "ag": "LOG",
  "nev": "Nyitott mondat, igazsághalmaz",
  "leiras": "Változót tartalmazó állítás; azon behelyettesítések halmaza, amelyek igazzá teszik. Az egyenlet fogalmának logikai előképe.",
  "kapu": false,
  "elofeltetel": [
   "LOG-01",
   "LOG-02"
  ]
 },
 {
  "id": "LOG-06",
  "ag": "LOG",
  "nev": "Metszet és unió",
  "leiras": "Két halmaz közös részének és egyesítésének képzése, ábrázolása, elemeinek felsorolása.",
  "kapu": true,
  "elofeltetel": [
   "LOG-03",
   "LOG-04"
  ]
 },
 {
  "id": "LOG-07",
  "ag": "LOG",
  "nev": "Logikai műveletek: \"nem\", \"és\", \"vagy\"",
  "leiras": "A tagadás, a konjunkció, valamint a megengedő és a kizáró \"vagy\" jelentése és helyes használata.",
  "kapu": false,
  "elofeltetel": [
   "LOG-05"
  ]
 },
 {
  "id": "LOG-08",
  "ag": "LOG",
  "nev": "Komplementer, különbség, alaphalmaz",
  "leiras": "Kiegészítő halmaz képzése adott alaphalmazra nézve; két halmaz különbsége. Annak megértése, hogy a komplementer csak alaphalmazzal együtt értelmes.",
  "kapu": false,
  "elofeltetel": [
   "LOG-06"
  ]
 },
 {
  "id": "LOG-09",
  "ag": "LOG",
  "nev": "Kvantorok: \"minden\", \"van olyan\"",
  "leiras": "Univerzális és egzisztenciális állítások megkülönböztetése, logikai értékük eldöntése és indoklása.",
  "kapu": false,
  "elofeltetel": [
   "LOG-07"
  ]
 },
 {
  "id": "LOG-10",
  "ag": "LOG",
  "nev": "Halmazmegadási módok, diszjunkt felbontás, osztályozás",
  "leiras": "Halmaz megadása elemek felsorolásával és tulajdonsággal; halmaz felbontása közös elem nélküli részhalmazokra; osztályozás mint modellezési eszköz.",
  "kapu": false,
  "elofeltetel": [
   "LOG-08"
  ]
 },
 {
  "id": "LOG-11",
  "ag": "LOG",
  "nev": "Implikáció és ekvivalencia",
  "leiras": "A \"ha…, akkor…\" és az \"akkor és csak akkor\" típusú állítások jelentése, logikai értéke; a szükséges és az elégséges feltétel megkülönböztetése.",
  "kapu": false,
  "elofeltetel": [
   "LOG-09"
  ]
 },
 {
  "id": "LOG-12",
  "ag": "LOG",
  "nev": "Állítás megfordítása és tagadása",
  "leiras": "Adott implikáció megfordításának megfogalmazása, és annak felismerése, hogy a megfordítás nem feltétlenül igaz; összetett állítások tagadása.",
  "kapu": false,
  "elofeltetel": [
   "LOG-11"
  ]
 },
 {
  "id": "LOG-13",
  "ag": "LOG",
  "nev": "Halmaz elemszáma, logikai szita",
  "leiras": "Véges halmazok elemszámának meghatározása; két-három halmaz uniójának elemszáma a szita-formulával.",
  "kapu": false,
  "elofeltetel": [
   "LOG-10",
   "ESE-01"
  ]
 },
 {
  "id": "LOG-14",
  "ag": "LOG",
  "nev": "Tétel és bizonyítás",
  "leiras": "A matematikai bizonyítás fogalma: definíció, tétel, bizonyítás elkülönítése. Néhány lépéses bizonyítási gondolatsor megértése és önálló összeállítása.",
  "kapu": true,
  "elofeltetel": [
   "LOG-12"
  ]
 },
 {
  "id": "LOG-15",
  "ag": "LOG",
  "nev": "Halmazműveletek és logikai műveletek kapcsolata",
  "leiras": "Annak felismerése, hogy a metszet ↔ \"és\", az unió ↔ \"vagy\", a komplementer ↔ \"nem\" megfeleltetés strukturális; igazságtáblázat használata.",
  "kapu": false,
  "elofeltetel": [
   "LOG-08",
   "LOG-11"
  ]
 },
 {
  "id": "LOG-16",
  "ag": "LOG",
  "nev": "Bizonyítási módszerek",
  "leiras": "Direkt bizonyítás, indirekt bizonyítás, esetszétválasztás, ellenpélda. A stratégia tudatos megválasztása az állítás szerkezete alapján.",
  "kapu": false,
  "elofeltetel": [
   "LOG-14"
  ]
 },
 {
  "id": "SZA-01",
  "ag": "SZA",
  "nev": "Természetes számok, helyi érték",
  "leiras": "Helyi érték, alaki érték, valódi érték; nagy számok írása és olvasása. Annak megértése, hogy a számjegy helye hordozza az információt.",
  "kapu": true,
  "elofeltetel": []
 },
 {
  "id": "SZA-02",
  "ag": "SZA",
  "nev": "Számegyenes",
  "leiras": "Számok ábrázolása egyenesen, összehasonlítás, sorba rendezés. A szám mint pozíció – a későbbi koordináta-rendszer és a valós számok egyenes-modelljének alapja.",
  "kapu": false,
  "elofeltetel": [
   "SZA-01"
  ]
 },
 {
  "id": "SZA-03",
  "ag": "SZA",
  "nev": "Alapműveletek természetes számokkal",
  "leiras": "Írásbeli összeadás, kivonás, szorzás és osztás algoritmusai; fejszámolás; a hányados becslése.",
  "kapu": true,
  "elofeltetel": [
   "SZA-01"
  ]
 },
 {
  "id": "SZA-07",
  "ag": "SZA",
  "nev": "Római számok",
  "leiras": "Az I, V, X, L, C, D, M jelek ismerete, számok írása és olvasása. Példa nem helyiértékes számírásra.",
  "kapu": false,
  "elofeltetel": [
   "SZA-01"
  ]
 },
 {
  "id": "SZA-04",
  "ag": "SZA",
  "nev": "Műveleti sorrend és zárójelezés",
  "leiras": "A műveletek elvégzési sorrendje; a zárójel mint felülíró jel. Fejben, írásban és számológéppel egyaránt.",
  "kapu": false,
  "elofeltetel": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-05",
  "ag": "SZA",
  "nev": "Műveleti tulajdonságok",
  "leiras": "Felcserélhetőség (kommutativitás), csoportosíthatóság (asszociativitás), széttagolhatóság (disztributivitás) és tudatos alkalmazásuk a számolás egyszerűsítésére.",
  "kapu": false,
  "elofeltetel": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-06",
  "ag": "SZA",
  "nev": "Becslés, kerekítés, ellenőrzés",
  "leiras": "Nagyságrendi becslés a számolás előtt, észszerű kerekítés utána, az eredmény ellenőrzése. Az egyik legfontosabb \"élettartam-készség\".",
  "kapu": false,
  "elofeltetel": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-08",
  "ag": "SZA",
  "nev": "Osztó, többszörös, közös osztó, közös többszörös",
  "leiras": "Az oszthatóság reláció; egy szám osztóinak és többszöröseinek meghatározása; két szám közös osztói és közös többszörösei.",
  "kapu": true,
  "elofeltetel": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-09",
  "ag": "SZA",
  "nev": "Oszthatósági szabályok",
  "leiras": "A 2-vel, 3-mal, 4-gyel, 5-tel, 6-tal, 9-cel, 10-zel, 100-zal való oszthatóság szabályai és alkalmazásuk.",
  "kapu": false,
  "elofeltetel": [
   "SZA-08"
  ]
 },
 {
  "id": "SZA-10",
  "ag": "SZA",
  "nev": "Maradékos osztás, maradékosztályok",
  "leiras": "Osztandó = osztó · hányados + maradék; a természetes számok csoportosítása adott számmal való osztási maradékuk szerint.",
  "kapu": false,
  "elofeltetel": [
   "SZA-08"
  ]
 },
 {
  "id": "SZA-11",
  "ag": "SZA",
  "nev": "Negatív számok, ellentett, abszolút érték",
  "leiras": "Az egész számok halmaza; előjel, ellentett, abszolút érték; összehasonlítás és ábrázolás a számegyenesen.",
  "kapu": false,
  "elofeltetel": [
   "SZA-02"
  ]
 },
 {
  "id": "SZA-12",
  "ag": "SZA",
  "nev": "Közönséges tört, bővítés, egyszerűsítés",
  "leiras": "Törtrész és törtszám megfeleltetése; számláló, nevező; vegyes szám; bővítés és egyszerűsítés; egyenlő törtek felismerése; törtek összehasonlítása.",
  "kapu": true,
  "elofeltetel": [
   "SZA-08"
  ]
 },
 {
  "id": "SZA-13",
  "ag": "SZA",
  "nev": "Műveletek egész számokkal",
  "leiras": "A négy alapművelet kiterjesztése negatív számokra; az előjelszabályok és azok szemléletes indoklása.",
  "kapu": false,
  "elofeltetel": [
   "SZA-11",
   "SZA-05"
  ]
 },
 {
  "id": "SZA-14",
  "ag": "SZA",
  "nev": "Tizedes tört, a helyi érték kiterjesztése",
  "leiras": "Tizedesvessző, tizedjegyek; a helyiérték-táblázat kiterjesztése az egyesek alá; kapcsolat a közönséges tört alakkal.",
  "kapu": false,
  "elofeltetel": [
   "SZA-12",
   "SZA-01"
  ]
 },
 {
  "id": "SZA-15",
  "ag": "SZA",
  "nev": "Műveletek közönséges törtekkel, reciprok",
  "leiras": "Összeadás közös nevezővel, szorzás, osztás reciprokkal való szorzásként. A reciprok fogalma.",
  "kapu": false,
  "elofeltetel": [
   "SZA-12",
   "SZA-05"
  ]
 },
 {
  "id": "SZA-17",
  "ag": "SZA",
  "nev": "Prímszám, összetett szám, prímtényezős felbontás",
  "leiras": "A prímszám definíciója; összetett számok felbontása prímek szorzatára; a felbontás egyértelműsége.",
  "kapu": false,
  "elofeltetel": [
   "SZA-09"
  ]
 },
 {
  "id": "SZA-20",
  "ag": "SZA",
  "nev": "Hatvány pozitív egész kitevővel, négyzetszám",
  "leiras": "A hatványozás mint ismételt szorzás; hatványalap, kitevő, hatványérték; négyzetszámok és köbszámok.",
  "kapu": true,
  "elofeltetel": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-16",
  "ag": "SZA",
  "nev": "Műveletek tizedes törtekkel",
  "leiras": "Írásbeli összeadás, kivonás, szorzás és osztás tizedes törtekkel; a tizedesvessző kezelése; kapcsolat a mértékegység-átváltással.",
  "kapu": false,
  "elofeltetel": [
   "SZA-14",
   "SZA-05"
  ]
 },
 {
  "id": "SZA-19",
  "ag": "SZA",
  "nev": "Legnagyobb közös osztó és legkisebb közös többszörös",
  "leiras": "LNKO és LKKT meghatározása prímtényezős felbontásból; alkalmazásuk törtek egyszerűsítésére és közös nevező keresésére.",
  "kapu": false,
  "elofeltetel": [
   "SZA-17"
  ]
 },
 {
  "id": "SZA-22",
  "ag": "SZA",
  "nev": "Négyzetgyök",
  "leiras": "Négyzetszámok négyzetgyöke, majd a négyzetgyök általános fogalma nemnegatív számokra; közelítő érték számológéppel.",
  "kapu": false,
  "elofeltetel": [
   "SZA-20"
  ]
 },
 {
  "id": "SZA-23",
  "ag": "SZA",
  "nev": "Számrendszerek",
  "leiras": "A helyi értékes írásmód általánosítása tetszőleges alapszámra; átírás 10-es és más alapú számrendszer között.",
  "kapu": false,
  "elofeltetel": [
   "SZA-01",
   "SZA-20"
  ]
 },
 {
  "id": "SZA-18",
  "ag": "SZA",
  "nev": "Racionális számok",
  "leiras": "A racionális szám fogalma; közönséges tört és tizedes tört alak kölcsönös megfeleltetése; a racionális számok halmaza a számegyenesen.",
  "kapu": true,
  "elofeltetel": [
   "SZA-13",
   "SZA-15",
   "SZA-16"
  ]
 },
 {
  "id": "SZA-25",
  "ag": "SZA",
  "nev": "Hatványozás azonosságai; 0 és negatív egész kitevő",
  "leiras": "Az azonosságok felfedezése és bizonyítása; a permanencia-elv, amely kikényszeríti a 0 és a negatív kitevő értelmezését.",
  "kapu": false,
  "elofeltetel": [
   "SZA-20",
   "SZA-15"
  ]
 },
 {
  "id": "SZA-21",
  "ag": "SZA",
  "nev": "Véges, végtelen szakaszos és nem szakaszos tizedes tört",
  "leiras": "Annak felismerése, hogy minden racionális szám tizedes tört alakja véges vagy végtelen szakaszos; példa nem szakaszos tizedes törtre.",
  "kapu": false,
  "elofeltetel": [
   "SZA-18"
  ]
 },
 {
  "id": "SZA-28",
  "ag": "SZA",
  "nev": "Normálalak",
  "leiras": "Nagyon nagy és nagyon kicsi számok írása `a · 10ⁿ` alakban (1 ≤ a < 10); számolás normálalakkal.",
  "kapu": false,
  "elofeltetel": [
   "SZA-25"
  ]
 },
 {
  "id": "SZA-24",
  "ag": "SZA",
  "nev": "Irracionális számok, valós számok",
  "leiras": "Példák irracionális számokra (√2, π); a valós számok halmaza és a számegyenes hézagmentes megfeleltetése.",
  "kapu": true,
  "elofeltetel": [
   "SZA-21",
   "SZA-22"
  ]
 },
 {
  "id": "SZA-26",
  "ag": "SZA",
  "nev": "Intervallumok",
  "leiras": "Nyílt, zárt és félig zárt intervallumok jelölése és értelmezése; számhalmazok megadása intervallumokkal.",
  "kapu": false,
  "elofeltetel": [
   "SZA-24"
  ]
 },
 {
  "id": "SZA-27",
  "ag": "SZA",
  "nev": "Négyzetgyök azonosságai",
  "leiras": "√(ab) = √a·√b, √(a/b) = √a/√b; gyöktelenítés; gyökös kifejezések egyszerűsítése.",
  "kapu": false,
  "elofeltetel": [
   "SZA-22",
   "SZA-24"
  ]
 },
 {
  "id": "SZA-29",
  "ag": "SZA",
  "nev": "Számhalmazok épülése, műveleti zártság",
  "leiras": "ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ; annak vizsgálata, mely halmaz mely műveletre zárt, és hogy éppen a zártság hiánya kényszeríti ki a bővítéseket.",
  "kapu": false,
  "elofeltetel": [
   "SZA-24"
  ]
 },
 {
  "id": "SZA-30",
  "ag": "SZA",
  "nev": "Relatív prímek, összetett oszthatósági szabályok",
  "leiras": "Relatív prím számok; összetett számmal való oszthatóság vizsgálata prímtényezők alapján; számolás osztási maradékokkal.",
  "kapu": false,
  "elofeltetel": [
   "SZA-19",
   "SZA-10"
  ]
 },
 {
  "id": "SZA-31",
  "ag": "SZA",
  "nev": "n-edik gyök",
  "leiras": "A négyzetgyök általánosítása; páros és páratlan kitevőjű gyök értelmezési tartománya közti különbség.",
  "kapu": false,
  "elofeltetel": [
   "SZA-27"
  ]
 },
 {
  "id": "SZA-32",
  "ag": "SZA",
  "nev": "Racionális kitevőjű hatvány",
  "leiras": "Az `a^(p/q)` értelmezése pozitív alap esetén: a `q`-adik gyök `p`-edik hatványa. A hatványozás azonosságainak érvényessége racionális kitevőre; szemléletes kiterjesztés irracionális kitevőre.",
  "kapu": true,
  "elofeltetel": [
   "SZA-31",
   "SZA-25"
  ]
 },
 {
  "id": "SZA-33",
  "ag": "SZA",
  "nev": "Logaritmus fogalma és azonosságai",
  "leiras": "A logaritmus mint a hatványozás inverz művelete; a szorzat, hányados és hatvány logaritmusa; áttérés más alapú logaritmusra; számológép használata.",
  "kapu": true,
  "elofeltetel": [
   "SZA-32"
  ]
 },
 {
  "id": "ALG-01",
  "ag": "ALG",
  "nev": "Arány, aránypár",
  "leiras": "Két mennyiség viszonyának kifejezése hányadossal; aránypár felírása és olvasása. A tört fogalmának \"relációs\" olvasata.",
  "kapu": false,
  "elofeltetel": [
   "SZA-12"
  ]
 },
 {
  "id": "ALG-02",
  "ag": "ALG",
  "nev": "Egyszerű szöveges feladatok: modellalkotás, következtetés",
  "leiras": "Szövegből a matematikai tartalom kiemelése; megoldás szakaszos ábrázolással, visszafelé gondolkodással, táblázattal. Az ellenőrzés a szövegbe visszahelyettesítéssel.",
  "kapu": false,
  "elofeltetel": [
   "SZA-04"
  ]
 },
 {
  "id": "ALG-03",
  "ag": "ALG",
  "nev": "Egyenes arányosság",
  "leiras": "Két mennyiség együtt változása állandó hányadossal; felismerés hétköznapi helyzetekben; következtetés egyről többre és többről egyre; arányos osztás (adott mennyiség felosztása megadott arányban).",
  "kapu": true,
  "elofeltetel": [
   "ALG-01"
  ]
 },
 {
  "id": "ALG-04",
  "ag": "ALG",
  "nev": "Mértékegységek és átváltásuk",
  "leiras": "Hosszúság, tömeg, idő, terület, térfogat, űrtartalom szabványegységei; átváltás helyiértékes gondolkodással; származtatott mértékegységek (sebesség, sűrűség).",
  "kapu": false,
  "elofeltetel": [
   "ALG-01",
   "SZA-14"
  ]
 },
 {
  "id": "ALG-06",
  "ag": "ALG",
  "nev": "A százalék fogalma",
  "leiras": "A százalék mint századrész; kapcsolat a törttel és a tizedes törttel; százalékos adatok értelmezése a hétköznapokban.",
  "kapu": false,
  "elofeltetel": [
   "ALG-01",
   "SZA-14"
  ]
 },
 {
  "id": "ALG-05",
  "ag": "ALG",
  "nev": "Fordított arányosság",
  "leiras": "Két mennyiség együtt változása állandó szorzattal; felismerés munkavégzési, mozgási és mérési helyzetekben.",
  "kapu": false,
  "elofeltetel": [
   "ALG-03"
  ]
 },
 {
  "id": "ALG-07",
  "ag": "ALG",
  "nev": "Százalékszámítás: alap, érték, láb, pont",
  "leiras": "A három alapfeladat (érték, alap, láb keresése); a százalékpont és a százalék megkülönböztetése; egymást követő százalékos változások.",
  "kapu": false,
  "elofeltetel": [
   "ALG-06",
   "ALG-03"
  ]
 },
 {
  "id": "ALG-08",
  "ag": "ALG",
  "nev": "Betűs kifejezés, változó, együttható, helyettesítési érték",
  "leiras": "Betűk használata ismeretlen vagy változó mennyiség jelölésére; egytagú és többtagú kifejezés; helyettesítési érték számolása.",
  "kapu": true,
  "elofeltetel": [
   "SZA-05"
  ]
 },
 {
  "id": "ALG-09",
  "ag": "ALG",
  "nev": "Egynemű kifejezések összevonása",
  "leiras": "Az egynemű tagok felismerése és összevonása; a rendezés mint a kifejezés egyszerűbb alakra hozása.",
  "kapu": false,
  "elofeltetel": [
   "ALG-08"
  ]
 },
 {
  "id": "ALG-10",
  "ag": "ALG",
  "nev": "Pénzügyi alapszámítások",
  "leiras": "Áremelés és leárazás, egyszerű kamat, keverési feladatok; banki ajánlatok, díjak összehasonlítása; bevétel–kiadás egyensúly.",
  "kapu": false,
  "elofeltetel": [
   "ALG-07"
  ]
 },
 {
  "id": "ALG-12",
  "ag": "ALG",
  "nev": "Elsőfokú egyenlet megoldása lebontogatással",
  "leiras": "A műveletsor \"visszafejtése\" az ismeretlen felszabadításáig. Intuitív, de csak egyszerű szerkezetű egyenletekre működik.",
  "kapu": false,
  "elofeltetel": [
   "ALG-08"
  ]
 },
 {
  "id": "ALG-11",
  "ag": "ALG",
  "nev": "Szorzás számmal, közös tényező kiemelése",
  "leiras": "Kéttagú kifejezés szorzása számmal (disztributivitás); a művelet megfordítása: közös tényező kiemelése.",
  "kapu": false,
  "elofeltetel": [
   "ALG-09"
  ]
 },
 {
  "id": "ALG-13",
  "ag": "ALG",
  "nev": "Mérlegelv",
  "leiras": "Az egyenlet mint egyensúly; mindkét oldalon azonos átalakítás végzése. Az egyetemes egyenletmegoldó módszer, amely tetszőleges szerkezetre működik.",
  "kapu": true,
  "elofeltetel": [
   "ALG-12"
  ]
 },
 {
  "id": "ALG-14",
  "ag": "ALG",
  "nev": "Műveletek algebrai kifejezésekkel, polinomok",
  "leiras": "Összeadás, kivonás, szorzás, osztás algebrai kifejezésekkel; egytagú kifejezés hatványa; a polinom fogalma és foka.",
  "kapu": false,
  "elofeltetel": [
   "ALG-11"
  ]
 },
 {
  "id": "ALG-15",
  "ag": "ALG",
  "nev": "Szöveges feladat megoldása egyenlettel",
  "leiras": "Az ismeretlen megválasztása, egyenlet felírása, megoldás, majd értelmezés és ellenőrzés az eredeti szövegben. Út–idő–sebesség, közös munkavégzés, keverés, pénzügyi feladatok.",
  "kapu": false,
  "elofeltetel": [
   "ALG-13",
   "ALG-02"
  ]
 },
 {
  "id": "ALG-16",
  "ag": "ALG",
  "nev": "Alaphalmaz, megoldáshalmaz, ekvivalens átalakítás",
  "leiras": "Annak tudatosítása, hogy a megoldáshalmaz az alaphalmaztól függ; ekvivalens és nem ekvivalens lépések megkülönböztetése; hamis gyök és gyökvesztés.",
  "kapu": true,
  "elofeltetel": [
   "ALG-13"
  ]
 },
 {
  "id": "ALG-17",
  "ag": "ALG",
  "nev": "Nevezetes azonosságok",
  "leiras": "`(a+b)²`, `(a−b)²`, `(a+b)(a−b)` ismerete, geometriai szemléltetése és kétirányú alkalmazása (kifejtés és szorzattá alakítás).",
  "kapu": true,
  "elofeltetel": [
   "ALG-14"
  ]
 },
 {
  "id": "ALG-18",
  "ag": "ALG",
  "nev": "Elsőfokú egyenlőtlenségek",
  "leiras": "Megoldás mérlegelvvel; a negatív számmal való szorzás relációfordító hatása; a megoldáshalmaz megadása intervallummal.",
  "kapu": false,
  "elofeltetel": [
   "ALG-16"
  ]
 },
 {
  "id": "ALG-19",
  "ag": "ALG",
  "nev": "Elsőfokú kétismeretlenes egyenletrendszer",
  "leiras": "Megoldás behelyettesítéssel, egyenlő együtthatók módszerével és grafikusan; a megoldások számának geometriai jelentése.",
  "kapu": false,
  "elofeltetel": [
   "ALG-16"
  ]
 },
 {
  "id": "ALG-20",
  "ag": "ALG",
  "nev": "Teljes négyzetté alakítás",
  "leiras": "Másodfokú kifejezés `a(x+p)² + q` alakra hozása. A másodfokú függvény ábrázolásának és a megoldóképlet levezetésének közös eszköze.",
  "kapu": false,
  "elofeltetel": [
   "ALG-17"
  ]
 },
 {
  "id": "ALG-21",
  "ag": "ALG",
  "nev": "Szorzattá alakítás",
  "leiras": "Kiemelés és nevezetes azonosságok kombinált alkalmazása; a szorzat nulla voltára vonatkozó elv (`ab = 0 ⇔ a = 0 vagy b = 0`).",
  "kapu": false,
  "elofeltetel": [
   "ALG-17",
   "ALG-11"
  ]
 },
 {
  "id": "ALG-22",
  "ag": "ALG",
  "nev": "Grafikus egyenletmegoldás",
  "leiras": "Az egyenlet két oldalának függvényként való ábrázolása; a metszéspontok mint megoldások; közelítő megoldás digitális eszközzel.",
  "kapu": false,
  "elofeltetel": [
   "ALG-16",
   "FUG-10"
  ]
 },
 {
  "id": "ALG-23",
  "ag": "ALG",
  "nev": "Másodfokú egyenlet: szorzattá alakítás és teljes négyzetté kiegészítés",
  "leiras": "A két \"kézi\" megoldási módszer; annak felismerése, melyik egyenletnél melyik gazdaságosabb.",
  "kapu": false,
  "elofeltetel": [
   "ALG-20",
   "ALG-21",
   "ALG-16"
  ]
 },
 {
  "id": "ALG-24",
  "ag": "ALG",
  "nev": "Megoldóképlet és diszkrimináns",
  "leiras": "A megoldóképlet levezetése teljes négyzetté alakítással; a diszkrimináns előjele és a valós gyökök száma közti kapcsolat.",
  "kapu": true,
  "elofeltetel": [
   "ALG-23"
  ]
 },
 {
  "id": "ALG-25",
  "ag": "ALG",
  "nev": "Gyöktényezős alak",
  "leiras": "`a(x−x₁)(x−x₂)` felírása; a gyökök és az együtthatók közti összefüggés; alkalmazás szorzattá alakításnál és szöveges feladatoknál.",
  "kapu": false,
  "elofeltetel": [
   "ALG-24"
  ]
 },
 {
  "id": "ALG-26",
  "ag": "ALG",
  "nev": "Másodfokúra visszavezethető egyenletek",
  "leiras": "Új ismeretlen bevezetése (helyettesítés); a kapott gyökök visszahelyettesítése és ellenőrzése.",
  "kapu": false,
  "elofeltetel": [
   "ALG-24"
  ]
 },
 {
  "id": "ALG-27",
  "ag": "ALG",
  "nev": "Másodfokú egyenlőtlenség",
  "leiras": "Megoldás a parabola grafikonja alapján; előjelvizsgálat a gyöktényezős alakkal; a megoldáshalmaz megadása intervallumokkal.",
  "kapu": false,
  "elofeltetel": [
   "ALG-24",
   "FUG-12"
  ]
 },
 {
  "id": "ALG-28",
  "ag": "ALG",
  "nev": "Exponenciális és logaritmusos egyenletek, egyenlőtlenségek",
  "leiras": "Azonos alapra hozás, a definíció alkalmazása, logaritmusvétel; az értelmezési tartomány és a monotonitás figyelembevétele egyenlőtlenségeknél.",
  "kapu": false,
  "elofeltetel": [
   "SZA-33",
   "ALG-16",
   "FUG-16"
  ]
 },
 {
  "id": "FUG-01",
  "ag": "FUG",
  "nev": "Megfeleltetés, hozzárendelés",
  "leiras": "Két halmaz elemei közötti kapcsolat létrehozása; a kapcsolat szabályának felismerése és megfogalmazása. A függvényfogalom csírája.",
  "kapu": false,
  "elofeltetel": []
 },
 {
  "id": "FUG-02",
  "ag": "FUG",
  "nev": "Sorozat, szabálykövetés",
  "leiras": "Számokból, jelekből, alakzatokból álló sorozat folytatása adott szabály szerint; néhány tagból a képzési szabály felismerése.",
  "kapu": false,
  "elofeltetel": []
 },
 {
  "id": "FUG-03",
  "ag": "FUG",
  "nev": "Derékszögű koordináta-rendszer",
  "leiras": "Tájékozódás a síkon számpárokkal; pont ábrázolása koordinátáiból és koordinátái leolvasása; a négy síknegyed.",
  "kapu": true,
  "elofeltetel": [
   "SZA-02",
   "SZA-11"
  ]
 },
 {
  "id": "FUG-04",
  "ag": "FUG",
  "nev": "Értéktáblázat és grafikon",
  "leiras": "Összetartozó értékpárok táblázatba rendezése, majd ábrázolása koordináta-rendszerben; a grafikon mint a kapcsolat képe.",
  "kapu": false,
  "elofeltetel": [
   "FUG-01",
   "FUG-03"
  ]
 },
 {
  "id": "FUG-05",
  "ag": "FUG",
  "nev": "Grafikonok jellemzése",
  "leiras": "Növekedés és fogyás, legnagyobb és legkisebb érték, tengelymetszetek leolvasása; hétköznapi grafikonok (hőmérséklet, út–idő) értelmezése.",
  "kapu": false,
  "elofeltetel": [
   "FUG-04"
  ]
 },
 {
  "id": "FUG-06",
  "ag": "FUG",
  "nev": "Az egyenes arányosság grafikonja",
  "leiras": "Az origón átmenő egyenes felismerése és megrajzolása; az arányossági tényező mint meredekség.",
  "kapu": false,
  "elofeltetel": [
   "FUG-04",
   "ALG-03"
  ]
 },
 {
  "id": "FUG-07",
  "ag": "FUG",
  "nev": "A fordított arányosság grafikonja",
  "leiras": "A hiperbolaág felismerése; annak megértése, miért nem metszi a tengelyeket.",
  "kapu": false,
  "elofeltetel": [
   "FUG-06",
   "ALG-05"
  ]
 },
 {
  "id": "FUG-08",
  "ag": "FUG",
  "nev": "A függvény fogalma",
  "leiras": "Értelmezési tartomány, képhalmaz, értékkészlet; a hozzárendelés egyértelműsége mint döntő kritérium; a függvény megadásának módjai.",
  "kapu": true,
  "elofeltetel": [
   "FUG-04"
  ]
 },
 {
  "id": "FUG-09",
  "ag": "FUG",
  "nev": "Függvénytulajdonságok",
  "leiras": "Zérushely, szélsőérték, monotonitás (növekedés–fogyás), értékkészlet meghatározása grafikonról és képletből. A függvényvizsgálat közös eszköztára.",
  "kapu": true,
  "elofeltetel": [
   "FUG-08",
   "FUG-05",
   "SZA-24"
  ]
 },
 {
  "id": "FUG-11",
  "ag": "FUG",
  "nev": "Kölcsönösen egyértelmű hozzárendelés, inverz",
  "leiras": "Annak eldöntése, mikor fordítható meg egy hozzárendelés; az inverz függvény grafikonja mint tükörkép az `y = x` egyenesre.",
  "kapu": false,
  "elofeltetel": [
   "FUG-08"
  ]
 },
 {
  "id": "FUG-10",
  "ag": "FUG",
  "nev": "Lineáris függvény",
  "leiras": "`x ↦ mx + b`; a meredekség és a tengelymetszet jelentése; a hozzárendelési szabály leolvasása grafikonról.",
  "kapu": true,
  "elofeltetel": [
   "FUG-09",
   "FUG-06"
  ]
 },
 {
  "id": "FUG-13",
  "ag": "FUG",
  "nev": "Abszolútérték-függvény",
  "leiras": "Az `x ↦ \\",
  "kapu": false,
  "elofeltetel": [
   "FUG-09",
   "SZA-11"
  ]
 },
 {
  "id": "FUG-12",
  "ag": "FUG",
  "nev": "Másodfokú függvény",
  "leiras": "Az `x ↦ ax² + bx + c` függvény parabolája; csúcspont, tengely, nyílásirány meghatározása teljes négyzetté alakítással.",
  "kapu": true,
  "elofeltetel": [
   "FUG-09",
   "ALG-20"
  ]
 },
 {
  "id": "FUG-14",
  "ag": "FUG",
  "nev": "Négyzetgyökfüggvény",
  "leiras": "Az `x ↦ √x` függvény grafikonja, értelmezési tartománya és monotonitása; kapcsolata a másodfokú függvénnyel.",
  "kapu": false,
  "elofeltetel": [
   "FUG-09",
   "SZA-27"
  ]
 },
 {
  "id": "FUG-15",
  "ag": "FUG",
  "nev": "Az `x ↦ a/x` függvény",
  "leiras": "A fordított arányosság függvényként; két hiperbolaág, a szakadási hely, az aszimptotikus viselkedés szemléletes leírása.",
  "kapu": false,
  "elofeltetel": [
   "FUG-09",
   "FUG-07"
  ]
 },
 {
  "id": "FUG-17",
  "ag": "FUG",
  "nev": "Exponenciális függvény",
  "leiras": "Az `x ↦ aˣ` függvény; az `a > 1` és a `0 < a < 1` eset megkülönböztetése; állandó szorzóval való növekedés.",
  "kapu": false,
  "elofeltetel": [
   "FUG-09",
   "SZA-32"
  ]
 },
 {
  "id": "FUG-20",
  "ag": "FUG",
  "nev": "Számsorozat: megadás képlettel és rekurzióval",
  "leiras": "A sorozat mint pozitív egész számokon értelmezett függvény; explicit képlet és rekurzív megadás közti különbség.",
  "kapu": true,
  "elofeltetel": [
   "FUG-02",
   "FUG-08"
  ]
 },
 {
  "id": "FUG-16",
  "ag": "FUG",
  "nev": "Függvénytranszformációk",
  "leiras": "`f(x) + c`, `f(x + c)`, `c · f(x)`, `\\",
  "kapu": true,
  "elofeltetel": [
   "FUG-10",
   "FUG-12",
   "FUG-13"
  ]
 },
 {
  "id": "FUG-18",
  "ag": "FUG",
  "nev": "Logaritmusfüggvény",
  "leiras": "Az exponenciális függvény inverze; grafikonja, értelmezési tartománya, monotonitása.",
  "kapu": false,
  "elofeltetel": [
   "FUG-17",
   "SZA-33",
   "FUG-11"
  ]
 },
 {
  "id": "FUG-21",
  "ag": "FUG",
  "nev": "Számtani sorozat",
  "leiras": "Állandó különbség (differencia); az n-edik tag és az első n tag összegének képlete, és a képlet bizonyítása.",
  "kapu": false,
  "elofeltetel": [
   "FUG-20"
  ]
 },
 {
  "id": "FUG-22",
  "ag": "FUG",
  "nev": "Mértani sorozat",
  "leiras": "Állandó hányados (kvóciens); az n-edik tag és az első n tag összegének képlete, és a képlet bizonyítása.",
  "kapu": false,
  "elofeltetel": [
   "FUG-20",
   "SZA-25"
  ]
 },
 {
  "id": "FUG-19",
  "ag": "FUG",
  "nev": "Exponenciális folyamatok modellezése",
  "leiras": "Népességnövekedés, radioaktív bomlás, kamatos kamat, járványterjedés leírása; adatokra függvény illesztése és a paraméterek értelmezése.",
  "kapu": false,
  "elofeltetel": [
   "FUG-17",
   "ALG-28"
  ]
 },
 {
  "id": "FUG-23",
  "ag": "FUG",
  "nev": "Kamatos kamat, gyűjtőjáradék, törlesztőrészlet",
  "leiras": "Tőke, kamatláb, futamidő; a mértani sorozat és összegképletének alkalmazása megtakarítási, befektetési és hitelfelvételi feladatokra, a kockázatok mérlegelésével.",
  "kapu": false,
  "elofeltetel": [
   "FUG-22",
   "ALG-10"
  ]
 },
 {
  "id": "GEO-01",
  "ag": "GEO",
  "nev": "Térelemek: pont, egyenes, sík; szakasz, félegyenes",
  "leiras": "A geometria alapfogalmai; egyenes, félegyenes és szakasz megkülönböztetése; illeszkedés.",
  "kapu": true,
  "elofeltetel": []
 },
 {
  "id": "GEO-02",
  "ag": "GEO",
  "nev": "Szög, szögmérés, szögfajták",
  "leiras": "A szögtartomány mint síkrész; mérés fokban (és szögpercben); hegyes-, derék-, tompa-, egyenes-, homorú- és teljesszög.",
  "kapu": false,
  "elofeltetel": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-03",
  "ag": "GEO",
  "nev": "Párhuzamosság és merőlegesség",
  "leiras": "Egyenesek kölcsönös helyzete a síkban; két pont, pont és egyenes, két párhuzamos egyenes távolsága.",
  "kapu": false,
  "elofeltetel": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-04",
  "ag": "GEO",
  "nev": "Alapszerkesztések",
  "leiras": "Szakaszfelező merőleges, szögfelező, merőleges és párhuzamos egyenes szerkesztése, szögmásolás – körzővel és egyélű vonalzóval, illetve dinamikus geometriai szoftverrel. Ezek a további szerkesztések \"építőkockái\".",
  "kapu": true,
  "elofeltetel": [
   "GEO-02",
   "GEO-03"
  ]
 },
 {
  "id": "GEO-05",
  "ag": "GEO",
  "nev": "Nevezetes szögpárok",
  "leiras": "Pótszögek, mellékszögek, kiegészítő szögek, csúcsszögek, egyállású szögek, váltószögek – és a párhuzamos szelők tulajdonságai.",
  "kapu": false,
  "elofeltetel": [
   "GEO-02",
   "GEO-03"
  ]
 },
 {
  "id": "GEO-06",
  "ag": "GEO",
  "nev": "Sokszög; konvex és konkáv; átló",
  "leiras": "Zárt töröttvonal által határolt síkidom; a konvexitás szemléletes és pontos jelentése; az átló fogalma.",
  "kapu": false,
  "elofeltetel": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-07",
  "ag": "GEO",
  "nev": "Háromszög szögei, háromszög-egyenlőtlenség",
  "leiras": "A belső szögek összege 180°, és ennek bizonyítása párhuzamos szelőkkel; annak feltétele, hogy három szakaszból háromszög szerkeszthető.",
  "kapu": true,
  "elofeltetel": [
   "GEO-06",
   "GEO-05"
  ]
 },
 {
  "id": "GEO-08",
  "ag": "GEO",
  "nev": "Háromszögek osztályozása",
  "leiras": "Csoportosítás szögek szerint (hegyes-, derék-, tompaszögű) és oldalak szerint (általános, egyenlő szárú, szabályos); a tengelyesen szimmetrikus háromszögek.",
  "kapu": false,
  "elofeltetel": [
   "GEO-07"
  ]
 },
 {
  "id": "GEO-09",
  "ag": "GEO",
  "nev": "A háromszög külső szögei",
  "leiras": "A külső szög és a nem mellette fekvő belső szögek kapcsolata; a külső szögek összege 360°.",
  "kapu": false,
  "elofeltetel": [
   "GEO-07"
  ]
 },
 {
  "id": "GEO-10",
  "ag": "GEO",
  "nev": "Négyszögek: belső és külső szögösszeg",
  "leiras": "A 360°-os belső szögösszeg levezetése átlóval való háromszögekre bontással; konvex és konkáv négyszögek.",
  "kapu": false,
  "elofeltetel": [
   "GEO-06",
   "GEO-07"
  ]
 },
 {
  "id": "GEO-11",
  "ag": "GEO",
  "nev": "Speciális négyszögek és halmazábrájuk",
  "leiras": "Trapéz, húrtrapéz, paralelogramma, deltoid, rombusz, téglalap, négyzet tulajdonságai (oldalak, szögek, átlók, szimmetriák) és tartalmazási viszonyaik.",
  "kapu": false,
  "elofeltetel": [
   "GEO-10",
   "GEO-23"
  ]
 },
 {
  "id": "GEO-12",
  "ag": "GEO",
  "nev": "Konvex sokszög átlói és szögösszege",
  "leiras": "Az `n(n−3)/2` átlószám és az `(n−2)·180°` belső szögösszeg tétele, bizonyítással.",
  "kapu": false,
  "elofeltetel": [
   "GEO-10"
  ]
 },
 {
  "id": "GEO-13",
  "ag": "GEO",
  "nev": "Szabályos sokszög",
  "leiras": "Egyenlő oldalak és egyenlő szögek; a középponti szög, a körülírt és a beírt kör.",
  "kapu": false,
  "elofeltetel": [
   "GEO-12"
  ]
 },
 {
  "id": "GEO-14",
  "ag": "GEO",
  "nev": "A kör és részei",
  "leiras": "Körvonal és körlap; középpont, sugár, húr, átmérő, szelő, érintő, körív, körcikk, körszelet; a középponti szög.",
  "kapu": false,
  "elofeltetel": [
   "GEO-01",
   "GEO-02"
  ]
 },
 {
  "id": "GEO-15",
  "ag": "GEO",
  "nev": "Kerület és terület fogalma, mérése",
  "leiras": "A mérés alapelve: egységválasztás és összehasonlítás; a terület mint lefedés egységnégyzetekkel; alkalmi és szabványegységek.",
  "kapu": false,
  "elofeltetel": [
   "ALG-04"
  ]
 },
 {
  "id": "GEO-16",
  "ag": "GEO",
  "nev": "Téglalap és négyzet kerülete, területe",
  "leiras": "Az `a · b` területképlet megalapozása; a kerület és a terület független változása azonos alakzatcsaládon belül.",
  "kapu": false,
  "elofeltetel": [
   "GEO-15",
   "GEO-06"
  ]
 },
 {
  "id": "GEO-17",
  "ag": "GEO",
  "nev": "Az átdarabolás elve",
  "leiras": "Annak felismerése, hogy egy alakzat darabokra vágva és átrendezve ugyanakkora területű. Ez az elv adja meg szinte az összes további területképletet.",
  "kapu": true,
  "elofeltetel": [
   "GEO-16"
  ]
 },
 {
  "id": "GEO-18",
  "ag": "GEO",
  "nev": "A háromszög területe",
  "leiras": "Az `a · mₐ / 2` képlet levezetése átdarabolással vagy paralelogrammából; a magasság megválasztásának szabadsága.",
  "kapu": false,
  "elofeltetel": [
   "GEO-17",
   "GEO-08"
  ]
 },
 {
  "id": "GEO-19",
  "ag": "GEO",
  "nev": "Speciális négyszögek területe",
  "leiras": "Paralelogramma, trapéz, deltoid, rombusz területképletei, mindegyik átdarabolással megalapozva.",
  "kapu": false,
  "elofeltetel": [
   "GEO-17",
   "GEO-11"
  ]
 },
 {
  "id": "GEO-20",
  "ag": "GEO",
  "nev": "Sokszögek területe",
  "leiras": "Tetszőleges sokszög területének meghatározása háromszögekre bontással vagy átdarabolással; szabályos sokszög területe.",
  "kapu": false,
  "elofeltetel": [
   "GEO-19",
   "GEO-13"
  ]
 },
 {
  "id": "GEO-21",
  "ag": "GEO",
  "nev": "A kör kerülete és területe",
  "leiras": "A π mint állandó arány; a `2rπ` és az `r²π` képlet szemléletes megalapozása; a kör mint sokszögek határhelyzete.",
  "kapu": false,
  "elofeltetel": [
   "GEO-14",
   "ALG-03"
  ]
 },
 {
  "id": "GEO-22",
  "ag": "GEO",
  "nev": "Körív, körcikk, körgyűrű, körszelet",
  "leiras": "Annak alkalmazása, hogy a középponti szög egyenesen arányos az ívhosszal és a körcikk területével; összetett síkidomok kerülete és területe.",
  "kapu": false,
  "elofeltetel": [
   "GEO-21",
   "ALG-03"
  ]
 },
 {
  "id": "GEO-23",
  "ag": "GEO",
  "nev": "Egybevágóság, síkbeli mozgások",
  "leiras": "Az \"ugyanolyan alakú és méretű\" viszony; egybevágó alakzatok felismerése; a mozgatás mint alakzatokat átvivő leképezés.",
  "kapu": true,
  "elofeltetel": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-24",
  "ag": "GEO",
  "nev": "Tengelyes tükrözés és tengelyes szimmetria",
  "leiras": "A transzformáció tulajdonságai (távolság- és szögtartás, körüljárási irány megfordítása); tükörkép szerkesztése; szimmetriatengely keresése.",
  "kapu": false,
  "elofeltetel": [
   "GEO-23",
   "GEO-04"
  ]
 },
 {
  "id": "GEO-25",
  "ag": "GEO",
  "nev": "Középpontos tükrözés és középpontos szimmetria",
  "leiras": "A 180°-os elforgatásként is felfogható tükrözés; tulajdonságai és szerkesztése; középpontosan szimmetrikus alakzatok.",
  "kapu": false,
  "elofeltetel": [
   "GEO-24"
  ]
 },
 {
  "id": "GEO-26",
  "ag": "GEO",
  "nev": "Pont körüli forgatás",
  "leiras": "Forgásközéppont és forgásszög; a forgatás mint két tengelyes tükrözés egymásutánja; forgásszimmetria.",
  "kapu": false,
  "elofeltetel": [
   "GEO-25"
  ]
 },
 {
  "id": "GEO-27",
  "ag": "GEO",
  "nev": "Párhuzamos eltolás",
  "leiras": "Irány, irányítás és nagyság megadása; az eltolás mint két párhuzamos tengelyű tükrözés eredője.",
  "kapu": false,
  "elofeltetel": [
   "GEO-23"
  ]
 },
 {
  "id": "GEO-28",
  "ag": "GEO",
  "nev": "Vektor, vektorműveletek",
  "leiras": "A vektor fogalmának kialakítása az eltolásból; abszolút érték, nullvektor, ellentett vektor, helyvektor; összeadás, kivonás, számmal való szorzás.",
  "kapu": true,
  "elofeltetel": [
   "GEO-27"
  ]
 },
 {
  "id": "GEO-29",
  "ag": "GEO",
  "nev": "Az egybevágósági transzformációk rendszere",
  "leiras": "A négy alaptranszformáció összehasonlítása és egymás utáni végrehajtása; alkalmazásuk feladatmegoldásban és bizonyításban; parkettázás.",
  "kapu": false,
  "elofeltetel": [
   "GEO-24",
   "GEO-26",
   "GEO-27"
  ]
 },
 {
  "id": "GEO-30",
  "ag": "GEO",
  "nev": "Háromszögek egybevágóságának alapesetei",
  "leiras": "Az SSS, SAS, ASA és SsA esetek; alkalmazásuk szerkesztéseknél és bizonyításoknál.",
  "kapu": false,
  "elofeltetel": [
   "GEO-29",
   "GEO-08"
  ]
 },
 {
  "id": "GEO-31",
  "ag": "GEO",
  "nev": "Kicsinyítés és nagyítás",
  "leiras": "Az alakhű méretváltoztatás felismerése hétköznapi helyzetekben: térkép, makett, fénykép, tervrajz.",
  "kapu": false,
  "elofeltetel": [
   "GEO-23"
  ]
 },
 {
  "id": "GEO-32",
  "ag": "GEO",
  "nev": "Középpontos hasonlóság és hasonlósági transzformáció",
  "leiras": "Hasonlósági középpont és arány; a transzformáció tulajdonságai; a hasonlóság mint középpontos hasonlóság és egybevágóság egymásutánja.",
  "kapu": false,
  "elofeltetel": [
   "GEO-31",
   "GEO-29"
  ]
 },
 {
  "id": "GEO-33",
  "ag": "GEO",
  "nev": "Hasonló háromszögek",
  "leiras": "A hasonlóság alapesetei; párhuzamos szelők tétele; alkalmazás magasság- és távolságmérésre (\"Thalész-módszer\").",
  "kapu": true,
  "elofeltetel": [
   "GEO-32",
   "GEO-30"
  ]
 },
 {
  "id": "GEO-34",
  "ag": "GEO",
  "nev": "Hasonló síkidomok kerületének és területének aránya",
  "leiras": "A kerület aránya `λ`, a területé `λ²` – és annak megértése, miért nem ugyanaz a kettő.",
  "kapu": false,
  "elofeltetel": [
   "GEO-33",
   "GEO-20"
  ]
 },
 {
  "id": "GEO-35",
  "ag": "GEO",
  "nev": "Szerkesztési feladatok, diszkusszió",
  "leiras": "Több feltételnek megfelelő ábra szerkesztése: elemzés, szerkesztés, bizonyítás, diszkusszió. A megoldások számának vizsgálata.",
  "kapu": false,
  "elofeltetel": [
   "GEO-04",
   "GEO-29"
  ]
 },
 {
  "id": "GEO-36",
  "ag": "GEO",
  "nev": "Pitagorasz-tétel és megfordítása",
  "leiras": "`a² + b² = c²` derékszögű háromszögben; bizonyítás átdarabolással; a megfordítás használata a derékszögűség igazolására; pitagoraszi számhármasok.",
  "kapu": true,
  "elofeltetel": [
   "GEO-18",
   "SZA-22"
  ]
 },
 {
  "id": "GEO-37",
  "ag": "GEO",
  "nev": "Thalész-tétel és megfordítása",
  "leiras": "A kör átmérője fölé rajzolt kerületi szög derékszög; bizonyítás egyenlő szárú háromszögekkel; alkalmazás érintőszerkesztésnél.",
  "kapu": false,
  "elofeltetel": [
   "GEO-14",
   "GEO-08",
   "LOG-14"
  ]
 },
 {
  "id": "GEO-38",
  "ag": "GEO",
  "nev": "A háromszög nevezetes vonalai",
  "leiras": "Oldalfelező merőleges, szögfelező, magasságvonal, súlyvonal, középvonal – definícióik és alaptulajdonságaik.",
  "kapu": false,
  "elofeltetel": [
   "GEO-04",
   "GEO-08"
  ]
 },
 {
  "id": "GEO-39",
  "ag": "GEO",
  "nev": "A háromszög nevezetes pontjai és körei",
  "leiras": "Az oldalfelező merőlegesek és a belső szögfelezők metszéspontjára vonatkozó tétel bizonyítása; körülírt és beírt kör; súlypont, magasságpont.",
  "kapu": false,
  "elofeltetel": [
   "GEO-38"
  ]
 },
 {
  "id": "GEO-40",
  "ag": "GEO",
  "nev": "Hegyesszögek szögfüggvényei",
  "leiras": "Szinusz, koszinusz, tangens definíciója derékszögű háromszögben; a definíció jogosságának hasonlóságon alapuló indoklása; számítások gyakorlati helyzetekben.",
  "kapu": true,
  "elofeltetel": [
   "GEO-36",
   "GEO-33"
  ]
 },
 {
  "id": "GEO-41",
  "ag": "GEO",
  "nev": "Tompaszögek szögfüggvényei, összefüggések",
  "leiras": "A szögfüggvények kiterjesztése tompaszögre; a pitagoraszi összefüggés (`sin²α + cos²α = 1`), a pótszögek és mellékszögek szögfüggvényei; `tg α = sin α / cos α`.",
  "kapu": false,
  "elofeltetel": [
   "GEO-40"
  ]
 },
 {
  "id": "GEO-42",
  "ag": "GEO",
  "nev": "Szög meghatározása szögfüggvény értékéből",
  "leiras": "Az inverz szögfüggvények használata számológéppel; a több lehetséges megoldás mérlegelése a feladat kontextusában.",
  "kapu": false,
  "elofeltetel": [
   "GEO-40"
  ]
 },
 {
  "id": "GEO-43",
  "ag": "GEO",
  "nev": "Háromszög területe két oldalból és a közbezárt szögből",
  "leiras": "A `T = (a·b·sin γ)/2` képlet levezetése és alkalmazása; négyszögek és szabályos sokszögek területe szögfüggvényekkel.",
  "kapu": false,
  "elofeltetel": [
   "GEO-41",
   "GEO-18"
  ]
 },
 {
  "id": "GEO-44",
  "ag": "GEO",
  "nev": "Szinusztétel",
  "leiras": "`a / sin α = b / sin β = c / sin γ = 2R`; a tétel bizonyítása; alkalmazása háromszög hiányzó adatainak meghatározására.",
  "kapu": false,
  "elofeltetel": [
   "GEO-43"
  ]
 },
 {
  "id": "GEO-45",
  "ag": "GEO",
  "nev": "Koszinusztétel",
  "leiras": "`c² = a² + b² − 2ab·cos γ` mint a Pitagorasz-tétel általánosítása; alkalmazása, ha két oldal és a közbezárt szög, vagy mindhárom oldal ismert.",
  "kapu": false,
  "elofeltetel": [
   "GEO-43",
   "GEO-36"
  ]
 },
 {
  "id": "GEO-46",
  "ag": "GEO",
  "nev": "Kocka és téglatest; lap, él, csúcs, lapátló, testátló",
  "leiras": "A testek elemeinek megnevezése és megszámlálása; a határoló lapok egymáshoz viszonyított helyzete.",
  "kapu": true,
  "elofeltetel": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-47",
  "ag": "GEO",
  "nev": "Nézetek, alaprajz, háló, testépítés",
  "leiras": "Test és síkbeli ábrázolása közti oda-vissza fordítás; háló készítése és hálóból való építés. A térszemlélet alapgyakorlata.",
  "kapu": false,
  "elofeltetel": [
   "GEO-46"
  ]
 },
 {
  "id": "GEO-48",
  "ag": "GEO",
  "nev": "Hasáb és gúla",
  "leiras": "Alaplap, oldallap, alapél, oldalél, testmagasság; egyenes és ferde hasáb; szabályos gúla, tetraéder.",
  "kapu": false,
  "elofeltetel": [
   "GEO-46",
   "GEO-06"
  ]
 },
 {
  "id": "GEO-49",
  "ag": "GEO",
  "nev": "A gömb",
  "leiras": "A gömb mint adott ponttól egyenlő távolságra lévő pontok halmaza; síkmetszetei; a gömb mint a Föld modellje (hosszúsági és szélességi körök).",
  "kapu": false,
  "elofeltetel": [
   "GEO-46",
   "GEO-14"
  ]
 },
 {
  "id": "GEO-50",
  "ag": "GEO",
  "nev": "Téglatest és kocka felszíne, térfogata",
  "leiras": "A felszín mint a háló területe; a térfogat mint egységkockákkal való kitöltés; az `a·b·c` képlet megalapozása.",
  "kapu": false,
  "elofeltetel": [
   "GEO-46",
   "GEO-16"
  ]
 },
 {
  "id": "GEO-51",
  "ag": "GEO",
  "nev": "Egyenes hasáb felszíne és térfogata",
  "leiras": "`A = 2T_alap + P_alap · m` és `V = T_alap · m`; a képleteket megalapozó összefüggések megértése.",
  "kapu": false,
  "elofeltetel": [
   "GEO-50",
   "GEO-48",
   "GEO-19"
  ]
 },
 {
  "id": "GEO-52",
  "ag": "GEO",
  "nev": "Térelemek kölcsönös helyzete, távolsága, hajlásszöge",
  "leiras": "Egyenesek és síkok illeszkedése, párhuzamossága, kitérő helyzete; pont–sík és egyenes–sík távolság; lapszög.",
  "kapu": false,
  "elofeltetel": [
   "GEO-03",
   "GEO-05",
   "GEO-48"
  ]
 },
 {
  "id": "GEO-53",
  "ag": "GEO",
  "nev": "Forgástestek és csonkatestek",
  "leiras": "Henger, kúp, csonkagúla, csonkakúp; alkotó, palást, forgástengely; síkidomok forgatásával keletkező testek.",
  "kapu": false,
  "elofeltetel": [
   "GEO-48",
   "GEO-49"
  ]
 },
 {
  "id": "GEO-54",
  "ag": "GEO",
  "nev": "Speciális testek felszíne és térfogata",
  "leiras": "Hasáb, henger, gúla, kúp, gömb, csonkagúla, csonkakúp felszíne és térfogata; összetett testek és a mindennapi élet tárgyainak számításai.",
  "kapu": true,
  "elofeltetel": [
   "GEO-53",
   "GEO-51",
   "GEO-22",
   "GEO-40"
  ]
 },
 {
  "id": "GEO-55",
  "ag": "GEO",
  "nev": "Hasonló testek felszínének és térfogatának aránya",
  "leiras": "A felszín aránya `λ²`, a térfogaté `λ³`; alkalmazás modellek és makettek méretezésénél.",
  "kapu": false,
  "elofeltetel": [
   "GEO-54",
   "GEO-34"
  ]
 },
 {
  "id": "GEO-56",
  "ag": "GEO",
  "nev": "Pont és vektor koordinátái",
  "leiras": "Pont és helyvektor megadása számpárral; annak felismerése, hogy ettől kezdve a geometriai állítások algebrai számolássá alakíthatók.",
  "kapu": true,
  "elofeltetel": [
   "GEO-28",
   "FUG-03"
  ]
 },
 {
  "id": "GEO-57",
  "ag": "GEO",
  "nev": "Két pont távolsága, szakaszfelező pont",
  "leiras": "A távolságképlet levezetése a Pitagorasz-tételből; a felezőpont koordinátái a végpontokból.",
  "kapu": false,
  "elofeltetel": [
   "GEO-56",
   "GEO-36"
  ]
 },
 {
  "id": "GEO-58",
  "ag": "GEO",
  "nev": "Vektorműveletek koordinátákkal",
  "leiras": "Összeg, különbség és számszoros koordinátái; a vektor abszolút értéke; alkalmazás geometriai feladatokban.",
  "kapu": false,
  "elofeltetel": [
   "GEO-56"
  ]
 },
 {
  "id": "GEO-59",
  "ag": "GEO",
  "nev": "Az egyenes egyenlete, meredekség",
  "leiras": "Az `y = mx + b` és az `x = c` alak; a meredekség geometriai jelentése; egyenesek merőlegességének és párhuzamosságának feltétele a meredekségekkel.",
  "kapu": false,
  "elofeltetel": [
   "GEO-58",
   "FUG-10"
  ]
 },
 {
  "id": "GEO-60",
  "ag": "GEO",
  "nev": "Egyenesek kölcsönös helyzete, metszéspontja",
  "leiras": "A metszéspont meghatározása egyenletrendszer megoldásával; a megoldások száma és a geometriai helyzet kapcsolata.",
  "kapu": false,
  "elofeltetel": [
   "GEO-59",
   "ALG-19"
  ]
 },
 {
  "id": "GEO-61",
  "ag": "GEO",
  "nev": "A kör egyenlete",
  "leiras": "`(x − u)² + (y − v)² = r²` felírása és értelmezése; a középpont és a sugár kiolvasása teljes négyzetté alakítással.",
  "kapu": false,
  "elofeltetel": [
   "GEO-57",
   "ALG-20"
  ]
 },
 {
  "id": "ESE-01",
  "ag": "ESE",
  "nev": "Rendszerezett összeszámlálás: táblázat, ágrajz",
  "leiras": "Az összes eset áttekintése rendszerezési sémákkal; annak biztosítása, hogy semmi ne maradjon ki és semmit ne számoljunk kétszer.",
  "kapu": true,
  "elofeltetel": [
   "LOG-01"
  ]
 },
 {
  "id": "ESE-02",
  "ag": "ESE",
  "nev": "Sorbarendezési feladatok",
  "leiras": "Kis elemszámú halmaz elemeinek sorba rendezése, egyenes mentén és kör mentén is; azonos elemeket tartalmazó esetek.",
  "kapu": false,
  "elofeltetel": [
   "ESE-01"
  ]
 },
 {
  "id": "ESE-03",
  "ag": "ESE",
  "nev": "Kiválasztási feladatok",
  "leiras": "Adott elemszámú részhalmaz kiválasztása a sorrend figyelembevételével és anélkül; a két eset megkülönböztetése.",
  "kapu": false,
  "elofeltetel": [
   "ESE-02"
  ]
 },
 {
  "id": "ESE-04",
  "ag": "ESE",
  "nev": "Szorzási elv, esetszétválasztás",
  "leiras": "Független döntéssorozat lehetőségeinek összeszorzása; kizáró esetek lehetőségeinek összeadása. A kombinatorika két alapelve.",
  "kapu": true,
  "elofeltetel": [
   "ESE-03"
  ]
 },
 {
  "id": "ESE-05",
  "ag": "ESE",
  "nev": "Faktoriális, permutációk",
  "leiras": "Az `n!` jelentése és kiszámítása; `n` különböző elem sorrendjeinek száma; ismétléses permutáció egyszerű esetekben.",
  "kapu": false,
  "elofeltetel": [
   "ESE-04"
  ]
 },
 {
  "id": "ESE-06",
  "ag": "ESE",
  "nev": "Binomiális együttható, kombinációk",
  "leiras": "Az `n alatt a k` fogalma és értékének kiszámítása; `k` elem kiválasztása `n` elemből sorrend nélkül.",
  "kapu": false,
  "elofeltetel": [
   "ESE-05"
  ]
 },
 {
  "id": "ESE-07",
  "ag": "ESE",
  "nev": "Pascal-háromszög",
  "leiras": "A háromszög felépítése és tulajdonságai; kapcsolata a binomiális együtthatókkal és a kéttagú összeg hatványaival.",
  "kapu": false,
  "elofeltetel": [
   "ESE-06"
  ]
 },
 {
  "id": "ESE-08",
  "ag": "ESE",
  "nev": "Mintavétel visszatevéssel és visszatevés nélkül",
  "leiras": "A két mintavételi eljárás megkülönböztetése; annak felismerése, melyik feladatszöveg melyiket írja le.",
  "kapu": false,
  "elofeltetel": [
   "ESE-06"
  ]
 },
 {
  "id": "ESE-09",
  "ag": "ESE",
  "nev": "Gráf: csúcs, él",
  "leiras": "A gráf mint kapcsolatok ábrázolása; csúcsok és élek; egyszerű gráf, teljes gráf.",
  "kapu": false,
  "elofeltetel": [
   "ESE-01"
  ]
 },
 {
  "id": "ESE-10",
  "ag": "ESE",
  "nev": "Gráfok mint modellek",
  "leiras": "Kézfogások, körmérkőzések, ismeretségek, családfák, útvonalak szemléltetése és feladatok megoldása gráffal; esetszétválasztás áttekintése fagráffal.",
  "kapu": false,
  "elofeltetel": [
   "ESE-09"
  ]
 },
 {
  "id": "ESE-11",
  "ag": "ESE",
  "nev": "Fokszám, fokszámösszeg-tétel",
  "leiras": "Egy csúcs fokszáma; annak felismerése és alkalmazása, hogy a fokszámok összege az élek számának kétszerese.",
  "kapu": false,
  "elofeltetel": [
   "ESE-10"
  ]
 },
 {
  "id": "ESE-12",
  "ag": "ESE",
  "nev": "Adat, adatgyűjtés, táblázatba rendezés",
  "leiras": "Adatok gyűjtése hagyományos és digitális forrásból; rendszerezés táblázatba; az adatsokaság fogalma.",
  "kapu": true,
  "elofeltetel": []
 },
 {
  "id": "ESE-13",
  "ag": "ESE",
  "nev": "Diagramtípusok",
  "leiras": "Oszlop-, kör-, vonal- és pontdiagram készítése és olvasása; a megfelelő ábrázolási mód kiválasztása az adatok és a kérdés jellege alapján.",
  "kapu": false,
  "elofeltetel": [
   "ESE-12"
  ]
 },
 {
  "id": "ESE-14",
  "ag": "ESE",
  "nev": "Diagramok olvasása, megfeleltetése, következtetések",
  "leiras": "Adatok kigyűjtése táblázatból és diagramról adott szempont szerint; különböző típusú diagramok megfeleltetése egymásnak; következtetések megfogalmazása.",
  "kapu": false,
  "elofeltetel": [
   "ESE-13"
  ]
 },
 {
  "id": "ESE-15",
  "ag": "ESE",
  "nev": "Átlag",
  "leiras": "A számtani közép kiszámítása és értelmezése; annak felismerése, mikor félrevezető.",
  "kapu": false,
  "elofeltetel": [
   "ESE-12"
  ]
 },
 {
  "id": "ESE-16",
  "ag": "ESE",
  "nev": "Módusz és medián",
  "leiras": "A leggyakoribb és a középső adat meghatározása; a három középérték összehasonlítása ugyanazon adatsoron; melyik mit mond el.",
  "kapu": false,
  "elofeltetel": [
   "ESE-15"
  ]
 },
 {
  "id": "ESE-17",
  "ag": "ESE",
  "nev": "Grafikus manipulációk felismerése",
  "leiras": "Csonkolt tengely, torzított lépték, félrevezető területarányok felismerése és a diagram javítása. Adatműveltségi alapkészség.",
  "kapu": false,
  "elofeltetel": [
   "ESE-14"
  ]
 },
 {
  "id": "ESE-18",
  "ag": "ESE",
  "nev": "Tudatos adatgyűjtés, reprezentatív minta",
  "leiras": "Az adatgyűjtés megtervezése adott cél érdekében; a reprezentativitás szemléletes fogalma; példák reprezentatív és nem reprezentatív mintára.",
  "kapu": false,
  "elofeltetel": [
   "ESE-14"
  ]
 },
 {
  "id": "ESE-19",
  "ag": "ESE",
  "nev": "Terjedelem, kvartilisek, szórás",
  "leiras": "Szóródási mutatók: minimum, maximum, terjedelem, alsó és felső kvartilis, szórás; a kiugró adat kezelése.",
  "kapu": false,
  "elofeltetel": [
   "ESE-16"
  ]
 },
 {
  "id": "ESE-20",
  "ag": "ESE",
  "nev": "Sodrófa (box-plot) diagram",
  "leiras": "A doboz-ábra elkészítése és olvasása; adathalmazok gyors összehasonlítása több box-plot egymás mellé helyezésével.",
  "kapu": false,
  "elofeltetel": [
   "ESE-19"
  ]
 },
 {
  "id": "ESE-21",
  "ag": "ESE",
  "nev": "Valószínűségi kísérlet; biztos, lehetséges, lehetetlen esemény",
  "leiras": "Kísérletek végzése dobókockával, pénzérmével, golyókkal; a három eseménytípus megkülönböztetése; intuitív esélylatolgatás.",
  "kapu": false,
  "elofeltetel": [
   "ESE-12"
  ]
 },
 {
  "id": "ESE-22",
  "ag": "ESE",
  "nev": "Gyakoriság és relatív gyakoriság",
  "leiras": "Egy esemény bekövetkezéseinek száma és aránya; annak megfigyelése, hogy a relatív gyakoriság nagy elemszámnál stabilizálódik.",
  "kapu": true,
  "elofeltetel": [
   "ESE-21",
   "ESE-15"
  ]
 },
 {
  "id": "ESE-23",
  "ag": "ESE",
  "nev": "Esemény, eseménytér, elemi esemény",
  "leiras": "Az összes lehetséges kimenetel halmaza; az esemény mint az eseménytér részhalmaza; összetett események leírása halmazműveletekkel.",
  "kapu": false,
  "elofeltetel": [
   "ESE-22",
   "LOG-06"
  ]
 },
 {
  "id": "ESE-24",
  "ag": "ESE",
  "nev": "A valószínűség fogalma",
  "leiras": "A valószínűség bevezetése statisztikai alapon: az az érték, amely köré a relatív gyakoriság stabilizálódik. A valószínűség tulajdonságai.",
  "kapu": true,
  "elofeltetel": [
   "ESE-22"
  ]
 },
 {
  "id": "ESE-25",
  "ag": "ESE",
  "nev": "Klasszikus valószínűségi modell, Laplace-képlet",
  "leiras": "Egyenlő esélyű elemi események esetén `P = kedvező / összes`; a modell alkalmazhatóságának feltétele; a számláló és a nevező összeszámlálása kombinatorikával.",
  "kapu": true,
  "elofeltetel": [
   "ESE-24",
   "ESE-04"
  ]
 },
 {
  "id": "ESE-26",
  "ag": "ESE",
  "nev": "Egymást kizáró és független események",
  "leiras": "A két fogalom megkülönböztetése (és annak felismerése, hogy nem ugyanaz); az összeg- és a szorzatszabály egyszerű alkalmazása.",
  "kapu": false,
  "elofeltetel": [
   "ESE-23",
   "ESE-25"
  ]
 },
 {
  "id": "ESE-27",
  "ag": "ESE",
  "nev": "Valószínűség mintavételnél",
  "leiras": "Valószínűség meghatározása visszatevéses és visszatevés nélküli mintavétel esetén; a két eset eltérő összeszámlálása.",
  "kapu": false,
  "elofeltetel": [
   "ESE-25",
   "ESE-08"
  ]
 },
 {
  "id": "ESE-28",
  "ag": "ESE",
  "nev": "Geometriai valószínűség",
  "leiras": "Valószínűség hossz-, terület- vagy térfogatarányként, ha a kimenetelek nem megszámlálhatóak.",
  "kapu": false,
  "elofeltetel": [
   "ESE-25",
   "GEO-20"
  ]
 },
 {
  "id": "ESE-29",
  "ag": "ESE",
  "nev": "Diszkrét valószínűség-eloszlás",
  "leiras": "A lehetséges értékek és a hozzájuk tartozó valószínűségek táblázata; ábrázolás oszlopdiagrammal; annak ellenőrzése, hogy a valószínűségek összege 1.",
  "kapu": false,
  "elofeltetel": [
   "ESE-24",
   "ESE-13"
  ]
 }
];

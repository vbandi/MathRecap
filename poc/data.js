// Generált fájl - ne szerkeszd. Forrás: agak/*.md, generátor: poc/build-data.mjs
window.TREE_NODES = [
 {
  "id": "LOG-01",
  "branch": "LOG",
  "name": "Halmaz, elem, halmazba rendezés",
  "description": "Elemek válogatása egy vagy több tulajdonság szerint; annak felismerése, hogy egy halmazt a tagjai határoznak meg. A \"hova tartozik?\" kérdés matematikai formája.",
  "gateway": true,
  "prerequisites": []
 },
 {
  "id": "LOG-02",
  "branch": "LOG",
  "name": "Igaz és hamis állítás",
  "description": "Egy kijelentés logikai értékének megállapítása; igaz és hamis állítások önálló megfogalmazása, cáfolat ellenpéldával.",
  "gateway": false,
  "prerequisites": []
 },
 {
  "id": "LOG-03",
  "branch": "LOG",
  "name": "Részhalmaz, üres halmaz, halmazok egyenlősége",
  "description": "A \"minden eleme egyben eleme a másiknak\" viszony; valódi részhalmaz, üres halmaz, két halmaz egyenlőségének feltétele.",
  "gateway": false,
  "prerequisites": [
   "LOG-01"
  ]
 },
 {
  "id": "LOG-04",
  "branch": "LOG",
  "name": "Halmazábra (Venn-diagram)",
  "description": "Halmazok és viszonyaik vizuális ábrázolása; az ábra olvasása és készítése. A későbbi halmazműveletek szemléleti alapja.",
  "gateway": false,
  "prerequisites": [
   "LOG-01"
  ]
 },
 {
  "id": "LOG-05",
  "branch": "LOG",
  "name": "Nyitott mondat, igazsághalmaz",
  "description": "Változót tartalmazó állítás; azon behelyettesítések halmaza, amelyek igazzá teszik. Az egyenlet fogalmának logikai előképe.",
  "gateway": false,
  "prerequisites": [
   "LOG-01",
   "LOG-02"
  ]
 },
 {
  "id": "LOG-06",
  "branch": "LOG",
  "name": "Metszet és unió",
  "description": "Két halmaz közös részének és egyesítésének képzése, ábrázolása, elemeinek felsorolása.",
  "gateway": true,
  "prerequisites": [
   "LOG-03",
   "LOG-04"
  ]
 },
 {
  "id": "LOG-07",
  "branch": "LOG",
  "name": "Logikai műveletek: \"nem\", \"és\", \"vagy\"",
  "description": "A tagadás, a konjunkció, valamint a megengedő és a kizáró \"vagy\" jelentése és helyes használata.",
  "gateway": false,
  "prerequisites": [
   "LOG-05"
  ]
 },
 {
  "id": "LOG-08",
  "branch": "LOG",
  "name": "Komplementer, különbség, alaphalmaz",
  "description": "Kiegészítő halmaz képzése adott alaphalmazra nézve; két halmaz különbsége. Annak megértése, hogy a komplementer csak alaphalmazzal együtt értelmes.",
  "gateway": false,
  "prerequisites": [
   "LOG-06"
  ]
 },
 {
  "id": "LOG-09",
  "branch": "LOG",
  "name": "Kvantorok: \"minden\", \"van olyan\"",
  "description": "Univerzális és egzisztenciális állítások megkülönböztetése, logikai értékük eldöntése és indoklása.",
  "gateway": false,
  "prerequisites": [
   "LOG-07"
  ]
 },
 {
  "id": "LOG-10",
  "branch": "LOG",
  "name": "Halmazmegadási módok, diszjunkt felbontás, osztályozás",
  "description": "Halmaz megadása elemek felsorolásával és tulajdonsággal; halmaz felbontása közös elem nélküli részhalmazokra; osztályozás mint modellezési eszköz.",
  "gateway": false,
  "prerequisites": [
   "LOG-08"
  ]
 },
 {
  "id": "LOG-11",
  "branch": "LOG",
  "name": "Implikáció és ekvivalencia",
  "description": "A \"ha…, akkor…\" és az \"akkor és csak akkor\" típusú állítások jelentése, logikai értéke; a szükséges és az elégséges feltétel megkülönböztetése.",
  "gateway": false,
  "prerequisites": [
   "LOG-09"
  ]
 },
 {
  "id": "LOG-12",
  "branch": "LOG",
  "name": "Állítás megfordítása és tagadása",
  "description": "Adott implikáció megfordításának megfogalmazása, és annak felismerése, hogy a megfordítás nem feltétlenül igaz; összetett állítások tagadása.",
  "gateway": false,
  "prerequisites": [
   "LOG-11"
  ]
 },
 {
  "id": "LOG-13",
  "branch": "LOG",
  "name": "Halmaz elemszáma, logikai szita",
  "description": "Véges halmazok elemszámának meghatározása; két-három halmaz uniójának elemszáma a szita-formulával.",
  "gateway": false,
  "prerequisites": [
   "LOG-10",
   "ESE-01"
  ]
 },
 {
  "id": "LOG-14",
  "branch": "LOG",
  "name": "Tétel és bizonyítás",
  "description": "A matematikai bizonyítás fogalma: definíció, tétel, bizonyítás elkülönítése. Néhány lépéses bizonyítási gondolatsor megértése és önálló összeállítása.",
  "gateway": true,
  "prerequisites": [
   "LOG-12"
  ]
 },
 {
  "id": "LOG-15",
  "branch": "LOG",
  "name": "Halmazműveletek és logikai műveletek kapcsolata",
  "description": "Annak felismerése, hogy a metszet ↔ \"és\", az unió ↔ \"vagy\", a komplementer ↔ \"nem\" megfeleltetés strukturális; igazságtáblázat használata.",
  "gateway": false,
  "prerequisites": [
   "LOG-08",
   "LOG-11"
  ]
 },
 {
  "id": "LOG-16",
  "branch": "LOG",
  "name": "Bizonyítási módszerek",
  "description": "Direkt bizonyítás, indirekt bizonyítás, esetszétválasztás, ellenpélda. A stratégia tudatos megválasztása az állítás szerkezete alapján.",
  "gateway": false,
  "prerequisites": [
   "LOG-14"
  ]
 },
 {
  "id": "SZA-01",
  "branch": "SZA",
  "name": "Természetes számok, helyi érték",
  "description": "Helyi érték, alaki érték, valódi érték; nagy számok írása és olvasása. Annak megértése, hogy a számjegy helye hordozza az információt.",
  "gateway": true,
  "prerequisites": []
 },
 {
  "id": "SZA-02",
  "branch": "SZA",
  "name": "Számegyenes",
  "description": "Számok ábrázolása egyenesen, összehasonlítás, sorba rendezés. A szám mint pozíció – a későbbi koordináta-rendszer és a valós számok egyenes-modelljének alapja.",
  "gateway": false,
  "prerequisites": [
   "SZA-01"
  ]
 },
 {
  "id": "SZA-03",
  "branch": "SZA",
  "name": "Alapműveletek természetes számokkal",
  "description": "Írásbeli összeadás, kivonás, szorzás és osztás algoritmusai; fejszámolás; a hányados becslése.",
  "gateway": true,
  "prerequisites": [
   "SZA-01"
  ]
 },
 {
  "id": "SZA-07",
  "branch": "SZA",
  "name": "Római számok",
  "description": "Az I, V, X, L, C, D, M jelek ismerete, számok írása és olvasása. Példa nem helyiértékes számírásra.",
  "gateway": false,
  "prerequisites": [
   "SZA-01"
  ]
 },
 {
  "id": "SZA-04",
  "branch": "SZA",
  "name": "Műveleti sorrend és zárójelezés",
  "description": "A műveletek elvégzési sorrendje; a zárójel mint felülíró jel. Fejben, írásban és számológéppel egyaránt.",
  "gateway": false,
  "prerequisites": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-05",
  "branch": "SZA",
  "name": "Műveleti tulajdonságok",
  "description": "Felcserélhetőség (kommutativitás), csoportosíthatóság (asszociativitás), széttagolhatóság (disztributivitás) és tudatos alkalmazásuk a számolás egyszerűsítésére.",
  "gateway": false,
  "prerequisites": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-06",
  "branch": "SZA",
  "name": "Becslés, kerekítés, ellenőrzés",
  "description": "Nagyságrendi becslés a számolás előtt, észszerű kerekítés utána, az eredmény ellenőrzése. Az egyik legfontosabb \"élettartam-készség\".",
  "gateway": false,
  "prerequisites": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-08",
  "branch": "SZA",
  "name": "Osztó, többszörös, közös osztó, közös többszörös",
  "description": "Az oszthatóság reláció; egy szám osztóinak és többszöröseinek meghatározása; két szám közös osztói és közös többszörösei.",
  "gateway": true,
  "prerequisites": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-09",
  "branch": "SZA",
  "name": "Oszthatósági szabályok",
  "description": "A 2-vel, 3-mal, 4-gyel, 5-tel, 6-tal, 9-cel, 10-zel, 100-zal való oszthatóság szabályai és alkalmazásuk.",
  "gateway": false,
  "prerequisites": [
   "SZA-08"
  ]
 },
 {
  "id": "SZA-10",
  "branch": "SZA",
  "name": "Maradékos osztás, maradékosztályok",
  "description": "Osztandó = osztó · hányados + maradék; a természetes számok csoportosítása adott számmal való osztási maradékuk szerint.",
  "gateway": false,
  "prerequisites": [
   "SZA-08"
  ]
 },
 {
  "id": "SZA-11",
  "branch": "SZA",
  "name": "Negatív számok, ellentett, abszolút érték",
  "description": "Az egész számok halmaza; előjel, ellentett, abszolút érték; összehasonlítás és ábrázolás a számegyenesen.",
  "gateway": false,
  "prerequisites": [
   "SZA-02"
  ]
 },
 {
  "id": "SZA-12",
  "branch": "SZA",
  "name": "Közönséges tört, bővítés, egyszerűsítés",
  "description": "Törtrész és törtszám megfeleltetése; számláló, nevező; vegyes szám; bővítés és egyszerűsítés; egyenlő törtek felismerése; törtek összehasonlítása.",
  "gateway": true,
  "prerequisites": [
   "SZA-08"
  ]
 },
 {
  "id": "SZA-13",
  "branch": "SZA",
  "name": "Műveletek egész számokkal",
  "description": "A négy alapművelet kiterjesztése negatív számokra; az előjelszabályok és azok szemléletes indoklása.",
  "gateway": false,
  "prerequisites": [
   "SZA-11",
   "SZA-05"
  ]
 },
 {
  "id": "SZA-14",
  "branch": "SZA",
  "name": "Tizedes tört, a helyi érték kiterjesztése",
  "description": "Tizedesvessző, tizedjegyek; a helyiérték-táblázat kiterjesztése az egyesek alá; kapcsolat a közönséges tört alakkal.",
  "gateway": false,
  "prerequisites": [
   "SZA-12",
   "SZA-01"
  ]
 },
 {
  "id": "SZA-15",
  "branch": "SZA",
  "name": "Műveletek közönséges törtekkel, reciprok",
  "description": "Összeadás közös nevezővel, szorzás, osztás reciprokkal való szorzásként. A reciprok fogalma.",
  "gateway": false,
  "prerequisites": [
   "SZA-12",
   "SZA-05"
  ]
 },
 {
  "id": "SZA-17",
  "branch": "SZA",
  "name": "Prímszám, összetett szám, prímtényezős felbontás",
  "description": "A prímszám definíciója; összetett számok felbontása prímek szorzatára; a felbontás egyértelműsége.",
  "gateway": false,
  "prerequisites": [
   "SZA-09"
  ]
 },
 {
  "id": "SZA-20",
  "branch": "SZA",
  "name": "Hatvány pozitív egész kitevővel, négyzetszám",
  "description": "A hatványozás mint ismételt szorzás; hatványalap, kitevő, hatványérték; négyzetszámok és köbszámok.",
  "gateway": true,
  "prerequisites": [
   "SZA-03"
  ]
 },
 {
  "id": "SZA-16",
  "branch": "SZA",
  "name": "Műveletek tizedes törtekkel",
  "description": "Írásbeli összeadás, kivonás, szorzás és osztás tizedes törtekkel; a tizedesvessző kezelése; kapcsolat a mértékegység-átváltással.",
  "gateway": false,
  "prerequisites": [
   "SZA-14",
   "SZA-05"
  ]
 },
 {
  "id": "SZA-19",
  "branch": "SZA",
  "name": "Legnagyobb közös osztó és legkisebb közös többszörös",
  "description": "LNKO és LKKT meghatározása prímtényezős felbontásból; alkalmazásuk törtek egyszerűsítésére és közös nevező keresésére.",
  "gateway": false,
  "prerequisites": [
   "SZA-17"
  ]
 },
 {
  "id": "SZA-22",
  "branch": "SZA",
  "name": "Négyzetgyök",
  "description": "Négyzetszámok négyzetgyöke, majd a négyzetgyök általános fogalma nemnegatív számokra; közelítő érték számológéppel.",
  "gateway": false,
  "prerequisites": [
   "SZA-20"
  ]
 },
 {
  "id": "SZA-23",
  "branch": "SZA",
  "name": "Számrendszerek",
  "description": "A helyi értékes írásmód általánosítása tetszőleges alapszámra; átírás 10-es és más alapú számrendszer között.",
  "gateway": false,
  "prerequisites": [
   "SZA-01",
   "SZA-20"
  ]
 },
 {
  "id": "SZA-18",
  "branch": "SZA",
  "name": "Racionális számok",
  "description": "A racionális szám fogalma; közönséges tört és tizedes tört alak kölcsönös megfeleltetése; a racionális számok halmaza a számegyenesen.",
  "gateway": true,
  "prerequisites": [
   "SZA-13",
   "SZA-15",
   "SZA-16"
  ]
 },
 {
  "id": "SZA-25",
  "branch": "SZA",
  "name": "Hatványozás azonosságai; 0 és negatív egész kitevő",
  "description": "Az azonosságok felfedezése és bizonyítása; a permanencia-elv, amely kikényszeríti a 0 és a negatív kitevő értelmezését.",
  "gateway": false,
  "prerequisites": [
   "SZA-20",
   "SZA-15"
  ]
 },
 {
  "id": "SZA-21",
  "branch": "SZA",
  "name": "Véges, végtelen szakaszos és nem szakaszos tizedes tört",
  "description": "Annak felismerése, hogy minden racionális szám tizedes tört alakja véges vagy végtelen szakaszos; példa nem szakaszos tizedes törtre.",
  "gateway": false,
  "prerequisites": [
   "SZA-18"
  ]
 },
 {
  "id": "SZA-28",
  "branch": "SZA",
  "name": "Normálalak",
  "description": "Nagyon nagy és nagyon kicsi számok írása `a · 10ⁿ` alakban (1 ≤ a < 10); számolás normálalakkal.",
  "gateway": false,
  "prerequisites": [
   "SZA-25"
  ]
 },
 {
  "id": "SZA-24",
  "branch": "SZA",
  "name": "Irracionális számok, valós számok",
  "description": "Példák irracionális számokra (√2, π); a valós számok halmaza és a számegyenes hézagmentes megfeleltetése.",
  "gateway": true,
  "prerequisites": [
   "SZA-21",
   "SZA-22"
  ]
 },
 {
  "id": "SZA-26",
  "branch": "SZA",
  "name": "Intervallumok",
  "description": "Nyílt, zárt és félig zárt intervallumok jelölése és értelmezése; számhalmazok megadása intervallumokkal.",
  "gateway": false,
  "prerequisites": [
   "SZA-24"
  ]
 },
 {
  "id": "SZA-27",
  "branch": "SZA",
  "name": "Négyzetgyök azonosságai",
  "description": "√(ab) = √a·√b, √(a/b) = √a/√b; gyöktelenítés; gyökös kifejezések egyszerűsítése.",
  "gateway": false,
  "prerequisites": [
   "SZA-22",
   "SZA-24"
  ]
 },
 {
  "id": "SZA-29",
  "branch": "SZA",
  "name": "Számhalmazok épülése, műveleti zártság",
  "description": "ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ; annak vizsgálata, mely halmaz mely műveletre zárt, és hogy éppen a zártság hiánya kényszeríti ki a bővítéseket.",
  "gateway": false,
  "prerequisites": [
   "SZA-24"
  ]
 },
 {
  "id": "SZA-30",
  "branch": "SZA",
  "name": "Relatív prímek, összetett oszthatósági szabályok",
  "description": "Relatív prím számok; összetett számmal való oszthatóság vizsgálata prímtényezők alapján; számolás osztási maradékokkal.",
  "gateway": false,
  "prerequisites": [
   "SZA-19",
   "SZA-10"
  ]
 },
 {
  "id": "SZA-31",
  "branch": "SZA",
  "name": "n-edik gyök",
  "description": "A négyzetgyök általánosítása; páros és páratlan kitevőjű gyök értelmezési tartománya közti különbség.",
  "gateway": false,
  "prerequisites": [
   "SZA-27"
  ]
 },
 {
  "id": "SZA-32",
  "branch": "SZA",
  "name": "Racionális kitevőjű hatvány",
  "description": "Az `a^(p/q)` értelmezése pozitív alap esetén: a `q`-adik gyök `p`-edik hatványa. A hatványozás azonosságainak érvényessége racionális kitevőre; szemléletes kiterjesztés irracionális kitevőre.",
  "gateway": true,
  "prerequisites": [
   "SZA-31",
   "SZA-25"
  ]
 },
 {
  "id": "SZA-33",
  "branch": "SZA",
  "name": "Logaritmus fogalma és azonosságai",
  "description": "A logaritmus mint a hatványozás inverz művelete; a szorzat, hányados és hatvány logaritmusa; áttérés más alapú logaritmusra; számológép használata.",
  "gateway": true,
  "prerequisites": [
   "SZA-32"
  ]
 },
 {
  "id": "ALG-01",
  "branch": "ALG",
  "name": "Arány, aránypár",
  "description": "Két mennyiség viszonyának kifejezése hányadossal; aránypár felírása és olvasása. A tört fogalmának \"relációs\" olvasata.",
  "gateway": false,
  "prerequisites": [
   "SZA-12"
  ]
 },
 {
  "id": "ALG-02",
  "branch": "ALG",
  "name": "Egyszerű szöveges feladatok: modellalkotás, következtetés",
  "description": "Szövegből a matematikai tartalom kiemelése; megoldás szakaszos ábrázolással, visszafelé gondolkodással, táblázattal. Az ellenőrzés a szövegbe visszahelyettesítéssel.",
  "gateway": false,
  "prerequisites": [
   "SZA-04"
  ]
 },
 {
  "id": "ALG-03",
  "branch": "ALG",
  "name": "Egyenes arányosság",
  "description": "Két mennyiség együtt változása állandó hányadossal; felismerés hétköznapi helyzetekben; következtetés egyről többre és többről egyre; arányos osztás (adott mennyiség felosztása megadott arányban).",
  "gateway": true,
  "prerequisites": [
   "ALG-01"
  ]
 },
 {
  "id": "ALG-04",
  "branch": "ALG",
  "name": "Mértékegységek és átváltásuk",
  "description": "Hosszúság, tömeg, idő, terület, térfogat, űrtartalom szabványegységei; átváltás helyiértékes gondolkodással; származtatott mértékegységek (sebesség, sűrűség).",
  "gateway": false,
  "prerequisites": [
   "ALG-01",
   "SZA-14"
  ]
 },
 {
  "id": "ALG-06",
  "branch": "ALG",
  "name": "A százalék fogalma",
  "description": "A százalék mint századrész; kapcsolat a törttel és a tizedes törttel; százalékos adatok értelmezése a hétköznapokban.",
  "gateway": false,
  "prerequisites": [
   "ALG-01",
   "SZA-14"
  ]
 },
 {
  "id": "ALG-05",
  "branch": "ALG",
  "name": "Fordított arányosság",
  "description": "Két mennyiség együtt változása állandó szorzattal; felismerés munkavégzési, mozgási és mérési helyzetekben.",
  "gateway": false,
  "prerequisites": [
   "ALG-03"
  ]
 },
 {
  "id": "ALG-07",
  "branch": "ALG",
  "name": "Százalékszámítás: alap, érték, láb, pont",
  "description": "A három alapfeladat (érték, alap, láb keresése); a százalékpont és a százalék megkülönböztetése; egymást követő százalékos változások.",
  "gateway": false,
  "prerequisites": [
   "ALG-06",
   "ALG-03"
  ]
 },
 {
  "id": "ALG-08",
  "branch": "ALG",
  "name": "Betűs kifejezés, változó, együttható, helyettesítési érték",
  "description": "Betűk használata ismeretlen vagy változó mennyiség jelölésére; egytagú és többtagú kifejezés; helyettesítési érték számolása.",
  "gateway": true,
  "prerequisites": [
   "SZA-05"
  ]
 },
 {
  "id": "ALG-09",
  "branch": "ALG",
  "name": "Egynemű kifejezések összevonása",
  "description": "Az egynemű tagok felismerése és összevonása; a rendezés mint a kifejezés egyszerűbb alakra hozása.",
  "gateway": false,
  "prerequisites": [
   "ALG-08"
  ]
 },
 {
  "id": "ALG-10",
  "branch": "ALG",
  "name": "Pénzügyi alapszámítások",
  "description": "Áremelés és leárazás, egyszerű kamat, keverési feladatok; banki ajánlatok, díjak összehasonlítása; bevétel–kiadás egyensúly.",
  "gateway": false,
  "prerequisites": [
   "ALG-07"
  ]
 },
 {
  "id": "ALG-12",
  "branch": "ALG",
  "name": "Elsőfokú egyenlet megoldása lebontogatással",
  "description": "A műveletsor \"visszafejtése\" az ismeretlen felszabadításáig. Intuitív, de csak egyszerű szerkezetű egyenletekre működik.",
  "gateway": false,
  "prerequisites": [
   "ALG-08"
  ]
 },
 {
  "id": "ALG-11",
  "branch": "ALG",
  "name": "Szorzás számmal, közös tényező kiemelése",
  "description": "Kéttagú kifejezés szorzása számmal (disztributivitás); a művelet megfordítása: közös tényező kiemelése.",
  "gateway": false,
  "prerequisites": [
   "ALG-09"
  ]
 },
 {
  "id": "ALG-13",
  "branch": "ALG",
  "name": "Mérlegelv",
  "description": "Az egyenlet mint egyensúly; mindkét oldalon azonos átalakítás végzése. Az egyetemes egyenletmegoldó módszer, amely tetszőleges szerkezetre működik.",
  "gateway": true,
  "prerequisites": [
   "ALG-12"
  ]
 },
 {
  "id": "ALG-14",
  "branch": "ALG",
  "name": "Műveletek algebrai kifejezésekkel, polinomok",
  "description": "Összeadás, kivonás, szorzás, osztás algebrai kifejezésekkel; egytagú kifejezés hatványa; a polinom fogalma és foka.",
  "gateway": false,
  "prerequisites": [
   "ALG-11"
  ]
 },
 {
  "id": "ALG-15",
  "branch": "ALG",
  "name": "Szöveges feladat megoldása egyenlettel",
  "description": "Az ismeretlen megválasztása, egyenlet felírása, megoldás, majd értelmezés és ellenőrzés az eredeti szövegben. Út–idő–sebesség, közös munkavégzés, keverés, pénzügyi feladatok.",
  "gateway": false,
  "prerequisites": [
   "ALG-13",
   "ALG-02"
  ]
 },
 {
  "id": "ALG-16",
  "branch": "ALG",
  "name": "Alaphalmaz, megoldáshalmaz, ekvivalens átalakítás",
  "description": "Annak tudatosítása, hogy a megoldáshalmaz az alaphalmaztól függ; ekvivalens és nem ekvivalens lépések megkülönböztetése; hamis gyök és gyökvesztés.",
  "gateway": true,
  "prerequisites": [
   "ALG-13"
  ]
 },
 {
  "id": "ALG-17",
  "branch": "ALG",
  "name": "Nevezetes azonosságok",
  "description": "`(a+b)²`, `(a−b)²`, `(a+b)(a−b)` ismerete, geometriai szemléltetése és kétirányú alkalmazása (kifejtés és szorzattá alakítás).",
  "gateway": true,
  "prerequisites": [
   "ALG-14"
  ]
 },
 {
  "id": "ALG-18",
  "branch": "ALG",
  "name": "Elsőfokú egyenlőtlenségek",
  "description": "Megoldás mérlegelvvel; a negatív számmal való szorzás relációfordító hatása; a megoldáshalmaz megadása intervallummal.",
  "gateway": false,
  "prerequisites": [
   "ALG-16"
  ]
 },
 {
  "id": "ALG-19",
  "branch": "ALG",
  "name": "Elsőfokú kétismeretlenes egyenletrendszer",
  "description": "Megoldás behelyettesítéssel, egyenlő együtthatók módszerével és grafikusan; a megoldások számának geometriai jelentése.",
  "gateway": false,
  "prerequisites": [
   "ALG-16"
  ]
 },
 {
  "id": "ALG-20",
  "branch": "ALG",
  "name": "Teljes négyzetté alakítás",
  "description": "Másodfokú kifejezés `a(x+p)² + q` alakra hozása. A másodfokú függvény ábrázolásának és a megoldóképlet levezetésének közös eszköze.",
  "gateway": false,
  "prerequisites": [
   "ALG-17"
  ]
 },
 {
  "id": "ALG-21",
  "branch": "ALG",
  "name": "Szorzattá alakítás",
  "description": "Kiemelés és nevezetes azonosságok kombinált alkalmazása; a szorzat nulla voltára vonatkozó elv (`ab = 0 ⇔ a = 0 vagy b = 0`).",
  "gateway": false,
  "prerequisites": [
   "ALG-17",
   "ALG-11"
  ]
 },
 {
  "id": "ALG-22",
  "branch": "ALG",
  "name": "Grafikus egyenletmegoldás",
  "description": "Az egyenlet két oldalának függvényként való ábrázolása; a metszéspontok mint megoldások; közelítő megoldás digitális eszközzel.",
  "gateway": false,
  "prerequisites": [
   "ALG-16",
   "FUG-10"
  ]
 },
 {
  "id": "ALG-23",
  "branch": "ALG",
  "name": "Másodfokú egyenlet: szorzattá alakítás és teljes négyzetté kiegészítés",
  "description": "A két \"kézi\" megoldási módszer; annak felismerése, melyik egyenletnél melyik gazdaságosabb.",
  "gateway": false,
  "prerequisites": [
   "ALG-20",
   "ALG-21",
   "ALG-16"
  ]
 },
 {
  "id": "ALG-24",
  "branch": "ALG",
  "name": "Megoldóképlet és diszkrimináns",
  "description": "A megoldóképlet levezetése teljes négyzetté alakítással; a diszkrimináns előjele és a valós gyökök száma közti kapcsolat.",
  "gateway": true,
  "prerequisites": [
   "ALG-23"
  ]
 },
 {
  "id": "ALG-25",
  "branch": "ALG",
  "name": "Gyöktényezős alak",
  "description": "`a(x−x₁)(x−x₂)` felírása; a gyökök és az együtthatók közti összefüggés; alkalmazás szorzattá alakításnál és szöveges feladatoknál.",
  "gateway": false,
  "prerequisites": [
   "ALG-24"
  ]
 },
 {
  "id": "ALG-26",
  "branch": "ALG",
  "name": "Másodfokúra visszavezethető egyenletek",
  "description": "Új ismeretlen bevezetése (helyettesítés); a kapott gyökök visszahelyettesítése és ellenőrzése.",
  "gateway": false,
  "prerequisites": [
   "ALG-24"
  ]
 },
 {
  "id": "ALG-27",
  "branch": "ALG",
  "name": "Másodfokú egyenlőtlenség",
  "description": "Megoldás a parabola grafikonja alapján; előjelvizsgálat a gyöktényezős alakkal; a megoldáshalmaz megadása intervallumokkal.",
  "gateway": false,
  "prerequisites": [
   "ALG-24",
   "FUG-12"
  ]
 },
 {
  "id": "ALG-28",
  "branch": "ALG",
  "name": "Exponenciális és logaritmusos egyenletek, egyenlőtlenségek",
  "description": "Azonos alapra hozás, a definíció alkalmazása, logaritmusvétel; az értelmezési tartomány és a monotonitás figyelembevétele egyenlőtlenségeknél.",
  "gateway": false,
  "prerequisites": [
   "SZA-33",
   "ALG-16",
   "FUG-16"
  ]
 },
 {
  "id": "FUG-01",
  "branch": "FUG",
  "name": "Megfeleltetés, hozzárendelés",
  "description": "Két halmaz elemei közötti kapcsolat létrehozása; a kapcsolat szabályának felismerése és megfogalmazása. A függvényfogalom csírája.",
  "gateway": false,
  "prerequisites": []
 },
 {
  "id": "FUG-02",
  "branch": "FUG",
  "name": "Sorozat, szabálykövetés",
  "description": "Számokból, jelekből, alakzatokból álló sorozat folytatása adott szabály szerint; néhány tagból a képzési szabály felismerése.",
  "gateway": false,
  "prerequisites": []
 },
 {
  "id": "FUG-03",
  "branch": "FUG",
  "name": "Derékszögű koordináta-rendszer",
  "description": "Tájékozódás a síkon számpárokkal; pont ábrázolása koordinátáiból és koordinátái leolvasása; a négy síknegyed.",
  "gateway": true,
  "prerequisites": [
   "SZA-02",
   "SZA-11"
  ]
 },
 {
  "id": "FUG-04",
  "branch": "FUG",
  "name": "Értéktáblázat és grafikon",
  "description": "Összetartozó értékpárok táblázatba rendezése, majd ábrázolása koordináta-rendszerben; a grafikon mint a kapcsolat képe.",
  "gateway": false,
  "prerequisites": [
   "FUG-01",
   "FUG-03"
  ]
 },
 {
  "id": "FUG-05",
  "branch": "FUG",
  "name": "Grafikonok jellemzése",
  "description": "Növekedés és fogyás, legnagyobb és legkisebb érték, tengelymetszetek leolvasása; hétköznapi grafikonok (hőmérséklet, út–idő) értelmezése.",
  "gateway": false,
  "prerequisites": [
   "FUG-04"
  ]
 },
 {
  "id": "FUG-06",
  "branch": "FUG",
  "name": "Az egyenes arányosság grafikonja",
  "description": "Az origón átmenő egyenes felismerése és megrajzolása; az arányossági tényező mint meredekség.",
  "gateway": false,
  "prerequisites": [
   "FUG-04",
   "ALG-03"
  ]
 },
 {
  "id": "FUG-07",
  "branch": "FUG",
  "name": "A fordított arányosság grafikonja",
  "description": "A hiperbolaág felismerése; annak megértése, miért nem metszi a tengelyeket.",
  "gateway": false,
  "prerequisites": [
   "FUG-06",
   "ALG-05"
  ]
 },
 {
  "id": "FUG-08",
  "branch": "FUG",
  "name": "A függvény fogalma",
  "description": "Értelmezési tartomány, képhalmaz, értékkészlet; a hozzárendelés egyértelműsége mint döntő kritérium; a függvény megadásának módjai.",
  "gateway": true,
  "prerequisites": [
   "FUG-04"
  ]
 },
 {
  "id": "FUG-09",
  "branch": "FUG",
  "name": "Függvénytulajdonságok",
  "description": "Zérushely, szélsőérték, monotonitás (növekedés–fogyás), értékkészlet meghatározása grafikonról és képletből. A függvényvizsgálat közös eszköztára.",
  "gateway": true,
  "prerequisites": [
   "FUG-08",
   "FUG-05",
   "SZA-24"
  ]
 },
 {
  "id": "FUG-11",
  "branch": "FUG",
  "name": "Kölcsönösen egyértelmű hozzárendelés, inverz",
  "description": "Annak eldöntése, mikor fordítható meg egy hozzárendelés; az inverz függvény grafikonja mint tükörkép az `y = x` egyenesre.",
  "gateway": false,
  "prerequisites": [
   "FUG-08"
  ]
 },
 {
  "id": "FUG-10",
  "branch": "FUG",
  "name": "Lineáris függvény",
  "description": "`x ↦ mx + b`; a meredekség és a tengelymetszet jelentése; a hozzárendelési szabály leolvasása grafikonról.",
  "gateway": true,
  "prerequisites": [
   "FUG-09",
   "FUG-06"
  ]
 },
 {
  "id": "FUG-13",
  "branch": "FUG",
  "name": "Abszolútérték-függvény",
  "description": "Az `x ↦ \\",
  "gateway": false,
  "prerequisites": [
   "FUG-09",
   "SZA-11"
  ]
 },
 {
  "id": "FUG-12",
  "branch": "FUG",
  "name": "Másodfokú függvény",
  "description": "Az `x ↦ ax² + bx + c` függvény parabolája; csúcspont, tengely, nyílásirány meghatározása teljes négyzetté alakítással.",
  "gateway": true,
  "prerequisites": [
   "FUG-09",
   "ALG-20"
  ]
 },
 {
  "id": "FUG-14",
  "branch": "FUG",
  "name": "Négyzetgyökfüggvény",
  "description": "Az `x ↦ √x` függvény grafikonja, értelmezési tartománya és monotonitása; kapcsolata a másodfokú függvénnyel.",
  "gateway": false,
  "prerequisites": [
   "FUG-09",
   "SZA-27"
  ]
 },
 {
  "id": "FUG-15",
  "branch": "FUG",
  "name": "Az `x ↦ a/x` függvény",
  "description": "A fordított arányosság függvényként; két hiperbolaág, a szakadási hely, az aszimptotikus viselkedés szemléletes leírása.",
  "gateway": false,
  "prerequisites": [
   "FUG-09",
   "FUG-07"
  ]
 },
 {
  "id": "FUG-17",
  "branch": "FUG",
  "name": "Exponenciális függvény",
  "description": "Az `x ↦ aˣ` függvény; az `a > 1` és a `0 < a < 1` eset megkülönböztetése; állandó szorzóval való növekedés.",
  "gateway": false,
  "prerequisites": [
   "FUG-09",
   "SZA-32"
  ]
 },
 {
  "id": "FUG-20",
  "branch": "FUG",
  "name": "Számsorozat: megadás képlettel és rekurzióval",
  "description": "A sorozat mint pozitív egész számokon értelmezett függvény; explicit képlet és rekurzív megadás közti különbség.",
  "gateway": true,
  "prerequisites": [
   "FUG-02",
   "FUG-08"
  ]
 },
 {
  "id": "FUG-16",
  "branch": "FUG",
  "name": "Függvénytranszformációk",
  "description": "`f(x) + c`, `f(x + c)`, `c · f(x)`, `\\",
  "gateway": true,
  "prerequisites": [
   "FUG-10",
   "FUG-12",
   "FUG-13"
  ]
 },
 {
  "id": "FUG-18",
  "branch": "FUG",
  "name": "Logaritmusfüggvény",
  "description": "Az exponenciális függvény inverze; grafikonja, értelmezési tartománya, monotonitása.",
  "gateway": false,
  "prerequisites": [
   "FUG-17",
   "SZA-33",
   "FUG-11"
  ]
 },
 {
  "id": "FUG-21",
  "branch": "FUG",
  "name": "Számtani sorozat",
  "description": "Állandó különbség (differencia); az n-edik tag és az első n tag összegének képlete, és a képlet bizonyítása.",
  "gateway": false,
  "prerequisites": [
   "FUG-20"
  ]
 },
 {
  "id": "FUG-22",
  "branch": "FUG",
  "name": "Mértani sorozat",
  "description": "Állandó hányados (kvóciens); az n-edik tag és az első n tag összegének képlete, és a képlet bizonyítása.",
  "gateway": false,
  "prerequisites": [
   "FUG-20",
   "SZA-25"
  ]
 },
 {
  "id": "FUG-19",
  "branch": "FUG",
  "name": "Exponenciális folyamatok modellezése",
  "description": "Népességnövekedés, radioaktív bomlás, kamatos kamat, járványterjedés leírása; adatokra függvény illesztése és a paraméterek értelmezése.",
  "gateway": false,
  "prerequisites": [
   "FUG-17",
   "ALG-28"
  ]
 },
 {
  "id": "FUG-23",
  "branch": "FUG",
  "name": "Kamatos kamat, gyűjtőjáradék, törlesztőrészlet",
  "description": "Tőke, kamatláb, futamidő; a mértani sorozat és összegképletének alkalmazása megtakarítási, befektetési és hitelfelvételi feladatokra, a kockázatok mérlegelésével.",
  "gateway": false,
  "prerequisites": [
   "FUG-22",
   "ALG-10"
  ]
 },
 {
  "id": "GEO-01",
  "branch": "GEO",
  "name": "Térelemek: pont, egyenes, sík; szakasz, félegyenes",
  "description": "A geometria alapfogalmai; egyenes, félegyenes és szakasz megkülönböztetése; illeszkedés.",
  "gateway": true,
  "prerequisites": []
 },
 {
  "id": "GEO-02",
  "branch": "GEO",
  "name": "Szög, szögmérés, szögfajták",
  "description": "A szögtartomány mint síkrész; mérés fokban (és szögpercben); hegyes-, derék-, tompa-, egyenes-, homorú- és teljesszög.",
  "gateway": false,
  "prerequisites": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-03",
  "branch": "GEO",
  "name": "Párhuzamosság és merőlegesség",
  "description": "Egyenesek kölcsönös helyzete a síkban; két pont, pont és egyenes, két párhuzamos egyenes távolsága.",
  "gateway": false,
  "prerequisites": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-04",
  "branch": "GEO",
  "name": "Alapszerkesztések",
  "description": "Szakaszfelező merőleges, szögfelező, merőleges és párhuzamos egyenes szerkesztése, szögmásolás – körzővel és egyélű vonalzóval, illetve dinamikus geometriai szoftverrel. Ezek a további szerkesztések \"építőkockái\".",
  "gateway": true,
  "prerequisites": [
   "GEO-02",
   "GEO-03"
  ]
 },
 {
  "id": "GEO-05",
  "branch": "GEO",
  "name": "Nevezetes szögpárok",
  "description": "Pótszögek, mellékszögek, kiegészítő szögek, csúcsszögek, egyállású szögek, váltószögek – és a párhuzamos szelők tulajdonságai.",
  "gateway": false,
  "prerequisites": [
   "GEO-02",
   "GEO-03"
  ]
 },
 {
  "id": "GEO-06",
  "branch": "GEO",
  "name": "Sokszög; konvex és konkáv; átló",
  "description": "Zárt töröttvonal által határolt síkidom; a konvexitás szemléletes és pontos jelentése; az átló fogalma.",
  "gateway": false,
  "prerequisites": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-07",
  "branch": "GEO",
  "name": "Háromszög szögei, háromszög-egyenlőtlenség",
  "description": "A belső szögek összege 180°, és ennek bizonyítása párhuzamos szelőkkel; annak feltétele, hogy három szakaszból háromszög szerkeszthető.",
  "gateway": true,
  "prerequisites": [
   "GEO-06",
   "GEO-05"
  ]
 },
 {
  "id": "GEO-08",
  "branch": "GEO",
  "name": "Háromszögek osztályozása",
  "description": "Csoportosítás szögek szerint (hegyes-, derék-, tompaszögű) és oldalak szerint (általános, egyenlő szárú, szabályos); a tengelyesen szimmetrikus háromszögek.",
  "gateway": false,
  "prerequisites": [
   "GEO-07"
  ]
 },
 {
  "id": "GEO-09",
  "branch": "GEO",
  "name": "A háromszög külső szögei",
  "description": "A külső szög és a nem mellette fekvő belső szögek kapcsolata; a külső szögek összege 360°.",
  "gateway": false,
  "prerequisites": [
   "GEO-07"
  ]
 },
 {
  "id": "GEO-10",
  "branch": "GEO",
  "name": "Négyszögek: belső és külső szögösszeg",
  "description": "A 360°-os belső szögösszeg levezetése átlóval való háromszögekre bontással; konvex és konkáv négyszögek.",
  "gateway": false,
  "prerequisites": [
   "GEO-06",
   "GEO-07"
  ]
 },
 {
  "id": "GEO-11",
  "branch": "GEO",
  "name": "Speciális négyszögek és halmazábrájuk",
  "description": "Trapéz, húrtrapéz, paralelogramma, deltoid, rombusz, téglalap, négyzet tulajdonságai (oldalak, szögek, átlók, szimmetriák) és tartalmazási viszonyaik.",
  "gateway": false,
  "prerequisites": [
   "GEO-10",
   "GEO-23"
  ]
 },
 {
  "id": "GEO-12",
  "branch": "GEO",
  "name": "Konvex sokszög átlói és szögösszege",
  "description": "Az `n(n−3)/2` átlószám és az `(n−2)·180°` belső szögösszeg tétele, bizonyítással.",
  "gateway": false,
  "prerequisites": [
   "GEO-10"
  ]
 },
 {
  "id": "GEO-13",
  "branch": "GEO",
  "name": "Szabályos sokszög",
  "description": "Egyenlő oldalak és egyenlő szögek; a középponti szög, a körülírt és a beírt kör.",
  "gateway": false,
  "prerequisites": [
   "GEO-12"
  ]
 },
 {
  "id": "GEO-14",
  "branch": "GEO",
  "name": "A kör és részei",
  "description": "Körvonal és körlap; középpont, sugár, húr, átmérő, szelő, érintő, körív, körcikk, körszelet; a középponti szög.",
  "gateway": false,
  "prerequisites": [
   "GEO-01",
   "GEO-02"
  ]
 },
 {
  "id": "GEO-15",
  "branch": "GEO",
  "name": "Kerület és terület fogalma, mérése",
  "description": "A mérés alapelve: egységválasztás és összehasonlítás; a terület mint lefedés egységnégyzetekkel; alkalmi és szabványegységek.",
  "gateway": false,
  "prerequisites": [
   "ALG-04"
  ]
 },
 {
  "id": "GEO-16",
  "branch": "GEO",
  "name": "Téglalap és négyzet kerülete, területe",
  "description": "Az `a · b` területképlet megalapozása; a kerület és a terület független változása azonos alakzatcsaládon belül.",
  "gateway": false,
  "prerequisites": [
   "GEO-15",
   "GEO-06"
  ]
 },
 {
  "id": "GEO-17",
  "branch": "GEO",
  "name": "Az átdarabolás elve",
  "description": "Annak felismerése, hogy egy alakzat darabokra vágva és átrendezve ugyanakkora területű. Ez az elv adja meg szinte az összes további területképletet.",
  "gateway": true,
  "prerequisites": [
   "GEO-16"
  ]
 },
 {
  "id": "GEO-18",
  "branch": "GEO",
  "name": "A háromszög területe",
  "description": "Az `a · mₐ / 2` képlet levezetése átdarabolással vagy paralelogrammából; a magasság megválasztásának szabadsága.",
  "gateway": false,
  "prerequisites": [
   "GEO-17",
   "GEO-08"
  ]
 },
 {
  "id": "GEO-19",
  "branch": "GEO",
  "name": "Speciális négyszögek területe",
  "description": "Paralelogramma, trapéz, deltoid, rombusz területképletei, mindegyik átdarabolással megalapozva.",
  "gateway": false,
  "prerequisites": [
   "GEO-17",
   "GEO-11"
  ]
 },
 {
  "id": "GEO-20",
  "branch": "GEO",
  "name": "Sokszögek területe",
  "description": "Tetszőleges sokszög területének meghatározása háromszögekre bontással vagy átdarabolással; szabályos sokszög területe.",
  "gateway": false,
  "prerequisites": [
   "GEO-19",
   "GEO-13"
  ]
 },
 {
  "id": "GEO-21",
  "branch": "GEO",
  "name": "A kör kerülete és területe",
  "description": "A π mint állandó arány; a `2rπ` és az `r²π` képlet szemléletes megalapozása; a kör mint sokszögek határhelyzete.",
  "gateway": false,
  "prerequisites": [
   "GEO-14",
   "ALG-03"
  ]
 },
 {
  "id": "GEO-22",
  "branch": "GEO",
  "name": "Körív, körcikk, körgyűrű, körszelet",
  "description": "Annak alkalmazása, hogy a középponti szög egyenesen arányos az ívhosszal és a körcikk területével; összetett síkidomok kerülete és területe.",
  "gateway": false,
  "prerequisites": [
   "GEO-21",
   "ALG-03"
  ]
 },
 {
  "id": "GEO-23",
  "branch": "GEO",
  "name": "Egybevágóság, síkbeli mozgások",
  "description": "Az \"ugyanolyan alakú és méretű\" viszony; egybevágó alakzatok felismerése; a mozgatás mint alakzatokat átvivő leképezés.",
  "gateway": true,
  "prerequisites": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-24",
  "branch": "GEO",
  "name": "Tengelyes tükrözés és tengelyes szimmetria",
  "description": "A transzformáció tulajdonságai (távolság- és szögtartás, körüljárási irány megfordítása); tükörkép szerkesztése; szimmetriatengely keresése.",
  "gateway": false,
  "prerequisites": [
   "GEO-23",
   "GEO-04"
  ]
 },
 {
  "id": "GEO-25",
  "branch": "GEO",
  "name": "Középpontos tükrözés és középpontos szimmetria",
  "description": "A 180°-os elforgatásként is felfogható tükrözés; tulajdonságai és szerkesztése; középpontosan szimmetrikus alakzatok.",
  "gateway": false,
  "prerequisites": [
   "GEO-24"
  ]
 },
 {
  "id": "GEO-26",
  "branch": "GEO",
  "name": "Pont körüli forgatás",
  "description": "Forgásközéppont és forgásszög; a forgatás mint két tengelyes tükrözés egymásutánja; forgásszimmetria.",
  "gateway": false,
  "prerequisites": [
   "GEO-25"
  ]
 },
 {
  "id": "GEO-27",
  "branch": "GEO",
  "name": "Párhuzamos eltolás",
  "description": "Irány, irányítás és nagyság megadása; az eltolás mint két párhuzamos tengelyű tükrözés eredője.",
  "gateway": false,
  "prerequisites": [
   "GEO-23"
  ]
 },
 {
  "id": "GEO-28",
  "branch": "GEO",
  "name": "Vektor, vektorműveletek",
  "description": "A vektor fogalmának kialakítása az eltolásból; abszolút érték, nullvektor, ellentett vektor, helyvektor; összeadás, kivonás, számmal való szorzás.",
  "gateway": true,
  "prerequisites": [
   "GEO-27"
  ]
 },
 {
  "id": "GEO-29",
  "branch": "GEO",
  "name": "Az egybevágósági transzformációk rendszere",
  "description": "A négy alaptranszformáció összehasonlítása és egymás utáni végrehajtása; alkalmazásuk feladatmegoldásban és bizonyításban; parkettázás.",
  "gateway": false,
  "prerequisites": [
   "GEO-24",
   "GEO-26",
   "GEO-27"
  ]
 },
 {
  "id": "GEO-30",
  "branch": "GEO",
  "name": "Háromszögek egybevágóságának alapesetei",
  "description": "Az SSS, SAS, ASA és SsA esetek; alkalmazásuk szerkesztéseknél és bizonyításoknál.",
  "gateway": false,
  "prerequisites": [
   "GEO-29",
   "GEO-08"
  ]
 },
 {
  "id": "GEO-31",
  "branch": "GEO",
  "name": "Kicsinyítés és nagyítás",
  "description": "Az alakhű méretváltoztatás felismerése hétköznapi helyzetekben: térkép, makett, fénykép, tervrajz.",
  "gateway": false,
  "prerequisites": [
   "GEO-23"
  ]
 },
 {
  "id": "GEO-32",
  "branch": "GEO",
  "name": "Középpontos hasonlóság és hasonlósági transzformáció",
  "description": "Hasonlósági középpont és arány; a transzformáció tulajdonságai; a hasonlóság mint középpontos hasonlóság és egybevágóság egymásutánja.",
  "gateway": false,
  "prerequisites": [
   "GEO-31",
   "GEO-29"
  ]
 },
 {
  "id": "GEO-33",
  "branch": "GEO",
  "name": "Hasonló háromszögek",
  "description": "A hasonlóság alapesetei; párhuzamos szelők tétele; alkalmazás magasság- és távolságmérésre (\"Thalész-módszer\").",
  "gateway": true,
  "prerequisites": [
   "GEO-32",
   "GEO-30"
  ]
 },
 {
  "id": "GEO-34",
  "branch": "GEO",
  "name": "Hasonló síkidomok kerületének és területének aránya",
  "description": "A kerület aránya `λ`, a területé `λ²` – és annak megértése, miért nem ugyanaz a kettő.",
  "gateway": false,
  "prerequisites": [
   "GEO-33",
   "GEO-20"
  ]
 },
 {
  "id": "GEO-35",
  "branch": "GEO",
  "name": "Szerkesztési feladatok, diszkusszió",
  "description": "Több feltételnek megfelelő ábra szerkesztése: elemzés, szerkesztés, bizonyítás, diszkusszió. A megoldások számának vizsgálata.",
  "gateway": false,
  "prerequisites": [
   "GEO-04",
   "GEO-29"
  ]
 },
 {
  "id": "GEO-36",
  "branch": "GEO",
  "name": "Pitagorasz-tétel és megfordítása",
  "description": "`a² + b² = c²` derékszögű háromszögben; bizonyítás átdarabolással; a megfordítás használata a derékszögűség igazolására; pitagoraszi számhármasok.",
  "gateway": true,
  "prerequisites": [
   "GEO-18",
   "SZA-22"
  ]
 },
 {
  "id": "GEO-37",
  "branch": "GEO",
  "name": "Thalész-tétel és megfordítása",
  "description": "A kör átmérője fölé rajzolt kerületi szög derékszög; bizonyítás egyenlő szárú háromszögekkel; alkalmazás érintőszerkesztésnél.",
  "gateway": false,
  "prerequisites": [
   "GEO-14",
   "GEO-08",
   "LOG-14"
  ]
 },
 {
  "id": "GEO-38",
  "branch": "GEO",
  "name": "A háromszög nevezetes vonalai",
  "description": "Oldalfelező merőleges, szögfelező, magasságvonal, súlyvonal, középvonal – definícióik és alaptulajdonságaik.",
  "gateway": false,
  "prerequisites": [
   "GEO-04",
   "GEO-08"
  ]
 },
 {
  "id": "GEO-39",
  "branch": "GEO",
  "name": "A háromszög nevezetes pontjai és körei",
  "description": "Az oldalfelező merőlegesek és a belső szögfelezők metszéspontjára vonatkozó tétel bizonyítása; körülírt és beírt kör; súlypont, magasságpont.",
  "gateway": false,
  "prerequisites": [
   "GEO-38"
  ]
 },
 {
  "id": "GEO-40",
  "branch": "GEO",
  "name": "Hegyesszögek szögfüggvényei",
  "description": "Szinusz, koszinusz, tangens definíciója derékszögű háromszögben; a definíció jogosságának hasonlóságon alapuló indoklása; számítások gyakorlati helyzetekben.",
  "gateway": true,
  "prerequisites": [
   "GEO-36",
   "GEO-33"
  ]
 },
 {
  "id": "GEO-41",
  "branch": "GEO",
  "name": "Tompaszögek szögfüggvényei, összefüggések",
  "description": "A szögfüggvények kiterjesztése tompaszögre; a pitagoraszi összefüggés (`sin²α + cos²α = 1`), a pótszögek és mellékszögek szögfüggvényei; `tg α = sin α / cos α`.",
  "gateway": false,
  "prerequisites": [
   "GEO-40"
  ]
 },
 {
  "id": "GEO-42",
  "branch": "GEO",
  "name": "Szög meghatározása szögfüggvény értékéből",
  "description": "Az inverz szögfüggvények használata számológéppel; a több lehetséges megoldás mérlegelése a feladat kontextusában.",
  "gateway": false,
  "prerequisites": [
   "GEO-40"
  ]
 },
 {
  "id": "GEO-43",
  "branch": "GEO",
  "name": "Háromszög területe két oldalból és a közbezárt szögből",
  "description": "A `T = (a·b·sin γ)/2` képlet levezetése és alkalmazása; négyszögek és szabályos sokszögek területe szögfüggvényekkel.",
  "gateway": false,
  "prerequisites": [
   "GEO-41",
   "GEO-18"
  ]
 },
 {
  "id": "GEO-44",
  "branch": "GEO",
  "name": "Szinusztétel",
  "description": "`a / sin α = b / sin β = c / sin γ = 2R`; a tétel bizonyítása; alkalmazása háromszög hiányzó adatainak meghatározására.",
  "gateway": false,
  "prerequisites": [
   "GEO-43"
  ]
 },
 {
  "id": "GEO-45",
  "branch": "GEO",
  "name": "Koszinusztétel",
  "description": "`c² = a² + b² − 2ab·cos γ` mint a Pitagorasz-tétel általánosítása; alkalmazása, ha két oldal és a közbezárt szög, vagy mindhárom oldal ismert.",
  "gateway": false,
  "prerequisites": [
   "GEO-43",
   "GEO-36"
  ]
 },
 {
  "id": "GEO-46",
  "branch": "GEO",
  "name": "Kocka és téglatest; lap, él, csúcs, lapátló, testátló",
  "description": "A testek elemeinek megnevezése és megszámlálása; a határoló lapok egymáshoz viszonyított helyzete.",
  "gateway": true,
  "prerequisites": [
   "GEO-01"
  ]
 },
 {
  "id": "GEO-47",
  "branch": "GEO",
  "name": "Nézetek, alaprajz, háló, testépítés",
  "description": "Test és síkbeli ábrázolása közti oda-vissza fordítás; háló készítése és hálóból való építés. A térszemlélet alapgyakorlata.",
  "gateway": false,
  "prerequisites": [
   "GEO-46"
  ]
 },
 {
  "id": "GEO-48",
  "branch": "GEO",
  "name": "Hasáb és gúla",
  "description": "Alaplap, oldallap, alapél, oldalél, testmagasság; egyenes és ferde hasáb; szabályos gúla, tetraéder.",
  "gateway": false,
  "prerequisites": [
   "GEO-46",
   "GEO-06"
  ]
 },
 {
  "id": "GEO-49",
  "branch": "GEO",
  "name": "A gömb",
  "description": "A gömb mint adott ponttól egyenlő távolságra lévő pontok halmaza; síkmetszetei; a gömb mint a Föld modellje (hosszúsági és szélességi körök).",
  "gateway": false,
  "prerequisites": [
   "GEO-46",
   "GEO-14"
  ]
 },
 {
  "id": "GEO-50",
  "branch": "GEO",
  "name": "Téglatest és kocka felszíne, térfogata",
  "description": "A felszín mint a háló területe; a térfogat mint egységkockákkal való kitöltés; az `a·b·c` képlet megalapozása.",
  "gateway": false,
  "prerequisites": [
   "GEO-46",
   "GEO-16"
  ]
 },
 {
  "id": "GEO-51",
  "branch": "GEO",
  "name": "Egyenes hasáb felszíne és térfogata",
  "description": "`A = 2T_alap + P_alap · m` és `V = T_alap · m`; a képleteket megalapozó összefüggések megértése.",
  "gateway": false,
  "prerequisites": [
   "GEO-50",
   "GEO-48",
   "GEO-19"
  ]
 },
 {
  "id": "GEO-52",
  "branch": "GEO",
  "name": "Térelemek kölcsönös helyzete, távolsága, hajlásszöge",
  "description": "Egyenesek és síkok illeszkedése, párhuzamossága, kitérő helyzete; pont–sík és egyenes–sík távolság; lapszög.",
  "gateway": false,
  "prerequisites": [
   "GEO-03",
   "GEO-05",
   "GEO-48"
  ]
 },
 {
  "id": "GEO-53",
  "branch": "GEO",
  "name": "Forgástestek és csonkatestek",
  "description": "Henger, kúp, csonkagúla, csonkakúp; alkotó, palást, forgástengely; síkidomok forgatásával keletkező testek.",
  "gateway": false,
  "prerequisites": [
   "GEO-48",
   "GEO-49"
  ]
 },
 {
  "id": "GEO-54",
  "branch": "GEO",
  "name": "Speciális testek felszíne és térfogata",
  "description": "Hasáb, henger, gúla, kúp, gömb, csonkagúla, csonkakúp felszíne és térfogata; összetett testek és a mindennapi élet tárgyainak számításai.",
  "gateway": true,
  "prerequisites": [
   "GEO-53",
   "GEO-51",
   "GEO-22",
   "GEO-40"
  ]
 },
 {
  "id": "GEO-55",
  "branch": "GEO",
  "name": "Hasonló testek felszínének és térfogatának aránya",
  "description": "A felszín aránya `λ²`, a térfogaté `λ³`; alkalmazás modellek és makettek méretezésénél.",
  "gateway": false,
  "prerequisites": [
   "GEO-54",
   "GEO-34"
  ]
 },
 {
  "id": "GEO-56",
  "branch": "GEO",
  "name": "Pont és vektor koordinátái",
  "description": "Pont és helyvektor megadása számpárral; annak felismerése, hogy ettől kezdve a geometriai állítások algebrai számolássá alakíthatók.",
  "gateway": true,
  "prerequisites": [
   "GEO-28",
   "FUG-03"
  ]
 },
 {
  "id": "GEO-57",
  "branch": "GEO",
  "name": "Két pont távolsága, szakaszfelező pont",
  "description": "A távolságképlet levezetése a Pitagorasz-tételből; a felezőpont koordinátái a végpontokból.",
  "gateway": false,
  "prerequisites": [
   "GEO-56",
   "GEO-36"
  ]
 },
 {
  "id": "GEO-58",
  "branch": "GEO",
  "name": "Vektorműveletek koordinátákkal",
  "description": "Összeg, különbség és számszoros koordinátái; a vektor abszolút értéke; alkalmazás geometriai feladatokban.",
  "gateway": false,
  "prerequisites": [
   "GEO-56"
  ]
 },
 {
  "id": "GEO-59",
  "branch": "GEO",
  "name": "Az egyenes egyenlete, meredekség",
  "description": "Az `y = mx + b` és az `x = c` alak; a meredekség geometriai jelentése; egyenesek merőlegességének és párhuzamosságának feltétele a meredekségekkel.",
  "gateway": false,
  "prerequisites": [
   "GEO-58",
   "FUG-10"
  ]
 },
 {
  "id": "GEO-60",
  "branch": "GEO",
  "name": "Egyenesek kölcsönös helyzete, metszéspontja",
  "description": "A metszéspont meghatározása egyenletrendszer megoldásával; a megoldások száma és a geometriai helyzet kapcsolata.",
  "gateway": false,
  "prerequisites": [
   "GEO-59",
   "ALG-19"
  ]
 },
 {
  "id": "GEO-61",
  "branch": "GEO",
  "name": "A kör egyenlete",
  "description": "`(x − u)² + (y − v)² = r²` felírása és értelmezése; a középpont és a sugár kiolvasása teljes négyzetté alakítással.",
  "gateway": false,
  "prerequisites": [
   "GEO-57",
   "ALG-20"
  ]
 },
 {
  "id": "ESE-01",
  "branch": "ESE",
  "name": "Rendszerezett összeszámlálás: táblázat, ágrajz",
  "description": "Az összes eset áttekintése rendszerezési sémákkal; annak biztosítása, hogy semmi ne maradjon ki és semmit ne számoljunk kétszer.",
  "gateway": true,
  "prerequisites": [
   "LOG-01"
  ]
 },
 {
  "id": "ESE-02",
  "branch": "ESE",
  "name": "Sorbarendezési feladatok",
  "description": "Kis elemszámú halmaz elemeinek sorba rendezése, egyenes mentén és kör mentén is; azonos elemeket tartalmazó esetek.",
  "gateway": false,
  "prerequisites": [
   "ESE-01"
  ]
 },
 {
  "id": "ESE-03",
  "branch": "ESE",
  "name": "Kiválasztási feladatok",
  "description": "Adott elemszámú részhalmaz kiválasztása a sorrend figyelembevételével és anélkül; a két eset megkülönböztetése.",
  "gateway": false,
  "prerequisites": [
   "ESE-02"
  ]
 },
 {
  "id": "ESE-04",
  "branch": "ESE",
  "name": "Szorzási elv, esetszétválasztás",
  "description": "Független döntéssorozat lehetőségeinek összeszorzása; kizáró esetek lehetőségeinek összeadása. A kombinatorika két alapelve.",
  "gateway": true,
  "prerequisites": [
   "ESE-03"
  ]
 },
 {
  "id": "ESE-05",
  "branch": "ESE",
  "name": "Faktoriális, permutációk",
  "description": "Az `n!` jelentése és kiszámítása; `n` különböző elem sorrendjeinek száma; ismétléses permutáció egyszerű esetekben.",
  "gateway": false,
  "prerequisites": [
   "ESE-04"
  ]
 },
 {
  "id": "ESE-06",
  "branch": "ESE",
  "name": "Binomiális együttható, kombinációk",
  "description": "Az `n alatt a k` fogalma és értékének kiszámítása; `k` elem kiválasztása `n` elemből sorrend nélkül.",
  "gateway": false,
  "prerequisites": [
   "ESE-05"
  ]
 },
 {
  "id": "ESE-07",
  "branch": "ESE",
  "name": "Pascal-háromszög",
  "description": "A háromszög felépítése és tulajdonságai; kapcsolata a binomiális együtthatókkal és a kéttagú összeg hatványaival.",
  "gateway": false,
  "prerequisites": [
   "ESE-06"
  ]
 },
 {
  "id": "ESE-08",
  "branch": "ESE",
  "name": "Mintavétel visszatevéssel és visszatevés nélkül",
  "description": "A két mintavételi eljárás megkülönböztetése; annak felismerése, melyik feladatszöveg melyiket írja le.",
  "gateway": false,
  "prerequisites": [
   "ESE-06"
  ]
 },
 {
  "id": "ESE-09",
  "branch": "ESE",
  "name": "Gráf: csúcs, él",
  "description": "A gráf mint kapcsolatok ábrázolása; csúcsok és élek; egyszerű gráf, teljes gráf.",
  "gateway": false,
  "prerequisites": [
   "ESE-01"
  ]
 },
 {
  "id": "ESE-10",
  "branch": "ESE",
  "name": "Gráfok mint modellek",
  "description": "Kézfogások, körmérkőzések, ismeretségek, családfák, útvonalak szemléltetése és feladatok megoldása gráffal; esetszétválasztás áttekintése fagráffal.",
  "gateway": false,
  "prerequisites": [
   "ESE-09"
  ]
 },
 {
  "id": "ESE-11",
  "branch": "ESE",
  "name": "Fokszám, fokszámösszeg-tétel",
  "description": "Egy csúcs fokszáma; annak felismerése és alkalmazása, hogy a fokszámok összege az élek számának kétszerese.",
  "gateway": false,
  "prerequisites": [
   "ESE-10"
  ]
 },
 {
  "id": "ESE-12",
  "branch": "ESE",
  "name": "Adat, adatgyűjtés, táblázatba rendezés",
  "description": "Adatok gyűjtése hagyományos és digitális forrásból; rendszerezés táblázatba; az adatsokaság fogalma.",
  "gateway": true,
  "prerequisites": []
 },
 {
  "id": "ESE-13",
  "branch": "ESE",
  "name": "Diagramtípusok",
  "description": "Oszlop-, kör-, vonal- és pontdiagram készítése és olvasása; a megfelelő ábrázolási mód kiválasztása az adatok és a kérdés jellege alapján.",
  "gateway": false,
  "prerequisites": [
   "ESE-12"
  ]
 },
 {
  "id": "ESE-14",
  "branch": "ESE",
  "name": "Diagramok olvasása, megfeleltetése, következtetések",
  "description": "Adatok kigyűjtése táblázatból és diagramról adott szempont szerint; különböző típusú diagramok megfeleltetése egymásnak; következtetések megfogalmazása.",
  "gateway": false,
  "prerequisites": [
   "ESE-13"
  ]
 },
 {
  "id": "ESE-15",
  "branch": "ESE",
  "name": "Átlag",
  "description": "A számtani közép kiszámítása és értelmezése; annak felismerése, mikor félrevezető.",
  "gateway": false,
  "prerequisites": [
   "ESE-12"
  ]
 },
 {
  "id": "ESE-16",
  "branch": "ESE",
  "name": "Módusz és medián",
  "description": "A leggyakoribb és a középső adat meghatározása; a három középérték összehasonlítása ugyanazon adatsoron; melyik mit mond el.",
  "gateway": false,
  "prerequisites": [
   "ESE-15"
  ]
 },
 {
  "id": "ESE-17",
  "branch": "ESE",
  "name": "Grafikus manipulációk felismerése",
  "description": "Csonkolt tengely, torzított lépték, félrevezető területarányok felismerése és a diagram javítása. Adatműveltségi alapkészség.",
  "gateway": false,
  "prerequisites": [
   "ESE-14"
  ]
 },
 {
  "id": "ESE-18",
  "branch": "ESE",
  "name": "Tudatos adatgyűjtés, reprezentatív minta",
  "description": "Az adatgyűjtés megtervezése adott cél érdekében; a reprezentativitás szemléletes fogalma; példák reprezentatív és nem reprezentatív mintára.",
  "gateway": false,
  "prerequisites": [
   "ESE-14"
  ]
 },
 {
  "id": "ESE-19",
  "branch": "ESE",
  "name": "Terjedelem, kvartilisek, szórás",
  "description": "Szóródási mutatók: minimum, maximum, terjedelem, alsó és felső kvartilis, szórás; a kiugró adat kezelése.",
  "gateway": false,
  "prerequisites": [
   "ESE-16"
  ]
 },
 {
  "id": "ESE-20",
  "branch": "ESE",
  "name": "Sodrófa (box-plot) diagram",
  "description": "A doboz-ábra elkészítése és olvasása; adathalmazok gyors összehasonlítása több box-plot egymás mellé helyezésével.",
  "gateway": false,
  "prerequisites": [
   "ESE-19"
  ]
 },
 {
  "id": "ESE-21",
  "branch": "ESE",
  "name": "Valószínűségi kísérlet; biztos, lehetséges, lehetetlen esemény",
  "description": "Kísérletek végzése dobókockával, pénzérmével, golyókkal; a három eseménytípus megkülönböztetése; intuitív esélylatolgatás.",
  "gateway": false,
  "prerequisites": [
   "ESE-12"
  ]
 },
 {
  "id": "ESE-22",
  "branch": "ESE",
  "name": "Gyakoriság és relatív gyakoriság",
  "description": "Egy esemény bekövetkezéseinek száma és aránya; annak megfigyelése, hogy a relatív gyakoriság nagy elemszámnál stabilizálódik.",
  "gateway": true,
  "prerequisites": [
   "ESE-21",
   "ESE-15"
  ]
 },
 {
  "id": "ESE-23",
  "branch": "ESE",
  "name": "Esemény, eseménytér, elemi esemény",
  "description": "Az összes lehetséges kimenetel halmaza; az esemény mint az eseménytér részhalmaza; összetett események leírása halmazműveletekkel.",
  "gateway": false,
  "prerequisites": [
   "ESE-22",
   "LOG-06"
  ]
 },
 {
  "id": "ESE-24",
  "branch": "ESE",
  "name": "A valószínűség fogalma",
  "description": "A valószínűség bevezetése statisztikai alapon: az az érték, amely köré a relatív gyakoriság stabilizálódik. A valószínűség tulajdonságai.",
  "gateway": true,
  "prerequisites": [
   "ESE-22"
  ]
 },
 {
  "id": "ESE-25",
  "branch": "ESE",
  "name": "Klasszikus valószínűségi modell, Laplace-képlet",
  "description": "Egyenlő esélyű elemi események esetén `P = kedvező / összes`; a modell alkalmazhatóságának feltétele; a számláló és a nevező összeszámlálása kombinatorikával.",
  "gateway": true,
  "prerequisites": [
   "ESE-24",
   "ESE-04"
  ]
 },
 {
  "id": "ESE-26",
  "branch": "ESE",
  "name": "Egymást kizáró és független események",
  "description": "A két fogalom megkülönböztetése (és annak felismerése, hogy nem ugyanaz); az összeg- és a szorzatszabály egyszerű alkalmazása.",
  "gateway": false,
  "prerequisites": [
   "ESE-23",
   "ESE-25"
  ]
 },
 {
  "id": "ESE-27",
  "branch": "ESE",
  "name": "Valószínűség mintavételnél",
  "description": "Valószínűség meghatározása visszatevéses és visszatevés nélküli mintavétel esetén; a két eset eltérő összeszámlálása.",
  "gateway": false,
  "prerequisites": [
   "ESE-25",
   "ESE-08"
  ]
 },
 {
  "id": "ESE-28",
  "branch": "ESE",
  "name": "Geometriai valószínűség",
  "description": "Valószínűség hossz-, terület- vagy térfogatarányként, ha a kimenetelek nem megszámlálhatóak.",
  "gateway": false,
  "prerequisites": [
   "ESE-25",
   "GEO-20"
  ]
 },
 {
  "id": "ESE-29",
  "branch": "ESE",
  "name": "Diszkrét valószínűség-eloszlás",
  "description": "A lehetséges értékek és a hozzájuk tartozó valószínűségek táblázata; ábrázolás oszlopdiagrammal; annak ellenőrzése, hogy a valószínűségek összege 1.",
  "gateway": false,
  "prerequisites": [
   "ESE-24",
   "ESE-13"
  ]
 }
];
